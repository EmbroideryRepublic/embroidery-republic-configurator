/**
 * Erzeugt das Asset-Manifest (ADR 0004/0006): productId → colorId → { views, status }.
 *
 * Das Manifest ist die EINZIGE Wahrheit über Bildpfade und entkoppelt die
 * Produktdefinition vollständig von Ordner-/Datei-/Format-/Platzhalter-Wissen.
 *
 * QUELLE = die tatsächlichen Dateien unter public/products/ (nicht mehr die
 * Produktdefinition, die seit ADR 0004 keine Bildpfade mehr trägt). Für jede
 * Produktfarbe wird der Ablageordner bestimmt und die vorhandenen Ansichten als
 * ECHT eingetragen; fehlt der Ordner (Bildimport noch offen), steht die Farbe auf
 * `placeholder`. So schreibt der Bildimport das Manifest einfach durch erneutes
 * Ausführen fort: Bilder in public/products/<key>/ ablegen → dieses Skript laufen.
 *
 * Ablage-Konvention (siehe src/lib/assets/index.ts::bildpfad):
 *   - Bestandsprodukte: exakter Ablageordner je (productId,colorId) aus
 *     scripts/assetStorageKeys.json (einmalig verlustfrei aus dem Bestand
 *     abgeleitet – 43 Produkte / 329 Farben; erfasst auch den einen Sonderfall,
 *     dessen Ordner-Basis von der Produkt-ID abweicht).
 *   - NEU importierte Produkte nutzen für ALLE Farben den suffixierten Ordner
 *     public/products/<productId>-<colorId>/<view>.webp (eindeutig, kein Anker
 *     nötig) – der Generator findet sie automatisch, ohne Kartenpflege.
 *   - Server-Render-PNG (<view>.png) liegt neben jeder .webp, ist aber nicht Teil
 *     des Manifests (der Renderer leitet den Pfad über rasterPfad() ab).
 *
 * Fehlt für eine deklarierte Ansicht die Datei, aber `front` ist echt vorhanden,
 * wird die Ansicht auf `front` aliased (historisches „front/back real, Rest =
 * Vorderbild"-Verhalten) – so entsteht nie eine halb-leere reale Farbe.
 *
 * Aufruf:  npx tsx scripts/generateAssetManifest.mts
 * Verify:  MANIFEST_OUT=scripts/_m.ts npx tsx scripts/generateAssetManifest.mts  (schreibt woanders)
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

type Eintrag = { views: Record<string, string>; status: 'real' | 'placeholder' };

const PUBLIC_PRODUCTS = path.join(process.cwd(), 'public', 'products');
/** Exakter Ablageordner je (productId,colorId) für Bestandsprodukte. */
const storageKeys: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(path.join(process.cwd(), 'scripts', 'assetStorageKeys.json'), 'utf-8'),
);

/** view-ID (Konfig, Unterstrich) → Dateibasisname (Bindestrich). */
const dateiBasis = (view: string): string => view.replace(/_/g, '-');

const hatDatei = (key: string, view: string): boolean =>
  existsSync(path.join(PUBLIC_PRODUCTS, key, `${dateiBasis(view)}.webp`));

/** Ablage-Ordner (storageKey) einer Produktfarbe oder null (nur Platzhalter).
 *  Bestand: aus der Karte; Neu-Import: suffixierter Ordner <pid>-<cid>. */
function storageKey(productId: string, colorId: string): string | null {
  const bekannt = storageKeys[productId]?.[colorId];
  if (bekannt) return bekannt;
  const suffixed = `${productId}-${colorId}`;
  if (existsSync(path.join(PUBLIC_PRODUCTS, suffixed))) return suffixed;
  return null;
}

const manifest: Record<string, Record<string, Eintrag>> = {};
let realFarben = 0;
let platzhalterFarben = 0;

for (const p of PRODUCTS) {
  const byColor: Record<string, Eintrag> = {};
  for (const c of p.colors) {
    const key = storageKey(p.id, c.id);
    const views: Record<string, string> = {};
    const frontReal = !!key && hatDatei(key, 'front');
    if (key && frontReal) {
      for (const view of p.views) {
        if (hatDatei(key, view)) {
          views[view] = `/products/${key}/${dateiBasis(view)}.webp`;
          continue;
        }
        // KEIN Vorderbild-Alias mehr. Ein Frontfoto unter „Rückseite" oder
        // „Ärmel" ist sichtbar falsch (Kragen, Tasche, Aufdruck stimmen nicht).
        if (view === 'back') {
          // Rückseite bleibt geführt (Rückendruck ist ein Kernangebot) und
          // bekommt den neutralen Platzhalter als ehrlichen Fallback.
          views[view] = PLATZHALTER_BILD;
        }
        // Ärmelansichten OHNE eigenes Bild werden gar nicht erst geführt –
        // die UI blendet sie dadurch aus, statt sie mit der Front zu füllen.
      }
    }
    // „real" hängt allein an einer echten VORDERANSICHT. Vorher musste jede
    // deklarierte Ansicht vorhanden sein, was nur durch das Front-Alias erfüllt
    // war – ohne Alias wären sonst fast alle Farben faelschlich Platzhalter.
    if (frontReal) {
      byColor[c.id] = { views, status: 'real' };
      realFarben++;
    } else {
      const ph: Record<string, string> = {};
      for (const view of p.views) ph[view] = PLATZHALTER_BILD;
      byColor[c.id] = { views: ph, status: 'placeholder' };
      platzhalterFarben++;
    }
  }
  manifest[p.id] = byColor;
}

const kopf = `/**
 * AUTO-GENERIERT von scripts/generateAssetManifest.mts – NICHT von Hand ändern.
 *
 * Asset-Manifest (ADR 0004): die einzige Wahrheit über Bildpfade je
 * (productId, colorId, view) + Status. Von der Asset-Schicht (src/lib/assets)
 * gelesen; die Produktdefinition kennt keine Pfade mehr. Quelle sind die
 * tatsächlichen Dateien unter public/products/ – erneut ausführen nach Bildimport.
 */
export type AssetManifestEintrag = { views: Record<string, string>; status: 'real' | 'placeholder' };
export const ASSET_MANIFEST: Record<string, Record<string, AssetManifestEintrag>> = `;

const anzahl = Object.keys(manifest).length;
const out = `${kopf}${JSON.stringify(manifest, null, 2)};\n`;
const ziel = process.env.MANIFEST_OUT ?? path.join(process.cwd(), 'src', 'lib', 'assets', 'assetManifest.generated.ts');
writeFileSync(ziel, out, 'utf-8');
console.log(`Asset-Manifest: ${anzahl} Produkte, ${realFarben} real + ${platzhalterFarben} Platzhalter → ${path.relative(process.cwd(), ziel)}`);
