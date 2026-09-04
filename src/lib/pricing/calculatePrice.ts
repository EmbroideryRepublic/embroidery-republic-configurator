import type { ConfigElement, PricingRule, PrintView } from '@/types';
import { evaluateRules, isRuleApplicable, type PricingIssue } from './ruleEngine';

/**
 * Zentrale Preisberechnung des Konfigurators.
 *
 * WICHTIG: Diese Funktion ist die EINZIGE Stelle, an der der Preis berechnet wird.
 * UI-Komponenten dürfen niemals eigenständig Preise berechnen – sie rufen
 * ausschließlich diese Funktion auf.
 *
 * MENGENRABATT – mehrere getrennte Staffeln statt einer einzelnen:
 * - QUANTITY_TIERS.baseDiscountPercent: leichter Rabatt auf Grundpreis +
 *   Grundgebühren, für ALLE Veredelungsarten.
 * - QUANTITY_TIERS.veredelungDiscountPercent: steiler Rabatt auf Fläche/
 *   Stichzahl-Kosten – gilt seit 2026-08-09 NUR NOCH für Stickerei
 *   (stichzahlbasiert).
 * - DTF_POSITION_TIERS: eigene, FESTE (nicht prozentual rabattierte)
 *   Preisstaffel je Position für DTF-Transferdruck (siehe dortiger
 *   Kommentar) – ersetzt seit 2026-08-09 die vorherige prozentuale
 *   Veredelungsrabattierung für DTF vollständig.
 */

export interface PriceCalculationInput {
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
}

export interface PriceCalculationResult {
  unitPrice: number;
  totalPrice: number;
  /**
   * TRUE = mindestens ein Preisbaustein konnte nicht verarbeitet werden.
   *
   * Der Preis ist dann NICHT verwendbar: Er darf weder angezeigt noch in ein
   * Angebot oder eine Rechnung übernommen werden. In Entwicklung und Tests
   * kommt es gar nicht so weit – dort wirft die Engine sofort (fail fast).
   * In Produktion ist das die letzte Sicherung gegen einen still falschen
   * Preis.
   */
  hasErrors: boolean;
  /** Details zu nicht verarbeitbaren Bausteinen (leer im Normalfall). */
  issues: PricingIssue[];
  breakdown: {
    basePrice: number;
    elementsPrice: number;
    perElement: { elementId: string; price: number }[];
    elementBaseFeeTotal: number;
    positionFeeTotal: number;
    /** Je Ansicht: die rabattierten Flächen-/Stichzahl-Kosten dieser Ansicht
     *  PLUS (bei aktiver Positionsstaffel) ihr Positionsanteil – siehe
     *  isPositionBased. Bei DTF ist nur der Positionsanteil ungleich 0, bei
     *  Stickerei (seit 2026-09-03) sind es beide Anteile zusammen. */
    areaPriceByView: Record<PrintView, number>;
    areaPricePerCm2: number;
    pricePer1000Stitches: number;
    isStitchBased: boolean;
    /** True, wenn first_position/additional_position aktiv sind (DTF und
     *  Stickerei) – areaPriceByView enthält dann je Ansicht den
     *  Positionsanteil. Die Anzeige nutzt firstPositionPrice/
     *  additionalPositionPrice/furtherPositionPrice und, wenn zugleich
     *  isStitchBased gilt, zusätzlich pricePer1000Stitches. */
    isPositionBased: boolean;
    /** Preis für die erste bedruckte Ansicht (nur informativ für die
     *  Anzeige, z.B. im Tooltip „9 € für die erste Position"). */
    firstPositionPrice: number;
    /** Preis für die zweite bedruckte Ansicht (nur informativ). */
    additionalPositionPrice: number;
    /** Preis für jede weitere Ansicht ab der dritten (nur informativ). */
    furtherPositionPrice: number;
    totalEstimatedStitches: number;
    /** Rabatt auf Grundpreis/Grundgebühren (leicht). */
    baseDiscountPercent: number;
    /** Rabatt auf Fläche/Stichzahl-Kosten (steil, wie am Markt üblich).
     *  Betrifft seit 2026-08-09 NUR NOCH Stickerei – DTF-Positionen nutzen
     *  die feste Staffel DTF_POSITION_TIERS und werden von diesem Wert
     *  nicht mehr rabattiert. */
    veredelungDiscountPercent: number;
    savingsAmount: number;
    nextTier: QuantityTier | null;
    /** Einmalige Rüstkosten des gesamten Auftrags (nicht je Stück). */
    setupTotal: number;
    /** Auf die Stückzahl verteilte Rüstkosten – im unitPrice enthalten. */
    setupPerUnit: number;
    /** Zuschläge je Stück (Premiumgarn, Spezialfolie …). */
    surchargePerUnit: number;
    /** Nachlässe je Stück als POSITIVER Betrag (Rabatt, Gutschein). */
    discountPerUnit: number;
  };
}

