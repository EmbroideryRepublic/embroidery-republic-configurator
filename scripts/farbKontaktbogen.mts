/**
 * Kontaktbogen über die Farben EINES Produkts: alle Vorderansichten
 * nebeneinander, jede mit ihrem Farbnamen und dem Katalog-Hex als Balken.
 *
 * Zweck ist die Sichtkontrolle nach einem Import. Der Farbabstand (ΔE) allein
 * verurteilt nichts – Fotos sind dunkler als flache Katalogwerte, und mehrere
 * Katalog-Hex-Werte sind nachweislich falsch. Was man SEHEN muss: zeigt jede
 * Kachel dasselbe Kleidungsstück, und passt die Farbe zum Namen?
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/farbKontaktbogen.mts <productId> [<productId> …]
 *   → docs/kontaktbogen/<productId>.png
 */
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const KACHEL = 190;
const BALKEN = 26;
const SPALTEN = 8;
const ZIEL = join(process.cwd(), 'docs', 'kontaktbogen');

/** Browser-Pfad (.webp) → Datei auf der Platte (.png-Geschwister für sharp). */
const datei = (pfad: string) => join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));

const beschriftung = (text: string, hex: string) =>
  Buffer.from(
    `<svg width="${KACHEL}" height="${BALKEN}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${KACHEL}" height="${BALKEN}" fill="#fff"/>
       <rect x="2" y="4" width="18" height="18" fill="${hex}" stroke="#999"/>
       <text x="25" y="18" font-family="sans-serif" font-size="11" fill="#222">${
         text.replace(/[<&]/g, '')
       }</text>
     </svg>`
  );

for (const id of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) {
    console.log(`${id}: unbekannt`);
    continue;
  }
  const farben = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  if (!farben.length) {
    console.log(`${id}: keine echten Fotos`);
    continue;
  }
  const zeilen = Math.ceil(farben.length / SPALTEN);
  const teile: sharp.OverlayOptions[] = [];

  for (const [i, c] of farben.entries()) {
    const pfad = ASSET_MANIFEST[p.id]![c.id]!.views.front;
    const quelle = pfad ? datei(pfad) : undefined;
    const x = (i % SPALTEN) * KACHEL;
    const y = Math.floor(i / SPALTEN) * (KACHEL + BALKEN);
    if (quelle && existsSync(quelle)) {
      teile.push({
        input: await sharp(quelle).resize(KACHEL, KACHEL, { fit: 'contain', background: '#fff' }).png().toBuffer(),
        left: x,
        top: y,
      });
    }
    teile.push({ input: beschriftung(`${c.name} ${c.hex}`, c.hex), left: x, top: y + KACHEL });
  }

  mkdirSync(ZIEL, { recursive: true });
  const aus = join(ZIEL, `${id}.png`);
  await sharp({
    create: {
      width: SPALTEN * KACHEL,
      height: zeilen * (KACHEL + BALKEN),
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite(teile)
    .png()
    .toFile(aus);
  console.log(`${farben.length} Farben → ${aus}`);
}
