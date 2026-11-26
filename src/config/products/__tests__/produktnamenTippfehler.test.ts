/**
 * Wächter gegen Tippfehler aus Lieferantendaten, die in Titel, Überschrift und Beschreibung landen
 * (z. B. „T- Shirt“ mit Leerzeichen nach dem Bindestrich statt „T-Shirt“).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../index';

const VERBOTEN = /\b(?:T|V)- (?:Shirt|Neck|Ausschnitt)\b/i;

test('Produktnamen und -beschreibungen enthalten kein „T- Shirt“ / „V- Neck“ (Leerzeichen nach dem Bindestrich)', () => {
  const treffer: string[] = [];
  for (const p of PRODUCTS) {
    if (VERBOTEN.test(p.name)) treffer.push(`${p.id} (Name): ${p.name}`);
    if (p.description && VERBOTEN.test(p.description)) treffer.push(`${p.id} (Beschreibung)`);
  }
  assert.deepEqual(treffer, []);
});
