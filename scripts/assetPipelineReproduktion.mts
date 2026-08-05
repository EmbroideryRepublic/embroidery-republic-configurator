/**
 * Reproduktions-Nachweis der Bild-Pipeline (ADR 0006) auf ECHTEN Daten.
 *
 * Läuft die zentrale Pipeline (`baueProduktManifest`) über ALLE Produkte mit den
 * registrierten Quellen (heute nur „Bestand") und prüft, dass die erzeugten
 * Manifest-v2-`views` exakt den heute aufgelösten ECHTEN Bildpfaden entsprechen
 * (Platzhalter ausgenommen). Damit ist bewiesen: die Pipeline bildet den
 * bestehenden Bildbestand verlustfrei ab, bevor ein Hersteller anbindet – und sie
 * versieht jedes Asset zusätzlich mit Content-Hash-Version + Provenienz.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/assetPipelineReproduktion.mts
 */
import { readFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';
import { alleImageSources } from '../src/lib/import/imageSourceRegistry.ts';
import { baueProduktManifest, type Verarbeiter } from '../src/lib/import/pipeline.ts';
import { resolveColorImages, PLATZHALTER_BILD } from '../src/lib/assets/index.ts';
import { kurzHash } from '../src/lib/import/contentHash.ts';
import type { ImportProduktRef } from '../src/lib/import/imageSource.ts';

const quellen = alleImageSources();

// Bestand-Verarbeiter: Bild liegt bereits normalisiert im Store → Speicherort =
// vorhandener Pfad, Version = Content-Hash der Datei (kein Download/keine Konvertierung).
const verarbeite: Verarbeiter = async (ref) => {
  let version = 'fehlt';
  try {
    version = kurzHash(readFileSync(`public${ref.quellUrl.split('?')[0]}`));
  } catch {
    /* Datei nicht am erwarteten Pfad – wird unten als Abweichung sichtbar. */
  }
  return { ...ref, browserPfad: ref.quellUrl, version };
};

function echteViews(productId: string, colorId: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(resolveColorImages(productId, colorId)).filter(([, p]) => p && p !== PLATZHALTER_BILD),
  );
}

let farbenReal = 0;
let assetsGehasht = 0;
let hashFehlt = 0;
const abweichungen: string[] = [];

for (const p of PRODUCTS) {
  const ref: ImportProduktRef = { id: p.id, brand: p.brand, colors: p.colors };
  const manifest = await baueProduktManifest(ref, quellen, verarbeite);
  for (const c of p.colors) {
    const soll = echteViews(p.id, c.id);
    const ist = manifest[c.id]?.views ?? {};
    if (Object.keys(soll).length > 0) farbenReal++;
    if (JSON.stringify(soll) !== JSON.stringify(ist)) {
      abweichungen.push(`${p.id}/${c.id}: soll ${JSON.stringify(soll)} ≠ ist ${JSON.stringify(ist)}`);
    }
    for (const a of manifest[c.id]?.assets ?? []) {
      if (a.version === 'fehlt') hashFehlt++;
      else assetsGehasht++;
    }
  }
}

console.log('=== Asset-Pipeline-Reproduktion (Bestand) ===');
console.log(`Produkte: ${PRODUCTS.length} | Farben mit echten Bildern: ${farbenReal}`);
console.log(`Assets content-gehasht: ${assetsGehasht} | Hash-Datei fehlt: ${hashFehlt}`);
console.log(`views-Abweichungen: ${abweichungen.length}`);
abweichungen.slice(0, 20).forEach((a) => console.log('  ✗ ' + a));
if (abweichungen.length === 0) {
  console.log('✓✓✓ Pipeline reproduziert den echten Bildbestand verlustfrei (views byte-gleich).');
} else {
  process.exitCode = 1;
}
