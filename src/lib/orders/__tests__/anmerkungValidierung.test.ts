/**
 * Anmerkung der Kundschaft in der serverseitigen Prüfung (validateSubmission): Grenze 1000 Zeichen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANMERKUNG_MAX_ZEICHEN } from '@/config/anmerkung';
import { validateSubmission } from '../orderValidation';

const BASIS = { orderType: 'inquiry' as const, items: [], email: 'max@example.invalid', customerName: 'Max Mustermann' };

test('genau 1000 Zeichen sind erlaubt', async () => {
  const r = await validateSubmission({ ...BASIS, message: 'x'.repeat(ANMERKUNG_MAX_ZEICHEN) });
  assert.ok(!r.issues.some((i) => i.code === 'anmerkung_zu_lang'), 'Grenze zu streng');
});

test('1001 Zeichen werden mit verständlicher Meldung abgelehnt', async () => {
  const r = await validateSubmission({ ...BASIS, message: 'x'.repeat(ANMERKUNG_MAX_ZEICHEN + 1) });
  const befund = r.issues.find((i) => i.code === 'anmerkung_zu_lang');
  assert.ok(befund, 'zu lange Anmerkung nicht erkannt');
  assert.match(befund.message, /zu lang/);
  assert.match(befund.message, /1\.000/);
  assert.equal(r.valid, false);
});

test('ohne Anmerkung gibt es keinen Befund dazu', async () => {
  for (const message of [undefined, '']) {
    const r = await validateSubmission({ ...BASIS, message });
    assert.ok(!r.issues.some((i) => i.code === 'anmerkung_zu_lang'));
  }
});

test('ein kaputter Eingang (Zahl statt Text) löst keinen Fehler aus', async () => {
  const r = await validateSubmission({ ...BASIS, message: 12345 as unknown as string });
  assert.ok(!r.issues.some((i) => i.code === 'anmerkung_zu_lang'));
});
