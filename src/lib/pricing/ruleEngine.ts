import type { ConfigElement, PricingRule, PricingRuleType, PrintView } from '@/types';

/**
 * REGEL-ENGINE der Preisberechnung („Preisbausteine").
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────
 * Vorher kannte `calculatePrice` jeden Regeltyp einzeln: für jede neue Art
 * von Kosten musste die Rechenfunktion selbst geändert werden. Eine neue
 * Preisstrategie hätte also jedes Mal einen Eingriff in den Rechenkern
 * bedeutet – genau dort, wo Fehler am teuersten sind.
 *
 * Hier ist stattdessen je Bausteintyp EIN Handler hinterlegt, der drei Fragen
 * beantwortet:
 *   1. In welcher PHASE wirkt er (Zuschlag, Nachlass, …)?
 *   2. WIE OFT fällt der Betrag an (je Stück oder einmal je Auftrag)?
 *   3. IN WELCHEN RABATT-TOPF gehört er?
 *
 * `calculatePrice` iteriert nur noch über die Bausteine und fragt den Handler.
 * Ein neuer Baustein = ein Eintrag in `RULE_HANDLERS` + ein Wert in der
 * `PricingRuleType`-Union. Der Rechenkern bleibt unverändert.
 *
 * ── FAIL FAST bei unbekannten Bausteinen ──────────────────────────────
 * Ein unbekannter Typ wird NICHT still übersprungen. Ein nicht verarbeiteter
 * Preisbaustein ist ein Konfigurations- oder Programmierfehler und führt sonst
 * unbemerkt zu falschen Angeboten und Rechnungen – der teuerste Fehler, den
 * dieses System machen kann.
 *   - Entwicklung/Test: sofortiger `PricingConfigError`.
 *   - Produktion: protokolliert, und das Ergebnis wird über `issues` als
 *     FEHLERHAFT markiert. Der aufrufende Code darf einen solchen Preis nicht
 *     als gültig behandeln (siehe `PriceCalculationResult.hasErrors`).
 *
 * ── Bewusst NICHT hier ────────────────────────────────────────────────
 * Beträge. Die stehen ausschließlich in den Preisregeln (config/pricingRules
 * bzw. später Datenbank/Adminoberfläche) und sind Geschäftsentscheidung,
 * nicht Code.
 *
 * ── Ebenengrenze ──────────────────────────────────────────────────────
 * Diese Engine rechnet auf POSITIONSEBENE (ein Produkt, eine Konfiguration,
 * eine Stückzahl). Auftragsweite Bausteine – Versandkosten, Gutscheine,
 * Mindestwarenwert, Kundengruppenrabatte über den gesamten Warenkorb – gehören
 * auf die Warenkorbebene (`serverPricing.ts`) und nutzen dieselbe
 * Handler-Mechanik mit `PricingPhase` 'order'.
 */

/** Wirkungsphase eines Bausteins. Wird in dieser Reihenfolge angewandt. */
export type PricingPhase =
  /** Additive Kosten: Grundgebühren, Fläche, Stichzahl, Rüstkosten, Zuschläge. */
  | 'charge'
  /** Nachlässe auf die Summe der Phase 'charge'. */
  | 'discount'
  /** Auftragsweit (Versand, Gutschein) – Warenkorbebene, siehe oben. */
  | 'order';

export const PHASE_ORDER: PricingPhase[] = ['charge', 'discount', 'order'];

/** Bezugsgröße eines Betrags. */
export type ChargeScope =
  /** Fällt je Stück an und wird mit der Menge multipliziert. */
  | 'per_unit'
  /** Fällt EINMAL je Auftragsposition an, unabhängig von der Stückzahl. */
  | 'per_order';

/**
 * Rabatt-Topf. Die Mengenstaffel rabattiert Blankoware und Veredelung
 * unterschiedlich stark (siehe QUANTITY_TIERS) – jeder Betrag muss deshalb
 * einem Topf zugeordnet sein.
 */
