/**
 * Integrationstest: Zusammenspiel von Worker und Mapping-Schicht.
 *
 * Prüft die zentrale Sicherheitsanforderung end-to-end: existiert eine
 * Farbe/Größe beim Lieferanten nicht, wird die betroffene Position mit
 * einem 'resolveVariants'-Fehler protokolliert und NICHT automatisiert
 * bestellt (keine openProduct/selectColor/addToCart-Schritte), während
 * gültige Positionen normal weiterlaufen.
 *
 * Läuft ohne echten Browser: die Adapter sind noch Stubs (jeder
 * Automatisierungsschritt endet als 'not_implemented'); es geht hier
 * ausschließlich um Ablauf und Positions-Filterung.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runSupplierJob } from '../supplierWorker';
import type { SupplierAutomationJob, SupplierOrderPosition } from '../../types';
import type { SupplierWorkerDeps } from '../supplierWorker';

/** Kontrollierte Browser-Sitzung (kein echtes Chromium): alle Seiten-
 *  methoden sind No-Ops. Dieser Test prüft die resolveVariants-/Skip-Logik
 *  des Workers, nicht die reale Browser-Interaktion (das leistet der
 *  E2E-Test mit echtem Chromium). */
const fakeDeps: SupplierWorkerDeps = {
  createSession: async () => ({
    page: {
      goto: async () => null,
      click: async () => {},
      fill: async () => {},
      check: async () => {},
      selectOption: async () => [],
      waitForSelector: async () => null,
    },
    dispose: async () => {},
  }),
};

function position(overrides: Partial<SupplierOrderPosition>): SupplierOrderPosition {
  return {
    supplierId: 'textil-grosshandel',
    productId: 'p',
    productName: 'Produkt',
    articleNumber: 'G5000',
    productUrl: 'https://example.test/p.html',
    colorId: 'royal',
    colorName: 'Royal',
    sizes: [{ size: 'M', quantity: 3 }],
    ...overrides,
  };
}

function makeJob(positions: SupplierOrderPosition[]): SupplierAutomationJob {
  return {
    jobId: 'order-1:textil-grosshandel',
    orderId: 'order-1',
    orderNumber: 'ER-0001',
    supplierId: 'textil-grosshandel',
    mode: 'prepare-cart',
    positions,
  };
}

/** Zugangsdaten setzen, damit der Worker nicht schon am login-Schritt
 *  abbricht (getSupplierCredentials liest aus der Umgebung). */
function withCredentials<T>(fn: () => Promise<T>): Promise<T> {
  const prevUser = process.env.SUPPLIER_TG_USERNAME;
  const prevPass = process.env.SUPPLIER_TG_PASSWORD;
  process.env.SUPPLIER_TG_USERNAME = 'test-user';
  process.env.SUPPLIER_TG_PASSWORD = 'test-pass';
  return fn().finally(() => {
    process.env.SUPPLIER_TG_USERNAME = prevUser;
    process.env.SUPPLIER_TG_PASSWORD = prevPass;
  });
}

test('gültige Position wird übersetzt und durchläuft den Automatisierungs-Ablauf', async () => {
  const result = await withCredentials(() => runSupplierJob(makeJob([position({ colorId: "royal" })]), fakeDeps));

  const resolveStep = result.steps.find((s) => s.step === 'resolveVariants' && s.positionIndex === 0);
  assert.ok(resolveStep, 'resolveVariants-Schritt fehlt');
  assert.equal(resolveStep.status, 'ok');

  // Die browser-nahen Schritte werden versucht (Stub → not_implemented),
  // die Position wird also NICHT übersprungen.
  assert.ok(result.steps.some((s) => s.step === 'openProduct' && s.positionIndex === 0));
  assert.ok(result.steps.some((s) => s.step === 'selectColor' && s.positionIndex === 0));
  assert.ok(result.steps.some((s) => s.step === 'addToCart' && s.positionIndex === 0));
});

test('Position mit unbekannter Farbe wird protokolliert und NICHT bestellt', async () => {
  const job = makeJob([
    position({ colorId: 'royal' }), // gültig
    position({ colorId: 'lavender', colorName: 'Lavendel' }), // beim Lieferanten unbekannt
  ]);

  const result = await withCredentials(() => runSupplierJob(job, fakeDeps));

  // Position 1: resolveVariants ist FAILED …
  const failedResolve = result.steps.find((s) => s.step === 'resolveVariants' && s.positionIndex === 1);
  assert.ok(failedResolve, 'resolveVariants-Schritt für Position 1 fehlt');
  assert.equal(failedResolve.status, 'failed');
  assert.match(failedResolve.error ?? '', /lavender/);

  // … und es gibt KEINE Bestellschritte für Position 1.
  const pos1AutomationSteps = result.steps.filter(
    (s) => s.positionIndex === 1 && s.step !== 'resolveVariants'
  );
  assert.equal(pos1AutomationSteps.length, 0, 'nicht auflösbare Position darf nicht bestellt werden');

  // Die gültige Position 0 läuft dennoch normal.
  assert.ok(result.steps.some((s) => s.step === 'openProduct' && s.positionIndex === 0));
});

test('Position mit unbekannter Größe wird ebenfalls übersprungen', async () => {
  const job = makeJob([position({ sizes: [{ size: '4XL', quantity: 1 }] })]);

  const result = await withCredentials(() => runSupplierJob(job, fakeDeps));

  const failedResolve = result.steps.find((s) => s.step === 'resolveVariants' && s.positionIndex === 0);
  assert.ok(failedResolve);
  assert.equal(failedResolve.status, 'failed');
  assert.match(failedResolve.error ?? '', /4XL/);
  assert.equal(result.steps.filter((s) => s.step === 'setQuantity').length, 0);
});
