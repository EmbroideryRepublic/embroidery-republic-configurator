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
 * Preisanhebung vom 2026-11-12: Der Betreiber wollte alle Preise um 7–10 % erhöhen, mit Preispsychologie (,99-Endungen).
 * Der Textil-Grundpreis ist dafür der VORGÄNGERPREIS (Einkauf + FLAT_MARKUP_EUR, aufgerundet auf ,99), angehoben in dieses
 * Fenster (siehe anhebenInsFenster unten). Die Druckpositionen (DTF_POSITION_TIERS in lib/pricing/calculatePrice.ts)
 * wurden im selben Zug um rund 9 % angehoben. Versand und Freigrenze blieben unverändert.
 */
export const PREISANHEBUNG_MIN_PROZENT = 7;
export const PREISANHEBUNG_MAX_PROZENT = 10;

/**
 * Hebt einen Ladenpreis um 7–10 % (oder ein anderes Fenster) an und landet dabei auf einem ,99-Betrag.
 *
 * Auf der ,99-Leiter liegen Preise 1 € auseinander; bei einem Preis um 15 € sind das rund 7 %. Ein Fenster von 3 Prozentpunkten
 * enthält deshalb erst ab rund 33 € sicher einen ,99-Betrag. Die Regel:
 *   1. Liegt ein ,99-Betrag im Fenster [preis × (1 + min), preis × (1 + max)], gewinnt der, der der Fenstermitte am nächsten ist.
 *   2. Sonst gewinnt der ,99-Betrag mit dem kleinsten Abstand zum Fenster (bei Gleichstand der näher an der Mitte).
 * Das Ergebnis liegt immer ÜBER dem Ausgangspreis, ist nie billiger und wächst mit dem Ausgangspreis monoton.
 *
 * Preispsychologie: Die ,99-Endung bleibt (Betreiber-Festlegung 2026-11-12), und es wird nie auf einen „krummen“ Betrag aufgerundet.
 */
export function anhebenInsFenster(preis: number, minProzent = 7, maxProzent = 10): number {
  if (!Number.isFinite(preis) || preis <= 0.005) return 0;
  const lo = preis * (1 + minProzent / 100);
  const hi = preis * (1 + maxProzent / 100);
  const mitte = (lo + hi) / 2;
  const abstandZumFenster = (c: number) => (c < lo ? lo - c : c > hi ? c - hi : 0);
  let bester: { c: number; d: number } | null = null;
  for (let k = Math.floor(lo) - 1; k <= Math.ceil(hi) + 1; k++) {
    const c = k + 0.99;
    if (c <= preis + 0.0001) continue;
    const d = abstandZumFenster(c);
    if (
      bester === null ||
      d < bester.d - 1e-9 ||
      (Math.abs(d - bester.d) < 1e-9 && Math.abs(c - mitte) < Math.abs(bester.c - mitte))
    ) {
      bester = { c, d };
    }
  }
  return Number(bester!.c.toFixed(2));
}

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
  return anhebenInsFenster(
    roundUpToNextNinetyNine(purchasePrice + FLAT_MARKUP_EUR),
    PREISANHEBUNG_MIN_PROZENT,
    PREISANHEBUNG_MAX_PROZENT
  );
}
