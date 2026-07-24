/**
 * Tests der AUTORITATIVEN serverseitigen Preisberechnung (serverPricing.ts).
 *
 * Kernaussage: der vom Client übermittelte Preis (unitPrice/totalPrice) und
 * die Client-Menge (quantity) werden NIE übernommen – Preis/Menge entstehen
 * ausschließlich aus Katalog (basePrice) + Konfiguration (Elemente, Größen,
 * Veredelung). Manipulierte Client-Werte bleiben wirkungslos und werden über
 * die Abweichung erkennbar.
 *
 * Lädt den echten Produktkatalog + die echten Preisregeln (reine Config,
 * kein Browser/DB) und vergleicht gegen den identischen Rechenkern
 * (calculatePrice), den auch der Client nutzt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getProduct } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '../calculatePrice';
import { priceCart, priceCartItem, priceClaimDeviation, trustedQuantity } from '../serverPricing';
import type { CartItem } from '@/types';

const PRODUCT_ID = 'gildan-heavy-t';

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'i1',
    printMethod: 'dtf',
    productId: PRODUCT_ID,
    colorId: 'black',
    sizeQuantities: { M: 10 },
    quantity: 10,
    elements: [],
    // Bewusst „falsche" Client-Preise als Default – dürfen NIE durchschlagen.
    unitPrice: 999,
    totalPrice: 999,
    addedAt: 0,
    ...overrides,
  };
}

test('Serverpreis stimmt deckungsgleich mit dem Rechenkern (Katalog + Konfiguration)', async () => {
  const item = cartItem({ sizeQuantities: { M: 12 }, quantity: 12 });
  const rules = await getPricingRules('dtf');
  const expected = calculatePrice({
    basePrice: getProduct(PRODUCT_ID)!.basePrice,
    quantity: 12,
    elements: [],
    pricingRules: rules,
  });
  const server = await priceCartItem(item);
  assert.equal(server.priced, true);
  assert.equal(server.quantity, 12);
  assert.equal(server.unitPrice, expected.unitPrice);
  assert.equal(server.totalPrice, expected.totalPrice);
});

test('manipulierter Client-Preis wird IGNORIERT (Ergebnis unabhängig von unitPrice/totalPrice)', async () => {
  const honest = await priceCartItem(cartItem({ unitPrice: 50, totalPrice: 500 }));
  const manipulated = await priceCartItem(cartItem({ unitPrice: 0.01, totalPrice: 0.01 }));
  assert.equal(manipulated.totalPrice, honest.totalPrice, 'gleiche Konfiguration → gleicher Serverpreis');
  assert.ok(manipulated.totalPrice > 1, 'der 0,01-€-Client-Preis wird nicht übernommen');
});

test('Menge kommt aus den Größen-Mengen, NICHT aus dem (manipulierbaren) quantity-Feld', async () => {
  const item = cartItem({ sizeQuantities: { S: 3, M: 7 }, quantity: 99999 });
  const server = await priceCartItem(item);
  assert.equal(server.quantity, 10, 'Summe der Größen (3+7), nicht 99999');
  // Preis basiert auf 10 Stück, nicht auf 99999.
  const rules = await getPricingRules('dtf');
  const expected = calculatePrice({ basePrice: getProduct(PRODUCT_ID)!.basePrice, quantity: 10, elements: [], pricingRules: rules });
  assert.equal(server.totalPrice, expected.totalPrice);
});

test('unbekanntes Produkt ist nicht bepreisbar (priced=false, Preis 0)', async () => {
  const server = await priceCartItem(cartItem({ productId: 'gibt-es-nicht' }));
  assert.equal(server.priced, false);
  assert.equal(server.totalPrice, 0);
  assert.equal(server.unitPrice, 0);
});

test('priceCart summiert ausschließlich Serverpreise (Client-Summe irrelevant)', async () => {
  const cart: CartItem[] = [
    cartItem({ id: 'a', totalPrice: 1, sizeQuantities: { M: 10 }, quantity: 10 }),
    cartItem({ id: 'b', totalPrice: 2, sizeQuantities: { L: 6 }, quantity: 6 }),
  ];
  const res = await priceCart(cart);
  assert.equal(res.totalQuantity, 16);
  assert.equal(res.totalPrice, Math.round((res.items[0]!.totalPrice + res.items[1]!.totalPrice) * 100) / 100);
  assert.notEqual(res.totalPrice, 3, 'nicht die Client-Summe (1+2)');
  assert.deepEqual(res.unpriceable, []);
});

test('priceCart meldet unbepreisbare Positionen (unbekannte Produkte)', async () => {
  const res = await priceCart([cartItem(), cartItem({ id: 'x', productId: 'gibt-es-nicht' })]);
  assert.deepEqual(res.unpriceable, ['gibt-es-nicht']);
});

test('priceClaimDeviation erkennt eine manipulierte Preisbehauptung', () => {
  assert.ok(priceClaimDeviation(0.01, 250) > 0, 'Abweichung > 0 bei Manipulation');
  assert.equal(priceClaimDeviation(250, 250), 0, 'keine Abweichung bei ehrlichem Preis');
  assert.equal(priceClaimDeviation(NaN, 250), 250, 'unbrauchbare Behauptung wie 0 behandelt');
});

test('trustedQuantity ignoriert negative/nicht-numerische Größenmengen', () => {
  assert.equal(trustedQuantity({ S: 5, M: 3 }), 8);
  assert.equal(trustedQuantity({ S: -5, M: 3, L: Number.NaN }), 3);
  assert.equal(trustedQuantity(undefined), 0);
  assert.equal(trustedQuantity({}), 0);
});

// ── Blockierte Preise erreichen die Bestellschicht ────────────────────────
//
// `blocked` meldet, dass ein Preis NICHT belastbar ist (unbekannter
// Preisbaustein im Produktivbetrieb, fehlender Versandtarif, nicht
// einlösbarer Gutschein). Das Feld existierte bereits, wurde vom
// Bestellabschluss aber nie geprüft – eine Bestellung zu einem unsicheren
// Betrag wäre durchgelaufen. Diese Tests sichern die Meldekette ab.

test('priceCart meldet blocked, wenn für das Lieferland kein Versandtarif hinterlegt ist', async () => {
  const res = await priceCart([cartItem()], 'Fantasialand');
  assert.equal(res.shippingUnavailable, true, 'fehlender Tarif muss gemeldet werden');
  assert.equal(res.blocked, true, 'ein unbelastbarer Preis muss als blockiert gelten');
  assert.ok(res.issues.length > 0, 'der Grund muss benannt sein');
});

test('priceCart meldet einen belastbaren Preis NICHT als blockiert', async () => {
  const res = await priceCart([cartItem()], 'Deutschland');
  assert.equal(res.blocked, false);
  assert.equal(res.shippingUnavailable, false);
  assert.deepEqual(res.issues, []);
  assert.ok(res.totalPrice > 0);
});

test('ohne Lieferland (unverbindliche Anfrage) entsteht kein Versandposten und keine Blockade', async () => {
  const res = await priceCart([cartItem()]);
  assert.equal(res.blocked, false);
  assert.equal(res.shippingCost, 0);
});
