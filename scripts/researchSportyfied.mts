/**
 * Autonome Sportyfied-Recherche (ADR 0006): baut Ingest-Jobs aus dem Produkt-
 * Sitemap. Für jeden baseSlug liefert das Sitemap alle Farb-Slugs (volle Namen);
 * die 6–7 wichtigsten Katalogfarben (Nähe zur Standardpalette) werden namentlich
 * dem passenden Farb-Slug zugeordnet. Die exakten Bild-URLs zieht dann der Ingest
 * je Farbseite (robust gegen die uneinheitlichen Sportyfied-Dateimuster).
 *
 * Spec: [{ productId, baseSlug }]
 * Aufruf: npx tsx scripts/researchSportyfied.mts <spec.json> <sitemap.xml>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';

type Spec = { productId: string; baseSlug: string };
const MAX = 7;
/** Standard-Grundtöne: bevorzugter Farbname + Referenz-Hex (Fallback). */
const KANON: { hex: string; names: string[] }[] = [
  { hex: '#1a1a1a', names: ['black'] },
  { hex: '#f5f5f5', names: ['white'] },
  { hex: '#1b2a4a', names: ['navy', 'navy-blue'] },
  { hex: '#a4222f', names: ['red'] },
  { hex: '#1e5fbf', names: ['royal', 'royal-blue'] },
  { hex: '#7a7d80', names: ['sport-grey', 'sport-grey-heather', 'grey', 'charcoal', 'ash-grey', 'heather-grey'] },
  { hex: '#2f5233', names: ['bottle-green', 'forest-green', 'kelly-green', 'green'] },
];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dE = (a: string, b: string) => { const [r1,g1,b1]=rgb(a),[r2,g2,b2]=rgb(b); return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2); };
const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/\b(heather|solid|neon|melange|meliert|marl)\b/g, '')
  .replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SUB = /^(women|womens|ladies|female|kids|youth|baby|men|mens|unisex)(-|$)/;

const spec: Spec[] = JSON.parse(readFileSync(process.argv[2] ?? 'scripts/import/sportyfiedSpec.json', 'utf-8'));
const sitemap = readFileSync(process.argv[3] ?? 'scripts/import/sf_sitemap.xml', 'utf-8');
const alleSlugs = new Set([...sitemap.matchAll(/\/en\/([a-z0-9-]+)/g)].map((m) => m[1]));
const jobs: any[] = [];

for (const { productId, baseSlug } of spec) {
  const prod = PRODUCTS.find((p) => p.id === productId);
  if (!prod) { console.log(`✗ ${productId}: nicht im Katalog`); continue; }
  // Farb-Slugs = Suffixe hinter baseSlug, ohne Unter-Produkt-Qualifizierer.
  const colorSlugs = [...alleSlugs]
    .filter((s) => s.startsWith(baseSlug + '-'))
    .map((s) => s.slice(baseSlug.length + 1))
    .filter((s) => !SUB.test(s) && !s.includes('-women') && !s.includes('-kids') && !s.includes('-youth'))
    // Keine Mehrfarb-/Muster-Varianten (gestreift, meliert-kombi, tie-dye) für
    // Standardfarben – die würden z.B. "white-navy-striped" als Weiß wählen.
    .filter((s) => !/strip|camo|tie-dye|-and-|melange/.test(s));
  if (!colorSlugs.length) { console.log(`✗ ${productId}: keine Farb-Slugs für ${baseSlug}`); continue; }
  const slugNorm = new Map(colorSlugs.map((s) => [norm(s), s]));

  const zuord = prod.colors.map((c) => {
    const n = norm(c.id), nn = norm(c.name);
    let slug = slugNorm.get(n) ?? slugNorm.get(nn) ?? colorSlugs.find((s) => norm(s) === n || norm(s) === nn);
    // Nur numerische Suffix-Varianten zulassen (white↔white-2), nie eine andere
    // Farbe (white↛white-navy):
    if (!slug) slug = colorSlugs.find((s) => { const sn = norm(s); return (sn.startsWith(n + '-') && /^\d+$/.test(sn.slice(n.length + 1))) || (n.startsWith(sn + '-') && /^\d+$/.test(n.slice(sn.length + 1))); });
    return slug ? { id: c.id, colorSlug: slug, hex: c.hex } : null;
  }).filter(Boolean) as { id: string; colorSlug: string; hex: string }[];

  // Ausgewogener Standardsatz: je Grundton (schwarz/weiß/navy/rot/royal/grau/grün)
  // die farblich NÄCHSTE verfügbare Katalogfarbe, sofern nah genug (kein Fehlgriff).
  const gewaehlt: { id: string; colorSlug: string; erwarteterHex: string }[] = [];
  const usedId = new Set<string>(), usedSlug = new Set<string>();
  for (const k of KANON) {
    const frei = zuord.filter((z) => !usedId.has(z.id) && !usedSlug.has(z.colorSlug));
    // 1. bevorzugt: Katalogfarbe mit dem Standard-Namen dieses Grundtons.
    // 2. sonst: farblich nächste, sofern nah genug (kein Fehlgriff).
    const perName = frei.find((z) => k.names.includes(norm(z.id)) || k.names.includes(norm(z.colorSlug)));
    const best = perName ?? frei.map((z) => ({ z, d: dE(z.hex, k.hex) })).sort((a, b) => a.d - b.d).find((x) => x.d <= 62)?.z;
    if (best) {
      gewaehlt.push({ id: best.id, colorSlug: best.colorSlug, erwarteterHex: best.hex });
      usedId.add(best.id); usedSlug.add(best.colorSlug);
    }
  }

  jobs.push({ productId, baseSlug, colors: gewaehlt.map((z) => ({ id: z.id, colorSlug: z.colorSlug, erwarteterHex: z.erwarteterHex })) });
  console.log(`✓ ${productId}: ${colorSlugs.length} Farb-Slugs → ${gewaehlt.length}: ${gewaehlt.map((z) => `${z.id}=${z.colorSlug}`).join(', ')}`);
}

writeFileSync('scripts/import/sportyfiedJobs.json', JSON.stringify(jobs, null, 2));
console.log(`\n${jobs.length} Jobs → scripts/import/sportyfiedJobs.json`);
