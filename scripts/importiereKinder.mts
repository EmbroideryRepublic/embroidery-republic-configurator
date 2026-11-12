/**
 * Kinderbekleidung: verifizierte Lieferanten-Rohdaten → Katalog (Produktart `kids`).
 *
 * Eigene, kleine Pipeline NEBEN `importiereProdukte.mts`, weil diese die Katalogdatei `importiert.generated.ts` jedes Mal
 * vollständig neu schreibt (und ihre Rohdatei nicht im Repository liegt) – ein Lauf mit nur den Kinderprodukten würde
 * den bestehenden Import löschen. Hier entsteht deshalb eine EIGENE Datei:
 *
 *   - src/config/products/kinder.generated.ts   (ProductConfig[] + Facetten-Delta)
 *   - scripts/import/kinder-jobs.json           (Bild-Aufträge für scripts/ingestDirect.mts)
 *
 * Rohdaten: scripts/import/kinder-raw.json (Ausgabe von scripts/import/scrapeKinder.mjs – öffentliche Produktseiten von
 * textil-grosshandel.eu, kein Login). Die Inferenz (Farbgruppe, Material, Passform) kommt aus der gemeinsamen
 * `src/lib/import/produktInferenz.ts`, damit Kinder- und Erwachsenenware nach denselben Regeln eingeordnet werden.
 *
 * Grundsatz „kein Raten": Preise, Größen, Maße, Farben und Material stammen aus der Quelle. Die einzige Entscheidung
 * dieses Skripts ist die Kleidungsart (Tabelle KLEIDUNG, je Artikelnummer) und die Wahl der Größenleiter.
 *
 * Aufruf:  npx tsx --tsconfig tsconfig.scripts.json scripts/importiereKinder.mts [rawPath]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  FARBGRUPPEN, MATERIAL_GRUPPEN, PASSFORMEN,
  type Farbgruppe, type MaterialGruppe, type Passform,
} from '../src/config/products/facetten.ts';
import { KINDER_LEITERN } from '../src/config/products/groessen.ts';
import { KINDER_FACETTEN as ALT } from '../src/config/products/kinder.generated.ts';
import { farbgruppeVon, materialGruppenVon, markeNormalisieren, slug } from '../src/lib/import/produktInferenz.ts';

const RAW_PATH = process.argv[2] ?? 'scripts/import/kinder-raw.json';
const AUFNAHME_DATUM = '2026-11-12';
const QUELLE = 'textil-grosshandel.eu';
/** Kinderware hat nur Vorder- und Rückansicht: Der Lieferant liefert keine verlässlichen Ärmelfotos. */
const KINDER_ANSICHTEN = ['front', 'back'];
/** Kinder-Passform: einheitlich, wie der Lieferant sie führt (nie „Damen“). */
const KINDER_FIT_FALLBACK = 'Regular Fit';

type Kleidung = 'T-Shirt' | 'Hoodie' | 'Sweatshirt' | 'Zip-Hoodie' | 'Longsleeve';
/** Kleidungsart je Artikelnummer – die einzige Zuordnung, die dieses Skript selbst trifft. */
const KLEIDUNG: Record<string, Kleidung> = {
  F140K: 'T-Shirt', F110K: 'T-Shirt', G5000K: 'T-Shirt', BCTK001: 'T-Shirt', BCTK002: 'T-Shirt', S140K: 'T-Shirt', NE30001: 'T-Shirt',
  Z180K: 'T-Shirt', JC001J: 'T-Shirt', E399: 'T-Shirt',
  JH001K: 'Hoodie', F421NK: 'Hoodie', G18500K: 'Hoodie', BCWK002: 'Hoodie', Z265K: 'Hoodie',
  JH030K: 'Sweatshirt', G18000K: 'Sweatshirt', BCWK001: 'Sweatshirt',
  JH050K: 'Zip-Hoodie', F401NK: 'Zip-Hoodie', Z266K: 'Zip-Hoodie',
  F240K: 'Longsleeve', BCTK003: 'Longsleeve',
};

/**
 * Offensichtliche Tippfehler in Lieferantentabellen – die EINZIGE Stelle, an der dieses Skript einen Quellwert ändert.
 * Jeder Eintrag braucht eine Begründung aus einer zweiten Quelle; ohne sie bleibt der Lieferantenwert stehen.
 *   Z265K 116 (5/6): Länge 59 cm bricht die Größenreihe (45 → 59 → 54). Das Schwesterprodukt Z266K (gleicher Schnitt, gleiche
 *   Breiten in allen Größen) führt für dieselbe Größe 49 cm – die Folge 45/49/54/57/62/67 ist dort lückenlos.
 */
