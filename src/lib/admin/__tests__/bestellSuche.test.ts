/**
 * Absicherung, dass die Admin-Bestellsuche (listOrders) auch Bestell-,
 * Rechnungs- und Sendungsnummer findet, nicht nur Name/E-Mail/Firma.
 *
 * Möglich seit Migration 0036 (Bestellnummer-Jahreswechsel-Fix): order_number
 * ist jetzt eine persistierte, per ilike durchsuchbare Spalte statt eines
 * bei jedem Lesen aus der ID abgeleiteten Werts.
 *
 * Gleiche Teststrategie wie brauchtAufmerksamkeit.test.ts: Quelltext-Prüfung
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

test('listOrders durchsucht order_number, invoice_number und tracking_number zusätzlich zu Name/E-Mail/Firma', () => {
  const rumpf = funktionsRumpf('listOrders');
  const orBlock = rumpf.slice(rumpf.indexOf('query.or('), rumpf.indexOf(');', rumpf.indexOf('query.or(')));
  for (const feld of ['customer_name', 'email', 'company', 'order_number', 'invoice_number', 'tracking_number']) {
    assert.match(orBlock, new RegExp(`${feld}\\.ilike`), `${feld} muss Teil der .or()-Suche sein`);
  }
});

test('order_number, invoice_number und tracking_number sind im SELECT von listOrders enthalten (Voraussetzung für die Suche)', () => {
  const rumpf = funktionsRumpf('listOrders');
  const selectIndex = rumpf.indexOf(".from('orders')");
  const selectEnde = rumpf.indexOf(');', selectIndex);
  const selectBlock = rumpf.slice(selectIndex, selectEnde);
  for (const feld of ['order_number', 'invoice_number', 'tracking_number']) {
    assert.match(selectBlock, new RegExp(feld), `${feld} muss geladen werden`);
  }
});
