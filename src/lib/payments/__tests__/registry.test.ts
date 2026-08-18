/**
 * Test der PayPal-Sandbox-Absicherung (Go-Live-Prüfung 2026-08-17):
 * Sandbox-Zugangsdaten allein dürfen produktiv niemals als einsatzbereit
 * gelten – weder für waehleZahlungsAnbieter() noch für die reine
 * Anzeige-Frage istAnbieterFuerKundschaftVerfuegbar().
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waehleZahlungsAnbieter, istAnbieterFuerKundschaftVerfuegbar, ZahlungsAnbieterFehlt } from '../registry';

function mitUmgebung<T>(werte: Record<string, string | undefined>, fn: () => T): T {
  const vorher: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(werte)) {
    vorher[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(vorher)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const PAYPAL_SANDBOX_ZUGANG = {
  E2E_TESTMODUS: undefined,
  PAYPAL_CLIENT_ID: 'id-abc',
  PAYPAL_CLIENT_SECRET: 'secret-xyz',
  PAYPAL_ENV: 'sandbox',
};

test('PayPal mit Sandbox-Zugangsdaten gilt produktiv NICHT als einsatzbereit', () => {
  mitUmgebung(PAYPAL_SANDBOX_ZUGANG, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('paypal'), false);
    assert.throws(() => waehleZahlungsAnbieter('paypal'), ZahlungsAnbieterFehlt);
  });
});

test('PayPal ohne gesetztes PAYPAL_ENV gilt ebenfalls NICHT als einsatzbereit', () => {
  mitUmgebung({ ...PAYPAL_SANDBOX_ZUGANG, PAYPAL_ENV: undefined }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('paypal'), false);
  });
});

test('PayPal mit PAYPAL_ENV=live UND Zugangsdaten gilt als einsatzbereit', () => {
  mitUmgebung({ ...PAYPAL_SANDBOX_ZUGANG, PAYPAL_ENV: 'live' }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('paypal'), true);
  });
});

test('im Testmodus gilt PayPal immer als anzeigbar, unabhängig von PAYPAL_ENV', () => {
  mitUmgebung({ ...PAYPAL_SANDBOX_ZUGANG, E2E_TESTMODUS: 'aktiv' }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('paypal'), true);
  });
});
