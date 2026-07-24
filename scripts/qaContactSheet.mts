/**
 * Fügt die Canvas-Screenshots zu Kontaktbögen zusammen.
 *
 * Ein Bogen je Ansicht zeigt ALLE Produkte nebeneinander. Erst dadurch fällt
 * auf, was am Einzelbild unsichtbar bleibt: dass eine Fläche im Vergleich zu
 * den anderen Produkten zu hoch, zu schmal oder außermittig sitzt. Die
 * Beurteilung „wirkt das professionell?" ist eine Vergleichsfrage.
 *
 * Aufruf:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/qaContactSheet.mts [--in verz] [--spalten 6]
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const IN = arg('in', 'qa-screenshots/canvas');
const OUT = arg('out', 'qa-screenshots/sheets');
const SPALTEN = Number(arg('spalten', '6'));
const ZELLE_B = Number(arg('zelle', '300'));
const BESCHRIFTUNG = 26;

mkdirSync(OUT, { recursive: true });

const dateien = readdirSync(IN).filter((f) => f.endsWith('.png'));

/** Gruppierung: <produkt>__<view>__<farbe>.png */
const proView = new Map<string, { produkt: string; farbe: string; datei: string }[]>();
for (const f of dateien) {
  const m = f.replace(/\.png$/, '').split('__');
  if (m.length !== 3) continue;
  const [produkt, view, farbe] = m as [string, string, string];
  if (!proView.has(view)) proView.set(view, []);
  proView.get(view)!.push({ produkt, farbe, datei: path.join(IN, f) });
}

for (const [view, liste] of proView) {
  liste.sort((a, b) => a.produkt.localeCompare(b.produkt));

  const zellenB = ZELLE_B;
  const zellenH = Math.round(ZELLE_B * 1.2) + BESCHRIFTUNG;
  const spalten = Math.min(SPALTEN, liste.length);
  const zeilen = Math.ceil(liste.length / spalten);
  const breite = spalten * zellenB;
  const hoehe = zeilen * zellenH;

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < liste.length; i++) {
    const eintrag = liste[i]!;
    const cx = (i % spalten) * zellenB;
    const cy = Math.floor(i / spalten) * zellenH;

    const bild = await sharp(eintrag.datei)
      .resize(zellenB - 8, zellenH - BESCHRIFTUNG - 8, { fit: 'contain', background: '#ffffff' })
      .toBuffer();

    composites.push({ input: bild, left: cx + 4, top: cy + 4 });

    const label = `${eintrag.produkt}`.replace(/&/g, '&amp;');
    const svg = `<svg width="${zellenB}" height="${BESCHRIFTUNG}" xmlns="http://www.w3.org/2000/svg">
      <text x="${zellenB / 2}" y="17" font-family="sans-serif" font-size="11"
            text-anchor="middle" fill="#111">${label}</text>
    </svg>`;
    composites.push({ input: Buffer.from(svg), left: cx, top: cy + zellenH - BESCHRIFTUNG });
  }

  const ziel = path.join(OUT, `sheet-${view}.png`);
  await sharp({
    create: { width: breite, height: hoehe, channels: 3, background: '#f4f4f4' },
  })
    .composite(composites)
    .png()
    .toFile(ziel);

  console.log(`${ziel}  (${liste.length} Kacheln, ${spalten}x${zeilen})`);
}
