import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROSSFORMAT_STUFEN, folienkostenJeMotiv, grossformatZuschlag } from '../grossformat';
import { guenstigsteBelegung } from '../dtfKosten';

/** Folienkosten je Stück (nur Bögen) laut Belegungsrechnung. */
function folie(breiteCm: number, hoeheCm: number, menge: number): number {
  return guenstigsteBelegung([{ breiteMm: breiteCm * 10, hoeheMm: hoeheCm * 10, anzahl: menge }]).bogenkosten / menge;
}

test('Standardformat kostet nichts extra, große Motive stufenweise', () => {
  assert.equal(grossformatZuschlag(20, 25), 0, 'kalkuliertes Standardmotiv');
  assert.equal(grossformatZuschlag(25, 32), 0, 'noch 6 Motive je langem Bogen');
  assert.equal(grossformatZuschlag(30, 47), 4);
  assert.equal(grossformatZuschlag(28, 40), 4);
  assert.equal(grossformatZuschlag(40, 47), 7);
  assert.equal(grossformatZuschlag(52, 47), 7, 'passt gerade noch zweimal auf den langen Bogen');
  assert.equal(grossformatZuschlag(58, 47), 17);
});

test('maßgeblich sind die Folienkosten, nicht die Fläche: 28 × 28 cm kostet mehr Folie als 25 × 32 cm', () => {
  assert.ok(28 * 28 < 25 * 32);
  assert.ok(folienkostenJeMotiv(28, 28) > folienkostenJeMotiv(25, 32));
  assert.equal(grossformatZuschlag(28, 28), 4);
  assert.equal(grossformatZuschlag(25, 32), 0);
});

test('passt ein Motiv nur einzeln auf den langen Bogen, gilt die oberste Stufe – auch bei kleiner Fläche', () => {
  assert.equal(grossformatZuschlag(57, 30), 17);
  assert.equal(grossformatZuschlag(30, 57), 17);
  assert.equal(grossformatZuschlag(50, 50), 17);
});

test('ein Motiv, das auf keinen Bogen passt, bekommt die oberste Stufe statt eines Fehlers', () => {
  assert.equal(folienkostenJeMotiv(120, 120), Number.POSITIVE_INFINITY);
  assert.equal(grossformatZuschlag(120, 120), 17);
});

test('ungültige Maße lösen keinen Zuschlag aus', () => {
  assert.equal(grossformatZuschlag(0, 20), 0);
  assert.equal(grossformatZuschlag(Number.NaN, 20), 0);
  assert.equal(grossformatZuschlag(-5, 20), 0);
});

test('der Zuschlag steigt nie mit kleineren Folienkosten und die Stufen sind streng aufsteigend', () => {
  const beträge = GROSSFORMAT_STUFEN.map((s) => s.zuschlag);
  assert.deepEqual([...beträge].sort((a, b) => a - b), beträge);
  const grenzen = GROSSFORMAT_STUFEN.map((s) => s.bisFolienkosten);
  assert.deepEqual([...grenzen].sort((a, b) => a - b), grenzen);
});

test('der Zuschlag deckt die Folien-Mehrkosten gegenüber dem Standardmotiv 20 × 25 cm (ab 5 Stück)', () => {
  // Beispiele der Herleitung in grossformat.ts. Toleranz 0,50 €: die Bogenbelegung rechnet im Raster und springt mit der Menge.
  const beispiele: Array<[number, number]> = [
    [28, 28],
    [28, 40],
    [30, 47],
    [35, 47],
    [40, 47],
    [52, 47],
    [58, 47],
    [52, 60],
    [57, 30],
  ];
  for (const [b, h] of beispiele) {
    for (const menge of [5, 10, 25, 50, 100]) {
      const mehrkosten = folie(b, h, menge) - folie(20, 25, menge);
      const zuschlag = grossformatZuschlag(b, h);
      assert.ok(
        zuschlag >= mehrkosten - 0.5,
        `${b}×${h} cm bei ${menge} Stück: Zuschlag ${zuschlag} € deckt Mehrkosten ${mehrkosten.toFixed(2)} € nicht`
      );
    }
  }
});
