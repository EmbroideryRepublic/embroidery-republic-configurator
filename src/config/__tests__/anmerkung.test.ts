/**
 * Anmerkung der Kundschaft: Bereinigung und Grenze (config/anmerkung.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANMERKUNG_MAX_ZEICHEN, bereinigeAnmerkung } from '../anmerkung';

test('Grenze: 1000 Zeichen', () => {
  assert.equal(ANMERKUNG_MAX_ZEICHEN, 1000);
});

test('kein Text → undefined (nichts eingegeben)', () => {
  for (const wert of [undefined, null, 42, true, {}, [], '', '   ', '\n\n\t \n']) {
    assert.equal(bereinigeAnmerkung(wert), undefined, `Eingang ${JSON.stringify(wert)}`);
  }
});

test('normaler Text bleibt unverändert, außen wird getrimmt', () => {
  assert.equal(bereinigeAnmerkung('Bitte bis Freitag liefern.'), 'Bitte bis Freitag liefern.');
  assert.equal(bereinigeAnmerkung('  Hallo  '), 'Hallo');
  assert.equal(bereinigeAnmerkung('Größe „XL“ – bitte 10 € Rabatt 😊'), 'Größe „XL“ – bitte 10 € Rabatt 😊');
});

test('Zeilenumbrüche werden vereinheitlicht, mehr als eine Leerzeile wird zu einer', () => {
  assert.equal(bereinigeAnmerkung('a\r\nb\rc'), 'a\nb\nc');
  assert.equal(bereinigeAnmerkung('a\n\n\n\n\nb'), 'a\n\nb');
  assert.equal(bereinigeAnmerkung('Zeile 1\nZeile 2'), 'Zeile 1\nZeile 2');
});

test('Steuerzeichen fliegen raus, Tabulator und Zeilenumbruch bleiben', () => {
  assert.equal(bereinigeAnmerkung('a\u0000b\u0007c\u001Bd\u007Fe'), 'abcde');
  assert.equal(bereinigeAnmerkung('a\tb'), 'a\tb');
});

test('zu lange Texte werden NICHT gekürzt (sie sollen abgelehnt werden)', () => {
  const lang = 'x'.repeat(ANMERKUNG_MAX_ZEICHEN + 50);
  assert.equal(bereinigeAnmerkung(lang), lang);
});

test('HTML und Skript bleiben Text (die Ausgabe escaped; hier wird nichts umgebaut)', () => {
  assert.equal(bereinigeAnmerkung('<script>alert(1)</script>'), '<script>alert(1)</script>');
});
