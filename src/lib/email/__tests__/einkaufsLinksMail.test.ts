/**
 * Interne Bestell-Mail und Admin-Ansicht: „Ware bestellen – Direktlinks“ je Position.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@react-email/render';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';
import { EinkaufsLinks } from '@/components/admin/EinkaufsLinks';

const position = (productId: string, productName: string) => ({
  productId,
  colorId: 'navy',
  productName,
  colorName: 'Navy',
  printMethod: 'dtf' as const,
  sizeQuantities: { M: 2, L: 3 },
  quantity: 5,
  unitPrice: 20,
  totalPrice: 100,
  elements: [{ type: 'logo' as const, view: 'front' as const, xCm: 5, yCm: 5, widthCm: 8, heightCm: 8, rotationDeg: 0, fileName: 'logo.png' }],
});

const bestellung: OrderRecord = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  orderNumber: 'ER-2026-A1B2C3',
  orderType: 'order',
  createdAt: '2026-11-11T10:00:00.000Z',
  contact: { name: 'Max Mustermann', email: 'max@example.invalid' },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'invoice',
  subtotal: 100,
  shippingCost: 0,
  totalPrice: 100,
  items: [position('fotl-heavy-t', 'Heavy T')],
} as OrderRecord;

/** React-Email fügt zwischen Textteilen unsichtbare Kommentarmarken ein; für Textvergleiche entfernen. */
const ohneMarken = (html: string) => html.replace(/<!-- -->/g, '');

test('interne Mail enthält je Position Artikelnummer, Farbe, Größen und die Direktlinks', async () => {
  const html = ohneMarken(await render(InternalOrderNotificationEmail({ order: bestellung, productionSheetSignedUrl: null })));
  assert.ok(html.includes('Ware bestellen – Direktlinks'), 'Überschrift fehlt');
  assert.ok(html.includes('Art.-Nr. F182'), 'Artikelnummer fehlt');
  assert.ok(html.includes('Farbe: Navy'), 'Farbe fehlt');
  assert.ok(html.includes('M×2, L×3'), 'Größen fehlen');
  assert.ok(html.includes('href="https://www.textil-grosshandel.eu/heavy-cotton-t/f182"'), 'Textil-Großhandel-Link fehlt');
  assert.ok(html.includes('searchparam=F182'), 'L-Shop-Link fehlt');
});

test('interne Mail: Produkt ohne Lieferantenseite zeigt den Hinweis statt eines toten Links', async () => {
  const order = { ...bestellung, items: [position('russell-mens-pure-organic-heavy-tee', 'Pure Organic Heavy Tee')] } as OrderRecord;
  const html = ohneMarken(await render(InternalOrderNotificationEmail({ order, productionSheetSignedUrl: null })));
  assert.ok(html.includes('nicht gelistet'), 'Hinweis fehlt');
  assert.ok(!html.includes('/marken/'), 'Umleitung auf Markenseite darf nicht verlinkt werden');
});

test('bei einer Anfrage gibt es keinen Einkaufsblock', async () => {
  const html = await render(InternalOrderNotificationEmail({ order: { ...bestellung, orderType: 'inquiry' }, productionSheetSignedUrl: null }));
  assert.ok(!html.includes('Ware bestellen – Direktlinks'));
});

test('Admin-Komponente: Links öffnen in neuem Tab, Positionen mit Größen und Hinweis', () => {
  const html = renderToStaticMarkup(
    createElement(EinkaufsLinks, {
      items: [
        { productId: 'fotl-heavy-t', productName: 'Heavy T', colorName: 'Navy', sizeQuantities: { M: 2, L: 3 }, quantity: 5 },
        { productId: 'russell-mens-pure-organic-heavy-tee', productName: 'Pure Organic', colorName: 'Black', sizeQuantities: { L: 1 }, quantity: 1 },
      ],
    })
  );
  assert.ok(html.includes('data-testid="einkaufs-links"'));
  assert.ok(html.includes('target="_blank"') && html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('Textil-Großhandel öffnen') && html.includes('L-Shop öffnen'));
  assert.ok(html.includes('M×2, L×3') && html.includes('Art.-Nr. F182'));
  assert.ok(html.includes('nicht gelistet'));
});

test('Admin-Komponente ohne Positionen zeigt nichts', () => {
  assert.equal(renderToStaticMarkup(createElement(EinkaufsLinks, { items: [] })), '');
});
