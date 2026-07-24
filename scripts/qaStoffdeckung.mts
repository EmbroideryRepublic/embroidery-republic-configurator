/**
 * Prüft, ob der Bewegungsbereich WIRKLICH auf Stoff liegt – Zeile für Zeile,
 * über die volle Breite der Fläche.
 *
 * ── Warum zusätzlich zu qaContourAudit ────────────────────────────────
 * Das Konturaudit vergleicht die Fläche mit der ÄUSSEREN Silhouette, also von
 * der äußeren Ärmelkante zur äußeren Ärmelkante. Löcher INNERHALB der
 * Silhouette sieht es nicht. Genau dort lag ein realer Fehler: Bei
 * Zip-Hoodies hängen die Ärmel unten neben dem Rumpf, dazwischen liegt
 * Hintergrund – die Flächenecken lagen in diesem Spalt, und das Audit meldete
 * trotzdem 0 % Überlauf.
 *
 * Dieses Skript misst deshalb die tatsächliche Stoffdeckung: Wie viel Prozent
 * der Flächenfläche liegt auf Stoff? Alles unter 100 % bedeutet, dass ein
 * Motiv dort auf Hintergrund platziert werden könnte.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/qaStoffdeckung.mts [--min 99.5]
 */
import sharp from 'sharp';
import path from 'node:path';
import { PRODUCTS } from '../src/config/products/index';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated';
import type { PrintView } from '../src/types';

const VIEWS: PrintView[] = ['front', 'back', 'sleeve_left', 'sleeve_right'];
const HG_TOL = 6;

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}
const MIN = Number(arg('min', '99.5'));

interface Treffer {
  produkt: string;
  view: PrintView;
  farbe: string;
  deckung: number;
  /** Zeile mit der schlechtesten Deckung, in % der Bildhöhe. */
  schlechtesteZeile: number;
  zeilenDeckung: number;
}

const treffer: Treffer[] = [];
let geprueft = 0;

for (const p of PRODUCTS) {
  const views = (p.hasSleeves ?? true) ? VIEWS : VIEWS.filter((v) => !v.startsWith('sleeve'));
  for (const view of views) {
    const a = PRINT_AREA_DATA[p.id]?.[view];
    if (!a) continue;

    for (const c of p.colors) {
      const url = c.images[view];
      if (!url) continue;
      const pf = path.join('public', url.replace(/^\//, ''));

      let raw;
      try {
        raw = await sharp(pf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      } catch {
        continue;
      }
      const { data, info } = raw;
      const { width: w, height: h, channels: ch } = info;
      const bg = [data[0]!, data[1]!, data[2]!];

      const x0 = Math.max(0, Math.round((a.x0 / 100) * w));
      const x1 = Math.min(w - 1, Math.round((a.x1 / 100) * w));
      const y0 = Math.max(0, Math.round((a.y0 / 100) * h));
      const y1 = Math.min(h - 1, Math.round((a.y1 / 100) * h));

      let stoff = 0;
      let gesamt = 0;
      let schlechteste = 100;
      let schlechtesteY = 0;

      for (let y = y0; y <= y1; y++) {
        let zeileStoff = 0;
        let zeileGesamt = 0;
        for (let x = x0; x <= x1; x++) {
          const i = (y * w + x) * ch;
          const d =
            Math.abs(data[i]! - bg[0]!) + Math.abs(data[i + 1]! - bg[1]!) + Math.abs(data[i + 2]! - bg[2]!);
          const istStoff = data[i + 3]! > 64 && d > HG_TOL * 3;
          if (istStoff) { stoff++; zeileStoff++; }
          gesamt++; zeileGesamt++;
        }
        const zd = zeileGesamt > 0 ? (zeileStoff / zeileGesamt) * 100 : 100;
        if (zd < schlechteste) { schlechteste = zd; schlechtesteY = (y / h) * 100; }
      }

      const deckung = gesamt > 0 ? (stoff / gesamt) * 100 : 0;
      geprueft++;
      if (deckung < MIN) {
        treffer.push({
          produkt: p.id, view, farbe: c.name,
          deckung: +deckung.toFixed(2),
          schlechtesteZeile: +schlechtesteY.toFixed(1),
          zeilenDeckung: +schlechteste.toFixed(1),
        });
      }
    }
    process.stderr.write(`\r  ${geprueft} geprüft   `);
  }
}
process.stderr.write('\n');

console.log(`\n=== STOFFDECKUNG DES BEWEGUNGSBEREICHS ===`);
console.log(`geprüfte Kombinationen : ${geprueft}`);
console.log(`unter ${MIN} % Deckung     : ${treffer.length}`);

// Nach Produkt+Ansicht verdichten – eine Zeile je betroffener Fläche.
const proFlaeche = new Map<string, Treffer[]>();
for (const t of treffer) {
  const k = `${t.produkt}|${t.view}`;
  if (!proFlaeche.has(k)) proFlaeche.set(k, []);
  proFlaeche.get(k)!.push(t);
}

const zeilen = [...proFlaeche.entries()]
  .map(([k, ts]) => {
    const [produkt, view] = k.split('|') as [string, string];
    const schlimmste = ts.reduce((a, b) => (a.deckung < b.deckung ? a : b));
    return {
      produkt, view,
      farben: `${ts.length}/${PRODUCTS.find((p) => p.id === produkt)?.colors.length ?? '?'}`,
      minDeckung: schlimmste.deckung,
      schlechtesteZeile: schlimmste.schlechtesteZeile,
      zeilenDeckung: schlimmste.zeilenDeckung,
    };
  })
  .sort((a, b) => a.minDeckung - b.minDeckung);

if (zeilen.length > 0) console.table(zeilen);
else console.log('Alle Flächen liegen vollständig auf Stoff.');
