/**
 * Sportbekleidung: verifizierte Lieferanten-Rohdaten → Katalog (Produktart `sport`).
 *
 * Eigene, kleine Pipeline NEBEN `importiereProdukte.mts` (und neben `importiereKinder.mts`), weil `importiereProdukte.mts` die
 * Katalogdatei `importiert.generated.ts` jedes Mal vollständig neu schreibt (ihre Rohdatei liegt nicht im Repository) – ein Lauf
 * mit nur den Sportprodukten würde den bestehenden Import löschen. Hier entsteht deshalb eine EIGENE Datei:
 *
 *   - src/config/products/sport.generated.ts   (ProductConfig[] + Facetten-Delta)
 *   - scripts/import/sport-jobs.json           (Bild-Aufträge für scripts/ingestDirect.mts)
 *
 * Rohdaten: scripts/import/sport-raw.json (Ausgabe von scripts/import/scrapeSport.mjs – öffentliche Produktseiten von
 * textil-grosshandel.eu, kein Login). Die Inferenz (Farbgruppe, Material) kommt aus der gemeinsamen
 * `src/lib/import/produktInferenz.ts`, damit Sport-, Kinder- und Erwachsenenware nach denselben Regeln eingeordnet werden.
 *
 * Grundsatz „kein Raten“: Preise, Größen, Maße, Farben, Material, Passform und Geschlecht stammen aus der Quelle. Die einzige
 * Entscheidung dieses Skripts ist die Kleidungsart (Tabelle KLEIDUNG, je Artikelnummer) und die Übersetzung der Passform in
 * die Facette (Tabelle PASSFORM_FACETTE, nur mit Wörtern, die der Lieferant selbst nennt).
 *
 * Ansichten: front + back immer; zusätzlich sleeve_left/sleeve_right, wenn der Lieferant für mindestens 80 % der Farben ein
 * Seitenfoto führt (die übrigen Farben des Modells entfallen dann); sonst nur front/back (Tanktops haben nie Ärmelansichten).
 * Farben ohne Vorder- ODER Rückfoto werden nie aufgenommen, ebenso Modelle ohne Größentabelle je Größe (die Druckfläche braucht die Maße).
 *
 * Aufruf:  npx tsx --tsconfig tsconfig.scripts.json scripts/importiereSport.mts [rawPath]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  FARBGRUPPEN, MATERIAL_GRUPPEN, PASSFORMEN,
  type Farbgruppe, type MaterialGruppe, type Passform,
} from '../src/config/products/facetten.ts';
import { KONFEKTIONSGROESSEN } from '../src/config/products/groessen.ts';
import { SPORT_FACETTEN as ALT } from '../src/config/products/sport.generated.ts';
import { farbgruppeVon, materialGruppenVon, markeNormalisieren, normSize, slug } from '../src/lib/import/produktInferenz.ts';

const RAW_PATH = process.argv[2] ?? 'scripts/import/sport-raw.json';
const AUFNAHME_DATUM = '2026-11-18';
const QUELLE = 'textil-grosshandel.eu';

/** Kleidungsart je Artikelnummer – steht als detailedDescription.productType und trägt das Wort in „So veredeln wir dein …“. */
const KLEIDUNG: Record<string, string> = {
  JC001: 'Sport-T-Shirt', JC005: 'Sport-T-Shirt', L198: 'Sport-T-Shirt', L200: 'Sport-T-Shirt', BCTG003: 'Sport-T-Shirt',
  JC012: 'Sport-Langarmshirt', JC023: 'Sport-Langarmshirt', L02071: 'Sport-Langarmshirt',
  JC230: 'Sport-Langarmshirt mit Viertelreißverschluss',
  JC007: 'Tanktop',
};

/** Passform-Wortlaut des Lieferanten → Facette. Nur Wörter, die der Lieferant selbst verwendet; unbekannte Texte brechen den Lauf ab. */
const PASSFORM_FACETTE: Record<string, Passform> = {
  'Regular Fit': 'regular',
  'Slim Fit': 'slim',
  'Long Fit, Regular Fit': 'regular',
  'Oversized Fit': 'oversized',
};

/** Geschlecht des Lieferanten („Für Herren“) → Schlüssel in facetten.ts (GESCHLECHTER_BASIS). */
const GESCHLECHT: Record<string, string> = {
  'Für Herren': 'Herren',
  'Für Damen': 'Damen',
  'Für Herren, Unisex': 'Unisex/Herren',
  'Für Unisex': 'Unisex',
};

