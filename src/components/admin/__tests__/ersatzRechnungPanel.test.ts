/**
 * Absicherung der Oberfläche zur Ersatzrechnung (ErsatzRechnungPanel.tsx,
 * Anbindung in der Detailseite, Anzeige im Bestellverlauf). Wie bei den übrigen
 * Admin-Komponenten ohne Testing-Library: Quelltext-Prüfung der Eigenschaften,
 * an denen die Zusagen hängen – „neue Rechnung fehlt“ ist deutlich, die
 * Wiederholung läuft über eine Aktion, die selbst bestimmt, WAS zu ersetzen ist,
 * und beide PDFs sind abrufbar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const lies = (...teile: string[]) => readFileSync(path.join(process.cwd(), ...teile), 'utf8');

const PANEL = lies('src', 'components', 'admin', 'ErsatzRechnungPanel.tsx');
const SEITE = lies('src', 'app', 'admin', 'bestellung', '[id]', 'page.tsx');
const VERLAUF = lies('src', 'components', 'admin', 'BestellVerlauf.tsx');
const KONTROLLE = lies('src', 'components', 'admin', 'OrderEditControl.tsx');
const AKTIONEN = lies('src', 'lib', 'actions', 'orderEditActions.ts');

test('Fehlt die neue Rechnung, steht es deutlich da – mit der Schaltfläche zum erneuten Erzeugen', () => {
  assert.match(PANEL, /Neue Rechnung fehlt – bitte erneut erzeugen/);
  assert.match(PANEL, /Neue Rechnung erzeugen/);
  assert.match(PANEL, /erzeugeErsatzrechnungNeu\(orderId, mailSenden\)/);
  assert.match(PANEL, /border-red-300/, 'auffällige Darstellung bei fehlender Rechnung');
});

test('Der Browser nennt der Aktion keine Rechnungsnummer – was zu ersetzen ist, bestimmt der Server', () => {
  const aufruf = PANEL.slice(PANEL.indexOf('erzeugeErsatzrechnungNeu(orderId'), PANEL.indexOf('erzeugeErsatzrechnungNeu(orderId') + 60);
  assert.doesNotMatch(aufruf, /alteNummer|ausstehend/);
  const aktion = AKTIONEN.slice(AKTIONEN.indexOf('export async function erzeugeErsatzrechnungNeu'));
  assert.match(aktion, /erzeugeErsatzrechnungNeu\(orderId: string, mailSenden: boolean\)/, 'nur Bestellung und Mail-Wahl');
  assert.match(aktion, /erzeugeErsatzrechnungNach\(orderId, mailSenden\)/);
});

test('Ersetzte Rechnungen: „Rechnung X ersetzt Rechnung Y“ mit Download BEIDER PDFs', () => {
  assert.match(PANEL, /ersetzt Rechnung/);
  assert.match(PANEL, /PDF der neuen Rechnung/);
  assert.match(PANEL, /PDF der ersetzten Rechnung/);
  assert.match(PANEL, /pdfJeNummer\.get\(h\.neueNummer\)/);
  assert.match(PANEL, /pdfJeNummer\.get\(h\.alteNummer\)/);
});

test('Das Panel erscheint nur, wenn es etwas zu zeigen gibt', () => {
  assert.match(PANEL, /if \(!ausstehend && abgeschlossen\.length === 0 && !meldung\) return null;/);
});

test('Die Mail-Wahl der Wiederholung ist vorbelegt mit dem, was beim Speichern vorgesehen war, und nur mit Adresse möglich', () => {
  assert.match(PANEL, /useState\(Boolean\(ausstehend\?\.kundenmailVorgesehen\) && kundenEmailVorhanden\)/);
  assert.match(PANEL, /disabled=\{laeuft \|\| !kundenEmailVorhanden\}/);
});

test('Detailseite: Panel, abgeleiteter Stand und Download-Adressen sind angebunden', () => {
  assert.match(SEITE, /<ErsatzRechnungPanel/);
  assert.match(SEITE, /ermittleAusstehendeErsetzung\(/);
  assert.match(SEITE, /ausstehend=\{ausstehendeErsetzung\}/);
  assert.match(SEITE, /historie=\{order\.rechnungsHistorie\}/);
  assert.match(SEITE, /<BestellVerlauf events=\{order\.events\} rechnungsLinks=\{rechnungsLinks\} \/>/);
  // Bei einer stornierten Bestellung gibt es nichts mehr zu ersetzen.
  assert.match(SEITE, /order\.status === 'cancelled'\s*\?\s*null/);
});

test('Bestellverlauf: „Rechnung ersetzt“ trägt Links zu beiden PDFs, ein Fehlschlag ist rot', () => {
  assert.match(VERLAUF, /invoice_replaced: 'Rechnung ersetzt'/);
  assert.match(VERLAUF, /invoice_replacement_failed: 'Ersatzrechnung fehlgeschlagen'/);
  assert.match(VERLAUF, /PDF der neuen Rechnung \{ersetzt\.neu\}/);
  assert.match(VERLAUF, /PDF der ersetzten Rechnung \{ersetzt\.alt\}/);
  // *_failed wird bereits als Fehlschlag (rot) gedeutet.
  assert.match(VERLAUF, /eventType\.endsWith\('_failed'\)/);
  // Die alte „von Hand korrigieren“-Meldung erscheint nicht, wenn das System die Rechnung ersetzt.
  assert.match(VERLAUF, /ev\.detail\?\.rechnungErsatz !== 'automatisch'/);
});

test('Vorschau vor dem Speichern: Hinweis auf die neue Rechnung, abhängig von der Mail-Wahl', () => {
  assert.match(KONTROLLE, /vorschau\.rechnungErsatz === 'automatisch'/);
  assert.match(KONTROLLE, /Es wird eine neue Rechnung erzeugt und der Kundschaft mit dieser Mail als PDF geschickt\./);
  assert.match(KONTROLLE, /Mit abgewählter Mail geht sie NICHT an die Kundschaft – sie steht danach im Admin zum Download bereit\./);
});

test('Bei bezahlten Bestellungen bleibt die rote Erstattungs-Warnung bestehen (die Erstattung geschieht nicht automatisch)', () => {
  assert.match(KONTROLLE, /muss erstattet werden\. Das System erstattet nichts\s+automatisch/);
});

test('Nach dem Speichern erscheinen Hinweise und Probleme (u. a. „NEUE RECHNUNG FEHLT“) im Ergebnis', () => {
  assert.match(KONTROLLE, /\[r\.meldung, \.\.\.r\.ausgang\.hinweise, \.\.\.r\.ausgang\.probleme\]/);
});
