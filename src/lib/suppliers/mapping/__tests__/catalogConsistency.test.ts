/**
 * Integrations-/Regressionstest: jede Farbe und Größe, die ein
 * KATALOGPRODUKT mit hinterlegtem Lieferanten tatsächlich verwendet, muss
 * in der Variantentabelle dieses Lieferanten existieren.
 *
 * Zweck: Wird künftig ein Produkt mit einer neuen Farbe/Größe aufgenommen,
 * ohne die zugehörige Mapping-Tabelle zu pflegen, schlägt dieser Test fehl –
 * BEVOR die Lücke erst zur Laufzeit (mitten in der Browser-Automatisierung)
 * als SupplierMappingError auffällt.
 *
 * Anders als mapping.test.ts lädt dieser Test den echten Produktkatalog
 * (über den @/-Alias) – er bleibt aber reines TS ohne Browser/DB.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PRODUCTS } from '@/config/products';
import { getVariantMap } from '../registry';
import { isColorSupported, isSizeSupported } from '../resolve';
import {
  buildCatalogSupplierStatus,
  productsWithoutSupplier,
  type CoverageProduct,
} from '..';

/** Katalog → schlanke Coverage-Sicht (wie im Coverage-Script). */
const coverageProducts: CoverageProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  supplierId: p.supplier?.supplierId,
  colorIds: p.colors.map((c) => c.id),
  sizes: p.sizes,
}));

test('jede von einem Produkt genutzte Farbe existiert in der Lieferantentabelle', () => {
  const missing: string[] = [];
  for (const product of PRODUCTS) {
    if (!product.supplier) continue;
    const map = getVariantMap(product.supplier.supplierId);
    for (const color of product.colors) {
      if (!isColorSupported(map, color.id)) {
        missing.push(`${product.supplier.supplierId}: Farbe "${color.id}" (Produkt ${product.id})`);
      }
    }
  }
  assert.deepEqual(missing, [], `Fehlende Farb-Mappings:\n${missing.join('\n')}`);
});

test('jede von einem Produkt genutzte Größe existiert in der Lieferantentabelle', () => {
  const missing: string[] = [];
  for (const product of PRODUCTS) {
    if (!product.supplier) continue;
    const map = getVariantMap(product.supplier.supplierId);
    for (const size of product.sizes) {
      if (!isSizeSupported(map, size)) {
        missing.push(`${product.supplier.supplierId}: Größe "${size}" (Produkt ${product.id})`);
      }
    }
  }
  assert.deepEqual(missing, [], `Fehlende Größen-Mappings:\n${missing.join('\n')}`);
});

// ── Selbst-Integration neuer Produkte (Standing-Check) ───────────────────

test('Katalog-Integrationsstatus deckt JEDES Produkt ab (kein stilles Verschlucken)', () => {
  const status = buildCatalogSupplierStatus(coverageProducts);
  assert.equal(status.totalProducts, PRODUCTS.length, 'alle Katalogprodukte gezählt');
  // Jedes Produkt ist entweder zugeordnet ODER als „ohne Lieferant" gelistet –
  // ein neu aufgenommenes Produkt fällt so garantiert nicht durchs Raster.
  assert.equal(status.withSupplier + status.withoutSupplier.length, PRODUCTS.length);
});

test('Produkte ohne Lieferantenzuordnung werden vollständig aufgelistet (auto-Aufgabe)', () => {
  const surfaced = productsWithoutSupplier(coverageProducts);
  const expected = PRODUCTS.filter((p) => !p.supplier)
    .map((p) => p.id)
    .sort();
  // Genau die supplier-losen Produkte erscheinen – so wird ein neues, noch
  // nicht zugeordnetes Produkt automatisch als offene Aufgabe sichtbar.
  assert.deepEqual(surfaced, expected);
});
