/**
 * Anmerkung der Kundschaft im Adminbereich: Darstellung (Komponente) und Einbindung (Liste, Detailseite, Checkout).
 *
 * Die Einbindungs-Prüfungen lesen den Quelltext (wie brauchtAufmerksamkeit.test.ts): Sie schützen davor, dass die Markierung
 * bei einem späteren Umbau still verschwindet – dann würde eine Kundenanmerkung wieder untergehen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KundenAnmerkung, anmerkungTitel } from '../KundenAnmerkung';

/** Zeilenenden vereinheitlicht: unter Windows liegen die Dateien oft mit CRLF vor. */
const quelle = (pfad: string) => readFileSync(join(process.cwd(), pfad), 'utf8').replace(/\r\n/g, '\n');

test('Titel: Anmerkung bei einer Bestellung, Nachricht bei einer Anfrage', () => {
  assert.equal(anmerkungTitel('order'), 'Anmerkung der Kundschaft');
  assert.equal(anmerkungTitel('inquiry'), 'Nachricht der Kundschaft');
});

test('Komponente: violetter Kasten mit „bitte lesen“, Zeilenumbrüche bleiben erhalten', () => {
  const html = renderToStaticMarkup(createElement(KundenAnmerkung, { text: 'Zeile 1\nZeile 2', orderType: 'order' }));
  assert.ok(html.includes('data-testid="kunden-anmerkung"'));
  assert.ok(html.includes('border-violet-500') && html.includes('bg-violet-50'), 'violette Hervorhebung fehlt');
  assert.ok(html.includes('Anmerkung der Kundschaft – bitte lesen'));
  assert.ok(html.includes('whitespace-pre-wrap'), 'Zeilenumbrüche würden verloren gehen');
  assert.ok(html.includes('Zeile 1\nZeile 2'));
});

test('Komponente: HTML in der Anmerkung wird maskiert', () => {
  const html = renderToStaticMarkup(createElement(KundenAnmerkung, { text: '<img src=x onerror=alert(1)>', orderType: 'order' }));
  assert.ok(!html.includes('<img'), 'ungeschütztes HTML');
  assert.ok(html.includes('&lt;img'));
});

test('Bestellliste: Zeile getönt, Marke und Textanfang, Daten kommen aus message', () => {
  const seite = quelle('src/app/admin/page.tsx');
  assert.ok(seite.includes("order.anmerkung ? 'bg-violet-50'"), 'Zeilentönung fehlt');
  assert.ok(seite.includes('data-testid="anmerkung-marke"'), 'Marke fehlt');
  assert.ok(seite.includes('border-l-violet-500'), 'Seitenbalken fehlt');
  const daten = quelle('src/lib/admin/data.ts');
  assert.ok(/'id, created_at, order_type, customer_name, company, email, message,/.test(daten), 'message wird für die Liste nicht geladen');
  assert.ok(daten.includes('anmerkung: bereinigeAnmerkung(row.message) ?? null'), 'Zeile bekommt die Anmerkung nicht');
});

test('Detailseite: Kasten direkt unter dem Kopf, die kleine graue Zeile ist entfallen', () => {
  const seite = quelle('src/app/admin/bestellung/[id]/page.tsx');
  assert.ok(seite.includes('<KundenAnmerkung'), 'Kasten fehlt');
  assert.ok(seite.indexOf('<KundenAnmerkung') < seite.indexOf('<OrderStatusControl'), 'Kasten steht nicht über der Statussteuerung');
  assert.ok(!seite.includes('order.message && <p className="pt-2 text-xs text-gray-500">'), 'alte graue Zeile noch da (doppelt)');
});

test('Checkout: Notizfeld mit Grenze, wird mit der Bestellung gesendet; auch das Anfrageformular ist begrenzt', () => {
  const drawer = quelle('src/components/layout/CartDrawer.tsx');
  assert.equal((drawer.match(/maxLength=\{ANMERKUNG_MAX_ZEICHEN\}/g) ?? []).length, 2, 'beide Textfelder brauchen die Grenze');
  assert.ok(drawer.includes('message: form.message,\n        clientRequestId,'), 'Anmerkung wird nicht mit der Bestellung gesendet');
  assert.ok(drawer.includes("t('checkout_note_label')"));
});

test('Server: Bestellung gibt die bereinigte Anmerkung an die Verarbeitung weiter', () => {
  const orders = quelle('src/lib/actions/orders.ts');
  assert.equal((orders.match(/message: bereinigeAnmerkung\(input\.message\)/g) ?? []).length, 2, 'Bestellung UND Anfrage');
  assert.ok(orders.includes('message: params.message,\n  });\n  if (!validierung.valid)'), 'Länge wird nicht geprüft');
});
