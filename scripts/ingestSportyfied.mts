/**
 * Bild-Ingest aus Sportyfied (europäischer Multi-Marken-Händler, ADR 0006).
 *
 * Sportyfied serviert echte Produktfotos je Farbe UND Ansicht über ein klares,
 * skriptbares CDN-Muster:
 *   https://www.sportyfied.com/thumbs/regular/<sku>_<farbslug>_<ansicht>_700x700.png
 * mit ansicht ∈ {front, back, side} (Max-Auflösung 700×700). Vorder- UND
 * Rückansicht sind je Farbe echt vorhanden – genau die geforderte Priorität;
 * die Seitenansicht ist ein Bonus und wird als linke Ärmelansicht abgelegt.
 *
 * Ablage: public/products/<productId>-<colorId>/{front,back,sleeve-left}.{png,webp}
 * (sleeve-right aliased der Manifest-Generator auf front). Danach Manifest neu
 * erzeugen (scripts/generateAssetManifest.mts) + Farben trimmen (applyImportColors).
 *
 * Verifikation (fail-loud): fehlende Ansicht (HTTP≠200 / Mini-Antwort) wird
 * ausgelassen; Front-Duplikate übersprungen; Farbtreue via gemessenem Körper-Hex
 * (ΔE); Cross-Produkt-Dedup über den Front-Hash.
 *
 * Job-Format: [{ productId, sku, colors:[{id, slug, erwarteterHex}] }]
 * Aufruf:  npx tsx scripts/ingestSportyfied.mts scripts/import/sportyfiedJobs.json
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PUBLIC_PRODUCTS = path.join(process.cwd(), 'public', 'products');
const TARGET_W = 620, TARGET_H = 720, MARGIN_RATIO = 0.86;
const CDN = 'https://www.sportyfied.com/thumbs/regular';
/** Datei-Ansicht (Store) → Sportyfied-Ansichtstoken. */
const VIEWS: Record<string, string> = { front: 'front', back: 'back', 'sleeve-left': 'side' };

type Farbe = { id: string; slug: string; erwarteterHex?: string };
type Job = { productId: string; sku: string; colors: Farbe[] };
const md5 = (b: Buffer) => createHash('md5').update(b).digest('hex');

async function hole(sku: string, slug: string, viewToken: string): Promise<Buffer | null> {
  const url = `${CDN}/${sku}_${slug}_${viewToken}_700x700.png`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length > 2000 ? buf : null;   // Mini-Antwort = Platzhalter/404-Bild
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
    const outDir = path.join(PUBLIC_PRODUCTS, `${job.productId}-${c.id}`);
    const gefunden: string[] = [], fehlend: string[] = [];
    let frontHash = '', frontDom = '', frontRaw = '';
    await fs.mkdir(outDir, { recursive: true });
    for (const [vn, token] of Object.entries(VIEWS)) {
      const raw = await hole(job.sku, c.slug, token);
      if (!raw) { fehlend.push(vn); continue; }
      const rawHash = md5(raw);
      if (vn !== 'front' && rawHash === frontRaw) { fehlend.push(vn); continue; }  // Kopie der Front
      const png = await normalisiere(raw);
      await fs.writeFile(path.join(outDir, `${vn}.png`), png);
      await sharp(png).webp({ quality: 90 }).toFile(path.join(outDir, `${vn}.webp`));
      gefunden.push(vn);
      if (vn === 'front') { frontRaw = rawHash; frontHash = md5(png); frontDom = await koerperHex(png); }
    }
    if (!gefunden.includes('front')) { await fs.rm(outDir, { recursive: true, force: true }); }
    const dupe = frontHash && bestehend.has(frontHash) ? bestehend.get(frontHash)! : null;
    if (frontHash) bestehend.set(frontHash, `${job.productId}-${c.id}`);
    const dElta = c.erwarteterHex && frontDom ? deltaHex(frontDom, c.erwarteterHex) : null;
    bericht.push({ produkt: job.productId, farbe: c.id, slug: c.slug, gefunden, fehlend, frontDom, erwartet: c.erwarteterHex ?? null, deltaE: dElta, dupeMit: dupe });
    const warn = [dupe ? `DUP:${dupe}` : '', dElta !== null && dElta > 60 ? `ΔE=${dElta}!` : '', !gefunden.includes('front') ? 'KEINE FRONT' : ''].filter(Boolean).join(' ');
    console.log(`${job.productId}/${c.id} (${c.slug}): [${gefunden.join(',')}]${fehlend.length ? ' fehlt:' + fehlend.join(',') : ''} dom=${frontDom} ${warn}`);
  }
}
await fs.writeFile('scripts/import/sportyfiedBericht.json', JSON.stringify(bericht, null, 2));
console.log(`\nFertig. ${bericht.length} Farben. Bericht → scripts/import/sportyfiedBericht.json`);
