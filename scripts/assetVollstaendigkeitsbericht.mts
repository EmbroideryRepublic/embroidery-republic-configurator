/**
 * Asset-Vollständigkeitsbericht (Ist-Stand).
 *
 * Liest ausschließlich die Asset-Schicht (Manifest + Resolver) – die
 * Produktdefinition wird NICHT nach Bildern gefragt (ADR 0004). Berichtet je
 * Produkt/Farbe, welche Ansichten mit ECHTEN Fotos belegt sind, und klassifiziert:
 *   - vollstaendig:  jede Farbe hat mind. front + back als echtes Foto
 *   - teilweise:     mind. eine echte Ansicht, aber nicht überall front+back
 *   - platzhalter:   keine echten Fotos (Bildimport offen)
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/assetVollstaendigkeitsbericht.mts
 * Schreibt docs/asset-vollstaendigkeitsbericht.md.
 */
import { writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { resolveColorImages, PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

type Klasse = 'vollstaendig' | 'teilweise' | 'platzhalter';

function echteAnsichten(productId: string, colorId: string): string[] {
  const views = resolveColorImages(productId, colorId);
  return Object.entries(views)
    .filter(([, pfad]) => pfad && pfad !== PLATZHALTER_BILD)
    .map(([view]) => view);
}

interface ProduktBericht {
  id: string;
  name: string;
  brand: string;
  farben: number;
  farbenMitEchtenBildern: number;
  klasse: Klasse;
  ansichtenAbdeckung: Record<string, number>; // view → wie viele Farben es echt führen
  fehlendeRueckseite: number; // Farben mit front aber ohne back
}

const berichte: ProduktBericht[] = [];

for (const p of PRODUCTS) {
  const ansichtenAbdeckung: Record<string, number> = {};
  let farbenMitEchtenBildern = 0;
  let farbenMitFrontUndBack = 0;
  let fehlendeRueckseite = 0;

  for (const c of p.colors) {
    const views = echteAnsichten(p.id, c.id);
    if (views.length > 0) farbenMitEchtenBildern++;
    for (const v of views) ansichtenAbdeckung[v] = (ansichtenAbdeckung[v] ?? 0) + 1;
    const hatFront = views.includes('front');
    const hatBack = views.includes('back');
    if (hatFront && hatBack) farbenMitFrontUndBack++;
    else if (hatFront && !hatBack) fehlendeRueckseite++;
  }

  let klasse: Klasse;
  if (farbenMitEchtenBildern === 0) klasse = 'platzhalter';
  else if (farbenMitFrontUndBack === p.colors.length) klasse = 'vollstaendig';
  else klasse = 'teilweise';

  berichte.push({
    id: p.id,
    name: p.name,
    brand: p.brand,
    farben: p.colors.length,
    farbenMitEchtenBildern,
    klasse,
    ansichtenAbdeckung,
    fehlendeRueckseite,
  });
}

const vollstaendig = berichte.filter((b) => b.klasse === 'vollstaendig');
const teilweise = berichte.filter((b) => b.klasse === 'teilweise');
const platzhalter = berichte.filter((b) => b.klasse === 'platzhalter');
const farbenGesamt = berichte.reduce((n, b) => n + b.farben, 0);
const farbenMitBild = berichte.reduce((n, b) => n + b.farbenMitEchtenBildern, 0);

// Marken-Rollup
const proMarke = new Map<string, { produkte: number; vollstaendig: number; platzhalter: number }>();
for (const b of berichte) {
  const m = proMarke.get(b.brand) ?? { produkte: 0, vollstaendig: 0, platzhalter: 0 };
  m.produkte++;
  if (b.klasse === 'vollstaendig') m.vollstaendig++;
  if (b.klasse === 'platzhalter') m.platzhalter++;
  proMarke.set(b.brand, m);
}

const zeilen: string[] = [];
zeilen.push('# Asset-Vollständigkeitsbericht (Ist-Stand)');
zeilen.push('');
zeilen.push('> AUTO-GENERIERT von `scripts/assetVollstaendigkeitsbericht.mts` aus der Asset-Schicht');
zeilen.push('> (Manifest + Resolver). Basislinie VOR dem Herstellerimport.');
zeilen.push('');
zeilen.push('## Zusammenfassung');
zeilen.push('');
zeilen.push(`- **Produkte gesamt:** ${berichte.length}`);
zeilen.push(`- **Vollständig bebildert** (jede Farbe front+back als echtes Foto): **${vollstaendig.length}**`);
zeilen.push(`- **Teilweise bebildert:** **${teilweise.length}**`);
zeilen.push(`- **Nur Platzhalter** (Herstellerimport offen): **${platzhalter.length}**`);
zeilen.push(`- **Farben gesamt:** ${farbenGesamt} · davon mit echtem Bildmaterial: **${farbenMitBild}** (${((farbenMitBild / farbenGesamt) * 100).toFixed(1)} %)`);
zeilen.push('');
zeilen.push('## Je Marke');
zeilen.push('');
zeilen.push('| Marke | Produkte | vollständig | nur Platzhalter |');
zeilen.push('|-------|---------:|------------:|----------------:|');
for (const [marke, m] of [...proMarke.entries()].sort((a, b) => b[1].produkte - a[1].produkte)) {
  zeilen.push(`| ${marke} | ${m.produkte} | ${m.vollstaendig} | ${m.platzhalter} |`);
}
zeilen.push('');
zeilen.push('## Vollständig bebilderte Produkte');
zeilen.push('');
for (const b of vollstaendig) {
  const views = Object.keys(b.ansichtenAbdeckung).sort().join(', ');
  zeilen.push(`- **${b.name}** (${b.brand}) — ${b.farben} Farben, Ansichten: ${views}`);
}
zeilen.push('');
zeilen.push('## Teilweise bebilderte Produkte (Lücken)');
zeilen.push('');
if (teilweise.length === 0) zeilen.push('_(keine)_');
for (const b of teilweise) {
  const views = Object.entries(b.ansichtenAbdeckung).map(([v, n]) => `${v}:${n}`).join(', ');
  zeilen.push(`- **${b.name}** (${b.brand}) — ${b.farbenMitEchtenBildern}/${b.farben} Farben mit Bildern; Ansichten (Farben je Ansicht): ${views}${b.fehlendeRueckseite ? `; ${b.fehlendeRueckseite} Farben ohne Rückseite` : ''}`);
}
zeilen.push('');
zeilen.push(`## Nur Platzhalter — Herstellerimport offen (${platzhalter.length})`);
zeilen.push('');
zeilen.push('Diese Produkte warten auf echte Herstellerbilder (kein künstlicher Ersatz):');
zeilen.push('');
for (const b of platzhalter) {
  zeilen.push(`- ${b.name} (${b.brand}) — ${b.farben} Farben`);
}
zeilen.push('');

writeFileSync('docs/asset-vollstaendigkeitsbericht.md', zeilen.join('\n'), 'utf8');

console.log(`Produkte: ${berichte.length} | vollständig: ${vollstaendig.length} | teilweise: ${teilweise.length} | Platzhalter: ${platzhalter.length}`);
console.log(`Farben: ${farbenGesamt} | mit echtem Bild: ${farbenMitBild} (${((farbenMitBild / farbenGesamt) * 100).toFixed(1)} %)`);
console.log('Bericht: docs/asset-vollstaendigkeitsbericht.md');
