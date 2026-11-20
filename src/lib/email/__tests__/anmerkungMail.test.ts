/**
 * Anmerkung der Kundschaft in den E-Mails: interne Benachrichtigung (violett, „bitte lesen“, Betreff-Hinweis) und
 * Bestellbestätigung an die Kundschaft (Anmerkung wird zurückgespiegelt).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@react-email/render';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { OrderConfirmationEmail } from '../templates/OrderConfirmationEmail';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';

const ANMERKUNG = 'Bitte bis Freitag liefern.\nMotiv bitte etwas weiter links.';

const bestellung: OrderRecord = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  orderNumber: 'ER-2026-A1B2C3',
  orderType: 'order',
  createdAt: '2026-11-11T10:00:00.000Z',
  contact: { name: 'Max Mustermann', company: 'Mustermann GmbH', email: 'max@example.invalid', phone: '0170 1234567' },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'invoice',
  message: ANMERKUNG,
  subtotal: 100,
  shippingCost: 0,
  totalPrice: 119,
  taxAmount: 19,
  taxRate: 19,
  netTotal: 100,
  items: [
    {
      productId: 'fotl-heavy-t',
      colorId: 'navy',
      productName: 'Heavy T',
      colorName: 'Navy',
      printMethod: 'dtf',
      sizeQuantities: { M: 2, L: 3 },
      quantity: 5,
      unitPrice: 20,
      totalPrice: 100,
      elements: [{ type: 'logo', view: 'front', xCm: 5, yCm: 5, widthCm: 8, heightCm: 8, rotationDeg: 0, fileName: 'logo.png' }],
    },
  ],
};

test('interne Mail: Anmerkung steht violett hervorgehoben mit „bitte lesen“', async () => {
  const html = await render(InternalOrderNotificationEmail({ order: bestellung, productionSheetSignedUrl: null }));
  assert.ok(html.includes('Anmerkung der Kundschaft – bitte lesen'), 'Überschrift fehlt');
  assert.ok(html.includes('Bitte bis Freitag liefern.'), 'Text fehlt');
  assert.ok(html.includes('Motiv bitte etwas weiter links.'), 'zweite Zeile fehlt');
  assert.ok(html.includes('#7c3aed'), 'violette Umrandung fehlt');
  assert.ok(html.includes('white-space:pre-wrap'), 'Zeilenumbrüche würden verloren gehen');
});

test('interne Mail bei einer Anfrage nennt es „Nachricht“ statt „Anmerkung“', async () => {
  const html = await render(InternalOrderNotificationEmail({ order: { ...bestellung, orderType: 'inquiry' }, productionSheetSignedUrl: null }));
  assert.ok(html.includes('Nachricht der Kundschaft'));
  assert.ok(!html.includes('Anmerkung der Kundschaft'));
});

test('ohne Anmerkung kein Kasten in der internen Mail', async () => {
  const html = await render(InternalOrderNotificationEmail({ order: { ...bestellung, message: undefined }, productionSheetSignedUrl: null }));
  assert.ok(!html.includes('der Kundschaft – bitte lesen'));
  assert.ok(!html.includes('#7c3aed'));
});

test('HTML in der Anmerkung wird als Text ausgegeben, nicht ausgeführt', async () => {
  const html = await render(
    InternalOrderNotificationEmail({ order: { ...bestellung, message: '<script>alert(1)</script>' }, productionSheetSignedUrl: null })
  );
  assert.ok(!html.includes('<script>alert(1)</script>'), 'Skript ungeschützt in der Mail');
  assert.ok(html.includes('&lt;script&gt;'), 'Skript nicht als Text maskiert');
});

test('Bestellbestätigung spiegelt die Anmerkung an die Kundschaft zurück', async () => {
  const html = await render(OrderConfirmationEmail({ order: bestellung }));
  assert.ok(html.includes('Ihre Anmerkung zur Bestellung'), 'Überschrift fehlt');
  assert.ok(html.includes('Bitte bis Freitag liefern.'), 'Text fehlt');
});

test('Bestellbestätigung ohne Anmerkung zeigt den Block nicht', async () => {
  const html = await render(OrderConfirmationEmail({ order: { ...bestellung, message: undefined } }));
  assert.ok(!html.includes('Ihre Anmerkung zur Bestellung'));
});
