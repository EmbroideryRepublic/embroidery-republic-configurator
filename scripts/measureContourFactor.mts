/**
 * Ermittelt den Umrechnungsfaktor zwischen GEMESSENER Bild-Torsobreite und
 * ECHTER Brustbreite aus der Herstellertabelle.
 *
 * Hintergrund: Die Produktfotos sind Ghost-Mannequin-Aufnahmen. Das
 * Kleidungsstück wird darauf dreidimensional getragen dargestellt, wirkt
 * also schmaler als die flach gemessene Brustbreite der Größentabelle. Für
 * Produkte, bei denen die Achsel in der Kontur erkennbar ist, lassen sich
 * BEIDE Werte bestimmen – ihr Verhältnis ist der gesuchte Faktor.
 *
 * Dieser Faktor wird ausschließlich dort angewendet, wo die Konturerkennung
 * versagt (Hoodies/Sweatshirts mit anliegenden Ärmeln). Er wird hier aus dem
 * Bestand GEMESSEN, nicht geschätzt – inklusive Streuung, damit belegt ist,
 * wie verlässlich er trägt.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/measureContourFactor.mts
 */
import { readdirSync, existsSync } from 'node:fs';
import { berechneFlaeche } from './computePrintAreas.mjs';

const { PRODUCTS } = await import('../src/config/products/index.ts');

/** Sucht den ersten Farbordner eines Produkts mit vorhandener Vorderansicht. */
function frontBild(productId: string): string | null {
  const wurzel = 'public/products';
  const ordner = readdirSync(wurzel).filter(
    (d) => d === productId || d.startsWith(`${productId}-`)
  );
  for (const d of ordner) {
    for (const endung of ['png', 'webp']) {
      const p = `${wurzel}/${d}/front.${endung}`;
      if (existsSync(p)) return p;
    }
  }
  return null;
}

/** Mittlere Größe der Maßtabelle – bevorzugt M, sonst die mittlere Zeile. */
function referenzMass(sizeGuide: { measurements: { size: string; breiteCm: number; hoeheCm: number }[] }) {
  const m = sizeGuide.measurements;
  return m.find((x) => x.size === 'M') ?? m[Math.floor(m.length / 2)];
}

interface Zeile {
  id: string;
  typ: string;
  bildBreiteCm: number;
  tabelleBreiteCm: number;
  faktor: number;
}

const messbar: Zeile[] = [];
const nichtMessbar: { id: string; typ: string; grund: string }[] = [];

for (const p of PRODUCTS) {
  const bild = frontBild(p.id);
  if (!bild) {
    nichtMessbar.push({ id: p.id, typ: p.productType, grund: 'kein Vorderbild gefunden' });
    continue;
  }
  if (!p.sizeGuide?.measurements?.length) {
    nichtMessbar.push({ id: p.id, typ: p.productType, grund: 'keine Maßtabelle' });
    continue;
  }

  const mass = referenzMass(p.sizeGuide);
  const r = await berechneFlaeche(bild, mass.hoeheCm);

  if (!r.ok) {
    nichtMessbar.push({ id: p.id, typ: p.productType, grund: r.grund });
    continue;
  }
  if (!r.torsoAusKontur) {
    nichtMessbar.push({ id: p.id, typ: p.productType, grund: 'Achsel nicht erkennbar (Ärmel liegen an)' });
    continue;
  }

  messbar.push({
    id: p.id,
    typ: p.productType,
    bildBreiteCm: r.diagnose.torsoBreiteCm,
    tabelleBreiteCm: mass.breiteCm,
    faktor: Number((r.diagnose.torsoBreiteCm / mass.breiteCm).toFixed(4)),
  });
}

// ── Auswertung ────────────────────────────────────────────────────────────
const faktoren = messbar.map((z) => z.faktor).sort((a, b) => a - b);
const mittel = faktoren.reduce((s, f) => s + f, 0) / faktoren.length;
const median = faktoren[Math.floor(faktoren.length / 2)];
const stdabw = Math.sqrt(faktoren.reduce((s, f) => s + (f - mittel) ** 2, 0) / faktoren.length);

console.log(`\nMESSBAR: ${messbar.length} Produkte (Achsel in der Kontur erkennbar)\n`);
console.log('Produkt                          | Typ         |  Bild  | Tabelle | Faktor');
console.log('---------------------------------|-------------|--------|---------|-------');
for (const z of [...messbar].sort((a, b) => a.faktor - b.faktor)) {
  console.log(
    `${z.id.padEnd(32)} | ${z.typ.padEnd(11)} | ${String(z.bildBreiteCm).padStart(5)}  |  ${String(z.tabelleBreiteCm).padStart(5)}  | ${z.faktor.toFixed(3)}`
  );
}

console.log(`\nFaktor  Mittelwert : ${mittel.toFixed(4)}`);
console.log(`        Median     : ${median.toFixed(4)}`);
console.log(`        Streuung   : ± ${stdabw.toFixed(4)} (${((stdabw / mittel) * 100).toFixed(1)} %)`);
console.log(`        Spanne     : ${faktoren[0].toFixed(3)} .. ${faktoren[faktoren.length - 1].toFixed(3)}`);

// Streuung je Produktart – zeigt, ob ein einziger Faktor überhaupt trägt.
console.log('\nFaktor je Produktart:');
const nachTyp = new Map<string, number[]>();
for (const z of messbar) nachTyp.set(z.typ, [...(nachTyp.get(z.typ) ?? []), z.faktor]);
for (const [typ, fs] of [...nachTyp.entries()].sort()) {
  const m = fs.reduce((s, f) => s + f, 0) / fs.length;
  const s = Math.sqrt(fs.reduce((a, f) => a + (f - m) ** 2, 0) / fs.length);
  console.log(`  ${typ.padEnd(12)} n=${String(fs.length).padStart(2)}  Mittel ${m.toFixed(3)}  ± ${s.toFixed(3)}`);
}

console.log(`\nNICHT MESSBAR: ${nichtMessbar.length} Produkte\n`);
for (const z of nichtMessbar.sort((a, b) => a.grund.localeCompare(b.grund))) {
  console.log(`  ${z.id.padEnd(32)} | ${String(z.typ).padEnd(11)} | ${z.grund}`);
}
