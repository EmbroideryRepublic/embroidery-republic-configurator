/**
 * Prüfungen der Entwurfs-Logik („Zuletzt bearbeitet").
 *
 * Festgelegt wird, WANN ein Stand zum Entwurf wird, dass es höchstens einen
 * Entwurf je Produkt gibt, dass die Liste begrenzt und neueste-zuerst bleibt
 * und dass kaputte Browser-Daten die Leiste nicht zum Absturz bringen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import {
  MAX_ENTWUERFE,
  bereinigeGespeicherte,
  entferneEntwurf,
  erzeugeEntwurf,
  fuegeEntwurfEin,
  fuehreZusammen,
  istEntwurfswuerdig,
  type Arbeitsstand,
  type Entwurf,
} from '../entwuerfe';

function text(id: string): ConfigElement {
  return {
    id, type: 'text', view: 'front', xCm: 1, yCm: 2, widthCm: 10, heightCm: 3, rotationDeg: 0, isOutOfBounds: false,
    content: 'Hallo', fontFamily: 'Arial', fontSizePx: 24, color: '#000000', bold: false, italic: false,
    align: 'center', letterSpacing: 0, lineHeight: 1.2,
  } as unknown as ConfigElement;
}

function stand(teil: Partial<Arbeitsstand> = {}): Arbeitsstand {
  return {
    printMethod: 'dtf', productId: 'hoodie-a', colorId: 'weiss', sizeQuantities: {}, activeView: 'front',
    elements: [], totalPrice: 0, ...teil,
  };
}

function entwurf(productId: string, gespeichertAm: number, id = `${productId}-${gespeichertAm}`): Entwurf {
  const e = erzeugeEntwurf(stand({ productId, elements: [text('t')] }), gespeichertAm, id);
  assert.ok(e);
  return e;
}

// ── Wann lohnt ein Entwurf? ──────────────────────

test('ein bloß angesehenes Produkt (kein Motiv, keine Menge) ist keinen Entwurf wert', () => {
  assert.equal(istEntwurfswuerdig(stand()), false);
  assert.equal(erzeugeEntwurf(stand(), 1, 'x'), null);
});

test('ein Motiv genügt', () => {
  assert.equal(istEntwurfswuerdig(stand({ elements: [text('a')] })), true);
});

test('eine gewählte Stückzahl genügt', () => {
  assert.equal(istEntwurfswuerdig(stand({ sizeQuantities: { M: 3 } })), true);
});

test('Menge 0 zählt nicht', () => {
  assert.equal(istEntwurfswuerdig(stand({ sizeQuantities: { M: 0, L: 0 } })), false);
});

test('ohne Produkt gibt es nie einen Entwurf', () => {
  assert.equal(istEntwurfswuerdig(stand({ productId: null, elements: [text('a')] })), false);
  assert.equal(erzeugeEntwurf(stand({ productId: null, elements: [text('a')] }), 1, 'x'), null);
});

// ── Entstehen ────────────────────────────────────

test('der Entwurf übernimmt Produkt, Farbe, Größen, Veredelung, Ansicht und Motive', () => {
  const e = erzeugeEntwurf(
    stand({ productId: 'p', colorId: 'navy', sizeQuantities: { M: 3, L: 2 }, printMethod: 'embroidery', activeView: 'back', elements: [text('a')], totalPrice: 104.95 }),
    1000, 'id-1',
  );
  assert.ok(e);
  assert.equal(e.productId, 'p');
  assert.equal(e.colorId, 'navy');
  assert.deepEqual(e.sizeQuantities, { M: 3, L: 2 });
  assert.equal(e.printMethod, 'embroidery');
  assert.equal(e.activeView, 'back');
  assert.equal(e.elements.length, 1);
  assert.equal(e.totalPrice, 104.95);
  assert.equal(e.gespeichertAm, 1000);
  assert.equal(e.id, 'id-1');
});

test('spätere Änderungen am Arbeitsstand verändern den Entwurf nicht (Kopie, kein Verweis)', () => {
  const s = stand({ sizeQuantities: { M: 3 }, elements: [text('a')] });
  const e = erzeugeEntwurf(s, 1, 'x');
  assert.ok(e);
  s.sizeQuantities.M = 99;
  s.elements[0]!.xCm = 50;
  assert.equal(e.sizeQuantities.M, 3);
  assert.equal(e.elements[0]!.xCm, 1);
});

test('ein unbrauchbarer Preis wird zu 0 (unbekannt) statt NaN anzuzeigen', () => {
  assert.equal(erzeugeEntwurf(stand({ elements: [text('a')], totalPrice: Number.NaN }), 1, 'x')!.totalPrice, 0);
  assert.equal(erzeugeEntwurf(stand({ elements: [text('a')], totalPrice: -5 }), 1, 'x')!.totalPrice, 0);
});

// ── Liste ────────────────────────────────────────

test('neuester Entwurf steht vorn', () => {
  const liste = fuegeEntwurfEin(fuegeEntwurfEin([], entwurf('a', 1)), entwurf('b', 2));
  assert.deepEqual(liste.map((e) => e.productId), ['b', 'a']);
});

test('derselbe Hoodie ein zweites Mal verlassen ersetzt den älteren Stand statt die Leiste zu verdoppeln', () => {
  let liste = fuegeEntwurfEin([], entwurf('a', 1));
  liste = fuegeEntwurfEin(liste, entwurf('b', 2));
  liste = fuegeEntwurfEin(liste, entwurf('a', 3, 'a-neu'));
  assert.deepEqual(liste.map((e) => e.id), ['a-neu', 'b-2']);
});

test('die Liste ist begrenzt, der älteste fällt zuerst heraus', () => {
  let liste: Entwurf[] = [];
  for (let i = 1; i <= MAX_ENTWUERFE + 3; i++) liste = fuegeEntwurfEin(liste, entwurf(`p${i}`, i));
  assert.equal(liste.length, MAX_ENTWUERFE);
  assert.equal(liste[0]!.productId, `p${MAX_ENTWUERFE + 3}`);
  assert.ok(!liste.some((e) => e.productId === 'p1'), 'der älteste ist weg');
});

test('fuegeEntwurfEin verändert die Eingabeliste nicht', () => {
  const eingabe = [entwurf('a', 1)];
  const kopie = [...eingabe];
  fuegeEntwurfEin(eingabe, entwurf('b', 2));
  assert.deepEqual(eingabe, kopie);
});

test('Entfernen löscht genau diesen Entwurf; eine unbekannte ID ändert nichts', () => {
  const liste = [entwurf('a', 1), entwurf('b', 2)];
  assert.deepEqual(entferneEntwurf(liste, 'a-1').map((e) => e.productId), ['b']);
  assert.equal(entferneEntwurf(liste, 'gibt-es-nicht').length, 2);
});

// ── Zusammenführen (frisch gemerkt + aus dem Speicher geladen) ───────

test('beim Zusammenführen gewinnt je Produkt der neuere Entwurf', () => {
  const geladen = [entwurf('a', 1, 'alt'), entwurf('b', 5)];
  const frisch = [entwurf('a', 9, 'neu')];
  const z = fuehreZusammen(frisch, geladen);
  assert.deepEqual(z.map((e) => e.id), ['neu', 'b-5']);
});

test('Zusammenführen ist begrenzt und neueste zuerst', () => {
  const viele: Entwurf[] = [];
  for (let i = 1; i <= MAX_ENTWUERFE + 4; i++) viele.push(entwurf(`p${i}`, i));
  const z = fuehreZusammen(viele.slice(0, 5), viele.slice(5));
  assert.equal(z.length, MAX_ENTWUERFE);
  assert.ok(z[0]!.gespeichertAm > z[z.length - 1]!.gespeichertAm);
});

// ── Gespeichertes prüfen ─────────────────────────

test('kaputte Browser-Daten werden verworfen, nicht verwendet', () => {
  assert.deepEqual(bereinigeGespeicherte(null), []);
  assert.deepEqual(bereinigeGespeicherte('x'), []);
  assert.deepEqual(bereinigeGespeicherte({}), []);
  assert.deepEqual(bereinigeGespeicherte([null, 1, 'a', {}, { id: 'x' }, { id: 'x', productId: '' }]), []);
});

test('ein vollständiger gespeicherter Entwurf bleibt erhalten', () => {
  const gut = entwurf('a', 5);
  const z = bereinigeGespeicherte([gut, { id: 'kaputt' }]);
  assert.equal(z.length, 1);
  assert.deepEqual(z[0], gut);
});

test('fehlende optionale Felder bekommen sichere Vorgaben', () => {
  const z = bereinigeGespeicherte([{ id: 'x', productId: 'p', gespeichertAm: 1, elements: [], sizeQuantities: {} }]);
  assert.equal(z.length, 1);
  assert.equal(z[0]!.printMethod, 'dtf');
  assert.equal(z[0]!.colorId, null);
  assert.equal(z[0]!.activeView, 'front');
  assert.equal(z[0]!.totalPrice, 0);
});

// ── Handarbeit oder automatische Anpassung? ──────────────────────────

import { istHandbearbeitung } from '../entwuerfe';

function zustand(elements: ConfigElement[], history: unknown[] = []) {
  return { elements, history };
}

test('keine Änderung: keine Handarbeit', () => {
  const e = [text('a')];
  const h: unknown[] = [];
  assert.equal(istHandbearbeitung(zustand(e, h), zustand(e, h)), false);
});

test('Historie verändert (Hinzufügen, Entfernen, Verlaufspunkt, Undo): Handarbeit', () => {
  const e = [text('a')];
  assert.equal(istHandbearbeitung(zustand(e, []), zustand(e, [[]])), true);
});

test('nur automatische Nachführung (Position, Größe, Rand, Stichzahl, Schriftgröße ohne Verlaufspunkt): KEINE Handarbeit', () => {
  const h: unknown[] = [];
  const vorher = zustand([text('a')], h);
  const nachher = zustand([{ ...text('a'), xCm: 9, yCm: 8, widthCm: 7, heightCm: 6, isOutOfBounds: true, estimatedStitches: 123, fontSizePx: 11 } as ConfigElement], h);
  assert.equal(istHandbearbeitung(vorher, nachher), false);
});

test('Text geändert (ohne Verlaufspunkt, wie beim Tippen): Handarbeit', () => {
  const h: unknown[] = [];
  const vorher = zustand([text('a')], h);
  const nachher = zustand([{ ...text('a'), content: 'Neu' } as ConfigElement], h);
  assert.equal(istHandbearbeitung(vorher, nachher), true);
});

test('Farbe geändert: Handarbeit', () => {
  const h: unknown[] = [];
  assert.equal(istHandbearbeitung(zustand([text('a')], h), zustand([{ ...text('a'), color: '#ff0000' } as ConfigElement], h)), true);
});

test('ein Element wird still entfernt (Sync nach Produktwechsel, kein Verlaufspunkt): KEINE Handarbeit', () => {
  const h: unknown[] = [];
  assert.equal(istHandbearbeitung(zustand([text('a'), text('b')], h), zustand([text('a')], h)), false);
});

test('ein neues Element ohne Verlaufspunkt ist nicht automatisch erklärbar: Handarbeit', () => {
  const h: unknown[] = [];
  assert.equal(istHandbearbeitung(zustand([text('a')], h), zustand([text('a'), text('b')], h)), true);
});
