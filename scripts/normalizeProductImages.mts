/**
 * Vereinheitlicht die RAHMUNG der Farbvarianten eines Produkts.
 *
 * ── Warum ─────────────────────────────────────────────────────────────
 * Der Konfigurator führt EINE Druckfläche je Produkt und Ansicht, definiert
 * in Prozent der Bildkante. Das ist nur korrekt, wenn alle Farbvarianten das
 * Kleidungsstück an derselben Stelle und in derselben Größe zeigen. Bei Fruit
 * of the Loom ist jede Farbe einzeln fotografiert: gemessen wandert die
 * Kleidungsstückmitte über die Varianten um bis zu 8 % der Bildbreite, die
 * Breite um bis zu 54 %. Eine Fläche kann dann nicht in allen Farben mittig
 * sitzen – nachweisbar an derselben Fläche, die auf „Solar Yellow" mittig
 * liegt und auf „Weiß" 4,95 % daneben.
 *
 * ── Was passiert ──────────────────────────────────────────────────────
 * Jede Variante wird SO VERSCHOBEN UND SKALIERT, dass ihr Kleidungsstück
 * dieselbe Höhe, dieselbe Mitte und dieselbe Oberkante hat wie die Referenz
 * (Median über alle Varianten derselben Ansicht).
 *
 * Der BILDINHALT bleibt unangetastet: keine Farbänderung, keine Retusche,
 * keine erzeugten Pixel. Verändert werden ausschließlich Lage und Maßstab
 * innerhalb des unveränderten Bildrahmens.
 *
 * ── Grenzen ───────────────────────────────────────────────────────────
 * Bilder, deren Kontur den Bildrand berührt (angeschnittenes Kleidungsstück),
 * werden ÜBERSPRUNGEN: Bei ihnen ist die wahre Ausdehnung nicht bekannt, eine
 * Ausrichtung daran wäre geraten. Sie werden am Ende aufgelistet.
 *
 * PNG und WebP werden gemeinsam geschrieben – der Flächengenerator liest PNG,
 * die Anwendung WebP; ein Auseinanderdriften wäre ein stiller Fehler.
 *
 * Aufruf:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/normalizeProductImages.mts --marke "Fruit of the Loom"
 *   ... --produkt fotl-valueweight-t
 *   ... --alle
 *   ... --dry     (nur berichten, nichts schreiben)
 */
import sharp from 'sharp';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import type { PrintView } from '../src/types';

const VIEWS: PrintView[] = ['front', 'back', 'sleeve_left', 'sleeve_right'];
const TOLERANZ = 6; // siehe analyzeGarmentContour.mjs – weiße Ware auf Weiß

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : null;
}
const DRY = process.argv.includes('--dry');

interface Lage {
  url: string;
  png: string | null;
  webp: string | null;
  quelle: string;
  w: number;
  h: number;
  /** Kleidungsstück im Bild */
  oben: number;
  unten: number;
  mitteX: number;
  hoehe: number;
  amRand: boolean;
}

