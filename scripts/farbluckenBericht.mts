/**
 * Wie viele Farben sind im Shop noch ausgeblendet, weil kein echtes
 * Herstellerfoto vorliegt? Arbeitsliste für den Bildimport – und zugleich die
 * Zahl, die am Ende in den Abschlussbericht gehört.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/farbluckenBericht.mts [--json <datei>]
 */
import { writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

type Zeile = { id: string; marke: string; name: string; fehlt: number; gesamt: number; farben: string[] };

const zeilen: Zeile[] = [];
let ges = 0;
let real = 0;

for (const p of PRODUCTS) {
  const ohne = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status !== 'real');
  ges += p.colors.length;
  real += p.colors.length - ohne.length;
  if (ohne.length) {
    zeilen.push({
      id: p.id,
      marke: p.brand,
      name: p.name,
      fehlt: ohne.length,
      gesamt: p.colors.length,
      farben: ohne.map((c) => `${c.id}|${c.name}|${c.hex}`),
    });
  }
}

zeilen.sort((a, b) => b.fehlt - a.fehlt);

console.log(
  `Farbvarianten ${ges} · mit echtem Foto ${real} · ausgeblendet ${ges - real} ` +
    `(${zeilen.length} von ${PRODUCTS.length} Produkten betroffen)`
);
for (const z of zeilen) console.log(`  ${String(z.fehlt).padStart(3)}/${String(z.gesamt).padStart(3)}  ${z.id}`);

const ziel = process.argv.indexOf('--json');
if (ziel > -1 && process.argv[ziel + 1]) {
  writeFileSync(process.argv[ziel + 1]!, JSON.stringify(zeilen, null, 2));
  console.log(`\n→ ${process.argv[ziel + 1]}`);
}
