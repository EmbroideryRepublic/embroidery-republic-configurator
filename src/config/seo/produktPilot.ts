/**
 * Produktseiten mit dem Baustein „Im Vergleich“ und „Druckfläche je Größe“ (lib/seo/produktVergleich.ts, components/produkt/ProduktVergleichBlock.tsx).
 *
 * ── Warum nur diese zwölf (Pilot, 26.11.2026) ───────────────────────────
 * Search Console: Google hat 11 Seiten gelesen und nicht aufgenommen, 8 davon sind die ersten acht Modelle dieser Liste. Dazu kommen die vier
 * Produktseiten mit den meisten Impressionen. Alle anderen Produktseiten bleiben unverändert, damit sich die Wirkung messen lässt:
 *   • Vergleich nach rund 4 Wochen (ab 24.12.2026): indexiert ja/nein, Impressionen, Ø Position der zwölf gegen gleichwertige Seiten.
 *   • Wirkt der Baustein, wird er für alle Produktseiten freigeschaltet (dann genügt es, diese Liste durch „alle“ zu ersetzen).
 *
 * Die Seiten bekommen keinen handgeschriebenen Text: Alles im Baustein wird aus dem Katalog berechnet, nichts davon kann veralten.
 */
export const VERGLEICH_PRODUKTE: readonly string[] = [
  // Von Google gelesen und nicht aufgenommen (Stand 26.11.2026)
  'gildan-heavy-blend-hooded-sweatshirt',
  'just-hoods-signature-heavyweight-sweat',
  'neutral-classic-polo',
  'bundc-my-polo-180',
  'fotl-premium-polo',
  'jamesnicholson-classic-polo',
  'bundc-inspire-polo-men',
  'gildan-ladies-polo',
  // Meiste Impressionen unter den Produktseiten (90 Tage)
  'justhoods-awdis-sweat',
  'gildan-ultra-cotton-long-sleeve-t-shirt',
  'gildan-heavy-t',
  'gildan-ultra-cotton-t-shirt',
];

export function hatVergleichsBaustein(produktId: string): boolean {
  return VERGLEICH_PRODUKTE.includes(produktId);
}