export type DiscountBucket =
  /** Grundpreis/Grundgebühren – leicht rabattiert. */
  | 'fixed'
  /** Fläche/Stichzahl – steil rabattiert. */
  | 'veredelung'
  /** Gar nicht rabattiert (z.B. einmalige Rüstkosten: sie verteilen sich
   *  ohnehin schon auf die Stückzahl, ein zusätzlicher Mengenrabatt würde
   *  denselben Effekt doppelt zählen). */
  | 'none';

export interface RuleContext {
  elements: ConfigElement[];
  /** Ansichten, auf denen tatsächlich etwas liegt. */
  distinctViews: PrintView[];
  quantity: number;
  /** Abrechenbare Fläche eines Elements in cm² (Text/Logo unterschiedlich). */
  billableAreaCm2: (element: ConfigElement) => number;
  /** Gilt der Positionsaufschlag? (nur bei mehreren genutzten Ansichten) */
  chargePositionFees: boolean;

  // ── Optionaler Kontext für künftige Bausteine ──────────────────────
  // Bewusst optional: Bestehende Aufrufer müssen nichts ändern, neue
  // Bausteine (Kundengruppenrabatt, Express, Gutschein) finden hier ihre
  // Eingaben, ohne dass die Signatur erneut umgebaut werden muss.
  /** z.B. 'verein', 'geschaeftskunde', 'privat'. */
  customerGroup?: string;
  /** Eingelöster Gutscheincode. */
  voucherCode?: string;
  /** Expressproduktion gewünscht. */
  express?: boolean;
}

export interface RuleHandler {
  phase: PricingPhase;
  scope: ChargeScope;
  bucket: DiscountBucket;
  /**
   * Betrag der Regel im gegebenen Kontext.
   * Bei `per_unit` = Betrag JE STÜCK, bei `per_order` = Betrag EINMALIG.
   * Bei Phase 'discount' ist der Rückgabewert der PROZENTSATZ (0–100) bzw.
   * bei `discount_per_unit` der absolute Abzug je Stück.
   */
  amount: (rule: PricingRule, ctx: RuleContext) => number;
}

/** Fehler in der Preiskonfiguration – bewusst eine eigene Klasse. */
export class PricingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingConfigError';
  }
}

export interface PricingIssue {
  ruleId: string;
  ruleType: string;
  message: string;
}

/** Elemente, auf die eine Regel wirkt – `printView` grenzt optional ein. */
function matchingElements(rule: PricingRule, ctx: RuleContext): ConfigElement[] {
  if (!rule.printView) return ctx.elements;
  return ctx.elements.filter((el) => el.view === rule.printView);
}

/**
 * Wie oft eine EINMALIGE Regel anfällt. Ohne `multiplier` genau einmal.
 * Ohne Veredelung (keine Elemente) fällt sie gar nicht an – Blankoware
 * verursacht keine Rüstkosten.
 */
function occurrences(rule: PricingRule, ctx: RuleContext): number {
  const elemente = matchingElements(rule, ctx);
  if (elemente.length === 0) return 0;

  switch (rule.multiplier ?? 'once') {
    case 'per_element':
      return elemente.length;
    case 'per_position':
      return new Set(elemente.map((el) => el.view)).size;
    case 'once':
    default:
      return 1;
  }
}

/**
 * Handler je Bausteintyp. **Das ist die einzige Stelle, die beim Hinzufügen
 * eines neuen Bausteins angefasst werden muss.**
 *
 * Absichtlich ein vollständiges `Record` (kein `Partial`): TypeScript
 * erzwingt damit, dass zu jedem Wert der `PricingRuleType`-Union ein Handler
 * existiert. Wer einen Typ ergänzt und den Handler vergisst, bekommt einen
 * Übersetzungsfehler statt später einen falschen Preis.
 */