export interface QuantityTier {
  minQuantity: number;
  /** Rabatt auf Grundpreis/Grundgebühren bei dieser Stückzahl. */
  baseDiscountPercent: number;
  /**
   * Rabatt auf Fläche/Stichzahl-Kosten bei dieser Stückzahl – gilt seit
   * 2026-08-09 NUR NOCH für stichzahlbasierte Stickerei-Veredelung. Die
   * DTF-Positionsstaffel (siehe DTF_POSITION_TIERS weiter unten) hat eigene,
   * feste Preise je Stückzahlbereich und wird von diesem Feld nicht mehr
   * beeinflusst.
   */
  veredelungDiscountPercent: number;
}

/**
 * Grundpreis-Rabatt (alle Veredelungsarten) und Stickerei-Veredelungsrabatt
 * je Stückzahl. Kalibriert auf Vorgaben des Betreibers vom 2026-08-08
 * (Zielpreise 379 €/1.049 €/8.300 € für das 11,99-€-T-Shirt mit DTF – die
 * damalige Rechnung bezog dabei auch die DTF-Positionspreise mit ein, die
 * seither durch DTF_POSITION_TIERS ersetzt wurden; baseDiscountPercent
 * blieb unverändert, weil dieser Wert weiterhin für alle Veredelungsarten
 * gilt). Grundprinzip: der Grundpreis wird nur LEICHT rabattiert
 * (Großeinkauf bringt beim Blanko-Artikel wenig), Stickerei-Veredelung
 * deutlich steiler (Digitalisieren/Einrichten amortisiert sich schnell).
 */
export const QUANTITY_TIERS: QuantityTier[] = [
  { minQuantity: 1, baseDiscountPercent: 0, veredelungDiscountPercent: 0 },
  { minQuantity: 5, baseDiscountPercent: 1, veredelungDiscountPercent: 20 },
  { minQuantity: 10, baseDiscountPercent: 3, veredelungDiscountPercent: 35 },
  { minQuantity: 20, baseDiscountPercent: 5, veredelungDiscountPercent: 46 },
  { minQuantity: 25, baseDiscountPercent: 6, veredelungDiscountPercent: 48 },
  { minQuantity: 50, baseDiscountPercent: 8, veredelungDiscountPercent: 52 },
  { minQuantity: 100, baseDiscountPercent: 20, veredelungDiscountPercent: 90 },
  { minQuantity: 250, baseDiscountPercent: 23, veredelungDiscountPercent: 90 },
  { minQuantity: 500, baseDiscountPercent: 26, veredelungDiscountPercent: 90 },
  { minQuantity: 1000, baseDiscountPercent: 36, veredelungDiscountPercent: 93 },
];

function getTierForQuantity(quantity: number): QuantityTier {
  let current: QuantityTier = { minQuantity: 0, baseDiscountPercent: 0, veredelungDiscountPercent: 0 };
  for (const tier of QUANTITY_TIERS) {
    if (quantity >= tier.minQuantity) current = tier;
  }
  return current;
}

function getNextTier(quantity: number): QuantityTier | null {
  return QUANTITY_TIERS.find((tier) => tier.minQuantity > quantity) ?? null;
}

/**
 * Kleinste bestellbare Menge. **Bewusst 1.**
 *
 * Vorher stand hier 5 – und `calculatePrice` rechnete mit
 * `Math.max(quantity, 5)`. Wer ein Einzelstück bestellte, zahlte damit
 * stillschweigend fünf. Privatkunden, Creator und kleine Vereine waren so
 * faktisch ausgeschlossen.
 *
 * Die Wirtschaftlichkeit kleiner Mengen wird nicht über eine Mindestmenge
 * gelöst, sondern über EINMALIGE Kosten (Regeltyp `setup_fee`): Sie fallen
 * EINMAL pro Auftrag an und verteilen sich auf die Stückzahl. Dadurch trägt
 * ein Einzelstück die Einrichtung allein, während der Stückpreis mit
 * steigender Menge von selbst sinkt – ohne jemanden auszuschließen.
 */
