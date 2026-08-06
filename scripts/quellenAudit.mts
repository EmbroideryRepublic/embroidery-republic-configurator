/**
 * Stammen alle Farben eines Produkts aus DERSELBEN Bildquelle?
 *
 * Wenn 45 Farben aus dem Gildan-Studio kommen und 7 von einem anderen Händler,
 * springt beim Farbwechsel die Form des Kleidungsstücks – der Kunde liest das
 * als Fehler, nicht als Datenlage. Der Umriss-Audit kann das nur schätzen (und
 * versagt bei weißen Teilen auf weißem Grund); die Importjobs WISSEN es: dort
 * steht je Farbe die tatsächlich geladene URL.
 *
 * Maßgeblich ist der zuletzt gelaufene Job je Farbe – genau wie beim Ingest,
 * der spätere Läufe über frühere schreibt. Deshalb Sortierung nach Änderungszeit.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/quellenAudit.mts [--json <datei>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const IMPORT = join(process.cwd(), 'scripts', 'import');

/**
 * Kennung der Bildquelle. Der Host allein reicht nicht: Auf `cdn.shopify.com`
 * und `cdn11.bigcommerce.com` liegen die Bilder VIELER verschiedener Shops, und
 * zwei Shops fotografieren dasselbe Kleidungsstück verschieden. Der Shop steckt
 * im Pfadpräfix – das gehört zur Kennung.
 */
function quelle(url: string): string | undefined {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  const host = u.host.replace(/^www\./, '');
  const teile = u.pathname.split('/').filter(Boolean);
  if (host === 'cdn.shopify.com') return `${host}/${teile.slice(0, 6).join('/')}`; // s/files/1/<a>/<b>/<c>
  if (host.endsWith('bigcommerce.com')) return `${host}/${teile[0] ?? ''}`; // s-<shopid>
  return host;
}

const dateien = readdirSync(IMPORT)
  .filter((f) => f.startsWith('directJobs') && f.endsWith('.json'))
  .map((f) => ({ f, zeit: statSync(join(IMPORT, f)).mtimeMs }))
  .sort((a, b) => a.zeit - b.zeit);

/** productId → colorId → Host der zuletzt verwendeten Front-URL. */
const host = new Map<string, Map<string, string>>();
for (const { f } of dateien) {
  let jobs: { productId?: string; colors?: { id?: string; front?: string }[] }[];
  try {
    jobs = JSON.parse(readFileSync(join(IMPORT, f), 'utf8'));
  } catch {
    continue;
  }
  for (const j of Array.isArray(jobs) ? jobs : []) {
    if (!j.productId) continue;
    let proFarbe = host.get(j.productId);
    if (!proFarbe) host.set(j.productId, (proFarbe = new Map()));
    for (const c of j.colors ?? []) {
      if (!c.id || !c.front) continue;
      const q = quelle(c.front);
      if (q) proFarbe.set(c.id, q);
    }
  }
}

type Befund = { id: string; mehrheit: string; anzahl: number; minderheit: { host: string; farben: string[] }[] };
const befunde: Befund[] = [];
let ohneHerkunft = 0;

for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const proFarbe = host.get(p.id);
  if (!proFarbe) {
    if (real.length) ohneHerkunft++;
    continue;
  }
  const zaehler = new Map<string, string[]>();
  for (const c of real) {
    // Farben ohne Herkunftseintrag stammen aus dem Altbestand (Import vor der
    // Job-Protokollierung). Das ist ebenfalls eine eigene Fotoserie und gehört
    // deshalb als eigene „Quelle" gezählt – sonst bliebe genau der Fall
    // unsichtbar, bei dem eine große Neu-Charge sieben alte Bilder stehen ließ.
    const h = proFarbe.get(c.id) ?? 'ALTBESTAND (keine Herkunft protokolliert)';
    (zaehler.get(h) ?? zaehler.set(h, []).get(h)!).push(c.id);
  }
  if (zaehler.size < 2) continue;
  const sortiert = [...zaehler.entries()].sort((a, b) => b[1].length - a[1].length);
  befunde.push({
    id: p.id,
    mehrheit: sortiert[0]![0],
    anzahl: sortiert[0]![1].length,
    minderheit: sortiert.slice(1).map(([h, farben]) => ({ host: h, farben })),
  });
}

befunde.sort(
  (a, b) =>
    b.minderheit.reduce((s, m) => s + m.farben.length, 0) - a.minderheit.reduce((s, m) => s + m.farben.length, 0)
);

const betroffen = befunde.reduce((s, b) => s + b.minderheit.reduce((t, m) => t + m.farben.length, 0), 0);
console.log(
  `${befunde.length} Produkte mit gemischten Bildquellen · ${betroffen} Farben aus der jeweiligen Minderheitsquelle` +
    (ohneHerkunft ? ` · ${ohneHerkunft} Produkte ohne Herkunftsdaten (Altbestand)` : '')
);
for (const b of befunde) {
  console.log(`\n  ${b.id}   Mehrheit: ${b.mehrheit} (${b.anzahl} Farben)`);
  for (const m of b.minderheit) {
    console.log(`     ${String(m.farben.length).padStart(3)} von ${m.host}: ${m.farben.join(', ')}`);
  }
}

const i = process.argv.indexOf('--json');
if (i > -1 && process.argv[i + 1]) {
  writeFileSync(process.argv[i + 1]!, JSON.stringify(befunde, null, 2));
  console.log(`\n→ ${process.argv[i + 1]}`);
}
