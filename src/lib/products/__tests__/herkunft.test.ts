/**
 * Herkunftsland-Anzeige: Platzhalter wie „k.A." dürfen nie als Zeile „Herkunft: k.A." auf der
 * Produktseite landen – aber jedes echte Land muss erhalten bleiben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { echteHerkunft } from '../herkunft';

test('echteHerkunft: echte Länder bleiben unverändert (getrimmt)', () => {
  assert.equal(echteHerkunft('Bangladesch'), 'Bangladesch');
  assert.equal(echteHerkunft('  Honduras/Nicaragua '), 'Honduras/Nicaragua');
});

test('echteHerkunft: leer, k.A. und Verwandte ergeben nichts', () => {
  for (const wert of ['', '   ', 'k.A.', 'K.A.', 'k. A.', 'ka', 'keine Angabe', 'n/a', 'N/A', 'unbekannt', '-', '–', undefined, null]) {
    assert.equal(echteHerkunft(wert as string | undefined | null), null, `„${String(wert)}" darf nicht angezeigt werden`);
  }
});

test('Katalog: jede im Katalog geführte Herkunft ist entweder echt oder wird ausgeblendet', () => {
  const werte = new Set(PRODUCTS.map((p) => p.detailedDescription?.countryOfOrigin).filter((w): w is string => !!w));
  for (const wert of werte) {
    const angezeigt = echteHerkunft(wert);
    assert.ok(angezeigt === null || !/^k\.?\s?a\.?$/i.test(angezeigt), `„${wert}" würde als Platzhalter angezeigt`);
  }
  // Mindestens ein echtes Land existiert, die Anzeige ist also nicht für alle Produkte tot.
  assert.ok([...werte].some((w) => echteHerkunft(w) !== null));
});
