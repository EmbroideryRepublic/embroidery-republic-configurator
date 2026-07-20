/**
 * Misst je Produktfarb-Ordner den ECHTEN Stoffton aus dem front.png
 * (Abtastpunkt: 35% Bildbreite / 55% Bildhöhe – sicher auf dem Torso,
 * links neben eventuellen Reißverschlüssen/Knopfleisten) und generiert
 * src/config/products/measuredSwatchHexes.ts.
 *
 * Zweck: die kleinen Farb-Auswahlpunkte im Konfigurator sollen exakt den
 * Ton des jeweiligen Produktfotos zeigen – nicht den generischen
 * COLOR_META-Ton, der je Marke leicht abweichen kann (z.B. "Royal" bei
 * Gildan vs. Neutral). colorHelpers.ts bevorzugt die gemessenen Werte
 * und fällt sonst auf COLOR_META zurück.
 *
 * Ausgeschlossen: zweifarbige Produkte (Kontrast-Kapuzen/Raglan-Ärmel) –
 * dort soll der Swatch die Akzentfarbe zeigen, die manuell gepflegt wird.
 *
 * Aufruf: node scripts/measureSwatchHexes.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'products');
const OUT_FILE = path.join(__dirname, '..', 'src', 'config', 'products', 'measuredSwatchHexes.ts');

/** Zweifarbige Produkte: Swatch = manuell gepflegte Akzentfarbe. */
const TWO_TONE_PREFIXES = ['fotl-baseball-t', 'fotl-baseball-longsleeve', 'justhoods-contrast-hoodie'];

const entries = {};
const dirs = (await fs.readdir(PRODUCTS_DIR, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const dir of dirs) {
  if (TWO_TONE_PREFIXES.some((p) => dir === p || dir.startsWith(`${p}-`))) continue;
  const file = path.join(PRODUCTS_DIR, dir, 'front.png');
  try {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const x = Math.round(info.width * 0.35);
    const y = Math.round(info.height * 0.55);
    // 5×5-Mittelwert statt Einzelpixel – robust gegen Stoffkörnung/Rauschen.
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const i = ((y + dy) * info.width + (x + dx)) * info.channels;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    const hex =
      '#' +
      [r, g, b]
        .map((v) => Math.round(v / n).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    entries[dir] = hex;
  } catch {
    // Ordner ohne front.png (Altbestände) überspringen.
  }
}

const lines = Object.entries(entries)
  .map(([dir, hex]) => `  '${dir}': '${hex}',`)
  .join('\n');

await fs.writeFile(
  OUT_FILE,
  `/**
 * AUTO-GENERIERT von scripts/measureSwatchHexes.mjs – NICHT von Hand
 * bearbeiten, sondern das Skript erneut laufen lassen (z.B. nach neuen
 * Produkt-Ingestionen).
 *
 * Je Produktfarb-Ordner der aus dem echten front.png gemessene Stoffton
 * (5×5-Pixel-Mittelwert bei 35%/55% der Bildfläche). Wird von
 * colorHelpers.ts als Swatch-Farbe bevorzugt; Ordner ohne Eintrag fallen
 * auf COLOR_META zurück (u.a. zweifarbige Produkte, deren Akzentfarbe
 * manuell gepflegt wird).
 */
export const MEASURED_SWATCH_HEX: Record<string, string> = {
${lines}
};
`
);

console.log(`Gemessen: ${Object.keys(entries).length} Ordner → ${path.relative(process.cwd(), OUT_FILE)}`);
