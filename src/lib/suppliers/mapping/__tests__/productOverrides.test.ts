/**
 * Tests für produktspezifische Varianten-Overrides + `verified()`-Helfer.
 *
 * Kernzusagen:
 *  - Ein Override für (Produkt, Farbe/Größe) hat VORRANG vor dem
 *    per-Lieferant-Default.
 *  - Ohne Override greift automatisch die label-basierte Basis-Lösung
 *    (vollständig erhalten).
 *  - Overrides gelten nur für IHR Produkt, nicht für andere.
 *  - Fail-Fast: ein ungültiger Override wirft.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { SupplierVariantMap } from '../types';
import { SupplierMappingError } from '../SupplierMappingError';
import { resolveColorVariant, resolveSizeVariant, verified } from '../resolve';

const mapWithOverride: SupplierVariantMap = {
  supplierId: 'needen',
  colors: {
    navy: 'Navy', // per-Lieferant-Default (Label, unverifiziert)
    red: verified('Red'),
  },
  sizes: { M: 'M', XXL: '2XL' },
  productOverrides: {
    'prod-A': {
      colors: { navy: verified('Navy', { variantId: '2305' }) }, // produktspezifische ID
    },
    'prod-B': {
      colors: { navy: verified('Navy', { variantId: '343' }) }, // ANDERE ID, anderes Produkt
    },
  },
  labelsVerified: false,
};

test('verified() erzeugt eine als bestätigt markierte Voll-Variante', () => {
  assert.deepEqual(verified('Red'), { label: 'Red', verified: true });
  assert.deepEqual(verified('Navy', { variantId: '2305' }), { label: 'Navy', verified: true, variantId: '2305' });
});

test('Override hat Vorrang: prod-A liefert die produktspezifische variantId', () => {
  const v = resolveColorVariant(mapWithOverride, 'navy', 'prod-A');
  assert.equal(v.label, 'Navy');
  assert.equal(v.variantId, '2305');
});

test('gleiche Farbe, anderes Produkt → andere produktspezifische variantId', () => {
  assert.equal(resolveColorVariant(mapWithOverride, 'navy', 'prod-B').variantId, '343');
});

test('ohne Override greift automatisch der Label-Default (Fallback erhalten)', () => {
  // Produkt ohne Override-Eintrag
  const v = resolveColorVariant(mapWithOverride, 'navy', 'prod-C');
  assert.equal(v.label, 'Navy');
  assert.equal(v.variantId, undefined);
  // Ganz ohne productId ebenso
  assert.equal(resolveColorVariant(mapWithOverride, 'navy').variantId, undefined);
});

test('Override nur für die überschriebene Dimension – Größen fallen auf Basis zurück', () => {
  assert.equal(resolveSizeVariant(mapWithOverride, 'XXL', 'prod-A').label, '2XL');
});

test('ungültiger Override (leere variantId) → Fail-Fast', () => {
  const bad: SupplierVariantMap = {
    supplierId: 'needen',
    colors: { navy: 'Navy' },
    sizes: {},
    productOverrides: { 'prod-X': { colors: { navy: { label: 'Navy', variantId: '  ' } } } },
    labelsVerified: false,
  };
  assert.throws(
    () => resolveColorVariant(bad, 'navy', 'prod-X'),
    (err: unknown) => err instanceof SupplierMappingError && err.reason === 'invalid-variant'
  );
});
