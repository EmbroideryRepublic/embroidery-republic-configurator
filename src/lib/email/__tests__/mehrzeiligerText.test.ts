/**
 * Ein Text mit Zeilenumbruch ("Team " ⏎ "Schüplitz") bleibt in der Mail an den
 * Betreiber zweizeilig. HTML fasst einen einfachen Umbruch sonst zu einem
 * Leerzeichen zusammen – die Mail zeigte "Team Schüplitz", obwohl die Kundschaft
 * zwei Zeilen gewählt hatte (Bestellung ER-2026-F5EE03).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@react-email/render';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';
import type { OrderRecord } from '@/lib/actions/orderTypes';

function bestellung(content: string): OrderRecord {
  return {
    id: 'test-order-zeilen',
    orderNumber: 'ER-2026-ZEILEN',
    orderType: 'order',
    createdAt: '2026-11-08T10:00:00.000Z',
    contact: { name: 'Max Mustermann', email: 'max@example.invalid' },
    shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
    paymentMethod: 'invoice',
    subtotal: 37.99,
    shippingCost: 0,
    totalPrice: 37.99,
    items: [
      {
        productId: 'justhoods-college-hoodie',
        colorId: 'grey',
        productName: 'College Hoodie',
        colorName: 'Grau',
        printMethod: 'dtf',
        sizeQuantities: { M: 1 },
        quantity: 1,
        unitPrice: 37.99,
        totalPrice: 37.99,
        elements: [
          {
            type: 'text',
            view: 'back',
            xCm: 4.5,
            yCm: 3.1,
            widthCm: 20.9,
            heightCm: 11.4,
            rotationDeg: 0,
            content,
            fontFamily: 'Impact',
            color: '#5c5c5c',
          },
        ],
      },
    ],
  };
}

function mail(order: OrderRecord, plainText: boolean): Promise<string> {
  const vorlage = InternalOrderNotificationEmail({ order, productionSheetSignedUrl: null });
  return plainText ? render(vorlage, { plainText: true }) : render(vorlage);
}

test('Zweizeiliger Text steht in der Betreiber-Mail auf zwei Zeilen, mit Hinweis auf die Zeilenzahl', async () => {
  const text = await mail(bestellung('Team \nSchüplitz'), true);
  assert.match(text, /Text „Team\s*\n\s*Schüplitz“/, 'zwischen "Team" und "Schüplitz" liegt ein Zeilenumbruch');
  assert.doesNotMatch(text, /Team Schüplitz/);
  assert.match(text, /2 Zeilen/);
  assert.match(text, /20,9 × 11,4 cm/);

  // Im HTML ein echter Umbruch (<br>) – ein einfaches "\n" würde der Mailleser zu einem Leerzeichen.
  const html = (await mail(bestellung('Team \nSchüplitz'), false)).replace(/<!-- -->/g, '');
  assert.match(html, /Text „Team <br\/?>Schüplitz“/);
});

test('Einzeiliger Text bleibt wie bisher: kein Umbruch, kein Zeilenhinweis', async () => {
  const text = await mail(bestellung('Muster Sport'), true);
  assert.match(text, /Text „Muster Sport“/);
  assert.doesNotMatch(text, /\d Zeilen/);
  const html = (await mail(bestellung('Muster Sport'), false)).replace(/<!-- -->/g, '');
  assert.doesNotMatch(html, /Text „Muster Sport<br/);
});

test('Drei Zeilen werden gezählt und getrennt dargestellt, Windows-Zeilenumbrüche zählen wie Unix', async () => {
  const text = await mail(bestellung('Eins\r\nZwei\nDrei'), true);
  assert.match(text, /Text „Eins\s*\n\s*Zwei\s*\n\s*Drei“/);
  assert.match(text, /3 Zeilen/);
});