export const MINIMUM_QUANTITY = 1;

// Nutzt dieselbe Anwendbarkeitsprüfung wie evaluateRules() (Mengenfenster,
// Gültigkeitszeitraum) – sonst weicht dieser Pfad von der Regel-Engine ab
// und liefert bei Staffel-/Zeitfenster-Regeln einen falschen Preis.
//
// SUMMIERT alle passenden Regeln (wie evaluateRules()), statt nur die erste
// zu nehmen: Sind z.B. zwei per_position-Regeln für dieselbe Ansicht aktiv,
// gelten beide gemeinsam – sonst würde ein Teil des Preises still verschwinden.
function getPositionPrice(view: PrintView, rules: PricingRule[], quantity: number): number {
  return rules
    .filter((r) => r.ruleType === 'per_position' && r.printView === view && isRuleApplicable(r, quantity))
    .reduce((sum, r) => sum + r.price, 0);
}

function getElementTypeBasePrice(
  type: 'logo' | 'text',
  view: PrintView,
  rules: PricingRule[],
  quantity: number
): number {
  const ruleType = type === 'logo' ? 'per_logo' : 'per_text';
  return rules
    .filter(
      (r) => r.ruleType === ruleType && isRuleApplicable(r, quantity) && (!r.printView || r.printView === view)
    )
    .reduce((sum, r) => sum + r.price, 0);
}

export interface DtfPositionTier {
  minQuantity: number;
  /** Preis für die erste bedruckte Ansicht. */
  erste: number;
  /** Preis für die zweite bedruckte Ansicht (zusätzlich zur ersten). */
  zweite: number;
  /** Preis für jede weitere Ansicht ab der dritten. */
  abDritte: number;
}

/**
 * Feste Preisstaffel für DTF-Positionen (Betreiber-Vorgabe 2026-08-09).
 *
 * ERSETZT die vorherige prozentuale Veredelungsrabattierung für DTF
 * VOLLSTÄNDIG: Die Beträge hier sind bereits der fertige Endpreis je
 * Position – es wird in calculatePrice() nichts mehr zusätzlich
 * rabattiert (siehe discountedVariable dort). QUANTITY_TIERS.
 * veredelungDiscountPercent betrifft ab jetzt ausschließlich die
 * stichzahlbasierte Stickerei-Veredelung, nicht mehr DTF.
 *
 * STUFENFUNKTION, kein Gleiten: Die erreichte Mengenschwelle bestimmt den
 * Veredelungspreis für die GESAMTE Bestellung. 10, 25 und 49 Stück kosten
 * also exakt denselben Preis je Position; erst ab 50 Stück springt die
 * komplette Bestellung in die nächste (günstigere) Stufe. Das gilt
 * ausdrücklich auch an den Stufengrenzen: bei 49 Stück wird nie mehr pro
 * Stück verlangt als bei 50 Stück.
 *
 * Jede weitere Position ab der dritten kostet in jeder Stufe genauso viel
 * wie die dritte selbst (abDritte) – „dritte" und „jede weitere" fallen
 * also zusammen, es gibt keine eigene vierte Preisklasse.
 */
export const DTF_POSITION_TIERS: DtfPositionTier[] = [
  { minQuantity: 1, erste: 9.0, zweite: 5.0, abDritte: 4.0 },
  { minQuantity: 3, erste: 8.0, zweite: 4.5, abDritte: 3.5 },
  { minQuantity: 10, erste: 7.5, zweite: 4.0, abDritte: 3.0 },
  { minQuantity: 50, erste: 6.0, zweite: 3.0, abDritte: 2.5 },
  { minQuantity: 100, erste: 5.5, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 250, erste: 5.0, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 500, erste: 4.5, zweite: 2.0, abDritte: 1.5 },
  { minQuantity: 1000, erste: 4.0, zweite: 2.0, abDritte: 1.5 },
];

