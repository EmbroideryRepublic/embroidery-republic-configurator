/**
 * Gemeinsame Import-Pipeline: verifizierte Lieferanten-Rohdaten → Katalog.
 *
 * **Eine** Pipeline für ALLE Lieferanten (ADR 0004). Ein Lieferant liefert
 * ausschließlich `RohProdukt[]` (sein Adapter übersetzt DOM/CSV/API/PIM in den
 * Vertrag `@/lib/import/rohProdukt`). Alles danach läuft hier **zentral und
 * identisch** – **ohne jede lieferantenspezifische Verzweigung**:
 *   1. Inferenz (`@/lib/import/produktInferenz`): ID, Größen, Produkttyp,
 *      Farbgruppe, Material, Geschlecht/Passform – für jede Quelle gleich.
 *   2. Facetten-Delta (nur tatsächlich genutzte, in der Hand-Basis fehlende Werte).
 *   3. Geometrie-Klassenübernahme (printAreaAlias.generated.ts).
 *   4. Emission der drei generierten Katalogdateien.
 *
 * Erzeugt DETERMINISTISCH:
 *   - src/config/products/importiert.generated.ts        (ProductConfig[])
 *   - src/config/products/facettenGeneriert.generated.ts (Facetten-Delta)
 *   - src/config/printAreaAlias.generated.ts             (Klassen-Geometrie)
 *
 * Ein **neuer Lieferant** = ein Adapter, der `RohProdukt[]` liefert, plus ein
 * Eintrag in `IMPORT_QUELLEN` (Provenienz-Label + Rohdatenquelle). Keine
 * bestehende Pipeline-Datei wird geändert.
 *
 * Grundsatz „kein Raten": Alle Sachdaten stammen aus der Quelle; Farbgruppen
 * werden objektiv aus dem verifizierten Hex bestimmt. Neue Produkte erhalten
 * KEIN supplier-Mapping (das braucht geprüfte Tabellen) – sie erscheinen wie
 * vorgesehen im Coverage-Report als offene Aufgabe.
 *
 * Aufruf:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/importiereProdukte.mts [rawPath]
 * Ausgabeziel überschreibbar (Paritäts-/Trockenlauf, schreibt NICHT in src/):
 *   IMPORT_OUT_DIR=/tmp/out npx tsx ... scripts/importiereProdukte.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import {
  FARBGRUPPEN, MATERIAL_GRUPPEN, PASSFORMEN,
  type Farbgruppe, type MaterialGruppe, type Passform,
} from '../src/config/products/facetten.ts';
import {
  FARBGRUPPEN_GENERIERT, MATERIAL_GRUPPEN_GENERIERT, PASSFORMEN_GENERIERT,
} from '../src/config/products/facettenGeneriert.generated.ts';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.generated.ts';
import { sortierePositionen } from '../src/config/decorationPositions.ts';
import type { ProductType, QualityTier } from '../src/types/index.ts';
import type { RohProdukt, ImportQuelle } from '../src/lib/import/rohProdukt.ts';
import {
  idAusUrl, normSize, farbgruppeVon, materialGruppenVon, produktTyp,
  geschlechtVon, fitVon, passformVon, slug, GEO_REP, TYP_LABEL, markeNormalisieren,
} from '../src/lib/import/produktInferenz.ts';

const AUFNAHME_DATUM = '2026-08-04';
const OUT_DIR = process.env.IMPORT_OUT_DIR ?? '.';
// Repo-relativer Default (reproduzierbar auf jeder Maschine); per argv[2] überschreibbar.
const RAW_PATH = process.argv[2] ?? 'scripts/import/products-raw.json';

// ── Importquellen ──────────────────────────────────────────────────────────
// Die einzige Stelle, die ein neuer Lieferant berührt: Provenienz-Label + seine
// Rohdaten (Adapter-Output). Reihenfolge = Verarbeitungsreihenfolge.
const IMPORT_QUELLEN: { quelle: string; rawPath: string }[] = [
  { quelle: 'textil-grosshandel.eu', rawPath: RAW_PATH },
];
const quellen: ImportQuelle[] = IMPORT_QUELLEN.map(({ quelle, rawPath }) => ({
  quelle,
  produkte: JSON.parse(readFileSync(rawPath, 'utf8')) as RohProdukt[],
}));

// ── Hand-Basis der Facetten (merged minus generiert) ───────────────────
// ACHTUNG – bekannte Selbst-Referenz (dokumentiert in ADR 0004): die Hand-Basis
// wird aus der gemergten Facettenmenge MINUS dem eigenen generierten Delta
// (facettenGeneriert.generated.ts) bestimmt. Der Generator ist dadurch nicht
// idempotent gegen seinen eigenen Facetten-Output; die on-disk-Dateien sind die
// eingefrorene Wahrheit. Bewusst unverändert gelassen (byte-neutral), bis eine
// reine Hand-Basis (facetten.ts ohne Delta) die Kopplung auflöst (M4/M5).
const handColorNames = new Set(Object.keys(FARBGRUPPEN).filter((k) => !(k in FARBGRUPPEN_GENERIERT)));
const handMaterials = new Set(Object.keys(MATERIAL_GRUPPEN).filter((k) => !(k in MATERIAL_GRUPPEN_GENERIERT)));
const handFits = new Set(Object.keys(PASSFORMEN).filter((k) => !(k in PASSFORMEN_GENERIERT)));

// ── Dedup gegen den handgepflegten Bestand (per ID) ─────────────────────
// NUR gegen den Handbestand prüfen, NICHT gegen die zuvor selbst generierten
// Importe (bildStatus:'fehlt' überspringen) – sonst wäre der Lauf nicht
// idempotent und würde die eigene Ausgabe beim zweiten Mal leeren. `bildStatus`
// ist damit die Idempotenz-Marke DES GENERATORS (kein App-Laufzeit-Leser).
//
// Dedup läuft über die ID. Ein Artikelnummern-Abgleich entfällt bewusst: seit
// ADR 0004 (Lieferant vom Produkt gelöst) trägt die Produktdefinition keine
// Artikelnummer mehr. Ein späterer echter Re-Import kann die Artikelnummern bei
// Bedarf aus der Lieferantenschicht (supplierRefVon) ziehen – hier bewusst
// nicht, um die Pipeline nicht an die Lieferantenschicht zu koppeln.
const vorhandeneIds = new Set<string>();
for (const p of PRODUCTS) {
  if (p.bildStatus === 'fehlt') continue;
  vorhandeneIds.add(p.id);
}

// ── Facetten-Delta-Akkumulatoren ────────────────────────────────────────
const farbDelta: Record<string, Farbgruppe> = {};
const matDelta: Record<string, MaterialGruppe[]> = {};
const fitDelta: Record<string, Passform> = {};
const geoAlias: Record<string, string> = {};
const eintraege: string[] = [];
const neu: string[] = [];
const uebersprungen: { name: string; grund: string }[] = [];
const gesehen = new Set<string>();

// ── Zentrale Verarbeitung – identisch für JEDE Quelle ───────────────────
for (const { quelle, produkte } of quellen) {
  for (const p of produkte) {
    verarbeite(p, quelle);
  }
}

function verarbeite(p: RohProdukt, quelle: string): void {
  const id = idAusUrl(p.url);
  if (vorhandeneIds.has(id) || gesehen.has(id)) { uebersprungen.push({ name: p.name, grund: `ID ${id} existiert bereits` }); return; }
  gesehen.add(id);

  const typ = produktTyp(p.name, p.sourceCategory);
  const g = geschlechtVon(p.name);
  const fit = fitVon(g);
  const rep = GEO_REP[typ];
  if (!PRINT_AREA_DATA[rep]) throw new Error(`Geometrie-Rep fehlt: ${rep} für ${id}`);
  geoAlias[id] = rep;
  // Explizite Ansichtsliste (View-IDs) aus dem Klassen-Rep, in Registry-
  // Reihenfolge – die einzige Quelle „welche Ansichten hat dieses Produkt".
  // (Ersetzt den früheren hasSleeves-Boolean vollständig, siehe M2.)
  const repViews = sortierePositionen(Object.keys(PRINT_AREA_DATA[rep] ?? {}));
  const viewsLine = `\n    views: ${JSON.stringify(repViews)},`;

  // Facetten-Delta sammeln
  if (!handMaterials.has(p.material)) matDelta[p.material] = materialGruppenVon(p.material);
  if (!handFits.has(fit)) fitDelta[fit] = passformVon(g);

  // Farben
  const seenColorId = new Set<string>();
  const farbLits: string[] = [];
  for (const c of p.colors) {
    let cid = slug(c.name) || 'farbe';
    while (seenColorId.has(cid)) cid += '-x';
    seenColorId.add(cid);
    const hex = '#' + c.hex.replace('#', '').toUpperCase();
    if (!handColorNames.has(c.name) && !(c.name in farbDelta)) farbDelta[c.name] = farbgruppeVon(c.name, hex);
    farbLits.push(`{ id: ${JSON.stringify(cid)}, name: ${JSON.stringify(c.name)}, hex: ${JSON.stringify(hex)} }`);
  }

  const qt: QualityTier = p.qualityTier ?? 'standard';
  const gm = typeof p.weight === 'number' && p.weight > 0 ? p.weight : null;
  const brand = markeNormalisieren(p.brand);
  // Kein "Produktfotos folgen" mehr: seit Abschluss des Bildimports
  // (docs/bildimport-abschlussbericht.md) hat jedes Katalogprodukt echte
  // Herstellerfotos – der Satz stand sonst dauerhaft falsch auf der Produktseite.
  const desc = `${p.name} von ${brand}. ${p.material}${gm ? `, ${gm} g/m²` : ''}. Verifizierte Lieferantendaten (${quelle}).`;
  const tagline = `${TYP_LABEL[typ]} von ${brand}`;
  const sizesLit = JSON.stringify([...new Set(p.sizes.map(normSize))]);
  const weightLine = gm ? `\n    weightGsm: ${gm},` : '';
  // Größentabelle (verifiziert aus der Quelle) – nur mit vollständigen Breite/Höhe.
  const guide = (p.sizeGuide ?? []).filter((m) => m.breiteCm && m.hoeheCm);
  let sizeGuideLine = '';
  if (guide.length) {
    const ms = guide.map((m) => `        { size: ${JSON.stringify(normSize(m.size))}, breiteCm: ${m.breiteCm}, hoeheCm: ${m.hoeheCm}${m.aermelCm ? `, aermelCm: ${m.aermelCm}` : ''} }`).join(',\n');
    sizeGuideLine = `\n    sizeGuide: {\n      measurements: [\n${ms},\n      ],\n      fitRating: 50,\n    },`;
  }
  const materialDetail = `${p.material}${gm ? ` (${gm} g/m²)` : ''}`;

  eintraege.push(`  {
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(brand)},
    productType: ${JSON.stringify(typ)},
    qualityTier: ${JSON.stringify(qt)},
    purchasePrice: ${p.basePriceNet},
    basePrice: computeBasePrice(${p.basePriceNet}, ${JSON.stringify(qt)}),
    sizes: ${sizesLit},
    tagline: ${JSON.stringify(tagline)},
    material: ${JSON.stringify(p.material)},${weightLine}
    fit: ${JSON.stringify(fit)},
    description: ${JSON.stringify(desc)},
    certifications: [],
    careInstructions: 'Pflege gemäß Herstelleretikett',
    aufgenommenAm: ${JSON.stringify(AUFNAHME_DATUM)},
    bildStatus: 'fehlt',${viewsLine}${sizeGuideLine}
    detailedDescription: {
      supplierBrand: ${JSON.stringify(brand)},
      productType: ${JSON.stringify(TYP_LABEL[typ])},
      gender: ${JSON.stringify(g)},
      sustainability: '',
      materialDetail: ${JSON.stringify(materialDetail)},
      countryOfOrigin: ${JSON.stringify(p.country ?? '')},
      bulletPoints: [],
    },
    colors: platzhalterFarbSet([
${farbLits.map((l) => '      ' + l).join(',\n')},
    ], ${JSON.stringify(repViews)}),
  }`);
  neu.push(`${p.brand} – ${p.name} (${typ}, ${p.colors.length} Farben) [${id}]`);
}

// ── Dateien schreiben ──────────────────────────────────────────────────
function objLit(obj: Record<string, unknown>, val: (v: unknown) => string): string {
  const keys = Object.keys(obj).sort();
  if (keys.length === 0) return '{}';
  return '{\n' + keys.map((k) => `  ${JSON.stringify(k)}: ${val(obj[k])},`).join('\n') + '\n}';
}
function schreibe(relPfad: string, inhalt: string): void {
  const ziel = join(OUT_DIR, relPfad);
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, inhalt);
}

const importiert = `/**
 * AUTO-GENERIERT von scripts/importiereProdukte.mts – nicht von Hand pflegen.
 * Verifizierte Quelldaten (textil-grosshandel.eu). Bilder folgen
 * (bildStatus:'fehlt'); Farb-Swatches nutzen den echten Swatch-Hex.
 * Druckgeometrie per Klassen-Übernahme (printAreaAlias.generated.ts).
 */
