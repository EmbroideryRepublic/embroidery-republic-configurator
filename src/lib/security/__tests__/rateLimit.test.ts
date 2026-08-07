/**
 * Rate-Limit: Konfiguration und Zentralität.
 *
 * Das Verhalten des Zählers selbst wird gegen die echte Datenbank geprüft
 * (`npm run test:e2e:ratelimit`) – Atomarität bei parallelen Anfragen lässt
 * sich mit einem nachgebauten Zähler nicht zeigen.
 *
 * Hier geht es um das, was statisch prüfbar ist: die Konfiguration und die
 * Zusage, dass es nur EINE Rate-Limit-Infrastruktur im Projekt gibt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RATE_LIMITS } from '../../../config/rateLimits';
import { kuerzeIp } from '../rateLimit';

// ── Konfiguration ────────────────────────────────────────────────────────

test('alle Limits sind vollständig und plausibel', () => {
  for (const [name, limit] of Object.entries(RATE_LIMITS)) {
    assert.ok(limit.id.length > 0, `${name}: keine Kennung`);
    assert.ok(limit.max > 0, `${name}: Limit muss positiv sein`);
    assert.ok(limit.fensterSekunden > 0, `${name}: Fenster muss positiv sein`);
    assert.ok(
      limit.begruendung.length > 40,
      `${name}: Ohne Begründung wird der Wert später blind verändert`
    );
  }
});

test('die Kennungen sind eindeutig', () => {
  const ids = Object.values(RATE_LIMITS).map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte Kennung – Zähler würden sich vermischen');
});

test('der Admin-Login ist am strengsten begrenzt', () => {
  // Das lohnendste Ziel: Wer das Secret errät, sieht alle Kundendaten.
  const login = RATE_LIMITS.adminLogin;
  const proStunde = (login.max * 3600) / login.fensterSekunden;
  assert.ok(proStunde <= 20, `${proStunde} Versuche je Stunde sind zu viele für ein Rateziel`);
  assert.ok(login.max >= 3, 'ein Betreiber darf sich zwei-, dreimal vertippen');
});

test('die Bestellung ist großzügig genug für Firmen hinter einer NAT-Adresse', () => {
  // Zu eng gesetzt sperrt es ein ganzes Büro aus.
  assert.ok(RATE_LIMITS.bestellung.max >= 10, 'zu eng für mehrere Personen an einer Adresse');
  assert.equal(RATE_LIMITS.bestellung.merkmal, 'ip');
});

test('Endpunkte mit besserem Merkmal nutzen es auch', () => {
  // Wo eine E-Mail oder ein Token vorliegt, darf nicht allein die Adresse
  // zählen – sonst trifft es alle hinter derselben NAT gemeinsam.
  assert.equal(RATE_LIMITS.kontakt.merkmal, 'ip_und_merkmal');
  assert.equal(RATE_LIMITS.stornierung.merkmal, 'ip_und_merkmal');
});

test('die Anfrage darf großzügiger sein als die Bestellung', () => {
  // Kein Zahlungsvorgang, geringerer Aufwand je Vorgang.
  assert.ok(RATE_LIMITS.anfrage.max >= RATE_LIMITS.bestellung.max);
});

// ── Adressen im Protokoll ────────────────────────────────────────────────

test('Adressen werden fürs Protokoll gekürzt', () => {
  // Eine vollständige IP-Adresse ist ein personenbezogenes Datum und hat in
  // einem dauerhaften Protokoll nichts zu suchen.
  assert.equal(kuerzeIp('203.0.113.42'), '203.0.113.x');
  assert.match(kuerzeIp('2001:db8:85a3:1234:5678:8a2e:370:7334'), /^2001:db8:85a3:…$/);
  assert.equal(kuerzeIp('unbekannt'), 'unbekannt');
});

// ── Wächter: nur EINE Infrastruktur ──────────────────────────────────────

function alleQuelldateien(verzeichnis: string, gesammelt: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      if (eintrag !== 'node_modules' && eintrag !== '__tests__') alleQuelldateien(pfad, gesammelt);
    } else if (/\.tsx?$/.test(eintrag)) {
      gesammelt.push(pfad);
    }
  }
  return gesammelt;
}

test('es gibt keinen zweiten Rate-Limit-Zähler im Projekt', () => {
  // Genau das war der Zustand vor dem 2026-07-22: ein Zähler in contact.ts,
  // im Prozessspeicher, wirkungslos – und sonst nirgends einer.
  const verdaechtig = [
    { muster: /new Map<[^>]*>\(\)[\s\S]{0,200}rate.?limit/i, was: 'eigener Zähler im Speicher' },
    { muster: /recentSubmissions/, was: 'Rest des alten In-Memory-Limits' },
    { muster: /RATE_LIMIT_WINDOW_MS|RATE_LIMIT_MAX\b/, was: 'eigene Limit-Konstanten' },
    { muster: /function\s+isRateLimited/, was: 'eigene Limit-Funktion' },
  ];
  const erlaubt = [join('src', 'lib', 'security', 'rateLimit.ts'), join('src', 'config', 'rateLimits.ts')];

  const treffer: string[] = [];
  for (const datei of alleQuelldateien('src')) {
    if (erlaubt.some((e) => datei.endsWith(e))) continue;
    const inhalt = readFileSync(datei, 'utf8');
    for (const { muster, was } of verdaechtig) {
      if (muster.test(inhalt)) treffer.push(`${datei}: ${was}`);
    }
  }

  assert.deepEqual(
    treffer,
    [],
    'Rate-Limits gehören ausschließlich in lib/security/rateLimit.ts:\n  ' + treffer.join('\n  ')
  );
});

test('alle schreibenden Endpunkte nutzen die zentrale Prüfung', () => {
  // Jede Server Action, die etwas anlegt oder ein Geheimnis prüft, muss
  // begrenzt sein. Fehlt hier eine, ist sie ungeschützt.
  const pflicht = [
    { datei: join('src', 'lib', 'actions', 'orders.ts'), was: 'Bestellung und Anfrage' },
    { datei: join('src', 'lib', 'actions', 'contact.ts'), was: 'Kontaktformular' },
    { datei: join('src', 'lib', 'actions', 'admin.ts'), was: 'Admin-Login' },
    { datei: join('src', 'lib', 'actions', 'orderCancellation.ts'), was: 'Stornierung' },
    { datei: join('src', 'lib', 'actions', 'konto.ts'), was: 'Konto: Adressbuch, Profil, E-Mail, Passwort' },
  ];
  for (const { datei, was } of pflicht) {
    const inhalt = readFileSync(datei, 'utf8');
    assert.match(inhalt, /pruefeRateLimit\(/, `${was} (${datei}) ist nicht begrenzt`);
  }
});

test('der Admin-Login prüft das Limit VOR der Anmeldung', () => {
  // Sonst zählt nur der erfolgreiche Versuch – und Raten bliebe unbegrenzt.
  // Der Secret-Vergleich selbst liegt seit dem 2026-07-22 zentral in
  // lib/admin/auth.ts (meldeAdminAn), nicht mehr in der Action.
  const inhalt = readFileSync(join('src', 'lib', 'actions', 'admin.ts'), 'utf8');
  const limit = inhalt.indexOf("pruefeRateLimit('adminLogin')");
  const anmeldung = inhalt.indexOf('meldeAdminAn(');
  assert.ok(limit > 0, 'das Limit muss geprüft werden');
  assert.ok(anmeldung > 0, 'die Anmeldung muss über meldeAdminAn laufen');
  assert.ok(limit < anmeldung, 'die Begrenzung muss vor der Anmeldung greifen');
});
