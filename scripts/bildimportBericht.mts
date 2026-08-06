/**
 * Erzeugt den transparenten Abschlussbericht des Bildimports (ADR 0006).
 *
 * Liest das Asset-Manifest (Wahrheit über echte Bilder je Farbe/Ansicht) und das
 * Quellen-Ledger (scripts/import/quellen.json: productId → verwendete Quelle) und
 * schreibt docs/bildimport-abschlussbericht.md: je Produkt Quelle, Anzahl echter
 * Farben, welche Ansichten importiert wurden und bei welchen Farben keine echte
 * Rückansicht existiert (Front-Alias / Fallback). Plus Gesamtübersicht + noch
 * offene Produkte.
 *
 * Aufruf: npx tsx scripts/bildimportBericht.mts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { ASSET_MANIFEST as M } from '../src/lib/assets/assetManifest.generated.ts';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

const quellen: Record<string, { quelle: string; hinweis?: string }> =
  JSON.parse(readFileSync('scripts/import/quellen.json', 'utf-8'));

/** Begründung je noch offenem Produkt (warum kein sauberes Echtbild). Optional. */
let offenGruende: Record<string, string> = {};
try {
  offenGruende = JSON.parse(readFileSync('scripts/import/offen-gruende.json', 'utf-8'));
} catch {
  /* keine Gründe-Datei vorhanden – dann ohne Begründung listen */
}

/**
 * Recherche-Entscheidungen, bei denen die Katalog-Artikelnummer korrigiert oder
 * ein offizielles Nachfolgemodell verwendet wurde (Nachvollziehbarkeit).
 */
type Entscheidung = { ausgangslage: string; verifizierteHerstellerNr: string; art: string; beleg: string };
let entscheidungen: Record<string, Entscheidung> = {};
try {
  entscheidungen = JSON.parse(readFileSync('scripts/import/entscheidungen.json', 'utf-8'));
} catch {
  /* keine Entscheidungen dokumentiert */
}

/** Verifizierte Hersteller-Artikelnummern je Produkt (Referenz, siehe Datei-Kopf dort). */
type HerstellerNr = { hersteller: string; nr: string; modell: string; beleg: string };
let herstellerNrn: Record<string, HerstellerNr> = {};
try {
  const roh = JSON.parse(readFileSync('scripts/import/herstellerartikelnummern.json', 'utf-8'));
  delete roh._hinweis;
  herstellerNrn = roh;
} catch {
  /* keine Nummern hinterlegt */
}

/** Ist eine Ansicht ein echtes eigenes Bild (kein Platzhalter, kein Front-Alias)? */
const istEigen = (pfad: string, front: string | undefined, view: string) =>
  pfad !== PLATZHALTER_BILD && (view === 'front' || pfad !== front);

/** Anzahl real vorhandener Bilddateien (front/back) – für den Bildstil-Abschnitt. */
const anzahlBilder = readdirSync('public/products')
  .reduce((n, o) => n + ['front', 'back'].filter((v) => existsSync(`public/products/${o}/${v}.png`)).length, 0);

let realProd = 0, realFarben = 0, mitBack = 0, ohneBack = 0;
const zeilen: string[] = [];
const offen: Record<string, string[]> = {};

for (const p of PRODUCTS) {
  const m = M[p.id]; if (!m) continue;
  const realCids = Object.entries(m).filter(([, e]) => e.status === 'real').map(([cid]) => cid);
  if (!realCids.length) { (offen[p.brand] ??= []).push(p.id); continue; }
  realProd++;
  realFarben += realCids.length;
  let backHier = 0, keinBackFarben: string[] = [];
  const ansichtenGesamt = new Set<string>();
  for (const cid of realCids) {
    const views = m[cid].views; const front = views.front;
    const eigene = Object.entries(views).filter(([v, pfad]) => istEigen(pfad, front, v)).map(([v]) => v);
    eigene.forEach((v) => ansichtenGesamt.add(v));
    if (eigene.includes('back')) { backHier++; mitBack++; } else { ohneBack++; keinBackFarben.push(cid); }
  }
  const q = quellen[p.id]?.quelle ?? '—';
  const backTxt = keinBackFarben.length ? ` · ohne echte Rückansicht: ${keinBackFarben.length} (${keinBackFarben.join(', ')})` : '';
  zeilen.push(`| ${p.id} | ${p.brand} | ${q} | ${realCids.length} | ${[...ansichtenGesamt].sort().join('+')} | ${backHier}${backTxt} |`);
}

