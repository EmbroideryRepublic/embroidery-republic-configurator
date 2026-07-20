/**
 * Generisches Ingestion-Skript: lädt für ein Spreadshirt-productType ALLE
 * 4 Ansichten (Vorne/Hinten/Ärmel links/Ärmel rechts) je Farbe herunter –
 * dort sind (anders als bei den meisten Großhändler-Quellen) auch die
 * Ärmelansichten echte, farblich passende Fotos, kein Model, keine
 * Umfärbung. Zuschnitt + einheitlicher Weißrand für optische Konsistenz
 * mit dem Rest des Katalogs.
 *
 * JOBS unten direkt anpassen (Ordnername, productType-ID, Farbliste als
 * {id, appearanceId}) und Skript erneut ausführen.
 *
 * Aufruf: node scripts/ingestSpreadshirtProduct.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_PRODUCTS = path.join(__dirname, '..', 'public', 'products');

const TARGET_W = 620;
const TARGET_H = 720;
const MARGIN_RATIO = 0.86;
const IMG_BASE = 'https://image.spreadshirtmedia.net/image-server/v1/productTypes';

async function resizeWithMargin(input) {
  const inner = await sharp(input)
    .resize(Math.round(TARGET_W * MARGIN_RATIO), Math.round(TARGET_H * MARGIN_RATIO), {
      fit: 'contain',
      background: '#ffffff',
    })
    .toBuffer();
  return sharp({
    create: { width: TARGET_W, height: TARGET_H, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// WICHTIGE LEKTION (Juli 2026): teamshirts.de-Landingpages verlinken teils
// GENERISCHE productTypes – die Seite "gildan-heavy-blend-hoodie" führte zu
// PT 1047, dessen Fotos byte-identisch mit unserem justhoods-college-hoodie
// (JH001) sind. Vor dem Verdrahten eines neuen Produkts IMMER
// scripts/checkDuplicateImages.mjs laufen lassen (Hash-Abgleich gegen alle
// bestehenden Ordner), sonst landen dieselben Fotos unter zwei Marken.
const JOBS = [
  // Gildan Heavy Blend Full-Zip Hoodie (Needen GN960): PT 1242, Farb-IDs
  // aus dem Apollo-State (produkt/maenner-heavyweight-kapuzenjacke/231,
  // "Marke: Gildan"). ACHTUNG: Schwarz existiert bei diesem PT nicht
  // (appearance 2 = Fallback-Render, per Hash-Vergleich mit ungültiger ID
  // verifiziert) → Navy ist der Anker. 4 echte Views visuell verifiziert.
  {
    folder: 'gildan-zip-hoodie',
    productType: 1242,
    anchor: 'navy',
    colors: [
      { id: 'navy', appearanceId: 348 },
      { id: 'grey', appearanceId: 231 },
      { id: 'red', appearanceId: 5 },
      { id: 'royal', appearanceId: 370 },
      { id: 'kelly-green', appearanceId: 92 },
      { id: 'burgundy', appearanceId: 708 },
      { id: 'bottle-green', appearanceId: 207 },
    ],
  },
];

const DEFAULT_VIEWS = { front: 1, back: 2, 'sleeve-left': 3, 'sleeve-right': 4 };

async function processJob(job) {
  const views = job.views ?? DEFAULT_VIEWS;
  for (const color of job.colors) {
    const outDir = path.join(PUBLIC_PRODUCTS, color.id === job.anchor ? job.folder : `${job.folder}-${color.id}`);
    await fs.mkdir(outDir, { recursive: true });

    for (const [viewName, viewId] of Object.entries(views)) {
      const url = `${IMG_BASE}/${job.productType}/views/${viewId}/appearances/${color.appearanceId}?width=1200&height=1600&backgroundColor=FFFFFF`;
      const raw = await fetchBuffer(url);
      const trimmed = await sharp(raw).trim({ threshold: 15 }).toBuffer();
      await fs.writeFile(path.join(outDir, `${viewName}.png`), await resizeWithMargin(trimmed));
    }

    for (const view of Object.keys(views)) {
      await sharp(path.join(outDir, `${view}.png`)).webp({ quality: 90 }).toFile(path.join(outDir, `${view}.webp`));
    }

    console.log(`Fertig: ${outDir}`);
  }
}

for (const job of JOBS) {
  await processJob(job);
}
