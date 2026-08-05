/**
 * Bild-Ingest aus der TeamShirts/Spreadshirt-Medienquelle (ADR 0006).
 *
 * Lädt für ein Spreadshirt-`productType` je Farbe ECHTE Produktfotos (kein Model,
 * weißer Hintergrund, farblich passend) für die verfügbaren Ansichten, normalisiert
 * sie (Trim + einheitlicher Weißrand wie der restliche Katalog) und legt png+webp
 * unter public/products/<productId>-<colorId>/ ab. Danach das Manifest neu erzeugen
 * (scripts/generateAssetManifest.mts).
 *
 * QUELLE: die color-swatch-Links der TeamShirts-Produktseite liefern je Farbe die
 * appearanceId (…/product/<slug>/<appearanceId>); das Bild kommt über den
 * Cloudinary-Spiegel images.teamshirts.net (Namespace sprd-na). Views: 1=front,
 * 2=back (3/4 = Ärmel, existieren nur bei manchen PTs – werden validiert).
 *
 * VERIFIKATION (fail-loud, ohne Bildansicht):
 *  - Gültigkeit je (view,appearance): Hash ≠ Fallback-Hash desselben Views
 *    (nicht verfügbare Appearances rendern still den Default → würden sonst als
 *    falsche Farbe importiert). Fehlt eine Ansicht, wird sie ausgelassen.
 *  - Farbtreue: der dominante Kleidungs-Hex des Fotos wird gegen den erwarteten
 *    Katalog-Hex geprüft (ΔE); große Abweichung ⇒ Warnung.
 *  - Dedup: Front-Hash gegen bereits importierte Produkte (verhindert, dass ein
 *    generischer Fallback-PT dieselben Fotos unter zwei Produkten ablegt).
 *
 * Aufruf:  npx tsx scripts/ingestTeamshirts.mts scripts/import/teamshirtsJobs.json
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PUBLIC_PRODUCTS = path.join(process.cwd(), 'public', 'products');
const TARGET_W = 620, TARGET_H = 720, MARGIN_RATIO = 0.86;
const cloudBasis = (namespace: string) =>
  `https://images.teamshirts.net/image/upload/c_limit,f_auto,q_auto,w_1400/v1/${namespace}`;

type ViewMap = Record<string, number>;
type Farbe = { id: string; appearanceId: number; erwarteterHex?: string };
type Job = { productId: string; productType: number; namespace?: string; views?: ViewMap; colors: Farbe[] };

const DEFAULT_VIEWS: ViewMap = { front: 1, back: 2, 'sleeve-left': 3, 'sleeve-right': 4 };
const md5 = (b: Buffer) => createHash('md5').update(b).digest('hex');

async function hole(namespace: string, productType: number, viewId: number, appearanceId: number): Promise<Buffer> {
  const url = `${cloudBasis(namespace)}/productTypes/${productType}/views/${viewId}/appearances/${appearanceId},width=1200,height=1600,mediaType=png`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} für PT${productType} v${viewId} a${appearanceId}`);
  return Buffer.from(await res.arrayBuffer());
}

async function normalisiere(raw: Buffer): Promise<Buffer> {
  const trimmed = await sharp(raw).trim({ threshold: 15 }).toBuffer();
  const inner = await sharp(trimmed)
    .resize(Math.round(TARGET_W * MARGIN_RATIO), Math.round(TARGET_H * MARGIN_RATIO), { fit: 'contain', background: '#ffffff' })
    .toBuffer();
  return sharp({ create: { width: TARGET_W, height: TARGET_H, channels: 3, background: '#ffffff' } })
    .composite([{ input: inner, gravity: 'center' }]).png().toBuffer();
}

/** Kleidungs-Hex: Mittelwert der Bildmitte (dort ist der Kleidungskörper, nicht
 *  der weiße Hintergrund). */
async function koerperHex(png: Buffer): Promise<string> {
  const meta = await sharp(png).metadata();
  const W = meta.width ?? TARGET_W, H = meta.height ?? TARGET_H;
  const { data } = await sharp(png)
    .extract({ left: Math.round(W * 0.35), top: Math.round(H * 0.4), width: Math.round(W * 0.3), height: Math.round(H * 0.25) })
    .resize(1, 1, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
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

const jobsPfad = process.argv[2] ?? 'scripts/import/teamshirtsJobs.json';
const jobs: Job[] = JSON.parse(await fs.readFile(jobsPfad, 'utf-8'));
const bestehend = await bestehendeFrontHashes();
const bericht: any[] = [];

for (const job of jobs) {
  const views = job.views ?? DEFAULT_VIEWS;
  const ns = job.namespace ?? 'sprd-na';
  // Fallback-Hash je View (nicht verfügbare Appearance → Default-Render):
  const fallback: Record<string, string> = {};
  for (const [vn, vid] of Object.entries(views)) fallback[vn] = md5(await hole(ns, job.productType, vid, 999999));

  for (const c of job.colors) {
    const outDir = path.join(PUBLIC_PRODUCTS, `${job.productId}-${c.id}`);
    const gefunden: string[] = [], fehlend: string[] = [];
    let frontHash = '', frontDom = '', frontRaw = '';
    await fs.mkdir(outDir, { recursive: true });
    for (const [vn, vid] of Object.entries(views)) {
      const raw = await hole(ns, job.productType, vid, c.appearanceId);
      const rawHash = md5(raw);
      // Ansicht nicht vorhanden (Default-Fallback) ODER nur eine Kopie der
      // Vorderansicht (viele PTs liefern für Ärmel-Views schlicht das Frontbild):
      if (rawHash === fallback[vn] || (vn !== 'front' && rawHash === frontRaw)) { fehlend.push(vn); continue; }
      const png = await normalisiere(raw);
      await fs.writeFile(path.join(outDir, `${vn}.png`), png);
      await sharp(png).webp({ quality: 90 }).toFile(path.join(outDir, `${vn}.webp`));
      gefunden.push(vn);
      if (vn === 'front') { frontRaw = rawHash; frontHash = md5(png); frontDom = await koerperHex(png); }
    }
    const dupe = frontHash && bestehend.has(frontHash) ? bestehend.get(frontHash)! : null;
    if (frontHash) bestehend.set(frontHash, `${job.productId}-${c.id}`);
    const dElta = c.erwarteterHex && frontDom ? deltaHex(frontDom, c.erwarteterHex) : null;
    bericht.push({ produkt: job.productId, farbe: c.id, appearanceId: c.appearanceId, gefunden, fehlend, frontDom, erwartet: c.erwarteterHex ?? null, deltaE: dElta, dupeMit: dupe });
    const warn = [dupe ? `DUP:${dupe}` : '', dElta !== null && dElta > 60 ? `ΔE=${dElta}!` : ''].filter(Boolean).join(' ');
    console.log(`${job.productId}/${c.id} (a${c.appearanceId}): [${gefunden.join(',')}]${fehlend.length ? ' fehlt:' + fehlend.join(',') : ''} dom=${frontDom} ${warn}`);
  }
}

await fs.writeFile('scripts/import/teamshirtsBericht.json', JSON.stringify(bericht, null, 2));
console.log(`\nFertig. ${bericht.length} Farben. Bericht → scripts/import/teamshirtsBericht.json`);
