/**
 * Admin: Bestellliste – Einstiegsseite des Adminbereichs.
 * Reiner Server-Component-Leser (Daten aus lib/admin/data.ts).
 */
import Link from 'next/link';
import { listOrders } from '@/lib/admin/data';
import { istAdmin } from '@/lib/admin/auth';
import { formatiereGeld } from '@/lib/format';
import { PAYMENT_STATUS_LABELS, type OrderPaymentStatus } from '@/lib/actions/orderTypes';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  in_production: 'In Produktion',
  shipped: 'Versendet',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const JE_SEITE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; seite?: string };
}) {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!(await istAdmin())) return null;
  const suche = searchParams.q?.trim() ?? '';
  const seite = Math.max(0, Number(searchParams.seite ?? '0') || 0);
  const { zeilen: orders, gesamt } = await listOrders({ suche, seite, jeSeite: JE_SEITE });
  const letzteSeite = Math.max(0, Math.ceil(gesamt / JE_SEITE) - 1);

  function seitenLink(neueSeite: number): string {
    const params = new URLSearchParams();
    if (suche) params.set('q', suche);
    if (neueSeite > 0) params.set('seite', String(neueSeite));
    const query = params.toString();
    return query ? `/admin?${query}` : '/admin';
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          Bestellungen &amp; Anfragen ({gesamt}
          {suche ? ` · Treffer für „${suche}"` : ''})
        </h1>
        <form method="get" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={suche}
            placeholder="Name, E-Mail oder Firma suchen …"
            className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">
            Suchen
          </button>
          {suche && (
            <Link href="/admin" className="text-xs text-gray-500 hover:underline">
              zurücksetzen
            </Link>
          )}
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Noch keine Bestellungen vorhanden (oder Supabase ist nicht erreichbar – siehe Server-Log).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Nummer</th>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Typ</th>
                <th className="px-3 py-2">Kunde</th>
                <th className="px-3 py-2 text-right">Summe</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Zahlung</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-brand-light/50">
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/admin/bestellung/${order.id}`} className="text-gold-dark hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                    {new Date(order.createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-3 py-2">{order.orderType === 'order' ? 'Bestellung' : 'Anfrage'}</td>
                  <td className="px-3 py-2">
                    {order.customerName}
                    {order.company && <span className="block text-xs text-gray-400">{order.company}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {formatiereGeld(order.totalPrice)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-gray-700">{STATUS_LABELS[order.status] ?? order.status}</span>
                    {/* Farbige Einordnung – rot (noch stornierbar) / grün
                        (Stornofrist abgelaufen, produktionsbereit) / grau
                        (storniert) / amber (Zahlung offen bzw. Rückerstattung
                        offen) / blau (Anfrage). Entscheidet NICHT mehr, ob die
                        Zeile erscheint – jede Bestellung ist seit 2026-08-25
                        sofort sichtbar, siehe orderVisibility.ts. */}
                    <div className="mt-1">
                      <AdminStatusBadge status={order.adminStatus} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{PAYMENT_STATUS_LABELS[order.paymentStatus as OrderPaymentStatus] ?? order.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {letzteSeite > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Seite {seite + 1} von {letzteSeite + 1}
          </span>
          <div className="flex gap-2">
            {seite > 0 && (
              <Link href={seitenLink(seite - 1)} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
                ← Zurück
              </Link>
            )}
            {seite < letzteSeite && (
              <Link href={seitenLink(seite + 1)} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
                Weiter →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
