import type { ConfigElement, PricingRule, PrintView } from '@/types';
import { evaluateRules, type PricingIssue } from './ruleEngine';

/**
 * Zentrale Preisberechnung des Konfigurators.
 *
 * WICHTIG: Diese Funktion ist die EINZIGE Stelle, an der der Preis berechnet wird.
 * UI-Komponenten dürfen niemals eigenständig Preise berechnen – sie rufen
 * ausschließlich diese Funktion auf.
 *
 * MENGENRABATT – zwei getrennte Staffeln statt einer einzelnen:
 * Nach einem Marktvergleich mit einem etablierten deutschen Anbieter
 * (echte Preise, siehe Kalkulations-Historie) hat sich gezeigt, dass ein
 * einzelner Rabattsatz auf ALLES (Shirt + Veredelung zusammen) unrealistisch
 * ist. Am Markt wird die VEREDELUNG bei höherer Stückzahl deutlich stärker
 * rabattiert (mehr Motive auf einmal einrichten/drucken = viel günstiger
 * pro Stück), während der Blanko-Artikel (Shirt/Hoodie etc.) nur leicht
 * günstiger wird (Großeinkauf bringt nur begrenzt Ersparnis). Deshalb:
 * - BASE_PRICE_DISCOUNT_TIERS: leichter Rabatt auf Grundpreis + Grundgebühren
 * - VEREDELUNG_DISCOUNT_TIERS: steiler Rabatt auf Fläche/Stichzahl-Kosten
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
    areaPriceByView: Record<PrintView, number>;
    areaPricePerCm2: number;
    pricePer1000Stitches: number;
    isStitchBased: boolean;
    totalEstimatedStitches: number;
    /** Rabatt auf Grundpreis/Grundgebühren (leicht). */
    baseDiscountPercent: number;
    /** Rabatt auf Fläche/Stichzahl-Kosten (steil, wie am Markt üblich). */
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
  /** Rabatt auf Fläche/Stichzahl-Kosten bei dieser Stückzahl. */
  veredelungDiscountPercent: number;
}

/**
 * Kalibriert an echten Marktpreisen (Stand: Kalkulations-Recherche).
 * Die Veredelung wird deutlich steiler rabattiert als der Grundpreis –
 * das entspricht der realen Kostenstruktur (mehr Motive gleichzeitig
 * einrichten/drucken spart viel, ein Blanko-Shirt kaum).
 */
/**
 * Kalibriert an echten, öffentlich einsehbaren Marktpreisen (Dropshirt
 * B2B: 10=-5%, 30=-10%, 50=-15%, 100=-25%, 250=-40%, 500=-50% auf den
 * Gesamtpreis). Da unser Modell die Veredelung deutlich steiler
 * rabattiert als den Grundpreis (siehe oben), ergibt sich daraus in der
 * Summe ein ähnlicher effektiver Rabatt wie am Markt, nur eben auf zwei
 * Anteile aufgeteilt statt als ein einzelner Prozentsatz.
 */
