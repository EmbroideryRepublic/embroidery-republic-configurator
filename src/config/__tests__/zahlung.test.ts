/**
 * Zahlungsregeln: die Phase-2-Weiche.
 *
 * Der Kern: Braucht eine Zahlungsart eine Vorabzahlung, darf Phase 2
 * (Produktion, E-Mails) erst nach der Bestätigung laufen. Diese reine
 * Entscheidung wird an mehreren Stellen gebraucht – deshalb hier gebündelt
 * und geprüft.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN,
  ZAHLUNG_VERFAELLT_NACH_STUNDEN,
  anfangsZahlungsstatus,
  brauchtVorabZahlung,
} from '../zahlung';

test('Rechnungskauf braucht keine Vorabzahlung', () => {
  assert.equal(brauchtVorabZahlung('invoice'), false);
  assert.equal(anfangsZahlungsstatus('invoice'), 'not_required');
});

test('Karte und PayPal brauchen eine Vorabzahlung', () => {
  for (const m of ['card', 'paypal'] as const) {
    assert.equal(brauchtVorabZahlung(m), true, `${m} sollte vorab bezahlt werden`);
    assert.equal(anfangsZahlungsstatus(m), 'pending');
  }
});

test('der Anfangsstatus ist immer einer der erlaubten Werte', () => {
  // Muss zur DB-Constraint aus Migration 0004 passen.
  for (const m of ['invoice', 'card', 'paypal'] as const) {
    assert.ok(['not_required', 'pending'].includes(anfangsZahlungsstatus(m)));
  }
});

test('die Fristen sind plausibel', () => {
  // Der Verfall muss deutlich länger sein als ein Bezahlvorgang dauert,
  // die Claim-Frist deutlich länger als Phase 2 (Sekunden).
  assert.ok(ZAHLUNG_VERFAELLT_NACH_STUNDEN >= 12 && ZAHLUNG_VERFAELLT_NACH_STUNDEN <= 72);
  assert.ok(ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN >= 5 && ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN <= 60);
});
