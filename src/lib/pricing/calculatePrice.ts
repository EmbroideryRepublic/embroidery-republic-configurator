import type { ConfigElement, PricingRule, PrintView } from '@/types';

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
  { minQuantity: 5, baseDiscountPercent: 0, veredelungDiscountPercent: 0 },
  { minQuantity: 10, baseDiscountPercent: 3, veredelungDiscountPercent: 8 },
  { minQuantity: 30, baseDiscountPercent: 5, veredelungDiscountPercent: 15 },
  { minQuantity: 100, baseDiscountPercent: 8, veredelungDiscountPercent: 25 },
  { minQuantity: 250, baseDiscountPercent: 11, veredelungDiscountPercent: 35 },
  { minQuantity: 500, baseDiscountPercent: 15, veredelungDiscountPercent: 45 },
];

function getTierForQuantity(quantity: number): QuantityTier {
  let current = QUANTITY_TIERS[0];
  for (const tier of QUANTITY_TIERS) {
    if (quantity >= tier.minQuantity) current = tier;
  }
  return current;
}

function getNextTier(quantity: number): QuantityTier | null {
  return QUANTITY_TIERS.find((tier) => tier.minQuantity > quantity) ?? null;
}

const MINIMUM_QUANTITY = 5;

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
  const quantity = Math.max(input.quantity, MINIMUM_QUANTITY);
  const tier = getTierForQuantity(quantity);

  // Positionsaufschlag nur, wenn TATSÄCHLICH mehrere unterschiedliche
  // Ansichten gleichzeitig bedruckt/bestickt werden (z.B. Vorderseite UND
  // Rücken). Nutzt der Kunde nur EINE Ansicht – egal welche, auch nur
  // Rücken oder nur ein Ärmel – entsteht kein zusätzlicher Rüstaufwand
  // gegenüber "nur eine Fläche", also auch kein Aufschlag.
  const distinctViewCount = new Set(elements.map((el) => el.view)).size;
  const getEffectivePositionPrice = (view: PrintView) =>
    distinctViewCount > 1 ? getPositionPrice(view, pricingRules) : 0;

  const elementBaseFeeTotal = elements.reduce((sum, el) => sum + getElementTypeBasePrice(el.type, pricingRules), 0);
  const positionFeeTotal = elements.reduce((sum, el) => sum + getEffectivePositionPrice(el.view), 0);
  const variableCostTotal = elements.reduce((sum, el) => sum + getVariableCost(el, pricingRules), 0);

  const perElement = elements.map((el) => ({
    elementId: el.id,
    price:
      getElementTypeBasePrice(el.type, pricingRules) + getEffectivePositionPrice(el.view) + getVariableCost(el, pricingRules),
  }));

  const areaPriceByView: Record<PrintView, number> = { front: 0, back: 0, sleeve_left: 0, sleeve_right: 0 };
  for (const el of elements) {
    areaPriceByView[el.view] += getVariableCost(el, pricingRules) * (1 - tier.veredelungDiscountPercent / 100);
  }

  // Grundpreis + Grundgebühren + Positionsaufschlag = "fester" Anteil,
  // leicht rabattiert. Fläche/Stichzahl = "variabler" Anteil, steil
  // rabattiert (siehe Kommentar oben zur Kalibrierung).
  const fixedPortion = basePrice + elementBaseFeeTotal + positionFeeTotal;
  const discountedFixed = fixedPortion * (1 - tier.baseDiscountPercent / 100);
  const discountedVariable = variableCostTotal * (1 - tier.veredelungDiscountPercent / 100);

  const unitPriceUndiscounted = fixedPortion + variableCostTotal;
  const unitPriceDiscounted = discountedFixed + discountedVariable;
  const totalPrice = unitPriceDiscounted * quantity;
  const savingsAmount = (unitPriceUndiscounted - unitPriceDiscounted) * quantity;

  const stitchRule = pricingRules.find((r) => r.isActive && r.ruleType === 'per_1000_stitches');
  const areaRule = pricingRules.find((r) => r.isActive && r.ruleType === 'per_cm2');
  const totalEstimatedStitches = elements.reduce((sum, el) => sum + (el.estimatedStitches ?? 0), 0);

  return {
    unitPrice: roundToCents(unitPriceDiscounted),
    totalPrice: roundToCents(totalPrice),
    breakdown: {
      basePrice: roundToCents(basePrice * (1 - tier.baseDiscountPercent / 100)),
      elementsPrice: roundToCents(elementBaseFeeTotal + positionFeeTotal + variableCostTotal),
      perElement,
      elementBaseFeeTotal: roundToCents(elementBaseFeeTotal * (1 - tier.baseDiscountPercent / 100)),
      positionFeeTotal: roundToCents(positionFeeTotal * (1 - tier.baseDiscountPercent / 100)),
      areaPriceByView: {
        front: roundToCents(areaPriceByView.front),
        back: roundToCents(areaPriceByView.back),
        sleeve_left: roundToCents(areaPriceByView.sleeve_left),
        sleeve_right: roundToCents(areaPriceByView.sleeve_right),
      },
      areaPricePerCm2: areaRule?.price ?? 0,
      pricePer1000Stitches: stitchRule?.price ?? 0,
      isStitchBased: Boolean(stitchRule),
      totalEstimatedStitches,
      baseDiscountPercent: tier.baseDiscountPercent,
      veredelungDiscountPercent: tier.veredelungDiscountPercent,
      savingsAmount: roundToCents(savingsAmount),
      nextTier: getNextTier(quantity),
    },
  };
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export { MINIMUM_QUANTITY };
