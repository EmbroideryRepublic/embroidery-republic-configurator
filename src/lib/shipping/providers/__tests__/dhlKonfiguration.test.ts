/**
 * Tests der DHL-Konfigurationsprüfung.
 *
 * Spiegel von stripeKonfiguration.test.ts/paypalKonfiguration.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  leseZugangsdaten,
  dhlKonfigurationsStand,
  istProduktivUmgebung,
  DhlKonfigurationFehlt,
} from '../dhlKonfiguration';

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

const OHNE = {
  DHL_API_KEY: undefined,
  DHL_USERNAME: undefined,
  DHL_PASSWORD: undefined,
  DHL_BILLING_NUMBER: undefined,
  DHL_ENV: undefined,
};

test('ohne Zugangsdaten wird klar benannt, was fehlt', () => {
  mitUmgebung(OHNE, () => {
    assert.throws(
      () => leseZugangsdaten(),
      (fehler: Error) => {
        assert.ok(fehler instanceof DhlKonfigurationFehlt);
        assert.match(fehler.message, /DHL_API_KEY/);
        assert.match(fehler.message, /DHL_USERNAME/);
        assert.match(fehler.message, /DHL_PASSWORD/);
        assert.match(fehler.message, /DHL_BILLING_NUMBER/);
        return true;
      }
    );
  });
});

test('einzelne fehlende Variable wird konkret benannt', () => {
  mitUmgebung(
    { DHL_API_KEY: 'key', DHL_USERNAME: 'user', DHL_PASSWORD: 'pass', DHL_BILLING_NUMBER: undefined },
    () => {
      assert.throws(() => leseZugangsdaten(), /DHL_BILLING_NUMBER/);
    }
  );
});

test('vollständige Zugangsdaten werden unverändert zurückgegeben', () => {
  mitUmgebung(
    { DHL_API_KEY: 'key', DHL_USERNAME: 'user', DHL_PASSWORD: 'pass', DHL_BILLING_NUMBER: '12345678901234' },
    () => {
      const zugang = leseZugangsdaten();
      assert.equal(zugang.apiKey, 'key');
      assert.equal(zugang.username, 'user');
      assert.equal(zugang.password, 'pass');
      assert.equal(zugang.billingNumber, '12345678901234');
    }
  );
});

test('DHL_ENV=production gilt als Produktivumgebung, alles andere als Sandbox', () => {
  mitUmgebung({ DHL_ENV: 'production' }, () => assert.equal(istProduktivUmgebung(), true));
  mitUmgebung({ DHL_ENV: 'sandbox' }, () => assert.equal(istProduktivUmgebung(), false));
  mitUmgebung({ DHL_ENV: undefined }, () => assert.equal(istProduktivUmgebung(), false, 'fehlender Wert darf NIE als production gelten'));
});

test('der Stand meldet fehlende Konfiguration ohne zu werfen', () => {
  mitUmgebung(OHNE, () => {
    const stand = dhlKonfigurationsStand();
    assert.equal(stand.versandMoeglich, false);
    assert.ok(stand.offeneSchritte.length > 0);
  });
});

test('vollständig eingerichtet meldet Versand als möglich', () => {
  mitUmgebung(
    { DHL_API_KEY: 'key', DHL_USERNAME: 'user', DHL_PASSWORD: 'pass', DHL_BILLING_NUMBER: '12345678901234' },
    () => {
      const stand = dhlKonfigurationsStand();
      assert.equal(stand.versandMoeglich, true);
      assert.deepEqual(stand.offeneSchritte, []);
    }
  );
});
