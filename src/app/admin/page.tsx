/**
 * Admin: Bestellliste – Einstiegsseite des Adminbereichs.
 * Reiner Server-Component-Leser (Daten aus lib/admin/data.ts).
 */
import Link from 'next/link';
import { listOrders } from '@/lib/admin/data';
import { isAdminAuthenticated } from '@/lib/admin/auth';

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  in_production: 'In Produktion',
  shipped: 'Versendet',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const PAYMENT_LABELS: Record<string, string> = {
  not_required: '–',
  pending: 'Zahlung offen',
  paid: 'Bezahlt',
  failed: 'Zahlung fehlgeschlagen',
};

export default async function AdminOrdersPage() {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!isAdminAuthenticated()) return null;
  const orders = await listOrders();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Bestellungen &amp; Anfragen ({orders.length})</h1>

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
                    {order.totalPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-3 py-2">{STATUS_LABELS[order.status] ?? order.status}</td>
                  <td className="px-3 py-2 text-gray-500">{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
