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

/**
 * Sicherheitsfund 2026-08-19: /api/webhooks/test war in JEDER Umgebung
 * erreichbar, weil istEinsatzbereit() für den Testanbieter ungated `true`
 * lieferte. Die Signatur des Testanbieters ist eine feste, im Quelltext
 * offene Konstante (testAnbieter.ts, TEST_SIGNATUR) – ohne diese Schranke
 * hätte jeder, der eine Bestellungs-ID und den Betrag kennt, sie im
 * Produktivbetrieb ohne echte Zahlung als bezahlt markieren können.
 *
 * Die Route wählt den Anbieter ausschließlich über waehleZahlungsAnbieter()
 * (src/app/api/webhooks/[anbieter]/route.ts) und wandelt ZahlungsAnbieterFehlt
 * VOR jedem Lesen des Bodys, jeder Signaturprüfung und jedem Aufruf von
 * verarbeiteZahlungsEreignis() in eine 404-Antwort um. Dass dieser Aufruf
 * hier wirft, ist deshalb der vollständige Beweis, dass eine Anfrage an
 * /api/webhooks/test im Produktivbetrieb niemals eine Bestellung als bezahlt
 * markieren oder eine Fulfillment-Kette auslösen kann.
 */
test('Testanbieter gilt im Produktivbetrieb NICHT als einsatzbereit – /api/webhooks/test bleibt dort wirkungslos', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, NODE_ENV: 'production' }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('test'), false);
    assert.throws(() => waehleZahlungsAnbieter('test'), ZahlungsAnbieterFehlt);
  });
});

test('Testanbieter bleibt außerhalb des Produktivbetriebs unverändert nutzbar', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, NODE_ENV: 'development' }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('test'), true);
    assert.equal(waehleZahlungsAnbieter('test').id, 'test');
  });
  mitUmgebung({ E2E_TESTMODUS: undefined, NODE_ENV: 'test' }, () => {
    assert.equal(istAnbieterFuerKundschaftVerfuegbar('test'), true);
    assert.equal(waehleZahlungsAnbieter('test').id, 'test');
  });
});
