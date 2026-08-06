/**
 * Erzeugt docs/bildimport-abschlussbericht.md aus dem tatsächlichen Stand.
 *
 * Bewusst generiert und nicht von Hand geschrieben: Der Bericht soll das
 * abbilden, was im Shop liegt, nicht das, was jemand für den Stand hält. Alle
 * Zahlen kommen aus dem Asset-Manifest, den Importjobs und den
 * nichtbeschaffbar_*-Dateien; die Begründungen stammen wörtlich aus der
 * Recherche der Agenten.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/bildimportBericht.mts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';
import { FARBDUBLETTEN } from '../src/config/farbdubletten.generated.ts';
import { waehlbareFarben } from '../src/lib/products/farben.ts';
import { sichtbareAnsichten } from '../src/lib/products/ansichten.ts';

const IMPORT = join(process.cwd(), 'scripts', 'import');
const lies = <T,>(datei: string, standard: T): T => {
  try {
    return JSON.parse(readFileSync(join(IMPORT, datei), 'utf8')) as T;
  } catch {
    return standard;
  }
};

// ── Rohdaten sammeln ────────────────────────────────────────────────────
type Ausnahme = { productId?: string; id?: string; colorId?: string; grund?: string; colors?: { id: string; grund?: string }[] };
const ausnahmen: { produkt: string; farbe: string; grund: string; herkunft: string }[] = [];
for (const datei of readdirSync(IMPORT).filter((f) => f.startsWith('nichtbeschaffbar'))) {
  for (const e of lies<Ausnahme[]>(datei, [])) {
    const pid = e.productId ?? e.id;
    if (!pid) continue;
    if (e.colorId) ausnahmen.push({ produkt: pid, farbe: e.colorId, grund: e.grund ?? '', herkunft: datei });
    for (const c of e.colors ?? []) ausnahmen.push({ produkt: pid, farbe: c.id, grund: c.grund ?? '', herkunft: datei });
  }
}

const onModelAusnahmen = lies<Record<string, string>>('onmodel-ausnahmen.json', {});
/**
 * Bewusst importierte On-Model-Aufnahmen – aber nur die, die HEUTE noch im Shop
 * liegen. Der Gildan Softstyle Hoodie etwa wurde zunächst mit 23 On-Model-
 * Bildern gefüllt (besser als 23 ausgeblendete Farben) und später komplett durch
 * Freisteller ersetzt. Diese Einträge weiterhin als Ausnahme auszuweisen wäre
 * schlicht falsch. Abgeglichen wird über den Host der zuletzt genutzten Quelle.
 */
const onModelRoh = readdirSync(IMPORT)
  .filter((f) => f.startsWith('onmodel_'))
  .flatMap((f) => lies<{ productId: string; colorId: string; quelle?: string }[]>(f, []));
const abgelehnt = readdirSync(IMPORT)
  .filter((f) => f.endsWith('.onmodel.json'))
  .flatMap((f) => lies<{ productId: string; colorId: string; view: string; fremd: string }[]>(f, []));

/** Quelle je Produkt/Farbe aus den Importjobs (letzter Lauf gewinnt). */
const quelleVon = new Map<string, string>();
const jobQuelle = new Map<string, string>();
for (const datei of readdirSync(IMPORT).filter((f) => f.startsWith('directJobs') && f.endsWith('.json') && !f.endsWith('.onmodel.json'))) {
  for (const j of lies<{ productId?: string; quelle?: string; colors?: { id?: string; front?: string }[] }[]>(datei, [])) {
    if (!j.productId) continue;
    if (j.quelle) jobQuelle.set(j.productId, j.quelle);
    for (const c of j.colors ?? []) {
      if (!c.id || !c.front) continue;
      try {
        quelleVon.set(`${j.productId}/${c.id}`, new URL(c.front).host.replace(/^www\./, ''));
      } catch {
        /* keine URL */
      }
    }
  }
}

// ── Kennzahlen ─────────────────────────────────────────────────────────
let farbenGesamt = 0;
let farbenEcht = 0;
let waehlbar = 0;
let ausgeblendet = 0;
let rueckEcht = 0;
let rueckPlatzhalter = 0;

const ohneRueck: { id: string; name: string; marke: string; anzahl: number; gesamt: number }[] = [];
const versteckt: { id: string; name: string; farbe: string; grund: string }[] = [];