export const RULE_HANDLERS: Record<PricingRuleType, RuleHandler | null> = {
  per_logo: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'fixed',
    amount: (rule, ctx) => matchingElements(rule, ctx).filter((el) => el.type === 'logo').length * rule.price,
  },

  per_text: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'fixed',
    amount: (rule, ctx) => matchingElements(rule, ctx).filter((el) => el.type === 'text').length * rule.price,
  },

  per_position: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'fixed',
    // Aufschlag nur, wenn TATSÄCHLICH mehrere Ansichten genutzt werden – bei
    // nur einer Fläche entsteht kein zusätzlicher Rüstaufwand gegenüber
    // „eine Fläche", egal welche.
    amount: (rule, ctx) => (ctx.chargePositionFees ? matchingElements(rule, ctx).length * rule.price : 0),
  },

  /** Erste bedruckte/bestickte Ansicht, EGAL WELCHE – genau einmal je Stück,
   *  unabhängig von der Zahl der Motive darauf. Berechnung erfolgt NICHT
   *  über `matchingElements`/`printView` (das würde je nach `rule.printView`
   *  nur EINE bestimmte Ansicht zählen), sondern direkt über
   *  `ctx.distinctViews` – siehe lib/pricing/calculatePrice.ts,
   *  getPositionTierCost(), die eigene, spezialisierte Auswertung dieser
   *  beiden Regeltypen (dieselbe Architektur wie getPositionPrice() für
   *  `per_position`). Der Handler hier existiert nur, damit die Engine den
   *  Typ kennt (RULE_HANDLERS ist ein vollständiges Record) und ihn bei
   *  Validierung/Fehlererkennung nicht als „unbekannt" meldet.
   */
  first_position: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'veredelung',
    amount: (rule, ctx) => (ctx.distinctViews.length > 0 ? rule.price : 0),
  },

  /** Jede zusätzlich genutzte Ansicht über die erste hinaus – siehe
   *  first_position oben, dieselbe Begründung für den Handler hier. */
  additional_position: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'veredelung',
    amount: (rule, ctx) => Math.max(0, ctx.distinctViews.length - 1) * rule.price,
  },

  per_cm2: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'veredelung',
    amount: (rule, ctx) =>
      matchingElements(rule, ctx).reduce((sum, el) => sum + ctx.billableAreaCm2(el) * rule.price, 0),
  },

  per_1000_stitches: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'veredelung',
    amount: (rule, ctx) =>
      matchingElements(rule, ctx).reduce((sum, el) => sum + ((el.estimatedStitches ?? 0) / 1000) * rule.price, 0),
  },

  setup_fee: {
    phase: 'charge',
    scope: 'per_order',
    bucket: 'none',
    amount: (rule, ctx) => occurrences(rule, ctx) * rule.price,
  },

  /** Zuschlag je Stück – Premiumgarn, Spezialfolie, Sondermaterial. */
  surcharge_per_unit: {
    phase: 'charge',
    scope: 'per_unit',
    bucket: 'fixed',
    amount: (rule) => rule.price,
  },

  /** Einmaliger Zuschlag – z.B. Expressproduktion. */
  surcharge_per_order: {
    phase: 'charge',
    scope: 'per_order',
    bucket: 'none',
    amount: (rule) => rule.price,
  },

  /** Prozentualer Nachlass – Verein, Geschäftskunde, Aktion. */
  discount_percent: {
    phase: 'discount',
    scope: 'per_unit',
    bucket: 'none',
    amount: (rule) => rule.price,
  },

  /** Absoluter Nachlass je Stück – z.B. Gutschein. */
  discount_per_unit: {
    phase: 'discount',
    scope: 'per_unit',
    bucket: 'none',
    amount: (rule) => rule.price,
  },

  /** Bewusst ohne Handler: läuft über QUANTITY_TIERS in calculatePrice. */
  quantity_discount: null,
};

/**
 * Ist die Regel im aktuellen Kontext überhaupt anwendbar?
 *
 * Deckt Mengenfenster (Staffeln) und Gültigkeitszeitraum (befristete
 * Aktionen) ab – beides rein über die Regeldaten, ohne Codeänderung.
 */