function getDtfPositionTier(quantity: number): DtfPositionTier {
  let current: DtfPositionTier = DTF_POSITION_TIERS[0]!;
  for (const tier of DTF_POSITION_TIERS) {
    if (quantity >= tier.minQuantity) current = tier;
  }
  return current;
}

/**
 * Ob für diese Preisregeln/Menge überhaupt die Positionsstaffel gilt
 * (aktive first_position/additional_position-Regel vorhanden). Seit
 * 2026-09-03 sind diese Regeln für DTF UND Stickerei aktiv; bei Stickerei
 * kommt über getVariableCost()/per_1000_stitches zusätzlich der
 * Stichaufpreis hinzu (die Tabelle heißt aus Kompatibilitätsgründen
 * weiterhin DTF_POSITION_TIERS).
 *
 * Nutzt dieselbe Anwendbarkeitsprüfung wie die übrigen Getter (Mengenfenster,
 * Gültigkeitszeitraum) – nur um FESTZUSTELLEN, ob DTF-Preisregeln aktiv
 * sind, nicht um deren Rohpreis zu lesen (der kommt jetzt aus
 * DTF_POSITION_TIERS oben, nicht mehr aus der Regel selbst).
 */
function isDtfPositionPricingActive(rules: PricingRule[], quantity: number): boolean {
  return rules.some(
    (r) =>
      (r.ruleType === 'first_position' || r.ruleType === 'additional_position') && isRuleApplicable(r, quantity)
  );
}

/**
 * Die für die Preisberechnung "abrechenbare" Fläche eines Elements. Bei
 * TEXT wird nur der tatsächlich von Buchstaben bedeckte Anteil berechnet
 * (inkCoverageRatio). Bei LOGO wird die Box bereits beim Hochladen auf
 * den tatsächlichen Bildinhalt zugeschnitten, zusätzlich wird der
 * Füllgrad innerhalb dieser Box berücksichtigt (contentFillRatio).
 */
function getBillableAreaCm2(element: ConfigElement): number {
  const boxAreaCm2 = element.widthCm * element.heightCm;
  if (element.type === 'text') {
    return boxAreaCm2 * (element.inkCoverageRatio ?? 0.35);
  }
  return boxAreaCm2 * (element.contentFillRatio ?? 0.85);
}

/**
 * Variable Kosten eines Elements: entweder Fläche × €/cm² ODER
 * (Stiche / 1000) × €/1000-Stiche – je nachdem, welcher REGELTYP aktiv ist.
 * Sind mehrere Regeln DESSELBEN Typs gleichzeitig aktiv (z.B. zwei
 * per_cm2-Regeln), gelten sie gemeinsam und werden summiert – wie
 * evaluateRules() es für den Veredelungstopf tut. Nur der TYP
 * (Fläche vs. Stichzahl) bleibt exklusiv, nicht die einzelne Regel.
 *
 * Nutzt dieselbe Anwendbarkeitsprüfung wie getPositionPrice()/
 * getElementTypeBasePrice() (Mengenfenster, Gültigkeitszeitraum) – sonst
 * weicht dieser Pfad von der Regel-Engine ab und liefert bei Staffel-/
 * Zeitfenster-Regeln einen falschen Preis.
 */
function getVariableCost(element: ConfigElement, rules: PricingRule[], quantity: number): number {
  const stitchRules = rules.filter(
    (r) =>
      r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity) && (!r.printView || r.printView === element.view)
  );
  if (stitchRules.length > 0) {
    const stitches = element.estimatedStitches ?? 0;
    return stitchRules.reduce((sum, r) => sum + (stitches / 1000) * r.price, 0);
  }
  const areaRules = rules.filter(
    (r) => r.ruleType === 'per_cm2' && isRuleApplicable(r, quantity) && (!r.printView || r.printView === element.view)
  );
  if (areaRules.length > 0) {
    const areaCm2 = getBillableAreaCm2(element);
    return areaRules.reduce((sum, r) => sum + areaCm2 * r.price, 0);
  }
  return 0;
}

