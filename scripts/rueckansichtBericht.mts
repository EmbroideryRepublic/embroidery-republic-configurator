/**
 * Wo zeigt der Shop beim Klick auf „Rückseite" noch den Platzhalter?
 *
 * Die Vorderansicht ist überall echt; die Rückseite fällt auf den neutralen
 * Platzhalter zurück, wo der Händler kein Rückenfoto führt. Für den Kunden ist
 * das trotzdem eine Silhouette – diese Liste ist die Arbeitsvorlage, um sie zu
 * schließen, und am Ende die Grundlage der dokumentierten Ausnahmen.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/rueckansichtBericht.mts [--json <datei>]
 */
import { writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

type Zeile = { id: string; marke: string; name: string; typ: string; ohne: number; gesamt: number; farben: string[] };

const zeilen: Zeile[] = [];
let echt = 0;
let offen = 0;

for (const p of PRODUCTS) {
  const real = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const ohne = real.filter((c) => {
    const b = ASSET_MANIFEST[p.id]?.[c.id]?.views?.back;
    return !b || b.includes('_platzhalter');
  });
  echt += real.length - ohne.length;
  offen += ohne.length;
  if (ohne.length) {
    zeilen.push({
      id: p.id,
      marke: p.brand,
      name: p.name,
      typ: p.productType,
      ohne: ohne.length,
      gesamt: real.length,
      farben: ohne.map((c) => `${c.id}|${c.name}|${c.hex}`),
    });
  }
}

zeilen.sort((a, b) => b.ohne - a.ohne);
console.log(
  `Rückansicht echt ${echt} · Platzhalter ${offen} · ${zeilen.length} von ${PRODUCTS.length} Produkten betroffen`
);
for (const z of zeilen) console.log(`  ${String(z.ohne).padStart(3)}/${String(z.gesamt).padStart(3)}  ${z.id}`);

const ziel = process.argv.indexOf('--json');
if (ziel > -1 && process.argv[ziel + 1]) {
  writeFileSync(process.argv[ziel + 1]!, JSON.stringify(zeilen, null, 2));
  console.log(`\n→ ${process.argv[ziel + 1]}`);
}