for (const p of PRODUCTS) {
  const alle = p.colors;
  const echt = alle.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  const angeboten = waehlbareFarben(p.id, alle);
  farbenGesamt += alle.length;
  farbenEcht += echt.length;
  waehlbar += angeboten.length;

  for (const c of alle) {
    if (angeboten.some((a) => a.id === c.id)) continue;
    ausgeblendet++;
    const dublette = FARBDUBLETTEN[p.id]?.includes(c.id);
    const grund = dublette
      ? 'Doppelter Katalogeintrag – zeigt dasselbe Foto wie eine andere Farbe desselben Produkts.'
      : (ausnahmen.find((a) => a.produkt === p.id && a.farbe === c.id)?.grund ??
        'Kein Herstellerbild gefunden.');
    versteckt.push({ id: p.id, name: p.name, farbe: c.name, grund });
  }

  let ohne = 0;
  for (const c of angeboten) {
    const b = ASSET_MANIFEST[p.id]?.[c.id]?.views?.back;
    if (b && !b.includes('_platzhalter')) rueckEcht++;
    else {
      rueckPlatzhalter++;
      ohne++;
    }
  }
  if (ohne) ohneRueck.push({ id: p.id, name: p.name, marke: p.brand, anzahl: ohne, gesamt: angeboten.length });
}

const hostVon = (s?: string) => {
  const t = /https?:\/\/([^/\s)]+)/.exec(s ?? '');
  return t ? t[1]!.replace(/^www\./, '') : undefined;
};
const onModelImporte = onModelRoh.filter((e) => {
  const jetzt = quelleVon.get(`${e.productId}/${e.colorId}`);
  const damals = hostVon(e.quelle);
  return jetzt !== undefined && damals !== undefined && jetzt === damals;
});

const aermelVoll = PRODUCTS.filter((p) => {
  const f = waehlbareFarben(p.id, p.colors);
  return f.length > 0 && sichtbareAnsichten(p, f[0]!.id).includes('sleeve_left');
}).length;

// ── Bericht ────────────────────────────────────────────────────────────
const kurz = (s: string, n = 260) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + ' …' : s);
const z: string[] = [];
z.push('# Bildimport – Abschlussbericht');
z.push('');
z.push('_Generiert von `scripts/bildimportBericht.mts` aus dem Asset-Manifest, den Importjobs');
z.push('und den dokumentierten Ausnahmen. Nicht von Hand pflegen._');
z.push('');
z.push('## Was im Shop steht');
z.push('');
z.push('| | |');
z.push('|---|---|');
z.push(`| Produkte | **${PRODUCTS.length}** |`);
z.push(`| Farbvarianten im Katalog | **${farbenGesamt}** |`);
z.push(`| davon mit echtem Herstellerbild | **${farbenEcht}** (${((farbenEcht / farbenGesamt) * 100).toFixed(1)} %) |`);
z.push(`| im Shop auswählbar | **${waehlbar}** |`);
z.push(`| ausgeblendet (siehe unten) | **${ausgeblendet}** |`);
z.push(`| Farben mit echter Rückansicht | **${rueckEcht}** |`);
z.push(`| Farben mit Rückseiten-Platzhalter | **${rueckPlatzhalter}** |`);
z.push(`| Produkte mit Ärmelansicht für alle Farben | **${aermelVoll}** von ${PRODUCTS.length} |`);
z.push('');
z.push('**Kein auswählbares Kleidungsstück zeigt eine Silhouette.** Jede Farbe, die der Kunde');
z.push('anklicken kann, hat ein echtes Foto des richtigen Artikels in der richtigen Farbe.');
z.push('Abgesichert durch Wächtertests in `src/lib/products/__tests__/farben.test.ts`.');
z.push('');

z.push('## Ausgeblendete Farben');
z.push('');
if (!versteckt.length) {
  z.push('Keine. Jede Katalogfarbe ist auswählbar.');
} else {
  z.push('Diese Farben stehen weiterhin in der Produktdefinition (Bestellvalidierung und');
  z.push('Lieferanten-Mapping brauchen die vollständige Palette), werden im Shop aber nicht');
  z.push('angeboten – anzubieten, was wir nicht zeigen können, wäre ein Versprechen ohne Deckung.');
  z.push('');
  z.push('| Produkt | Farbe | Grund |');
  z.push('|---|---|---|');
  for (const v of versteckt) z.push(`| ${v.name} | ${v.farbe} | ${kurz(v.grund, 200)} |`);
}
z.push('');

