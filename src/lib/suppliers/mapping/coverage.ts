/**
 * Abdeckungs-Report der Mapping-Schicht: zeigt je Lieferant, welche vom
 * Katalog GENUTZTEN Farben/Größen bereits verifiziert sind und welche noch
 * verifiziert werden müssen (unverifizierte Näherung oder ganz fehlend).
 *
 * Zweck (Pflege-/Verifikations-Hilfe): auf einen Blick sehen, was für einen
 * produktiven Lieferanten-Start noch im realen Shop bestätigt werden muss –
 * ohne den Quellcode zu durchsuchen. Ausgabe über Script
 * (scripts/checkSupplierMappingCoverage.mts, `npm run coverage:suppliers`)
 * und die Admin-Seite /admin/lieferanten.
 *
 * BEWUSST rein und ohne Katalog-Import: die Produkte werden als schlanke
 * {@link CoverageProduct}-Liste hereingereicht (Dependency Injection),
 * dadurch ohne Datenbank/Config testbar. Status je Eintrag:
 *  - verified   : effektiver Eintrag ist als `verified: true` markiert
 *  - unverified : Eintrag vorhanden, aber Näherung (String/ohne verified)
 *  - missing    : kein Eintrag (weder Basis noch produktspezifischer Override)
 */
import type { SupplierId } from '../types';
import { SUPPLIER_VARIANT_MAPS } from './registry';
import type { SupplierVariantEntry, SupplierVariantMap } from './types';

export type CoverageStatus = 'verified' | 'unverified' | 'missing';

/** Schlanke Produktsicht für den Report (aus ProductConfig ableitbar). */
export interface CoverageProduct {
  id: string;
  supplierId: SupplierId | undefined;
  colorIds: string[];
  sizes: string[];
}

export interface DimensionCoverageEntry {
  key: string;
  status: CoverageStatus;
  /** true = für mindestens ein Produkt existiert ein produktspezifischer Override. */
  hasProductOverride: boolean;
  usedByProducts: string[];
}

export interface SupplierCoverage {
  supplierId: SupplierId;
  productCount: number;
  colors: DimensionCoverageEntry[];
  sizes: DimensionCoverageEntry[];
  /** Farben/Größen, die noch NICHT verifiziert sind (Handlungsliste). */
  colorsNeedingVerification: string[];
  sizesNeedingVerification: string[];
}

