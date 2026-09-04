/**
 * STICHZAHL-SCHÄTZUNG – der gemeinsame, reine Rechenkern.
 *
 * Läuft IDENTISCH im Browser (estimateStitches.ts, Pixel aus einer Canvas)
 * und auf dem Server (serverStichzahl.ts, Pixel aus dem gespeicherten PNG
 * über resvg). Deshalb hier keinerlei Browser- oder Node-Abhängigkeit: nur
 * Zahlen rein, Zahlen raus. Solange beide Seiten diese Funktionen nutzen,
 * kann die Schätzung nicht auseinanderdriften – und der Server kann die vom
 * Browser übermittelte Stichzahl gegen seine eigene prüfen, statt sie zu
 * glauben.
 *
 * ── Faustregel und Kalibrierung ───────────────────────────────────────
 * Näherung nach gängigen Branchenwerten (ca. 1.000–1.500 Stiche je
 * Quadratzoll bei mittlerer Dichte), kalibriert an EINEM realen Beispiel
 * (14,1×25 cm, feine Schraffuren, vom Kunden mit ca. 150.000 Stichen aus
 * der Digitalisierungssoftware gemeldet; Faktor 2,64 gegenüber der ersten
 * Formel). Keine echte Digitalisierung – für die verbindliche Zahl bleibt
 * der Export aus der Digitalisierungssoftware (Chroma Inspire o.ä.)
 * maßgeblich.
 */

/** Füllstiche je cm² für vollflächig gefüllte Bereiche. */
export const FILL_STITCHES_PER_CM2 = 420;
/** Zusätzliche Kantenstiche je cm² (Satin-Spalten an Konturen). */
export const EDGE_STITCHES_PER_CM2 = 240;
/** Grundstiche je Motiv (Unterlage, Anfahren, Fadenwechsel) – zugleich die
 *  kleinste Stichzahl, die die Schätzung für ein Logo je liefert. */
export const BASE_OVERHEAD_STITCHES = 500;
/** Stiche je cm² Tinte bei Text (Faktor 2,64 wie oben). */
export const TEXT_STITCHES_PER_CM2 = 580;
/** Kleinste Stichzahl, die die Schätzung für einen Text je liefert. */
export const TEXT_MIN_STITCHES = 150;

/**
 * Kantenlänge des Analyse-Rasters. Das Motiv wird für die Pixelanalyse auf
 * höchstens diese Kantenlänge verkleinert – auf beiden Seiten gleich, damit
 * Füll- und Kantenanteil vergleichbar bleiben (der Kantenanteil hängt von
 * der Auflösung ab).
 */
export const SCHAETZ_RASTER_PX = 200;

/** Zielgröße des Analyse-Rasters für ein Bild dieser Abmessungen. */
export function rasterMasse(breitePx: number, hoehePx: number): { width: number; height: number } {
  const scale = Math.min(1, SCHAETZ_RASTER_PX / Math.max(breitePx, hoehePx));
  return {
    width: Math.max(1, Math.round(breitePx * scale)),
    height: Math.max(1, Math.round(hoehePx * scale)),
  };
}

/**
 * Bis zu dieser Pixelzahl wird ein Motiv in ORIGINALGRÖSSE dekodiert und
 * erst durch verkleinereAufRaster() verkleinert – dann rechnen Browser und
 * Server bitgleich. Größere Bilder (selten, z.B. 5000×5000-Fotos; Upload-
 * Grenze ist 8000×8000) werden vorher von der jeweiligen Plattform
 * verkleinert, weil ein Vollbild-Puffer dort zu viel Speicher bräuchte –
 * für diese Fälle deckt die Messtoleranz (serverStichzahl.ts) die kleine
 * Filterdrift ab.
 */
export const MAX_NATIV_PX = 16_000_000;

/** Größe, in der ein Bild vor der Analyse dekodiert wird (siehe MAX_NATIV_PX). */
export function dekodierMasse(breitePx: number, hoehePx: number): { width: number; height: number } {
  const pixel = breitePx * hoehePx;
  if (pixel <= MAX_NATIV_PX) return { width: breitePx, height: hoehePx };
  const scale = Math.sqrt(MAX_NATIV_PX / pixel);
  return { width: Math.max(1, Math.round(breitePx * scale)), height: Math.max(1, Math.round(hoehePx * scale)) };
}

/** RGBA-Pixel eines Bildes (4 Bytes je Pixel, zeilenweise, Alpha NICHT
 *  vormultipliziert). */
