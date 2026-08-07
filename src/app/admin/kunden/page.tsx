/**
 * Kundenliste (Konten) – additiv seit dem Kundenkonto (Migration 0023).
 * Betrifft NUR Bestellungen mit verknüpftem Konto; Gastbestellungen
 * (weiterhin der häufigere Fall) bleiben ausschließlich in der Bestellliste
 * sichtbar, da sie keinem Konto zugeordnet sind.
 */
import { istAdmin } from '@/lib/admin/auth';
import { listCustomers } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

function zeit(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { dateStyle: 'medium' });
}

export default async function AdminKundenPage() {
  if (!(await istAdmin())) return null;
  const kunden = await listCustomers();
  const mitNewsletter = kunden.filter((k) => k.newsletterOptIn).length;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Kundenkonten ({kunden.length})</h1>
        <p className="mt-1 text-sm text-gray-500">
          {mitNewsletter} mit Newsletter-Einwilligung. Zeigt ausschließlich registrierte Konten – Gastbestellungen
          (weiterhin der häufigere Weg) erscheinen nur in der Bestellliste.
        </p>
      </div>

      {kunden.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Noch keine Kundenkonten angelegt.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">E-Mail</th>
                <th className="px-3 py-2">Firma</th>
                <th className="px-3 py-2">Seit</th>
                <th className="px-3 py-2 text-center">Bestellungen</th>
                <th className="px-3 py-2 text-center">Bestätigt</th>
                <th className="px-3 py-2 text-center">Newsletter</th>
              </tr>
            </thead>
            <tbody>
              {kunden.map((k) => (
                <tr key={k.id} className="border-b border-gray-100 last:border-0 hover:bg-brand-light/50">
                  <td className="px-3 py-2 font-medium">{k.displayName ?? '–'}</td>
                  <td className="px-3 py-2 text-gray-600">{k.email}</td>
                  <td className="px-3 py-2 text-gray-500">{k.company ?? '–'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{zeit(k.createdAt)}</td>
                  <td className="px-3 py-2 text-center">{k.orderCount}</td>
                  <td className="px-3 py-2 text-center">
                    {k.emailConfirmed ? (
                      <span className="text-green-700">✔</span>
                    ) : (
                      <span className="text-amber-600">ausstehend</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{k.newsletterOptIn ? '✔' : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
