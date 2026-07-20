/**
 * ECHTER-BROWSER-E2E-Tests der zentralen Auswahl-Engine (selectionEngine.ts).
 *
 * Validiert die Prefer-ID/Label-Fallback/Fail-Fast-Mechanik mit einem realen
 * Chromium gegen kleine Fixtures. Der VOLLSTÄNDIGE needen-Bestellablauf
 * (Login → Farbe → Größe → Warenkorb, interne Bestellung bis Warenkorb) liegt
 * bewusst in seinem eigenen, shop-getreuen Test:
 *   src/lib/suppliers/adapters/__tests__/needen.e2e.test.ts
 *
 * Läuft nur, wenn Chromium installiert ist (`npx playwright install
 * chromium`); sonst überspringt sich der jeweilige Test selbst.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { selectVariant, type ControlSelectionPlan } from '../../adapters/selectionEngine';
import type { AutomationPage } from '../../types';

async function loadChromium(): Promise<typeof import('playwright').chromium | null> {
  try {
    return (await import('playwright')).chromium;
  } catch {
    return null;
  }
}
const noop = () => {};

const idFixture =
  '<!doctype html><html><body>' +
  '<button data-variant-id="clr-1001" data-label="Navy" onclick="this.setAttribute(\'data-picked\',\'1\')">Navy</button>' +
  '<button data-variant-id="clr-2002" data-label="Red" onclick="this.setAttribute(\'data-picked\',\'1\')">Red</button>' +
  '</body></html>';
const idFixtureUrl = 'data:text/html,' + encodeURIComponent(idFixture);

test('E2E: Engine bevorzugt variantId, wenn der Shop-Plan sie unterstützt', async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip('Chromium nicht installiert');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(idFixtureUrl);
    const plan: ControlSelectionPlan = {
      control: 'Farbe',
      targets: {
        'variant-id': { kind: 'click', template: 'button[data-variant-id="{value}"]' },
        label: { kind: 'click', template: 'button[data-label="{value}"]' },
      },
    };
    const res = await selectVariant(page as unknown as AutomationPage, { label: 'Navy', variantId: 'clr-1001' }, plan, noop);
    assert.equal(res.strategy, 'variant-id');
    assert.equal(res.value, 'clr-1001');
    // DOM-Beweis: der richtige Button wurde geklickt.
    assert.equal(await page.getAttribute('button[data-variant-id="clr-1001"]', 'data-picked'), '1');
    assert.equal(await page.getAttribute('button[data-variant-id="clr-2002"]', 'data-picked'), null);
  } finally {
    await browser.close();
  }
});

test('E2E: Label-Fallback bleibt erhalten, wenn der Plan keine variantId kann', async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip('Chromium nicht installiert');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(idFixtureUrl);
    // Plan unterstützt NUR Label – obwohl die Variante eine variantId hätte.
    const labelOnlyPlan: ControlSelectionPlan = {
      control: 'Farbe',
      targets: { label: { kind: 'click', template: 'button[data-label="{value}"]' } },
    };
    const res = await selectVariant(
      page as unknown as AutomationPage,
      { label: 'Red', variantId: 'clr-2002' },
      labelOnlyPlan,
      noop
    );
    assert.equal(res.strategy, 'label');
    assert.equal(res.value, 'Red');
    assert.equal(await page.getAttribute('button[data-label="Red"]', 'data-picked'), '1');
  } finally {
    await browser.close();
  }
});

test('E2E: Fail-Fast – keine anwendbare Strategie → Engine wirft', async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip('Chromium nicht installiert');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(idFixtureUrl);
    // Plan kann NUR variant-id, die Variante hat aber keine → nicht auflösbar.
    const idOnlyPlan: ControlSelectionPlan = {
      control: 'Farbe',
      targets: { 'variant-id': { kind: 'click', template: 'button[data-variant-id="{value}"]' } },
    };
    await assert.rejects(
      () => selectVariant(page as unknown as AutomationPage, { label: 'Navy' }, idOnlyPlan, noop),
      /Keine anwendbare Auswahlstrategie/
    );
  } finally {
    await browser.close();
  }
});
