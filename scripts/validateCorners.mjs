/**
 * Wächter gegen ein wiederkehrendes Kalibrierungsproblem (gefunden und
 * behoben 2026-08-09): eine rechteckige Bewegungsbereich-Box kann bei
 * ausreichender Breite über die schräge Schulterlinie hinausragen – am
 * Bild sichtbar als Box-Ecke oberhalb des Kragens, im Kunden-Canvas exakt
 * so sichtbar (derselbe Referenzscan wird für jede Größe wiederverwendet,
 * nur die Box-Koordinaten skalieren).
 *
 * Prüft für JEDES Produkt/JEDE Ansicht OBJEKTIV per Pixel-Kontur (nicht
 * nach Augenmaß): liegen die OBEREN ECKEN der Box (x0/y0 und x1/y0)
 * tatsächlich auf Stoff?
 *
 * Prüft die GRÖSSTE verfügbare Größe je Produkt – dort ist x0/x1 am
 * breitesten, während y0 größenunabhängig am Kragen verankert bleibt
 * (siehe BEREICH_KORREKTUR-Kommentar in generatePrintAreaData.mts), also
 * der ungünstigste Fall. Meldet je Verletzung, bei welcher Zeile die Box
 * tatsächlich auf Stoff läge (informativ – für eine echte Korrektur meist
 * besser: x0/x1 zusätzlich etwas verengen statt nur y0 zu senken, sonst
 * kann bei sehr breiten Boxen fast die ganze Fläche verloren gehen).
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/validateCorners.mjs
 * Nach jeder Änderung an BEREICH_KORREKTUR (generatePrintAreaData.mts) oder
 * EXCLUSION_ZONES-unabhängigen Flächenwerten erneut laufen lassen.
 */
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated.ts';
import { PRODUCTS } from '../src/config/products/index.ts';
import { resolveColorImages, PLATZHALTER_BILD } from '../src/lib/assets/index.ts';
import { zeilenProfil } from './analyzeGarmentContour.mjs';
import path from 'node:path';

/** Erste Farbe, die für DIESE Ansicht ein echtes (kein Platzhalter-)Foto hat. */
function echteFarbeFuerAnsicht(productId, colors, view) {
  for (const c of colors) {
    const url = resolveColorImages(productId, c.id)[view];
    if (url && url !== PLATZHALTER_BILD) return { colorId: c.id, url };
  }
  return null;
}

const GROESSEN_REIHENFOLGE = ['XXL', 'XL', 'L', 'M', 'S'];

function groessteGroesse(bySize) {
  if (!bySize) return null;
  for (const g of GROESSEN_REIHENFOLGE) {
    if (bySize[g]) return g;
  }
  const keys = Object.keys(bySize);
  return keys[0] ?? null;
}

const violations = [];
const checked = [];
const errors = [];

for (const [productId, views] of Object.entries(PRINT_AREA_DATA)) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) continue;
  for (const [view, a] of Object.entries(views)) {
    const g = groessteGroesse(a.bySize);
    const box = g ? { ...a, ...a.bySize[g] } : a;
    const { x0, x1, y0 } = box;

    const gefunden = echteFarbeFuerAnsicht(productId, p.colors, view);
    if (!gefunden) continue;
    const pf = path.join('public', gefunden.url.replace(/^\//, ''));

    let prof;
    try {
      prof = await zeilenProfil(pf);
    } catch (e) {
      errors.push(`${productId}-${view}: ${e.message}`);
      continue;
    }
    const { w, h, zeilen } = prof;

    const y0px = Math.round((y0 / 100) * (h - 1));
    const x0px = (x0 / 100) * w;
    const x1px = (x1 / 100) * w;

    const zeile = zeilen[Math.max(0, Math.min(h - 1, y0px))];
    const okAtY0 = zeile.breite > 0 && zeile.links <= x0px + 1 && zeile.rechts >= x1px - 1;

    checked.push(`${productId}-${view} (Größe ${g ?? '?'})`);

    if (!okAtY0) {
      // Suche abwärts die erste Zeile, an der beide Ecken auf Stoff liegen.
      let neueY = null;
      for (let y = y0px; y < h; y++) {
        const z = zeilen[y];
        if (z.breite > 0 && z.links <= x0px + 1 && z.rechts >= x1px - 1) {
          neueY = y;
          break;
        }
      }
      const neuesY0Percent = neueY !== null ? Number(((neueY / (h - 1)) * 100 + 1).toFixed(1)) : null;
      violations.push({
        productId,
        view,
        groesse: g,
        x0,
        x1,
        y0,
        vorschlagY0: neuesY0Percent,
        zeileLinks: Number(((zeile.links / w) * 100).toFixed(1)),
        zeileRechts: Number(((zeile.rechts / w) * 100).toFixed(1)),
      });
    }
  }
}

console.log(`Geprüft: ${checked.length} Ansichten`);
console.log(`Fehler beim Laden: ${errors.length}`);
errors.forEach((e) => console.log('  ' + e));
console.log(`\nVERLETZUNGEN (Ecke ragt über Stoffkante): ${violations.length}\n`);
for (const v of violations) {
  console.log(
    `${v.productId}-${v.view} (${v.groesse}): x${v.x0}-${v.x1} y0=${v.y0} -> Stoff bei y0 nur x${v.zeileLinks}-${v.zeileRechts} | Vorschlag y0=${v.vorschlagY0 ?? 'KEIN SICHERER WERT GEFUNDEN'}`
  );
}
