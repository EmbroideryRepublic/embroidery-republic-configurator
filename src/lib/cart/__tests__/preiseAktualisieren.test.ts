/**
 * Warenkorb-Preise nach einer Preisänderung: Der Warenkorb zeigt nie einen Preis, den der Server nicht berechnen würde.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getProduct } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '@/lib/pricing/calculatePrice';
import { priceCartItem } from '@/lib/pricing/serverPricing';
import type { CartItem, ConfigElement } from '@/types';
import { berechnePreiseNeu } from '../preiseAktualisieren';

function logo(view: ConfigElement['view']): ConfigElement {
  return {
    id: `el-${view}`, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotation: 0, fileUrl: '', name: 'Logo',
    isOutOfBounds: false, locked: false, hidden: false, contentFillRatio: 0.85,
  } as unknown as ConfigElement;
}

function position(ueber: Partial<CartItem> = {}): CartItem {
  const p = getProduct('fotl-valueweight-t')!;
  return {
    id: 'pos-1', printMethod: 'dtf', productId: p.id, colorId: p.colors[0]!.id, sizeQuantities: { M: 6, L: 4 }, quantity: 10,
    elements: [logo('front'), logo('back')], unitPrice: 19.99, totalPrice: 199.9, setupTotal: 0, addedAt: 1, ...ueber,
  } as CartItem;
}

test('veraltete Position (Preis von vor der Anhebung) bekommt den aktuellen Preis – identisch zur Serverberechnung', async () => {
  const { items, geaendert } = await berechnePreiseNeu([position({ unitPrice: 18.99, totalPrice: 189.9 })]);
  assert.equal(geaendert, 1);
  const server = await priceCartItem(position());
  assert.equal(items[0]!.unitPrice, server.unitPrice);
  assert.equal(items[0]!.totalPrice, server.totalPrice);
  assert.ok(items[0]!.totalPrice > 189.9, 'nach der Anhebung teurer');
});

test('Position mit aktuellem Preis bleibt unverändert (gleiches Objekt, kein Hinweis)', async () => {
  const p = getProduct('fotl-valueweight-t')!;
  const regeln = await getPricingRules('dtf');
  const r = calculatePrice({ basePrice: p.basePrice, quantity: 10, elements: [logo('front'), logo('back')], pricingRules: regeln });
  const aktuell = position({ unitPrice: r.unitPrice, totalPrice: r.totalPrice, setupTotal: r.breakdown.setupTotal });
  const { items, geaendert } = await berechnePreiseNeu([aktuell]);
  assert.equal(geaendert, 0);
  assert.equal(items[0], aktuell);
});

test('idempotent: ein zweiter Lauf ändert nichts mehr', async () => {
  const erster = await berechnePreiseNeu([position({ unitPrice: 1, totalPrice: 10 })]);
  const zweiter = await berechnePreiseNeu(erster.items);
  assert.equal(erster.geaendert, 1);
  assert.equal(zweiter.geaendert, 0);
});

test('die Menge kommt aus den Größen (Mengenstaffel), nicht aus einer veralteten Mengenangabe', async () => {
  const { items } = await berechnePreiseNeu([position({ quantity: 1, sizeQuantities: { M: 30, L: 20 }, unitPrice: 5, totalPrice: 5 })]);
  const server = await priceCartItem(position({ sizeQuantities: { M: 30, L: 20 }, quantity: 50 }));
  assert.equal(items[0]!.totalPrice, server.totalPrice);
  assert.equal(items[0]!.unitPrice, server.unitPrice);
});

test('Kinderprodukt mit Kindergrößen wird ebenso neu gerechnet', async () => {
  const k = getProduct('kinder-bctk001')!;
  const { items, geaendert } = await berechnePreiseNeu([
    position({ productId: k.id, colorId: k.colors[0]!.id, sizeQuantities: { '3/4 (98/104)': 3, '5/6 (110/116)': 2 }, quantity: 5, unitPrice: 9.99, totalPrice: 49.95 }),
  ]);
  assert.equal(geaendert, 1);
  assert.ok(items[0]!.unitPrice > 9.99);
});

test('unbekanntes Produkt und leere Menge bleiben unangetastet, der Rest wird gerechnet', async () => {
  const unbekannt = position({ id: 'x', productId: 'gibt-es-nicht' });
  const leer = position({ id: 'y', sizeQuantities: {}, quantity: 0 });
  const veraltet = position({ id: 'z', unitPrice: 1, totalPrice: 10 });
  const { items, geaendert } = await berechnePreiseNeu([unbekannt, leer, veraltet]);
  assert.equal(geaendert, 1);
  assert.equal(items[0], unbekannt);
  assert.equal(items[1], leer);
  assert.notEqual(items[2]!.totalPrice, 10);
});

test('Warenkorb-Speicher rechnet nach dem Laden neu (per ID, ohne Zwischenzeitliches zu überschreiben); der Warenkorb sagt es', () => {
  const store = readFileSync('src/stores/cartStore.ts', 'utf8');
  assert.match(store, /onRehydrateStorage: \(\) => \(state\) =>/);
  assert.match(store, /berechnePreiseNeu\(vorher\)/);
  assert.match(store, /s\.items\.map\(\(i\) => neuePreise\.get\(i\.id\) \?\? i\)/);
  assert.match(store, /useWarenkorbHinweisStore\.getState\(\)\.setze\(geaendert\)/);
  const drawer = readFileSync('src/components/layout/CartDrawer.tsx', 'utf8');
  assert.match(drawer, /data-testid="preis-hinweis"/);
  assert.match(drawer, /preisHinweis > 0 && items\.length > 0/);
});