const offenGesamt = Object.values(offen).reduce((n, a) => n + a.length, 0);
const kopf = `# Bildimport – Abschlussbericht

_Auto-generiert von scripts/bildimportBericht.mts. Quelle: Asset-Manifest + scripts/import/quellen.json._

## Übersicht
- Produkte mit echten Bildern: **${realProd} / ${PRODUCTS.length}**
- Echte Farb-Bildsätze: **${realFarben}**
- Farben mit echter Rückansicht: **${mitBack}** · nur Vorderansicht (noch keine echte Rückansicht gefunden): **${ohneBack}**
- Noch offen (nur Platzhalter): **${offenGesamt}** Produkte

## Bebilderte Produkte
| Produkt | Marke | Quelle | echte Farben | Ansichten | Farben mit Rückansicht |
|---|---|---|---|---|---|
${zeilen.join('\n')}

## Bildstil: Flat-Lay statt On-Model
_Der Katalog ist durchgängig auf Freisteller ausgelegt (Kleidungsstück allein auf weißem Grund).
On-Model-Aufnahmen brechen nicht nur den Stil, sie verschieben auch die Brustfläche im Bild – die
Stickplatzierung des Konfigurators passt dann nicht mehr zur Geometrie. Ein Audit über alle
${anzahlBilder} Vorder- und Rückansichten (\`scripts/onModelAudit.mts\`, Hautton-Analyse) fand vier
Produkte mit On-Model-Fotos; für **alle vier** wurden echte Freisteller beschafft und die
On-Model-Aufnahmen ersetzt:_

| Produkt | vorher | jetzt | Quelle der Freisteller |
|---|---|---|---|
| gildan-light-cotton-adult-t-shirt | On-Model (gildan.com) | 6 Flat-Lay-Fronts | PenCarrie, offizielles Gildan-Freisteller-Set GD03 (= Style 3000); Nackenetikett „Light Cotton" im Bild lesbar |
| gildan-ultra-cotton-long-sleeve-t-shirt | On-Model (blankstyle.com) | 7 Flat-Lay-Fronts | allmyclothes.de, Gildan-Studiofreisteller |
| earthpositive-pique-polo-shirt | On-Model (baroneclothing.com) | Flat-Lay front + back | continentalclothing.com, herstellereigene Bibliothek (EP20-BL) |
| earthpositive-jersey-polo-shirt | On-Model (Herstellershop) | Flat-Lay front | earthpositive.se, offizielle nordische Herstellerseite (EP39-BL) |

**Keine dokumentierte Ausnahme nötig** – es verbleibt kein Produkt mit On-Model-Aufnahme.
Für die beiden Gildan-Artikel existieren im Freisteller-Set nur Vorderansichten; die bisherigen
On-Model-Rückansichten wurden bewusst **nicht** beibehalten, weil ein gemischter Stil (Freisteller
vorn, Modell hinten) optisch und geometrisch schlechter wäre als eine reine Front-Ansicht.

## Verifizierte Hersteller-Artikelnummern
_Die Produktdefinitionen tragen bewusst **keine** Artikelnummer (ADR 0004: Lieferant vom Produkt gelöst);
die Händlernummern stehen in \`src/lib/suppliers/supplierRefs.ts\` bzw. \`scripts/import/products-raw.json\`.
Beim Bildimport wurde zusätzlich je Produkt die **Herstellernummer** am Hersteller belegt – sie schließt die
in supplierRefs beschriebene Lücke ("hilft, dasselbe Produkt bei einem anderen Lieferanten wiederzufinden").
Pflegedatei: \`scripts/import/herstellerartikelnummern.json\`._

| Produkt | Hersteller | Artikelnummer | Modell | Beleg |
|---|---|---|---|---|
${Object.entries(herstellerNrn).map(([id, h]) =>
  `| ${id} | ${h.hersteller} | **${h.nr}** | ${h.modell} | ${h.beleg} |`).join('\n') || '| — | — | — | — | — |'}

## Klärungen & Korrekturen während der Recherche
_Fälle, in denen eine angenommene Artikelnummer nicht existierte, ein anderes Produkt bezeichnete, oder in
denen ein Katalogeintrag die Bilder eines fremden Artikels trug. Wichtig: die falschen Nummern standen
**nicht** im Katalog – sie waren Arbeitsannahmen der Recherche; der Rohdatensatz führte bereits die
korrekten Händlernummern._

| Produkt | Ausgangslage | Verifiziert | Art | Beleg |
|---|---|---|---|---|
${Object.entries(entscheidungen).map(([id, e]) =>
  `| ${id} | ${e.ausgangslage} | **${e.verifizierteHerstellerNr}** | ${e.art} | ${e.beleg} |`).join('\n') || '| — | — | — | — | — |'}

## Noch offen (Recherche/Import ausstehend)
${Object.entries(offen).sort((a, b) => b[1].length - a[1].length).map(([b, a]) =>
  `- **${b}** (${a.length}):\n${a.map((id) => `  - \`${id}\`${offenGruende[id] ? ` — ${offenGruende[id]}` : ''}`).join('\n')}`).join('\n')}
`;

writeFileSync('docs/bildimport-abschlussbericht.md', kopf, 'utf-8');
console.log(`Bericht: ${realProd} Produkte bebildert, ${realFarben} Farben, ${offenGesamt} offen → docs/bildimport-abschlussbericht.md`);