import { computeBasePrice } from '@/config/pricing/marginTiers';
import { platzhalterFarbSet } from './colorHelpers';
import type { ProductConfig } from './types';

export const PRODUCTS: ProductConfig[] = [
${eintraege.join(',\n')}${eintraege.length ? ',' : ''}
];
`;
schreibe('src/config/products/importiert.generated.ts', importiert);

const facetten = `/**
 * AUTO-GENERIERT von scripts/importiereProdukte.mts – nicht von Hand pflegen.
 * Facetten-Delta der importierten Produkte (Ergänzung zu facetten.ts).
 * Farbgruppen deterministisch aus dem verifizierten Swatch-Hex (nächster Anker
 * in FARBGRUPPE_HEX). Enthält nur tatsächlich genutzte, in der Hand-Basis noch
 * fehlende Werte.
 */
import type { Farbgruppe, Geschlecht, MaterialGruppe, Passform } from './facetten';

export const MATERIAL_GRUPPEN_GENERIERT: Record<string, MaterialGruppe[]> = ${objLit(matDelta, (v) => JSON.stringify(v))};

export const PASSFORMEN_GENERIERT: Record<string, Passform> = ${objLit(fitDelta, (v) => JSON.stringify(v))};

export const GESCHLECHTER_GENERIERT: Record<string, Geschlecht[]> = {};

