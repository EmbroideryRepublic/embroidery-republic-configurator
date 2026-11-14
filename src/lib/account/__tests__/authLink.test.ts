/**
 * Konto-E-Mail-Links: Aufbau, Einlösen und die Zeitgrenze der Sitzung, die ein
 * neues Passwort ohne das alte setzen darf.
 *
 * Hintergrund (2026-11-14): Der Supabase-„action_link" landete in Produktion
 * auf der Hauptseite statt im Konto (Redirect-Allowlist vergleicht exakt inkl.
 * Query; Sitzung im URL-Fragment statt als `code`). Die Tests halten fest, was
 * den Ersatzweg ausmacht – und dass die Passwortprüfung dabei nicht weicher
 * wird.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LINK_SITZUNG_MAX_ALTER_SEKUNDEN,
  baueKontoLink,
  istFrischeLinkSitzung,
  istGueltigerTokenHash,
  otpTypFuer,
} from '../authLink';

const HASH = 'a3f9c2d1e8b7465f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7081';
const JETZT = 1_800_000_000;

test('baueKontoLink: zeigt auf die eigene Callback-Route, nicht auf Supabase', () => {
  const link = baueKontoLink('https://www.ergermany.de', 'registrierung', HASH);
  const url = new URL(link);
  assert.equal(url.origin, 'https://www.ergermany.de');
  assert.equal(url.pathname, '/auth/callback');
  assert.equal(url.searchParams.get('typ'), 'registrierung');
  assert.equal(url.searchParams.get('token_hash'), HASH);
  assert.equal(url.searchParams.get('newsletter'), null);
  assert.ok(!link.includes('supabase.co'), 'kein Supabase-Verify-Link');
});

test('baueKontoLink: Newsletter-Absicht nur bei Registrierung und nur auf Wunsch', () => {
  const mit = new URL(baueKontoLink('https://www.ergermany.de', 'registrierung', HASH, { newsletter: true }));
  assert.equal(mit.searchParams.get('newsletter'), '1');
  const ohne = new URL(baueKontoLink('https://www.ergermany.de', 'registrierung', HASH, { newsletter: false }));
  assert.equal(ohne.searchParams.get('newsletter'), null);
  const reset = new URL(baueKontoLink('https://www.ergermany.de', 'zuruecksetzen', HASH, { newsletter: true }));
  assert.equal(reset.searchParams.get('newsletter'), null, 'ein Passwort-Reset aktiviert nie einen Newsletter');
  assert.equal(reset.searchParams.get('typ'), 'zuruecksetzen');
});

test('baueKontoLink: abschließender Schrägstrich der Basis wird nicht doppelt', () => {
  assert.ok(baueKontoLink('https://www.ergermany.de/', 'registrierung', HASH).startsWith('https://www.ergermany.de/auth/callback?'));
});

test('otpTypFuer: nur die zwei bekannten Typen, alles andere null', () => {
  assert.equal(otpTypFuer('registrierung'), 'signup');
  assert.equal(otpTypFuer('zuruecksetzen'), 'recovery');
  for (const unbekannt of [null, undefined, '', 'signup', 'recovery', 'admin', 'REGISTRIERUNG']) {
    assert.equal(otpTypFuer(unbekannt), null, String(unbekannt));
  }
});

test('istGueltigerTokenHash: Form wird geprüft, Müll abgewiesen', () => {
  assert.equal(istGueltigerTokenHash(HASH), true);
  for (const schlecht of [null, undefined, '', 'kurz', 'a'.repeat(15), 'a'.repeat(257), `${HASH}&x=1`, `${HASH} `, '../etc/passwd-aaaaaaaa']) {
    assert.equal(istGueltigerTokenHash(schlecht), false, String(schlecht));
  }
});

test('istFrischeLinkSitzung: frisch eingelöster E-Mail-Link (otp) zählt', () => {
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT - 60 }], JETZT), true);
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT - LINK_SITZUNG_MAX_ALTER_SEKUNDEN }], JETZT), true, 'genau an der Grenze');
});

test('istFrischeLinkSitzung: ein älterer otp-Nachweis zählt NICHT mehr', () => {
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT - LINK_SITZUNG_MAX_ALTER_SEKUNDEN - 1 }], JETZT), false);
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT - 7 * 24 * 3600 }], JETZT), false, 'eine Woche alte Sitzung');
});

test('istFrischeLinkSitzung: nichts aus der Zukunft, ohne Zeitstempel kein otp', () => {
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT + 3600 }], JETZT), false);
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: JETZT + 30 }], JETZT), true, 'kleine Uhrenabweichung ist ok');
  assert.equal(istFrischeLinkSitzung([{ method: 'otp' }], JETZT), false);
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: 'jetzt' }], JETZT), false);
  assert.equal(istFrischeLinkSitzung([{ method: 'otp', timestamp: Number.NaN }], JETZT), false);
  assert.equal(istFrischeLinkSitzung(['otp'], JETZT), false, 'otp als blanker Text trägt keinen Zeitstempel');
});

test('istFrischeLinkSitzung: PKCE-Recovery (recovery) bleibt anerkannt', () => {
  assert.equal(istFrischeLinkSitzung([{ method: 'recovery', timestamp: JETZT - 10 }], JETZT), true);
  assert.equal(istFrischeLinkSitzung(['recovery'], JETZT), true);
});

test('istFrischeLinkSitzung: normale Anmeldung per Passwort darf NIE ohne das alte Passwort ändern', () => {
  assert.equal(istFrischeLinkSitzung([{ method: 'password', timestamp: JETZT - 5 }], JETZT), false);
  assert.equal(istFrischeLinkSitzung(['password'], JETZT), false);
  assert.equal(istFrischeLinkSitzung([{ method: 'oauth', timestamp: JETZT }], JETZT), false);
});

test('istFrischeLinkSitzung: Unklares und Kaputtes fällt auf false (fail-closed)', () => {
  for (const kaputt of [undefined, null, 'otp', 42, {}, [], [null], [undefined], [42], [{}], [{ method: null }]]) {
    assert.equal(istFrischeLinkSitzung(kaputt, JETZT), false, JSON.stringify(kaputt));
  }
});

test('istFrischeLinkSitzung: Passwort + frischer Link in einer Sitzung → der Link zählt (amr ist eine Liste)', () => {
  assert.equal(
    istFrischeLinkSitzung(
      [
        { method: 'password', timestamp: JETZT - 99_999 },
        { method: 'otp', timestamp: JETZT - 20 },
      ],
      JETZT
    ),
    true
  );
});

// ── Quelltext-Wächter: der Ersatzweg darf nicht stillschweigend zurückgebaut werden ──

const wurzel = join(__dirname, '..', '..', '..', '..');
const lies = (rel: string) => readFileSync(join(wurzel, rel), 'utf8');

test('konto.ts: E-Mail-Links werden aus dem hashed_token gebaut, nicht aus Supabases action_link', () => {
  const quelle = lies('src/lib/actions/konto.ts');
  assert.match(quelle, /hashed_token/);
  assert.match(quelle, /baueKontoLink\(kanonischeBasisUrl\(\), 'registrierung'/);
  assert.match(quelle, /baueKontoLink\(kanonischeBasisUrl\(\), 'zuruecksetzen'/);
  // Code ohne Kommentare prüfen – im Kommentar wird der action_link bewusst erklärt.
  const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\.action_link/, 'kein Verweis mehr auf properties.action_link');
  assert.doesNotMatch(code, /redirectTo/, 'kein redirectTo mehr: die Allowlist darf nicht gebraucht werden');
});

test('Callback-Route: löst das Einmal-Token serverseitig mit verifyOtp ein und speichert nichts zwischen', () => {
  const quelle = lies('src/app/auth/callback/route.ts');
  assert.match(quelle, /verifyOtp\(\{ type: otpTyp, token_hash: tokenHash \}\)/);
  assert.match(quelle, /otpTypFuer\(searchParams\.get\('typ'\)\)/, 'der OTP-Typ kommt nur aus typ, nie aus einem eigenen Parameter');
  assert.match(quelle, /istGueltigerTokenHash/);
  assert.match(quelle, /'Cache-Control', 'no-store'/);
  assert.match(quelle, /link-ungueltig/);
});

test('session.ts: Recovery-Prüfung läuft über die getestete Funktion (kein Rückfall auf „recovery" allein)', () => {
  const quelle = lies('src/lib/account/session.ts');
  assert.match(quelle, /istFrischeLinkSitzung\(data\.claims\.amr/);
});
