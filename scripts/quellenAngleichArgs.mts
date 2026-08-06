/**
 * Arbeitsvorlage, um die Bildquellen INNERHALB eines Produkts anzugleichen.
 *
 * quellenAudit.mts stellt fest, DASS ein Produkt aus mehreren Fotoserien
 * zusammengesetzt ist. Hier entsteht der Auftrag: Welche Farben sollen aus
 * welcher Quelle nachgeholt werden, und welche echten URLs dieser Quelle
 * dienen als Muster?
 *
 * Ziel ist immer die größte Quelle MIT protokollierter Herkunft – der
 * Altbestand scheidet als Ziel aus, weil seine URLs nicht bekannt sind und sich
 * daraus kein Muster ableiten lässt.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/quellenAngleichArgs.mts <ziel.json> [--max N] [--ab N] [--mind N]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const IMPORT = join(process.cwd(), 'scripts', 'import');
const ALT = 'ALTBESTAND';

function flagWert(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function quelle(url: string): string | undefined {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  const host = u.host.replace(/^www\./, '');
  const teile = u.pathname.split('/').filter(Boolean);
  if (host === 'cdn.shopify.com') return `${host}/${teile.slice(0, 6).join('/')}`;
  if (host.endsWith('bigcommerce.com')) return `${host}/${teile[0] ?? ''}`;
  return host;
}

/** productId → colorId → {quelle, url} des zuletzt gelaufenen Jobs. */
const herkunft = new Map<string, Map<string, { q: string; url: string }>>();
const beschreibung = new Map<string, string>(); // productId|quelle → Quellentext aus dem Job
const dateien = readdirSync(IMPORT)
  .filter((f) => f.startsWith('directJobs') && f.endsWith('.json'))
  .map((f) => ({ f, zeit: statSync(join(IMPORT, f)).mtimeMs }))
  .sort((a, b) => a.zeit - b.zeit);

for (const { f } of dateien) {
  let jobs: { productId?: string; quelle?: string; colors?: { id?: string; front?: string }[] }[];
  try {
    jobs = JSON.parse(readFileSync(join(IMPORT, f), 'utf8'));
  } catch {
    continue;
  }
  for (const j of Array.isArray(jobs) ? jobs : []) {
    if (!j.productId) continue;
    let proFarbe = herkunft.get(j.productId);
    if (!proFarbe) herkunft.set(j.productId, (proFarbe = new Map()));
    for (const c of j.colors ?? []) {
      if (!c.id || !c.front) continue;
      const q = quelle(c.front);
      if (!q) continue;
      proFarbe.set(c.id, { q, url: c.front });
      if (j.quelle) beschreibung.set(`${j.productId}|${q}`, j.quelle);
    }
  }
}

/**
 * Farben, die an der Zielquelle nachweislich nicht existieren, nicht erneut
 * suchen lassen – und Faelle, in denen die Zielquelle das Bild nur unter einer
 * FREMDEN Artikelnummer fuehrt (dann ist der Stilbruch das kleinere Uebel).
 */
const aufgegeben = new Set<string>();
for (const f of process.argv.includes('--alle') ? [] : readdirSync(IMPORT).filter((f) => f.startsWith('nichtbeschaffbar'))) {
  let eintraege: { productId?: string; id?: string; colorId?: string; colors?: { id: string }[] }[];
  try { eintraege = JSON.parse(readFileSync(join(IMPORT, f), 'utf8')); } catch { continue; }
  for (const e of Array.isArray(eintraege) ? eintraege : []) {
    const pid = e.productId ?? e.id;
    if (!pid) continue;
    if (e.colorId) aufgegeben.add(`${pid}/${e.colorId}`);
    for (const c of e.colors ?? []) aufgegeben.add(`${pid}/${c.id}`);
  }
}

const mind = Number(flagWert('--mind')) || 1;
const items = [];

for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const proFarbe = herkunft.get(p.id);
  if (!proFarbe || real.length < 2) continue;

  const nach = new Map<string, string[]>();
  for (const c of real) {
    const q = proFarbe.get(c.id)?.q ?? ALT;
    (nach.get(q) ?? nach.set(q, []).get(q)!).push(c.id);
  }
  if (nach.size < 2) continue;

  // Ziel: größte Quelle mit bekannten URLs. Ohne eine solche ist nichts zu tun.
  const kandidaten = [...nach.entries()].filter(([q]) => q !== ALT).sort((a, b) => b[1].length - a[1].length);
  const ziel = kandidaten[0];
  if (!ziel) continue;

  const angleichen = real.filter((c) => (proFarbe.get(c.id)?.q ?? ALT) !== ziel[0] && !aufgegeben.has(`${p.id}/${c.id}`));
  if (angleichen.length < mind) continue;

  // Drei echte URLs der Zielquelle als Muster – daraus leitet sich das Schema ab.
  const muster = ziel[1]
    .slice(0, 3)
    .map((id) => `${id} → ${proFarbe.get(id)!.url}`)
    .join('\n');

  items.push({
    id: p.id,
    marke: p.brand,
    name: p.name,
    typ: p.productType,
    zielQuelle: ziel[0],
    quelle: beschreibung.get(`${p.id}|${ziel[0]}`) ?? ziel[0],
    behalten: ziel[1].length,
    muster,
    fehlend: angleichen.map((c) => `${c.id}|${c.name}|${c.hex}`).join(' ; '),
  });
}

items.sort((a, b) => b.fehlend.split(' ; ').length - a.fehlend.split(' ; ').length);

const ab = Number(flagWert('--ab')) || 0;
const max = Number(flagWert('--max')) || items.length;
const teil = items.slice(ab, ab + max);

const ziel = process.argv[2];
if (!ziel) throw new Error('Zieldatei fehlt');
writeFileSync(ziel, JSON.stringify(teil));
console.log(
  `${teil.length} Produkte, ${teil.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} anzugleichende Farben → ${ziel}` +
    `  (gesamt: ${items.length} Produkte, ${items.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} Farben)`
);
for (const i of teil) {
  console.log(`  ${String(i.fehlend.split(' ; ').length).padStart(3)}  ${i.id.padEnd(50)} → ${i.zielQuelle}`);
}
