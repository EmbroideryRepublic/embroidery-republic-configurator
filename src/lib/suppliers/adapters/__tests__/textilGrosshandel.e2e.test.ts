/**
 * ECHTER-BROWSER-E2E-DRY-RUN des textil-grosshandel-Bestellablaufs.
 *
 * Fährt in echtem Chromium den KOMPLETTEN Weg „interne Bestellung →
 * erfolgreicher Abschluss der Browserautomatisierung" gegen Fixtures ab, die
 * die VERIFIZIERTE reale TG-DOM (OXID eShop, Gildan G5000) spiegeln:
 *   - Farbwahl per Hex-Swatch `button.switch-to[data-key="<HEX>"]`
 *   - Mengen-Matrix `tr` mit `td.cell-size` (Label) + `td.cell-amount input`
 *     (Adressierung per Größen-Label, nicht per varId)
 *   - Login `/mein-konto/` (`#loginUser`/`#loginPwd`/`#loginButton`)
 *   - „In den Warenkorb" `button[name="toBasket"]` + `#basketItemCountAndPrice`
 *
 * Beweist zusätzlich die PRODUKTSPEZIFISCHE Farb-Hex-Auflösung: aus der
 * internen Bestellung (gildan-heavy-t, navy) liefert die Mapping-Schicht über
 * productOverrides den verifizierten Hex `263147`, und die Engine nutzt ihn
 * als variant-id (nicht das Label).
 *
 * Läuft nur mit installiertem Chromium; sonst überspringt sich der Test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildSupplierPositions } from '../../buildSupplierPositions';
import { resolveSupplierPosition } from '../../mapping';
import { performLogin } from '../shopActions';
import { TextilGrosshandelAdapter, TG_PLANS } from '../TextilGrosshandelAdapter';
import type { AutomationPage, SupplierAutomationContext } from '../../types';

async function loadChromium(): Promise<typeof import('playwright').chromium | null> {
  try {
    return (await import('playwright')).chromium;
  } catch {
    return null;
  }
}
const noop = () => {};

// ── Fixtures (verifizierte TG-Struktur) ──────────────────────────────────

const LOGIN_FIXTURE =
  '<!doctype html><html><body>' +
  '<form>' +
  '<input id="loginUser" name="lgn_usr" type="text">' +
  '<input id="loginPwd" name="lgn_pwd" type="password">' +
  '<button id="loginButton" type="button" ' +
  "onclick=\"document.getElementById('loginUser').remove()\">Anmelden</button>" +
  '</form></body></html>';
const LOGIN_FIXTURE_URL = 'data:text/html,' + encodeURIComponent(LOGIN_FIXTURE);

function colorBtn(hex: string): string {
  return (
    `<button class="switch-to" data-key="${hex}" ` +
    "onclick=\"this.setAttribute('data-picked','1');document.getElementById('chosenColorName').textContent=this.getAttribute('data-key')\">" +
    '</button>'
  );
}
function sizeRow(label: string, artnum: string): string {
  return (
    `<tr data-artnum="${artnum}"><td class="cell-size">${label}</td>` +
    '<td class="cell-warnings"></td><td class="cell-stock">50</td>' +
    `<td class="cell-amount"><input type="number" name="aproducts[${artnum}][am]" value="0"></td></tr>`
  );
}
const PRODUCT_FIXTURE =
  '<!doctype html><html><body>' +
  '<div id="chosenColorName"></div>' +
  colorBtn('25282B') + // Black
  colorBtn('263147') + // Navy
  colorBtn('B1302A') + // Red
  '<table><tbody>' +
  sizeRow('S', 'v-s') +
  sizeRow('M', 'v-m') +
  sizeRow('L', 'v-l') +
  sizeRow('XL', 'v-xl') +
  sizeRow('XXL', 'v-xxl') +
  '</tbody></table>' +
  // ASCII-Bestätigungstext (Umlaut/€ in data:-URL-Fixtures unzuverlässig
  // dekodiert; die reale Anzeige lautet "6 Artikel für 22,02 €").
  '<button name="toBasket" type="button" ' +
  "onclick=\"document.getElementById('basketItemCountAndPrice').textContent='6 Artikel'\">In den Warenkorb legen</button>" +
  '<small id="basketItemCountAndPrice">0 Artikel</small>' +
  '</body></html>';
const PRODUCT_FIXTURE_URL = 'data:text/html,' + encodeURIComponent(PRODUCT_FIXTURE);

test('E2E-Dry-Run: interne Bestellung → TG prepare-cart im echten Chromium (Hex-Farbe, Label-Größe)', async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip('Chromium nicht installiert (npx playwright install chromium)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // 1. Interne Bestellung → TG-Position (echter Katalog): Gildan Heavy, Navy, M×6.
    const draft = buildSupplierPositions('order-tg-e2e', [
      { productId: 'gildan-heavy-t', colorId: 'navy', sizeQuantities: { M: 6 } },
    ]);
    const positions = draft.positionsBySupplier['textil-grosshandel'];
    assert.ok(positions && positions.length === 1, 'TG-Position wurde erzeugt');
    const base = positions[0];
    assert.ok(base);
    const position = { ...base, productUrl: PRODUCT_FIXTURE_URL };

    // 2. Mapping-Auflösung: productOverride liefert den VERIFIZIERTEN Navy-Hex.
    const resolved = resolveSupplierPosition(position);
    assert.equal(resolved.colorVariant.variantId, '263147', 'Navy-Hex aus productOverrides');
    assert.equal(resolved.colorVariant.label, 'Navy');

    const adapter = new TextilGrosshandelAdapter();
    const ctx: SupplierAutomationContext = {
      page: page as unknown as AutomationPage,
      credentials: { username: 'e2e-user', password: 'e2e-pass' },
      baseUrl: LOGIN_FIXTURE_URL,
      log: noop,
    };

    // 3a. Login gegen die Login-Fixture (echter Plan, nur URL auf Fixture gebogen).
    await performLogin(page as unknown as AutomationPage, ctx.credentials, { ...TG_PLANS.login, loginUrl: LOGIN_FIXTURE_URL }, noop, LOGIN_FIXTURE_URL);
    assert.equal(await page.$('#loginUser'), null, 'Login-Formular verschwunden → Login-Erfolg');

    // 3b. Produktfluss über die echten Adapter-Methoden.
    await adapter.openProduct(ctx, position);
    const colorSel = await adapter.selectColor(ctx, position, resolved.colorVariant);
    const sizeVariant = resolved.sizeVariants['M'];
    assert.ok(sizeVariant);
    const sizeSel = await adapter.setQuantity(ctx, 'M', 6, sizeVariant);
    await adapter.addToCart(ctx);

    // 4. Genutzte Selektionsmethoden: Farbe per Hex (variant-id), Größe per Label.
    assert.deepEqual(colorSel && { strategy: colorSel.strategy, value: colorSel.value }, { strategy: 'variant-id', value: '263147' });
    assert.deepEqual(sizeSel && { strategy: sizeSel.strategy, value: sizeSel.value }, { strategy: 'label', value: 'M' });

    // 5. DOM-Beweis: der RICHTIGE Farb-Button wurde geklickt …
    assert.equal(await page.getAttribute('button.switch-to[data-key="263147"]', 'data-picked'), '1');
    assert.equal(await page.getAttribute('button.switch-to[data-key="25282B"]', 'data-picked'), null);
    assert.equal(await page.textContent('#chosenColorName'), '263147');
    // … die Menge steht in der M-Zeile (per Label adressiert) …
    assert.equal(await page.inputValue('tr:has(td.cell-size:text-is("M")) td.cell-amount input[name$="[am]"]'), '6');
    assert.equal(await page.inputValue('tr:has(td.cell-size:text-is("S")) td.cell-amount input[name$="[am]"]'), '0');
    // … und der Warenkorb-Zähler bestätigt das Hinzufügen.
    assert.equal(await page.textContent('#basketItemCountAndPrice'), '6 Artikel');
  } finally {
    await browser.close();
  }
});
