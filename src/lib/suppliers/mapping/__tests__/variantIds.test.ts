/**
 * Unit-Tests für die ERWEITERUNG der Mapping-Schicht um stabile
 * Lieferantenkennungen (Variant-IDs / SKUs / Select-Werte).
 *
 * Bewusst eine EIGENE Testdatei – die bestehenden Tests (mapping.test.ts,
 * catalogConsistency.test.ts) bleiben unverändert und grün; hier kommen nur
 * die neuen Felder hinzu. Abgedeckt:
 *  - Kurz-/Vollform-Normalisierung (Abwärtskompatibilität)
 *  - Auflösung inkl. stabiler IDs, Label-Wrapper unverändert
 *  - Erkennung fehlender IDs (Fallback) und ungültiger IDs (Fail-Fast)
 *  - Auswahl-Präferenz (stabile ID vor sichtbarem Text)
 *  - Positions-Übersetzung trägt die Deskriptoren, Alt-Felder unverändert
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { SupplierOrderPosition } from '../../types';
import type { SupplierVariantMap } from '../types';
import { SupplierMappingError } from '../SupplierMappingError';
import { normalizeVariant, resolveColorLabel, resolveColorVariant, resolveSizeVariant } from '../resolve';
import { hasStableIdentifier, preferredVariantSelector } from '../selectors';
import { resolveSupplierPosition, resolveSupplierPositions } from '../resolvePosition';

/** Fixture mit gemischten Einträgen: Kurzform (String) und Vollform mit
 *  stabilen IDs – thematisch ein internationaler Shop (Ralawise). */
const idMap: SupplierVariantMap = {
  supplierId: 'ralawise',
  colors: {
    navy: { label: 'French Navy', variantId: 'clr-1001', sku: 'JH001-NVY' },
    red: { label: 'Fire Red', selectValue: 'opt-red' },
    grey: { label: 'Sport Grey', sku: 'JH001-GRY' },
    black: 'Black', // Kurzform bleibt gültig (nur Label)
  },
  sizes: {
    M: { label: 'M', selectValue: 'sz-m' },
    XXL: { label: '2XL', variantId: 'sz-2xl' },
    L: 'L',
  },
  labelsVerified: true,
};

function ralawisePosition(overrides: Partial<SupplierOrderPosition> = {}): SupplierOrderPosition {
  return {
    supplierId: 'ralawise',
    productId: 'jh001',
    productName: 'College Hoodie',
    articleNumber: 'JH001',
    productUrl: 'https://example.test/jh001',
    colorId: 'navy',
    colorName: 'Navy',
    sizes: [
      { size: 'M', quantity: 4 },
      { size: 'XXL', quantity: 1 },
    ],
    ...overrides,
  };
}

// ── Normalisierung / Abwärtskompatibilität ─────────────────────────────
test('normalizeVariant wandelt die Kurzform (String) in die Vollform', () => {
  assert.deepEqual(normalizeVariant('Schwarz'), { label: 'Schwarz' });
});

test('normalizeVariant kopiert die Vollform (mutiert die Tabelle nicht)', () => {
  const source = { label: 'French Navy', variantId: 'clr-1001' };
  const copy = normalizeVariant(source);
  assert.deepEqual(copy, source);
  assert.notEqual(copy, source); // eigene Kopie, keine geteilte Referenz
});

// ── Auflösung mit stabilen IDs ─────────────────────────────────────────
test('resolveColorVariant liefert Label UND stabile IDs', () => {
  assert.deepEqual(resolveColorVariant(idMap, 'navy'), {
    label: 'French Navy',
    variantId: 'clr-1001',
    sku: 'JH001-NVY',
  });
});

test('resolveColorLabel bleibt abwärtskompatibel (nur Label, auch bei Vollform)', () => {
  assert.equal(resolveColorLabel(idMap, 'navy'), 'French Navy');
  assert.equal(resolveColorLabel(idMap, 'black'), 'Black'); // Kurzform
});

test('resolveSizeVariant liefert den Select-Wert der Größe', () => {
  assert.deepEqual(resolveSizeVariant(idMap, 'M'), { label: 'M', selectValue: 'sz-m' });
});

// ── Fehlende IDs → Fallback (kein Fehler) ──────────────────────────────
test('Kurzform-Eintrag hat keine stabile ID → hasStableIdentifier false', () => {
  const variant = resolveColorVariant(idMap, 'black');
  assert.equal(hasStableIdentifier(variant), false);
});

