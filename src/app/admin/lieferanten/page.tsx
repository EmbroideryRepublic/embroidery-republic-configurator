/**
 * Admin-Seite „Lieferanten-Mapping": read-only Übersicht, welche vom
 * Katalog genutzten Farben/Größen je Lieferant bereits im realen Shop
 * verifiziert sind und welche noch bestätigt werden müssen.
 *
 * Rein lesend (keine Server Action, kein Schreibzugriff) – die Pflege
 * selbst erfolgt weiterhin in EINER Datei je Lieferant
 * (src/lib/suppliers/mapping/tables/<lieferant>.ts bzw. productOverrides).
 * Diese Seite macht nur sofort sichtbar, wo noch etwas fehlt.
 */
import { PRODUCTS } from '@/config/products';
import { supplierRefVon } from '@/lib/suppliers/supplierRefs';
import { getSupplierDescriptor } from '@/lib/suppliers/registry';
import {
  buildSupplierMappingCoverage,
  type CoverageProduct,
  type CoverageStatus,
  type DimensionCoverageEntry,
} from '@/lib/suppliers/mapping';
import { istAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<CoverageStatus, string> = {
  verified: 'bg-green-50 text-green-700 border-green-200',
  unverified: 'bg-amber-50 text-amber-700 border-amber-200',
  missing: 'bg-red-50 text-red-700 border-red-200',
};
const STATUS_LABEL: Record<CoverageStatus, string> = {
  verified: 'verifiziert',
  unverified: 'zu prüfen',
  missing: 'fehlt',
};

function DimensionChips({ title, entries }: { title: string; entries: DimensionCoverageEntry[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((e) => (
          <span
            key={e.key}
            title={`${STATUS_LABEL[e.status]}${e.hasProductOverride ? ' · produktspezifischer Override' : ''} · genutzt von: ${e.usedByProducts.join(', ')}`}
            className={`rounded border px-2 py-0.5 text-xs ${STATUS_STYLE[e.status]}`}
          >
            {e.key}
            {e.hasProductOverride ? ' •' : ''}
          </span>
        ))}
        {entries.length === 0 && <span className="text-xs text-gray-400">–</span>}
      </div>
    </div>
  );
}

export default async function AdminSupplierMappingPage() {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!(await istAdmin())) return null;
  const products: CoverageProduct[] = PRODUCTS.map((p) => ({
    id: p.id,
    supplierId: supplierRefVon(p.id)?.supplierId,
    colorIds: p.colors.map((c) => c.id),
    sizes: p.sizes,
  }));
  const coverage = buildSupplierMappingCoverage(products);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Lieferanten-Mapping – Verifikationsstand</h1>
        <p className="mt-1 text-sm text-gray-500">
          Farben und Größen, die vom Katalog genutzt werden, je Lieferant. <span className="text-green-700">Verifiziert</span>{' '}
          = im realen Shop bestätigt. <span className="text-amber-700">Zu prüfen</span> = Näherung, noch nicht bestätigt.{' '}
          <span className="text-red-700">Fehlt</span> = gar keine Zuordnung. Ein Punkt (•) markiert einen
          produktspezifischen Override. Pflege je Lieferant in einer Datei; Report auch via{' '}
          <code className="rounded bg-gray-100 px-1">npm run coverage:suppliers</code>.
        </p>
      </div>

      {coverage.map((c) => {
        const desc = getSupplierDescriptor(c.supplierId);
        const openColors = c.colorsNeedingVerification.length;
        const openSizes = c.sizesNeedingVerification.length;
        return (
          <div key={c.supplierId} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{desc.label}</h2>
              <span className="text-xs text-gray-500">
                {c.productCount} Produkte · offen: {openColors} Farben, {openSizes} Größen
              </span>
            </div>
            <div className="space-y-3">
              <DimensionChips title="Farben" entries={c.colors} />
              <DimensionChips title="Größen" entries={c.sizes} />
            </div>
          </div>
        );
      })}

      {coverage.length === 0 && (
        <p className="text-sm text-gray-500">Keinem Produkt ist derzeit ein Lieferant zugeordnet.</p>
      )}
    </section>
  );
}
