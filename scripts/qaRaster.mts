/**
 * Legt den aktuellen Bewegungsbereich UND ein Prozentraster über das
 * Produktfoto – die Ablesehilfe für manuelle Korrekturen.
 *
 * Die Prozentwerte beziehen sich auf das GESAMTE Bild, exakt wie
 * printAreaData.generated.ts (x0/y0/x1/y1). Was hier abgelesen wird, kann
 * unverändert als Korrekturwert eingetragen werden.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/qaRaster.mts <view> <id...>
 */
import sharp from 'sharp';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated';
import type { PrintView } from '../src/types';

const view = (process.argv[2] ?? 'front') as PrintView;
const ids = process.argv.slice(3);
mkdirSync('qa-screenshots/raster', { recursive: true });

const KACHEL_B = 430;
const KACHEL_H = 520;
const kacheln: Buffer[] = [];

for (const id of ids) {
  const p = PRODUCTS.find((x) => x.id === id);
  const a = PRINT_AREA_DATA[id]?.[view];
  if (!p || !a) { console.log(`${id}: keine Daten`); continue; }
  const url = p.colors[0]!.images[view];
  const pf = path.join('public', url.replace(/^\//, ''));
  const meta = await sharp(pf).metadata();
  const w = meta.width!, h = meta.height!;

  const linien: string[] = [];
  for (let pct = 0; pct <= 100; pct += 5) {
    const y = (pct / 100) * h;
    const stark = pct % 10 === 0;
    linien.push(
      `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1e90ff" stroke-width="${stark ? 1.6 : 0.8}" opacity="${stark ? 0.55 : 0.3}"/>` +
      (stark ? `<text x="3" y="${y - 3}" font-family="sans-serif" font-size="15" fill="#1e90ff">${pct}</text>` : '')
    );
    const x = (pct / 100) * w;
    linien.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1e90ff" stroke-width="${stark ? 1.6 : 0.8}" opacity="${stark ? 0.55 : 0.3}"/>` +
      (stark ? `<text x="${x + 3}" y="16" font-family="sans-serif" font-size="15" fill="#1e90ff">${pct}</text>` : '')
    );
  }

  const bx = (a.x0 / 100) * w, by = (a.y0 / 100) * h;
  const bw = ((a.x1 - a.x0) / 100) * w, bh = ((a.y1 - a.y0) / 100) * h;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${linien.join('')}
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(255,0,0,0.10)" stroke="#e00000" stroke-width="3"/>
    <text x="${w / 2}" y="${h - 8}" font-family="sans-serif" font-size="17" text-anchor="middle" fill="#000">${id}</text>
    <text x="${w / 2}" y="${h - 28}" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#c00000">x ${a.x0}–${a.x1}  y ${a.y0}–${a.y1}</text>
  </svg>`;

  const markiert = await sharp(pf).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  kacheln.push(await sharp(markiert).resize(KACHEL_B, KACHEL_H, { fit: 'contain', background: '#fff' }).png().toBuffer());
}

const spalten = Math.min(3, kacheln.length);
const zeilen = Math.ceil(kacheln.length / spalten);
const ziel = `qa-screenshots/raster/${view}.png`;
await sharp({ create: { width: spalten * KACHEL_B, height: zeilen * KACHEL_H, channels: 3, background: '#ffffff' } })
  .composite(kacheln.map((b, i) => ({ input: b, left: (i % spalten) * KACHEL_B, top: Math.floor(i / spalten) * KACHEL_H })))
  .png().toFile(ziel);
console.log(ziel, `(${kacheln.length} Kacheln)`);
