/**
 * Autonome Bildquellen-Recherche (ADR 0006) – ohne Browser, rein per HTTP.
 *
 * Für jedes Produkt (Eingabe: productId + TeamShirts-Produkt-URL) ermittelt das
 * Skript die Import-Zuordnung zuverlässig über die FARBNAMEN der Produktseite:
 *   1. Seite laden → Spreadshirt-`productType` (häufigster /productTypes/N),
 *      Namespace (…/v1/<ns>/…) und alle Swatches als {name, appearanceId}
 *      (im HTML: <a title="navy" … data-tracking-value="348">).
 *   2. Jede KATALOGFARBE des Produkts der namentlich passenden Swatch zuordnen
 *      (normalisierter Name + Synonyme; Farbname ist die Wahrheit, nicht der Hex –
 *      reines Hex-Matching wählt sonst visuell-nahe, aber falsche Farben).
 *   3. Die 6–7 WICHTIGSTEN Farben wählen (Nähe zur Standardpalette schwarz/weiß/
 *      navy/rot/royal/grau/grün) und als Job ausgeben. Die Farbtreue wird beim
 *      Ingest zusätzlich über den gemessenen Körper-Hex (ΔE) geprüft.
 *
 * Ausgabe: scripts/import/teamshirtsJobs.json (Jobs für ingestTeamshirts.mts).
 * Aufruf:  npx tsx scripts/researchTeamshirts.mts scripts/import/researchSpec.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';

type Spec = { productId: string; url: string };
const MAX_FARBEN = 7;
/** Standardpalette (Wichtigkeit) + bevorzugte TeamShirts-Namen je Grundton. */
const KANON: { hex: string; syn: string[] }[] = [
  { hex: '#1a1a1a', syn: ['black'] },
  { hex: '#f5f5f5', syn: ['white'] },
  { hex: '#1b2a4a', syn: ['navy'] },
  { hex: '#a4222f', syn: ['red'] },
  { hex: '#1e5fbf', syn: ['royal blue', 'royal'] },
  { hex: '#7a7d80', syn: ['sports grey', 'sport grey', 'heather grey', 'charcoal', 'ash', 'graphite'] },
  { hex: '#2f5233', syn: ['forest green', 'bottle green', 'kelly green', 'irish green', 'military green', 'green'] },
];
/** Synonyme Katalog-Farbname → mögliche TeamShirts-Namen (nur echte Farbgleichheit). */
const SYN: Record<string, string[]> = {
  royal: ['royal blue'], 'royal blue': ['royal'],
  grey: ['gray', 'sports grey', 'sport grey'], gray: ['grey'],
  'sport grey': ['sports grey'], 'sports grey': ['sport grey'],
  burgundy: ['maroon'], maroon: ['burgundy'], anthracite: ['charcoal', 'dark heather'],
  bottle: ['bottle green'], kelly: ['kelly green'],
};

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const dE = (a: string, b: string) => { const [r1,g1,b1]=rgb(a),[r2,g2,b2]=rgb(b); return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2); };
/** Farbname normalisieren: klein, grey→gray, Qualifizierer/Klammern entfernen. */
const norm = (s: string) => s.toLowerCase().replace(/grey/g, 'gray').replace(/\bsports\b/g, 'sport').replace(/\([^)]*\)/g, ' ')
  .replace(/\b(heather|solid|neon|adult|melange|meliert|marl|meliert)\b/g, ' ')
  .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s: string) => new Set(norm(s).split(' ').filter(Boolean));

/** Score, wie gut Katalogfarbe c namentlich zur Swatch ts passt (0 = kein Treffer). */
function nameScore(cName: string, tsName: string): number {
  const a = norm(cName), b = norm(tsName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const syn = SYN[a] ?? [];
  if (syn.map(norm).includes(b)) return 90;
  if (a.includes(b) || b.includes(a)) return 70;
  const ta = tokens(cName), tb = tokens(tsName);
  const gemein = [...ta].filter((t) => tb.has(t));
  if (gemein.length) return 40 + 10 * gemein.length;
  return 0;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

const spec: Spec[] = JSON.parse(readFileSync(process.argv[2] ?? 'scripts/import/researchSpec.json', 'utf-8'));
const jobs: any[] = [];

for (const { productId, url } of spec) {
  const prod = PRODUCTS.find((p) => p.id === productId);
  if (!prod) { console.log(`✗ ${productId}: nicht im Katalog`); continue; }
  let html = '';
  try { html = await fetchText(url); } catch (e) { console.log(`✗ ${productId}: ${url} → ${(e as Error).message}`); continue; }

  const pts = [...html.matchAll(/\/productTypes\/(\d+)/g)].map((m) => m[1]);
  if (!pts.length) { console.log(`✗ ${productId}: kein productType in ${url}`); continue; }
  const productType = Number([...pts].sort((a, b) => pts.filter((x) => x === b).length - pts.filter((x) => x === a).length)[0]);
  const namespace = html.match(/\/v1\/(sprd-[a-z]{2})\//)?.[1] ?? 'sprd-na';
  // Swatches: <a title="navy" … data-tracking-value="348">
  const swatches = [...html.matchAll(/title="([^"]+)"[^>]*data-tracking="product-appearance-select"[^>]*data-tracking-value="(\d+)"/g)]
    .map((m) => ({ name: m[1].trim(), id: Number(m[2]) }));
  if (!swatches.length) { console.log(`✗ ${productId}: keine Swatches (PT ${productType})`); continue; }

  // Jede Katalogfarbe → beste Swatch per Name
  const zuord = prod.colors.map((c) => {
    let best = { id: -1, score: 0, tsName: '' };
    for (const s of swatches) { const sc = nameScore(c.name, s.name); if (sc > best.score) best = { id: s.id, score: sc, tsName: s.name }; }
    const wicht = Math.min(...KANON.map((k) => dE(c.hex, k.hex)));
    return { id: c.id, hex: c.hex, appearanceId: best.id, score: best.score, tsName: best.tsName, wicht };
  }).filter((z) => z.score >= 70);  // nur sichere Namenstreffer

  // Duplikate (mehrere Katalogfarben → selbe Swatch): besten Score behalten
  const proApp = new Map<number, typeof zuord[0]>();
  for (const z of zuord.sort((a, b) => b.score - a.score)) if (!proApp.has(z.appearanceId)) proApp.set(z.appearanceId, z);
  const gewaehlt = [...proApp.values()].sort((a, b) => a.wicht - b.wicht).slice(0, MAX_FARBEN);

  jobs.push({ productId, productType, namespace, colors: gewaehlt.map((z) => ({ id: z.id, appearanceId: z.appearanceId, erwarteterHex: z.hex })) });
  console.log(`✓ ${productId}: PT ${productType} (${namespace}), ${swatches.length} Swatches → ${gewaehlt.length}: ${gewaehlt.map((z) => `${z.id}=${z.tsName}#${z.appearanceId}`).join(', ')}`);
}

writeFileSync('scripts/import/teamshirtsJobs.json', JSON.stringify(jobs, null, 2));
console.log(`\n${jobs.length} Jobs → scripts/import/teamshirtsJobs.json`);