const MASS_KORREKTUR: Record<string, Record<string, { hoeheCm: number; grund: string }>> = {
  Z265K: { '116 (5/6)': { hoeheCm: 49, grund: 'Lieferantentabelle 59 cm = Tippfehler; Z266K (gleicher Schnitt): 49 cm' } },
};

interface RohFarbe {
  name: string; hex?: string; preis: number | null;
  bilder: { front?: string; back?: string };
}
interface Roh {
  url: string; artNr: string; name: string; brand: string; material: string; grammatur: string;
  passform?: string; groessen: string[]; masse: { kopf: string[]; rows: string[][] } | never[];
  farben: RohFarbe[];
}

const roh = JSON.parse(readFileSync(RAW_PATH, 'utf8')) as Roh[];
const zahl = (s: string): number => Number(String(s).replace(',', '.'));

function leiterFuer(labels: string[]): string {
  for (const [id, leiter] of Object.entries(KINDER_LEITERN)) {
    if (labels.every((l) => leiter.ordnung.includes(l.toUpperCase()))) return id;
  }
  throw new Error(`Keine Kindergrößen-Leiter für: ${labels.join(', ')}`);
}

const eintraege: string[] = [];
const jobs: { productId: string; quelle: string; colors: { id: string; erwarteterHex?: string; front: string; back?: string }[] }[] = [];
const matDelta: Record<string, MaterialGruppe[]> = {};
const fitDelta: Record<string, Passform> = {};
const farbDelta: Record<string, Farbgruppe> = {};
const bericht: string[] = [];
const ids = new Set<string>();

