/**
 * Gegenprüfung des geometrischen Modells + Audit der Bildvollständigkeit.
 *
 * TEIL 1 – Gegenprüfung 2/π
 * Die Brustbreite der Herstellertabelle ist FLACH gemessen, entspricht also
 * dem halben Umfang. Ein rundes Kleidungsstück zeigt von vorne fotografiert
 * seinen Durchmesser. Für einen idealen Zylinder gilt damit
 *     sichtbare Breite / flache Breite = 2r / (π·r) = 2/π ≈ 0,6366.
 * Geprüft wird, wie weit die 28 real messbaren Produkte davon abweichen –
 * je Produktgruppe, mit Mittelwert, Median, Standardabweichung und Maximum.
 *
 * TEIL 2 – Bildbestand
 * Sucht systematisch fehlende Ansichten (Vorder-, Rück-, Ärmelbilder) über
 * alle Farbordner. Platzhalter sind ausgeschlossen, deshalb muss jede Lücke
 * benannt werden.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/validateGeometricModel.mts
 */
import { readdirSync, existsSync } from 'node:fs';
import { berechneFlaeche } from './computePrintAreas.mjs';

const { PRODUCTS } = await import('../src/config/products/index.ts');

const ZWEI_DURCH_PI = 2 / Math.PI;
const ANSICHTEN = ['front', 'back', 'sleeve-left', 'sleeve-right'] as const;

function bildPfad(ordner: string, ansicht: string): string | null {
  for (const e of ['png', 'webp']) {
    const p = `public/products/${ordner}/${ansicht}.${e}`;
    if (existsSync(p)) return p;
  }
  return null;
}

function ordnerFuer(productId: string): string[] {
  return readdirSync('public/products').filter((d) => d === productId || d.startsWith(`${productId}-`));
}

function statistik(werte: number[]) {
  const s = [...werte].sort((a, b) => a - b);
  const mittel = werte.reduce((a, b) => a + b, 0) / werte.length;
  return {
    n: werte.length,
    mittel,
    median: s[Math.floor(s.length / 2)]!,
    stdabw: Math.sqrt(werte.reduce((a, f) => a + (f - mittel) ** 2, 0) / werte.length),
    max: Math.max(...werte.map(Math.abs)),
  };
}

// ══ TEIL 1 ═══════════════════════════════════════════════════════════════
interface Befund {
  id: string;
  typ: string;
  gemessen: number;
  abweichungProzent: number;
  breiteIstCm: number;
  breiteModellCm: number;
}

const befunde: Befund[] = [];

for (const p of PRODUCTS) {
  const ordner = ordnerFuer(p.id);
  const bild = ordner.map((o) => bildPfad(o, 'front')).find(Boolean);
  const mass = p.sizeGuide?.measurements?.find((m) => m.size === 'M') ?? p.sizeGuide?.measurements?.[0];
  if (!bild || !mass) continue;

  const r = await berechneFlaeche(bild, mass.hoeheCm);
  if (!r.ok || !r.torsoAusKontur) continue;

  const gemessen = r.diagnose.torsoBreiteCm / mass.breiteCm;
  const breiteModellCm = mass.breiteCm * ZWEI_DURCH_PI;
  befunde.push({
    id: p.id,
    typ: p.productType,
    gemessen,
    abweichungProzent: ((gemessen - ZWEI_DURCH_PI) / ZWEI_DURCH_PI) * 100,
    breiteIstCm: r.diagnose.torsoBreiteCm,
    breiteModellCm,
  });
}

console.log(`\n═══ GEGENPRÜFUNG GEOMETRISCHES MODELL (2/π = ${ZWEI_DURCH_PI.toFixed(4)}) ═══\n`);
console.log('Produkt                          | Typ    | gemessen | Modell cm | Ist cm | Abw. %');
console.log('---------------------------------|--------|----------|-----------|--------|-------');
for (const b of [...befunde].sort((a, b) => a.abweichungProzent - b.abweichungProzent)) {
  const vz = b.abweichungProzent >= 0 ? '+' : '';
  console.log(
    `${b.id.padEnd(32)} | ${b.typ.slice(0, 6).padEnd(6)} | ${b.gemessen.toFixed(4).padStart(8)} | ${b.breiteModellCm.toFixed(1).padStart(9)} | ${b.breiteIstCm.toFixed(1).padStart(6)} | ${vz}${b.abweichungProzent.toFixed(1)}`
  );
}

const gesamt = statistik(befunde.map((b) => b.abweichungProzent));
console.log(`\nGESAMT  n=${gesamt.n}`);
console.log(`  Mittlere Abweichung : ${gesamt.mittel >= 0 ? '+' : ''}${gesamt.mittel.toFixed(2)} %`);
console.log(`  Median              : ${gesamt.median >= 0 ? '+' : ''}${gesamt.median.toFixed(2)} %`);
console.log(`  Standardabweichung  : ${gesamt.stdabw.toFixed(2)} %`);
console.log(`  Maximale Abweichung : ${gesamt.max.toFixed(2)} %`);

console.log('\nJE PRODUKTGRUPPE:');
const proTyp = new Map<string, number[]>();
for (const b of befunde) proTyp.set(b.typ, [...(proTyp.get(b.typ) ?? []), b.abweichungProzent]);
for (const [typ, werte] of [...proTyp.entries()].sort()) {
  const s = statistik(werte);
  console.log(
    `  ${typ.padEnd(12)} n=${String(s.n).padStart(2)}  Mittel ${s.mittel >= 0 ? '+' : ''}${s.mittel.toFixed(2)} %  Median ${s.median >= 0 ? '+' : ''}${s.median.toFixed(2)} %  σ ${s.stdabw.toFixed(2)} %  max ${s.max.toFixed(2)} %`
  );
}

// ══ TEIL 2 ═══════════════════════════════════════════════════════════════
console.log('\n\n═══ BILDBESTAND ═══\n');
let luecken = 0;
for (const p of PRODUCTS) {
  const ordner = ordnerFuer(p.id);
  if (ordner.length === 0) {
    console.log(`  ${p.id.padEnd(32)} | KEIN BILDORDNER`);
    luecken++;
    continue;
  }
  const braucht = p.hasSleeves === false ? ANSICHTEN.slice(0, 2) : ANSICHTEN;
  for (const o of ordner) {
    const fehlend = braucht.filter((a) => !bildPfad(o, a));
    if (fehlend.length > 0) {
      console.log(`  ${o.padEnd(40)} | fehlt: ${fehlend.join(', ')}`);
      luecken++;
    }
  }
}
console.log(luecken === 0 ? '  Keine Lücken gefunden.' : `\n  ${luecken} Ordner mit fehlenden Ansichten.`);
