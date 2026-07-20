/**
 * Unit-Tests der Supplier-Mapping-Schicht.
 *
 * Ausführung: `npm test` (nutzt tsx + Nodes eingebauten Test-Runner,
 * node:test – kein zusätzliches Test-Framework). Die Schicht ist rein und
 * ohne I/O, daher brauchen die Tests weder Datenbank noch Browser.
 *
 * Abgedeckt:
 *  - Feld-Auflösung (Farbe/Größe/Artikelnummer) inkl. Fehlerfällen
 *  - Existenzprüfung (isColorSupported / isSizeSupported)
 *  - Positions-Übersetzung (werfend und sammelnd)
 *  - Vollständigkeit + Konsistenz der Registry-Tabellen
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { SupplierId, SupplierOrderPosition } from '../../types';
import type { SupplierVariantMap } from '../types';
import { SupplierMappingError } from '../SupplierMappingError';
import {
  isColorSupported,
  isSizeSupported,
  normalizeVariant,
  resolveArticleNumber,
  resolveColorLabel,
  resolveSizeLabel,
} from '../resolve';
import { SUPPLIER_VARIANT_MAPS, getVariantMap } from '../registry';
import { resolveSupplierPosition, resolveSupplierPositions } from '../resolvePosition';

// ── Test-Fixtures ──────────────────────────────────────────────────────
/** Kleine, kontrollierte Map – unabhängig von den echten Tabellen, damit
 *  die Kern-Logik-Tests nicht mitwandern, wenn eine Tabelle wächst. */
const fixtureMap: SupplierVariantMap = {
  supplierId: 'textil-grosshandel',
  colors: { royal: 'Königsblau', black: 'Schwarz' },
  sizes: { M: 'M', XXL: '2XL' },
  articleNumberByProduct: { 'special-product': 'ALT-999' },
  labelsVerified: false,
};

function makePosition(overrides: Partial<SupplierOrderPosition> = {}): SupplierOrderPosition {
  return {
    supplierId: 'textil-grosshandel',
    productId: 'gildan-heavy-t',
    productName: 'Heavy Cotton T-Shirt',
    articleNumber: 'G5000',
    productUrl: 'https://example.test/g5000.html',
    colorId: 'royal',
    colorName: 'Royal',
    sizes: [
      { size: 'M', quantity: 5 },
      { size: 'XXL', quantity: 2 },
    ],
    ...overrides,
  };
}

// ── Feld-Auflösung: Farbe ──────────────────────────────────────────────
test('resolveColorLabel übersetzt eine vorhandene Farbe', () => {
  assert.equal(resolveColorLabel(fixtureMap, 'royal'), 'Königsblau');
});

test('resolveColorLabel wirft SupplierMappingError bei unbekannter Farbe', () => {
  assert.throws(
    () => resolveColorLabel(fixtureMap, 'pink', 'gildan-heavy-t'),
    (err: unknown) => {
      assert.ok(err instanceof SupplierMappingError);
      assert.equal(err.reason, 'unknown-color');
      assert.equal(err.supplierId, 'textil-grosshandel');
      assert.equal(err.value, 'pink');
      assert.equal(err.productId, 'gildan-heavy-t');
      return true;
    }
  );
});

test('isColorSupported unterscheidet vorhandene und fehlende Farben', () => {
  assert.equal(isColorSupported(fixtureMap, 'royal'), true);
  assert.equal(isColorSupported(fixtureMap, 'pink'), false);
});

test('isColorSupported meldet geerbte Object-Properties NICHT als Farbe', () => {
  // Schutz gegen prototype-Verwechslung (hasOwnProperty statt "in").
  assert.equal(isColorSupported(fixtureMap, 'toString'), false);
  assert.equal(isColorSupported(fixtureMap, 'constructor'), false);
});

// ── Feld-Auflösung: Größe ──────────────────────────────────────────────
test('resolveSizeLabel übersetzt eine abweichende Größenbezeichnung', () => {
  assert.equal(resolveSizeLabel(fixtureMap, 'XXL'), '2XL');
});

test('resolveSizeLabel wirft SupplierMappingError bei unbekannter Größe', () => {
  assert.throws(
    () => resolveSizeLabel(fixtureMap, '3XL', 'gildan-heavy-t'),
    (err: unknown) => {
      assert.ok(err instanceof SupplierMappingError);
      assert.equal(err.reason, 'unknown-size');
      assert.equal(err.value, '3XL');
      return true;
    }
  );
});

test('isSizeSupported unterscheidet vorhandene und fehlende Größen', () => {
  assert.equal(isSizeSupported(fixtureMap, 'M'), true);
  assert.equal(isSizeSupported(fixtureMap, '3XL'), false);
});

// ── Artikelnummer (Produktschlüssel) ───────────────────────────────────
test('resolveArticleNumber nutzt den Override, wenn vorhanden', () => {
  assert.equal(resolveArticleNumber(fixtureMap, 'special-product', 'FALLBACK'), 'ALT-999');
});