for (const p of roh) {
  const kleidung = KLEIDUNG[p.artNr];
  if (!kleidung) throw new Error(`Keine Kleidungsart für ${p.artNr} (${p.name}) – KLEIDUNG ergänzen.`);
  const id = `kinder-${slug(p.artNr)}`;
  if (ids.has(id)) throw new Error(`doppelte ID ${id}`);
  ids.add(id);

  const brand = markeNormalisieren(p.brand.replace(/ BE INSPIRED$/i, '').trim());
  const name = p.name.replace(new RegExp(`^${p.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '').trim();

  const tabelle = Array.isArray(p.masse) ? [] : p.masse.rows;
  const groessenOhneZusatz = (l: string) => l.replace(/\s+/g, ' ').trim();
  const sizeGuide = tabelle
    .map((z) => ({ size: groessenOhneZusatz(z[0] ?? ''), breiteCm: zahl(z[1] ?? ''), hoeheCm: zahl(z[2] ?? '') }))
    .filter((m) => m.size && Number.isFinite(m.breiteCm) && Number.isFinite(m.hoeheCm));
  for (const m of sizeGuide) {
    const k = MASS_KORREKTUR[p.artNr]?.[m.size];
    if (k) {
      bericht.push(`! ${p.artNr} ${m.size}: Länge ${m.hoeheCm} → ${k.hoeheCm} cm (${k.grund})`);
      m.hoeheCm = k.hoeheCm;
    }
  }
  const labels = sizeGuide.map((m) => m.size);
  if (labels.length === 0) throw new Error(`${p.artNr}: keine Größentabelle`);
  const leiterId = leiterFuer(labels);
  const leiter = KINDER_LEITERN[leiterId]!;
  const rang = (l: string) => leiter.ordnung.indexOf(l.toUpperCase());
  const sizes = [...labels].sort((a, b) => rang(a) - rang(b));
  sizeGuide.sort((a, b) => rang(a.size) - rang(b.size));

  const preise = p.farben.map((f) => f.preis).filter((x): x is number => typeof x === 'number' && x > 0);
  if (preise.length === 0) throw new Error(`${p.artNr}: kein Preis`);
  const ek = Math.min(...preise);

  const gm = parseInt(p.grammatur, 10);
  const material = p.material.trim();
  const fit = p.passform?.trim() || KINDER_FIT_FALLBACK;
    // Basis = zusammengeführte Tabelle MINUS dem Delta des letzten Laufs (sonst fiele es beim zweiten Lauf weg).
  if (!(material in MATERIAL_GRUPPEN) || material in ALT.material) matDelta[material] = materialGruppenVon(material);
  if (!(fit in PASSFORMEN) || fit in ALT.passform) fitDelta[fit] = 'regular';

  const farben: { id: string; name: string; hex: string }[] = [];
  const job = { productId: id, quelle: QUELLE, colors: [] as { id: string; erwarteterHex?: string; front: string; back?: string }[] };
  const gesehen = new Set<string>();
  for (const f of p.farben) {
    if (!f.hex || !f.bilder.front) { bericht.push(`${p.artNr}: Farbe "${f.name}" ohne ${!f.hex ? 'Farbwert' : 'Vorderbild'} – übersprungen`); continue; }
    let cid = slug(f.name) || 'farbe';
    while (gesehen.has(cid)) cid += '-x';
    gesehen.add(cid);
    const hex = '#' + f.hex.replace('#', '').toUpperCase();
    if (!(f.name in FARBGRUPPEN) || f.name in ALT.farbgruppen) farbDelta[f.name] = farbgruppeVon(f.name, hex);
    farben.push({ id: cid, name: f.name, hex });
    job.colors.push({ id: cid, erwarteterHex: hex, front: f.bilder.front, ...(f.bilder.back ? { back: f.bilder.back } : {}) });
  }
  if (farben.length === 0) throw new Error(`${p.artNr}: keine Farbe mit Bild`);
  jobs.push(job);

  const desc = `${name} von ${brand}. ${material}${gm ? `, ${gm} g/m²` : ''}. Kindergrößen ${sizes[0]}–${sizes[sizes.length - 1]}. Verifizierte Lieferantendaten (${QUELLE}).`;
  const ms = sizeGuide.map((m) => `        { size: ${JSON.stringify(m.size)}, breiteCm: ${m.breiteCm}, hoeheCm: ${m.hoeheCm} }`).join(',\n');
  eintraege.push(`  {
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(name)},
    brand: ${JSON.stringify(brand)},
    productType: 'kids',
    qualityTier: 'standard',
    purchasePrice: ${ek},
    basePrice: computeBasePrice(${ek}, 'standard'),
    sizes: ${JSON.stringify(sizes)},
    sizeScale: ${JSON.stringify(leiterId)},
    tagline: ${JSON.stringify(`${kleidung} für Kinder von ${brand}`)},
    material: ${JSON.stringify(material)},${gm ? `\n    weightGsm: ${gm},` : ''}
    fit: ${JSON.stringify(fit)},
    description: ${JSON.stringify(desc)},
    certifications: [],
    careInstructions: 'Pflege gemäß Herstelleretikett',
    aufgenommenAm: ${JSON.stringify(AUFNAHME_DATUM)},
    bildStatus: 'fehlt',
    views: ${JSON.stringify(KINDER_ANSICHTEN)},
    sizeGuide: {
      measurements: [
${ms},
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: ${JSON.stringify(brand)},
      productType: ${JSON.stringify(kleidung)},
      gender: 'Kinder',
      sustainability: '',
      materialDetail: ${JSON.stringify(`${material}${gm ? ` (${gm} g/m²)` : ''}`)},
      countryOfOrigin: '',
      bulletPoints: [],
    },
    colors: platzhalterFarbSet([
${farben.map((f) => `      ${JSON.stringify(f).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ')}`).join(',\n')},
    ], ${JSON.stringify(KINDER_ANSICHTEN)}),
  }`);
  bericht.push(`+ ${p.artNr} ${brand} ${name} (${kleidung}, ${farben.length} Farben, Größen ${sizes.join('/')}, Leiter ${leiterId}, EK ${ek} €)`);
}

const objLit = (obj: Record<string, unknown>): string => {
  const keys = Object.keys(obj).sort();
  return keys.length === 0 ? '{}' : '{\n' + keys.map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])},`).join('\n') + '\n  }';
};

const datei = `/**
 * AUTO-GENERIERT von scripts/importiereKinder.mts – nicht von Hand pflegen.
 * Kinderbekleidung (Produktart "kids"), verifizierte Quelldaten (${QUELLE}).
 * Bilder liegen unter public/products/<id>-<farbe>/ (Ansichten: front, back) und kommen über das Asset-Manifest.
 */
import { computeBasePrice } from '@/config/pricing/marginTiers';
import { platzhalterFarbSet } from './colorHelpers';
import type { Farbgruppe, MaterialGruppe, Passform } from './types';
import type { ProductConfig } from './types';

export const PRODUCTS: ProductConfig[] = [
${eintraege.join(',\n')}${eintraege.length ? ',' : ''}
];

/** Facetten-Delta der Kinderprodukte (Ergänzung zu facetten.ts). */
export const KINDER_FACETTEN: {
  material: Record<string, MaterialGruppe[]>;
  passform: Record<string, Passform>;
  farbgruppen: Record<string, Farbgruppe>;
} = {
  material: ${objLit(matDelta)},
  passform: ${objLit(fitDelta)},
  farbgruppen: ${objLit(farbDelta)},
};
`;
writeFileSync('src/config/products/kinder.generated.ts', datei);
writeFileSync('scripts/import/kinder-jobs.json', JSON.stringify(jobs, null, 1));
console.log(bericht.join('\n'));
console.log(`\nProdukte: ${eintraege.length}, Farben: ${jobs.reduce((n, j) => n + j.colors.length, 0)}, Facetten-Delta: ${Object.keys(matDelta).length} Material / ${Object.keys(fitDelta).length} Passform / ${Object.keys(farbDelta).length} Farben`);
