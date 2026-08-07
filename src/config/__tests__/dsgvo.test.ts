/**
 * DSGVO-Löschfristen: reine Konstanten, aber mit zwei Wächtern, die eine
 * stille Drift zwischen Code und öffentlichem Versprechen verhindern.
 *
 * Die Datenschutzerklärung (Ziffer 10) nennt die Fristen wörtlich in
 * Fließtext ("sechs Monaten", "zehn Jahre"). Ändert sich hier eine Zahl ohne
 * den Text mitzuziehen – oder umgekehrt –, stimmt das Versprechen nicht mehr
 * mit dem tatsächlichen Verhalten überein. Genau das soll dieser Test
 * verhindern, nach demselben Muster wie die Wächter in steuer.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ANFRAGE_LOESCHT_NACH_MONATEN,
  BESTELLUNG_ANONYMISIERT_NACH_JAHREN,
  BESTELLDATEIEN_LOESCHEN_NACH_MONATEN,
} from '../dsgvo';

test('Anfragen werden nach sechs Monaten gelöscht (wie in der Datenschutzerklärung versprochen)', () => {
  assert.equal(ANFRAGE_LOESCHT_NACH_MONATEN, 6);
});

test('Bestellungen werden nach zehn Jahren anonymisiert (§ 147 AO, wie versprochen)', () => {
  assert.equal(BESTELLUNG_ANONYMISIERT_NACH_JAHREN, 10);
});

test('Motivdateien werden deutlich vor der Bestellungs-Anonymisierung entfernt', () => {
  // In Monaten vergleichbar: 24 Monate müssen klar unter 10 Jahren (120
  // Monaten) liegen – sonst wäre die „frühere Löschung" der Werkdateien
  // keine, und die Begründung in dsgvo.ts stimmte nicht mehr.
  assert.ok(BESTELLDATEIEN_LOESCHEN_NACH_MONATEN < BESTELLUNG_ANONYMISIERT_NACH_JAHREN * 12);
});

test('die Datenschutzerklärung nennt exakt die im Code hinterlegten Fristen', () => {
  const inhalt = readFileSync(join('src', 'app', 'datenschutz', 'page.tsx'), 'utf8');
  assert.match(
    inhalt,
    /sechs Monaten/,
    'Ziffer 10 muss die Anfragefrist nennen – Text und ANFRAGE_LOESCHT_NACH_MONATEN dürfen nicht auseinanderlaufen'
  );
  assert.match(
    inhalt,
    /zehn Jahren/,
    'Ziffer 10 muss die Aufbewahrungsfrist nennen – Text und BESTELLUNG_ANONYMISIERT_NACH_JAHREN dürfen nicht auseinanderlaufen'
  );
});
