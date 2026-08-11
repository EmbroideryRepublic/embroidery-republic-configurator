/**
 * Tests der PayPal-Konfigurationsprüfung.
 *
 * Spiegel von stripeKonfiguration.test.ts. Kernaussage unverändert: kein
 * stiller Ausweichweg, fehlt etwas, wird es gesagt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  leseClientZugangsdaten,
  leseWebhookId,
  paypalKonfigurationsStand,
  istProduktivUmgebung,
  PaypalKonfigurationFehlt,
} from '../providers/paypalKonfiguration';

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
  PAYPAL_CLIENT_ID: undefined,
  PAYPAL_CLIENT_SECRET: undefined,
  PAYPAL_WEBHOOK_ID: undefined,
  PAYPAL_ENV: undefined,
};

test('ohne Client-Zugangsdaten wird klar und mit Fundort gemeldet', () => {
  mitUmgebung(OHNE, () => {
    assert.throws(
      () => leseClientZugangsdaten(),
      (fehler: Error) => {
        assert.ok(fehler instanceof PaypalKonfigurationFehlt);
        assert.match(fehler.message, /PAYPAL_CLIENT_ID/);
        assert.match(fehler.message, /PAYPAL_CLIENT_SECRET/);
        assert.match(fehler.message, /Developer Dashboard/);
        return true;
      }
    );
  });
});

test('nur eine der beiden Client-Variablen genügt nicht', () => {
  mitUmgebung({ ...OHNE, PAYPAL_CLIENT_ID: 'abc' }, () => {
    assert.throws(() => leseClientZugangsdaten());
  });
});

test('ohne Webhook-ID wird erklärt, dass sie erst später entsteht', () => {
  mitUmgebung(OHNE, () => {
    assert.throws(
      () => leseWebhookId(),
      (fehler: Error) => {
        assert.match(fehler.message, /PAYPAL_WEBHOOK_ID/);
        assert.match(fehler.message, /Webhook-Endpunkt/);
        return true;
      }
    );
  });
});

test('gültige Zugangsdaten werden unverändert zurückgegeben', () => {
  mitUmgebung({ PAYPAL_CLIENT_ID: 'id-abc', PAYPAL_CLIENT_SECRET: 'secret-xyz' }, () => {
    const zugang = leseClientZugangsdaten();
    assert.equal(zugang.clientId, 'id-abc');
    assert.equal(zugang.clientSecret, 'secret-xyz');
  });
});

test('PAYPAL_ENV=live gilt als Produktivumgebung, alles andere als Sandbox', () => {
  mitUmgebung({ PAYPAL_ENV: 'live' }, () => {
    assert.equal(istProduktivUmgebung(), true);
  });
  mitUmgebung({ PAYPAL_ENV: 'sandbox' }, () => {
    assert.equal(istProduktivUmgebung(), false);
  });
  mitUmgebung({ PAYPAL_ENV: undefined }, () => {
    assert.equal(istProduktivUmgebung(), false, 'fehlender Wert darf NIE als live gelten');
  });
  mitUmgebung({ PAYPAL_ENV: 'LIVE' }, () => {
    assert.equal(istProduktivUmgebung(), false, 'nur der exakte Wert "live" zählt, kein Ausweichweg über Groß-/Kleinschreibung');
  });
});

test('der Stand meldet die Einrichtungsschritte in der richtigen Reihenfolge', () => {
  mitUmgebung(OHNE, () => {
    const stand = paypalKonfigurationsStand();
    assert.equal(stand.zahlungenMoeglich, false);
    assert.equal(stand.ereignisseMoeglich, false);
    assert.equal(stand.offeneSchritte.length, 2);
    assert.match(stand.offeneSchritte[0]!, /PAYPAL_CLIENT_ID/);
    assert.match(stand.offeneSchritte[1]!, /Webhook/);
  });
});

test('vollständig eingerichtet meldet keine offenen Schritte', () => {
  mitUmgebung(
    { PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_WEBHOOK_ID: 'wh-1' },
    () => {
      const stand = paypalKonfigurationsStand();
      assert.equal(stand.zahlungenMoeglich, true);
      assert.equal(stand.ereignisseMoeglich, true);
      assert.deepEqual(stand.offeneSchritte, []);
    }
  );
});

test('keine Fehlermeldung enthält jemals einen Geheimniswert', () => {
  const geheim = 'STRENGGEHEIM123';
  mitUmgebung({ PAYPAL_CLIENT_ID: undefined, PAYPAL_CLIENT_SECRET: geheim }, () => {
    try {
      leseClientZugangsdaten();
    } catch (fehler) {
      assert.ok(!(fehler as Error).message.includes(geheim));
    }
  });
});
