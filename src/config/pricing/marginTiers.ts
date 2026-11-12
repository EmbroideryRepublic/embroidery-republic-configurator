import type { QualityTier } from '@/types';
import { nettoZuBrutto } from './steuer';

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
  // Auf 4 Nachkommastellen runden, damit ein Wert wie 12,9999999999 (Gleitkomma) nicht eine Stufe zu tief landet.
  return Math.floor(Math.round(value * 10000) / 10000) + 1.99;
}

/**
 * Einziger Ort, an dem basePrice aus purchasePrice abgeleitet wird. Jedes
 * Produkt jeder Marke ruft ausschließlich diese Funktion auf, nie eine
 * eigene Formel.
 *
 * Verkaufspreis = (Einkaufspreis NETTO + Umsatzsteuer darauf + Aufschlag), aufgerundet auf x,99 €.
 *
 * Die Einkaufspreise im Katalog (`purchasePrice`) sind die Nettopreise, wie die Lieferanten-Shops
 * sie zeigen (B2B-Ansicht ohne MwSt.). Als Kleinunternehmer (§ 19 UStG, `IST_KLEINUNTERNEHMER`
 * in config/company.ts) kann das Unternehmen die Vorsteuer NICHT abziehen: Die Umsatzsteuer auf
 * der Lieferantenrechnung ist echte Kostenlast. Bis 2026-11-12 wurde sie nicht mitgerechnet –
 * jeder Verkaufspreis lag dadurch im Schnitt rund 2 € zu niedrig (Betreiber: „wir sind zu
 * günstig“). Der Satz kommt aus config/pricing/steuer.ts (Regelsatz Deutschland), nicht von hier.
 */
export function computeBasePrice(purchasePrice: number, qualityTier: QualityTier): number {
  void qualityTier;
  return roundUpToNextNinetyNine(nettoZuBrutto(purchasePrice) + FLAT_MARKUP_EUR);
}
