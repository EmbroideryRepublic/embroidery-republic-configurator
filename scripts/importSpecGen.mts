/**
 * Erzeugt die Import-Arbeitsliste fuer die neu erschlossenen Quellen (ADR 0006):
 * je noch offenem Platzhalter-Produkt der abgedeckten Marken die 6-7 wichtigsten
 * Farben (Standardpalette, Namens-Praeferenz) + Quellen-Zuordnung. Ausgabe wird
 * als Workflow-args genutzt (ein Agent je Produkt konstruiert + verifiziert die
 * echten Bild-URLs).
 *
 * Aufruf: npx tsx scripts/importSpecGen.mts > scripts/import/importSpec.json
 */
import { ASSET_MANIFEST as M } from '../src/lib/assets/assetManifest.generated.ts';
import { PRODUCTS } from '../src/config/products/index.ts';

const KANON: { hex: string; names: string[] }[] = [
  { hex: '#1a1a1a', names: ['black', 'schwarz'] },
  { hex: '#f5f5f5', names: ['white', 'weiss', 'weiß'] },
  { hex: '#1b2a4a', names: ['navy', 'french-navy'] },
  { hex: '#a4222f', names: ['red', 'rot', 'classic-red', 'bright-red'] },
  { hex: '#1e5fbf', names: ['royal', 'royal-blue', 'royalblau'] },
  { hex: '#7a7d80', names: ['sport-grey', 'sport-grey-heather', 'grey', 'grau', 'charcoal', 'ash-grey', 'heather-grey', 'convoy-grey'] },
  { hex: '#2f5233', names: ['bottle-green', 'forest-green', 'kelly-green', 'green', 'flaschengruen'] },
];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dE = (a: string, b: string) => { const [r1,g1,b1]=rgb(a),[r2,g2,b2]=rgb(b); return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2); };
const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Marke → Quelle (aus dem Discovery-Workflow verifiziert)
const QUELLE: Record<string, string> = {
  'B&C': 'groener-schulze', 'James+Nicholson': 'groener-schulze',
  "SOL'S": 'myworkwear', 'Build Your Brand': 'buildyourbrand', 'Just Hoods': 'sportyfied-justhoods',
};

const spec: any[] = [];
for (const p of PRODUCTS) {
  const m = M[p.id]; if (!m) continue;
  if (!Object.values(m).every((e) => e.status === 'placeholder')) continue; // nur noch offene
  const quelle = QUELLE[p.brand]; if (!quelle) continue;
  // 6-7 wichtigste Farben: je Grundton die naechste, Namens-Praeferenz
  const gewaehlt: { id: string; name: string; hex: string }[] = [];
  const used = new Set<string>();
  for (const k of KANON) {
    const frei = p.colors.filter((c) => !used.has(c.id));
    const perName = frei.find((c) => k.names.includes(norm(c.id)) || k.names.includes(norm(c.name)));
    const best = perName ?? frei.map((c) => ({ c, d: dE(c.hex, k.hex) })).sort((a, b) => a.d - b.d).find((x) => x.d <= 62)?.c;
    if (best) { gewaehlt.push({ id: best.id, name: best.name, hex: best.hex }); used.add(best.id); }
  }
  spec.push({ productId: p.id, brand: p.brand, name: p.name, productType: p.productType, quelle, colors: gewaehlt });
}
process.stdout.write(JSON.stringify(spec, null, 2) + '\n');
process.stderr.write(`${spec.length} Produkte, ${spec.reduce((n, s) => n + s.colors.length, 0)} Farben\n`);
