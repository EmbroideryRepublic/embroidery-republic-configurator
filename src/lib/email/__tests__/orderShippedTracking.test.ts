/**
 * Verifikation für den Go-Live-Abnahmetest vom 2026-09-01: Da der DHL-
 * Live-Aufruf während der Abnahme an einem bestätigten OAuth-Fehler
 * (invalid_grant, siehe dhl.ts) scheiterte, ließ sich eine ECHTE
 * DHL-Sendungsnummer nicht live erzeugen. Diese Tests verifizieren
 * stattdessen den tatsächlich gerenderten Text der Versandbenachrichtigung
 * für beide Zustände direkt am Template – derselben Komponente, die
 * orderEmails.tsx auch für den echten Versand verwendet.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@react-email/render';
import { OrderShippedEmail } from '../templates/OrderShippedEmail';

test('ohne Sendungsnummer wird keine Sendungsnummer behauptet oder ein Tracking-Link erzeugt', async () => {
  const text = await render(
    OrderShippedEmail({ orderNumber: 'ER-2026-TEST', trackingNummer: null, carrier: null, bestellansichtUrl: null }),
    { plainText: true }
  );
  assert.doesNotMatch(text, /Sendungsnummer/);
  assert.doesNotMatch(text, /dhl\.de/);
});

test('mit echter DHL-Sendungsnummer enthält die E-Mail sie im Klartext UND einen funktionierenden Tracking-Link', async () => {
  const text = await render(
    OrderShippedEmail({
      orderNumber: 'ER-2026-TEST',
      trackingNummer: '00340434161234567890',
      carrier: 'dhl',
      bestellansichtUrl: null,
    }),
    { plainText: true }
  );
  assert.match(text, /Sendungsnummer:\s*00340434161234567890/);
  assert.match(text, /dhl\.de\/de\/privatkunden\/pakete-empfangen\/verfolgen\.html\?piececode=00340434161234567890/);
});

test('mit Sendungsnummer aber ohne DHL als Carrier gibt es die Nummer im Klartext, aber keinen DHL-Tracking-Link', async () => {
  const text = await render(
    OrderShippedEmail({
      orderNumber: 'ER-2026-TEST',
      trackingNummer: 'ABC123',
      carrier: 'anderer-dienstleister',
      bestellansichtUrl: null,
    }),
    { plainText: true }
  );
  assert.match(text, /Sendungsnummer:\s*ABC123/);
  assert.doesNotMatch(text, /dhl\.de/);
});