export function isRuleApplicable(rule: PricingRule, quantity: number, now: Date = new Date()): boolean {
  if (!rule.isActive) return false;
  if (rule.price === 0) return false; // 0 € = wirkungslos, spart Rechenarbeit
  if (rule.minQuantity !== undefined && quantity < rule.minQuantity) return false;
  if (rule.maxQuantity !== undefined && quantity > rule.maxQuantity) return false;
  if (rule.validFrom && now < new Date(rule.validFrom)) return false;
  if (rule.validUntil && now > new Date(rule.validUntil)) return false;
  return true;
}

/**
 * Strenge Prüfung: In Entwicklung und Tests sollen Konfigurationsfehler sofort
 * auffallen. In Produktion darf ein Fehler den Shop nicht abstürzen lassen –
 * dort wird protokolliert und das Ergebnis als fehlerhaft markiert.
 */
function istStrikt(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export interface EvaluatedCharges {
  /** Je Stück, Topf „fixed". */
  perUnitFixed: number;
  /** Je Stück, Topf „veredelung". */
  perUnitVeredelung: number;
  /** Einmalig je Auftragsposition, nicht rabattiert. */
  orderOnce: number;
  /** Summe prozentualer Nachlässe (0–100), nach Phase 'discount'. */
  discountPercent: number;
  /** Summe absoluter Nachlässe je Stück. */
  discountPerUnit: number;
  /** Nicht verarbeitbare Bausteine. Nicht leer = Preis ist NICHT gültig. */
  issues: PricingIssue[];
}

/**
 * Wertet ALLE Bausteine aus und verdichtet sie zu Summen.
 *
 * Unbekannte Typen führen zum Abbruch (Entwicklung/Test) bzw. werden als
 * `issue` gemeldet (Produktion) – niemals stillschweigend ignoriert.
 */
export function evaluateRules(rules: PricingRule[], ctx: RuleContext, now?: Date): EvaluatedCharges {
  const summen: EvaluatedCharges = {
    perUnitFixed: 0,
    perUnitVeredelung: 0,
    orderOnce: 0,
    discountPercent: 0,
    discountPerUnit: 0,
    issues: [],
  };

  // Bausteine phasenweise anwenden. Neue Phasen lassen sich in PHASE_ORDER
  // ergänzen, ohne die Schleife zu ändern.
  for (const phase of PHASE_ORDER) {
    for (const rule of rules) {
      // `undefined` = Typ existiert nicht in der Registry → Fehler.
      // `null`      = bewusst ohne Handler (quantity_discount).
      const handler = RULE_HANDLERS[rule.ruleType];

      if (handler === undefined) {
        // Nur EINMAL melden (erste Phase), nicht je Phase erneut.
        if (phase !== PHASE_ORDER[0]) continue;
        const message =
          `Unbekannter Preisbaustein „${rule.ruleType}" (Regel „${rule.id}"). ` +
          `Es existiert kein Handler in RULE_HANDLERS – der Preis wäre unvollständig.`;
        if (istStrikt()) throw new PricingConfigError(message);
        console.error(`[Preisberechnung] ${message}`);
        summen.issues.push({ ruleId: rule.id, ruleType: String(rule.ruleType), message });
        continue;
      }

      if (handler === null) continue; // bewusst nicht über die Engine
      if (handler.phase !== phase) continue;
      if (!isRuleApplicable(rule, ctx.quantity, now)) continue;

      const betrag = handler.amount(rule, ctx);
      if (betrag === 0) continue;

      if (phase === 'discount') {
        if (rule.ruleType === 'discount_percent') summen.discountPercent += betrag;
        else summen.discountPerUnit += betrag;
        continue;
      }

      if (handler.scope === 'per_order') {
        summen.orderOnce += betrag;
        continue;
      }
      if (handler.bucket === 'veredelung') summen.perUnitVeredelung += betrag;
      else summen.perUnitFixed += betrag;
    }
  }

  return summen;
}
