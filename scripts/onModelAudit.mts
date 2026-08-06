/**
 * On-Model-Audit: findet Produktfotos, auf denen ein MENSCH zu sehen ist.
 *
 * Hintergrund: Der Katalog ist durchgängig auf Flat-Lay/Ghost-Mannequin ausgelegt
 * (Kleidungsstück allein auf weißem Grund). On-Model-Aufnahmen brechen nicht nur den
 * Bildstil – sie verschieben auch die Brustfläche im Bild, wodurch die Stickplatzierung
 * des Konfigurators nicht mehr zur Geometrie passt. Beim Bildimport sind vier Produkte
 * zunächst mit On-Model-Fotos importiert und später durch Freisteller ersetzt worden
 * (docs/bildimport-abschlussbericht.md).
 *
 * Verfahren: Anteil hautfarbener Pixel je Bild (Regel nach Kovac et al.).
 * Rote, orange, pinke und sandfarbene STOFFE erfüllen dieselbe Regel – deshalb reicht
 * ein einzelner Bildwert NICHT als Nachweis. Zwei Zusatzkriterien trennen sauber:
 *   1. Quote: Bei On-Model trägt dasselbe Modell JEDE Farbe → Haut ist in nahezu allen
 *      Bildern des Produkts. Bei Stoff-Fehlalarmen nur in den warmen Farben.
 *   2. Kopfregion: Bei On-Model liegt Haut auch im oberen Bildbereich (Gesicht/Hals).
 *
 * Treffer sind ein Prüfsignal, kein Urteil: jeder Kandidat gehört gesichtet. Bestätigte
 * Ausnahmen (Produkte, für die weltweit kein Freisteller existiert) gehören mit
 * Begründung nach scripts/import/onmodel-ausnahmen.json.
 *
 * Aufruf: npx tsx scripts/onModelAudit.mts
 * Exit 1, wenn ein nicht dokumentierter Kandidat existiert.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { PRODUCTS } from '../src/config/products/index.ts';

/** Ab dieser Quote gilt Haut als produktweit (statt nur in warmen Stofffarben). */
const QUOTE_SCHWELLE = 0.4;
/** Hautanteil, ab dem ein einzelnes Bild als "enthält Haut" zählt. */
const BILD_SCHWELLE = 0.03;

let ausnahmen: Record<string, string> = {};
try {
  ausnahmen = JSON.parse(readFileSync('scripts/import/onmodel-ausnahmen.json', 'utf-8'));
} catch {
  /* keine Ausnahmen dokumentiert */
}

const ids = PRODUCTS.map((p) => p.id).sort((a, b) => b.length - a.length);
const zuProdukt = (o: string) => ids.find((id) => o === id || o.startsWith(`${id}-`)) ?? '?';

const istHaut = (r: number, g: number, b: number) =>
  r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b;

const messe = async (datei: string) => {
  const { data, info } = await sharp(datei).resize(96, 96, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const kopfHoehe = info.height * 0.18;
  let haut = 0;
  let kopf = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (!istHaut(data[i], data[i + 1], data[i + 2])) continue;
      haut++;
      if (y < kopfHoehe) kopf++;
    }
  }
  return { haut: haut / (info.width * info.height), kopf: kopf / (info.width * kopfHoehe) };
};

const proProdukt = new Map<string, { mitHaut: number; gesamt: number; kopfMax: number; beispiel: string }>();
for (const ordner of readdirSync('public/products')) {
  for (const view of ['front', 'back']) {
    const datei = `public/products/${ordner}/${view}.png`;
    if (!existsSync(datei)) continue;
    const produkt = zuProdukt(ordner);
    const m = await messe(datei);
    const e = proProdukt.get(produkt) ?? { mitHaut: 0, gesamt: 0, kopfMax: 0, beispiel: '' };
    e.gesamt++;
    if (m.haut > BILD_SCHWELLE) e.mitHaut++;
    if (m.kopf > e.kopfMax) { e.kopfMax = m.kopf; e.beispiel = `${ordner}/${view}`; }
    proProdukt.set(produkt, e);
  }
}

const kandidaten = [...proProdukt.entries()]
  .map(([produkt, e]) => ({ produkt, quote: e.mitHaut / e.gesamt, ...e }))
  .filter((k) => k.quote >= QUOTE_SCHWELLE)
  .sort((a, b) => b.quote - a.quote);

const offen = kandidaten.filter((k) => !ausnahmen[k.produkt]);
console.log(`${[...proProdukt.values()].reduce((n, e) => n + e.gesamt, 0)} Bilder aus ${proProdukt.size} Produkten geprueft.`);
console.log(`${kandidaten.length} Kandidaten, davon ${kandidaten.length - offen.length} als Ausnahme dokumentiert.\n`);

for (const k of offen) {
  console.log(`PRUEFEN  Quote ${(k.quote * 100).toFixed(0)} % (${k.mitHaut}/${k.gesamt})  Kopfregion ${(k.kopfMax * 100).toFixed(1)} %`);
  console.log(`   ${k.produkt}\n   z.B. ${k.beispiel}`);
}

if (offen.length) {
  console.log(`\n${offen.length} ungeklaerte Kandidaten. Bild sichten: zeigt es einen Menschen?`);
  console.log('Wenn ja und es existiert weltweit kein Freisteller: mit Begruendung in');
  console.log('scripts/import/onmodel-ausnahmen.json eintragen. Wenn nein (warme Stofffarbe): ignorieren.');
  process.exit(1);
}
console.log('Keine ungeklaerten On-Model-Aufnahmen.');
