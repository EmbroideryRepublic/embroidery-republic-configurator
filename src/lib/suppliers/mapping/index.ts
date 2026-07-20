/**
 * Öffentliche API der Supplier-Mapping-Schicht (Barrel).
 *
 * Aufrufer importieren ausschließlich aus '@/lib/suppliers/mapping',
 * nie direkt aus den einzelnen Tabellen – so bleibt die interne Struktur
 * frei umbaubar.
 */
export type {
  SupplierVariant,
  SupplierVariantEntry,
  SupplierVariantMap,
  ProductVariantOverride,
  SupplierMappingErrorReason,
  ResolvedSupplierPosition,
  ResolvedSupplierSize,
} from './types';
export { SupplierMappingError } from './SupplierMappingError';
export {
  isColorSupported,
  isSizeSupported,
  normalizeVariant,
  verified,
  resolveColorVariant,
  resolveSizeVariant,
  resolveColorLabel,
  resolveSizeLabel,
  resolveArticleNumber,
} from './resolve';
export {
  preferredVariantSelector,
  hasStableIdentifier,
  variantValueFor,
  VARIANT_STRATEGY_ORDER,
  type VariantSelector,
  type VariantSelectorStrategy,
} from './selectors';
export { SUPPLIER_VARIANT_MAPS, getVariantMap } from './registry';
export {
  resolveSupplierPosition,
  resolveSupplierPositions,
  type SupplierPositionResolution,
} from './resolvePosition';
export {
  buildSupplierMappingCoverage,
  formatCoverageReport,
  buildProductColorCoverage,
  formatProductColorCoverage,
  productsWithoutSupplier,
  buildCatalogSupplierStatus,
  formatCatalogSupplierStatus,
  AMBIGUOUS_COLOR_IDS,
  type CoverageProduct,
  type CatalogSupplierStatus,
  type CoverageStatus,
  type SupplierCoverage,
  type DimensionCoverageEntry,
  type ProductColorCoverage,
} from './coverage';
