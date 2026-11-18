/**
 * Zusammenspiel von Konfigurator-Speicher und Entwurfs-Speicher.
 *
 * Geprüft wird der Ablauf, den die Person erlebt: Hoodie bearbeiten, Produkt
 * wechseln, Entwurf erscheint, per Klick zurückholen – und dass ein bloß
 * durchgeblättertes Produkt KEINEN Entwurf bekommt, obwohl das Design dorthin
 * mitwandert.
 *
 * Die Speicher laufen hier ohne Browser (IndexedDB gibt es in Node nicht): das
 * Speichern scheitert still und die Zustände leben nur im Arbeitsspeicher –
 * genau das, was geprüft wird. Die Fehlermeldungen des Speicher-Fallbacks
 * (console.error in indexedDbStorage) werden für diese Datei unterdrückt.
 */
import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useEntwuerfeStore } from '@/stores/entwuerfeStore';

before(() => {
  console.error = () => undefined;
});

function text(id: string): ConfigElement {
  return {
    id, type: 'text', view: 'front', xCm: 1, yCm: 2, widthCm: 10, heightCm: 3, rotationDeg: 0, isOutOfBounds: false,
    content: 'Hallo', fontFamily: 'Arial', fontSizePx: 24, color: '#000000', bold: false, italic: false,
    align: 'center', letterSpacing: 0, lineHeight: 1.2,
  } as unknown as ConfigElement;
}

const cfg = () => useConfiguratorStore.getState();
const entwuerfe = () => useEntwuerfeStore.getState().entwuerfe;

beforeEach(() => {
  useEntwuerfeStore.getState().leere();
  cfg().reset();
});

test('Hoodie bearbeiten, dann ein anderes Produkt wählen: der Hoodie wird als Entwurf gemerkt', () => {
  cfg().setProduct('hoodie-a');
  cfg().setColor('navy');
  cfg().addElement(text('t1'));
  cfg().setSizeQuantity('M', 3);

  cfg().setProduct('hoodie-b');

  assert.equal(entwuerfe().length, 1);
  const e = entwuerfe()[0]!;
  assert.equal(e.productId, 'hoodie-a');
  assert.equal(e.colorId, 'navy');
  assert.equal(e.elements.length, 1);
  assert.deepEqual(e.sizeQuantities, { M: 3 });
});

test('der Entwurf hält den Stand VOR dem Wechsel – auch wenn das Design danach angepasst wird', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-b');
  // Übernahme + automatische Anpassung auf dem neuen Produkt:
  cfg().updateElement('t1', { xCm: 77, widthCm: 5 });

  assert.equal(entwuerfe()[0]!.elements[0]!.xCm, 1, 'der Entwurf bleibt unverändert');
});

test('ein bloß durchgeblättertes Produkt mit mitgewandertem Design bekommt KEINEN Entwurf', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setSizeQuantity('M', 3);
  cfg().setProduct('hoodie-b');
  // Übernahme beim Produktwechsel: Größen im Rutsch, Canvas korrigiert die Lage von selbst.
  cfg().setSizeQuantities({ M: 3 });
  cfg().updateElement('t1', { xCm: 5, yCm: 6, isOutOfBounds: false });

  cfg().setProduct('shirt-c');

  assert.deepEqual(entwuerfe().map((e) => e.productId), ['hoodie-a'], 'nur der Hoodie, an dem gearbeitet wurde');
});

test('wird auf dem neuen Produkt selbst etwas geändert, gibt es beim Verlassen einen Entwurf', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-b');
  cfg().addElement(text('t2'));

  cfg().setProduct('shirt-c');

  assert.deepEqual(entwuerfe().map((e) => e.productId), ['hoodie-b', 'hoodie-a']);
});

test('Text ändern (ohne Verlaufspunkt) zählt als Bearbeitung', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-b');
  cfg().updateElement('t1', { content: 'Anderer Text' } as Partial<ConfigElement>);

  cfg().setProduct('shirt-c');

  assert.ok(entwuerfe().some((e) => e.productId === 'hoodie-b'));
});

test('dasselbe Produkt erneut wählen merkt nichts', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-a');
  assert.equal(entwuerfe().length, 0);
});

test('ohne Motiv und ohne Menge entsteht kein Entwurf – auch nach Hinzufügen und Entfernen', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().removeElement('t1');
  cfg().setProduct('hoodie-b');
  assert.equal(entwuerfe().length, 0);
});

test('Entwurf zurückholen: Produkt, Farbe, Größen und Motive sind wieder da, der Entwurf ist aus der Leiste', () => {
  cfg().setProduct('hoodie-a');
  cfg().setColor('navy');
  cfg().addElement(text('t1'));
  cfg().setSizeQuantity('L', 2);
  cfg().setProduct('shirt-c');
  const id = entwuerfe()[0]!.id;

  cfg().resumeDraft(id);

  const s = cfg();
  assert.equal(s.productId, 'hoodie-a');
  assert.equal(s.colorId, 'navy');
  assert.equal(s.elements.length, 1);
  assert.equal(s.elements[0]!.id, 't1');
  assert.deepEqual(s.sizeQuantities, { L: 2 });
  assert.ok(!entwuerfe().some((e) => e.id === id));
});

test('beim Zurückholen wird der gerade bearbeitete Stand selbst zum Entwurf (Tausch, nichts geht verloren)', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-b');
  cfg().addElement(text('t2')); // an b selbst gearbeitet
  const idA = entwuerfe().find((e) => e.productId === 'hoodie-a')!.id;

  cfg().resumeDraft(idA);

  assert.equal(cfg().productId, 'hoodie-a');
  assert.deepEqual(entwuerfe().map((e) => e.productId), ['hoodie-b'], 'b ist jetzt der Entwurf, a ist geladen');
});

test('beim Zurückholen wird ein bloß durchgeblättertes Produkt NICHT zum Entwurf', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('hoodie-b'); // nur angesehen, Design wandert mit
  cfg().setSizeQuantities({});
  const idA = entwuerfe()[0]!.id;

  cfg().resumeDraft(idA);

  assert.equal(entwuerfe().length, 0);
  assert.equal(cfg().productId, 'hoodie-a');
});

test('ein unbekannter Entwurf ändert nichts', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().resumeDraft('gibt-es-nicht');
  assert.equal(cfg().productId, 'hoodie-a');
  assert.equal(cfg().elements.length, 1);
});

test('zurückgeholter Stand zählt als bearbeitet: Wechsel danach merkt ihn wieder', () => {
  cfg().setProduct('hoodie-a');
  cfg().addElement(text('t1'));
  cfg().setProduct('shirt-c');
  cfg().resumeDraft(entwuerfe()[0]!.id);
  assert.equal(entwuerfe().length, 0);

  cfg().setProduct('polo-d');

  assert.deepEqual(entwuerfe().map((e) => e.productId), ['hoodie-a']);
});