function ownEntry(
  record: Readonly<Record<string, SupplierVariantEntry>> | undefined,
  key: string
): SupplierVariantEntry | undefined {
  if (!record) return undefined;
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

function entryVerified(entry: SupplierVariantEntry): boolean {
  return typeof entry === 'object' && entry.verified === true;
}

/** missing > unverified > verified – die „schlechteste" Bewertung gewinnt. */
function worst(a: CoverageStatus, b: CoverageStatus): CoverageStatus {
  const rank: Record<CoverageStatus, number> = { missing: 2, unverified: 1, verified: 0 };
  return rank[a] >= rank[b] ? a : b;
}

function coverForDimension(
  products: CoverageProduct[],
  base: Readonly<Record<string, SupplierVariantEntry>>,
  overridesFor: (productId: string) => Readonly<Record<string, SupplierVariantEntry>> | undefined,
  keysOf: (p: CoverageProduct) => string[]
): DimensionCoverageEntry[] {
  const agg = new Map<string, { status: CoverageStatus; override: boolean; products: Set<string> }>();
  for (const product of products) {
    const override = overridesFor(product.id);
    for (const key of keysOf(product)) {
      const ov = ownEntry(override, key);
      const effective = ov !== undefined ? ov : ownEntry(base, key);
      const status: CoverageStatus = effective === undefined ? 'missing' : entryVerified(effective) ? 'verified' : 'unverified';
      const current = agg.get(key);
      if (current) {
        current.status = worst(current.status, status);
        current.override = current.override || ov !== undefined;
        current.products.add(product.id);
      } else {
        agg.set(key, { status, override: ov !== undefined, products: new Set([product.id]) });
      }
    }
  }
  return [...agg.entries()]
    .map(([key, v]) => ({ key, status: v.status, hasProductOverride: v.override, usedByProducts: [...v.products].sort() }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Baut den Abdeckungs-Report je Lieferant. Nur Lieferanten mit mindestens
 * einem zugeordneten Produkt erscheinen.
 */
export function buildSupplierMappingCoverage(
  products: CoverageProduct[],
  maps: Record<SupplierId, SupplierVariantMap> = SUPPLIER_VARIANT_MAPS
): SupplierCoverage[] {
  const bySupplier = new Map<SupplierId, CoverageProduct[]>();
  for (const product of products) {
    if (!product.supplierId) continue;
    let list = bySupplier.get(product.supplierId);
    if (!list) {
      list = [];
      bySupplier.set(product.supplierId, list);
    }
    list.push(product);
  }

  const result: SupplierCoverage[] = [];
  for (const [supplierId, supplierProducts] of bySupplier) {
    const map = maps[supplierId];
    if (!map) continue; // SupplierId offen: nicht registrierte Lieferanten überspringen
    const colors = coverForDimension(
      supplierProducts,
      map.colors,
      (pid) => map.productOverrides?.[pid]?.colors,
      (p) => p.colorIds
    );
    const sizes = coverForDimension(
      supplierProducts,
      map.sizes,
      (pid) => map.productOverrides?.[pid]?.sizes,
      (p) => p.sizes
    );
    result.push({
      supplierId,
      productCount: supplierProducts.length,
      colors,
      sizes,
      colorsNeedingVerification: colors.filter((c) => c.status !== 'verified').map((c) => c.key),
      sizesNeedingVerification: sizes.filter((s) => s.status !== 'verified').map((s) => s.key),
    });
  }
  return result.sort((a, b) => a.supplierId.localeCompare(b.supplierId));
}

// ── Per-Produkt-Sicht ────────────────────────────────────────────────────

/**
 * Farben, die BEWUSST nicht automatisch zugeordnet werden (mehrdeutig – es
 * gibt mehrere ähnliche Shop-Töne) und erst nach gemeinsamer Entscheidung
 * eingepflegt werden. Für den Report getrennt ausgewiesen, damit „nur noch
 * Entscheidung offen" von „noch zu verifizieren" unterscheidbar ist.
 */
export const AMBIGUOUS_COLOR_IDS: ReadonlySet<string> = new Set([
  'grey',
  'charcoal',
  'burgundy',
  'kelly-green',
  'bottle-green',
  'pink',
]);

/** Abdeckung EINES Produkts: welche Farben verifiziert sind und welche noch
 *  offen (getrennt nach mehrdeutig = Entscheidung vs. sonst = Verifikation). */
export interface ProductColorCoverage {
  productId: string;
  supplierId: SupplierId;
  colorsTotal: number;
  colorsVerified: number;
  /** Offen, weil mehrdeutig – wartet auf gemeinsame Entscheidung. */
  openAmbiguous: string[];
  /** Offen aus anderem Grund (abweichender Shop-Name, mehrere Kandidaten,
   *  fehlend) – zu verifizieren/entscheiden. */
  openOther: string[];
  /** true = JEDE Farbe verifiziert. */
  complete: boolean;
  /** true = alle NICHT-mehrdeutigen Farben verifiziert; offen sind nur noch
   *  die bewusst zurückgestellten mehrdeutigen Farben. */
  completeExceptAmbiguous: boolean;
}

/**
 * Baut die Abdeckung JE PRODUKT (statt je Farbe): sofort ablesbar, welche
 * Produkte vollständig verifiziert sind, welche nur noch auf eine
 * Farbentscheidung warten und bei welchen noch Farben zu verifizieren sind.
 */
export function buildProductColorCoverage(
  products: CoverageProduct[],
  maps: Record<SupplierId, SupplierVariantMap> = SUPPLIER_VARIANT_MAPS,
  ambiguous: ReadonlySet<string> = AMBIGUOUS_COLOR_IDS
): ProductColorCoverage[] {
  const result: ProductColorCoverage[] = [];
  for (const product of products) {
    if (!product.supplierId) continue;
    const map = maps[product.supplierId];
    if (!map) continue; // SupplierId offen: nicht registrierte Lieferanten überspringen
    const override = map.productOverrides?.[product.id]?.colors;
    const openAmbiguous: string[] = [];
    const openOther: string[] = [];
    let verifiedCount = 0;
    for (const colorId of product.colorIds) {
      const ov = ownEntry(override, colorId);
      const effective = ov !== undefined ? ov : ownEntry(map.colors, colorId);
      if (effective !== undefined && entryVerified(effective)) verifiedCount += 1;
      else if (ambiguous.has(colorId)) openAmbiguous.push(colorId);
      else openOther.push(colorId);
    }
    result.push({
      productId: product.id,
      supplierId: product.supplierId,
      colorsTotal: product.colorIds.length,
      colorsVerified: verifiedCount,
      openAmbiguous,
      openOther,
      complete: openAmbiguous.length === 0 && openOther.length === 0,
      completeExceptAmbiguous: openOther.length === 0,
    });
  }
  return result.sort((a, b) => a.supplierId.localeCompare(b.supplierId) || a.productId.localeCompare(b.productId));
}

/** Menschlich lesbarer Per-Produkt-Report (für Script/CLI). */
export function formatProductColorCoverage(entries: ProductColorCoverage[]): string {
  const lines: string[] = [];
  const bySupplier = new Map<SupplierId, ProductColorCoverage[]>();
  for (const e of entries) {
    const list = bySupplier.get(e.supplierId) ?? [];
    list.push(e);
    bySupplier.set(e.supplierId, list);
  }
  for (const [supplierId, list] of [...bySupplier.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const complete = list.filter((e) => e.complete).length;
    const exceptAmbiguous = list.filter((e) => e.completeExceptAmbiguous).length;
    lines.push(
      `\n${supplierId} – ${complete}/${list.length} vollständig; ${exceptAmbiguous}/${list.length} verifiziert bis auf mehrdeutige Farben`
    );
    for (const e of list) {
      // ✓ alles verifiziert · ◐ nur mehrdeutige offen · ○ noch zu verifizieren
      const icon = e.complete ? '✓' : e.completeExceptAmbiguous ? '◐' : '○';
      const parts: string[] = [];
      if (e.openOther.length) parts.push(`prüfen: ${e.openOther.join(', ')}`);
      if (e.openAmbiguous.length) parts.push(`Entscheidung: ${e.openAmbiguous.join(', ')}`);
      const suffix = parts.length ? `  ${parts.join(' · ')}` : '';
      lines.push(`  ${icon} ${e.productId.padEnd(28)} ${e.colorsVerified}/${e.colorsTotal}${suffix}`);
    }
  }
  return lines.join('\n');
}

// ── Katalogweiter Integrationsstatus (Selbst-Integration neuer Produkte) ──

/**
 * Standing-Check: fasst zusammen, wie der GESAMTE Katalog in der
 * Lieferantenarchitektur steht – inklusive der Produkte, die (noch) KEINEN
 * Lieferanten haben und deshalb sonst in keinem Report auftauchen.
 *
 * Zweck: ein neu aufgenommenes Produkt erscheint dadurch automatisch als
 * offene Aufgabe (fehlende Lieferantenzuordnung ODER fehlende verifizierte
 * Farben/Größen) – ohne dass jemand gesondert daran erinnern muss.
 */
export interface CatalogSupplierStatus {
  totalProducts: number;
  withSupplier: number;
  /** Produkt-IDs OHNE Lieferantenzuordnung – bewusst (Eigenkollektion) ODER
   *  noch offen (neu, Bezugsquelle in supplierRefs.ts fehlt). */
  withoutSupplier: string[];
  /** Zugeordnete Produkte, deren Farben ALLE verifiziert sind. */
  fullyVerified: number;
  /** Zugeordnete Produkte mit noch offenen (unverifizierten) Farben. */
  withOpenColors: number;
}

/** Produkt-IDs ohne Lieferantenzuordnung (supplier: undefined). */
export function productsWithoutSupplier(products: CoverageProduct[]): string[] {
  return products
    .filter((p) => !p.supplierId)
    .map((p) => p.id)
    .sort();
}

export function buildCatalogSupplierStatus(
  products: CoverageProduct[],
  maps: Record<SupplierId, SupplierVariantMap> = SUPPLIER_VARIANT_MAPS
): CatalogSupplierStatus {
  const withoutSupplier = productsWithoutSupplier(products);
  const perProduct = buildProductColorCoverage(products, maps);
  return {
    totalProducts: products.length,
    withSupplier: products.length - withoutSupplier.length,
    withoutSupplier,
    fullyVerified: perProduct.filter((p) => p.complete).length,
    withOpenColors: perProduct.filter((p) => !p.complete).length,
  };
}

/** Menschlich lesbarer Katalog-Integrationsstatus (für Script/CLI). */
export function formatCatalogSupplierStatus(status: CatalogSupplierStatus): string {
  const lines = [
    `Katalog: ${status.totalProducts} Produkte · ${status.withSupplier} mit Lieferant · ${status.withoutSupplier.length} ohne Lieferant`,
    `Zugeordnet: ${status.fullyVerified} vollständig verifiziert · ${status.withOpenColors} mit offenen Farben`,
  ];
  if (status.withoutSupplier.length) {
    lines.push(
      `Ohne Lieferantenzuordnung (Eigenkollektion ODER offene Aufgabe – in supplierRefs.ts ergänzen):`
    );
    for (const id of status.withoutSupplier) lines.push(`  – ${id}`);
  }
  return lines.join('\n');
}

/** Menschlich lesbarer Report (für Script/CLI). */
export function formatCoverageReport(coverages: SupplierCoverage[]): string {
  const lines: string[] = [];
  const icon: Record<CoverageStatus, string> = { verified: '✓', unverified: '·', missing: '✗' };
  for (const c of coverages) {
    const openColors = c.colorsNeedingVerification.length;
    const openSizes = c.sizesNeedingVerification.length;
    lines.push(
      `\n${c.supplierId}  (${c.productCount} Produkte)  – offen: ${openColors} Farben, ${openSizes} Größen`
    );
    const fmt = (label: string, entries: DimensionCoverageEntry[]) => {
      lines.push(`  ${label}:`);
      for (const e of entries) {
        const ov = e.hasProductOverride ? ' [Override]' : '';
        lines.push(`    ${icon[e.status]} ${e.key.padEnd(16)} ${e.status}${ov}`);
      }
    };
    fmt('Farben', c.colors);
    fmt('Größen', c.sizes);
  }
  return lines.join('\n');
}
