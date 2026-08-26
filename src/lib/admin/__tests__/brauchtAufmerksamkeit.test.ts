/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit,
 * admin_workflow_ux – höchste Priorität der Empfehlung): ein Fehlschlag
 * (Versandlabel, Bestellbestätigung, Rechnung) war bislang ausschließlich auf
 * der Detailseite sichtbar (getOrderDetail(), siehe
 * lastShippingError/lastConfirmationEmailError/lastInvoiceError dort) – in
 * der Bestellliste, wo der Admin-Alltag beginnt, gab es kein Signal. Ein
 * offenes Problem blieb unsichtbar, bis man jede Bestellung einzeln öffnete.
 *
 * `listOrders()` lädt jetzt EINEN zusätzlichen, auf die aktuelle Seite
 * beschränkten `order_events`-Query (kein N+1 – Performance-Audit vom selben
 * Datum) und leitet daraus `brauchtAufmerksamkeit` pro Zeile ab, mit
 * denselben drei Kategorien und derselben "noch ungelöst"-Logik wie auf der
 * Detailseite (Versandproblem nur relevant ohne tracking_number,
 * Bestätigungsproblem nur ohne order_confirmation_sent_at, Rechnungsproblem
 * unabhängig von invoice_number – siehe getOrderDetail()).
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts: Quelltext-Prüfung
 * statt Mocking des Supabase-Clients.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'src', 'lib', 'admin', 'data.ts');
const quelltext = readFileSync(DATA, 'utf8');

function funktionsRumpf(name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('listOrders lädt tracking_number und order_confirmation_sent_at mit, um "ungelöst" bestimmen zu können', () => {
  const rumpf = funktionsRumpf('listOrders');
  const selectIndex = rumpf.indexOf(".from('orders')");
  const selectEnde = rumpf.indexOf(');', selectIndex);
  const selectBlock = rumpf.slice(selectIndex, selectEnde);
  assert.match(selectBlock, /tracking_number/, 'wird gebraucht, um ein gelöstes Versandproblem zu erkennen');
  assert.match(
    selectBlock,
    /order_confirmation_sent_at/,
    'wird gebraucht, um ein gelöstes Bestätigungsproblem zu erkennen'
  );
});

test('listOrders fragt order_events GENAU EINMAL pro Seitenaufruf ab, nicht pro Zeile (kein N+1)', () => {
  const rumpf = funktionsRumpf('listOrders');
  const treffer = rumpf.match(/\.from\('order_events'\)/g) ?? [];
  assert.equal(
    treffer.length,
    1,
    'ein order_events-Query pro Zeile würde bei 50 Bestellungen 50 zusätzliche Roundtrips bedeuten – ' +
      'der Performance-Audit vom 2026-08-26 verlangt ausdrücklich EINEN gemeinsamen Query'
  );
  const queryIndex = rumpf.indexOf(".from('order_events')");
  const mapIndex = rumpf.indexOf('const zeilen = data.map(');
  assert.ok(queryIndex > 0 && mapIndex > 0 && queryIndex < mapIndex, 'der Query muss VOR dem .map() laufen, nicht darin');
});

test('listOrders prüft dieselben drei Ereigniskategorien wie getOrderDetail (kein Auseinanderlaufen der beiden Listen)', () => {
  const listRumpf = funktionsRumpf('listOrders');
  const detailRumpf = funktionsRumpf('getOrderDetail');
  const KATEGORIEN = [
    'shipping_label_failed',
    'shipping_label_partial_failure',
    'email_failed',
    'invoice_creation_failed',
    'invoice_creation_partial_failure',
    'invoice_accounting_marking_failed',
  ];
  for (const kategorie of KATEGORIEN) {
    assert.ok(listRumpf.includes(kategorie), `listOrders muss ${kategorie} prüfen`);
    assert.ok(detailRumpf.includes(kategorie), `getOrderDetail muss ${kategorie} prüfen (Referenz)`);
  }
});

test('brauchtAufmerksamkeit ignoriert bereits gelöste Versand-/Bestätigungsprobleme, aber nie Rechnungsprobleme', () => {
  const rumpf = funktionsRumpf('listOrders');
  const versandBlock = rumpf.slice(
    rumpf.indexOf("eventType === 'shipping_label_failed'"),
    rumpf.indexOf('} else if', rumpf.indexOf("eventType === 'shipping_label_failed'"))
  );
  assert.match(
    versandBlock,
    /!trackingByOrder\.get\(orderId\)/,
    'ein Versandproblem darf nur zählen, solange keine tracking_number gesetzt ist – sonst würde eine ' +
      'längst erledigte Bestellung dauerhaft als "braucht Aufmerksamkeit" markiert bleiben'
  );

  const bestaetigungIndex = rumpf.indexOf("eventType === 'email_failed'");
  const bestaetigungBlock = rumpf.slice(bestaetigungIndex, rumpf.indexOf('} else if', bestaetigungIndex));
  assert.match(bestaetigungBlock, /!bestaetigungByOrder\.get\(orderId\)/);

  const rechnungIndex = rumpf.indexOf("eventType === 'invoice_creation_failed'", bestaetigungIndex);
  const rechnungBlock = rumpf.slice(rechnungIndex, rumpf.indexOf('problemOrderIds.add(orderId);', rechnungIndex) + 40);
  assert.doesNotMatch(
    rechnungBlock,
    /invoiceNumber|invoice_number/,
    'ein Rechnungsproblem bleibt relevant, auch wenn invoice_number inzwischen gesetzt ist ' +
      '(z.B. invoice_accounting_marking_failed NACH erfolgreicher Rechnungserstellung) – ' +
      'dieselbe Regel wie auf der Detailseite'
  );
});

test('AdminOrderListRow enthält brauchtAufmerksamkeit als boolean, und die Zeile setzt es aus problemOrderIds', () => {
  const interfaceStart = quelltext.indexOf('export interface AdminOrderListRow');
  const interfaceEnde = quelltext.indexOf('}', interfaceStart);
  const interfaceBlock = quelltext.slice(interfaceStart, interfaceEnde);
  assert.match(interfaceBlock, /brauchtAufmerksamkeit: boolean;/);

  const rumpf = funktionsRumpf('listOrders');
  assert.match(rumpf, /brauchtAufmerksamkeit: problemOrderIds\.has\(row\.id as string\)/);
});
