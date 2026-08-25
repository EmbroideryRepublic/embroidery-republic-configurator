/**
 * ARCHITEKTURTEST für den Bestellbestätigungs-Retry (Vorfall 2026-08-21,
 * Migration 0030).
 *
 * Gleiche Teststrategie wie rechnungRetry.test.ts/abschlussRetry.test.ts:
 * reine Quelltext-Prüfung statt Mocking des Supabase-Clients – etabliertes
 * Muster für diese DB-nahen Dateien in diesem Projekt.
 *
 * Deckt die drei Dinge ab, die bei diesem Nachhol-Mechanismus am leichtesten
 * unbemerkt auseinanderlaufen: die Auswahlbedingung (muss exakt der von
 * `beanspruche_bestellbestaetigung` entsprechen), die Entkopplung der
 * Kundenbestätigung von der internen-Meldungs-Idempotenz (der eigentliche
 * Bug hinter dem Vorfall), und die nicht-fatale Einbindung in die Cron-Route.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const INTAKE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderIntake.ts');
const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');
const CRON_ROUTE = path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
const CLAIM_MIGRATION = path.join(process.cwd(), 'supabase', 'migrations', '0030_bestellbestaetigung_retry.sql');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

// ── Der eigentliche Bug: Kunden-Idempotenz darf nicht an der internen
//    Meldung hängen ──────────────────────────────────────────────────────

test('die Kundenbestätigung wird über einen EIGENEN Claim versendet, nicht über internal_notification_email_id', () => {
  const rumpf = funktionsRumpf(INTAKE, 'versucheBestellbestaetigung');
  assert.match(rumpf, /beanspruche_bestellbestaetigung/, 'muss den eigenen atomaren Claim verwenden');
  assert.match(
    rumpf,
    /order_confirmation_sent_at:\s*new Date\(\)\.toISOString\(\)/,
    'ein erfolgreicher Versand muss den eigenen Erfolgsnachweis setzen'
  );
  assert.match(rumpf, /gib_bestellbestaetigung_frei/, 'ein Fehlschlag muss den Anspruch wieder freigeben');
});

test('verarbeiteBestelleingang versucht die Kundenbestätigung UNABHÄNGIG davon, ob die interne Meldung bereits geplant ist', () => {
  const rumpf = funktionsRumpf(INTAKE, 'verarbeiteBestelleingang');

  // Der Vorfall: die alte Fassung kehrte VOR jedem Versand zurück, sobald
  // internal_notification_email_id bereits gesetzt war – schlug nur die
  // Kundenbestätigung fehl, blieb sie dadurch für immer ohne Retry.
  assert.doesNotMatch(
    rumpf,
    /if\s*\(bereitsGeplant\)\s*\{\s*console\.info\([^)]*\);\s*return;/,
    'ein früher return bei bereitsGeplant darf die Kundenbestätigung nicht mehr überspringen'
  );

  // versucheBestellbestaetigung muss für Bestellungen tatsächlich aufgerufen
  // werden, und zwar außerhalb einer bereitsGeplant-Bedingung.
  const versuchStelle = rumpf.indexOf('versucheBestellbestaetigung(order)');
  assert.ok(versuchStelle > 0, 'versucheBestellbestaetigung muss aufgerufen werden');
  const bereitsGeplantIfs = [...rumpf.matchAll(/if\s*\(bereitsGeplant\)/g)].map((m) => m.index ?? -1);
  for (const ifStelle of bereitsGeplantIfs) {
    // Kein bereitsGeplant-Zweig darf den Kundenbestätigungs-Aufruf umschließen
    // UND zugleich vor ihm liegen und ihn per return/frühe Auswertung
    // verhindern – die einzig sichere Prüfung hier: der Aufruf darf nicht
    // TEXTUELL innerhalb eines bereitsGeplant-Blocks stehen, der early-returnt.
    assert.ok(
      !(ifStelle < versuchStelle && rumpf.slice(ifStelle, versuchStelle).includes('return;')),
      'ein bereitsGeplant-Zweig vor dem Kundenbestätigungs-Aufruf darf nicht per return aussteigen'
    );
  }
});

test('holeOffeneBestellbestaetigungenNach wählt exakt die Bedingung von beanspruche_bestellbestaetigung', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneBestellbestaetigungenNach');

  assert.match(rumpf, /\.eq\('order_type', 'order'\)/);
  assert.match(rumpf, /\.is\('order_confirmation_sent_at', null\)/);
  assert.match(rumpf, /\.is\('order_confirmation_versuch_gestartet_am', null\)/);
  assert.match(rumpf, /versucheBestellbestaetigung\(/, 'muss den claim-geschützten Versuch aufrufen');

  const migration = readFileSync(CLAIM_MIGRATION, 'utf8');
  assert.match(
    migration,
    /and order_type = 'order'\s*\n\s*and order_confirmation_sent_at is null\s*\n\s*and order_confirmation_versuch_gestartet_am is null/,
    'die Referenzbedingung in Migration 0030 hat sich geändert – die Auswahl oben muss synchron bleiben'
  );
});

test('holeOffeneBestellbestaetigungenNach ruft ausschließlich den Bestätigungs-Schritt auf, nicht die gesamte Phase 2', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneBestellbestaetigungenNach');
  assert.doesNotMatch(
    rumpf,
    /\bschliesseBestellungAb\(/,
    'darf nicht die gesamte Phase 2 (Druckvorschauen/Produktionsblatt/Rechnung) erneut anstoßen'
  );
});

test('ein abgelehnter Versand protokolliert die tatsächliche Fehlermeldung, nicht nur den Anlass', () => {
  const inhalt = readFileSync(INTAKE, 'utf8');
  // Zwei email_failed-Stellen existieren (rejected-Zweig und
  // success:false-Zweig) – die zweite ist die relevante: sendEmail wirft nie,
  // ein abgelehnter Versand meldet sich fast immer über success:false.
  const ersteStelle = inhalt.indexOf("eventType: 'email_failed'");
  const stelle = inhalt.indexOf("eventType: 'email_failed'", ersteStelle + 1);
  assert.ok(stelle > 0);
  const block = inhalt.slice(stelle, stelle + 300);
  assert.match(
    block,
    /fehler:\s*ergebnis\.value\.error/,
    'die Resend-Fehlermeldung muss in order_events.detail landen, sonst ist ein Fehlschlag nur über ' +
      'ephemere Server-Logs nachvollziehbar (Vorfall 2026-08-21)'
  );
});

test('Die Cron-Route bindet den Bestätigungs-Retry nicht-fatal ein', () => {
  const inhalt = readFileSync(CRON_ROUTE, 'utf8');
  assert.match(inhalt, /import \{ holeOffeneBestellbestaetigungenNach \} from '@\/lib\/orders\/orderCompletion'/);

  const aufruf = inhalt.indexOf('holeOffeneBestellbestaetigungenNach(');
  assert.ok(aufruf > 0, 'die Route muss holeOffeneBestellbestaetigungenNach aufrufen');

  const tryStart = inhalt.lastIndexOf('try {', aufruf);
  const catchEnde = inhalt.indexOf('}', inhalt.indexOf('catch', aufruf));
  assert.ok(tryStart > 0 && tryStart < aufruf, 'der Aufruf muss in einem try-Block stehen');
  assert.ok(catchEnde > aufruf, 'der Aufruf muss von einem catch-Block gefolgt sein');

  assert.match(inhalt, /gib_haengende_bestellbestaetigungen_frei/, 'der Reaper muss in raeumeAuf() eingebunden sein');
});

test('log.ts serialisiert Fehlerobjekte ohne Error-Prototyp (Resend/Supabase) korrekt', () => {
  const inhalt = readFileSync(path.join(process.cwd(), 'src', 'lib', 'observability', 'log.ts'), 'utf8');
  assert.match(
    inhalt,
    /function nachrichtVon/,
    'ohne diese Funktion serialisieren Nicht-Error-Objekte (Resend ErrorResponse, Supabase PostgrestError) ' +
      'zu "[object Object]" – die eigentliche Meldung geht verloren (Vorfall 2026-08-21)'
  );
  assert.match(inhalt, /zeile\.fehler\s*=\s*bereinige\(nachrichtVon\(f\)\)/);
});
