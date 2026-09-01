/**
 * Regressionstest für die E-Mail-Konsolidierung (Fund vom 2026-09-01, echter
 * PayPal-Live-Test) UND die ausdrückliche Anforderung danach: Der Text darf
 * NIEMALS behaupten, eine Rechnung sei angehängt, wenn tatsächlich keine
 * angehängt wird. Prüft den tatsächlich gerenderten Text (nicht nur den
 * Quelltext) – dieselbe Bibliothek (@react-email/render), die auch
 * sendEmail.ts zum echten Versand nutzt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../templates/OrderConfirmationEmail';
import type { OrderRecord, RechnungFuerEmail } from '@/lib/actions/orderTypes';

const bestellung: OrderRecord = {
  id: 'test-order-1',
  orderNumber: 'ER-2026-TEST01',
  orderType: 'order',
  createdAt: new Date().toISOString(),
  contact: { name: 'Max Mustermann', company: undefined, email: 'max@example.invalid', phone: undefined },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'paypal',
  subtotal: 22.99,
  shippingCost: 6.9,
  totalPrice: 29.89,
  taxAmount: 0,
  taxRate: 0,
  netTotal: 29.89,
  items: [
    {
      productName: 'Heavy T',
      colorName: 'Weiß',
      quantity: 1,
      totalPrice: 22.99,
      sizeQuantities: { M: 1 },
      printMethod: 'dtf',
      elements: [],
    } as unknown as OrderRecord['items'][number],
  ],
};

const rechnung: RechnungFuerEmail = {
  rechnungsnummer: 'RE-2026-000005',
  rechnungsdatum: '2026-09-01',
  pdf: Buffer.from('%PDF-1.4 Testinhalt'),
  zahlungszielTage: 0,
};

test('OHNE rechnung-Prop behauptet der Text NICHT, eine Rechnung sei angehängt (PayPal/Karte)', async () => {
  const text = await render(OrderConfirmationEmail({ order: bestellung }), { plainText: true });
  assert.doesNotMatch(text, /Anhang/i);
  assert.match(text, /Rechnung erhalten Sie in Kürze/);
});

test('MIT rechnung-Prop nennt der Text Rechnungsnummer und Anhang (PayPal/Karte)', async () => {
  const text = await render(OrderConfirmationEmail({ order: bestellung, rechnung }), { plainText: true });
  assert.match(text, /RE-2026-000005/);
  assert.match(text, /Anhang dieser E-Mail/);
  assert.match(text, /Zahlung eingegangen/);
});

test('OHNE rechnung-Prop behauptet der Text NICHT, eine Rechnung sei angehängt (Rechnungskauf)', async () => {
  const text = await render(OrderConfirmationEmail({ order: { ...bestellung, paymentMethod: 'invoice' } }), {
    plainText: true,
  });
  assert.doesNotMatch(text, /Anhang/i);
  assert.match(text, /separat mit der Auftragsbearbeitung/);
});

test('MIT rechnung-Prop nennt der Text bei Rechnungskauf ebenfalls den Anhang statt "separat"', async () => {
  const text = await render(OrderConfirmationEmail({ order: { ...bestellung, paymentMethod: 'invoice' }, rechnung }), {
    plainText: true,
  });
  assert.match(text, /RE-2026-000005/);
  assert.match(text, /Anhang dieser E-Mail/);
  assert.doesNotMatch(text, /separat mit der Auftragsbearbeitung/);
});

test('die Lieferadresse erscheint vollständig im Text', async () => {
  const text = await render(OrderConfirmationEmail({ order: bestellung }), { plainText: true });
  assert.match(text, /Max Mustermann/);
  assert.match(text, /Musterstraße 1/);
  assert.match(text, /12345/);
  assert.match(text, /Musterstadt/);
});

test('ein leerer Rechnungs-PDF-Puffer wird von sendOrderConfirmationEmail NICHT als Anhang/Text-Erwähnung durchgereicht', () => {
  // Quelltext-Prüfung (nicht mockbar ohne Resend-Zugangsdaten): beide
  // Verwendungsstellen (Text-Prop UND attachments) müssen aus DERSELBEN
  // geprüften Variable lesen, nie direkt aus dem ungeprüften `rechnung`-
  // Parameter.
  const inhalt = readFileSync(path.join(process.cwd(), 'src', 'lib', 'email', 'orderEmails.tsx'), 'utf8');
  assert.match(inhalt, /pdf\.length > 0/, 'ein leerer PDF-Puffer muss explizit ausgeschlossen werden');
  assert.doesNotMatch(
    inhalt,
    /rechnung=\{rechnung\s*\?\?/,
    'die Text-Prop darf nicht mehr aus dem ungeprüften Parameter gespeist werden'
  );
  assert.doesNotMatch(
    inhalt,
    /\.\.\.\(rechnung\s*\?/,
    'die attachments dürfen nicht mehr aus dem ungeprüften Parameter gespeist werden'
  );
});
