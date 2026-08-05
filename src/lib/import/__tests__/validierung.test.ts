/**
 * WÄCHTER der Eingangs-Validierung (ADR 0006): fehlerhafte Adapter-Daten fallen
 * fail-loud auf, statt still Falsches zu erzeugen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { validiereRohProdukt, validiereBildReferenzen } from '../validierung';
import type { RohProdukt } from '../rohProdukt';
import type { BildReferenz, ImportProduktRef } from '../imageSource';

const roh = (p: Partial<RohProdukt>): RohProdukt => ({
  url: 'https://x/y.html', sourceCategory: 't', brand: 'Gildan', name: 'T', artNr: 'G1',
  material: '100% Baumwolle', weight: 150, sizes: ['M'], basePriceNet: 5,
  colors: [{ name: 'Navy', hex: '#001133' }], ...p,
});

test('validiereRohProdukt: gültiges Produkt → keine Fehler', () => {
  assert.deepEqual(validiereRohProdukt(roh({})), []);
});

test('validiereRohProdukt: leere colors/sizes und ungültiger hex werden erkannt', () => {
  assert.ok(validiereRohProdukt(roh({ colors: [] })).some((f) => f.includes('colors leer')));
  assert.ok(validiereRohProdukt(roh({ sizes: [] })).some((f) => f.includes('sizes leer')));
  assert.ok(validiereRohProdukt(roh({ colors: [{ name: 'X', hex: 'nope' }] })).some((f) => f.includes('ungültiger hex')));
});

const produkt: ImportProduktRef = { id: 'p', brand: 'G', colors: [{ id: 'navy', name: 'Navy', hex: '#001' }] };
const bref = (p: Partial<BildReferenz>): BildReferenz => ({
  colorId: 'navy', view: 'front', viewKonfidenz: 'gelabelt', rolle: 'ansicht-flach',
  herkunft: 'original', quelle: 'q', prioritaet: 0, quellUrl: 'https://x/f.jpg', ...p,
});

test('validiereBildReferenzen: unbekannte Farbe + fehlende URL werden erkannt', () => {
  assert.deepEqual(validiereBildReferenzen([bref({})], produkt), []);
  assert.ok(validiereBildReferenzen([bref({ colorId: 'gibtsnicht' })], produkt).some((f) => f.includes('unbekannte colorId')));
  assert.ok(validiereBildReferenzen([bref({ quellUrl: '' })], produkt).some((f) => f.includes('quellUrl fehlt')));
});
