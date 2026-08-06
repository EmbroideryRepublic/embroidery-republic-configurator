/**
 * Liegt die gespeicherte Druckfläche bei JEDER Farbe eines Produkts wirklich
 * auf Stoff? Misst je Farbe die Stoffkanten in den Zeilen der Fläche und
 * meldet, wie weit die Fläche darüber hinausragt.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/druckflaechePruefung.mts [--produkt id] [--toleranz 1.0]
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

function flag(n: string) { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; }
const nur = flag('--produkt');
const tol = Number(flag('--toleranz')) || 1.0;

const befunde: { id: string; farbe: string; ueber: number; seite: string }[] = [];

for (const p of PRODUCTS) {
  if (nur && p.id !== nur) continue;
  const a = PRINT_AREA_DATA[p.id]?.front;
  if (!a) continue;
  for (const c of p.colors) {
    const pfad = ASSET_MANIFEST[p.id]?.[c.id]?.views?.front;
    if (!pfad) continue;
    const f = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
    if (!existsSync(f)) continue;
    const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: k } = info;
    let maxUeberL = 0, maxUeberR = 0;
    const y0 = Math.round((a.y0 / 100) * H), y1 = Math.round((a.y1 / 100) * H);
    for (let y = y0; y < y1; y += 2) {
      let links = -1, rechts = -1;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * k;
        if (!(data[i]! > 243 && data[i + 1]! > 243 && data[i + 2]! > 243)) { if (links < 0) links = x; rechts = x; }
      }
      if (links < 0) continue;
      maxUeberL = Math.max(maxUeberL, ((links - (a.x0 / 100) * W) / W) * 100);
      maxUeberR = Math.max(maxUeberR, (((a.x1 / 100) * W - rechts) / W) * 100);
    }
    if (maxUeberL > tol) befunde.push({ id: p.id, farbe: c.id, ueber: maxUeberL, seite: 'links' });
    if (maxUeberR > tol) befunde.push({ id: p.id, farbe: c.id, ueber: maxUeberR, seite: 'rechts' });
  }
}
befunde.sort((a, b) => b.ueber - a.ueber);
console.log(`${befunde.length} Faelle, in denen die Flaeche ueber die Stoffkante ragt (> ${tol}% der Bildbreite)\n`);
for (const b of befunde.slice(0, 40)) console.log(`  ${b.ueber.toFixed(1)}%  ${b.seite.padEnd(7)} ${b.id} / ${b.farbe}`);
