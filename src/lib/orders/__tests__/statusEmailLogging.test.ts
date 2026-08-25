/**
 * Regressionstest für den Fund vom 2026-08-25: `setzeBestellstatus()`
 * protokollierte nach jedem Status-Mail-Versand unbedingt `email_sent` in
 * order_events, ohne `sendEmail.ts`s eigenes `{success:false}`-Ergebnis zu
 * prüfen (sendEmail wirft nie, ein Resend-Fehlschlag kommt als Rückgabewert
 * zurück) – ein abgelehnter Versand sah in der Historie exakt wie ein
 * erfolgreicher aus. Die Fallunterscheidung existierte bereits korrekt für
 * die Bestellbestätigung (orderIntake.ts::protokolliereVersand, seit Vorfall
 * 2026-08-21) und lebt jetzt in orderService.ts, wiederverwendet von allen
 * vier Status-Mail-Stellen.
 *
 * Gleiche Teststrategie wie phasentrennung.test.ts/abschlussRetry.test.ts:
 * reine Quelltext-Prüfung statt Mocking des Supabase-Clients – etabliertes
 * Muster für diese DB-nahen Dateien in diesem Projekt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ORDER_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');
const ORDER_INTAKE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderIntake.ts');
const ORDER_COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

const SERVICE_QUELLTEXT = readFileSync(ORDER_SERVICE, 'utf8');

test('protokolliereVersand lebt in orderService.ts und prüft success, bevor "email_sent" geloggt wird', () => {
  const rumpf = funktionsRumpf(ORDER_SERVICE, 'protokolliereVersand');
  assert.match(rumpf, /ergebnis\.status === 'rejected'/, 'geworfene Ausnahmen müssen als email_failed erkannt werden');
  assert.match(
    rumpf,
    /!ergebnis\.value\.success/,
    'ein {success:false}-Rückgabewert (kein Wurf) muss ebenfalls als email_failed erkannt werden – ' +
      'genau diese Prüfung fehlte am 2026-08-25 in setzeBestellstatus()'
  );
  assert.match(rumpf, /eventType: 'email_failed'/, 'ein Fehlschlag muss email_failed loggen, nicht email_sent');
});

test('setzeBestellstatus nutzt protokolliereVersand für alle vier Status-Mails statt ungeprüft email_sent zu loggen', () => {
  const rumpf = funktionsRumpf(ORDER_SERVICE, 'setzeBestellstatus');

  for (const anlass of ['order_shipped', 'order_in_production', 'order_completed', 'order_cancelled']) {
    assert.match(
      rumpf,
      new RegExp(`protokolliereVersand\\(orderId, '${anlass}'`),
      `${anlass}: muss über protokolliereVersand laufen, damit ein Resend-Fehlschlag (success:false) ` +
        `als email_failed statt fälschlich als email_sent in der Historie landet`
    );
  }

  // Der alte, fehlerhafte Musterausdruck darf innerhalb von setzeBestellstatus
  // nicht mehr auftauchen – ein direktes protokolliereBestellereignis(...) mit
  // fest verdrahtetem eventType 'email_sent' würde den Bug wieder einführen.
  assert.doesNotMatch(
    rumpf,
    /eventType:\s*'email_sent'/,
    'setzeBestellstatus darf email_sent nicht mehr selbst direkt loggen – das übernimmt protokolliereVersand'
  );
});

test('setzeBestellstatus ist idempotent: ein Wiederholungsversuch auf denselben Zielstatus sendet keine zweite Mail', () => {
  const rumpf = funktionsRumpf(ORDER_SERVICE, 'setzeBestellstatus');
  const kurzschlussIndex = rumpf.indexOf('von === nach');
  assert.ok(kurzschlussIndex > 0, 'der von===nach-Kurzschluss muss existieren');
  const ersteMailStelle = rumpf.indexOf("protokolliereVersand(orderId, 'order_shipped'");
  assert.ok(
    kurzschlussIndex < ersteMailStelle,
    'der Kurzschluss für einen bereits erreichten Zielstatus muss VOR jedem Mail-Versand zurückkehren – ' +
      'sonst würde ein wiederholter Request (Doppelklick, erneuter Versuch nach Timeout) ein zweites Mal senden'
  );
});

test('setzeBestellstatus schreibt die DB-Änderung, bevor die Versandmail ausgelöst wird (Sendungsnummer muss bereits stehen)', () => {
  const rumpf = funktionsRumpf(ORDER_SERVICE, 'setzeBestellstatus');
  const updateIndex = rumpf.indexOf(".update(patch)");
  const mailIndex = rumpf.indexOf("nach === 'shipped' && bestellung.email");
  assert.ok(updateIndex > 0 && mailIndex > 0, 'beide Stellen müssen existieren');
  assert.ok(
    updateIndex < mailIndex,
    'die orders-UPDATE (inkl. tracking_number) muss vor der Versandmail stehen – sonst könnte eine Mail ' +
      'ausgelöst werden, bevor der Status/die Sendungsnummer tatsächlich gespeichert ist'
  );
  // Bei einem fehlgeschlagenen UPDATE (updateFehler) oder wenn keine Zeile
  // getroffen wurde (0 Zeilen), kehrt die Funktion vorher zurück – beides
  // liegt zwischen dem UPDATE und dem Mail-Block.
  const returnBeiFehler = rumpf.indexOf('return { ok: false, grund: \'fehler\'');
  assert.ok(updateIndex < returnBeiFehler && returnBeiFehler < mailIndex, 'ein UPDATE-Fehler muss vor dem Mail-Block abbrechen');
});

test('orderIntake.ts und orderCompletion.ts importieren protokolliereVersand aus orderService.ts (kein Zirkelimport)', () => {
  const intake = readFileSync(ORDER_INTAKE, 'utf8');
  assert.match(
    intake,
    /import \{ protokolliereBestellereignis, protokolliereVersand \} from '\.\/orderService'/,
    'orderIntake.ts importiert bereits protokolliereBestellereignis von orderService.ts – protokolliereVersand ' +
      'muss aus demselben Import kommen, sonst importiert orderService.ts (das Zustandsänderungen zentral hält) ' +
      'zurück aus orderIntake.ts und erzeugt einen Zirkelimport'
  );
  assert.doesNotMatch(intake, /export async function protokolliereVersand/, 'die Funktion darf nicht mehr HIER definiert sein');

  const completion = readFileSync(ORDER_COMPLETION, 'utf8');
  assert.match(completion, /protokolliereVersand/);
  assert.doesNotMatch(
    completion,
    /import \{[^}]*protokolliereVersand[^}]*\} from '\.\/orderIntake'/,
    'protokolliereVersand darf nicht mehr aus orderIntake.ts importiert werden'
  );
});

test('SERVICE_QUELLTEXT: protokolliereVersand wird nur einmal definiert', () => {
  const treffer = SERVICE_QUELLTEXT.match(/export async function protokolliereVersand/g) ?? [];
  assert.equal(treffer.length, 1, 'protokolliereVersand darf nicht dupliziert sein');
});
