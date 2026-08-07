/**
 * Tests der Versandkostenberechnung (config/shipping.ts).
 *
 * Kernaussagen: Tarife greifen je Zone korrekt, die Freigrenzen sind exakt
 * (>= statt >), und für Länder OHNE hinterlegten Tarif gibt es KEINEN
 * 0-€-Fallback – sie liefern null und müssen vom Aufrufer abgelehnt werden.
 *
 * Seit der Entscheidung vom 2026-08-06 ist NUR Deutschland auswählbar (siehe
 * Kommentar in shipping.ts) – die EU-Rate bleibt im Code definiert, aber
 * kein Land verweist mehr darauf. Frühere Tests gegen „Österreich" etc.
 * prüften damit ein Angebot, das es aktuell nicht mehr gibt; sie sind durch
 * die Tests unten ersetzt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateShipping,
  shippingZoneForCountry,
  landCodeForCountry,
  SHIPPING_COUNTRIES,
  SHIPPING_RATES,
} from '../shipping';

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

test('EU-Rate bleibt definiert, auch ohne auswählbares EU-Land (Wiedereröffnung = ein Eintrag)', () => {
  assert.equal(SHIPPING_RATES.EU.cost, 11.99);
  assert.equal(SHIPPING_RATES.EU.freeFrom, 100);
});

test('EU-Länder sind aktuell NICHT auswählbar – Steuersatz ist nur für DE verifiziert (Entscheidung 2026-08-06)', () => {
  assert.equal(calculateShipping('Österreich', 60), null);
  assert.equal(calculateShipping('Frankreich', 80), null);
  assert.equal(shippingZoneForCountry('ÖSTERREICH'), null);
});

test('Land ohne Tarif liefert null – kein stiller 0-€-Versand', () => {
  assert.equal(calculateShipping('Schweiz', 200), null);
  assert.equal(calculateShipping('USA', 500), null);
  assert.equal(calculateShipping('Österreich', 200), null);
  assert.equal(calculateShipping('', 100), null);
  assert.equal(calculateShipping(undefined, 100), null);
});

test('Länderzuordnung ist case-insensitiv und tolerant gegenüber Leerzeichen', () => {
  assert.equal(shippingZoneForCountry('  deutschland '), 'DE');
  assert.equal(shippingZoneForCountry('DEUTSCHLAND'), 'DE');
  assert.equal(shippingZoneForCountry('Schweiz'), null);
});

test('jedes auswählbare Land hat einen definierten Tarif UND einen ISO-Code', () => {
  assert.ok(SHIPPING_COUNTRIES.length >= 1);
  for (const c of SHIPPING_COUNTRIES) {
    const r = calculateShipping(c.name, 0);
    assert.ok(r, `kein Tarif für ${c.name}`);
    assert.equal(r.baseCost, SHIPPING_RATES[c.zone].cost);
    assert.equal(r.freeFrom, SHIPPING_RATES[c.zone].freeFrom);
    assert.match(c.code, /^[A-Z]{2}$/, `${c.name} braucht einen zweistelligen ISO-Code`);
  }
});

test('aktuell ist ausschließlich Deutschland lieferbar', () => {
  assert.deepEqual(
    SHIPPING_COUNTRIES.map((c) => c.name),
    ['Deutschland']
  );
});

// ── landCodeForCountry: das Bindeglied zum Steuersatz ─────────────────────

test('landCodeForCountry löst den Klartextnamen auf den ISO-Code auf', () => {
  assert.equal(landCodeForCountry('Deutschland'), 'DE');
  assert.equal(landCodeForCountry('  deutschland '), 'DE');
  assert.equal(landCodeForCountry('DEUTSCHLAND'), 'DE');
});

test('landCodeForCountry liefert null für unbekannte oder nicht (mehr) geführte Länder', () => {
  assert.equal(landCodeForCountry('Österreich'), null);
  assert.equal(landCodeForCountry('Schweiz'), null);
  assert.equal(landCodeForCountry(''), null);
  assert.equal(landCodeForCountry(undefined), null);
});

test('negative oder unsinnige Warenwerte werden wie 0 behandelt', () => {
  const r = calculateShipping('Deutschland', -50);
  assert.ok(r);
  assert.equal(r.cost, 6.9);
  assert.equal(r.amountUntilFree, 75);
});
