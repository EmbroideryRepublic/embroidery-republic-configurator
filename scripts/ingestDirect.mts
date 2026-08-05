/**
 * Universeller Bild-Ingest aus EXPLIZITEN URLs (ADR 0006).
 *
 * Quellen-agnostisch: nimmt je Farbe die fertigen Bild-URLs (front/back/side) und
 * legt normalisierte png+webp unter public/products/<productId>-<colorId>/ ab.
 * Damit laesst sich jede neu erschlossene Quelle (Hersteller-CDN, Haendler)
 * sofort anbinden – die quellenspezifische URL-Konstruktion passiert vorher im
 * jeweiligen Recherche-Skript, das Herunterladen/Normalisieren/Verifizieren ist
 * hier geteilt.
 *
 * Job: [{ productId, quelle?, colors:[{ id, erwarteterHex?, front, back?, side? }] }]
 *   front ist Pflicht; back/side optional. (back = hoechste Prioritaet nach front.)
 * Ablage: front.*, back.*, sleeve-left.* (= side). sleeve-right aliased der
 * Manifest-Generator auf front.
 *
 * Verifikation: HTTP 200 + Mindestgroesse; Front-Duplikat-Skip; Farbtreue via
 * gemessenem Koerper-Hex (ΔE); Cross-Produkt-Dedup ueber den Front-Hash.
 *
 * Aufruf: npx tsx scripts/ingestDirect.mts scripts/import/directJobs.json
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PUBLIC_PRODUCTS = path.join(process.cwd(), 'public', 'products');
const TARGET_W = 620, TARGET_H = 720, MARGIN_RATIO = 0.86;
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

type Farbe = { id: string; erwarteterHex?: string; front: string; back?: string; side?: string };
type Job = { productId: string; quelle?: string; colors: Farbe[] };
const md5 = (b: Buffer) => createHash('md5').update(b).digest('hex');

async function fetchBuf(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { headers: UA, redirect: 'follow' });
    if (!res.ok) return null;
    const b = Buffer.from(await res.arrayBuffer());
    return b.length > 2500 ? b : null;
  } catch { return null; }
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

const jobs: Job[] = JSON.parse(await fs.readFile(process.argv[2] ?? 'scripts/import/directJobs.json', 'utf-8'));
const bestehend = await bestehendeFrontHashes();
const bericht: any[] = [];

for (const job of jobs) {
  for (const c of job.colors) {
    const outDir = path.join(PUBLIC_PRODUCTS, `${job.productId}-${c.id}`);
    const gefunden: string[] = [];
    let frontHash = '', frontDom = '', frontRaw = '';
    await fs.mkdir(outDir, { recursive: true });
    const ziel: [string, string | undefined][] = [['front', c.front], ['back', c.back], ['sleeve-left', c.side]];
    for (const [vn, u] of ziel) {
      if (!u) continue;
      const raw = await fetchBuf(u);
      if (!raw) continue;
      const rawHash = md5(raw);
      if (vn !== 'front' && rawHash === frontRaw) continue;         // Kopie der Front
      const png = await normalisiere(raw);
      await fs.writeFile(path.join(outDir, `${vn}.png`), png);
      await sharp(png).webp({ quality: 90 }).toFile(path.join(outDir, `${vn}.webp`));
      gefunden.push(vn);
      if (vn === 'front') { frontRaw = rawHash; frontHash = md5(png); frontDom = await koerperHex(png); }
    }
    if (!gefunden.includes('front')) await fs.rm(outDir, { recursive: true, force: true });
    const dupe = frontHash && bestehend.has(frontHash) ? bestehend.get(frontHash)! : null;
    if (frontHash) bestehend.set(frontHash, `${job.productId}-${c.id}`);
    const dElta = c.erwarteterHex && frontDom ? deltaHex(frontDom, c.erwarteterHex) : null;
    bericht.push({ produkt: job.productId, farbe: c.id, quelle: job.quelle ?? null, gefunden, frontDom, erwartet: c.erwarteterHex ?? null, deltaE: dElta, dupeMit: dupe });
    const warn = [dupe ? `DUP:${dupe}` : '', dElta !== null && dElta > 70 ? `ΔE=${dElta}!` : '', !gefunden.includes('front') ? 'KEINE FRONT' : ''].filter(Boolean).join(' ');
    console.log(`${job.productId}/${c.id}: [${gefunden.join(',')}] dom=${frontDom} ${warn}`);
  }
}
await fs.writeFile('scripts/import/directBericht.json', JSON.stringify(bericht, null, 2));
console.log(`\nFertig. ${bericht.length} Farben. Bericht → scripts/import/directBericht.json`);