export const QUANTITY_TIERS: QuantityTier[] = [
  { minQuantity: 1, baseDiscountPercent: 0, veredelungDiscountPercent: 0 },
  { minQuantity: 5, baseDiscountPercent: 2, veredelungDiscountPercent: 5 },
  { minQuantity: 10, baseDiscountPercent: 3, veredelungDiscountPercent: 8 },
  { minQuantity: 25, baseDiscountPercent: 5, veredelungDiscountPercent: 14 },
  { minQuantity: 50, baseDiscountPercent: 6, veredelungDiscountPercent: 19 },
  { minQuantity: 100, baseDiscountPercent: 8, veredelungDiscountPercent: 25 },
  { minQuantity: 250, baseDiscountPercent: 11, veredelungDiscountPercent: 35 },
  { minQuantity: 500, baseDiscountPercent: 15, veredelungDiscountPercent: 45 },
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

function getPositionPrice(view: PrintView, rules: PricingRule[]): number {
  const rule = rules.find((r) => r.isActive && r.ruleType === 'per_position' && r.printView === view);
  return rule?.price ?? 0;
}

function getElementTypeBasePrice(type: 'logo' | 'text', rules: PricingRule[]): number {
  const ruleType = type === 'logo' ? 'per_logo' : 'per_text';
  const rule = rules.find((r) => r.isActive && r.ruleType === ruleType);
  return rule?.price ?? 0;
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
 * (Stiche / 1000) × €/1000-Stiche – je nachdem, welche Regel aktiv ist.
 */
function getVariableCost(element: ConfigElement, rules: PricingRule[]): number {
  const stitchRule = rules.find((r) => r.isActive && r.ruleType === 'per_1000_stitches');
  if (stitchRule) {
    const stitches = element.estimatedStitches ?? 0;
    return (stitches / 1000) * stitchRule.price;
  }
  const areaRule = rules.find((r) => r.isActive && r.ruleType === 'per_cm2');
  if (areaRule) {
    return getBillableAreaCm2(element) * areaRule.price;
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

  // Positionsaufschlag nur, wenn TATSÄCHLICH mehrere unterschiedliche
  // Ansichten gleichzeitig bedruckt/bestickt werden (z.B. Vorderseite UND
  // Rücken). Nutzt der Kunde nur EINE Ansicht – egal welche, auch nur
  // Rücken oder nur ein Ärmel – entsteht kein zusätzlicher Rüstaufwand
  // gegenüber "nur eine Fläche", also auch kein Aufschlag.
  const distinctViewCount = new Set(elements.map((el) => el.view)).size;
  const getEffectivePositionPrice = (view: PrintView) =>
    distinctViewCount > 1 ? getPositionPrice(view, pricingRules) : 0;

  // ── Regelauswertung über die Engine ─────────────────────────────────
  // Alle Beträge kommen aus den Preisregeln, ausgewertet von
  // lib/pricing/ruleEngine.ts. Ein neuer Regeltyp wird dort registriert und
  // wirkt hier automatisch – diese Funktion muss dafür nicht angefasst werden.
  const charges = evaluateRules(pricingRules, {
    elements,
    distinctViews: [...new Set(elements.map((el) => el.view))],
    quantity,
    billableAreaCm2: getBillableAreaCm2,
    chargePositionFees: distinctViewCount > 1,
  });

  const elementBaseFeeTotal = elements.reduce((sum, el) => sum + getElementTypeBasePrice(el.type, pricingRules), 0);
  const positionFeeTotal = elements.reduce((sum, el) => sum + getEffectivePositionPrice(el.view), 0);
  const variableCostTotal = elements.reduce((sum, el) => sum + getVariableCost(el, pricingRules), 0);

  const perElement = elements.map((el) => ({
    elementId: el.id,
    price:
      getElementTypeBasePrice(el.type, pricingRules) + getEffectivePositionPrice(el.view) + getVariableCost(el, pricingRules),
  }));

  // Dynamisch je tatsächlich genutzter Ansicht akkumulieren (offene View-IDs).
  // Früher fix auf front/back/sleeve_left/sleeve_right initialisiert – dabei
  // ging der Flächenpreis jeder anderen Ansicht (Tasche, Schürze, Kapuze)
  // still verloren. Siehe Optimierungs-Register O3.
  const areaPriceByView: Record<string, number> = {};
  for (const el of elements) {
    areaPriceByView[el.view] =
      (areaPriceByView[el.view] ?? 0) + getVariableCost(el, pricingRules) * (1 - tier.veredelungDiscountPercent / 100);
  }

  // Grundpreis + Grundgebühren + Positionsaufschlag = "fester" Anteil,
  // leicht rabattiert. Fläche/Stichzahl = "variabler" Anteil, steil
  // rabattiert (siehe Kommentar oben zur Kalibrierung).
  const fixedPortion = basePrice + elementBaseFeeTotal + positionFeeTotal;
  const discountedFixed = fixedPortion * (1 - tier.baseDiscountPercent / 100);
  const discountedVariable = variableCostTotal * (1 - tier.veredelungDiscountPercent / 100);

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

  const stitchRule = pricingRules.find((r) => r.isActive && r.ruleType === 'per_1000_stitches');
  const areaRule = pricingRules.find((r) => r.isActive && r.ruleType === 'per_cm2');
  const totalEstimatedStitches = elements.reduce((sum, el) => sum + (el.estimatedStitches ?? 0), 0);

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
      totalEstimatedStitches,
      baseDiscountPercent: tier.baseDiscountPercent,
      veredelungDiscountPercent: tier.veredelungDiscountPercent,
      savingsAmount: roundToCents(savingsAmount),
      nextTier: getNextTier(quantity),
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
