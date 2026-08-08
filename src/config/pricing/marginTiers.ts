import type { QualityTier } from '@/types';

/**
 * Fester Aufschlag in Euro je Stück auf den Einkaufspreis – die gesamte
 * Marge. Ersetzt das frühere, nach Qualitätsstufe gestaffelte
 * Multiplikator-Modell (2,2×–3,2×): auf ausdrücklichen Wunsch des
 * Betreibers bekommt JEDES Produkt denselben Euro-Aufschlag, unabhängig
 * von seiner Qualitätsstufe. `qualityTier` bleibt Parameter von
 * `computeBasePrice()` (Kennzeichnung/Filterkriterium im Katalog, siehe
 * QUALITY_TIER_LABELS), beeinflusst die Preisbildung aber nicht mehr.
 */
export const FLAT_MARKUP_EUR = 8;

/**
 * Rundet auf den NÄCHSTHÖHEREN vollen Euro plus 99 Cent – nie auf die
 * kleinste .99-Zahl, die den Betrag gerade noch deckt. Beispiel (Vorgabe
 * des Betreibers): 11,52 € → 12,99 €, nicht 11,99 €. Dadurch endet jeder
 * Verkaufspreis auf „,99 €" UND liegt immer mindestens einen vollen Euro
 * über dem Einkaufspreis + Aufschlag – eine bewusst großzügige, leicht
 * nachvollziehbare Rundungsregel statt einer margenminimalen.
 */
function roundUpToNextNinetyNine(value: number): number {
  return Math.floor(value) + 1.99;
}

/**
 * Einziger Ort, an dem basePrice aus purchasePrice abgeleitet wird. Jedes
 * Produkt jeder Marke ruft ausschließlich diese Funktion auf, nie eine
 * eigene Formel.
 */
export function computeBasePrice(purchasePrice: number, qualityTier: QualityTier): number {
  void qualityTier;
  return roundUpToNextNinetyNine(purchasePrice + FLAT_MARKUP_EUR);
}
