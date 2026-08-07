/**
 * Produktübersicht – read-only. Der Katalog liegt bewusst im Code
 * (src/config/products), nicht in der Datenbank
 * (docs/filterleiste-konzept.md, Architekturentscheidung 1) – eine
 * Bearbeitungsoberfläche hier würde eine zweite Wahrheit neben dem Code
 * schaffen. Diese Seite macht den Bestand nur auf einen Blick sichtbar
 * (Marke, Typ, Qualität, Grundpreis, Farbanzahl), Änderungen erfolgen
 * weiterhin in den Marken-Dateien unter src/config/products/.
 */
import { istAdmin } from '@/lib/admin/auth';
import { PRODUCTS } from '@/config/products';
import { waehlbareFarben } from '@/lib/products/farben';
import { formatiereGeld } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminProduktePage() {
  if (!(await istAdmin())) return null;

  const zeilen = [...PRODUCTS]
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      productType: p.productType,
      qualityTier: p.qualityTier,
      basePrice: p.basePrice,
      farbanzahl: waehlbareFarben(p.id, p.colors).length,
      farbanzahlGesamt: p.colors.length,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Produkte ({zeilen.length})</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only Übersicht des Katalogs. Der Bestand liegt im Code (
          <code className="rounded bg-gray-100 px-1">src/config/products/</code>), nicht in der Datenbank – Pflege
          weiterhin dort, je Marke eine Datei.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Marke</th>
              <th className="px-3 py-2">Produkt</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Qualität</th>
              <th className="px-3 py-2 text-right">Grundpreis</th>
              <th className="px-3 py-2 text-right">Farben (wählbar / gesamt)</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-brand-light/50">
                <td className="px-3 py-2 text-gray-600">{p.brand}</td>
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.productType}</td>
                <td className="px-3 py-2 text-gray-500">{p.qualityTier}</td>
                <td className="px-3 py-2 text-right">{formatiereGeld(p.basePrice)}</td>
                <td className="px-3 py-2 text-right">
                  {p.farbanzahl}
                  {p.farbanzahl !== p.farbanzahlGesamt && (
                    <span className="text-gray-400"> / {p.farbanzahlGesamt}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
