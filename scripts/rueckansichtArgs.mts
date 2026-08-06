/**
 * Agenten-Argumente für die Rückansichten-Beschaffung.
 *
 * Gegenstück zu farbluckenArgs.mts: dort fehlt die ganze Farbe, hier fehlt zu
 * einer vorhandenen Farbe die Rückansicht. Der Auftrag ist damit ein anderer –
 * die Quelle trägt das Produkt bereits, sie liefert nur kein zweites Foto.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/rueckansichtArgs.mts <ziel.json> [--max N] [--ab N] [--ohne id,id]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const IMPORT = join(process.cwd(), 'scripts', 'import');

/** Bisher genutzte Quelle + eine echte Front-URL je Produkt (Muster ableitbar). */
const herkunft = new Map<string, { quelle: string; muster: string }>();
for (const datei of readdirSync(IMPORT).filter((f) => f.startsWith('directJobs') && f.endsWith('.json'))) {
  let jobs: { productId: string; quelle?: string; colors?: { front?: string; back?: string }[] }[];
  try {
    jobs = JSON.parse(readFileSync(join(IMPORT, datei), 'utf8'));
  } catch {
    continue;
  }
  for (const j of Array.isArray(jobs) ? jobs : []) {
    const front = j.colors?.find((c) => c.front)?.front;
    if (!j.productId || !front) continue;
    herkunft.set(j.productId, { quelle: j.quelle ?? datei, muster: front });
  }
}

const ohne = new Set(
  (process.argv[process.argv.indexOf('--ohne') + 1] ?? '').split(',').filter(Boolean)
);

const items = [];
for (const p of PRODUCTS) {
  if (ohne.has(p.id)) continue;
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const fehlt = real.filter((c) => {
    const b = ASSET_MANIFEST[p.id]?.[c.id]?.views?.back;
    return !b || b.includes('_platzhalter');
  });
  if (!fehlt.length) continue;
  const h = herkunft.get(p.id);
  // Eine Farbe, die schon eine echte Rückansicht hat, ist der beste Beleg dafür,
  // dass die Quelle überhaupt Rückenfotos führt – als Muster mitgeben.
  const mitRueck = real.find((c) => {
    const b = ASSET_MANIFEST[p.id]?.[c.id]?.views?.back;
    return b && !b.includes('_platzhalter');
  });
  items.push({
    id: p.id,
    marke: p.brand,
    name: p.name,
    typ: p.productType,
    quelle: h?.quelle ?? '(noch keine – selbst recherchieren)',
    muster: h?.muster ?? null,
    rueckKlappt: mitRueck?.id ?? null,
    fehlend: fehlt.map((c) => `${c.id}|${c.name}|${c.hex}`).join(' ; '),
  });
}

items.sort((a, b) => b.fehlend.split(' ; ').length - a.fehlend.split(' ; ').length);

const ab = Number(process.argv[process.argv.indexOf('--ab') + 1]) || 0;
const max = Number(process.argv[process.argv.indexOf('--max') + 1]) || items.length;
const teil = items.slice(ab, ab + max);

const ziel = process.argv[2];
if (!ziel) throw new Error('Zieldatei fehlt');
writeFileSync(ziel, JSON.stringify(teil));
console.log(
  `${teil.length} Produkte, ${teil.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} Rückansichten → ${ziel}` +
    `  (offen gesamt: ${items.length} Produkte, ${items.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)})`
);
for (const i of teil) console.log(`  ${String(i.fehlend.split(' ; ').length).padStart(3)}  ${i.id}`);