/**
 * Farben, die NICHT aufgenommen werden – je Artikelnummer und Farbname des Lieferanten, mit Begründung (Prüfung 2026-11-18 an den
 * eingelesenen Fotos). Ein Eintrag hier ist die einzige Stelle, an der eine Lieferantenfarbe bewusst fehlt.
 */
const FARBEN_AUSSCHLUSS: Record<string, Record<string, string>> = {
  L198: { 'Neon Orange': 'dasselbe Foto wie „Orange“ (zwei benannte Farben, ein Foto) – eine davon wäre falsch zugeordnet' },
  L200: { Black: 'Lieferantenfoto zeigt ein helles Grau (gemessen #656565) statt Schwarz – würde die Farbwahl im Konfigurator verfälschen' },
};

/**
 * Farbpunkt am Foto messen: Weicht der Farbwert des Lieferanten stark vom Ton des Produktfotos ab (Neon-, Melange- und Pastelltöne,
 * Abstand ≥ SCHWELLE), zeigt der Farbpunkt im Shop den am Foto gemessenen Ton (Feld frontDom, siehe unten).
 * Die Messung steht festgeschrieben in scripts/import/sport-farbmessung.json (Auszug aus dem Ingest-Bericht des ersten Foto-Imports, damit ein
 * erneuter Import dasselbe Ergebnis liefert); fehlt die Datei, bleibt es beim Farbwert des Lieferanten.
 */
const FARBE_AM_FOTO_AB_ABSTAND = 85;
const BERICHT_PFAD = 'scripts/import/sport-farbmessung.json';
const fotoMessung = new Map<string, { frontDom: string; deltaE: number | null }>();
if (existsSync(BERICHT_PFAD)) {
  for (const b of JSON.parse(readFileSync(BERICHT_PFAD, 'utf8')) as { produkt: string; farbe: string; frontDom: string; deltaE: number | null }[]) {
    if (b.produkt.startsWith('sport-') && b.frontDom) fotoMessung.set(`${b.produkt}/${b.farbe}`, { frontDom: b.frontDom, deltaE: b.deltaE });
  }
}

interface RohFarbe {
  name: string; hex?: string; preis: number | null;
  bilder: { front?: string; back?: string; side?: string };
}
interface Roh {
  url: string; artNr: string; name: string; brand: string; material: string; grammatur: string;
  geschlecht?: string; passform?: string; masse: { kopf: string[]; rows: string[][] } | never[];
  farben: RohFarbe[];
}

const roh = JSON.parse(readFileSync(RAW_PATH, 'utf8')) as Roh[];
const zahl = (s: string): number => Number(String(s).replace(',', '.'));

const eintraege: string[] = [];
const jobs: { productId: string; quelle: string; colors: { id: string; erwarteterHex?: string; front: string; back?: string; side?: string }[] }[] = [];
const matDelta: Record<string, MaterialGruppe[]> = {};
const fitDelta: Record<string, Passform> = {};
const farbDelta: Record<string, Farbgruppe> = {};
const bericht: string[] = [];
const ids = new Set<string>();

