/**
 * Absicherung der Oberfläche „Auftrag bearbeiten“.
 *
 * Wie bei den übrigen Admin-Komponenten (siehe bestellVerlauf.test.ts): Es gibt
 * in diesem Projekt kein Testing-Library-Setup für Komponenten. Deshalb wird
 * (1) die reine Eingabelogik direkt geprüft (orderEditEingabe.ts, ohne React) und
 * (2) der Quelltext der Komponente auf die Eigenschaften, an denen die
 * Sicherheit des Ablaufs hängt: erst Vorschau, dann Speichern; Speichern nur mit
 * Grund und Bestätigungen; Mail abwählbar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { baueAenderungen, begrenzeMenge, startEingaben, type EditPosition } from '../orderEditEingabe';

const POSITIONEN: EditPosition[] = [
  { id: 'a', name: 'Hoodie · Navy', sizeQuantities: { L: 2, M: 3 } },
  { id: 'b', name: 'Shirt · Weiß', sizeQuantities: { M: 1 } },
];

test('Ausgangszustand: nichts entfernt, nichts verringert – also keine Änderung', () => {
  const eingaben = startEingaben(POSITIONEN);
  assert.deepEqual(eingaben.a, { entfernen: false, mengen: { L: 2, M: 3 } });
  assert.deepEqual(baueAenderungen(POSITIONEN, eingaben), []);
});

test('weniger Stück in einer Größe → eine Verringerung mit der vollständigen Mengenliste', () => {
  const eingaben = startEingaben(POSITIONEN);
  eingaben.a!.mengen.L = 1;
  assert.deepEqual(baueAenderungen(POSITIONEN, eingaben), [{ art: 'verringern', positionId: 'a', neueMengen: { L: 1, M: 3 } }]);
});

test('Entfernen schlägt Verringern, und die entfernte Position liefert keine Stückzahlen', () => {
  const eingaben = startEingaben(POSITIONEN);
  eingaben.a!.mengen.L = 0;
  eingaben.a!.entfernen = true;
  assert.deepEqual(baueAenderungen(POSITIONEN, eingaben), [{ art: 'entfernen', positionId: 'a' }]);
});

test('mehrere Positionen in einer Änderung, Reihenfolge wie in der Bestellung', () => {
  const eingaben = startEingaben(POSITIONEN);
  eingaben.b!.entfernen = true;
  eingaben.a!.mengen.M = 0;
  assert.deepEqual(baueAenderungen(POSITIONEN, eingaben), [
    { art: 'verringern', positionId: 'a', neueMengen: { L: 2, M: 0 } },
    { art: 'entfernen', positionId: 'b' },
  ]);
});

test('Eingabefeld: nie mehr als bisher, nie unter 0, Unleserliches bleibt beim bisherigen Wert', () => {
  assert.equal(begrenzeMenge(3, '2'), 2);
  assert.equal(begrenzeMenge(3, '3'), 3);
  assert.equal(begrenzeMenge(3, '9'), 3, 'Erhöhen ist nicht möglich');
  assert.equal(begrenzeMenge(3, '-4'), 0);
  assert.equal(begrenzeMenge(3, '0'), 0);
  assert.equal(begrenzeMenge(3, ''), 3, 'ein leeres Feld entfernt nicht still eine Größe');
  assert.equal(begrenzeMenge(3, 'abc'), 3);
  assert.equal(begrenzeMenge(3, '1,5'), 1, 'ganze Zahlen');
});

// ── Quelltext der Komponente ─────────────────────────────────────────────

const KOMPONENTE = readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'OrderEditControl.tsx'), 'utf8');

test('die Vorschau schreibt nichts: Berechnen und Speichern sind zwei getrennte Server-Aufrufe', () => {
  assert.match(KOMPONENTE, /berechneAuftragsaenderung\(orderId, aenderungen\)/);
  assert.match(KOMPONENTE, /wendeAuftragsaenderungAn\(orderId, aenderungen, \{/);
  const berechnen = KOMPONENTE.indexOf('function berechnen()');
  const speichern = KOMPONENTE.indexOf('function speichern()');
  assert.ok(berechnen > 0 && speichern > berechnen);
});

test('gespeichert wird nur eine GÜLTIGE Vorschau; jede Eingabe verwirft sie', () => {
  assert.match(KOMPONENTE, /if \(!vorschau \|\| !vorschauGueltig\) return;/);
  assert.match(KOMPONENTE, /vorschauFuer === aenderungenJson/);
  // Jede Änderung im Formular setzt die Vorschau zurück.
  const setzeEntfernen = KOMPONENTE.slice(KOMPONENTE.indexOf('function setzeEntfernen'), KOMPONENTE.indexOf('function setzeMenge'));
  const setzeMenge = KOMPONENTE.slice(KOMPONENTE.indexOf('function setzeMenge'), KOMPONENTE.indexOf('function berechnen'));
  assert.match(setzeEntfernen, /setVorschau\(null\)/);
  assert.match(setzeMenge, /setVorschau\(null\)/);
  // Dem Server wird die Summe mitgegeben, die der Betreiber gesehen hat.
  assert.match(KOMPONENTE, /erwartet: \{ altCent: vorschau\.alt\.gesamtCent, neuCent: vorschau\.neu\.gesamtCent \}/);
});

test('Speichern ist ohne Grund und ohne alle verlangten Bestätigungen gesperrt', () => {
  assert.match(KOMPONENTE, /begruendung\.trim\(\)\.length < 3/);
  assert.match(KOMPONENTE, /vorschau\.bestaetigungen\.some\(\(b\) => !bestaetigt\.has\(b\)\)/);
});

test('die Vorschau zeigt alten Preis, neuen Preis, Differenz, den Mailwortlaut – und die Mail ist abwählbar', () => {
  for (const text of ['Alter Gesamtpreis', 'Neuer Gesamtpreis', 'Differenz', 'Wortlaut der Mail ansehen', 'Kundschaft per Mail informieren', 'muss erstattet werden']) {
    assert.ok(KOMPONENTE.includes(text), `Anzeige fehlt: ${text}`);
  }
  assert.match(KOMPONENTE, /onChange=\{\(e\) => setMailSenden\(e\.target\.checked\)\}/);
  assert.match(KOMPONENTE, /mailSenden,/, 'die Wahl geht an den Server');
});

test('die Oberfläche kann nur verringern und entfernen: Eingabefelder sind nach oben begrenzt, es gibt kein Hinzufügen', () => {
  assert.match(KOMPONENTE, /max=\{bisher\}/);
  assert.match(KOMPONENTE, /min=\{0\}/);
  assert.doesNotMatch(KOMPONENTE, /hinzufügen/i, 'es gibt keinen Weg, Ware hinzuzufügen');
  assert.doesNotMatch(KOMPONENTE, /art: 'hinzufuegen'|art: 'erhoehen'/);
});

test('nach dem Speichern werden Vorschauen und Produktionsblatt neu erzeugt – mit ehrlichem Hinweis, wenn das scheitert', () => {
  assert.match(KOMPONENTE, /erzeugeProduktionsunterlagenNeuAktion\(orderId\)/);
  assert.match(KOMPONENTE, /NICHT vollständig neu erzeugt/);
});

test('die offene Erstattung bewegt kein Geld: Sie wird nur vermerkt', () => {
  assert.match(KOMPONENTE, /vermerkeErstattungVonHand\(orderId, offenCent, notiz\)/);
  assert.doesNotMatch(KOMPONENTE, /retryErstattung|stelleErstattungSicher/);
});
