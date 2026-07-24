/**
 * Prüfungen der strukturierten Daten.
 *
 * Zwei Dinge sind wichtig: die Auszeichnung muss gültig aufgebaut sein, und
 * sie darf nichts behaupten, was der Katalog nicht hergibt (keine erfundenen
 * Bewertungen, kein Festpreis, wo es einen Ab-Preis gibt).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import { brotkrumenSchema, organisationSchema, produktSchema } from '../strukturierteDaten';

const BASIS = 'https://example.test';
const produkt = PRODUCTS[0]!;

test('Produktschema trägt die Pflichtangaben', () => {
  const s = produktSchema(produkt, BASIS) as Record<string, never>;
  assert.equal(s['@type'], 'Product');
  assert.equal(s['name'], produkt.name as never);
  assert.deepEqual(s['brand'], { '@type': 'Brand', name: produkt.brand } as never);
  assert.ok(String(s['url']).startsWith(BASIS + '/produkt/'));
});

test('Preis wird als Ab-Preis ausgezeichnet, nicht als Festpreis', () => {
  const s = produktSchema(produkt, BASIS) as { offers: Record<string, unknown> };
  assert.equal(s.offers['@type'], 'AggregateOffer', 'ein einzelner Offer behauptete einen Festpreis');
  assert.equal(s.offers['lowPrice'], produkt.basePrice);
  assert.equal(s.offers['priceCurrency'], 'EUR');
  assert.equal(s.offers['price'], undefined, 'kein Festpreis-Feld');
});

test('keine erfundenen Bewertungen', () => {
  for (const p of PRODUCTS) {
    const s = produktSchema(p, BASIS);
    assert.equal(s['aggregateRating'], undefined, `${p.name}`);
    assert.equal(s['review'], undefined, `${p.name}`);
  }
});

test('Bilder sind absolute URLs und begrenzt', () => {
  const s = produktSchema(produkt, BASIS) as { image?: string[] };
  assert.ok(s.image && s.image.length > 0);
  assert.ok(s.image.length <= 6);
  for (const url of s.image) assert.ok(url.startsWith(BASIS + '/'), url);
});

test('SKU erscheint nur, wenn eine Artikelnummer hinterlegt ist', () => {
  for (const p of PRODUCTS) {
    const s = produktSchema(p, BASIS);
    if (p.supplier?.articleNumber) assert.equal(s['sku'], p.supplier.articleNumber);
    else assert.equal(s['sku'], undefined, `${p.name} hat keine Artikelnummer`);
  }
});

test('jedes Produkt liefert eine gültige Verfügbarkeit', () => {
  const erlaubt = [
    'https://schema.org/InStock',
    'https://schema.org/OutOfStock',
    'https://schema.org/Discontinued',
  ];
  for (const p of PRODUCTS) {
    const s = produktSchema(p, BASIS) as { offers: Record<string, unknown> };
    assert.ok(erlaubt.includes(String(s.offers['availability'])), `${p.name}`);
  }
});

test('Brotkrumen laufen von Start bis zum Produkt', () => {
  const label = PRODUCT_TYPE_LABELS[produkt.productType];
  const s = brotkrumenSchema(produkt, label, BASIS) as { itemListElement: Record<string, unknown>[] };
  assert.equal(s['@type' as never], 'BreadcrumbList' as never);
  assert.equal(s.itemListElement.length, 4);
  assert.deepEqual(s.itemListElement.map((e) => e['position']), [1, 2, 3, 4]);
  assert.equal(s.itemListElement[3]!['name'], produkt.name);
});

test('Organisationsschema nennt nur Belegtes', () => {
  const s = organisationSchema(BASIS);
  assert.equal(s['@type'], 'Organization');
  assert.equal(s['url'], BASIS);
  assert.ok(String(s['logo']).startsWith(BASIS + '/'));
  // Keine Kontaktdaten erfinden – die stehen im Impressum.
  assert.equal(s['telephone'], undefined);
  assert.equal(s['address'], undefined);
});
