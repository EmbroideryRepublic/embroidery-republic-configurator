/**
 * Erzeugt das Asset-Manifest (ADR 0004): productId → colorId → { views, status }.
 *
 * Das Manifest ist die EINZIGE Wahrheit über Bildpfade und entkoppelt die
 * Produktdefinition vollständig von Ordner-/Datei-/Format-/Platzhalter-Wissen.
 * Es wird EINMALIG aus dem aktuellen Bestand geschnappt (die Marken-/Import-
 * Dateien bauen die Pfade heute noch über colorHelpers); danach lebt es in der
 * Asset-Schicht und wird künftig von der Import-/Asset-Pipeline fortgeschrieben
 * (Bildimport der 111, Versionierung) – NICHT mehr von der Produktdefinition.
 *
 * Aufruf: npx tsx scripts/generateAssetManifest.mts
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

type Eintrag = { views: Record<string, string>; status: 'real' | 'placeholder' };

const manifest: Record<string, Record<string, Eintrag>> = {};
for (const p of PRODUCTS) {
  const byColor: Record<string, Eintrag> = {};
  for (const c of p.colors) {
    const views = { ...(c.images as Record<string, string>) };
    const werte = Object.values(views);
    const status: Eintrag['status'] =
      werte.length > 0 && werte.every((u) => u === PLATZHALTER_BILD) ? 'placeholder' : 'real';
    byColor[c.id] = { views, status };
  }
  manifest[p.id] = byColor;
}

const kopf = `/**
 * AUTO-GENERIERT von scripts/generateAssetManifest.mts – NICHT von Hand ändern.
 *
 * Asset-Manifest (ADR 0004): die einzige Wahrheit über Bildpfade je
 * (productId, colorId, view) + Status. Von der Asset-Schicht (src/lib/assets)
 * gelesen; die Produktdefinition kennt keine Pfade mehr.
 */
export type AssetManifestEintrag = { views: Record<string, string>; status: 'real' | 'placeholder' };
export const ASSET_MANIFEST: Record<string, Record<string, AssetManifestEintrag>> = `;

const anzahl = Object.keys(manifest).length;
const farbAnzahl = Object.values(manifest).reduce((n, m) => n + Object.keys(m).length, 0);
const out = `${kopf}${JSON.stringify(manifest, null, 2)};\n`;

const ziel = path.join(process.cwd(), 'src', 'lib', 'assets', 'assetManifest.generated.ts');
await writeFile(ziel, out, 'utf-8');
console.log(`Asset-Manifest geschrieben: ${anzahl} Produkte, ${farbAnzahl} Farben → ${path.relative(process.cwd(), ziel)}`);
