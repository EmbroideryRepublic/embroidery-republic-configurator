/**
 * Tests der Versandkostenberechnung (config/shipping.ts).
 *
 * Kernaussagen: Tarife greifen je Zone korrekt, die Freigrenzen sind exakt
 * (>= statt >), und für Länder OHNE hinterlegten Tarif gibt es KEINEN
 * 0-€-Fallback – sie liefern null und müssen vom Aufrufer abgelehnt werden.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateShipping, shippingZoneForCountry, SHIPPING_COUNTRIES, SHIPPING_RATES } from '../shipping';

test('Deutschland: 6,90 € unter der Freigrenze', () => {
  const r = calculateShipping('Deutschland', 50);
  assert.ok(r);
  assert.equal(r.zone, 'DE');
  assert.equal(r.cost, 6.9);
  assert.equal(r.isFree, false);
  assert.equal(r.amountUntilFree, 25);
});

test('Deutschland: ab genau 75 € versandkostenfrei (Grenze inklusive)', () => {
  const exact = calculateShipping('Deutschland', 75);
  assert.ok(exact);
  assert.equal(exact.cost, 0);
  assert.equal(exact.isFree, true);
  assert.equal(exact.amountUntilFree, 0);

  const below = calculateShipping('Deutschland', 74.99);
  assert.ok(below);
  assert.equal(below.cost, 6.9, 'einen Cent darunter ist noch kostenpflichtig');
});

test('EU-Land: 11,99 € und Freigrenze 100 €', () => {
  const at = calculateShipping('Österreich', 60);
  assert.ok(at);
  assert.equal(at.zone, 'EU');
  assert.equal(at.cost, 11.99);
  assert.equal(at.amountUntilFree, 40);

  const free = calculateShipping('Österreich', 100);
  assert.ok(free);
  assert.equal(free.cost, 0);
  assert.equal(free.isFree, true);
});

test('EU-Freigrenze gilt NICHT schon ab der DE-Grenze', () => {
  const r = calculateShipping('Frankreich', 80);
  assert.ok(r);
  assert.equal(r.cost, 11.99, '80 € liegt über 75 (DE), aber unter 100 (EU)');
});

test('Land ohne Tarif liefert null – kein stiller 0-€-Versand', () => {
  assert.equal(calculateShipping('Schweiz', 200), null);
  assert.equal(calculateShipping('USA', 500), null);
  assert.equal(calculateShipping('', 100), null);
  assert.equal(calculateShipping(undefined, 100), null);
});

test('Länderzuordnung ist case-insensitiv und tolerant gegenüber Leerzeichen', () => {
  assert.equal(shippingZoneForCountry('  deutschland '), 'DE');
  assert.equal(shippingZoneForCountry('ÖSTERREICH'), 'EU');
  assert.equal(shippingZoneForCountry('Schweiz'), null);
});

test('jedes auswählbare Land hat einen definierten Tarif', () => {
  assert.ok(SHIPPING_COUNTRIES.length > 1);
  for (const c of SHIPPING_COUNTRIES) {
    const r = calculateShipping(c.name, 0);
    assert.ok(r, `kein Tarif für ${c.name}`);
    assert.equal(r.baseCost, SHIPPING_RATES[c.zone].cost);
    assert.equal(r.freeFrom, SHIPPING_RATES[c.zone].freeFrom);
  }
});

test('negative oder unsinnige Warenwerte werden wie 0 behandelt', () => {
  const r = calculateShipping('Deutschland', -50);
  assert.ok(r);
  assert.equal(r.cost, 6.9);
  assert.equal(r.amountUntilFree, 75);
});
