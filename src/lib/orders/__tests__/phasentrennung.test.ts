/**
 * ARCHITEKTURTEST der Phasentrennung im Bestelleingang.
 *
 * Der Bestelleingang zerfällt seit S3 in zwei Phasen:
 *
 *   1. ANLEGEN     (lib/actions/orders.ts)      – prüfen, bepreisen, speichern
 *   2. ABSCHLIESSEN (lib/orders/orderCompletion) – rendern, PDF, benachrichtigen
 *
 * Diese Trennung ist die Voraussetzung dafür, dass Phase 2 später erst NACH
 * bestätigter Zahlung läuft. Sie hat aber eine unangenehme Eigenschaft: Sie
 * ist unsichtbar. Wenn jemand später „schnell noch" eine Mail oder ein
 * Rendering ins Anlegen zurückholt, funktioniert alles weiterhin – bis
 * Zahlungen aktiv sind und plötzlich Bestellbestätigungen für unbezahlte
 * Bestellungen hinausgehen.
 *
 * Deshalb wird die Trennung hier festgeschrieben statt nur dokumentiert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ORDERS_ACTION = path.join(process.cwd(), 'src', 'lib', 'actions', 'orders.ts');
const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');

function importe(datei: string): string[] {
  return readFileSync(datei, 'utf8')
    .split('\n')
    .map((z) => /^\s*import .*from '([^']+)'/.exec(z)?.[1])
    .filter((q): q is string => Boolean(q));
}

// ── Phase 1 enthält nichts aus Phase 2 ───────────────────────────────────

test('Das Anlegen rendert nicht und verschickt nichts', () => {
  // Diese Module gehören ausschließlich in Phase 2. Taucht eines davon
  // wieder im Anlegen auf, ist die Trennung gebrochen.
  const nurPhase2 = [
    '@/lib/rendering/renderPrintView',
    '@/lib/rendering/mapOrderElements',
    '@/lib/production/buildProductionSheet',
    '@/lib/orders/orderIntake',
    '@/lib/email/',
  ];

  const verstoesse = importe(ORDERS_ACTION).filter((quelle) =>
    nurPhase2.some((p) => quelle === p || quelle.startsWith(p))
  );

  assert.deepEqual(
    verstoesse,
    [],
    'Rendering, Produktionsblatt und Benachrichtigung gehören in orderCompletion.ts – ' +
      'sonst laufen sie später auch für unbezahlte Bestellungen'
  );
});

test('Das Anlegen stößt den Abschluss an genau einer Stelle an', () => {
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  const aufrufe = [...inhalt.matchAll(/\bschliesseBestellungAb\s*\(/g)];
  assert.equal(
    aufrufe.length,
    1,
    'Mehrere Aufrufe hießen mehrere Bestätigungsmails; keiner hieße, dass nichts abgeschlossen wird'
  );
});

// ── Phase 2 ist eigenständig ─────────────────────────────────────────────

test('Der Abschluss hängt nicht am Anlegen', () => {
  // Phase 2 darf nichts aus der Server-Action ziehen: Der Zahlungs-Webhook
  // wird sie später aufrufen, und der hat mit dem Bestellformular nichts zu
  // tun. Der reine Typ-Import ist ausdrücklich erlaubt.
  const verstoesse = importe(COMPLETION).filter(
    (quelle) => quelle.includes('actions/orders') && !quelle.endsWith('orderTypes')
  );
  assert.deepEqual(verstoesse, [], 'orderCompletion.ts muss unabhängig von der Server-Action aufrufbar bleiben');
});

test('Der Abschluss meldet Probleme, statt sie zu werfen', () => {
  // Zum Zeitpunkt des Aufrufs ist die Bestellung bereits gespeichert und
  // gilt als erfolgreich. Eine Ausnahme hier würde eine gültige Bestellung
  // nachträglich als gescheitert erscheinen lassen.
  const inhalt = readFileSync(COMPLETION, 'utf8');
  assert.match(inhalt, /probleme:\s*string\[\]/, 'AbschlussErgebnis muss die Probleme berichten');

  // Jeder der drei Schritte ist einzeln abgesichert.
  const catchBloecke = [...inhalt.matchAll(/\bcatch\s*\(/g)];
  assert.ok(
    catchBloecke.length >= 3,
    `Rendering, Produktionsblatt und Kommunikation brauchen je eigene Absicherung (gefunden: ${catchBloecke.length})`
  );
});

// ── Die Reihenfolge stimmt ───────────────────────────────────────────────

test('Der Abschluss wird erst nach der abgeschlossenen Transaktion angestoßen', () => {
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  const transaktion = inhalt.indexOf("rpc('create_order_atomic'");
  const abschluss = inhalt.indexOf('schliesseBestellungAb(');

  assert.ok(transaktion > 0, 'die Bestellung muss über die atomare Funktion entstehen');
  assert.ok(abschluss > 0, 'der Abschluss muss aufgerufen werden');
  assert.ok(
    transaktion < abschluss,
    'E-Mails und Rendering dürfen erst laufen, wenn die Bestellung vollständig gespeichert ist'
  );
});

test('Die Bestellung entsteht in genau EINER Transaktion, nicht in Einzelinserts', () => {
  // Der Kern von K1: Vorher waren es drei getrennte Inserts. Brach einer ab,
  // blieb ein Torso zurück – und die Idempotenz gab ihn als Erfolg aus.
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');

  for (const tabelle of ['orders', 'order_items', 'configuration_elements']) {
    assert.doesNotMatch(
      inhalt,
      new RegExp(`from\\('${tabelle}'\\)[\\s\\S]{0,80}\\.insert\\(`),
      `Direkter Insert in „${tabelle}" gefunden – die Bestellung muss atomar entstehen`
    );
  }
  assert.match(inhalt, /rpc\('create_order_atomic'/);
});

test('Die Dateien liegen VOR der Transaktion, nicht darin', () => {
  // Uploads sind externe, nicht zurückrollbare Wirkungen. Eine offene
  // Transaktion, die auf einen Netzwerkaufruf wartet, hält Sperren.
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  const uploads = inhalt.indexOf('buildItemRecords(');
  const transaktion = inhalt.indexOf("rpc('create_order_atomic'");

  assert.ok(uploads > 0 && transaktion > 0);
  assert.ok(uploads < transaktion, 'Die Logodateien müssen vor der Transaktion abgelegt sein');
});

test('Ein Ergebnis ohne Bestellkennung gilt nicht als Erfolg', () => {
  // Sonst würde eine nicht existierende Bestellung bestätigt.
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  assert.match(inhalt, /angelegt\?\.order_id/, 'das Ergebnis der Transaktion muss geprüft werden');
});

// ── Phase-2-Weiche: erst nach bestätigter Zahlung ────────────────────────

test('Phase 2 läuft bei Vorabzahlung NICHT im Bestellvorgang', () => {
  // Der Kern von Z1: Braucht die Zahlungsart eine Vorabzahlung, darf
  // schliesseBestellungAb() nicht sofort laufen – sonst würde für einen
  // abgebrochenen Bezahlvorgang produziert und bestätigt.
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  const weiche = inhalt.indexOf('brauchtVorabZahlung(');
  const abschluss = inhalt.indexOf('schliesseBestellungAb(');
  assert.ok(weiche > 0, 'die Weiche brauchtVorabZahlung muss existieren');
  assert.ok(abschluss > 0, 'der Abschluss muss aufgerufen werden');
  assert.ok(weiche < abschluss, 'die Weiche muss VOR dem Abschluss stehen');
  // Bei Vorabzahlung wird vor dem Abschluss zurückgekehrt.
  assert.match(
    inhalt,
    /if \(vorabZahlung\)[\s\S]{0,200}return \{ success: true, orderNumber \}/,
    'bei Vorabzahlung muss vor dem Abschluss zurückgekehrt werden'
  );
});

test('der Anfangs-Zahlungsstatus wird aus der Zahlungsart abgeleitet', () => {
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  assert.match(inhalt, /payment_status:.*anfangsZahlungsstatus/, 'payment_status muss abgeleitet gesetzt werden');
});

test('Phase 2 nach Zahlung läuft über den entkoppelten Anspruch', () => {
  // Z5: Der Webhook darf schliesseBestellungAb nicht direkt aufrufen, sonst
  // fehlt die Wiederanlauf-Sicherheit bei Zeitüberschreitung.
  const paymentService = readFileSync(
    path.join(process.cwd(), 'src', 'lib', 'orders', 'paymentService.ts'),
    'utf8'
  );
  assert.match(paymentService, /beanspruche_abschluss/, 'Phase 2 muss über den atomaren Anspruch laufen');
  assert.match(paymentService, /stelleAbschlussSicher/, 'die entkoppelte Abschlussfunktion muss existieren');
});
