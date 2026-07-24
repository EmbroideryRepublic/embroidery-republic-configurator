/**
 * Prüfungen der E-Mail-Adressen und des Testmodus.
 *
 * Dieser Bereich hatte bisher keine Tests, entscheidet aber über zwei Dinge,
 * die im Betrieb teuer sind:
 *
 *   1. Geht überhaupt eine Mail hinaus? Ein leerer Absender oder ein
 *      fehlender Schlüssel darf nicht zu einer stillen Fehlkonfiguration
 *      führen.
 *   2. Gehen Mails versehentlich an ECHTE Kundschaft? Der Testmodus ist die
 *      Bremse davor – sein sicherer Standardwert ist deshalb selbst eine
 *      Zusicherung, die geprüft gehört.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANY } from '@/config/company';
import {
  getFromAddress,
  getInternalNotificationAddress,
  getReplyToAddress,
  getResendClient,
} from '../resendClient';
import { isTestMode } from '../sendEmail';

/** Setzt Umgebungsvariablen für einen Fall und stellt sie danach wieder her. */
function mitUmgebung(werte: Record<string, string | undefined>, fn: () => void) {
  const vorher: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(werte)) {
    vorher[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(vorher)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ── Absender ──────────────────────────────────────────────────────────

test('gesetzte Absenderadresse wird verwendet', () => {
  mitUmgebung({ RESEND_FROM_EMAIL: 'shop@example.test' }, () => {
    assert.equal(getFromAddress(), 'shop@example.test');
  });
});

test('ohne Absenderadresse greift die Firmenadresse', () => {
  mitUmgebung({ RESEND_FROM_EMAIL: undefined }, () => {
    assert.equal(getFromAddress(), COMPANY.email);
  });
});

test('ein leerer Absender zählt als nicht gesetzt', () => {
  // Ein Leerstring in der Umgebung ist ein häufiger Konfigurationsfehler.
  // Würde er durchgereicht, lehnte Resend den Versand ab – ohne dass
  // irgendwo ersichtlich wäre, warum.
  for (const leer of ['', '   ']) {
    mitUmgebung({ RESEND_FROM_EMAIL: leer }, () => {
      assert.equal(getFromAddress(), COMPANY.email, `bei ${JSON.stringify(leer)}`);
    });
  }
});

// ── Interne Adresse und Antwortadresse ────────────────────────────────

test('interne Benachrichtigung fällt auf die Firmenadresse zurück', () => {
  mitUmgebung({ INTERNAL_NOTIFICATION_EMAIL: undefined }, () => {
    assert.equal(getInternalNotificationAddress(), COMPANY.email);
  });
});

test('Antwortadresse folgt der internen Adresse, wenn sie nicht gesetzt ist', () => {
  mitUmgebung(
    { EMAIL_REPLY_TO: undefined, INTERNAL_NOTIFICATION_EMAIL: 'buero@example.test' },
    () => {
      assert.equal(getReplyToAddress(), 'buero@example.test');
    }
  );
});

test('eine eigene Antwortadresse hat Vorrang', () => {
  mitUmgebung(
    { EMAIL_REPLY_TO: 'antwort@example.test', INTERNAL_NOTIFICATION_EMAIL: 'buero@example.test' },
    () => {
      assert.equal(getReplyToAddress(), 'antwort@example.test');
    }
  );
});

// ── Client ────────────────────────────────────────────────────────────

test('ohne API-Schlüssel entsteht kein Client (Versand wird übersprungen, kein Absturz)', () => {
  mitUmgebung({ RESEND_API_KEY: undefined }, () => {
    assert.equal(getResendClient(), null);
  });
});

test('ein leerer API-Schlüssel zählt als fehlend', () => {
  mitUmgebung({ RESEND_API_KEY: '   ' }, () => {
    assert.equal(getResendClient(), null);
  });
});

// ── Testmodus: die Bremse vor echtem Kundenversand ────────────────────

test('der Testmodus ist standardmäßig AN', () => {
  mitUmgebung({ EMAIL_TEST_MODE: undefined }, () => {
    assert.equal(isTestMode(), true, 'ohne Angabe muss der sichere Weg gelten');
  });
});

test('nur exakt "false" schaltet den Testmodus ab', () => {
  mitUmgebung({ EMAIL_TEST_MODE: 'false' }, () => {
    assert.equal(isTestMode(), false);
  });
});

test('Tippfehler dürfen den Testmodus NICHT abschalten', () => {
  // Genau hier wäre der Schaden groß: „FALSE", „0" oder „nein" sollen nicht
  // versehentlich echten Versand an Kundschaft freigeben.
  for (const wert of ['FALSE', 'False', '0', 'nein', 'no', 'off', '']) {
    mitUmgebung({ EMAIL_TEST_MODE: wert }, () => {
      assert.equal(isTestMode(), true, `bei EMAIL_TEST_MODE=${JSON.stringify(wert)}`);
    });
  }
});
