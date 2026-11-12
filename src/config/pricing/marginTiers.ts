import type { QualityTier } from '@/types';
import { nettoZuBrutto } from './steuer';
import { aufNaechstesNeunundneunzig } from '@/lib/pricing/ladenpreis';

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
 * Verkaufspreis = der HÖHERE von zwei Werten:
 *   1. dem bisherigen Preis (Einkauf netto + Aufschlag, aufgerundet auf den nächsthöheren vollen Euro + 0,99 €), und
 *   2. dem kostendeckenden Preis: Einkauf inkl. Umsatzsteuer + Aufschlag, aufgerundet auf den nächsten ,99-Betrag.
 *
 * Warum zwei Werte (Festlegung des Betreibers 2026-11-12, „goldene Mitte“):
 * Die Einkaufspreise (`purchasePrice`) sind die Nettopreise der Lieferanten-Shops. Als Kleinunternehmer (§ 19 UStG,
 * `IST_KLEINUNTERNEHMER` in config/company.ts) kann das Unternehmen die Vorsteuer NICHT abziehen – die Umsatzsteuer auf
 * der Lieferantenrechnung ist echte Kostenlast und gehört in die Kalkulation (Wert 2: Marge von mindestens
 * `FLAT_MARKUP_EUR` über dem tatsächlichen Einkaufspreis). Die erste Fassung dieser Korrektur (gleich am selben Tag) rundete
 * zusätzlich auf den nächsthöheren vollen Euro und lag damit im Schnitt rund 2 € über den früheren Preisen – dem Betreiber
 * zu hoch. Wert 2 rundet auf den NÄCHSTEN ,99-Betrag, Wert 1 hält jeden Preis mindestens auf dem bisherigen Niveau:
 * Ergebnis im Schnitt rund 1 € über früher, kein Produkt billiger als vorher, keines teurer als in der ersten Fassung.
 * Der Satz kommt aus config/pricing/steuer.ts (Regelsatz Deutschland), nicht von hier.
 */
export function computeBasePrice(purchasePrice: number, qualityTier: QualityTier): number {
  void qualityTier;
  const bisherig = roundUpToNextNinetyNine(purchasePrice + FLAT_MARKUP_EUR);
  const kostendeckend = aufNaechstesNeunundneunzig(nettoZuBrutto(purchasePrice) + FLAT_MARKUP_EUR);
  return Math.max(bisherig, kostendeckend);
}
