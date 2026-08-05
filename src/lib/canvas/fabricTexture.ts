/**
 * Feine, prozedurale Gewebetextur für die REALISTISCHE VORSCHAU.
 *
 * Wird ausschließlich auf dem Bildschirm über die Motivfläche gelegt, damit ein
 * Druck die Struktur des Textils andeutet statt spiegelglatt zu wirken. Rein
 * visuell – die Produktionsdaten (element.fileUrl) bleiben unberührt.
 *
 * Bewusst KEIN Bild-Asset: Die Textur wird einmal prozedural in ein kleines
 * Canvas gezeichnet und zwischengespeichert (kein Netzwerk, kein Build-Schritt,
 * keine Cross-Origin-Probleme). Die Amplitude ist absichtlich winzig – der
 * Effekt soll unterschwellig sein, nie als Muster auffallen.
 */
let zwischenspeicher: HTMLCanvasElement | null = null;

export function gewebeTextur(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (zwischenspeicher) return zwischenspeicher;

  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;

  const bild = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // Leinwandbindung: feines Warp/Weft-Gitter + gröbere Stofflagen.
      const fein = Math.sin(x / 1.5) * Math.sin(y / 1.5); // -1..1, feines Gewebe
      const grob = (Math.sin((x + y) / 7) + Math.sin((x - y) / 7)) * 0.5; // sanfte Lagen
      // Mittelgrau (128) ist für „overlay" neutral – nur die kleine Abweichung
      // moduliert später die Motivhelligkeit (heller Faden / dunkle Kreuzung).
      // Bewusst SEHR geringe Amplitude: der Druck soll nicht „stofflich"
      // aussehen (DTF ist ein glatter Film), sondern nur seine perfekt flache,
      // rein digitale Anmutung verlieren – ein unterschwelliges Korn.
      let v = 128 + fein * 5 + grob * 3;
      v = Math.max(0, Math.min(255, v));
      const i = (y * S + x) * 4;
      bild.data[i] = bild.data[i + 1] = bild.data[i + 2] = v;
      bild.data[i + 3] = 255;
    }
  }
  ctx.putImageData(bild, 0, 0);
  zwischenspeicher = cv;
  return cv;
}
