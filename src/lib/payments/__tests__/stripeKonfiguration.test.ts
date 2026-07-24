/**
 * Tests der Stripe-Konfigurationsprüfung.
 *
 * Sie laufen, BEVOR das Stripe-SDK eingebunden ist – genau das ist der Sinn
 * der eigenen Datei: Die Einrichtung lässt sich absichern, ohne dass ein
 * Konto existiert.
 *
 * Kernaussage: kein stiller Ausweichweg. Fehlt etwas, wird es gesagt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  leseGeheimenSchluessel,
  leseWebhookSchluessel,
  stripeKonfigurationsStand,
  StripeKonfigurationFehlt,
} from '../providers/stripeKonfiguration';

/** Setzt die Umgebung für einen Fall und stellt sie danach wieder her. */
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

const OHNE = { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined };

// ── Fehlende Konfiguration ───────────────────────────────────────────────

test('ohne geheimen Schlüssel wird klar und mit Fundort gemeldet', () => {
  mitUmgebung(OHNE, () => {
    assert.throws(
      () => leseGeheimenSchluessel(),
      (fehler: Error) => {
        assert.ok(fehler instanceof StripeKonfigurationFehlt);
        assert.match(fehler.message, /STRIPE_SECRET_KEY/);
        assert.match(fehler.message, /sk_test_/, 'die Meldung muss sagen, wie der Wert aussieht');
        assert.match(fehler.message, /Dashboard|API-Schlüssel/, 'und wo er herkommt');
        return true;
      }
    );
  });
});

test('ohne Webhook-Schlüssel wird erklärt, dass er erst später entsteht', () => {
  // Das ist der Zustand direkt nach dem Anlegen des Kontos – kein Fehler
  // der Einrichtung, sondern ein Zwischenschritt. Die Meldung muss das sagen,
  // sonst sucht man nach etwas, das es noch gar nicht geben kann.
  mitUmgebung(OHNE, () => {
    assert.throws(
      () => leseWebhookSchluessel(),
      (fehler: Error) => {
        assert.match(fehler.message, /STRIPE_WEBHOOK_SECRET/);
        assert.match(fehler.message, /erst.*angelegt|Webhook-Endpunkt/i);
        assert.match(fehler.message, /whsec_/);
        return true;
      }
    );
  });
});

test('es gibt keinen Standardwert und keinen Ausweichweg', () => {
  mitUmgebung(OHNE, () => {
    // Beide MÜSSEN werfen. Ein Rückgabewert – gleich welcher – wäre hier
    // der gefährlichste Ausgang.
    assert.throws(() => leseGeheimenSchluessel());
    assert.throws(() => leseWebhookSchluessel());
  });
});

test('leere Zeichenketten zählen als „nicht gesetzt"', () => {
  mitUmgebung({ STRIPE_SECRET_KEY: '   ', STRIPE_WEBHOOK_SECRET: '' }, () => {
    assert.throws(() => leseGeheimenSchluessel());
    assert.throws(() => leseWebhookSchluessel());
  });
});

// ── Verwechslungen ───────────────────────────────────────────────────────

test('ein veröffentlichbarer Schlüssel an geheimer Stelle wird erkannt', () => {
  // Die häufigste Verwechslung überhaupt. Ohne Prüfung käme später eine
  // nichtssagende Fehlermeldung von Stripe.
  mitUmgebung({ STRIPE_SECRET_KEY: 'pk_test_abc123' }, () => {
    assert.throws(
      () => leseGeheimenSchluessel(),
      (fehler: Error) => {
        assert.match(fehler.message, /pk_/, 'die Meldung muss die Verwechslung benennen');
        return true;
      }
    );
  });
});

test('ein Wert, der nicht wie ein Signaturschlüssel aussieht, wird abgewiesen', () => {
  mitUmgebung({ STRIPE_WEBHOOK_SECRET: 'sk_test_abc' }, () => {
    assert.throws(() => leseWebhookSchluessel(), /whsec_/);
  });
});

// ── Gültige Konfiguration ────────────────────────────────────────────────