async function lageVon(url: string): Promise<Lage | null> {
  const basis = path.join('public', url.replace(/^\//, '')).replace(/\.(webp|png)$/, '');
  const png = existsSync(`${basis}.png`) ? `${basis}.png` : null;
  const webp = existsSync(`${basis}.webp`) ? `${basis}.webp` : null;
  const quelle = png ?? webp;
  if (!quelle) return null;

  const { w, h, zeilen } = await zeilenProfil(quelle, TOLERANZ);
  const belegt = zeilen.filter((z) => z.breite > 0);
  if (belegt.length === 0) return null;

  const oben = belegt[0]!.y;
  const unten = belegt[belegt.length - 1]!.y;

  // Waagerechte Mitte aus dem TORSO (unteres Drittel), nicht aus der
  // Gesamt-Bounding-Box: Ärmelstellung und Kapuze verzerren die Box, der
  // Torso ist der stabile Bezug.
  const torso = zeilen.slice(oben + Math.round((unten - oben) * 0.6), unten - 10).filter((z) => z.breite > 0);
  const bezug = torso.length > 0 ? torso : belegt;
  const mitteX = bezug.reduce((s, z) => s + (z.links + z.rechts) / 2, 0) / bezug.length;

  // „Angeschnitten" heißt: das Kleidungsstück läuft über eine nennenswerte
  // Strecke aus dem Bild. Ein einzelnes Randpixel ist Rauschen der
  // Konturerkennung und darf das Bild nicht disqualifizieren – geprüft an
  // FOTL: mit der Ein-Zeilen-Regel galten 33 Bilder als angeschnitten,
  // stichprobenhaft nachgesehen war das Kleidungsstück vollständig im Bild.
  const randZeilen = belegt.filter((z) => z.links <= 1 || z.rechts >= w - 2).length;
  const amRand = oben <= 1 || unten >= h - 2 || randZeilen > belegt.length * 0.02;

  return { url, png, webp, quelle, w, h, oben, unten, mitteX, hoehe: unten - oben + 1, amRand };
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

const marke = arg('marke');
const produktId = arg('produkt');
const alle = process.argv.includes('--alle');

const ziel = PRODUCTS.filter((p) =>
  produktId ? p.id === produktId : marke ? p.brand === marke : alle
);
if (ziel.length === 0) {
  console.error('Keine Produkte ausgewählt (--marke / --produkt / --alle).');
  process.exit(1);
}

const uebersprungen: string[] = [];
let angepasst = 0;
let unveraendert = 0;

for (const p of ziel) {
  for (const view of VIEWS) {
    if (p.hasSleeves === false && view.startsWith('sleeve')) continue;

    const lagen: Lage[] = [];
    for (const c of p.colors) {
      const url = c.images[view];
      if (!url) continue;
      const l = await lageVon(url);
      if (!l) continue;
      if (l.amRand) {
        uebersprungen.push(`${p.id}/${view}/${c.id}: Kontur am Bildrand`);
        continue;
      }
      lagen.push(l);
    }
    if (lagen.length < 2) continue;

    // Referenz = Median. Die Zielhöhe wird zusätzlich auf die KLEINSTE
    // vorhandene Höhe gedeckelt, damit ausschließlich verkleinert wird –
    // Vergrößern würde interpolieren und das Bild weichzeichnen.
    const refHoehe = Math.min(median(lagen.map((l) => l.hoehe)), Math.min(...lagen.map((l) => l.hoehe)));
    const refMitteXAnteil = median(lagen.map((l) => l.mitteX / l.w));
    const refObenAnteil = median(lagen.map((l) => l.oben / l.h));

    for (const l of lagen) {
      const skala = refHoehe / l.hoehe;
      const zielMitteX = refMitteXAnteil * l.w;
      const zielOben = refObenAnteil * l.h;

      // Verschiebung NACH der Skalierung (Skalierung bezieht sich auf 0,0)
      const dx = Math.round(zielMitteX - l.mitteX * skala);
      const dy = Math.round(zielOben - l.oben * skala);

      const nahezuIdentisch = Math.abs(skala - 1) < 0.004 && Math.abs(dx) < 2 && Math.abs(dy) < 2;
      if (nahezuIdentisch) {
        unveraendert++;
        continue;
      }

      if (DRY) {
        console.log(
          `${p.id}/${view}/${path.basename(path.dirname(l.quelle))}: Skala ${skala.toFixed(3)} dx ${dx} dy ${dy}`
        );
        angepasst++;
        continue;
      }

      // Hintergrundfarbe aus der Ecke übernehmen, damit der eingefügte Rand
      // nahtlos an das vorhandene Freistellungsweiß anschließt.
      const ecke = await sharp(l.quelle).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
      const [r, g, b, a] = [ecke.data[0]!, ecke.data[1]!, ecke.data[2]!, ecke.info.channels === 4 ? ecke.data[3]! : 255];

      const skaliert = await sharp(l.quelle)
        .resize({
          width: Math.max(1, Math.round(l.w * skala)),
          height: Math.max(1, Math.round(l.h * skala)),
          fit: 'fill',
          kernel: 'lanczos3',
        })
        .toBuffer();

      const leinwand = sharp({
        create: { width: l.w, height: l.h, channels: 4, background: { r, g, b, alpha: a / 255 } },
      }).composite([{ input: skaliert, left: dx, top: dy }]);

      const fertig = await leinwand.png().toBuffer();
      if (l.png) await sharp(fertig).png().toFile(l.png);
      if (l.webp) await sharp(fertig).webp({ quality: 92 }).toFile(l.webp);
      angepasst++;
    }
  }
  process.stderr.write(`\r  ${p.id}                    `);
}
process.stderr.write('\n');

console.log(`\nangepasst    : ${angepasst}${DRY ? ' (Probelauf, nichts geschrieben)' : ''}`);
console.log(`unverändert  : ${unveraendert}`);
console.log(`übersprungen : ${uebersprungen.length}`);
for (const u of uebersprungen.slice(0, 30)) console.log(`   ${u}`);
if (uebersprungen.length > 30) console.log(`   … und ${uebersprungen.length - 30} weitere`);
