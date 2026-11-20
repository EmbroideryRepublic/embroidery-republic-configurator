/**
 * Interne Bestell-Mail und Produktionsblatt: Die Produktion bekommt die ECHTEN flachen Maße (DTF vorne/hinten), nicht die im Foto
 * gezeichnete Breite – das Foto zeigt die Brust gewölbt (config/abwicklung.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@react-email/render';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';
import { getPrintAreasSync, flaecheFuerGroesse } from '@/config/printAreas';
import { echteMasseJeElement } from '@/config/echteMasse';

const PRODUKT = 'justhoods-college-hoodie';
const ohneMarken = (html: string) => html.replace(/<!-- -->/g, '');

const flaeche = flaecheFuerGroesse(getPrintAreasSync(PRODUKT, 'dtf').find((a) => a.view === 'front')!, 'M');
const breite = 30;
const x = (flaeche.boxWidthCm - breite) / 2;

function bestellung(view: 'front' | 'sleeve_left', methode: 'dtf' | 'embroidery' = 'dtf'): OrderRecord {
  return {
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
    items: [
      {
        productId: PRODUKT,
        colorId: 'grey',
        productName: 'College Hoodie',
        colorName: 'Grau',
        printMethod: methode,
        sizeQuantities: { M: 4 },
        quantity: 4,
        unitPrice: 30,
        totalPrice: 120,
        elements: [{ type: 'logo' as const, view, xCm: x, yCm: 4, widthCm: breite, heightCm: 20, rotationDeg: 0, fileName: 'logo.png' }],
      },
    ],
  } as OrderRecord;
}

test('interne Mail nennt bei DTF vorne das echte flache Maß und das gezeichnete dazu', async () => {
  const echt = echteMasseJeElement(bestellung('front').items[0]!)[0]!;
  assert.ok(echt.breiteCm > 30, 'abgewickelt breiter als gezeichnet');
  const html = ohneMarken(await render(InternalOrderNotificationEmail({ order: bestellung('front'), productionSheetSignedUrl: null })));
  const text = echt.breiteCm.toFixed(1).replace('.', ',');
  assert.ok(html.includes(`${text} × 20,0 cm (echtes Maß, flach; im Foto 30,0 × 20,0 cm)`), `Maß fehlt – erwartet ${text} × 20,0 cm`);
});

test('Ärmel und Stickerei bleiben beim gezeichneten Maß (keine Abwicklung)', async () => {
  const sleeve = ohneMarken(await render(InternalOrderNotificationEmail({ order: bestellung('sleeve_left'), productionSheetSignedUrl: null })));
  assert.ok(sleeve.includes('30,0 × 20,0 cm'));
  assert.ok(!sleeve.includes('echtes Maß'));
  const stick = ohneMarken(await render(InternalOrderNotificationEmail({ order: bestellung('front', 'embroidery'), productionSheetSignedUrl: null })));
  assert.ok(!stick.includes('echtes Maß'));
});