export const FARBGRUPPEN_GENERIERT: Record<string, Farbgruppe> = ${objLit(farbDelta, (v) => JSON.stringify(v))};
`;
schreibe('src/config/products/facettenGeneriert.generated.ts', facetten);

const alias = `/**
 * AUTO-GENERIERT von scripts/importiereProdukte.mts – nicht von Hand pflegen.
 * Klassen-Übernahme der Druckgeometrie: neue Produkt-ID → Bestandsprodukt
 * gleicher Klasse, dessen gemessene Druckflächen übernommen werden, bis eine
 * eigene Messung vorliegt.
 */
export const GEOMETRY_ALIAS: Record<string, string> = ${objLit(geoAlias, (v) => JSON.stringify(v))};
`;
schreibe('src/config/printAreaAlias.generated.ts', alias);

// ── Bericht ────────────────────────────────────────────────────────────
console.log(`\n=== IMPORT-PIPELINE ===`);
console.log(`Quellen: ${quellen.length} (${quellen.map((q) => `${q.quelle}: ${q.produkte.length}`).join(', ')})`);
console.log(`Roh-Produkte gesamt: ${quellen.reduce((n, q) => n + q.produkte.length, 0)}`);
console.log(`NEU angelegt: ${neu.length}`);
neu.forEach((n) => console.log('  + ' + n));
console.log(`Übersprungen (bereits vorhanden): ${uebersprungen.length}`);
uebersprungen.forEach((u) => console.log(`  = ${u.name} (${u.grund})`));
console.log(`Facetten-Delta: ${Object.keys(matDelta).length} Materialien, ${Object.keys(fitDelta).length} Passformen, ${Object.keys(farbDelta).length} Farbnamen`);
console.log(`Geometrie-Aliase: ${Object.keys(geoAlias).length}`);
console.log(`Ausgabeziel: ${OUT_DIR === '.' ? 'src/ (Katalog)' : OUT_DIR}`);
