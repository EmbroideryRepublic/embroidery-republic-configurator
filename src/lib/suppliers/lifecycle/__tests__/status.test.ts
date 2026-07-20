/**
 * Unit-Tests der Lieferanten-Lifecycle-Statusmaschine + Retry-Policy.
 * Reine Logik – ohne Datenbank/Browser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { SupplierWorkerRunResult } from '../../types';
import {
  backoffMs,
  canTransition,
  classifyRunFailure,
  decideOutcome,
  isTerminal,
  MAX_ATTEMPTS,
} from '../status';

// ── Übergänge ──────────────────────────────────────────────────────────
test('erlaubte Übergänge werden zugelassen', () => {
  assert.equal(canTransition('draft', 'queued'), true);
  assert.equal(canTransition('queued', 'processing'), true);
  assert.equal(canTransition('processing', 'cart_prepared'), true);
  assert.equal(canTransition('processing', 'queued'), true); // Retry
  assert.equal(canTransition('failed', 'queued'), true); // manueller Retry
  assert.equal(canTransition('blocked', 'queued'), true); // nach Klärung
});

test('verbotene Übergänge werden abgelehnt', () => {
  assert.equal(canTransition('ordered', 'processing'), false);
  assert.equal(canTransition('cancelled', 'queued'), false);
  // 'ordered' und 'cancelled' bleiben terminal – daraus fuehrt kein Weg zurueck.
  assert.equal(canTransition('ordered', 'queued'), false);
  assert.equal(canTransition('cancelled', 'ordered'), false);
});

test('manuelles "bestellt" ist aus allen offenen Zuständen erlaubt', () => {
  // Der REGELFALL ist die manuelle Bestellung im Shop des Lieferanten; der
  // Betreiber markiert danach im Adminbereich. Das muss unabhaengig davon
  // gehen, ob die (ruhende) Automatisierung den Auftrag je angefasst hat –
  // frueher war 'ordered' nur ueber 'processing' erreichbar.
  for (const von of ['draft', 'queued', 'cart_prepared', 'blocked', 'failed', 'paused'] as const) {
    assert.equal(canTransition(von, 'ordered'), true, `${von} → ordered muss erlaubt sein`);
  }
});

test('isTerminal nur für ordered/cancelled', () => {
  assert.equal(isTerminal('ordered'), true);
  assert.equal(isTerminal('cancelled'), true);
  assert.equal(isTerminal('failed'), false);
  assert.equal(isTerminal('blocked'), false);
});

test('Pause- und Abbruch-Übergänge (Admin)', () => {
  // Pausieren aus ruhenden/wartenden Zuständen erlaubt, aus 'processing' nicht.
  assert.equal(canTransition('queued', 'paused'), true);
  assert.equal(canTransition('failed', 'paused'), true);
  assert.equal(canTransition('blocked', 'paused'), true);
  assert.equal(canTransition('processing', 'paused'), false);
  // Aus Pause wieder aufnehmen oder abbrechen.
  assert.equal(canTransition('paused', 'queued'), true);
  assert.equal(canTransition('paused', 'cancelled'), true);
  // Abbruch aus den meisten Zuständen, nicht mehr aus cancelled.
  assert.equal(canTransition('ordered', 'cancelled'), true);
  assert.equal(canTransition('cancelled', 'queued'), false);
});

// ── Backoff ────────────────────────────────────────────────────────────
test('backoff wächst exponentiell und ist gedeckelt', () => {
  assert.equal(backoffMs(1), 60_000);
  assert.equal(backoffMs(2), 120_000);
  assert.equal(backoffMs(3), 240_000);
  assert.ok(backoffMs(20) <= 15 * 60_000, 'Deckel greift');
  assert.ok(backoffMs(2) > backoffMs(1));
});

// ── Fehlerklassifikation ───────────────────────────────────────────────
function run(outcome: SupplierWorkerRunResult['outcome'], errors: string[] = []): SupplierWorkerRunResult {
  return {
    jobId: 'j',
    supplierId: 'needen',
    supplierName: 'needen (Test)',
    mode: 'prepare-cart',
    startedAt: '',
    finishedAt: '',
    durationMs: 0,
    outcome,
    positions: [],
    steps: errors.map((e) => ({
      step: 'selectColor',
      status: 'failed',
      error: e,
      at: '',
      durationMs: 0,
    })),
    logs: [],
  };
}

test('not_implemented → blocked', () => {
  assert.equal(classifyRunFailure(run('not_implemented')), 'blocked');
});

test('Mapping-/Zugangsdaten-Fehler → blocked', () => {
  assert.equal(classifyRunFailure(run('failed', ['Farbe "x" ist beim Lieferanten nicht verfügbar'])), 'blocked');
  assert.equal(classifyRunFailure(run('failed', ['Zugangsdaten für needen fehlen'])), 'blocked');
});

test('Browser-/Timeout-Fehler → transient', () => {
  assert.equal(classifyRunFailure(run('failed', ['net::ERR_TIMED_OUT'])), 'transient');
  assert.equal(classifyRunFailure(run('failed', ['Timeout 30000ms exceeded'])), 'transient');
});

test('unklarer Fehler → transient (mit Obergrenze abgesichert)', () => {
  assert.equal(classifyRunFailure(run('failed', ['irgendetwas Unerwartetes'])), 'transient');
});

// ── Outcome-Entscheidung ───────────────────────────────────────────────
test('prepared → cart_prepared bzw. ordered je Modus', () => {
  assert.equal(decideOutcome({ runOutcome: 'prepared', mode: 'prepare-cart', attemptCount: 1 }).status, 'cart_prepared');
  assert.equal(decideOutcome({ runOutcome: 'prepared', mode: 'checkout', attemptCount: 1 }).status, 'ordered');
});

test('not_implemented → blocked', () => {
  assert.equal(decideOutcome({ runOutcome: 'not_implemented', mode: 'prepare-cart', attemptCount: 1 }).status, 'blocked');
});

test('blockierender Fehler → blocked (kein Retry)', () => {
  const d = decideOutcome({ runOutcome: 'failed', mode: 'prepare-cart', attemptCount: 1, failureKind: 'blocked' });
  assert.equal(d.status, 'blocked');
  assert.equal(d.retryDelayMs, undefined);
});

test('transienter Fehler mit Restversuchen → queued + Retry-Delay', () => {
  const d = decideOutcome({ runOutcome: 'failed', mode: 'prepare-cart', attemptCount: 1, failureKind: 'transient' });
  assert.equal(d.status, 'queued');
  assert.equal(d.retryDelayMs, 60_000);
});

test('transienter Fehler nach letztem Versuch → failed', () => {
  const d = decideOutcome({
    runOutcome: 'failed',
    mode: 'prepare-cart',
    attemptCount: MAX_ATTEMPTS,
    failureKind: 'transient',
  });
  assert.equal(d.status, 'failed');
  assert.equal(d.retryDelayMs, undefined);
});

test('permanenter Fehler → failed', () => {
  assert.equal(
    decideOutcome({ runOutcome: 'failed', mode: 'prepare-cart', attemptCount: 1, failureKind: 'permanent' }).status,
    'failed'
  );
});
