/**
 * Wächter für die Kinderbekleidung (Produktart "kids", scripts/importiereKinder.mts).
 *
 * Kinderware hat eigene Größenleitern (Körpergröße bzw. Alter, je nach Lieferantenschema), nur Vorder- und Rückansicht
 * und darf sich nie mit den Erwachsenen-Kategorien vermischen (Kategorieseiten, Zähler, „ab“-Preise, Navigation).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../index';
import { PRODUCTS as KINDER } from '../kinder.generated';
import { computeBasePrice } from '@/config/pricing/marginTiers';
import { KINDER_LEITERN, groessenLeiterVon, groessenRang } from '../groessen';
import { PRODUCT_TYPES } from '../productTypes';
import { naviGruppenVon } from '../naviAchsen';
import { geschlechterVon } from '../facetten';

test('es gibt Kinderprodukte, und alle gehören zur Produktart "kids"', () => {
  assert.ok(KINDER.length > 0, 'keine Kinderprodukte importiert');
  for (const p of KINDER) assert.equal(p.productType, 'kids', p.id);
  assert.deepEqual(PRODUCTS.filter((p) => p.productType === 'kids').map((p) => p.id), KINDER.map((p) => p.id));
});

test('Kinder-IDs sind eindeutig und tragen das Präfix kinder-', () => {
  const ids = KINDER.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^kinder-[a-z0-9]+$/, id);
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length, 'ID-Kollision mit dem übrigen Katalog');
});

test('jedes Kinderprodukt nennt eine Kindergrößen-Leiter, und seine Größen stehen in deren Ordnung (sortiert, ohne Dubletten)', () => {
  for (const p of KINDER) {
    assert.ok(p.sizeScale && p.sizeScale in KINDER_LEITERN, `${p.id}: sizeScale ${p.sizeScale}`);
    const leiter = groessenLeiterVon(p);
    assert.equal(leiter.id, p.sizeScale);
    assert.equal(new Set(p.sizes).size, p.sizes.length, `${p.id}: doppelte Größe`);
    for (const g of p.sizes) assert.ok(leiter.ordnung.includes(g.toUpperCase()), `${p.id}: Größe "${g}" nicht in ${leiter.id}`);
    const raenge = p.sizes.map((g) => groessenRang(g, leiter));
    assert.deepEqual([...raenge].sort((a, b) => a - b), raenge, `${p.id}: Größen nicht sortiert`);
  }
});

test('Kindergrößen-Leitern: Ordnung in Großbuchstaben (der Vergleich läuft über toUpperCase), ohne Dubletten, Referenz vorhanden', () => {
  for (const [id, leiter] of Object.entries(KINDER_LEITERN)) {
    assert.equal(leiter.id, id);
    assert.equal(new Set(leiter.ordnung).size, leiter.ordnung.length, `${id}: Dublette`);
    for (const g of leiter.ordnung) assert.equal(g, g.toUpperCase(), `${id}: "${g}" nicht in Großbuchstaben`);
    assert.ok(leiter.referenz && leiter.ordnung.includes(leiter.referenz), `${id}: Referenzgröße ${leiter.referenz} fehlt in der Ordnung`);
  }
});

test('Größentabelle deckt genau die angebotenen Größen ab, mit plausiblen Maßen (Kinder sind kleiner als Erwachsene)', () => {
  for (const p of KINDER) {
    const tabelle = p.sizeGuide?.measurements ?? [];
    assert.deepEqual(tabelle.map((m) => m.size).sort(), [...p.sizes].sort(), `${p.id}: Maßtabelle ≠ Größen`);
    for (const m of tabelle) {
      assert.ok(m.breiteCm >= 25 && m.breiteCm <= 56, `${p.id} ${m.size}: Breite ${m.breiteCm} cm unplausibel`);
      assert.ok(m.hoeheCm >= 32 && m.hoeheCm <= 75, `${p.id} ${m.size}: Länge ${m.hoeheCm} cm unplausibel`);
    }
    // größere Größe ⇒ nie schmaler/kürzer
    const leiter = groessenLeiterVon(p);
    const sortiert = [...tabelle].sort((a, b) => groessenRang(a.size, leiter) - groessenRang(b.size, leiter));
    for (let i = 1; i < sortiert.length; i++) {
      assert.ok(sortiert[i]!.breiteCm >= sortiert[i - 1]!.breiteCm, `${p.id}: Breite fällt bei ${sortiert[i]!.size}`);
      assert.ok(sortiert[i]!.hoeheCm >= sortiert[i - 1]!.hoeheCm, `${p.id}: Länge fällt bei ${sortiert[i]!.size}`);
    }
  }
});

test('nur Vorder- und Rückansicht (keine Ärmelfotos von Kinderware)', () => {
  for (const p of KINDER) assert.deepEqual(p.views, ['front', 'back'], p.id);
});

test('Preis: Einkaufspreis > 0, Grundpreis nach derselben Formel wie beim übrigen Katalog', () => {
  for (const p of KINDER) {
    assert.ok(p.purchasePrice > 0, p.id);
    assert.equal(p.basePrice, computeBasePrice(p.purchasePrice, p.qualityTier), p.id);
  }
});

test('Farben: eindeutige IDs, gültiger Hex, mindestens eine Farbe', () => {
  for (const p of KINDER) {
    assert.ok(p.colors.length > 0, p.id);
    assert.equal(new Set(p.colors.map((c) => c.id)).size, p.colors.length, `${p.id}: doppelte Farb-ID`);
    for (const c of p.colors) assert.match(c.hex, /^#[0-9A-F]{6}$/, `${p.id} ${c.name}`);
  }
});

test('Navigation: Kinderware landet NUR in der Gruppe „kinder“, Erwachsenenware nie dort', () => {
  for (const p of PRODUCTS) {
    const gruppen = naviGruppenVon(p);
    if (p.productType === 'kids') assert.deepEqual(gruppen, ['kinder'], p.id);
    else assert.ok(!gruppen.includes('kinder'), `${p.id} fälschlich unter Kinder`);
  }
});

test('Geschlechts-Facette: Kinderware ist „kinder“ und sonst nichts', () => {
  for (const p of KINDER) assert.deepEqual(geschlechterVon(p), ['kinder'], p.id);
  for (const p of PRODUCTS.filter((x) => x.productType !== 'kids')) {
    assert.ok(!geschlechterVon(p).includes('kinder'), `${p.id}: Erwachsenenware als „kinder“`);
  }
});

test('Produktart "kids": eigene Achse und Leiter im Register, keine Komplement-Verweise auf Erwachsenenarten', () => {
  const def = PRODUCT_TYPES.kids!;
  assert.equal(def.naviAchse, 'kinder');
  assert.ok(def.groessenLeiter in KINDER_LEITERN);
  assert.deepEqual(def.komplement, []);
  for (const [id, d] of Object.entries(PRODUCT_TYPES)) {
    if (id !== 'kids') assert.ok(!d.komplement.includes('kids'), `${id} verweist auf kids`);
  }
});

test('die Kleidungsart steht in detailedDescription.productType (die Produktart ist für alle Kinderware "kids")', () => {
  const erlaubt = new Set(['T-Shirt', 'Hoodie', 'Sweatshirt', 'Zip-Hoodie', 'Longsleeve']);
  for (const p of KINDER) assert.ok(erlaubt.has(p.detailedDescription?.productType ?? ''), `${p.id}: ${p.detailedDescription?.productType}`);
});
