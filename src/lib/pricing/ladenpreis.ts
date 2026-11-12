/**
 * Ladenpreis: aufgerundet auf den nächsten Betrag, der auf ,99 € endet.
 *
 * Festlegung des Betreibers (2026-11-12): Alle Preise im Shop sollen „günstig aussehen“, also x,99 €.
 * Der Textil-Grundpreis tut das seit jeher (config/pricing/marginTiers.ts). Der Stückpreis, den die
 * Kundschaft zahlt, setzt sich aber aus Grundpreis, Mengenrabatt und Veredelungsstaffel zusammen und
 * landete dabei bei krummen Beträgen (19,13 € bei 10 Stück). Deshalb wird der fertige Stückpreis zum
 * Schluss aufgerundet – nie abgerundet, die Rundung kostet also nie Marge.
 *
 * Beispiele: 19,13 → 19,99 · 19,99 → 19,99 · 20,00 → 20,99 · 11,50 → 11,99.
 */
export function aufNaechstesNeunundneunzig(betrag: number): number {
  if (!Number.isFinite(betrag) || betrag <= 0.005) return 0;
  // Kleine Toleranz, damit ein Gleitkommawert wie 19,990000000001 nicht eine volle Stufe nach oben springt.
  const ganz = Math.ceil(Math.round((betrag - 0.99) * 10000) / 10000);
  return Math.max(0, ganz) + 0.99;
}
