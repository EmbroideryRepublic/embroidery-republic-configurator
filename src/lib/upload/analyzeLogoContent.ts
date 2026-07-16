'use client';

export interface LogoContentAnalysis {
  /** Beschnittene Box relativ zum Originalbild, in Prozent (0-100). */
  bounds: { x0: number; y0: number; x1: number; y1: number };
  /** Anteil der beschnittenen Box, der tatsächlich sichtbarer Inhalt ist
   *  (0-1) – z.B. ein rundes Emblem in eckiger Box füllt nur ca. 78%. */
  fillRatio: number;
}

/**
 * Analysiert ein hochgeladenes Logo: schneidet transparenten/weißen
 * Leerraum am Rand weg (die Box entspricht danach nur noch dem
 * tatsächlichen Motiv, nicht mehr eventuellen Rändern in der
 * Originaldatei) und berechnet zusätzlich den Füllgrad innerhalb dieser
 * beschnittenen Box (z.B. für runde/unregelmäßige Formen, die ihre eigene
 * Bounding-Box nicht vollständig ausfüllen).
 *
 * Wird für Preis-/Größenanzeige genutzt: der Kunde soll für sein
 * tatsächliches Motiv bezahlen, nicht für Leerraum in der hochgeladenen
 * Datei oder in der eckigen Auswahl-Box um ein rundes Logo.
 */
export async function analyzeLogoContent(dataUrl: string, backgroundThreshold = 240): Promise<LogoContentAnalysis> {
  const fallback: LogoContentAnalysis = { bounds: { x0: 0, y0: 0, x1: 100, y1: 100 }, fillRatio: 0.85 };

  try {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    const maxDim = 300;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    function isContent(x: number, y: number): boolean {
      const i = (y * w + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 40) return false; // transparent
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      return !(r > backgroundThreshold && g > backgroundThreshold && b > backgroundThreshold);
    }

    let minX = w, maxX = 0, minY = h, maxY = 0;
    let contentPixels = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isContent(x, y)) {
          contentPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (contentPixels === 0) return fallback;

    const bounds = {
      x0: (minX / w) * 100,
      y0: (minY / h) * 100,
      x1: ((maxX + 1) / w) * 100,
      y1: ((maxY + 1) / h) * 100,
    };

    const boundsPixelArea = (maxX - minX + 1) * (maxY - minY + 1);
    const fillRatio = boundsPixelArea > 0 ? Math.min(1, contentPixels / boundsPixelArea) : 0.85;

    return { bounds, fillRatio: Math.max(0.05, fillRatio) };
  } catch {
    return fallback;
  }
}

/**
 * Schneidet ein Bild auf seinen tatsächlichen Inhalt zu (entfernt
 * transparenten/weißen Leerraum am Rand). Nutzt die ORIGINALAUFLÖSUNG
 * (nicht die verkleinerte Analyse-Version), damit keine Bildqualität
 * verloren geht. `bounds` sind Prozentwerte (0-100) relativ zum Bild,
 * wie von analyzeLogoContent() geliefert.
 */
export async function cropImageToContent(
  dataUrl: string,
  bounds: { x0: number; y0: number; x1: number; y1: number }
): Promise<{ dataUrl: string; width: number; height: number }> {
  // Kein spürbarer Leerraum -> nicht zuschneiden (vermeidet unnötige
  // Neukodierung bei Bildern, die ohnehin schon eng zugeschnitten sind).
  const margin = 1.5; // Prozentpunkte Toleranz
  if (bounds.x0 < margin && bounds.y0 < margin && bounds.x1 > 100 - margin && bounds.y1 > 100 - margin) {
    const img = await loadImage(dataUrl);
    return { dataUrl, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  }

  const img = await loadImage(dataUrl);
  const fullW = img.naturalWidth || img.width;
  const fullH = img.naturalHeight || img.height;

  const cropX = Math.round((bounds.x0 / 100) * fullW);
  const cropY = Math.round((bounds.y0 / 100) * fullH);
  const cropW = Math.max(1, Math.round(((bounds.x1 - bounds.x0) / 100) * fullW));
  const cropH = Math.max(1, Math.round(((bounds.y1 - bounds.y0) / 100) * fullH));

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl, width: fullW, height: fullH };

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return { dataUrl: canvas.toDataURL('image/png'), width: cropW, height: cropH };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}
