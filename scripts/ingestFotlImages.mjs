/**
 * Einmaliges Ingestion-Skript für neu einsortierte Fruit-of-the-Loom-
 * Produktfotos (und künftige Marken mit demselben Muster): die Rohdaten
 * liefern pro Farbe nur front/back/sleeve-left (das dritte Foto ist eine
 * Seitenansicht des ganzen Kleidungsstücks, keine sleeve_right-Aufnahme
 * existiert je – exakt wie bei den bestehenden "-real"-Produkten, siehe
 * src/config/products/colorHelpers.ts). Dieses Skript ergänzt:
 *   1. sleeve-right.png = horizontal gespiegeltes sleeve-left.png
 *   2. .webp-Geschwister aller 4 Ansichten (Browser-Canvas nutzt .webp,
 *      siehe realPhotoColorSet() – umgekehrte Richtung zu
 *      convertGarmentWebpToPng.mjs, da hier PNG die Quelle ist)
 *
 * Läuft nur über Ordner, die front.png/back.png/sleeve-left.png bereits
 * enthalten (manuell einsortiert) und überspringt Ansichten, deren Ziel-
 * datei schon existiert (idempotent, sicher erneut ausführbar).
 *
 * Aufruf: node scripts/ingestFotlImages.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PRODUCTS_DIR = path.join(process.cwd(), 'public', 'products');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const entries = await readdir(PRODUCTS_DIR, { withFileTypes: true });
  const fotlDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith('fotl-')).map((e) => e.name);

  console.log(`${fotlDirs.length} fotl-* Ordner gefunden.`);

  let flipped = 0;
  let webpConverted = 0;

  for (const dirName of fotlDirs) {
    const dir = path.join(PRODUCTS_DIR, dirName);
    const sleeveLeftPng = path.join(dir, 'sleeve-left.png');
    const sleeveRightPng = path.join(dir, 'sleeve-right.png');

    if ((await exists(sleeveLeftPng)) && !(await exists(sleeveRightPng))) {
      await sharp(sleeveLeftPng).flop().toFile(sleeveRightPng);
      flipped++;
    }

    for (const view of ['front', 'back', 'sleeve-left', 'sleeve-right']) {
      const pngPath = path.join(dir, `${view}.png`);
      const webpPath = path.join(dir, `${view}.webp`);
      if ((await exists(pngPath)) && !(await exists(webpPath))) {
        await sharp(pngPath).webp({ quality: 90 }).toFile(webpPath);
        webpConverted++;
      }
    }
  }

  console.log(`Fertig: ${flipped} sleeve-right.png gespiegelt, ${webpConverted} .webp erzeugt.`);
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exitCode = 1;
});