for (const p of roh) {
  const kleidung = KLEIDUNG[p.artNr];
  if (!kleidung) throw new Error(`Keine Kleidungsart für ${p.artNr} (${p.name}) – KLEIDUNG ergänzen.`);
  const id = `sport-${slug(p.artNr)}`;
  if (ids.has(id)) throw new Error(`doppelte ID ${id}`);
  ids.add(id);

  const brand = markeNormalisieren(p.brand.replace(/ BE INSPIRED$/i, '').trim());
  const name = p.name.replace(new RegExp(`^${p.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '').trim();

  const geschlecht = GESCHLECHT[(p.geschlecht ?? '').trim()];
  if (!geschlecht) throw new Error(`${p.artNr}: unbekanntes Geschlecht „${p.geschlecht}“ – GESCHLECHT ergänzen.`);
  const fit = (p.passform ?? '').trim();
  const passform = PASSFORM_FACETTE[fit];
  if (!passform) throw new Error(`${p.artNr}: unbekannte Passform „${p.passform}“ – PASSFORM_FACETTE ergänzen.`);

  // Größentabelle: Spalte 1 = Größe, 2 = Breite, 3 = Höhe (wie bei allen Lieferantentabellen dieses Shops).
  const tabelle = Array.isArray(p.masse) ? [] : p.masse.rows;
  const kopf = Array.isArray(p.masse) ? [] : p.masse.kopf;
  const sizeGuide = tabelle
    .map((z) => ({ size: normSize((z[0] ?? '').replace(/\s+/g, ' ').trim()), breiteCm: zahl(z[1] ?? ''), hoeheCm: zahl(z[2] ?? '') }))
    .filter((m) => m.size && Number.isFinite(m.breiteCm) && Number.isFinite(m.hoeheCm));
  if (sizeGuide.length === 0) throw new Error(`${p.artNr}: keine Größentabelle (Kopf: ${kopf.join(' | ')})`);
  for (const m of sizeGuide) {
    if (!KONFEKTIONSGROESSEN.includes(m.size)) throw new Error(`${p.artNr}: Größe „${m.size}“ nicht in der Konfektions-Leiter`);
  }
  const rang = (l: string) => KONFEKTIONSGROESSEN.indexOf(l);
  sizeGuide.sort((a, b) => rang(a.size) - rang(b.size));
  const sizes = sizeGuide.map((m) => m.size);

  const gm = parseInt(p.grammatur, 10);
  const material = p.material.trim();
  if (!(material in MATERIAL_GRUPPEN) || material in ALT.material) matDelta[material] = materialGruppenVon(material);
  if (!(fit in PASSFORMEN) || fit in ALT.passform) fitDelta[fit] = passform;

  const farben: { id: string; name: string; hex: string }[] = [];
  const job = { productId: id, quelle: QUELLE, colors: [] as { id: string; erwarteterHex?: string; front: string; back?: string; side?: string }[] };
  const gesehen = new Set<string>();
  const preise: number[] = [];
  // Farben mit Vorder- UND Rückfoto. Ärmelansichten (sleeve_left/right) gibt es nur, wenn fast jede dieser Farben ein Seitenfoto hat
  // (mindestens 80 %); die wenigen Farben ohne Seitenfoto entfallen dann, damit keine Farbe eine Ansicht ohne Foto hat. Tanktops: nie Ärmel.
  const brauchbar = p.farben.filter((f) => {
    const grund = FARBEN_AUSSCHLUSS[p.artNr]?.[f.name];
    if (grund) {
      bericht.push(`${p.artNr}: Farbe "${f.name}" ausgeschlossen – ${grund}`);
      return false;
    }
    if (!f.hex || !f.bilder.front || !f.bilder.back) {
      bericht.push(`${p.artNr}: Farbe "${f.name}" ohne ${!f.hex ? 'Farbwert' : !f.bilder.front ? 'Vorderbild' : 'Rückbild'} – übersprungen`);
      return false;
    }
    return true;
  });
  const mitSeite = brauchbar.filter((f) => f.bilder.side).length;
  const mitAermeln = kleidung !== 'Tanktop' && brauchbar.length > 0 && mitSeite / brauchbar.length >= 0.8;
  for (const f of brauchbar) {
    if (mitAermeln && !f.bilder.side) {
      bericht.push(`${p.artNr}: Farbe "${f.name}" ohne Seitenfoto – übersprungen (Ärmelansichten des Modells)`);
      continue;
    }
    if (typeof f.preis === 'number' && f.preis > 0) preise.push(f.preis);
    let cid = slug(f.name) || 'farbe';
    while (gesehen.has(cid)) cid += '-x';
    gesehen.add(cid);
    let hex = '#' + f.hex!.replace('#', '').toUpperCase();
    const messung = fotoMessung.get(`${id}/${cid}`);
    if (messung && messung.deltaE !== null && messung.deltaE >= FARBE_AM_FOTO_AB_ABSTAND) {
      bericht.push(`${p.artNr}: Farbe "${f.name}": Farbpunkt ${hex} → am Foto gemessen ${messung.frontDom.toUpperCase()} (Abstand ${messung.deltaE})`);
      hex = messung.frontDom.toUpperCase();
    }
    if (!(f.name in FARBGRUPPEN) || f.name in ALT.farbgruppen) farbDelta[f.name] = farbgruppeVon(f.name, hex);
    farben.push({ id: cid, name: f.name, hex });
    job.colors.push({ id: cid, erwarteterHex: hex, front: f.bilder.front!, back: f.bilder.back!, ...(mitAermeln && f.bilder.side ? { side: f.bilder.side } : {}) });
  }
  if (farben.length === 0) throw new Error(`${p.artNr}: keine Farbe mit Bild`);
  // Einkaufspreis = günstigste AUFGENOMMENE Farbe (Preis der Standardgrößen, netto, wie der Lieferant ihn ausweist).
  if (preise.length === 0) throw new Error(`${p.artNr}: kein Preis`);
  const ek = Math.min(...preise);
  const ansichten = mitAermeln ? ['front', 'back', 'sleeve_left', 'sleeve_right'] : ['front', 'back'];
  jobs.push(job);

  const desc = `${name} von ${brand}. ${material}${gm ? `, ${gm} g/m²` : ''}. Größen ${sizes[0]}–${sizes[sizes.length - 1]}.`; // kein Lieferantenhinweis im Kundentext (Nutzerwunsch 2026-11-13)
  const ms = sizeGuide.map((m) => `        { size: ${JSON.stringify(m.size)}, breiteCm: ${m.breiteCm}, hoeheCm: ${m.hoeheCm} }`).join(',\n');
  eintraege.push(`  {
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(name)},
    brand: ${JSON.stringify(brand)},
    productType: 'sport',
    qualityTier: 'standard',
    purchasePrice: ${ek},
    basePrice: computeBasePrice(${ek}, 'standard'),
    sizes: ${JSON.stringify(sizes)},
    tagline: ${JSON.stringify(`${kleidung} von ${brand}`)},
    material: ${JSON.stringify(material)},${gm ? `\n    weightGsm: ${gm},` : ''}
    fit: ${JSON.stringify(fit)},
    description: ${JSON.stringify(desc)},
    certifications: [],
    careInstructions: 'Pflege gemäß Herstelleretikett',
    aufgenommenAm: ${JSON.stringify(AUFNAHME_DATUM)},
    bildStatus: 'fehlt',
    views: ${JSON.stringify(ansichten)},
    sizeGuide: {
      measurements: [
${ms},
      ],
      fitRating: 50,
    },
    detailedDescription: {
      supplierBrand: ${JSON.stringify(brand)},
      productType: ${JSON.stringify(kleidung)},
      gender: ${JSON.stringify(geschlecht)},
      sustainability: '',
      materialDetail: ${JSON.stringify(`${material}${gm ? ` (${gm} g/m²)` : ''}`)},
      countryOfOrigin: '',
      bulletPoints: [],
    },
    colors: platzhalterFarbSet([
${farben.map((f) => `      ${JSON.stringify(f).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ')}`).join(',\n')},
    ], ${JSON.stringify(ansichten)}),
  }`);
  bericht.push(`+ ${p.artNr} ${brand} ${name} (${kleidung}, ${geschlecht}, ${farben.length} von ${p.farben.length} Farben, Ansichten ${ansichten.join('/')}, Größen ${sizes.join('/')}, EK ${ek} €)`);
}

const objLit = (obj: Record<string, unknown>): string => {
  const keys = Object.keys(obj).sort();
  return keys.length === 0 ? '{}' : '{\n' + keys.map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])},`).join('\n') + '\n  }';
};

