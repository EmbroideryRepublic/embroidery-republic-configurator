/**
 * Textfarbe zur Textilfarbe: Standardfarbe nach Kontrast und Warnung bei kaum sichtbarem Text
 * (Stichprobentest 2026-11-10: schwarzer Text auf schwarzem Hoodie war unsichtbar).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { standardTextfarbe, textKaumSichtbar, kontrastverhaeltnis } from '../textfarbe';
import { PRODUCTS } from '@/config/products';

test('Auf dunklen Textilien wird der Text weiß, auf hellen schwarz', () => {
  assert.equal(standardTextfarbe('#1a1a1a'), '#ffffff', 'Schwarz');
  assert.equal(standardTextfarbe('#1b2a4a'), '#ffffff', 'Navy');
  assert.equal(standardTextfarbe('#a4222f'), '#ffffff', 'Rot');
  assert.equal(standardTextfarbe('#f5f5f5'), '#000000', 'Weiß');
  assert.equal(standardTextfarbe('#B7B7B7'), '#000000', 'Heather Grey');
  assert.equal(standardTextfarbe('#F2A6B4'), '#000000', 'Rosa');
});

test('Unbekannte oder fehlende Textilfarbe: Schwarz wie bisher, keine Warnung', () => {
  assert.equal(standardTextfarbe(undefined), '#000000');
  assert.equal(standardTextfarbe(null), '#000000');
  assert.equal(standardTextfarbe('nicht-eine-farbe'), '#000000');
  assert.equal(textKaumSichtbar('#000000', undefined), false);
  assert.equal(textKaumSichtbar('#000000', 'rot'), false);
  assert.equal(textKaumSichtbar(undefined, '#1a1a1a'), false);
});

test('Warnung: schwarzer Text auf schwarzem Textil, grauer Text auf grauem – nicht aber gut lesbarer Text', () => {
  assert.equal(textKaumSichtbar('#000000', '#1a1a1a'), true);
  assert.equal(textKaumSichtbar('#5c5c5c', '#7a7d80'), true, 'der Text aus der Bestellung ER-2026-F5EE03 auf Grau');
  assert.equal(textKaumSichtbar('#ffffff', '#1a1a1a'), false);
  assert.equal(textKaumSichtbar('#000000', '#f5f5f5'), false);
  assert.equal(textKaumSichtbar('#dc2626', '#1a1a1a'), false, 'Rot auf Schwarz ist erkennbar');
});

test('Kontrastverhältnis: Schwarz auf Weiß = 21, gleiche Farben = 1', () => {
  assert.ok(Math.abs(kontrastverhaeltnis('#000000', '#ffffff')! - 21) < 0.01);
  assert.equal(kontrastverhaeltnis('#336699', '#336699'), 1);
  assert.equal(kontrastverhaeltnis('#abc', '#aabbcc'), 1, 'Kurzschreibweise');
});

test('Für jede Textilfarbe im Sortiment ist die Standardfarbe sichtbar (kein Produkt mit unsichtbarem Standardtext)', () => {
  let geprueft = 0;
  const probleme: string[] = [];
  for (const produkt of PRODUCTS) {
    for (const farbe of produkt.colors) {
      geprueft++;
      const text = standardTextfarbe(farbe.hex);
      if (textKaumSichtbar(text, farbe.hex)) probleme.push(`${produkt.id}/${farbe.id} (${farbe.hex}) mit ${text}`);
    }
  }
  assert.ok(geprueft > 100, `nur ${geprueft} Farben geprüft`);
  assert.deepEqual(probleme, []);
});