test('resolveArticleNumber fällt ohne Override auf die Positions-Nummer zurück', () => {
  assert.equal(resolveArticleNumber(fixtureMap, 'gildan-heavy-t', 'G5000'), 'G5000');
});

// ── Positions-Übersetzung (werfend) ────────────────────────────────────
test('resolveSupplierPosition übersetzt Farbe und alle Größen vollständig', () => {
  // Nutzt die ECHTE Registry-Tabelle (textil-grosshandel): royal → "Royal".
  // Die Übersetzung ABWEICHENDER Labels ist auf Feldebene über fixtureMap
  // getestet (resolveColorLabel/resolveSizeLabel).
  const resolved = resolveSupplierPosition(makePosition());
  assert.equal(resolved.supplierColor, 'Royal');
  assert.equal(resolved.articleNumber, 'G5000');
  assert.deepEqual(
    resolved.sizes,
    [
      { size: 'M', supplierSize: 'M', quantity: 5 },
      { size: 'XXL', supplierSize: 'XXL', quantity: 2 },
    ]
  );
  // interne Rückverfolgungsdaten bleiben erhalten
  assert.equal(resolved.colorId, 'royal');
  assert.equal(resolved.colorName, 'Royal');
});

test('resolveSupplierPosition wirft, wenn die Farbe beim Lieferanten fehlt', () => {
  // 'orange' ist bei textil-grosshandel gelistet, 'lavender' nicht.
  const pos = makePosition({ colorId: 'lavender', colorName: 'Lavendel' });
  assert.throws(() => resolveSupplierPosition(pos), SupplierMappingError);
});

test('resolveSupplierPosition wirft, wenn EINE Größe der Position fehlt', () => {
  const pos = makePosition({
    sizes: [
      { size: 'M', quantity: 1 },
      { size: '4XL', quantity: 1 },
    ],
  });
  assert.throws(
    () => resolveSupplierPosition(pos),
    (err: unknown) => err instanceof SupplierMappingError && err.reason === 'unknown-size'
  );
});

// ── Positions-Übersetzung (sammelnd) ───────────────────────────────────
test('resolveSupplierPositions trennt auflösbare von nicht auflösbaren Positionen', () => {
  const ok = makePosition({ productId: 'ok-1' });
  const badColor = makePosition({ productId: 'bad-color', colorId: 'nonexistent-color' });
  const okTwo = makePosition({ productId: 'ok-2', colorId: 'black' });

  const { resolved, failed } = resolveSupplierPositions([ok, badColor, okTwo]);

  assert.equal(resolved.length, 2);
  assert.deepEqual(resolved.map((r) => r.productId), ['ok-1', 'ok-2']);

  assert.equal(failed.length, 1);
  const firstFailure = failed[0];
  assert.ok(firstFailure);
  assert.equal(firstFailure.index, 1); // Original-Reihenfolge bewahrt
  assert.equal(firstFailure.position.productId, 'bad-color');
  assert.equal(firstFailure.error.reason, 'unknown-color');
});

test('resolveSupplierPositions wirft nicht bei reinen Mapping-Fehlern', () => {
  assert.doesNotThrow(() => resolveSupplierPositions([makePosition({ colorId: 'nope' })]));
});

// ── Registry: Vollständigkeit + Konsistenz ─────────────────────────────
test('Registry enthält für jeden bekannten Lieferanten eine Tabelle', () => {
  const ids: SupplierId[] = ['textil-grosshandel', 'wordans', 'needen', 'ralawise'];
  for (const id of ids) {
    const map = getVariantMap(id);
    assert.ok(map, `Tabelle für ${id} fehlt`);
    assert.equal(map.supplierId, id, `supplierId der Tabelle ${id} stimmt nicht`);
  }
});

test('jede Tabelle hat konsistente supplierId und valide Struktur', () => {
  for (const [id, map] of Object.entries(SUPPLIER_VARIANT_MAPS)) {
    assert.equal(map.supplierId, id);
    assert.equal(typeof map.colors, 'object');
    assert.equal(typeof map.sizes, 'object');
    assert.equal(typeof map.labelsVerified, 'boolean');
    // Jeder Eintrag (Kurzform-String ODER Vollform-Objekt) normalisiert zu
    // einem nicht-leeren Label.
    for (const [key, entry] of Object.entries(map.colors)) {
      assert.ok(normalizeVariant(entry).label.length > 0, `leeres Farb-Label für ${id}/${key}`);
    }
    for (const [key, entry] of Object.entries(map.sizes)) {
      assert.ok(normalizeVariant(entry).label.length > 0, `leeres Größen-Label für ${id}/${key}`);
    }
  }
});

test('aktiv genutzte Lieferanten führen die Standard-Konfektionsgrößen', () => {
  for (const id of ['textil-grosshandel', 'needen'] as const) {
    const map = getVariantMap(id);
    for (const size of ['S', 'M', 'L', 'XL', 'XXL']) {
      assert.equal(isSizeSupported(map, size), true, `${id} sollte Größe ${size} führen`);
    }
  }
});
