/**
 * Auflösung, in der ein hochgeladenes SVG zu PNG gerastert wird (reine Rechnung, ohne Browserbezug).
 *
 * ── Warum ─────────────────────────────────────────────────────────────
 * Der Server nimmt nur PNG (lib/upload/pruefeUpload.ts); ein SVG wird deshalb im Browser gerastert. Bisher in seiner EIGENEN Größe: ein
 * SVG mit width="100" ergab ein 100-Pixel-PNG, ein SVG nur mit viewBox (ohne Maße) nur 300 Pixel – und das war die Datei, die bestellt
 * und für den Druck heruntergeladen wurde, während der Konfigurator „Vektordatei – verlustfrei skalierbar“ anzeigte. Ein Vektor kann
 * beliebig groß gerastert werden; das PNG soll deshalb für einen scharfen Druck reichen.
 *
 * Ziel: die längere Kante hat {@link SVG_ZIEL_KANTE_PX} Pixel (bei 30 cm Druckbreite rund 250 dpi); eine größere eigene Größe bleibt, solange
 * sie die Obergrenze des Servers ({@link SVG_MAX_KANTE_PX}) nicht überschreitet – darüber wird auf die Obergrenze verkleinert, statt dass die
 * Bestellung an der Prüfung scheitert.
 */

/** Gewünschte Länge der längeren Kante, wenn das SVG kleiner ist. */
export const SVG_ZIEL_KANTE_PX = 3000;
/** Obergrenze je Kante (Prüfung des Servers: höchstens 8000 × 8000 Pixel). */
export const SVG_MAX_KANTE_PX = 8000;

/** Faktor, mit dem ein SVG der Größe `breitePx` × `hoehePx` gerastert wird (1 = eigene Größe). */
export function svgRasterSkala(breitePx: number, hoehePx: number): number {
  const laenge = Math.max(breitePx, hoehePx);
  if (!(laenge > 0) || !Number.isFinite(laenge)) return 1;
  return Math.min(Math.max(1, SVG_ZIEL_KANTE_PX / laenge), SVG_MAX_KANTE_PX / laenge);
}

export function istSvgDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml');
}