test('gültige Schlüssel werden unverändert zurückgegeben', () => {
  mitUmgebung({ STRIPE_SECRET_KEY: 'sk_test_abc', STRIPE_WEBHOOK_SECRET: 'whsec_xyz' }, () => {
    assert.equal(leseGeheimenSchluessel(), 'sk_test_abc');
    assert.equal(leseWebhookSchluessel(), 'whsec_xyz');
  });
});

test('Umgebungswerte werden von Leerzeichen befreit', () => {
  // Beim Kopieren aus dem Dashboard rutscht leicht ein Leerzeichen mit.
  mitUmgebung({ STRIPE_SECRET_KEY: '  sk_test_abc  ' }, () => {
    assert.equal(leseGeheimenSchluessel(), 'sk_test_abc');
  });
});

// ── Der gestaffelte Einrichtungsstand ────────────────────────────────────

test('der Stand meldet die Einrichtungsschritte in der richtigen Reihenfolge', () => {
  mitUmgebung(OHNE, () => {
    const stand = stripeKonfigurationsStand();
    assert.equal(stand.zahlungenMoeglich, false);
    assert.equal(stand.ereignisseMoeglich, false);
    assert.equal(stand.offeneSchritte.length, 2);
    assert.match(stand.offeneSchritte[0]!, /STRIPE_SECRET_KEY/, 'zuerst der geheime Schlüssel');
    assert.match(stand.offeneSchritte[1]!, /Webhook/, 'danach der Webhook');
  });
});

test('nur mit geheimem Schlüssel sind Zahlungen möglich, Ereignisse noch nicht', () => {
  // GENAU dieser Zwischenzustand entsteht bei der Einrichtung: Konto
  // angelegt, Webhook noch nicht. Zahlungen müssen bereits eröffnet werden
  // können – sonst lässt sich der Endpunkt gar nicht erst erproben.
  mitUmgebung({ STRIPE_SECRET_KEY: 'sk_test_abc', STRIPE_WEBHOOK_SECRET: undefined }, () => {
    const stand = stripeKonfigurationsStand();
    assert.equal(stand.zahlungenMoeglich, true);
    assert.equal(stand.ereignisseMoeglich, false);
    assert.equal(stand.offeneSchritte.length, 1);
    assert.match(stand.offeneSchritte[0]!, /Webhook/);
  });
});

test('vollständig eingerichtet meldet keine offenen Schritte', () => {
  mitUmgebung({ STRIPE_SECRET_KEY: 'sk_test_abc', STRIPE_WEBHOOK_SECRET: 'whsec_xyz' }, () => {
    const stand = stripeKonfigurationsStand();
    assert.equal(stand.zahlungenMoeglich, true);
    assert.equal(stand.ereignisseMoeglich, true);
    assert.deepEqual(stand.offeneSchritte, []);
    assert.equal(stand.produktivSchluessel, false);
  });
});

test('ein Schlüssel des Produktivbetriebs wird als solcher erkannt', () => {
  // Damit lässt sich verhindern, dass Testläufe echtes Geld bewegen.
  mitUmgebung({ STRIPE_SECRET_KEY: 'sk_live_abc' }, () => {
    assert.equal(stripeKonfigurationsStand().produktivSchluessel, true);
  });
});

// ── Geheimnisse ──────────────────────────────────────────────────────────

test('keine Fehlermeldung enthält jemals einen Schlüsselwert', () => {
  // Protokolle landen in Dateien, Fehlerdiensten und Kopien davon.
  const geheim = 'sk_test_STRENGGEHEIM123';
  const webhook = 'whsec_AUCHGEHEIM456';

  mitUmgebung({ STRIPE_SECRET_KEY: 'pk_falsch', STRIPE_WEBHOOK_SECRET: geheim }, () => {
    for (const aufruf of [leseGeheimenSchluessel, leseWebhookSchluessel]) {
      try {
        aufruf();
      } catch (fehler) {
        const text = (fehler as Error).message;
        assert.ok(!text.includes(geheim), 'Schlüsselwert steht in der Meldung');
        assert.ok(!text.includes(webhook), 'Schlüsselwert steht in der Meldung');
        assert.ok(!text.includes('STRENGGEHEIM'), 'Teil des Schlüssels steht in der Meldung');
      }
    }
  });
});
