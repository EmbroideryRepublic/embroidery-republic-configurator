/**
 * Admin: Bestellliste – Einstiegsseite des Adminbereichs.
 * Reiner Server-Component-Leser (Daten aus lib/admin/data.ts).
 */
import Link from 'next/link';
import { listOrders, type BestellungsListenFilter } from '@/lib/admin/data';
import { istAdmin } from '@/lib/admin/auth';
import { formatiereGeld, formatiereZeitpunkt } from '@/lib/format';
import { PAYMENT_STATUS_LABELS, type OrderPaymentStatus } from '@/lib/actions/orderTypes';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { DeleteOrderButton } from '@/components/admin/DeleteOrderButton';

const FILTER_LABELS: Record<BestellungsListenFilter, string> = {
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
  alle: 'Alle',
};
const FILTER_WERTE: BestellungsListenFilter[] = ['aktiv', 'abgeschlossen', 'storniert', 'alle'];

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
  searchParams: { q?: string; seite?: string; status?: string };
}) {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!(await istAdmin())) return null;
  const suche = searchParams.q?.trim() ?? '';
  const seite = Math.max(0, Number(searchParams.seite ?? '0') || 0);
  const filter: BestellungsListenFilter = FILTER_WERTE.includes(searchParams.status as BestellungsListenFilter)
    ? (searchParams.status as BestellungsListenFilter)
    : 'aktiv';
  const { zeilen: orders, gesamt } = await listOrders({ suche, seite, jeSeite: JE_SEITE, filter });
  const letzteSeite = Math.max(0, Math.ceil(gesamt / JE_SEITE) - 1);

  function seitenLink(neueSeite: number, neuerFilter: BestellungsListenFilter = filter): string {
    const params = new URLSearchParams();
    if (suche) params.set('q', suche);
    if (neuerFilter !== 'aktiv') params.set('status', neuerFilter);
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
          {filter !== 'aktiv' && <input type="hidden" name="status" value={filter} />}
          <input
            type="search"
            name="q"
            defaultValue={suche}
            placeholder="Name, E-Mail, Firma, Bestell-/Rechnungs-/Sendungsnr. …"
            className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">
            Suchen
          </button>
          {suche && (
            <Link href={seitenLink(0)} className="text-xs text-gray-500 hover:underline">
              zurücksetzen
            </Link>
          )}
        </form>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {FILTER_WERTE.map((wert) => (
          <Link
            key={wert}
            href={seitenLink(0, wert)}
            className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition ${
              filter === wert
                ? 'border border-b-0 border-gray-200 bg-white text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {FILTER_LABELS[wert]}
          </Link>
        ))}
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
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`border-b border-gray-100 last:border-0 hover:bg-brand-light/50 ${
                    order.brauchtAufmerksamkeit ? 'bg-red-50/60' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-medium">
                    {/* Fund vom 2026-08-26 (admin_workflow_ux-Audit): ohne
                        dieses Signal war ein Fehlschlag (Versandlabel,
                        Bestellbestätigung, Rechnung) nur sichtbar, wenn man
                        die Bestellung einzeln öffnete – siehe
                        brauchtAufmerksamkeit in lib/admin/data.ts. */}
                    {order.brauchtAufmerksamkeit && (
                      <span
                        title="Braucht Aufmerksamkeit – Versand-, Bestätigungs- oder Rechnungsproblem, siehe Bestelldetails"
                        className="mr-1.5 inline-block text-red-600"
                        aria-label="Braucht Aufmerksamkeit"
                      >
                        ⚠
                      </span>
                    )}
                    <Link href={`/admin/bestellung/${order.id}`} className="text-gold-dark hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                    {formatiereZeitpunkt(order.createdAt)}
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
                  <td className="px-3 py-2">
                    {/* Löschen nur anbieten, wo das Backend es ohnehin
                        zulassen würde (siehe DeleteOrderButton.tsx-Kopfkommentar) –
                        reine UI-Sparsamkeit, keine sicherheitsrelevante Prüfung. */}
                    {order.status === 'cancelled' && order.invoiceNumber === null && (
                      <DeleteOrderButton orderId={order.id} orderNumber={order.orderNumber} />
                    )}
                  </td>
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
