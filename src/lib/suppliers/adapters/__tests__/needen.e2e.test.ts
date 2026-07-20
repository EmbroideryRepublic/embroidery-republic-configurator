/**
 * ECHTER-BROWSER-E2E-DRY-RUN des vollständigen needen-Bestellablaufs.
 *
 * Fährt den KOMPLETTEN Weg „interne Bestellung → erfolgreicher Abschluss der
 * Browserautomatisierung" in einem echten Chromium ab, gegen Fixture-Seiten,
 * die die VERIFIZIERTE reale needen-DOM 1:1 nachbilden:
 *   - Login-Modal (Trigger `a[href="#signinModal"]` → `#user_login`,
 *     `#user_password`, `button#submit`; Erfolg = Trigger verschwindet)
 *   - Farb-Swatches als sichtbares `label.shop-color[title]` über einem
 *     `display:none`-Radio `input.color-controller` (Klick-auf-Label selektiert)
 *   - Mengen-Matrix `tr.size-class-<Label> input.product-quantity`
 *   - „In den Warenkorb" `input.add-to-cart-submit` (nicht Bulk) + Zähler
 *     `a.cart-qty`
 *
 * Dry-Run heißt: keine echte needen-Seite, keine echte Bestellung – aber der
 * echte NeedenAdapter, die echten Auswahl-Pläne, die echte Mapping-Schicht und
 * der echte Worker-Ablauf. Nur die Shop-URLs (Login-Start + Produkt) zeigen auf
 * Fixtures. Genau das prüft dieser Test: die verifizierten Selektoren treffen
 * die reale Struktur und der Ablauf läuft sauber bis zum Warenkorb durch.
 *
 * Läuft nur mit installiertem Chromium (`npx playwright install chromium`);
 * sonst überspringt sich der Test selbst.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildSupplierPositions } from '../../buildSupplierPositions';
import { runSupplierJob } from '../../worker/supplierWorker';
import type { AutomationPage, SupplierAutomationJob } from '../../types';

async function loadChromium(): Promise<typeof import('playwright').chromium | null> {
  try {
    return (await import('playwright')).chromium;
  } catch {
    return null;
  }
}

// ── Fixtures, die die verifizierte needen-Struktur spiegeln ──────────────

/** Login-Startseite: Header-Trigger + (bereits gerendertes) Modal-Formular.
 *  Der Absende-Button entfernt den Trigger → simuliert den beobachtbaren
 *  Login-Erfolg (Trigger verschwindet). */
const HOME_FIXTURE =
  '<!doctype html><html><body>' +
  '<a id="loginTrigger" href="#signinModal">Login</a>' +
  '<div id="signinModal">' +
  '<input id="user_login" type="text">' +
  '<input id="user_password" type="password">' +
  '<button id="submit" type="button" ' +
  "onclick=\"document.getElementById('loginTrigger').remove()\">Anmelden</button>" +
  '</div></body></html>';
const HOME_FIXTURE_URL = 'data:text/html,' + encodeURIComponent(HOME_FIXTURE);

/** Ein Farb-Swatch = sichtbares Label über verstecktem Radio (wie im Shop:
 *  Radio `display:none`, Klick auf das `for`-verknüpfte Label selektiert es). */
function swatch(colorId: string, name: string): string {
  return (
    `<input class="color-controller" type="radio" name="farbe" id="farbe_${colorId}" ` +
    `data-color="${name}" style="display:none">` +
    `<label class="shop-color" for="farbe_${colorId}" title="${name}" ` +
    'style="display:inline-block;width:20px;height:20px;background:#333"></label>'
  );
}

/** Eine Größenzeile der Mengen-Matrix (Input bewusst in einem <td>, sonst
 *  hebt der HTML-Parser es aus der Tabelle heraus – wie im echten Shop). */
function sizeRow(label: string, sizeId: string): string {
  return (
    `<tr class="size-class-${label}"><th class="size-fixed">${label}</th>` +
    `<td><input class="product-quantity" type="number" name="qty[${sizeId}]" value=""></td></tr>`
  );
}

const PRODUCT_FIXTURE =
  '<!doctype html><html><body><form>' +
  swatch('20', 'Schwarz') +
  swatch('23', 'Weiß') +
  swatch('2305', 'Navy') +
  swatch('345', 'Royal') +
  swatch('2307', 'Red') +
  '<table><tbody>' +
  sizeRow('S', '111') +
  sizeRow('M', '222') +
  sizeRow('L', '333') +
  sizeRow('XL', '444') +
  sizeRow('2XL', '555') +
  '</tbody></table>' +
  // Bulk-Button zuerst – der Adapter MUSS ihn per :not() ausschließen und den
  // primären Button treffen.
  '<input type="button" class="add-to-cart-submit bulk-add-to-cart-submit" value="BULK">' +
  '<input type="button" class="add-to-cart-submit" value="IN DEN WARENKORB" ' +
  "onclick=\"document.getElementById('cartqty').textContent='1'\">" +
  '<a id="cartqty" class="cart-qty" style="display:inline-block">0</a>' +
  '</form></body></html>';
const PRODUCT_FIXTURE_URL = 'data:text/html,' + encodeURIComponent(PRODUCT_FIXTURE);

