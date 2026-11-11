/**
 * ARCHITEKTURTEST für die sofortige Meldung an den Betreiber (Entscheidung des
 * Betreibers, 2026-11-08: „bei jeder eingehenden Bestellung unmittelbar
 * informiert werden“).
 *
 * Gleiche Teststrategie wie bestaetigungRetry.test.ts: reine Quelltext-Prüfung
 * statt Mocking des Supabase-Clients – etabliertes Muster für diese DB-nahen
 * Dateien. Die INHALTE der Mails prüft email/__tests__/betreiberBenachrichtigung.
 *
 * Gesichert werden die Stellen, an denen die Zusage am leichtesten unbemerkt
 * wieder verloren ginge: eine Verzögerung, die still wieder eingeführt wird, eine
 * Meldung, die bei Anfragen doppelt rausgeht, und eine Stornierung, bei der der
 * Betreiber eine bereits zugestellte Meldung nicht mehr berichtigt bekommt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS, STORNOFRIST_MS } from '@/config/orderProcess';

const INTAKE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderIntake.ts');
const SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');
const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');
const ORDERS = path.join(process.cwd(), 'src', 'lib', 'actions', 'orders.ts');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

test('die interne Meldung geht sofort raus – keine Verzögerung um die Stornofrist', () => {
  assert.equal(INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS, 0);
  // Die Stornofrist selbst bleibt unberührt (AGB § 8: zwei Stunden).
  assert.equal(STORNOFRIST_MS, 2 * 60 * 60 * 1000);
});

test('verarbeiteBestelleingang plant die Meldung nur noch bei einer Verzögerung größer 0 ein', () => {
  const rumpf = funktionsRumpf(INTAKE, 'verarbeiteBestelleingang');
  assert.match(rumpf, /INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS\s*>\s*0/, 'ohne diese Bedingung würde bei 0 ein Versand "für jetzt" eingeplant');
});

test('die Doppelschutz-Prüfung der internen Meldung gilt für Bestellungen UND Anfragen', () => {
  const rumpf = funktionsRumpf(INTAKE, 'verarbeiteBestelleingang');
  // Früher las nur der Bestellungs-Zweig den Marker: Eine wiederholte Absendung derselben
  // Anfrage hätte den Betreiber ein zweites Mal benachrichtigt.
  assert.match(rumpf, /const bereitsGeplant = Boolean\(meldungsstand\?\.internal_notification_email_id\)/);
  assert.doesNotMatch(rumpf, /if \(istBestellung\) \{\s*const \{ data \} = await db/);
});

test('die Nachweis-ID der Meldung wird für Anfragen genauso gespeichert wie für Bestellungen', () => {
  const rumpf = funktionsRumpf(INTAKE, 'verarbeiteBestelleingang');
  assert.doesNotMatch(rumpf, /intern\.value\.messageId && istBestellung/);
  assert.match(rumpf, /else if \(intern\.value\.messageId\)/);
  assert.match(rumpf, /internal_notification_email_id:\s*intern\.value\.messageId/);
});

test('der Wiederholungsweg holt Phase 2 für Anfragen nicht erneut nach, sobald die Meldung ausgelöst ist', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeAbschlussFuerRetryNach');
  assert.match(rumpf, /internal_notification_email_id\)\s*return/);
  assert.doesNotMatch(rumpf, /order_type/, 'darf nicht auf Bestellungen beschränkt sein – sonst gäbe es bei Anfragen Doppelmeldungen');
});

test('die Mail an den Betreiber bekommt die Download-Links der Originalmotive', () => {
  const rumpf = funktionsRumpf(INTAKE, 'verarbeiteBestelleingang');
  assert.match(rumpf, /ladeMotivLinks\(order\)/);
  assert.match(rumpf, /sendInternalOrderNotificationEmail\(order, productionSheetSignedUrl, geplantFuer, motivLinks\)/);
});

test('eine Selbststornierung informiert den Betreiber, sobald dessen Eingangsmeldung nicht mehr zurückziehbar ist', () => {
  const rumpf = funktionsRumpf(SERVICE, 'storniereBestellungDurchKunden');
  assert.match(rumpf, /sendInternalOrderCancelledEmail\(/);
  assert.match(
    rumpf,
    /if \(bestellung\.internal_notification_email_id && !meldungZurueckgezogen\)/,
    'nur wenn der Betreiber die Bestellung kennt UND die Meldung nicht widerrufen wurde'
  );
  // Der Widerruf einer noch geplanten Meldung bleibt für den Altbestand erhalten.
  assert.match(rumpf, /widerrufeGeplanteEmail\(/);
});

test('die Storno-Mail an den Betreiber folgt NACH dem Statuswechsel und ist nicht-fatal', () => {
  const rumpf = funktionsRumpf(SERVICE, 'storniereBestellungDurchKunden');
  const statuswechsel = rumpf.indexOf("status: 'cancelled'");
  const betreiberMail = rumpf.indexOf('sendInternalOrderCancelledEmail(');
  assert.ok(statuswechsel > 0 && betreiberMail > statuswechsel, 'erst stornieren, dann informieren');
  const tryStelle = rumpf.lastIndexOf('try {', betreiberMail);
  assert.ok(tryStelle > statuswechsel && tryStelle < betreiberMail, 'der Versand muss in einem try-Block stehen');
});

test('der Server prüft die Stickerei-Regel VOR jeder Preisberechnung und jedem Speichern', () => {
  const quelle = readFileSync(ORDERS, 'utf8');
  const kern = quelle.slice(quelle.indexOf('async function persistAndNotifyCore'));
  const pruefung = kern.indexOf('validateSubmission(');
  const preis = kern.indexOf('priceCart(');
  const speichern = kern.indexOf("supabase.rpc('create_order_atomic'");
  assert.ok(pruefung > 0 && pruefung < preis && preis < speichern, 'Reihenfolge: prüfen → berechnen → speichern');
  // submitOrder reicht den Auftrag als 'order' weiter – dort greift die Regel; submitInquiry bleibt offen für Stickerei.
  assert.match(quelle, /orderType: 'order'/);
  assert.match(quelle, /orderType: 'inquiry'/);
});

// ── Nachholweg im Cron-Lauf ──────────────────────────────────────────────

test('Die Cron-Route bindet den Nachholweg der Betreibermeldung nicht-fatal ein und meldet das Ergebnis', () => {
  const route = readFileSync(path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts'), 'utf8');
  assert.match(route, /holeOffeneBetreibermeldungenNach/);

  const aufruf = route.indexOf('holeOffeneBetreibermeldungenNach(');
  assert.ok(aufruf > 0, 'die Route muss den Nachholweg aufrufen');
  const tryStart = route.lastIndexOf('try {', aufruf);
  const catchEnde = route.indexOf('}', route.indexOf('catch', aufruf));
  assert.ok(tryStart > 0 && tryStart < aufruf, 'der Aufruf muss in einem try-Block stehen');
  assert.ok(catchEnde > aufruf, 'der Aufruf muss von einem catch-Block gefolgt sein – ein Fehler hier darf den Lauf nicht stoppen');
  assert.match(route, /betreibermeldungenNachgeholt,\s*\n\s*processed:/, 'das Ergebnis gehört in die Antwort des Laufs');
});

test('Der Nachholweg meldet nur Eingänge aus einem begrenzten Zeitfenster und lässt der regulären Meldung Vorsprung', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneBetreibermeldungenNach');
  assert.match(rumpf, /BETREIBERMELDUNG_NACHHOLEN_NACH_MINUTEN/);
  assert.match(rumpf, /BETREIBERMELDUNG_NACHHOLEN_BIS_STUNDEN/);
  assert.match(rumpf, /\.neq\('status', 'cancelled'\)/, 'eine stornierte Bestellung braucht keine Meldung');
  // Eine noch unbezahlte Karten-/PayPal-Bestellung wird erst nach der Zahlung gemeldet.
  assert.match(rumpf, /\.in\('payment_status', \['paid', 'not_required'\]\)/);
  // Im Zweifel nicht senden: Ein Lesefehler der Historie darf keine Doppelmeldung auslösen.
  assert.match(rumpf, /ereignisFehler[\s\S]{0,400}return \{ gefunden: 0/);
});