// ── Ungültige IDs → Fail-Fast ──────────────────────────────────────────
test('leeres Label wird als ungültige Variante erkannt', () => {
  const map: SupplierVariantMap = { ...idMap, colors: { navy: '' } };
  assert.throws(
    () => resolveColorVariant(map, 'navy'),
    (err: unknown) => err instanceof SupplierMappingError && err.reason === 'invalid-variant'
  );
});

test('leere variantId wird als ungültige Variante erkannt', () => {
  const map: SupplierVariantMap = { ...idMap, colors: { navy: { label: 'French Navy', variantId: '   ' } } };
  assert.throws(
    () => resolveColorVariant(map, 'navy'),
    (err: unknown) => {
      assert.ok(err instanceof SupplierMappingError);
      assert.equal(err.reason, 'invalid-variant');
      assert.match(err.message, /variantId/);
      return true;
    }
  );
});

test('leerer selectValue wird als ungültige Variante erkannt', () => {
  const map: SupplierVariantMap = { ...idMap, sizes: { M: { label: 'M', selectValue: '' } } };
  assert.throws(
    () => resolveSizeVariant(map, 'M'),
    (err: unknown) => err instanceof SupplierMappingError && err.reason === 'invalid-variant'
  );
});

// ── Auswahl-Präferenz: stabile ID vor sichtbarem Text ──────────────────
test('preferredVariantSelector bevorzugt die variantId', () => {
  assert.deepEqual(preferredVariantSelector(resolveColorVariant(idMap, 'navy')), {
    strategy: 'variant-id',
    value: 'clr-1001',
  });
});

test('preferredVariantSelector nutzt selectValue, wenn keine variantId da ist', () => {
  assert.deepEqual(preferredVariantSelector(resolveColorVariant(idMap, 'red')), {
    strategy: 'select-value',
    value: 'opt-red',
  });
});

test('preferredVariantSelector nutzt sku, wenn nur diese vorhanden ist', () => {
  assert.deepEqual(preferredVariantSelector(resolveColorVariant(idMap, 'grey')), {
    strategy: 'sku',
    value: 'JH001-GRY',
  });
});

test('preferredVariantSelector fällt ohne stabile ID auf das Label zurück', () => {
  assert.deepEqual(preferredVariantSelector(resolveColorVariant(idMap, 'black')), {
    strategy: 'label',
    value: 'Black',
  });
});

// ── Positions-Übersetzung: Deskriptoren + unveränderte Alt-Felder ──────
test('resolveSupplierPosition trägt colorVariant/sizeVariants MIT IDs, Alt-Felder unverändert', () => {
  const resolved = resolveSupplierPosition(ralawisePosition(), idMap);

  // Neue Deskriptoren inkl. stabiler IDs:
  assert.deepEqual(resolved.colorVariant, { label: 'French Navy', variantId: 'clr-1001', sku: 'JH001-NVY' });
  assert.deepEqual(resolved.sizeVariants['M'], { label: 'M', selectValue: 'sz-m' });
  assert.deepEqual(resolved.sizeVariants['XXL'], { label: '2XL', variantId: 'sz-2xl' });

  // Abwärtskompatible Alt-Felder unverändert in Form und Inhalt:
  assert.equal(resolved.supplierColor, 'French Navy');
  assert.deepEqual(resolved.sizes, [
    { size: 'M', supplierSize: 'M', quantity: 4 },
    { size: 'XXL', supplierSize: '2XL', quantity: 1 },
  ]);
});

// ── Fail-Fast über die Sammel-Auflösung ────────────────────────────────
test('resolveSupplierPositions meldet ungültige Variante als failed, gültige als resolved', () => {
  const badMap: SupplierVariantMap = {
    ...idMap,
    colors: { navy: { label: 'French Navy', variantId: 'clr-1001' }, broken: { label: '' } },
  };
  const positions = [
    ralawisePosition({ productId: 'ok', colorId: 'navy' }),
    ralawisePosition({ productId: 'defekt', colorId: 'broken' }),
  ];

  const { resolved, failed } = resolveSupplierPositions(positions, badMap);

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0]?.productId, 'ok');
  assert.equal(failed.length, 1);
  assert.equal(failed[0]?.error.reason, 'invalid-variant');
  assert.equal(failed[0]?.position.productId, 'defekt');
});
