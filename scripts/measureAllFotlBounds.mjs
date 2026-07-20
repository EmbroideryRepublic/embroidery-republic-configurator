/**
 * Vermisst automatisch die tatsächliche Kleidungsstück-Fläche (Farbschwellenwert-
 * Analyse) für alle 4 Ansichten jedes Fruit-of-the-Loom-Produkts (Anker-
 * Farbordner, da MEASURED pro Produkt-ID gilt, nicht pro Farbe) und gibt
 * fertigen TypeScript-Code für MEASURED in src/config/printAreas.ts aus.
 *
 * Aufruf: node scripts/measureAllFotlBounds.mjs
 */
import sharp from 'sharp';
import path from 'node:path';

// HINWEIS: 'fotl-ladies-valueweight-vneck' ist der Produkt-ID in
// fruitOfTheLoom.ts, der Bildordner heißt jedoch (kürzer) 'fotl-ladies-vneck'
// (siehe realPhotoColorSet-Aufruf) – deshalb hier zwei unterschiedliche
// Strings: productId (Ausgabe-Key, MUSS mit printAreas.ts/ProductConfig.id
// übereinstimmen) und folder (tatsächlicher Pfad unter public/products/).
const PRODUCT_IDS = [
  { productId: 'fotl-heavy-t', folder: 'fotl-heavy-t' },
  { productId: 'fotl-ladies-valueweight-vneck', folder: 'fotl-ladies-vneck' },
  { productId: 'fotl-original-longsleeve', folder: 'fotl-original-longsleeve' },
  { productId: 'fotl-original-vneck', folder: 'fotl-original-vneck' },
  { productId: 'fotl-ladies-original-t', folder: 'fotl-ladies-original-t' },
  { productId: 'fotl-iconic195-longsleeve', folder: 'fotl-iconic195-longsleeve' },
  { productId: 'fotl-pure-cotton-t', folder: 'fotl-pure-cotton-t' },
  { productId: 'fotl-super-premium-t', folder: 'fotl-super-premium-t' },
  { productId: 'fotl-valueweight-t', folder: 'fotl-valueweight-t' },
  { productId: 'fotl-valueweight-vneck', folder: 'fotl-valueweight-vneck' },
  { productId: 'fotl-iconic195-t', folder: 'fotl-iconic195-t' },
  { productId: 'fotl-ladies-iconic195-t', folder: 'fotl-ladies-iconic195-t' },
  { productId: 'fotl-original-t', folder: 'fotl-original-t' },
  { productId: 'fotl-ladies-valueweight-t', folder: 'fotl-ladies-valueweight-t' },
];

const VIEWS = [
  { key: 'front', file: 'front.png' },
  { key: 'back', file: 'back.png' },
  { key: 'sleeve_left', file: 'sleeve-left.png' },
  { key: 'sleeve_right', file: 'sleeve-right.png' },
];

const THRESHOLD = 12;

async function measure(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  function px(x, y) {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  }

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
      if (dist(px(x, y)) > THRESHOLD) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  const toPct = (v, total) => Math.round((v / total) * 1000) / 10;
  return {
    x0: toPct(minX, width),
    y0: toPct(minY, height),
    x1: toPct(maxX, width),
    y1: toPct(maxY, height),
    imgW: width,
    imgH: height,
  };
}

const results = {};

for (const { productId, folder } of PRODUCT_IDS) {
  results[productId] = {};
  for (const view of VIEWS) {
    const filePath = path.join('public', 'products', folder, view.file);
    try {
      const box = await measure(filePath);
      results[productId][view.key] = box;
    } catch (err) {
      results[productId][view.key] = { error: err.message };
    }
  }
}

// Fertigen TS-Code ausgeben
let out = '';
for (const { productId } of PRODUCT_IDS) {
  out += `  '${productId}': {\n`;
  for (const view of VIEWS) {
    const b = results[productId][view.key];
    if (!b || b.error) {
      out += `    ${view.key}: /* FEHLER: ${b?.error ?? 'nicht gefunden'} */ { x0: 0, y0: 14, x1: 100, y1: 82 },\n`;
    } else {
      out += `    ${view.key}: { x0: ${b.x0}, y0: ${b.y0}, x1: ${b.x1}, y1: ${b.y1}, imgW: ${b.imgW}, imgH: ${b.imgH} },\n`;
    }
  }
  out += `  },\n`;
}

console.log(out);