export interface PixelDaten {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/**
 * Verkleinert Pixel DETERMINISTISCH auf das Analyse-Raster (Box-Filter:
 * jedes Zielpixel ist der Mittelwert seines Quellrechtecks, Grenzen über
 * ganzzahlige Division).
 *
 * Warum nicht die Bildskalierung von Canvas bzw. resvg: Deren Filter
 * unterscheiden sich (gemessen: bis ±12 % Stichzahl bei dünnen Linien und
 * halbtransparentem Weiß). Mit dieser Funktion rechnen Browser und Server
 * aus denselben dekodierten Pixeln exakt dieselbe Zahl – die Grundlage
 * dafür, dass der Server den Browserwert prüfen kann, ohne ehrliche
 * Kundinnen mit Cent-Abweichungen zu treffen.
 *
 * Bilder, die bereits klein genug sind, werden unverändert übernommen.
 */
export function verkleinereAufRaster(px: PixelDaten): PixelDaten {
  const { data, width, height } = px;
  const ziel = rasterMasse(width, height);
  if (ziel.width === width && ziel.height === height) return px;

  const out = new Uint8ClampedArray(ziel.width * ziel.height * 4);
  for (let ty = 0; ty < ziel.height; ty++) {
    const y0 = Math.floor((ty * height) / ziel.height);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * height) / ziel.height));
    for (let tx = 0; tx < ziel.width; tx++) {
      const x0 = Math.floor((tx * width) / ziel.width);
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * width) / ziel.width));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
          a += data[i + 3] ?? 0;
          n++;
        }
      }
      const o = (ty * ziel.width + tx) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return { data: out, width: ziel.width, height: ziel.height };
}

/**
 * Füll- und Kantenanteil eines Motivs: Ein Pixel gilt als „Motiv", wenn es
 * nicht (fast) transparent und nicht (fast) weiß ist; ein Kantenpixel ist
 * ein Motivpixel mit einem Nicht-Motiv-Nachbarn rechts oder unten (oder
 * umgekehrt).
 */
export function analysiereMotiv(px: PixelDaten): { fillRatio: number; edgeRatio: number } {
  const { data, width, height } = px;
  const gefuellt = (x: number, y: number): boolean => {
    const i = (y * width + x) * 4;
    const alpha = data[i + 3] ?? 0;
    if (alpha < 40) return false;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    return !(r > 240 && g > 240 && b > 240);
  };

  let filledPixels = 0;
  let edgePixels = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const filled = gefuellt(x, y);
      if (filled) filledPixels++;
      if (x < width - 1 && filled !== gefuellt(x + 1, y)) edgePixels++;
      else if (y < height - 1 && filled !== gefuellt(x, y + 1)) edgePixels++;
    }
  }
  const totalPixels = width * height;
  return { fillRatio: filledPixels / totalPixels, edgeRatio: edgePixels / totalPixels };
}

/** Stichzahl eines Logos aus seinen Pixeln (beliebige Größe, Alpha nicht
 *  vormultipliziert) – die Verkleinerung auf das Analyse-Raster geschieht
 *  hier, damit kein Aufrufer sie vergessen oder anders machen kann. */
export function schaetzeLogoStiche(px: PixelDaten, areaCm2: number): number {
  if (areaCm2 <= 0) return 0;
  const { fillRatio, edgeRatio } = analysiereMotiv(verkleinereAufRaster(px));
  const stitches =
    areaCm2 * fillRatio * FILL_STITCHES_PER_CM2 + areaCm2 * edgeRatio * EDGE_STITCHES_PER_CM2 + BASE_OVERHEAD_STITCHES;
  return Math.round(Math.max(BASE_OVERHEAD_STITCHES, stitches));
}

/** Rückfall ohne Bilddaten (Bild nicht lesbar): mittlere Füllung angenommen. */
export function schaetzeLogoSticheOhneBild(areaCm2: number): number {
  if (areaCm2 <= 0) return 0;
  return Math.round(areaCm2 * FILL_STITCHES_PER_CM2 * 0.5 + BASE_OVERHEAD_STITCHES);
}

/** Stichzahl eines Textes aus Boxfläche und Tintenanteil (0–1). */
export function schaetzeTextStiche(areaCm2: number, inkCoverageRatio: number): number {
  const stitches = areaCm2 * inkCoverageRatio * TEXT_STITCHES_PER_CM2 + BASE_OVERHEAD_STITCHES * 0.5;
  return Math.round(Math.max(TEXT_MIN_STITCHES, stitches));
}