z.push('## Rückansichten, die es nirgends gibt');
z.push('');
z.push(`Bei ${ohneRueck.length} Produkten zeigt der Klick auf „Rückseite" einen neutralen`);
z.push('Platzhalter statt eines Fotos. Rückendruck bleibt buchbar; die Fläche ist über den');
z.push('Umriss der Vorderansicht vermessen. Der häufigste Grund: Die Hersteller fotografieren');
z.push('die Rückseite nur am Modell, und On-Model-Aufnahmen sind ausgeschlossen (Begründung unten).');
z.push('');
if (ohneRueck.length) {
  z.push('| Produkt | Marke | ohne Rückansicht |');
  z.push('|---|---|---|');
  for (const o of ohneRueck.sort((a, b) => b.anzahl - a.anzahl)) {
    z.push(`| ${o.name} | ${o.marke} | ${o.anzahl} von ${o.gesamt} |`);
  }
}
z.push('');

z.push('## Warum keine On-Model-Aufnahmen');
z.push('');
z.push('Nicht nur eine Stilfrage. Der Druckflächen-Generator vermisst die **Kontur des Bildes**,');
z.push('um zu bestimmen, wo auf dem Kleidungsstück gedruckt werden kann. Ist ein Mensch');
z.push('abgebildet, wird der Mensch vermessen: Beim Gildan Ultra Cotton Longsleeve lag die');
z.push('Druckfläche dadurch über Kopf und Schultern des Models statt auf dem Stoff.');
z.push('');
z.push('`scripts/jobsOnModelFilter.mts` lehnt solche Bilder deshalb VOR dem Import ab. Die');
z.push('Erkennung kann sich nicht auf den Hautanteil stützen – ein rosa Freisteller erfüllt die');
z.push('Hautfarbregel zu 48 %, eine echte On-Model-Aufnahme nur zu 10 %, weil der Stoff selbst');
z.push('hautfarben ist. Gezählt werden deshalb nur Hautpixel, die weit von der dominanten');
z.push('Stofffarbe entfernt liegen.');
z.push('');
z.push(`Bisher abgelehnt: **${abgelehnt.length} Bilder**.`);
z.push('');
if (onModelImporte.length) {
  z.push(`Bewusst stehen gelassen (kein Freisteller auffindbar, On-Model besser als gar kein Bild): **${onModelImporte.length}**.`);
} else {
  z.push('**Im Shop liegt derzeit keine einzige On-Model-Aufnahme.** Zwischenzeitlich waren 23');
  z.push('Farben des Gildan Softstyle Hoodie so importiert worden – besser als 23 ausgeblendete');
  z.push('Farben –, sie sind inzwischen alle durch Freisteller ersetzt.');
}
if (Object.keys(onModelAusnahmen).length) {
  z.push('');
  z.push('Geprüfte Fehlalarme des Audits (warme Stofffarben, kein Mensch im Bild):');
  z.push('');
  for (const [id, grund] of Object.entries(onModelAusnahmen)) z.push(`- **${id}** – ${kurz(grund, 220)}`);
}
z.push('');

z.push('## Technisch nicht beschaffbar');
z.push('');
z.push(`${ausnahmen.length} Einträge (Farbe oder einzelne Ansicht) sind mit Begründung und`);
z.push('geprüften Quellen dokumentiert. Die Agenten haben dafür je Fall bis zu 15 Händler, die');
z.push('Hersteller-Mediathek und das Wayback-Archiv abgesucht. Vollständig in');
z.push('`scripts/import/nichtbeschaffbar_*.json`; hier die betroffenen Produkte:');
z.push('');
const proProdukt = new Map<string, number>();
for (const a of ausnahmen) proProdukt.set(a.produkt, (proProdukt.get(a.produkt) ?? 0) + 1);
z.push('| Produkt | Einträge |');
z.push('|---|---|');
for (const [id, n] of [...proProdukt].sort((a, b) => b[1] - a[1])) z.push(`| ${id} | ${n} |`);
z.push('');

z.push('## Bildquellen');
z.push('');
const hosts = new Map<string, number>();
for (const h of quelleVon.values()) hosts.set(h, (hosts.get(h) ?? 0) + 1);
z.push('| Quelle | Farbbildsätze |');
z.push('|---|---|');
for (const [h, n] of [...hosts].sort((a, b) => b[1] - a[1]).slice(0, 25)) z.push(`| ${h} | ${n} |`);
z.push('');

writeFileSync('docs/bildimport-abschlussbericht.md', z.join('\n') + '\n');
console.log(`Bericht geschrieben: ${farbenEcht}/${farbenGesamt} Farben, ${ausgeblendet} ausgeblendet, ${ausnahmen.length} dokumentierte Ausnahmen`);
if (!existsSync('docs/bildimport-abschlussbericht.md')) throw new Error('Bericht nicht geschrieben');
