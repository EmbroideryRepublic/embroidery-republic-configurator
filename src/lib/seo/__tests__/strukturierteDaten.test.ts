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
import { supplierRefVon } from '@/lib/suppliers/supplierRefs';
import { produktTypLabel } from '@/config/products/types';
import { assetVerfuegbarkeit, PLATZHALTER_BILD } from '@/lib/assets';
import { brotkrumenSchema, kategorieBrotkrumenSchema, kategorieSchema, organisationSchema, produktSchema } from '../strukturierteDaten';
import { COMPANY } from '@/config/company';

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
  // Robust über den Asset-Resolver statt über die Katalog-Reihenfolge: ein
  // Produkt mit echten Fotos MUSS Bilder auszeichnen.
  const echtfoto = PRODUCTS.find((p) => assetVerfuegbarkeit(p.id) === 'vorhanden');
  assert.ok(echtfoto, 'Testannahme: mindestens ein Produkt hat echte Fotos');
  const s = produktSchema(echtfoto, BASIS) as { image?: string[] };
  assert.ok(s.image && s.image.length > 0);
  assert.ok(s.image.length <= 6);
  for (const url of s.image) assert.ok(url.startsWith(BASIS + '/'), url);
});

test('Platzhalter tauchen NIE in der JSON-LD-Auszeichnung auf (B1/ADR 0004)', () => {
  const platzhalterUrl = `${BASIS}${PLATZHALTER_BILD}`;
  for (const p of PRODUCTS) {
    const s = produktSchema(p, BASIS) as { image?: string[] };
    for (const url of s.image ?? []) {
      assert.notEqual(url, platzhalterUrl, `${p.name}: Platzhalter darf nicht in JSON-LD stehen`);
    }
    // Ein reines Platzhalter-Produkt zeichnet konsequent GAR kein Bild aus,
    // statt ein Platzhalterbild als Produktfoto zu behaupten.
    if (assetVerfuegbarkeit(p.id) === 'fehlt') {
      assert.equal(s.image, undefined, `${p.name}: ohne echtes Foto kein image-Feld`);
    }
  }
});

test('SKU erscheint nur, wenn eine Artikelnummer hinterlegt ist', () => {
  for (const p of PRODUCTS) {
    const s = produktSchema(p, BASIS);
    const ref = supplierRefVon(p.id);
    if (ref?.articleNumber) assert.equal(s['sku'], ref.articleNumber);
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
  const label = produktTypLabel(produkt.productType);
  const s = brotkrumenSchema(produkt, label, BASIS) as { itemListElement: Record<string, unknown>[] };
  assert.equal(s['@type' as never], 'BreadcrumbList' as never);
  assert.equal(s.itemListElement.length, 4);
  assert.deepEqual(s.itemListElement.map((e) => e['position']), [1, 2, 3, 4]);
  assert.equal(s.itemListElement[3]!['name'], produkt.name);
});

test('Organisationsschema nennt nur Belegtes – Adresse/Telefon/USt-IdNr. jetzt aus COMPANY, nicht erfunden', () => {
  const s = organisationSchema(BASIS);
  assert.deepEqual(s['@type'], ['Organization', 'LocalBusiness']);
  assert.equal(s['url'], BASIS);
  assert.ok(String(s['logo']).startsWith(BASIS + '/'));
  // Seit die Firmendaten real (nicht mehr Platzhalter) sind: identisch zu
  // COMPANY, derselben Quelle wie das Impressum – keine zweite Kopie.
  assert.equal(s['telephone'], COMPANY.phone);
  assert.deepEqual(s['address'], {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.street,
    postalCode: COMPANY.zip,
    addressLocality: COMPANY.city,
    addressCountry: 'DE',
  });
  assert.equal(s['vatID'], COMPANY.vatId);
});

test('Produkt-Brotkrume führt zur indexierbaren Kategorieseite, nicht zur noindex-Filteransicht', () => {
  const hoodie = PRODUCTS.find((p) => p.productType === 'hoodie')!;
  const s = brotkrumenSchema(hoodie, 'Hoodie', BASIS) as { itemListElement: Record<string, unknown>[] };
  assert.equal(s.itemListElement[2]!.item, `${BASIS}/hoodies-bedrucken-besticken`);
  assert.ok(s.itemListElement.every((e) => !String(e.item).includes('?kategorie=')), 'keine noindex-Filteradresse im Brotkrumenpfad');
});

test('Produktart OHNE Kategorieseite fällt auf die Filteransicht zurück (kein toter Link)', () => {
  const ohne = PRODUCTS.find((p) => !['hoodie', 'tshirt', 'polo'].includes(p.productType))!;
  const s = brotkrumenSchema(ohne, 'Art', BASIS) as { itemListElement: Record<string, unknown>[] };
  assert.equal(s.itemListElement[2]!.item, `${BASIS}/produkt?kategorie=${ohne.productType}`);
});

test('Kategorieschema: CollectionPage mit ItemList der gezeigten Produkte', () => {
  const produkte = PRODUCTS.slice(0, 3).map((p) => ({ name: p.name, id: p.id }));
  const s = kategorieSchema(BASIS, { slug: 'beispiel-seite', name: 'Beispiel', beschreibung: 'Text' }, produkte) as Record<string, any>;
  assert.equal(s['@type'], 'CollectionPage');
  assert.equal(s.url, `${BASIS}/beispiel-seite`);
  assert.equal(s.mainEntity.numberOfItems, 3);
  assert.deepEqual(s.mainEntity.itemListElement.map((e: any) => e.position), [1, 2, 3]);
  assert.equal(s.mainEntity.itemListElement[0].url, `${BASIS}/produkt/${produkte[0]!.id}`);
  assert.equal(s['aggregateRating'], undefined);
});

test('Kategorie-Brotkrume: Start → Kategorie', () => {
  const s = kategorieBrotkrumenSchema(BASIS, { slug: 'beispiel-seite', name: 'Beispiel' }) as { itemListElement: Record<string, unknown>[] };
  assert.deepEqual(s.itemListElement.map((e) => e.name), ['Start', 'Beispiel']);
  assert.equal(s.itemListElement[1]!.item, `${BASIS}/beispiel-seite`);
});
