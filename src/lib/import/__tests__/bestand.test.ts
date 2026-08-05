/**
 * WÄCHTER der „Bestand"-ImageSource (ADR 0006): liefert vorhandene echte Fotos
 * als Originale, überspringt Platzhalter.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { bestandImageSource, BESTAND_PRIORITAET } from '../sources/bestand';
import type { ImportProduktRef } from '../imageSource';

const PLATZHALTER = '/products/_platzhalter/platzhalter.webp';

const produkt: ImportProduktRef = {
  id: 'gildan-t',
  brand: 'Gildan',
  colors: [
    { id: 'navy', name: 'Navy', hex: '#001' },
    { id: 'red', name: 'Red', hex: '#f00' },
    { id: 'weiss', name: 'Weiß', hex: '#fff' },
  ],
};

const fakeResolver = (_productId: string, colorId: string): Record<string, string> => {
  if (colorId === 'navy') return { front: '/products/gildan-t-navy/front.webp', back: '/products/gildan-t-navy/back.webp' };
  if (colorId === 'red') return { front: '/products/gildan-t-red/front.webp' };
  return { front: PLATZHALTER }; // weiss: nur Platzhalter
};

test('Bestand liefert echte Fotos als Originale, überspringt Platzhalter', async () => {
  const refs = await bestandImageSource(fakeResolver).bilderFuer(produkt);
  // navy front+back + red front = 3; weiss (Platzhalter) übersprungen
  assert.equal(refs.length, 3);
  assert.ok(refs.every((r) => r.herkunft === 'original' && r.quelle === 'bestand'));
  assert.ok(refs.every((r) => r.prioritaet === BESTAND_PRIORITAET));
  assert.ok(!refs.some((r) => r.colorId === 'weiss'));
  const navyViews = refs.filter((r) => r.colorId === 'navy').map((r) => r.view).sort();
  assert.deepEqual(navyViews, ['back', 'front']);
});
