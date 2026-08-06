/**
 * Druckflächen-Audit: prüft Produkt für Produkt und Ansicht für Ansicht, dass die
 * Druckfläche wirklich AUF dem Kleidungsstück liegt.
 *
 * Verfahren: Aus dem echten Produktfoto wird die Silhouette bestimmt (alles,
 * was deutlich dunkler als der weiße Studiohintergrund ist). Dann wird geprüft:
 *
 * Hinweis: x0/y0/x1/y1 sind PROZENT der Bildkante (0-100), nicht Anteile.
 *
 *   1. Deckung – wie viel Prozent der Druckfläche liegen auf Stoff? Ragt die Box
 *      über den Rand (Schulter, Saum, Seitennaht), sinkt dieser Wert.
 *   2. Oberkante – die Box darf nicht in den Kragen-/Kapuzenbereich reichen.
 *      Geprüft wird, dass die Boxoberkante unterhalb der Schulterlinie liegt
 *      (erste Bildzeile, in der das Teil seine typische Breite erreicht).
 *   3. Ausnutzung – wie viel der verfügbaren Stoffbreite nutzt die Box? Ein zu
 *      kleiner Wert bedeutet verschenkte Druckfläche.
 *
 * Das Ergebnis ist eine Rangliste der schlechtesten Fälle – daran lässt sich
 * gezielt nacharbeiten, statt pauschal zu raten.
 *
 * WICHTIG – Grenze des Verfahrens: Die Silhouette wird über die Helligkeit vom
 * weissen Studiohintergrund getrennt. Bei WEISSEN oder mehrfarbigen Teilen (z.B.
 * Baseball-Shirt mit Kontrastaermeln) gelingt das nicht zuverlaessig; dort meldet
 * die Deckungsmessung Fehlalarme. Das Skript ist deshalb ein HINWEISGEBER, kein
 * Gate – die verbindliche Pruefung ist der Kontaktbogen
 * (scripts/druckflaechenKontaktbogen.mts) mit dem Auge.
 *
 * Aufruf: npx tsx scripts/druckflaechenAudit.mts [minDeckung]
 */
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.ts';
import { PRODUCTS } from '../src/config/products/index.ts';
import { bildFuerAnsicht, PLATZHALTER_BILD } from '../src/lib/assets/index.ts';
import { assetVerfuegbarkeit } from '../src/lib/assets/index.ts';

/**
 * Für die Silhouette wird die DUNKELSTE Farbe mit Fotos genommen. Auf weissem
 * Studiohintergrund ist ein weisses Kleidungsstueck kaum vom Hintergrund zu
 * trennen – die Maske haette es als Hintergrund gewertet und voellig korrekte
 * Boxen als "0 % Deckung" gemeldet.
 */
const helligkeit = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
const dunkelsteFarbeMitFotos = (id: string, farben: readonly { id: string; hex: string }[]) =>
  farben
    .filter((c) => assetVerfuegbarkeit(id, c.id) === 'vorhanden')
    .sort((a, b) => helligkeit(a.hex) - helligkeit(b.hex))[0];

const MIN_DECKUNG = Number(process.argv[2] ?? 97);
/** Analyse-Auflösung – fein genug für Kanten, grob genug für 500+ Bilder. */
const RASTER = 200;

type Befund = {
  produkt: string;
  view: string;
  deckung: number;
  ueberKragen: boolean;
  breitenNutzung: number;
};

/** Silhouetten-Maske: true = Stoff. Studiofotos haben weißen Hintergrund. */
async function maske(datei: string) {
  const { data, info } = await sharp(datei)
    .resize(RASTER, RASTER, { fit: 'fill' })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(info.width * info.height);
  for (let i = 0; i < m.length; i++) m[i] = data[i] < 244 ? 1 : 0;
  return { m, w: info.width, h: info.height };
}

/** Erste Zeile, in der das Teil mindestens 70 % seiner Maximalbreite hat. */
function schulterZeile(m: Uint8Array, w: number, h: number): number {
  const breiten: number[] = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (m[y * w + x]) n++;
    breiten.push(n);
  }
  const max = Math.max(...breiten);
  return breiten.findIndex((b) => b >= max * 0.7);
}

const befunde: Befund[] = [];
let geprueft = 0;
let ohneBild = 0;

for (const p of PRODUCTS) {
  const flaechen = PRINT_AREA_DATA[p.id];
  if (!flaechen) continue;
  const farbe = dunkelsteFarbeMitFotos(p.id, p.colors);
  if (!farbe) continue;

  for (const [view, a] of Object.entries(flaechen)) {
    if (!a) continue;
    const pfad = bildFuerAnsicht(p.id, farbe.id, view);
    if (!pfad || pfad === PLATZHALTER_BILD) { ohneBild++; continue; }
    const datei = `public${pfad.replace(/\.webp$/, '.png')}`;
    if (!existsSync(datei)) { ohneBild++; continue; }

    const { m, w, h } = await maske(datei);
    const x0 = Math.round((a.x0 / 100) * w), x1 = Math.round((a.x1 / 100) * w);
    const y0 = Math.round((a.y0 / 100) * h), y1 = Math.round((a.y1 / 100) * h);

    let felder = 0, aufStoff = 0;
    for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
        felder++;
        if (m[y * w + x]) aufStoff++;
      }
    }
    if (!felder) continue;
    geprueft++;

    // Verfügbare Stoffbreite auf halber Boxhöhe.
    const mitteY = Math.min(h - 1, Math.max(0, Math.round((y0 + y1) / 2)));
    let stoffBreite = 0;
    for (let x = 0; x < w; x++) if (m[mitteY * w + x]) stoffBreite++;

    befunde.push({
      produkt: p.id,
      view,
      deckung: (aufStoff / felder) * 100,
      ueberKragen: y0 < schulterZeile(m, w, h),
      breitenNutzung: stoffBreite ? ((x1 - x0) / stoffBreite) * 100 : 0,
    });
  }
}

const schlecht = befunde.filter((b) => b.deckung < MIN_DECKUNG).sort((a, b) => a.deckung - b.deckung);
const imKragen = befunde.filter((b) => b.ueberKragen);

console.log(`${geprueft} Druckflächen geprüft (${ohneBild} ohne Bild übersprungen).\n`);
const schnitt = (f: (b: Befund) => number) => (befunde.reduce((s, b) => s + f(b), 0) / befunde.length).toFixed(1);
console.log(`Mittlere Deckung auf Stoff : ${schnitt((b) => b.deckung)} %`);
console.log(`Mittlere Breitennutzung    : ${schnitt((b) => b.breitenNutzung)} %`);
console.log(`Flächen unter ${MIN_DECKUNG} % Deckung : ${schlecht.length}`);
console.log(`Flächen im Kragenbereich   : ${imKragen.length}`);

if (schlecht.length) {
  console.log('\nSchlechteste Deckung (Box ragt über den Stoffrand):');
  for (const b of schlecht.slice(0, 25)) {
    console.log(`  ${b.deckung.toFixed(1).padStart(5)} %  ${b.produkt}/${b.view}`);
  }
}
if (imKragen.length) {
  console.log('\nOberkante über der Schulterlinie (Kragen/Kapuze):');
  for (const b of imKragen.slice(0, 25)) console.log(`  ${b.produkt}/${b.view}`);
}

if (schlecht.length || imKragen.length) process.exit(1);
console.log('\nAlle Druckflächen liegen sauber auf dem Kleidungsstück.');
