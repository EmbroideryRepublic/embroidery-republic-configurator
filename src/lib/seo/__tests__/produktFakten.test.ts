/**
 * Wächter für „Auf einen Blick“ und die Fragen je Produktseite (lib/seo/produktFakten.ts).
 *
 * Der Text entsteht für ALLE Modelle aus den Katalogdaten. Diese Tests verhindern die stillen Fehler solcher Texte: ein Rest-Platzhalter,
 * „undefined“ oder „NaN“ auf einer von 172 Seiten, eine Gewichtsangabe, die nicht zum Modell passt, ein Versprechen (Stickerei), das der
 * Betrieb gerade nicht einlösen kann, eine Behauptung, die wir nicht belegen können.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { produktTypLabel } from '@/config/products/types';
import { PRINT_AREA_DATA } from '@/config/printAreaData';
import { positionLabel } from '@/config/decorationPositions';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import { gewichtsEinordnung, produktFakten, type Veredelungsflaeche } from '../produktFakten';

function flaechenVon(id: string): Veredelungsflaeche[] {
  return Object.entries(PRINT_AREA_DATA[id] ?? {}).map(([ansicht, a]) => ({
    ansicht: positionLabel(ansicht),
    breiteCm: a!.maxWidthCm,
    hoeheCm: a!.maxHeightCm,
  }));
}

function alleTexte(id: string): string[] {
  const p = PRODUCTS.find((x) => x.id === id)!;
  const f = produktFakten(p, produktTypLabel(p.productType), flaechenVon(p.id), veredelungVerfuegbar('embroidery'));
  return [...f.absaetze, ...f.fragen.flatMap((q) => [q.q, q.a])];
}

test('jedes Modell bekommt Text und Fragen ohne Rest-Platzhalter, undefined oder NaN', () => {
  for (const p of PRODUCTS) {
    const f = produktFakten(p, produktTypLabel(p.productType), flaechenVon(p.id), veredelungVerfuegbar('embroidery'));
    assert.ok(f.absaetze.length >= 2, `${p.id}: nur ${f.absaetze.length} Absätze`);
    assert.ok(f.fragen.length >= 4, `${p.id}: nur ${f.fragen.length} Fragen`);
    assert.equal(new Set(f.fragen.map((q) => q.q)).size, f.fragen.length, `${p.id}: doppelte Frage`);
    for (const t of alleTexte(p.id)) {
      assert.doesNotMatch(t, /[{}]|undefined|NaN|null/, `${p.id}: Auffälligkeit in "${t.slice(0, 80)}"`);
      assert.ok(t.trim().length > 10, `${p.id}: leerer Text`);
    }
    assert.ok(f.absaetze[0]!.includes(p.name), `${p.id}: Name fehlt im ersten Absatz`);
  }
});

test('die Angaben stimmen mit dem Modell überein: Gewicht, Größen, Farbanzahl, Flächen', () => {
  for (const p of PRODUCTS) {
    const f = produktFakten(p, produktTypLabel(p.productType), flaechenVon(p.id), veredelungVerfuegbar('embroidery'));
    const text = f.absaetze.join(' ');
    if (p.weightGsm) assert.ok(text.includes(`${p.weightGsm} g/m²`), `${p.id}: Gewicht`);
    assert.ok(text.includes(`${p.colors.length} Farb`), `${p.id}: Farbanzahl`);
    const groessen = f.fragen.find((q) => q.q.startsWith('Welche Größen'))!;
    for (const s of p.sizes) assert.ok(groessen.a.includes(s), `${p.id}: Größe ${s} fehlt in der Antwort`);
    for (const fl of flaechenVon(p.id)) assert.ok(text.includes(fl.ansicht), `${p.id}: Fläche ${fl.ansicht}`);
  }
});

test('Gewichtseinordnung: schwerstes Modell = schwerer, leichtestes = leichter, zu kleine Vergleichsgruppe = keine Aussage', () => {
  const hoodies = PRODUCTS.filter((p) => p.productType === 'hoodie' && p.weightGsm);
  const schwer = [...hoodies].sort((a, b) => b.weightGsm! - a.weightGsm!)[0]!;
  const leicht = [...hoodies].sort((a, b) => a.weightGsm! - b.weightGsm!)[0]!;
  assert.equal(gewichtsEinordnung(schwer)!.lage, 'schwerer');
  assert.equal(gewichtsEinordnung(leicht)!.lage, 'leichter');
  assert.equal(gewichtsEinordnung(schwer)!.max, schwer.weightGsm);
  // Sweater: weniger als 6 Modelle im Katalog → keine Einordnung (sonst bedeutete „schwerer“ nichts).
  const sweater = PRODUCTS.find((p) => p.productType === 'sweater' && p.weightGsm);
  if (sweater) assert.equal(gewichtsEinordnung(sweater), null);
});

test('Stickerei pausiert: kein Text verspricht Stickerei oder Besticken', () => {
  if (veredelungVerfuegbar('embroidery')) return;
  for (const p of PRODUCTS) {
    for (const t of alleTexte(p.id)) assert.doesNotMatch(t, /besticke|bestickt|stickerei|stickdatei|digitalisier/i, `${p.id}: "${t.slice(0, 80)}"`);
  }
});

test('keine unbelegten Superlative oder Garantien', () => {
  for (const p of PRODUCTS) {
    for (const t of alleTexte(p.id)) {
      assert.doesNotMatch(t, /garantier|testsieger|(?<!am )beste[rn]? |günstigste|billigste|originalgetreu|waschfest|jahrelang|lebenslang|schnellste/i, `${p.id}: "${t.slice(0, 80)}"`);
    }
  }
});
