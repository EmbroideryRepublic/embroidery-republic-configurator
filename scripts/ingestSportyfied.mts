/**
 * Bild-Ingest aus Sportyfied (europäischer Multi-Marken-Händler, ADR 0006).
 *
 * Sportyfied hat je Produkt/Artikel UNTERSCHIEDLICHE Bild-Dateinamensmuster
 * (mal <artikel>_<farbe>_front, mal <artikel>_<kurzcode>, mal
 * bc-tshirt-<farbe>-<artikel>-001-f_<n>). Deshalb werden die Bild-URLs NICHT
 * konstruiert, sondern je Farbseite direkt aus der Seite EXTRAHIERT (700×700,
 * Max-Auflösung). Das ist gegen alle Formatvarianten robust.
 *
 * Pro Ziel-Farbe wird die Farbseite <baseSlug>-<colorSlug> geladen und daraus
 * die echte Vorder-, Rück- und (falls vorhanden) Seitenansicht gezogen. Ablage:
 * public/products/<productId>-<colorId>/{front,back,sleeve-left}.{png,webp}
 * (sleeve-right aliased der Manifest-Generator auf front).
 *
 * Job: [{ productId, baseSlug, colors:[{id, colorSlug, erwarteterHex}] }]
 * Aufruf: npx tsx scripts/ingestSportyfied.mts scripts/import/sportyfiedJobs.json
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PUBLIC_PRODUCTS = path.join(process.cwd(), 'public', 'products');
const TARGET_W = 620, TARGET_H = 720, MARGIN_RATIO = 0.86;
const BASE = 'https://www.sportyfied.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

type Farbe = { id: string; colorSlug: string; erwarteterHex?: string };
type Job = { productId: string; baseSlug: string; colors: Farbe[] };
const md5 = (b: Buffer) => createHash('md5').update(b).digest('hex');

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: UA, redirect: 'follow' });
  return res.ok ? await res.text() : null;
}
async function fetchBuf(url: string): Promise<Buffer | null> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const b = Buffer.from(await res.arrayBuffer());
  return b.length > 2500 ? b : null;
}

/** Aus einer Farbseite die 700×700-Produkt-URLs je Ansicht ziehen. Sportyfied
 *  markiert Rück-/Seitenansicht per "back"/"side"-Token bzw. "-b"/"-s" im Namen;
 *  die Vorderansicht ist das erste 700er ohne solches Token. Alle drei müssen
 *  denselben Farb-Präfix teilen (gegen Fremdprodukt-Vorschauen). */
function bildURLs(html: string): { front?: string; back?: string; side?: string } {
  const alle = [...html.matchAll(/\/thumbs\/regular\/([a-z0-9_-]+)_700x700\.(?:png|jpg)/g)]
    .map((m) => ({ url: BASE + m[0], stem: m[1] }))
    .filter((x) => !/logo|payment|card|download\d|collection|_100x60/.test(x.stem));
  const istBack = (s: string) => /(_|-)b(ack)?(_|$)/.test(s);
  const istSide = (s: string) => /(_|-)s(ide)?(_|$)/.test(s);
  const front = alle.find((x) => !istBack(x.stem) && !istSide(x.stem));
  if (!front) return {};
  // Farb-Präfix = gemeinsamer Anfang (bis zum Ansichts-Token)
  const praefix = front.stem.replace(/(_|-)(f|front)(_\d+)?$/, '');
  const same = (x: { stem: string }) => x.stem.startsWith(praefix.slice(0, Math.max(6, praefix.length - 2)));
  return {
    front: front.url,
    back: alle.find((x) => istBack(x.stem) && same(x))?.url,
    side: alle.find((x) => istSide(x.stem) && same(x))?.url,
  };
}

