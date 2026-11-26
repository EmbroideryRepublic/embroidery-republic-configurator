/**
 * Einzeilige Farbleiste (farbreihe.ts): Auswahl der sichtbaren Farben, Verhalten der gewählten Farbe, Knopftext, Messung der ersten Zeile.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { einzeiligeFarben, ersteZeileAnzahl, farbreiheKnopfText } from '../farbreihe';

const farben = Array.from({ length: 12 }, (_, i) => ({ id: `f${i + 1}` }));
const ids = (l: { id: string }[]) => l.map((f) => f.id);

test('passt alles in eine Zeile oder ist noch nicht gemessen, bleibt die Liste unverändert und nichts ist versteckt', () => {
  assert.deepEqual(einzeiligeFarben(farben, 'f1', null, false), { liste: farben, versteckt: 0 });
  assert.equal(einzeiligeFarben(farben, 'f1', 12, false).versteckt, 0);
  assert.equal(einzeiligeFarben(farben, 'f1', 20, false).versteckt, 0);
  assert.equal(einzeiligeFarben(farben, 'f1', 0, false).versteckt, 0);
});

test('zu viele Farben: die Zahl der versteckten ergibt sich aus der ersten Zeile', () => {
  assert.equal(einzeiligeFarben(farben, 'f1', 5, false).versteckt, 7);
  assert.equal(einzeiligeFarben(farben, 'f1', 5, true).versteckt, 7);
});

test('die Reihenfolge bleibt, wenn die gewählte Farbe in der ersten Zeile steht', () => {
  assert.deepEqual(ids(einzeiligeFarben(farben, 'f3', 5, false).liste), ids(farben));
});

test('eine gewählte Farbe außerhalb der ersten Zeile rückt zugeklappt in die letzte sichtbare Stelle', () => {
  const r = einzeiligeFarben(farben, 'f9', 5, false);
  assert.equal(r.liste[4]!.id, 'f9');
  assert.equal(r.liste[8]!.id, 'f5');
  assert.equal(new Set(ids(r.liste)).size, 12);
  assert.equal(r.versteckt, 7);
});

test('aufgeklappt bleibt die Katalogreihenfolge', () => {
  assert.deepEqual(ids(einzeiligeFarben(farben, 'f9', 5, true).liste), ids(farben));
});

test('die Eingabe wird nicht verändert', () => {
  const kopie = ids(farben);
  einzeiligeFarben(farben, 'f9', 5, false);
  assert.deepEqual(ids(farben), kopie);
});

test('unbekannte oder fehlende gewählte Farbe stört nicht', () => {
  assert.deepEqual(ids(einzeiligeFarben(farben, 'xyz', 5, false).liste), ids(farben));
  assert.deepEqual(ids(einzeiligeFarben(farben, undefined, 5, false).liste), ids(farben));
});

test('Knopftext: zugeklappt mit Anzahl, aufgeklappt „Weniger“', () => {
  assert.equal(farbreiheKnopfText(7, false, 'weitere Farben', 'Weniger Farben'), '+7 weitere Farben');
  assert.equal(farbreiheKnopfText(7, true, 'weitere Farben', 'Weniger Farben'), 'Weniger Farben');
});

test('Messung der ersten Zeile: gleiche obere Kante (Toleranz 2 px) zählt', () => {
  assert.equal(ersteZeileAnzahl([6, 6, 6, 6, 6, 62, 62, 62]), 5);
  assert.equal(ersteZeileAnzahl([6, 5, 7, 6]), 4);
  assert.equal(ersteZeileAnzahl([6]), 1);
  assert.equal(ersteZeileAnzahl([]), 0);
});