const datei = `/**
 * AUTO-GENERIERT von scripts/importiereSport.mts – nicht von Hand pflegen.
 * Sportbekleidung (Produktart "sport"), verifizierte Quelldaten (${QUELLE}).
 * Bilder liegen unter public/products/<id>-<farbe>/ und kommen über das Asset-Manifest.
 */
import { computeBasePrice } from '@/config/pricing/marginTiers';
import { platzhalterFarbSet } from './colorHelpers';
import type { Farbgruppe, MaterialGruppe, Passform } from './types';
import type { ProductConfig } from './types';

export const PRODUCTS: ProductConfig[] = [
${eintraege.join(',\n')}${eintraege.length ? ',' : ''}
];

/** Facetten-Delta der Sportprodukte (Ergänzung zu facetten.ts). */
export const SPORT_FACETTEN: {
  material: Record<string, MaterialGruppe[]>;
  passform: Record<string, Passform>;
  farbgruppen: Record<string, Farbgruppe>;
} = {
  material: ${objLit(matDelta)},
  passform: ${objLit(fitDelta)},
  farbgruppen: ${objLit(farbDelta)},
};
`;
writeFileSync('src/config/products/sport.generated.ts', datei);
writeFileSync('scripts/import/sport-jobs.json', JSON.stringify(jobs, null, 1));
console.log(bericht.join('\n'));
console.log(`\nProdukte: ${eintraege.length}, Farben: ${jobs.reduce((n, j) => n + j.colors.length, 0)}, Facetten-Delta: ${Object.keys(matDelta).length} Material / ${Object.keys(fitDelta).length} Passform / ${Object.keys(farbDelta).length} Farben`);
