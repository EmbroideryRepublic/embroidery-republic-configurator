import type { QualityTier } from '@/types';

/**
 * Fester Aufschlag in Euro je Stück auf den Einkaufspreis – die gesamte
 * Marge. Ersetzt das frühere, nach Qualitätsstufe gestaffelte
 * Multiplikator-Modell (2,2×–3,2×): auf ausdrücklichen Wunsch des
 * Betreibers bekommt JEDES Produkt denselben Euro-Aufschlag, unabhängig
 * von seiner Qualitätsstufe. `qualityTier` bleibt Parameter von
 * `computeBasePrice()` (Kennzeichnung/Filterkriterium im Katalog, siehe
 * QUALITY_TIER_LABELS), beeinflusst die Preisbildung aber nicht mehr.
 *
 * 9 € seit 2026-11-12 (vorher 8 €): Die Lieferanten-Einkaufspreise sind Nettopreise, das Unternehmen ist
 * Kleinunternehmer und trägt die Umsatzsteuer darauf selbst. Der Betreiber wollte dafür ausdrücklich KEINE
 * Mehrwertsteuer-Rechnung im Preis, sondern einfach „das Geld draufpacken“: pauschal +1 € je Produkt (jeder
 * Verkaufspreis liegt damit genau 1 € über dem früheren), nichts darf günstiger werden als vorher und nichts
 * soll viel teurer werden. Siehe docs/kalkulationsmodell.md.
 */
export const FLAT_MARKUP_EUR = 9;

/**
 * Rundet auf den NÄCHSTHÖHEREN vollen Euro plus 99 Cent – nie auf die
 * kleinste .99-Zahl, die den Betrag gerade noch deckt. Beispiel (Vorgabe
 * des Betreibers): 11,52 € → 12,99 €, nicht 11,99 €. Dadurch endet jeder
 * Verkaufspreis auf „,99 €" UND liegt immer mindestens einen vollen Euro
 * über dem Einkaufspreis + Aufschlag – eine bewusst großzügige, leicht
 * nachvollziehbare Rundungsregel statt einer margenminimalen.
 */
function roundUpToNextNinetyNine(value: number): number {
  // Auf 4 Nachkommastellen runden, damit ein Wert wie 12,9999999999 (Gleitkomma) nicht eine Stufe zu tief landet.
  return Math.floor(Math.round(value * 10000) / 10000) + 1.99;
}

/**
 * Einziger Ort, an dem basePrice aus purchasePrice abgeleitet wird. Jedes
 * Produkt jeder Marke ruft ausschließlich diese Funktion auf, nie eine
 * eigene Formel.
 *
 * Verkaufspreis = Einkaufspreis (netto) + Aufschlag (`FLAT_MARKUP_EUR`), aufgerundet auf den nächsthöheren vollen
 * Euro + 0,99 €. Keine Steuerrechnung im Preis.
 */
export function computeBasePrice(purchasePrice: number, qualityTier: QualityTier): number {
  void qualityTier;
  return roundUpToNextNinetyNine(purchasePrice + FLAT_MARKUP_EUR);
}