async function normalisiere(raw: Buffer): Promise<Buffer> {
  const trimmed = await sharp(raw).flatten({ background: '#ffffff' }).trim({ threshold: 12 }).toBuffer();
  const inner = await sharp(trimmed)
    .resize(Math.round(TARGET_W * MARGIN_RATIO), Math.round(TARGET_H * MARGIN_RATIO), { fit: 'contain', background: '#ffffff' })
    .toBuffer();
  return sharp({ create: { width: TARGET_W, height: TARGET_H, channels: 3, background: '#ffffff' } })
    .composite([{ input: inner, gravity: 'center' }]).png().toBuffer();
}
async function koerperHex(png: Buffer): Promise<string> {
  const m = await sharp(png).metadata(); const W = m.width ?? TARGET_W, H = m.height ?? TARGET_H;
  const { data } = await sharp(png).extract({ left: Math.round(W * 0.4), top: Math.round(H * 0.42), width: Math.round(W * 0.2), height: Math.round(H * 0.2) })
    .resize(1, 1, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return `#${[data[0], data[1], data[2]].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
function deltaHex(a: string, b: string): number {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return Math.round(Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2));
}
async function bestehendeFrontHashes(): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  for (const d of await fs.readdir(PUBLIC_PRODUCTS)) {
    const f = path.join(PUBLIC_PRODUCTS, d, 'front.png');
    if (existsSync(f)) m.set(md5(await fs.readFile(f)), d);
  }
  return m;
}

const jobs: Job[] = JSON.parse(await fs.readFile(process.argv[2] ?? 'scripts/import/sportyfiedJobs.json', 'utf-8'));
const bestehend = await bestehendeFrontHashes();
const bericht: any[] = [];

for (const job of jobs) {
  for (const c of job.colors) {
    const seite = await fetchText(`${BASE}/en/${job.baseSlug}-${c.colorSlug}`);
    const urls = seite ? bildURLs(seite) : {};
    const outDir = path.join(PUBLIC_PRODUCTS, `${job.productId}-${c.id}`);
    const gefunden: string[] = [];
    let frontHash = '', frontDom = '';
    await fs.mkdir(outDir, { recursive: true });
    const ziel: Record<string, string | undefined> = { front: urls.front, back: urls.back, 'sleeve-left': urls.side };
    for (const [vn, u] of Object.entries(ziel)) {
      if (!u) continue;
      const raw = await fetchBuf(u);
      if (!raw) continue;
      const png = await normalisiere(raw);
      await fs.writeFile(path.join(outDir, `${vn}.png`), png);
      await sharp(png).webp({ quality: 90 }).toFile(path.join(outDir, `${vn}.webp`));
      gefunden.push(vn);
      if (vn === 'front') { frontHash = md5(png); frontDom = await koerperHex(png); }
    }
    if (!gefunden.includes('front')) { await fs.rm(outDir, { recursive: true, force: true }); }
    const dupe = frontHash && bestehend.has(frontHash) ? bestehend.get(frontHash)! : null;
    if (frontHash) bestehend.set(frontHash, `${job.productId}-${c.id}`);
    const dElta = c.erwarteterHex && frontDom ? deltaHex(frontDom, c.erwarteterHex) : null;
    bericht.push({ produkt: job.productId, farbe: c.id, colorSlug: c.colorSlug, gefunden, frontDom, erwartet: c.erwarteterHex ?? null, deltaE: dElta, dupeMit: dupe });
    const warn = [dupe ? `DUP:${dupe}` : '', dElta !== null && dElta > 70 ? `ΔE=${dElta}!` : '', !gefunden.includes('front') ? 'KEINE FRONT' : ''].filter(Boolean).join(' ');
    console.log(`${job.productId}/${c.id} (${c.colorSlug}): [${gefunden.join(',')}] dom=${frontDom} ${warn}`);
  }
}
await fs.writeFile('scripts/import/sportyfiedBericht.json', JSON.stringify(bericht, null, 2));
console.log(`\nFertig. ${bericht.length} Farben. Bericht → scripts/import/sportyfiedBericht.json`);
