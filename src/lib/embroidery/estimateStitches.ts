'use client';

/**
 * ══════════════════════════════════════════════════════════════════════
 * STICHZAHL-SCHÄTZUNG IM BROWSER
 * ══════════════════════════════════════════════════════════════════════
 * Der eigentliche Rechenkern (Füll-/Kantenanteil → Stiche) liegt in
 * stichschaetzung.ts und ist rein – dieselben Funktionen nutzt der Server
 * (serverStichzahl.ts), um die hier ermittelte Zahl bei der Bestellung aus
 * dem gespeicherten Motiv NACHZURECHNEN. Der Browser liefert also nur eine
 * Vorschau der Stichzahl; die für den Preis maßgebliche Zahl bestimmt der
 * Server selbst.
 *
 * Diese Datei kümmert sich ausschließlich um das Browser-Spezifische:
 * Bild laden, auf das Analyse-Raster verkleinern, Pixel auslesen.
 *
 * WICHTIGER HINWEIS: Das ist eine Näherung nach Branchenwerten, KEINE
 * echte Digitalisierung (siehe stichschaetzung.ts) – für die verbindliche
 * Stichzahl bleibt der Export aus der Digitalisierungssoftware maßgeblich.
 */

import { loadImage } from '@/lib/browser/loadImage';
import { dekodierMasse, schaetzeLogoStiche, schaetzeLogoSticheOhneBild, schaetzeTextStiche } from './stichschaetzung';

export async function estimateLogoStitches(dataUrl: string, widthCm: number, heightCm: number): Promise<number> {
  const areaCm2 = widthCm * heightCm;
  if (areaCm2 <= 0) return 0;

  try {
    const img = await loadImage(dataUrl);
    // In ORIGINALGRÖSSE auslesen (bis MAX_NATIV_PX) – die Verkleinerung auf
    // das Analyse-Raster übernimmt der gemeinsame Rechenkern, damit der
    // Server aus derselben Datei exakt dieselbe Zahl erhält.
    const canvas = document.createElement('canvas');
    const { width, height } = dekodierMasse(img.width, img.height);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return schaetzeLogoSticheOhneBild(areaCm2);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const bild = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return schaetzeLogoStiche({ data: bild.data, width: bild.width, height: bild.height }, areaCm2);
  } catch {
    return schaetzeLogoSticheOhneBild(areaCm2);
  }
}

export function estimateTextStitches(areaCm2: number, inkCoverageRatio: number): number {
  return schaetzeTextStiche(areaCm2, inkCoverageRatio);
}
