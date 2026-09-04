/**
 * Absicherung, dass ladeBestellAnsicht() (orderView.ts) für die Kundenfreigabe
 * denselben Speicherpfad für Druckvorschauen nutzt wie admin/data.ts
 * (getOrderDetail) – kein zweites, abweichendes Pfadschema. Ein
 * auseinanderlaufender Pfad hätte zur Folge, dass die Kundenansicht auf eine
 * nie existierende Datei zeigt, obwohl die Vorschau im Admin sichtbar ist.
 *
 * Gleiche Teststrategie wie kundenfreigabe.test.ts: Quelltext-Prüfung statt
 * Mocking des Supabase-Clients.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ORDER_VIEW = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderView.ts');
const ADMIN_DATA = path.join(process.cwd(), 'src', 'lib', 'admin', 'data.ts');

const orderViewQuelltext = readFileSync(ORDER_VIEW, 'utf8');
const adminDataQuelltext = readFileSync(ADMIN_DATA, 'utf8');

test('orderView.ts nutzt exakt denselben Vorschau-Speicherpfad wie admin/data.ts', () => {
  const PFAD_MUSTER = '`orders/${orderId}/preview-item${itemIndex}-${view}.png`';
  assert.ok(orderViewQuelltext.includes(PFAD_MUSTER), 'orderView.ts muss das Pfadschema exakt reproduzieren');
  assert.ok(adminDataQuelltext.includes(PFAD_MUSTER), 'Referenz: admin/data.ts muss dasselbe Schema verwenden');
});

test('order_items wird jetzt inklusive id geladen (Voraussetzung für den configuration_elements-Join)', () => {
  const selectIndex = orderViewQuelltext.indexOf(".from('order_items')");
  const selectEnde = orderViewQuelltext.indexOf(');', selectIndex);
  assert.match(orderViewQuelltext.slice(selectIndex, selectEnde), /\.select\('id, product_name/);
});

test('orders-Select lädt freigabe_angefragt_am und freigabe_erteilt_am mit', () => {
  const selectIndex = orderViewQuelltext.indexOf(".from('orders')");
  const selectEnde = orderViewQuelltext.indexOf(');', selectIndex);
  const block = orderViewQuelltext.slice(selectIndex, selectEnde);
  assert.match(block, /freigabe_angefragt_am/);
  assert.match(block, /freigabe_erteilt_am/);
});

test('getProductionFileSignedUrl wird für die Vorschauen verwendet, keine ungeprüfte eigene Pfadkonstruktion', () => {
  assert.match(orderViewQuelltext, /await getProductionFileSignedUrl\(pfad\)/);
});

// ── Rechnung im Kundenkonto (Ausbauplan, quickwins) ──────────────────────

test('orders-Select lädt invoice_number und invoice_pdf_url mit', () => {
  const selectIndex = orderViewQuelltext.indexOf(".from('orders')");
  const selectEnde = orderViewQuelltext.indexOf(');', selectIndex);
  const block = orderViewQuelltext.slice(selectIndex, selectEnde);
  assert.match(block, /invoice_number/);
  assert.match(block, /invoice_pdf_url/);
});

test('die Rechnungs-URL wird nur signiert, wenn invoice_pdf_url tatsächlich gesetzt ist (kein Aufruf mit null-Pfad)', () => {
  assert.match(
    orderViewQuelltext,
    /const rechnungPdfUrl = order\.invoice_pdf_url\s*\n\s*\? await getProductionFileSignedUrl\(order\.invoice_pdf_url as string\)\s*\n\s*: null;/
  );
});

test('BestellAnsicht enthält rechnungsnummer und rechnungPdfUrl im Rückgabeobjekt', () => {
  assert.match(orderViewQuelltext, /rechnungsnummer: \(order\.invoice_number as string \| null\) \?\? null,/);
  assert.match(orderViewQuelltext, /rechnungPdfUrl,/);
});