function withNeedenCreds<T>(fn: () => Promise<T>): Promise<T> {
  const u = process.env.SUPPLIER_NEEDEN_USERNAME;
  const p = process.env.SUPPLIER_NEEDEN_PASSWORD;
  process.env.SUPPLIER_NEEDEN_USERNAME = 'e2e-user';
  process.env.SUPPLIER_NEEDEN_PASSWORD = 'e2e-pass';
  return fn().finally(() => {
    process.env.SUPPLIER_NEEDEN_USERNAME = u;
    process.env.SUPPLIER_NEEDEN_PASSWORD = p;
  });
}

test('E2E-Dry-Run: interne Bestellung → needen prepare-cart vollständig im echten Chromium', async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip('Chromium nicht installiert (npx playwright install chromium)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // 1. Interner Warenkorb → Lieferantenposition (echter Produktkatalog):
    //    Damen-Heavy-T bei needen, Navy, M×5 + XXL×2.
    const draft = buildSupplierPositions('order-needen-e2e', [
      { productId: 'gildan-ladies-heavy-t', colorId: 'navy', sizeQuantities: { M: 5, XXL: 2 } },
    ]);
    const positions = draft.positionsBySupplier['needen'];
    assert.ok(positions && positions.length === 1, 'needen-Position wurde erzeugt');

    // Shop-URLs auf die Fixtures umbiegen (Login-Start via deps.baseUrl,
    // Produktseite via position.productUrl) – der Rest ist echt.
    const job: SupplierAutomationJob = {
      jobId: 'order-needen-e2e:needen',
      orderId: 'order-needen-e2e',
      orderNumber: 'ER-NDN-E2E',
      supplierId: 'needen',
      mode: 'prepare-cart',
      positions: positions.map((pos) => ({ ...pos, productUrl: PRODUCT_FIXTURE_URL })),
    };

    const result = await withNeedenCreds(() =>
      runSupplierJob(job, {
        createSession: async () => ({ page: page as unknown as AutomationPage, dispose: async () => {} }),
        baseUrl: HOME_FIXTURE_URL,
      })
    );

    // 2. Jeder Schritt ist ok, Gesamtergebnis 'prepared'.
    const byStep = (step: string) => result.steps.filter((s) => s.step === step);
    assert.equal(byStep('login')[0]?.status, 'ok', 'login erfolgreich');
    assert.equal(byStep('resolveVariants')[0]?.status, 'ok');
    assert.equal(byStep('openProduct')[0]?.status, 'ok');
    assert.equal(byStep('selectColor')[0]?.status, 'ok');
    assert.equal(byStep('addToCart')[0]?.status, 'ok');
    const setQty = byStep('setQuantity');
    assert.equal(setQty.length, 2, 'zwei Größen befüllt');
    assert.ok(setQty.every((s) => s.status === 'ok'));

    // BEKANNTE LÜCKE, bewusst festgehalten: für needen ist noch kein
    // verifizierter Warenkorb-Nachweis hinterlegt (cartConfirmationPlan), weil
    // die Warenkorb-Seite hinter dem Login liegt und keine Zugangsdaten
    // vorliegen. Ein geratener Selektor käme nicht in Frage. Damit ist NICHT
    // belegt, dass ein befüllter needen-Warenkorb die Sitzung überdauert –
    // bei textil-grosshandel tat er das ohne diesen Schritt nachweislich NICHT.
    // Sobald der Nachweis gepflegt ist, wird hier 'ok'/'prepared' erwartet.
    assert.equal(byStep('confirmCart')[0]?.status, 'not_implemented', 'Warenkorb-Nachweis fehlt noch');
    assert.equal(result.outcome, 'not_implemented', 'nur der Warenkorb-Nachweis fehlt, kein echter Fehler');
    assert.ok(
      result.steps.filter((s) => s.step !== 'confirmCart').every((s) => s.status === 'ok'),
      'alle übrigen Schritte laufen fehlerfrei'
    );

    // 3. Protokollierte Selektionsmethoden (Label-Fallback, verifizierte Werte).
    assert.deepEqual(byStep('selectColor')[0]?.selection, { strategy: 'label', value: 'Navy' });
    const qtyM = setQty.find((s) => s.size === 'M');
    const qtyXXL = setQty.find((s) => s.size === 'XXL');
    assert.deepEqual(qtyM?.selection, { strategy: 'label', value: 'M' });
    // Intern „XXL" → needen „2XL" (verifizierte Mapping-Korrektur).
    assert.deepEqual(qtyXXL?.selection, { strategy: 'label', value: '2XL' });

    // 4. DOM-Beweis im echten Browser (Endzustand = Produktseite):
    //    das richtige Farb-Radio ist selektiert …
    assert.equal(await page.isChecked('input.color-controller[data-color="Navy"]'), true);
    assert.equal(await page.isChecked('input.color-controller[data-color="Schwarz"]'), false);
    //    … die Mengen stehen in den richtigen Größenzeilen …
    assert.equal(await page.inputValue('tr.size-class-M input.product-quantity'), '5');
    assert.equal(await page.inputValue('tr.size-class-2XL input.product-quantity'), '2');
    assert.equal(await page.inputValue('tr.size-class-S input.product-quantity'), '');
    //    … und der Warenkorb-Zähler bestätigt das Hinzufügen (primärer,
    //    NICHT der Bulk-Button wurde geklickt).
    assert.equal(await page.textContent('a.cart-qty'), '1');
  } finally {
    await browser.close();
  }
});
