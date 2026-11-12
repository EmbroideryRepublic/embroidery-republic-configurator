/**
 * Meta-Beschreibung der Produktübersicht: höchstens 160 Zeichen (sonst schneidet Google ab) und ehrlich zur pausierten Stickerei.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { PRODUCT_TYPE_ORDER, produktTypLabelPlural } from '@/config/products/types';
import { BESCHREIBUNG_MAX, listeMitUnd, shopBeschreibung } from '../shopBeschreibung';

const arten = PRODUCT_TYPE_ORDER.filter((t) => PRODUCTS.some((p) => p.productType === t)).map(produktTypLabelPlural);

test('mit dem echten Katalog (inkl. Kinderbekleidung): in beiden Zuständen höchstens 160 Zeichen', () => {
  for (const stickerei of [true, false]) {
    const text = shopBeschreibung(arten, stickerei);
    assert.ok(text.length <= BESCHREIBUNG_MAX, `${stickerei ? 'mit' : 'ohne'} Stickerei: ${text.length} Zeichen: ${text}`);
    assert.ok(text.length >= 70, 'nicht zu kurz für eine Beschreibung');
  }
});

test('pausierte Stickerei: nur DTF-Transferdruck im Text; verfügbar: beide Verfahren', () => {
  assert.ok(!/Stickerei/.test(shopBeschreibung(arten, false)));
  assert.match(shopBeschreibung(arten, false), /DTF-Transferdruck/);
  assert.match(shopBeschreibung(arten, true), /DTF-Transferdruck oder Stickerei/);
});

test('kurze Liste: der volle Satz mit „etablierter Marken“ bleibt', () => {
  assert.equal(
    shopBeschreibung(['T-Shirts', 'Hoodies'], false),
    'T-Shirts und Hoodies etablierter Marken – mit DTF-Transferdruck veredelt, ab 1 Stück.'
  );
});

test('lange Liste: „etablierter Marken“ entfällt, bevor gekürzt wird; absurd lange Listen werden am Wortende gekürzt', () => {
  const lang = ['T-Shirts', 'Polos', 'Hoodies', 'Zip-Hoodies', 'Sweater', 'Longsleeves', 'Jacken', 'Westen', 'Kinderbekleidung'];
  const text = shopBeschreibung(lang, true);
  assert.ok(text.length <= BESCHREIBUNG_MAX);
  assert.ok(!text.includes('etablierter Marken'));
  const riesig = Array.from({ length: 40 }, (_, i) => `Produktart${i}`);
  const gekuerzt = shopBeschreibung(riesig, true);
  assert.ok(gekuerzt.length <= BESCHREIBUNG_MAX);
  assert.ok(gekuerzt.endsWith('…'));
});

test('listeMitUnd', () => {
  assert.equal(listeMitUnd([]), 'Produkte');
  assert.equal(listeMitUnd(['A']), 'A');
  assert.equal(listeMitUnd(['A', 'B', 'C']), 'A, B und C');
});
