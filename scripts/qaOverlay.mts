/**
 * Zeichnet Druckfläche + erkannte Stoffkontur in das echte Produktfoto.
 *
 * Dient als Beweisbild: Es zeigt in EINEM Bild, ob die Fläche auf dem Stoff
 * liegt, ob die Seitenabstände gleich sind und ob die Konturerkennung
 * überhaupt getroffen hat. Ohne dieses Bild lässt sich nicht unterscheiden,
 * ob eine gemeldete Abweichung ein echter Flächenfehler oder ein Messfehler
 * der Konturerkennung ist.
 *
 * Aufruf:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/qaOverlay.mts <produktId> <view> [farbIndex] [--out datei]
 */
import sharp from 'sharp';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import type { PrintView } from '../src/types';

const PUBLIC = path.resolve('public');

export async function overlay(produktId: string, view: PrintView, farbIndex = 0, outPath?: string) {
  const produkt = PRODUCTS.find((p) => p.id === produktId);
  if (!produkt) throw new Error(`Produkt unbekannt: ${produktId}`);
  const farbe = produkt.colors[farbIndex];
  if (!farbe) throw new Error(`Farbindex ${farbIndex} existiert nicht`);
  const bildUrl = farbe.images[view];
  if (!bildUrl) throw new Error(`Keine Bild-URL für ${view}`);

  const bildPfad = path.join(PUBLIC, bildUrl.replace(/^\//, ''));
  const flaeche = PRINT_AREA_DATA[produktId]?.[view];
  if (!flaeche) throw new Error(`Keine Fläche für ${produktId}/${view}`);

  // Engere Toleranz, sonst zerfällt die Kontur bei weißer Ware (siehe
  // analyzeGarmentContour.mjs).
  const { w, h, zeilen } = await zeilenProfil(bildPfad, 6);

  const ax0 = (flaeche.x0 / 100) * w;
  const ax1 = (flaeche.x1 / 100) * w;
  const ay0 = (flaeche.y0 / 100) * h;
  const ay1 = (flaeche.y1 / 100) * h;

  // Konturlinien als Polyline (nur belegte Zeilen, ausgedünnt).
  const linksPunkte: string[] = [];
  const rechtsPunkte: string[] = [];
  for (let y = 0; y < h; y += 2) {
    const z = zeilen[y];
    if (!z || z.breite === 0) continue;
    linksPunkte.push(`${z.links},${y}`);
    rechtsPunkte.push(`${z.rechts},${y}`);
  }

  const mitteKontur: string[] = [];
  for (let y = 0; y < h; y += 2) {
    const z = zeilen[y];
    if (!z || z.breite === 0) continue;
    mitteKontur.push(`${(z.links + z.rechts) / 2},${y}`);
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${linksPunkte.join(' ')}" fill="none" stroke="#00a000" stroke-width="2" opacity="0.85"/>
    <polyline points="${rechtsPunkte.join(' ')}" fill="none" stroke="#00a000" stroke-width="2" opacity="0.85"/>
    <polyline points="${mitteKontur.join(' ')}" fill="none" stroke="#00a000" stroke-width="1" stroke-dasharray="6,6" opacity="0.6"/>
    <rect x="${ax0}" y="${ay0}" width="${ax1 - ax0}" height="${ay1 - ay0}"
          fill="rgba(255,0,0,0.10)" stroke="#e00000" stroke-width="3"/>
    <line x1="${(ax0 + ax1) / 2}" y1="${ay0 - 20}" x2="${(ax0 + ax1) / 2}" y2="${ay1 + 20}"
          stroke="#e00000" stroke-width="1.5" stroke-dasharray="8,6"/>
    <line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="#0060ff" stroke-width="1" stroke-dasharray="3,7" opacity="0.7"/>
    <text x="8" y="24" font-family="sans-serif" font-size="18" fill="#000">${produktId} · ${view} · ${farbe.name}</text>
    <text x="8" y="46" font-family="sans-serif" font-size="14" fill="#008000">grün = erkannte Stoffkontur + deren Mitte</text>
    <text x="8" y="64" font-family="sans-serif" font-size="14" fill="#c00000">rot = Druckfläche + deren Mitte</text>
    <text x="8" y="82" font-family="sans-serif" font-size="14" fill="#0060ff">blau = Bildmitte</text>
  </svg>`;

  const out = outPath ?? `qa-screenshots/overlay/${produktId}-${view}-${farbe.id}.png`;
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp(bildPfad)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(out);
  return out;
}

if (process.argv[1]?.endsWith('qaOverlay.mts')) {
  const [, , produktId, view, idx] = process.argv;
  const outIdx = process.argv.indexOf('--out');
  const out = outIdx !== -1 ? process.argv[outIdx + 1] : undefined;
  const p = await overlay(produktId!, view as PrintView, idx ? Number(idx) : 0, out);
  console.log('geschrieben:', p);
}
