/**
 * Baut die Agenten-Argumente für den Farblücken-Workflow aus dem AKTUELLEN
 * Stand – statt aus einer von Hand gepflegten Liste, die nach jeder Charge
 * veraltet ist.
 *
 * Je Produkt mit Lücke:
 *   klappt  – Farben, die schon ein echtes Foto haben (Beleg, dass die Quelle trägt)
 *   muster  – eine echte Quell-URL aus einem früheren Importlauf (Muster ableitbar)
 *   fehlend – die noch offenen Farben als "id|Name|#hex"
 *
 * Bereits als technisch nicht beschaffbar dokumentierte Farben (nichtbeschaffbar_*.json)
 * werden ausgelassen – sie sollen nicht in jeder Runde erneut recherchiert werden.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/farbluckenArgs.mts <ziel.json> [--max N] [--ab N]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const IMPORT = join(process.cwd(), 'scripts', 'import');

/** Quelle + Beispiel-URL je Produkt aus allen bisherigen Importläufen. */
const herkunft = new Map<string, { quelle: string; muster: string }>();
for (const datei of readdirSync(IMPORT).filter((f) => f.startsWith('directJobs') && f.endsWith('.json'))) {
  let jobs: { productId: string; quelle?: string; colors?: { front?: string }[] }[];
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

/** Schon dokumentiert als nirgends beschaffbar – nicht erneut suchen lassen. */
const aufgegeben = new Set<string>();
for (const datei of readdirSync(IMPORT).filter((f) => f.startsWith('nichtbeschaffbar'))) {
  // Zwei gewachsene Formen: flach {productId,colorId,grund} und
  // gruppiert {productId,colors:[{id,grund}]}. Beide lesen.
  let eintraege: { productId?: string; id?: string; colorId?: string; colors?: { id: string }[] }[];
  try {
    eintraege = JSON.parse(readFileSync(join(IMPORT, datei), 'utf8'));
  } catch {
    continue;
  }
  for (const e of Array.isArray(eintraege) ? eintraege : []) {
    const pid = e.productId ?? e.id;
    if (!pid) continue;
    if (e.colorId) aufgegeben.add(`${pid}/${e.colorId}`);
    for (const c of e.colors ?? []) aufgegeben.add(`${pid}/${c.id}`);
  }
}

const items = [];
for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const offen = p.colors.filter(
    (c) => ASSET_MANIFEST[p.id]?.[c.id]?.status !== 'real' && !aufgegeben.has(`${p.id}/${c.id}`)
  );
  if (!offen.length) continue;
  const h = herkunft.get(p.id);
  items.push({
    id: p.id,
    marke: p.brand,
    name: p.name,
    typ: p.productType,
    quelle: h?.quelle ?? '(noch keine – selbst recherchieren)',
    muster: h?.muster ?? null,
    klappt: real.slice(0, 4).map((c) => c.id).join(','),
    fehlend: offen.map((c) => `${c.id}|${c.name}|${c.hex}`).join(' ; '),
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
  `${teil.length} Produkte, ${teil.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} Farben → ${ziel}` +
    `  (insgesamt offen: ${items.length} Produkte, ${items.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} Farben)`
);
for (const i of teil) console.log(`  ${String(i.fehlend.split(' ; ').length).padStart(3)}  ${i.id}`);
