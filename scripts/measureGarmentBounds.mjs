/**
 * Einmaliges Analyse-Skript: ermittelt die tatsächliche Kleidungsstück-
 * Fläche in einem Produktfoto per Farbschwellenwert-Analyse (Distanz zur
 * aus den vier Bildecken gemittelten Hintergrundfarbe) und gibt die
 * Bounding-Box in Prozent zurück - direkt einsetzbar als MEASURED-Eintrag
 * in src/config/printAreas.ts.
 *
 * Aufruf: node scripts/measureGarmentBounds.mjs <pfad-zum-bild> [threshold]
 */
import sharp from 'sharp';

const filePath = process.argv[2];
const threshold = Number(process.argv[3] ?? 12);

if (!filePath) {
  console.error('Nutzung: node scripts/measureGarmentBounds.mjs <bild.png> [threshold]');
  process.exit(1);
}

const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function px(x, y) {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2]];
}

// Hintergrundfarbe aus den vier Ecken mitteln (robuster als eine einzelne Ecke).
const corners = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3)];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));

function dist(p) {
  return Math.sqrt((p[0] - bg[0]) ** 2 + (p[1] - bg[1]) ** 2 + (p[2] - bg[2]) ** 2);
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
let found = false;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (dist(px(x, y)) > threshold) {
      found = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

if (!found) {
  console.error('Keine Kleidungsstück-Pixel gefunden (Threshold zu hoch?)');
  process.exit(1);
}

const toPct = (v, total) => Math.round((v / total) * 1000) / 10;

console.log(
  JSON.stringify({
    file: filePath,
    background: bg,
    threshold,
    pixelBox: { minX, minY, maxX, maxY },
    percentBox: {
      x0: toPct(minX, width),
      y0: toPct(minY, height),
      x1: toPct(maxX, width),
      y1: toPct(maxY, height),
    },
  })
);
