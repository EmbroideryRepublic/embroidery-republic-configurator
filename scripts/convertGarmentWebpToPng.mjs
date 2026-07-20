/**
 * Einmaliges (bei Bedarf wiederholbares) Vorbereitungsskript für das
 * serverseitige Druckvorschau-Rendering (src/lib/rendering/): erzeugt
 * neben jeder Produktfoto-.webp-Datei ein PNG-Geschwister, OHNE das
 * Original zu löschen.
 *
 * Grund: resvg (SVG-Rasterisierung im Rendering-Modul) kann eingebettete
 * WebP-Bilder nicht dekodieren (liefert stillschweigend ein leeres Bild,
 * siehe Testlauf) – PNG funktioniert dagegen einwandfrei. Der Browser-
 * Editor nutzt weiterhin die .webp-Dateien (Next.js' eigene Bildoptimierung),
 * das PNG ist ausschließlich ein Server-Render-Asset.
 *
 * Erneut ausführen, wenn ein neues "-real"-Produktfoto zu
 * src/config/products.ts hinzugefügt wird (siehe realPhotoColorSet()).
 *
 * Aufruf: node scripts/convertGarmentWebpToPng.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PRODUCTS_DIR = path.join(process.cwd(), 'public', 'products');

async function findWebpFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findWebpFiles(fullPath)));
    } else if (entry.name.endsWith('.webp')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const webpFiles = await findWebpFiles(PRODUCTS_DIR);
  console.log(`${webpFiles.length} .webp-Dateien gefunden.`);

  let converted = 0;
  let skipped = 0;
  for (const webpPath of webpFiles) {
    const pngPath = webpPath.replace(/\.webp$/, '.png');
    try {
      await stat(pngPath);
      skipped++;
      continue;
    } catch {
      // PNG existiert noch nicht -> konvertieren
    }
    await sharp(webpPath).png().toFile(pngPath);
    converted++;
  }
  console.log(`Fertig: ${converted} neu konvertiert, ${skipped} bereits vorhanden.`);
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exitCode = 1;
});
