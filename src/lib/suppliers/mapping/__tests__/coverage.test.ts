/**
 * Tests des Abdeckungs-Reports (buildSupplierMappingCoverage).
 *
 * Prüft die Klassifikation verified / unverified / missing je genutzter
 * Farbe/Größe und dass produktspezifische Overrides berücksichtigt werden.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { SupplierId } from '../../types';
import type { SupplierVariantMap } from '../types';
import {
  buildSupplierMappingCoverage,
  buildProductColorCoverage,
  verified,
  type CoverageProduct,
} from '..';

const maps: Record<SupplierId, SupplierVariantMap> = {
  needen: {
    supplierId: 'needen',
    colors: {
      navy: verified('Navy'), // verifiziert (Basis)
      grey: 'Grau meliert', // unverifiziert
      red: verified('Red'),
    },
    sizes: { M: 'M' },
    productOverrides: {
      // prod-2 hat einen verifizierten Override für grey → für dieses Produkt verifiziert
      'prod-2': { colors: { grey: verified('Sport Grey', { variantId: '810' }) } },
    },
    labelsVerified: false,
  },
  'textil-grosshandel': { supplierId: 'textil-grosshandel', colors: {}, sizes: {}, labelsVerified: false },
  wordans: { supplierId: 'wordans', colors: {}, sizes: {}, labelsVerified: false },
  ralawise: { supplierId: 'ralawise', colors: {}, sizes: {}, labelsVerified: false },
};

const products: CoverageProduct[] = [
  { id: 'prod-1', supplierId: 'needen', colorIds: ['navy', 'grey'], sizes: ['M'] },
  { id: 'prod-2', supplierId: 'needen', colorIds: ['grey', 'red'], sizes: ['M'] },
  { id: 'prod-3', supplierId: undefined, colorIds: ['navy'], sizes: ['M'] }, // ohne Lieferant → ignoriert
];

test('klassifiziert verified/unverified korrekt und listet offene Farben', () => {
  const cov = buildSupplierMappingCoverage(products, maps);
  const needen = cov.find((c) => c.supplierId === 'needen');
  assert.ok(needen);
  assert.equal(needen.productCount, 2);

  const color = (key: string) => {
    const entry = needen.colors.find((c) => c.key === key);
    assert.ok(entry, `Farbe ${key} fehlt im Report`);
    return entry;
  };
  assert.equal(color('navy').status, 'verified');
  assert.equal(color('red').status, 'verified');
  // grey: prod-1 nutzt die unverifizierte Basis, prod-2 den verifizierten
  // Override → „schlechtester" Status gewinnt = unverified, und Override-Flag.
  assert.equal(color('grey').status, 'unverified');
  assert.equal(color('grey').hasProductOverride, true);
  assert.deepEqual(color('grey').usedByProducts, ['prod-1', 'prod-2']);

  assert.deepEqual(needen.colorsNeedingVerification, ['grey']);
});

test('fehlende Farbe wird als missing gemeldet', () => {
  const cov = buildSupplierMappingCoverage(
    [{ id: 'p', supplierId: 'needen', colorIds: ['navy', 'lavender'], sizes: [] }],
    maps
  );
  const needen = cov.find((c) => c.supplierId === 'needen');
  assert.equal(needen?.colors.find((c) => c.key === 'lavender')?.status, 'missing');
});

test('Lieferanten ohne zugeordnete Produkte erscheinen nicht im Report', () => {
  const cov = buildSupplierMappingCoverage(products, maps);
  assert.equal(cov.some((c) => c.supplierId === 'wordans'), false);
  assert.equal(cov.some((c) => c.supplierId === 'ralawise'), false);
});

test('Per-Produkt-Report trennt vollständig / nur-mehrdeutig / zu-prüfen', () => {
  const cov = buildProductColorCoverage(products, maps);
  const p1 = cov.find((c) => c.productId === 'prod-1');
  const p2 = cov.find((c) => c.productId === 'prod-2');
  assert.ok(p1 && p2);

  // prod-1: navy verifiziert, grey (mehrdeutig) offen → nur-mehrdeutig.
  assert.equal(p1.colorsVerified, 1);
  assert.deepEqual(p1.openAmbiguous, ['grey']);
  assert.deepEqual(p1.openOther, []);
  assert.equal(p1.complete, false);
  assert.equal(p1.completeExceptAmbiguous, true);

  // prod-2: grey über verifizierten Override + red verifiziert → vollständig.
  assert.equal(p2.complete, true);
  assert.equal(p2.completeExceptAmbiguous, true);
  assert.deepEqual(p2.openAmbiguous, []);
});

test('Per-Produkt-Report: abweichender Shop-Name landet in „prüfen" (nicht mehrdeutig)', () => {
  // 'royal' ist NICHT in der Mehrdeutig-Liste → fehlender Override zählt als
  // „zu prüfen", nicht als „Entscheidung".
  const cov = buildProductColorCoverage(
    [{ id: 'x', supplierId: 'needen', colorIds: ['navy', 'royal'], sizes: [] }],
    maps
  );
  const x = cov.find((c) => c.productId === 'x');
  assert.ok(x);
  assert.deepEqual(x.openOther, ['royal']); // navy verifiziert, royal fehlt → prüfen
  assert.deepEqual(x.openAmbiguous, []);
  assert.equal(x.completeExceptAmbiguous, false);
});
