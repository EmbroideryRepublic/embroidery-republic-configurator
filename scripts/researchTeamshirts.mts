/**
 * Autonome Bildquellen-Recherche (ADR 0006) – ohne Browser, rein über HTTP+sharp.
 *
 * Für jedes Produkt (Eingabe: productId + TeamShirts-Produkt-URL) ermittelt das
 * Skript objektiv die Import-Zuordnung:
 *   1. Seite laden → Spreadshirt-`productType` (häufigster /productTypes/N) und
 *      Namespace (…/v1/<ns>/productTypes…) + alle appearance-IDs (Swatch-Links
 *      /product/<slug>/<id>).
 *   2. Je appearance das Vorderbild (klein) laden, den Kleidungs-Körper-Hex messen
 *      (Bildmitte) und Fallback-Renders (== Default) verwerfen.
 *   3. Jede KATALOGFARBE des Produkts der farblich nächsten appearance zuordnen
 *      (ΔE über RGB-Abstand); nur Treffer unter Schwelle gelten.
 *   4. Die 6–7 WICHTIGSTEN Farben wählen (Nähe zu Standardpalette
 *      schwarz/weiß/navy/rot/royal/grau/grün) und als Job ausgeben.
 *
 * So wird NIE nach Namen geraten – die Farbidentität kommt aus dem Bild selbst.
 * Ausgabe: scripts/import/teamshirtsJobs.json (Jobs für ingestTeamshirts.mts).
 *
 * Aufruf:  npx tsx scripts/researchTeamshirts.mts scripts/import/researchSpec.json
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';

type Spec = { productId: string; url: string };
const MAX_FARBEN = 7;
const MATCH_SCHWELLE = 42;   // ΔE Katalogfarbe ↔ appearance (darüber: kein sicherer Treffer)
const KANON: [string, string][] = [
  ['schwarz', '#1a1a1a'], ['weiss', '#f5f5f5'], ['navy', '#1b2a4a'], ['rot', '#a4222f'],
  ['royal', '#1e5fbf'], ['grau', '#7a7d80'], ['gruen', '#2f5233'],
];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const dE = (a: string, b: string) => { const [r1,g1,b1]=rgb(a),[r2,g2,b2]=rgb(b); return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2); };
const toHex = (r:number,g:number,b:number)=>`#${[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('')}`;

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
async function koerperHex(buf: Buffer): Promise<string> {
  const m = await sharp(buf).metadata(); const W=m.width??600, H=m.height??800;
  const { data } = await sharp(buf).extract({ left: Math.round(W*0.4), top: Math.round(H*0.42), width: Math.round(W*0.2), height: Math.round(H*0.2) })
    .resize(1,1,{fit:'fill'}).raw().toBuffer({ resolveWithObject: true });
  return toHex(data[0], data[1], data[2]);
}

const spec: Spec[] = JSON.parse(readFileSync(process.argv[2] ?? 'scripts/import/researchSpec.json', 'utf-8'));
const jobs: any[] = [];

for (const { productId, url } of spec) {
  const prod = PRODUCTS.find((p) => p.id === productId);
  if (!prod) { console.log(`✗ ${productId}: nicht im Katalog`); continue; }
  let html = '';
  try { html = (await fetchBuf(url)).toString('utf-8'); } catch (e) { console.log(`✗ ${productId}: Seite ${url} → ${(e as Error).message}`); continue; }

  const slug = url.split('/product/')[1]?.split(/[/?#]/)[0] ?? '';
  const pts = [...html.matchAll(/\/productTypes\/(\d+)/g)].map((m) => m[1]);
  const productType = Number([...pts].sort((a,b)=> pts.filter(x=>x===b).length - pts.filter(x=>x===a).length)[0]);
  const nsMatch = html.match(/\/v1\/(sprd-[a-z]{2})\/productTypes/);
  const namespace = nsMatch?.[1] ?? 'sprd-na';
  const appIds = [...new Set([...html.matchAll(new RegExp(`/product/${slug}/(\\d+)`, 'g'))].map((m) => Number(m[1])))];
  if (!productType || appIds.length === 0) { console.log(`✗ ${productId}: PT/appearances nicht gefunden (PT=${productType}, ${appIds.length} apps)`); continue; }

  const CLOUD = `https://images.teamshirts.net/image/upload/c_limit,f_auto,q_auto,w_240/v1/${namespace}/productTypes/${productType}/views/1/appearances`;
  let fallback = '';
  try { fallback = await koerperHex(await fetchBuf(`${CLOUD}/999999,width=600,height=800,mediaType=png`)); } catch {}
  // Körper-Hex je appearance messen
  const appHex: { id: number; hex: string }[] = [];
  for (const id of appIds) {
    try {
      const hex = await koerperHex(await fetchBuf(`${CLOUD}/${id},width=600,height=800,mediaType=png`));
      appHex.push({ id, hex });
    } catch { /* überspringen */ }
  }
  const gueltig = appHex.filter((a) => !fallback || dE(a.hex, fallback) > 8);

  // Katalogfarbe → nächste gültige appearance
  const zuord = prod.colors.map((c) => {
    let best = { id: -1, d: Infinity, hex: '' };
    for (const a of gueltig) { const d = dE(c.hex, a.hex); if (d < best.d) best = { id: a.id, d, hex: a.hex }; }
    const wichtigkeit = Math.min(...KANON.map(([, h]) => dE(c.hex, h)));
    return { id: c.id, hex: c.hex, appearanceId: best.id, deltaE: Math.round(best.d), istHex: best.hex, wichtigkeit };
  }).filter((z) => z.appearanceId !== -1 && z.deltaE <= MATCH_SCHWELLE);

  // Duplikate (mehrere Katalogfarben auf dieselbe appearance) auflösen: besten ΔE behalten
  const proApp = new Map<number, typeof zuord[0]>();
  for (const z of zuord.sort((a,b)=>a.deltaE-b.deltaE)) if (!proApp.has(z.appearanceId)) proApp.set(z.appearanceId, z);
  const gewaehlt = [...proApp.values()].sort((a,b)=>a.wichtigkeit-b.wichtigkeit).slice(0, MAX_FARBEN);

  jobs.push({ productId, productType, namespace, colors: gewaehlt.map((z)=>({ id: z.id, appearanceId: z.appearanceId, erwarteterHex: z.hex })) });
  console.log(`✓ ${productId}: PT ${productType} (${namespace}), ${appIds.length} apps → ${gewaehlt.length} Farben: ${gewaehlt.map(z=>`${z.id}#${z.appearanceId}(ΔE${z.deltaE})`).join(', ')}`);
}

writeFileSync('scripts/import/teamshirtsJobs.json', JSON.stringify(jobs, null, 2));
console.log(`\n${jobs.length} Jobs → scripts/import/teamshirtsJobs.json`);
