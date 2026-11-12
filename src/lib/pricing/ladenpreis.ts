/**
 * Ladenpreis: Preise, die auf ,99 € enden.
 *
 * Festlegung des Betreibers (2026-11-12): Alle Preise im Shop sollen „günstig aussehen“, also x,99 €.
 * Der Textil-Grundpreis tut das seit jeher (config/pricing/marginTiers.ts). Der Stückpreis, den die
 * Kundschaft zahlt, setzt sich aber aus Grundpreis, Mengenrabatt und Veredelungsstaffel zusammen und
 * landete dabei bei krummen Beträgen (19,13 € bei 10 Stück). Deshalb wird der fertige Stückpreis zum
 * Schluss auf einen ,99-Betrag gerundet.
 *
 * Zwei Varianten:
 *
 *   - `aufNaechstesNeunundneunzig`: immer nach OBEN (kleinster ,99-Betrag ≥ Wert).
 *     19,13 → 19,99 · 19,99 → 19,99 · 20,00 → 20,99.
 *     Für Untergrenzen wie den kostendeckenden Grundpreis (config/pricing/marginTiers.ts), die nie
 *     unterschritten werden dürfen.
 *
 *   - `aufNaechsten99`: kaufmännisch zum NÄCHSTEN ,99-Betrag (auf oder ab, höchstens ±0,50 €).
 *     19,13 → 18,99 · 19,60 → 19,99 · 20,40 → 19,99 · 20,60 → 20,99.
 *     Für den fertigen Stückpreis im Shop (lib/pricing/calculatePrice.ts). Ein Stückpreis, der immer
 *     aufgerundet wird, lag im Schnitt rund 0,35 € über dem Rechenwert – dem Betreiber zu hoch („goldene
 *     Mitte“). Die Marge bleibt gedeckt, weil der Grundpreis bereits Einkauf inkl. USt + Aufschlag trägt.
 */
export function aufNaechstesNeunundneunzig(betrag: number): number {
  if (!Number.isFinite(betrag) || betrag <= 0.005) return 0;
  // Kleine Toleranz, damit ein Gleitkommawert wie 19,990000000001 nicht eine volle Stufe nach oben springt.
  const ganz = Math.ceil(Math.round((betrag - 0.99) * 10000) / 10000);
  return Math.max(0, ganz) + 0.99;
}

export function aufNaechsten99(betrag: number): number {
  if (!Number.isFinite(betrag) || betrag <= 0.005) return 0;
  const ganz = Math.round(Math.round((betrag - 0.99) * 10000) / 10000);
  return Math.max(0, ganz) + 0.99;
}
