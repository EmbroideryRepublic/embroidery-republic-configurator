/**
 * Admin-Authentifizierung: Zentralität und Secret-Hygiene.
 *
 * Das Verhalten der Sitzungen (Ablauf, Widerruf, Parallelzugriff) wird gegen
 * die echte Datenbank geprüft: `npm run test:e2e:adminauth`.
 *
 * Hier geht es um das statisch Prüfbare – und das ist der Kern von H1: dass
 * das Secret nirgends mehr als Cookie oder Sitzungstoken auftaucht.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ADMIN_COOKIE_NAME, SITZUNGSDAUER_STUNDEN, isAdminConfigured } from '../auth';

const AUTH = join('src', 'lib', 'admin', 'auth.ts');

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

// ── Der Kern von H1 ──────────────────────────────────────────────────────

test('NUR auth.ts liest das Admin-Secret', () => {
  // Vorher stand `key !== process.env.ADMIN_SECRET` in der Server Action und
  // das Secret wanderte von dort direkt ins Cookie. Jede weitere Stelle, die
  // das Secret liest, ist eine neue Gelegenheit, es nach außen zu geben.
  const treffer: string[] = [];
  for (const datei of alleQuelldateien('src')) {
    if (datei.endsWith(AUTH)) continue;
    const inhalt = readFileSync(datei, 'utf8');
    // Nur echte Lesezugriffe zählen – die Erwähnung des Namens in einem
    // Hinweistext ist unbedenklich.
    if (/process\.env\.ADMIN_SECRET/.test(inhalt)) treffer.push(datei);
  }
  assert.deepEqual(
    treffer,
    [],
    'Das Admin-Secret darf ausschließlich in lib/admin/auth.ts gelesen werden. Gefunden in:\n  ' + treffer.join('\n  ')
  );
});

test('das Secret wird nirgends in ein Cookie geschrieben', () => {
  // Der eigentliche Fund aus dem Audit.
  for (const datei of alleQuelldateien('src')) {
    const inhalt = readFileSync(datei, 'utf8');
    assert.doesNotMatch(
      inhalt,
      // Deckt beide Schreibweisen ab: `cookies().set(` (bis Next 14) und
      // `(await cookies()).set(` (ab Next 15, asynchrone Request-APIs).
      /cookies\(\)\)?\.set\([\s\S]{0,200}ADMIN_SECRET/,
      `${datei}: Das Secret darf nie als Cookie gesetzt werden`
    );
  }
});

test('der Vergleich erfolgt zeitkonstant', () => {
  const inhalt = readFileSync(AUTH, 'utf8');
  assert.match(inhalt, /timingSafeEqual/, 'ein zeitkonstanter Vergleich muss verwendet werden');
  assert.doesNotMatch(
    inhalt,
    /===\s*process\.env\.ADMIN_SECRET|process\.env\.ADMIN_SECRET\s*===/,
    'kein direkter Gleichheitsvergleich mit dem Secret'
  );
});

test('gespeichert wird nur der Hash, nie der Token', () => {
  const inhalt = readFileSync(AUTH, 'utf8');
  assert.match(inhalt, /token_hash:\s*hashe\(token\)/, 'in die Datenbank geht der Hash');
  assert.doesNotMatch(inhalt, /token_hash:\s*token\b/, 'niemals der Klartext-Token');
});

test('der Token stammt aus dem kryptografischen Zufallsgenerator', () => {
  const inhalt = readFileSync(AUTH, 'utf8');
  assert.match(inhalt, /randomBytes\(32\)/, '32 Byte Zufall – nicht erratbar');
  assert.doesNotMatch(inhalt, /Math\.random/, 'Math.random ist für Sicherheitszwecke ungeeignet');
});

// ── Cookie-Einstellungen ─────────────────────────────────────────────────

test('das Cookie ist sicher eingestellt', () => {
  const inhalt = readFileSync(AUTH, 'utf8');
  assert.match(inhalt, /httpOnly:\s*true/, 'kein Zugriff aus JavaScript');
  assert.match(inhalt, /sameSite:\s*'lax'/, 'Schutz vor CSRF aus fremden Seiten');
  assert.match(inhalt, /secure:\s*process\.env\.NODE_ENV === 'production'/, 'in Produktion nur verschlüsselt');
  assert.match(inhalt, /path:\s*'\/'/, 'gilt für den gesamten Adminbereich');
});

test('der Cookie-Name verrät nichts über den Inhalt', () => {
  // Der alte Name lautete 'er_admin_key' – „key" legte nahe, dass dort ein
  // Schlüssel liegt. Genau das war das Problem.
  assert.equal(ADMIN_COOKIE_NAME, 'er_admin_session');
  assert.doesNotMatch(ADMIN_COOKIE_NAME, /key|secret/i);
});

test('die Sitzungsdauer ist begrenzt', () => {
  assert.ok(SITZUNGSDAUER_STUNDEN > 0 && SITZUNGSDAUER_STUNDEN <= 24, 'höchstens ein Tag');
});

// ── Session Fixation ─────────────────────────────────────────────────────

test('der Token entsteht erst NACH der Prüfung des Secrets', () => {
  // Die Voraussetzung für Session Fixation: Ein Angreifer könnte einen Token
  // vorgeben, den das Opfer dann benutzt. Da der Token erst nach
  // erfolgreicher Prüfung serverseitig erzeugt wird, fehlt sie strukturell.
  const inhalt = readFileSync(AUTH, 'utf8');
  const pruefung = inhalt.indexOf('gleichZeitkonstant(eingabe');
  const erzeugung = inhalt.indexOf('randomBytes(32)');
  assert.ok(pruefung > 0 && erzeugung > 0, 'beide Stellen müssen existieren');
  assert.ok(pruefung < erzeugung, 'erst prüfen, dann einen Token erzeugen');
});

// ── Abmelden ─────────────────────────────────────────────────────────────

test('das Abmelden widerruft serverseitig, nicht nur das Cookie', () => {
  // Ein bloßes Löschen des Cookies ließe eine kopierte Sitzung gültig.
  const inhalt = readFileSync(AUTH, 'utf8');
  const abmelden = inhalt.indexOf('export async function meldeAdminAb');
  const rest = inhalt.slice(abmelden, abmelden + 800);
  assert.match(rest, /widerrufen_am/, 'die Sitzung muss in der Datenbank widerrufen werden');
  // Beide Schreibweisen: `cookies().delete` (bis Next 14) und
  // `(await cookies()).delete` (ab Next 15).
  assert.match(rest, /cookies\(\)\)?\.delete/, 'und das Cookie entfernt werden');
});

test('ein Widerruf aller Sitzungen ist möglich, ohne das Secret zu ändern', () => {
  const inhalt = readFileSync(AUTH, 'utf8');
  assert.match(inhalt, /export async function beendeAlleAdminSitzungen/);
});

// ── Andere Secrets ───────────────────────────────────────────────────────

test('die Cron-Route nimmt das Secret nicht mehr als Query-Parameter', () => {
  // Query-Parameter landen in Zugriffsprotokollen, Browser-Historie und
  // Referer-Headern. Ein Secret gehört dort nicht hin.
  const inhalt = readFileSync(join('src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts'), 'utf8');
  assert.doesNotMatch(
    inhalt,
    /searchParams\.get\('secret'\)/,
    'das Secret darf nicht aus der Adresszeile gelesen werden'
  );
  assert.match(inhalt, /timingSafeEqual/, 'der Vergleich muss zeitkonstant erfolgen');
});

// ── Konfiguration ────────────────────────────────────────────────────────

test('ohne ausreichend langes Secret bleibt der Zugang zu', () => {
  const vorher = process.env.ADMIN_SECRET;
  try {
    delete process.env.ADMIN_SECRET;
    assert.equal(isAdminConfigured(), false, 'ohne Secret kein Zugang');

    process.env.ADMIN_SECRET = 'kurz';
    assert.equal(isAdminConfigured(), false, 'ein zu kurzes Secret zählt nicht');

    process.env.ADMIN_SECRET = 'a'.repeat(12);
    assert.equal(isAdminConfigured(), true, 'zwölf Zeichen genügen');
  } finally {
    if (vorher === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = vorher;
  }
});
