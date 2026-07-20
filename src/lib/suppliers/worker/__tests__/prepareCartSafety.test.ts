/**
 * Sicherheitsnetz: „prepare-cart darf NIEMALS eine Bestellung auslösen."
 *
 * Diese Zusage beruht auf zwei voneinander unabhängigen Sperren. Beide werden
 * hier festgenagelt, damit sie nicht still verloren gehen:
 *
 *   Sperre 1 – der Worker führt den checkout-Schritt ausschließlich bei
 *              mode === 'checkout' aus.
 *   Sperre 2 – KEIN Adapter implementiert checkout(); alle erben die
 *              notImplemented-Basisimplementierung. Selbst wenn Sperre 1
 *              fiele, entstünde keine Bestellung.
 *
 * Zusätzlich ist der Standardmodus in createSupplierOrder() 'prepare-cart' und
 * kein Aufrufer setzt ihn um – das ist Konvention und wird hier bewusst NICHT
 * getestet (es bräuchte die Datenbank); die beiden Sperren oben tragen die
 * Zusage auch ohne diese Konvention.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSupplierJob } from '../supplierWorker';
import { createSupplierAdapter, SUPPLIERS } from '../../registry';
import { NotImplementedError, type AutomationPage, type SupplierAutomationJob, type SupplierId } from '../../types';
import type { BrowserSession } from '../browserSession';

/** Seite, die jede Interaktion klaglos erfüllt – so kommt der Worker bis zum
 *  Modus-Zweig, ohne dass ein echter Browser nötig ist. */
function createInertSession(): BrowserSession {
  const page = {
    goto: async () => undefined,
    click: async () => undefined,
    fill: async () => undefined,
    check: async () => undefined,
    selectOption: async () => undefined,
    waitForSelector: async () => undefined,
  } satisfies AutomationPage;
  return { page, dispose: async () => undefined };
}

function job(mode: SupplierAutomationJob['mode']): SupplierAutomationJob {
  return {
    jobId: 'order-1:textil-grosshandel',
    orderId: 'order-1',
    orderNumber: 'ER-TEST-0001',
    supplierId: 'textil-grosshandel',
    mode,
    // Bewusst ohne Positionen: geprüft wird der Modus-Zweig, nicht das Mapping.
    positions: [],
  };
}

/** Der Worker liest die Zugangsdaten aus der Umgebung; für den Modus-Zweig
 *  genügen Platzhalter (es wird kein echter Shop kontaktiert). */
function withDummyCredentials<T>(fn: () => Promise<T>): Promise<T> {
  const keys = ['SUPPLIER_TG_USERNAME', 'SUPPLIER_TG_PASSWORD'] as const;
  const previous = keys.map((k) => [k, process.env[k]] as const);
  for (const k of keys) process.env[k] = 'test-dummy';
  return fn().finally(() => {
    for (const [k, v] of previous) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

test('Sperre 1: prepare-cart führt KEINEN checkout-Schritt aus', async () => {
  const run = await withDummyCredentials(() =>
    runSupplierJob(job('prepare-cart'), { createSession: async () => createInertSession() })
  );

  assert.equal(run.mode, 'prepare-cart', 'der Modus muss im Audit stehen');
  assert.ok(
    !run.steps.some((s) => s.step === 'checkout'),
    'im Modus prepare-cart darf NIE ein checkout-Schritt auftauchen'
  );
});

test('Sperre 2: selbst im Modus checkout entsteht keine Bestellung', async () => {
  const run = await withDummyCredentials(() =>
    runSupplierJob(job('checkout'), { createSession: async () => createInertSession() })
  );

  const checkoutStep = run.steps.find((s) => s.step === 'checkout');
  assert.ok(checkoutStep, 'im Modus checkout wird der Schritt versucht');
  assert.equal(
    checkoutStep.status,
    'not_implemented',
    'checkout MUSS folgenlos bleiben, solange kein Adapter ihn implementiert'
  );
});

test('Sperre 2: KEIN registrierter Adapter implementiert checkout()', async () => {
  const ctx = {
    page: createInertSession().page,
    credentials: { username: 'x', password: 'y' },
    baseUrl: 'https://example.invalid',
    log: () => {},
  };

  for (const supplierId of Object.keys(SUPPLIERS) as SupplierId[]) {
    const adapter = createSupplierAdapter(supplierId);
    await assert.rejects(
      () => adapter.checkout(ctx),
      NotImplementedError,
      `${supplierId}: checkout() muss notImplemented bleiben – ein echter Checkout löst eine BESTELLUNG aus`
    );
  }
});
