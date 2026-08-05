/**
 * WÄCHTER für den Katalog-Index (getProduct / PRODUCT_BY_ID).
 *
 * Seit M2.5 löst getProduct O(1) über eine Map (PRODUCT_BY_ID) auf statt über
 * PRODUCTS.find. Das ändert die Semantik bei DOPPELTEN IDs: `new Map(entries)`
 * behält den LETZTEN Träger, `find` den ERSTEN. Bei einer Import-Kollision
 * verschwände der erste Träger STILL aus allen getProduct-Pfaden (Konfigurator,
 * Produktseite, Bestellung). Die Eindeutigkeit war bisher nur inzident über den
 * Slug-Test (productPage.test.ts) gedeckt; koppelt man die Slug-Ableitung ab,
 * fiele der Schutz lautlos weg. Diese Tests sichern den Vertrag direkt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, getProduct } from '@/config/products';

test('Produkt-IDs sind katalogweit eindeutig', () => {
  const ids = PRODUCTS.map((p) => p.id);
  const doppelte = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(doppelte)], [], `doppelte Produkt-IDs: ${[...new Set(doppelte)].join(', ')}`);
  assert.equal(new Set(ids).size, ids.length);
});

test('getProduct liefert je ID exakt dieselbe Objektreferenz', () => {
  for (const p of PRODUCTS) {
    assert.equal(getProduct(p.id), p, `getProduct('${p.id}') liefert nicht das Katalogobjekt`);
  }
});

test('getProduct liefert undefined für unbekannte IDs (kein Wurf)', () => {
  assert.equal(getProduct('gibt-es-nicht'), undefined);
});
