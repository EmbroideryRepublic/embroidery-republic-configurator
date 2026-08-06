/**
 * Agenten-Argumente für die Rückansichten-Beschaffung.
 *
 * Gegenstück zu farbluckenArgs.mts: dort fehlt die ganze Farbe, hier fehlt zu
 * einer vorhandenen Farbe die Rückansicht. Der Auftrag ist damit ein anderer –
 * die Quelle trägt das Produkt bereits, sie liefert nur kein zweites Foto.
 *
 * Mit `--ansicht sleeve_left` dient dasselbe Skript der Ärmelbeschaffung: Die
 * Frage ist dieselbe (Farbe vorhanden, EINE Ansicht fehlt), nur die Ansicht
 * wechselt. Bei Ärmeln werden nur Produkte gelistet, bei denen die Quelle
 * nachweislich schon Ärmelfotos liefert (mindestens eine Farbe hat eins) –
 * sonst wäre der Auftrag eine Suche ins Blaue.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/rueckansichtArgs.mts <ziel.json> [--max N] [--ab N] [--ohne id,id] [--ansicht back|sleeve_left|sleeve_right]
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

/** Wert eines Schalters. NICHT `argv[indexOf(x)+1]` – ohne den Schalter ist das
 *  `argv[0]`, also der Node-Pfad, und die Auswertung kippt lautlos. */
function flagWert(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const ohne = new Set((flagWert('--ohne') ?? '').split(',').filter(Boolean));

const ansicht = flagWert('--ansicht') ?? 'back';
const istRueck = ansicht === 'back';

const items = [];
for (const p of PRODUCTS) {
  if (ohne.has(p.id)) continue;
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const hat = (id: string) => {
    const b = ASSET_MANIFEST[p.id]?.[id]?.views?.[ansicht];
    return Boolean(b) && !b!.includes('_platzhalter');
  };
  const fehlt = real.filter((c) => !hat(c.id));
  if (!fehlt.length) continue;
  const h = herkunft.get(p.id);
  // Eine Farbe, die die Ansicht schon hat, ist der beste Beleg dafür, dass die
  // Quelle sie überhaupt führt – als Muster mitgeben.
  const mitRueck = real.find((c) => hat(c.id));
  // Ärmel: ohne einen einzigen Beleg lohnt der Auftrag nicht (69 Produkte haben
  // schlicht keine Ärmelaufnahmen). Rückseite dagegen immer versuchen.
  if (!istRueck && !mitRueck) continue;
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

const ab = Number(flagWert('--ab')) || 0;
const max = Number(flagWert('--max')) || items.length;
const teil = items.slice(ab, ab + max);

const ziel = process.argv[2];
if (!ziel) throw new Error('Zieldatei fehlt');
writeFileSync(ziel, JSON.stringify(teil));
console.log(
  `${teil.length} Produkte, ${teil.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)} Rückansichten → ${ziel}` +
    `  (offen gesamt: ${items.length} Produkte, ${items.reduce((s, i) => s + i.fehlend.split(' ; ').length, 0)})`
);
for (const i of teil) console.log(`  ${String(i.fehlend.split(' ; ').length).padStart(3)}  ${i.id}`);