export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  const { basePrice, elements, pricingRules } = input;
  // Die TATSÄCHLICHE Menge wird berechnet – kein Hochsetzen auf eine
  // Mindestmenge mehr (siehe MINIMUM_QUANTITY). Nur gegen 0/negativ
  // abgesichert, damit unten nicht durch null geteilt wird.
  const quantity = Math.max(input.quantity, 1);
  const tier = getTierForQuantity(quantity);

  // Mengenrabatt auf den Veredelungsanteil (Fläche/Stichzahl) – je Regel
  // deckelbar (PricingRule.maxDiscountPercent): Der Stichaufpreis der
  // Stickerei darf auch bei großen Mengen nie unter die Fremdkosten des
  // Stickpartners fallen (siehe config/pricingRules.ts). Der Deckel gilt für
  // den GESAMTEN variablen Anteil, weil je Veredelungsart nur EIN variabler
  // Regeltyp aktiv ist (Fläche ODER Stichzahl, siehe getVariableCost).
  // Berücksichtigt werden nur Regeln, die tatsächlich in den Preis eingehen
  // (anwendbar UND – bei printView – auf einer genutzten Ansicht); der Wert
  // ist auf 0–100 begrenzt.
  const genutzteAnsichten = new Set(elements.map((el) => el.view));
  const rabattDeckel = pricingRules
    .filter(
      (r) =>
        r.maxDiscountPercent !== undefined &&
        (r.ruleType === 'per_1000_stitches' || r.ruleType === 'per_cm2') &&
        isRuleApplicable(r, quantity) &&
        (!r.printView || genutzteAnsichten.has(r.printView))
    )
    .reduce((min, r) => Math.min(min, Math.max(0, Math.min(100, r.maxDiscountPercent!))), Number.POSITIVE_INFINITY);
  const veredelungRabattProzent = Math.min(tier.veredelungDiscountPercent, rabattDeckel);

  // Positionsaufschlag nur, wenn TATSÄCHLICH mehrere unterschiedliche
  // Ansichten gleichzeitig bedruckt/bestickt werden (z.B. Vorderseite UND
  // Rücken). Nutzt der Kunde nur EINE Ansicht – egal welche, auch nur
  // Rücken oder nur ein Ärmel – entsteht kein zusätzlicher Rüstaufwand
  // gegenüber "nur eine Fläche", also auch kein Aufschlag.
  const distinctViewsOrdered = [...new Set(elements.map((el) => el.view))];
  const distinctViewCount = distinctViewsOrdered.length;
  const getEffectivePositionPrice = (view: PrintView) =>
    distinctViewCount > 1 ? getPositionPrice(view, pricingRules, quantity) : 0;

  // ── Regelauswertung über die Engine ─────────────────────────────────
  // Alle Beträge kommen aus den Preisregeln, ausgewertet von
  // lib/pricing/ruleEngine.ts. Ein neuer Regeltyp wird dort registriert und
  // wirkt hier automatisch – diese Funktion muss dafür nicht angefasst werden.
  const charges = evaluateRules(pricingRules, {
    elements,
    distinctViews: distinctViewsOrdered,
    quantity,
    billableAreaCm2: getBillableAreaCm2,
    chargePositionFees: distinctViewCount > 1,
  });

  const elementBaseFeeTotal = elements.reduce(
    (sum, el) => sum + getElementTypeBasePrice(el.type, el.view, pricingRules, quantity),
    0
  );
  const positionFeeTotal = elements.reduce((sum, el) => sum + getEffectivePositionPrice(el.view), 0);

  // Positionsgestaffelter Aufschlag (erste/zweite/weitere Ansicht) – fällt
  // je Stück GENAU EINMAL an, nicht je Element (siehe DTF_POSITION_TIERS
  // oben). Gilt für DTF und – seit 2026-09-03 – auch für Stickerei, die
  // darüber hinaus den Stichaufpreis aus getVariableCost() unten trägt. Ohne
  // aktive first_position/additional_position-Regeln bleiben alle drei
  // Preise 0, das Produkt bleibt dann unverändert.
  const dtfPositionPricingActive = isDtfPositionPricingActive(pricingRules, quantity);
  const dtfTier = dtfPositionPricingActive ? getDtfPositionTier(quantity) : null;
  const erstePositionPreis = dtfTier?.erste ?? 0;
  const zweitePositionPreis = dtfTier?.zweite ?? 0;
  const weiterePositionPreis = dtfTier?.abDritte ?? 0;
  const positionTierTotal =
    distinctViewCount === 0
      ? 0
      : distinctViewCount === 1
        ? erstePositionPreis
        : distinctViewCount === 2
          ? erstePositionPreis + zweitePositionPreis
          : erstePositionPreis + zweitePositionPreis + weiterePositionPreis * (distinctViewCount - 2);

  const variableCostTotal =
    elements.reduce((sum, el) => sum + getVariableCost(el, pricingRules, quantity), 0) + positionTierTotal;

  const perElement = elements.map((el) => ({
    elementId: el.id,
    price:
      getElementTypeBasePrice(el.type, el.view, pricingRules, quantity) +
      getEffectivePositionPrice(el.view) +
      getVariableCost(el, pricingRules, quantity),
  }));

  // Dynamisch je tatsächlich genutzter Ansicht akkumulieren (offene View-IDs).
  // Früher fix auf front/back/sleeve_left/sleeve_right initialisiert – dabei
  // ging der Flächenpreis jeder anderen Ansicht (Tasche, Schürze, Kapuze)
  // still verloren. Siehe Optimierungs-Register O3.
  const areaPriceByView: Record<string, number> = {};
  for (const el of elements) {
    areaPriceByView[el.view] =
      (areaPriceByView[el.view] ?? 0) +
      getVariableCost(el, pricingRules, quantity) * (1 - veredelungRabattProzent / 100);
  }
  // Positionsgestaffelter Aufschlag PRO ANSICHT für die Anzeige: die zuerst
  // bedruckte Ansicht (Reihenfolge der platzierten Elemente) bekommt
  // erstePositionPreis, die zweite zweitePositionPreis, jede weitere ab der
  // dritten weiterePositionPreis – eine reine Anzeige-Zuordnung, der
  // GESAMTPREIS (positionTierTotal oben) ist davon unabhängig immer korrekt.
  // Bei DTF ist nur der Positionsanteil ungleich 0; bei Stickerei (seit
  // 2026-09-03) kommen Positionsanteil UND rabattierter Stichaufpreis
  // derselben Ansicht zusammen. Die Positionsstaffel ist bereits der
  // fertige Endpreis (siehe DTF_POSITION_TIERS) – hier kommt KEIN
  // Rabattfaktor mehr drauf.
  distinctViewsOrdered.forEach((view, i) => {
    const anteil = i === 0 ? erstePositionPreis : i === 1 ? zweitePositionPreis : weiterePositionPreis;
    if (anteil === 0) return;
    areaPriceByView[view] = (areaPriceByView[view] ?? 0) + anteil;
  });

  // Grundpreis + Grundgebühren + Positionsaufschlag = "fester" Anteil,
  // leicht rabattiert. Fläche/Stichzahl (Stickerei) = "variabler" Anteil,
  // steil rabattiert (siehe Kommentar bei QUANTITY_TIERS). Die DTF-
  // Positionsstaffel steckt rechnerisch zwar mit im "variablen" Anteil
  // (variableCostTotal), ist aber selbst bereits der fertige Preis und wird
  // deshalb vor der Rabattierung wieder herausgerechnet.
  const fixedPortion = basePrice + elementBaseFeeTotal + positionFeeTotal;
  const discountedFixed = fixedPortion * (1 - tier.baseDiscountPercent / 100);
  const discountedVariable =
    (variableCostTotal - positionTierTotal) * (1 - veredelungRabattProzent / 100) + positionTierTotal;

  // EINMALIGE Kosten des Auftrags (z.B. Rüsten/Digitalisieren). Kommen
  // vollständig aus den Preisregeln – ohne konfigurierte Regel ist der Wert 0.
  const setupTotal = charges.orderOnce;

  // Zuschläge je Stück (Premiumgarn, Spezialfolie …) gehören in den festen
  // Anteil; einmalige Zuschläge (Express) stecken bereits in `orderOnce`.
  const surchargePerUnit = charges.perUnitFixed - elementBaseFeeTotal - positionFeeTotal;

  const unitPriceUndiscounted = fixedPortion + variableCostTotal + surchargePerUnit;
  let unitPriceDiscounted = discountedFixed + discountedVariable + surchargePerUnit;

  // Betrag vor Nachlässen merken, damit der Nachlass unten als eigener
  // Posten ausgewiesen werden kann.
  const vorNachlass = unitPriceDiscounted;

  // Nachlässe aus der Phase 'discount' (Vereins-/Geschäftskundenrabatt,
  // Aktionen, Gutscheine) – NACH den Zuschlägen, aber VOR der Menge.
  if (charges.discountPercent > 0) {
    unitPriceDiscounted *= 1 - Math.min(charges.discountPercent, 100) / 100;
  }
  if (charges.discountPerUnit > 0) {
    unitPriceDiscounted = Math.max(0, unitPriceDiscounted - charges.discountPerUnit);
  }

  // Nachlass als eigener, ausweisbarer Betrag – die Pipeline muss ihn als
  // eigenen Posten zeigen können, sonst stimmt die Aufschlüsselung nicht mit
  // dem berechneten Gesamtpreis überein.
  const nachlassJeStueck = vorNachlass - unitPriceDiscounted;

  const totalPrice = unitPriceDiscounted * quantity + setupTotal;
  const savingsAmount = (unitPriceUndiscounted - unitPriceDiscounted) * quantity;

  // Angezeigter Stückpreis INKLUSIVE anteiliger Rüstkosten – nur so sieht der
  // Kunde, dass sich eine größere Menge lohnt. Bei 1 Stück steckt die ganze
  // Einrichtung darin, bei 100 Stück ein Hundertstel.
  const effectiveUnitPrice = totalPrice / quantity;

  // Dieselbe Anwendbarkeitsprüfung wie in getVariableCost() – sonst meldete
  // die Anzeige einen Stich-/Flächenpreis, der (z.B. außerhalb eines
  // Mengenfensters) gar nicht berechnet wird.
  const stitchRule = pricingRules.find((r) => r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity));
  const areaRule = pricingRules.find((r) => r.ruleType === 'per_cm2' && isRuleApplicable(r, quantity));
  const totalEstimatedStitches = elements.reduce((sum, el) => sum + (el.estimatedStitches ?? 0), 0);
  // Auch die NÄCHSTE Staffel gedeckelt ausweisen – sonst verspräche die
  // Anzeige einen Rabatt, den der Deckel nie gewährt.
  const naechsteStaffel = getNextTier(quantity);
  const nextTier = naechsteStaffel
    ? { ...naechsteStaffel, veredelungDiscountPercent: Math.min(naechsteStaffel.veredelungDiscountPercent, rabattDeckel) }
    : null;

  return {
    unitPrice: roundToCents(effectiveUnitPrice),
    totalPrice: roundToCents(totalPrice),
    hasErrors: charges.issues.length > 0,
    issues: charges.issues,
    breakdown: {
      basePrice: roundToCents(basePrice * (1 - tier.baseDiscountPercent / 100)),
      elementsPrice: roundToCents(elementBaseFeeTotal + positionFeeTotal + variableCostTotal),
      perElement,
      elementBaseFeeTotal: roundToCents(elementBaseFeeTotal * (1 - tier.baseDiscountPercent / 100)),
      positionFeeTotal: roundToCents(positionFeeTotal * (1 - tier.baseDiscountPercent / 100)),
      areaPriceByView: Object.fromEntries(
        Object.entries(areaPriceByView).map(([view, betrag]) => [view, roundToCents(betrag)])
      ),
      areaPricePerCm2: areaRule?.price ?? 0,
      pricePer1000Stitches: stitchRule?.price ?? 0,
      isStitchBased: Boolean(stitchRule),
      isPositionBased: erstePositionPreis > 0 || zweitePositionPreis > 0,
      firstPositionPrice: erstePositionPreis,
      additionalPositionPrice: zweitePositionPreis,
      furtherPositionPrice: weiterePositionPreis,
      totalEstimatedStitches,
      baseDiscountPercent: tier.baseDiscountPercent,
      // Der TATSÄCHLICH angewandte Satz (ggf. gedeckelt) – nicht der rohe
      // Staffelwert, sonst zeigte die Oberfläche einen Rabatt, den es nicht gibt.
      veredelungDiscountPercent: veredelungRabattProzent,
      savingsAmount: roundToCents(savingsAmount),
      nextTier,
      setupTotal: roundToCents(setupTotal),
      setupPerUnit: roundToCents(setupTotal / quantity),
      surchargePerUnit: roundToCents(surchargePerUnit),
      discountPerUnit: roundToCents(nachlassJeStueck),
    },
  };
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
