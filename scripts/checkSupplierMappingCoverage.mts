/**
 * Gibt den Abdeckungs-Report der Lieferanten-Mapping-Schicht aus: je
 * Lieferant, welche vom Katalog genutzten Farben/Größen bereits verifiziert
 * sind und welche noch im realen Shop bestätigt werden müssen.
 *
 * Aufruf: npm run coverage:suppliers   (bzw. npx tsx scripts/checkSupplierMappingCoverage.mts)
 * Exit-Code 1, wenn eine genutzte Farbe/Größe GANZ fehlt (echte Lücke);
 * unverifizierte Näherungen sind kein Fehler, nur eine Handlungsliste.
 */
import { PRODUCTS } from '@/config/products/index';
import {
  buildSupplierMappingCoverage,
  formatCoverageReport,
  buildProductColorCoverage,
  formatProductColorCoverage,
  buildCatalogSupplierStatus,
  formatCatalogSupplierStatus,
  type CoverageProduct,
} from '@/lib/suppliers/mapping';

const products: CoverageProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  supplierId: p.supplier?.supplierId,
  colorIds: p.colors.map((c) => c.id),
  sizes: p.sizes,
}));

const coverage = buildSupplierMappingCoverage(products);

console.log('═══ Katalog-Integrationsstatus (Selbst-Integration neuer Produkte) ═══');
console.log(formatCatalogSupplierStatus(buildCatalogSupplierStatus(products)));

console.log('\n═══ Lieferanten-Mapping – Abdeckungs-Report (je Farbe) ═══');
console.log(formatCoverageReport(coverage));

console.log('\n═══ Abdeckungs-Report (je Produkt: vollständig verifiziert?) ═══');
console.log(formatProductColorCoverage(buildProductColorCoverage(products)));

const totalMissing = coverage.reduce(
  (sum, c) =>
    sum +
    c.colors.filter((e) => e.status === 'missing').length +
    c.sizes.filter((e) => e.status === 'missing').length,
  0
);
const totalUnverified = coverage.reduce(
  (sum, c) =>
    sum +
    c.colors.filter((e) => e.status === 'unverified').length +
    c.sizes.filter((e) => e.status === 'unverified').length,
  0
);

console.log(`\nZusammenfassung: ${totalMissing} fehlend, ${totalUnverified} unverifiziert (zu prüfen).`);
if (totalMissing > 0) {
  console.error('FEHLER: mindestens eine genutzte Farbe/Größe fehlt im Mapping.');
  process.exit(1);
}
