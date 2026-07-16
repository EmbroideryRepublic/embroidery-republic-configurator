'use client';

/**
 * ══════════════════════════════════════════════════════════════════════
 * STICHZAHL-SCHÄTZUNG – WICHTIGER HINWEIS
 * ══════════════════════════════════════════════════════════════════════
 * Das ist eine Näherung nach gängigen Stickerei-Branchenwerten, KEINE
 * echte Digitalisierung. Die tatsächliche Stichzahl hängt von der
 * konkreten Digitalisierung ab (Chroma Inspire o.ä.): Stichrichtung,
 * Unterlegstiche (Underlay), Fadenwechsel, Stichart (Satin/Tatami/
 * Steppstich) und manuelle Optimierung der Digitalisiererin/des
 * Digitalisierers beeinflussen das Ergebnis erheblich. Diese Schätzung
 * dient als Kalkulationsgrundlage VOR der eigentlichen Digitalisierung –
 * für eine verbindliche Stichzahl bleibt der Export aus der
 * Digitalisierungssoftware maßgeblich.
 *
 * Zugrunde liegende Faustregel (gängiger Branchenwert):
 * ca. 1.000-1.500 Stiche pro Quadratzoll (≈ 6,45 cm²) bei mittlerer
 * Flächendichte → ca. 150-230 Stiche/cm² für vollflächig gefüllte
 * Bereiche. Umrisse/Details (Satin-Spalten an Kanten) brauchen
 * zusätzlich, aber weniger flächenproportional.
 * ══════════════════════════════════════════════════════════════════════
 */

const FILL_STITCHES_PER_CM2 = 420; // kalibriert an einem echten Beispiel (siehe unten)
const EDGE_STITCHES_PER_CM2 = 240;
const BASE_OVERHEAD_STITCHES = 500;

/**
 * KALIBRIERUNG (Stand: erste reale Rückmeldung):
 * Ein 14,1×25cm-Design (Illustration mit feinen Linien/Schraffuren, siehe
 * Beispielbild) wurde vom Kunden in der echten Digitalisierungssoftware
 * mit ca. 150.000 Stichen gemeldet. Die vorherige Formel (160/90/400)
 * schätzte nur ca. 56.776 – Faktor 2,64 zu niedrig. Alle drei
 * Dichtewerte wurden proportional um diesen Faktor erhöht.
 *
 * WICHTIG: Das ist eine Kalibrierung an EINEM einzigen Beispiel, noch
 * keine breite Validierung. Fein schraffierte/detailreiche Illustrationen
 * (wie das Kalibrierungsbeispiel) brauchen sehr viel mehr Stiche als ein
 * einfaches, flächiges Logo – ein einzelner globaler Faktor kann das nicht
 * perfekt für alle Design-Arten abbilden. Weitere reale Vergleichswerte
 * (gerne unterschiedliche Design-Typen: einfaches Flächenlogo, Schriftzug,
 * detaillierte Illustration) würden die Genauigkeit spürbar verbessern.
 */

export async function estimateLogoStitches(dataUrl: string, widthCm: number, heightCm: number): Promise<number> {
  const areaCm2 = widthCm * heightCm;
  if (areaCm2 <= 0) return 0;

  try {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    const maxDim = 200;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return Math.round(areaCm2 * FILL_STITCHES_PER_CM2 * 0.5 + BASE_OVERHEAD_STITCHES);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let filledPixels = 0;
    let edgePixels = 0;

    function isFilled(x: number, y: number): boolean {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 40) return false;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      return !(r > 240 && g > 240 && b > 240);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const filled = isFilled(x, y);
        if (filled) filledPixels++;
        if (x < width - 1 && filled !== isFilled(x + 1, y)) edgePixels++;
        else if (y < height - 1 && filled !== isFilled(x, y + 1)) edgePixels++;
      }
    }

    const totalPixels = width * height;
    const fillRatio = filledPixels / totalPixels;
    const edgeRatio = edgePixels / totalPixels;

    const stitches =
      areaCm2 * fillRatio * FILL_STITCHES_PER_CM2 +
      areaCm2 * edgeRatio * EDGE_STITCHES_PER_CM2 +
      BASE_OVERHEAD_STITCHES;

    return Math.round(Math.max(BASE_OVERHEAD_STITCHES, stitches));
  } catch {
    return Math.round(areaCm2 * FILL_STITCHES_PER_CM2 * 0.5 + BASE_OVERHEAD_STITCHES);
  }
}

export function estimateTextStitches(areaCm2: number, inkCoverageRatio: number): number {
  // Proportional zum selben Kalibrierungsfaktor (2,64x) angepasst wie die
  // Logo-Dichtewerte oben, damit Text und Logo konsistent bleiben.
  const TEXT_STITCHES_PER_CM2 = 580;
  const stitches = areaCm2 * inkCoverageRatio * TEXT_STITCHES_PER_CM2 + BASE_OVERHEAD_STITCHES * 0.5;
  return Math.round(Math.max(150, stitches));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}
