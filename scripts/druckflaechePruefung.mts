/**
 * Liegt die gespeicherte Druckfläche bei JEDER wählbaren Farbe wirklich auf
 * Stoff? Misst je Farbe die Stoffkanten in den Zeilen der Fläche und meldet,
 * wie weit die Fläche darüber hinausragt.
 *
 * Verwendet bewusst DIESELBE Konturerkennung wie der Generator
 * (`analyzeGarmentContour`). Eine eigene, gröbere Schwelle hatte hier reihenweise
 * weiße Kleidungsstücke gemeldet, die in Wahrheit sauber vermessen waren – eine
 * Prüfung, die anders misst als das Geprüfte, prüft nichts.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/druckflaechePruefung.mts [--produkt id] [--ansicht front] [--toleranz 1.0]
 *
 * Exit 1, wenn ein Überstand über der Toleranz bleibt.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
import { waehlbareFarben } from '../src/lib/products/farben.ts';

function flag(n: string) {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const nur = flag('--produkt');
const ansicht = flag('--ansicht') ?? 'front';
const tol = Number(flag('--toleranz')) || 1.0;

// Ärmelansichten sind absichtlich KEIN enger Rahmen: Dort darf das Motiv über
// das ganze Kleidungsstück bewegt werden (die Motivgröße bleibt über
// maxWidthCm/maxHeightCm auf Oberarmmaß gedeckelt). Ein Überstand über die
// Stoffkante ist dort also keine Aussage über Richtig oder Falsch – die Prüfung
// gilt für Vorder- und Rückseite.
if (ansicht.startsWith('sleeve')) {
  console.log(`Ansicht "${ansicht}" ist ein Bewegungsbereich ueber das ganze Kleidungsstueck – hier nicht pruefbar.`);
  process.exit(0);
}

const befunde: { id: string; farbe: string; ueber: number; seite: string }[] = [];
let geprueft = 0;

for (const p of PRODUCTS) {
  if (nur && p.id !== nur) continue;
  const a = PRINT_AREA_DATA[p.id]?.[ansicht as 'front'];
  if (!a) continue;
  for (const c of waehlbareFarben(p.id, p.colors)) {
    const pfad = ASSET_MANIFEST[p.id]?.[c.id]?.views?.[ansicht];
    if (!pfad || pfad.includes('_platzhalter')) continue;
    const f = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
    if (!existsSync(f)) continue;
    const prof = await zeilenProfil(f);
    geprueft++;
    const y0 = Math.round((a.y0 / 100) * prof.h);
    const y1 = Math.round((a.y1 / 100) * prof.h);
    // Denselben Saum-Toleranzbereich ausnehmen, den der Generator beim
    // Platzieren der Fläche bereits anwendet (generatePrintAreaData.mts):
    // Der Stoff läuft am unteren Rand in einer Kurve zusammen, das ist keine
    // seitliche Begrenzung. Ohne diesen Gleichlauf meldet die Prüfung genau
    // die letzten Pixel vor dem Saum als „Überstand", obwohl der Generator sie
    // absichtlich schon ausgenommen hat – eine Prüfung, die strenger misst als
    // das, wonach die Fläche gebaut wurde, prüft am Ergebnis vorbei.
    const bel = prof.zeilen.filter((z) => z.breite > 0);
    const saumAb = bel.length ? bel[bel.length - 1]!.y - Math.round(prof.h * 0.03) : Infinity;
    // Ebenso das PERZENTIL statt des strikten Extremwerts: Der Generator
    // toleriert vereinzelte Ausreißerzeilen (Falte, Schatten) und hält nur
    // eine anhaltende Verengung für eine echte Kante. Sammelt zunächst alle
    // Zeilen, wertet danach aus – so bleibt exakt dieselbe Regel wie dort.
    const werte: { l: number; r: number }[] = [];
    for (let y = y0; y < Math.min(y1, saumAb); y++) {
      const z = prof.zeilen[y];
      if (!z || z.breite === 0) continue;
      werte.push({ l: z.links, r: z.rechts });
    }
    if (werte.length > 20) {
      const linksSortiert = [...werte].sort((x, y) => x.l - y.l);
      const rechtsSortiert = [...werte].sort((x, y) => x.r - y.r);
      const engL = linksSortiert[Math.floor(linksSortiert.length * 0.98)]!.l;
      const engR = rechtsSortiert[Math.floor(rechtsSortiert.length * 0.02)]!.r;
      const ueberL = ((engL - (a.x0 / 100) * prof.w) / prof.w) * 100;
      const ueberR = (((a.x1 / 100) * prof.w - engR) / prof.w) * 100;
      if (ueberL > tol) befunde.push({ id: p.id, farbe: c.id, ueber: ueberL, seite: 'links' });
      if (ueberR > tol) befunde.push({ id: p.id, farbe: c.id, ueber: ueberR, seite: 'rechts' });
    }
  }
}

befunde.sort((a, b) => b.ueber - a.ueber);
console.log(
  `${geprueft} Ansichten geprueft (${ansicht}) · ${befunde.length} Faelle mit Ueberstand ueber die Stoffkante (> ${tol} % der Bildbreite)\n`
);
for (const b of befunde.slice(0, 50)) {
  console.log(`  ${b.ueber.toFixed(1)}%  ${b.seite.padEnd(7)} ${b.id} / ${b.farbe}`);
}
if (befunde.length > 50) console.log(`  … und ${befunde.length - 50} weitere`);
if (befunde.length) process.exit(1);
