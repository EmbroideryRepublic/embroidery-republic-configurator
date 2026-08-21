/**
 * Admin: Bestell-Detailseite mit Lieferanten-Panel.
 *  - Kontakt/Versand/Positionen (Leser aus lib/admin/data.ts)
 *  - Lieferanten-Gruppen je Bezugsquelle (buildManualSupplierGroups);
 *    Produkte ohne hinterlegte Bezugsquelle werden ausgewiesen
 *  - MANUELLER Weg: Direktlink zum Lieferanten + "als bestellt markieren"
 *    (MarkOrderedButton), Status je Lieferant aus supplier_orders
 *
 * Hinweis: Die frühere automatisierte Auslösung (PrepareSupplierButton) ist
 * entfallen – der gelebte Regelweg ist der manuelle Prozess, siehe
 * docs/manueller-lieferantenprozess.md.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/lib/admin/data';
import { SUPPLIERS } from '@/lib/suppliers';
import type { SupplierId } from '@/lib/suppliers';
import { MarkOrderedButton } from '@/components/admin/MarkOrderedButton';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';
import { ShippingLabelControl } from '@/components/admin/ShippingLabelControl';
import { RefundControl } from '@/components/admin/RefundControl';
import { AdminCancelControl } from '@/components/admin/AdminCancelControl';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderPaymentStatus,
  type OrderStatus,
} from '@/lib/actions/orderTypes';
import { buildManualSupplierGroups } from '@/lib/admin/supplierOrderView';
import { istAdmin } from '@/lib/admin/auth';
import { IST_KLEINUNTERNEHMER } from '@/config/company';
import { formatiereGeld } from '@/lib/format';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  // SICHERHEIT: Die Prüfung MUSS hier stehen, nicht nur im Layout. Next.js
  // rendert Seite und Layout parallel und serialisiert das Seitenergebnis in
  // den RSC-Payload des HTML – auch wenn das Layout `children` verwirft.
  // Ohne diese Wache lagen Kundendaten und signierte Datei-URLs im Quelltext
  // der Login-Seite (real nachgewiesen).
  if (!(await istAdmin())) return null;
  const order = await getOrderDetail(params.id);
  if (!order) notFound();

  // Fuer die MANUELLE Bestellung aufbereitet (Shop-Farbname + Hex, Mengen).
  const supplierGroups = buildManualSupplierGroups(order.supplierDraft.positionsBySupplier);
  const statusJeLieferant = new Map(order.supplierOrders.map((so) => [so.supplierId as SupplierId, so.status]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-800">
          ← Zur Bestellliste
        </Link>
        <h1 className="mt-1 text-lg font-semibold">
          {order.orderNumber}{' '}
          <span className="text-sm font-normal text-gray-500">
            ({order.orderType === 'order' ? 'Bestellung' : 'Anfrage'} ·{' '}
            {new Date(order.createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })})
          </span>
        </h1>
      </div>

      {/* Statussteuerung: bewusst ganz oben – es ist die Aktion, wegen der
          der Betreiber diese Seite in aller Regel öffnet. Anfragen haben
          keinen Bestellstatus und bekommen sie deshalb nicht. */}
      {order.orderType === 'order' && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <OrderStatusControl
            orderId={order.id}
            status={order.status as OrderStatus}
            trackingNummer={order.trackingNumber}
          />
          <ShippingLabelControl
            orderId={order.id}
            trackingNummer={order.trackingNumber}
            labelUrl={order.dhlLabelUrl}
          />
        </div>
      )}

      {/* Kulanzstornierung: eigener, bewusst von OrderStatusControl getrennter
          Vorgang (siehe AdminCancelControl.tsx). Blendet sich selbst aus,
          sobald 'cancelled' laut Zustandsmaschine kein erlaubter Übergang
          mehr ist (Anfragen haben ohnehin keinen Bestellstatus). */}
      {order.orderType === 'order' && (
        <div className="mb-4">
          <AdminCancelControl orderId={order.id} status={order.status as OrderStatus} />
        </div>
      )}

      {/* Erscheint von selbst nur bei tatsächlich anstehender/erfolgter
          Rückerstattung (refundStatus !== 'not_applicable') – siehe
          RefundControl.tsx. Deshalb bewusst NICHT in `order.orderType ===
          'order'` verschachtelt: eine eigene Bedingung wäre hier nur
          Redundanz zur bereits vorhandenen Selbstausblendung. */}
      <div className="mb-4">
        <RefundControl
          orderId={order.id}
          refundStatus={order.refundStatus}
          refundAmountCent={order.refundAmountCent}
          refundReference={order.refundReference}
          refundedAt={order.refundedAt}
          cancellationSource={order.cancellationSource}
        />
      </div>

      {/* Kontakt & Versand */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Kontakt</h2>
          <dl className="space-y-1 text-sm text-gray-700">
            <div>
              {order.customerName}
              {order.company ? ` · ${order.company}` : ''}
            </div>
            <div>{order.email}</div>
            {order.phone && <div>{order.phone}</div>}
            {order.message && <p className="pt-2 text-xs text-gray-500">&bdquo;{order.message}&ldquo;</p>}
          </dl>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Versand &amp; Summe</h2>
          {order.shipping ? (
            <p className="text-sm text-gray-700">
              {order.shipping.street}
              <br />
              {order.shipping.zip} {order.shipping.city}, {order.shipping.country}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Keine Lieferadresse (Anfrage).</p>
          )}
          <p className="mt-2 text-sm font-medium">
            Summe: {formatiereGeld(order.totalPrice)}
          </p>
          {/* Netto/Steuer/Brutto – nur für Bestellungen ab Migration 0014
              vorhanden (order.taxAmount === null bei älteren Bestellungen). */}
          {order.taxAmount !== null && order.taxRate !== null && order.netTotal !== null && (
            <p className="mt-0.5 text-xs text-gray-500">
              {IST_KLEINUNTERNEHMER
                ? `Kein Steuerausweis (§ 19 UStG) – netto = brutto = ${formatiereGeld(order.totalPrice)}`
                : `netto ${formatiereGeld(order.netTotal)} + ${order.taxRate} % USt. ${formatiereGeld(order.taxAmount)} = brutto ${formatiereGeld(order.totalPrice)}`}
            </p>
          )}
          {/* Zahlungsart: seit Migration 0012 gespeichert. Bestellungen aus
              der Zeit davor tragen sie nachgetragen als "Rechnung" – belegt
              durch den damals fest verdrahteten Checkout. */}
          {order.paymentMethod && (
            <p className="mt-1 text-sm text-gray-700">
              Zahlungsart: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
          )}
          {/* Zahlungszustand: Auf dieser Seite kann er nur 'not_required'
              oder 'paid' sein – ausstehende Zahlungen werden von der
              Sichtbarkeitsregel gar nicht erst ausgeliefert
              (lib/orders/orderVisibility.ts). Angezeigt wird er trotzdem,
              damit auf einen Blick erkennbar ist, ob Geld geflossen ist. */}
          {order.orderType === 'order' && (
            <p className="mt-1 text-sm text-gray-700">
              Zahlung:{' '}
              {PAYMENT_STATUS_LABELS[order.paymentStatus as OrderPaymentStatus] ?? order.paymentStatus}
              {/* Verbindet die beiden sonst isoliert wirkenden Aussagen "Zahlung:
                  Bezahlt" und den Rückerstattung-Block weiter oben (RefundControl) –
                  ohne diesen Halbsatz liest sich eine stornierte, aber noch nicht
                  erstattete Bestellung wie ein Widerspruch (Review vom 2026-08-20). */}
              {order.status === 'cancelled' && order.refundStatus !== 'not_applicable' && order.refundStatus !== 'refunded' && (
                <span className="text-amber-700"> – Rückerstattung läuft, siehe oben</span>
              )}
            </p>
          )}
          {/* Rechnung: automatisch erzeugt, siehe orderCompletion.ts
              (erzeugeRechnung) – über lib/invoicing/registry.ts standardmäßig
              den internen Anbieter, Lexware nur optional bei gesetztem
              INVOICING_PROVIDER=lexware (seit 2026-08-18 bewusst
              zurückgestellt, siehe dortiger Kommentar). Fehlt die Rechnung,
              ist entweder die Zahlung noch offen oder die Erstellung
              (nicht-fatal) fehlgeschlagen – order_events
              (invoice_creation_failed) zeigt den Grund. */}
          {order.orderType === 'order' && (
            <p className="mt-1 text-sm text-gray-700">
              Rechnung:{' '}
              {order.invoiceNumber ? (
                <>
                  {order.invoiceNumber}
                  {order.invoicePdfUrl && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={order.invoicePdfUrl} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                        PDF öffnen ↗
                      </a>
                    </>
                  )}
                </>
              ) : (
                <span className="text-gray-400">noch nicht erstellt</span>
              )}
            </p>
          )}
        </section>
      </div>

      {/* Positionen */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Positionen ({order.items.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-1 pr-3">Produkt</th>
                <th className="py-1 pr-3">Farbe</th>
                <th className="py-1 pr-3">Veredelung</th>
                <th className="py-1 pr-3">Größen</th>
                <th className="py-1 pr-3 text-right">Menge</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 pr-3">{item.productName}</td>
                  <td className="py-1.5 pr-3">{item.colorName}</td>
                  <td className="py-1.5 pr-3">{item.printMethod === 'embroidery' ? 'Stickerei' : 'DTF'}</td>
                  <td className="py-1.5 pr-3 text-xs text-gray-600">
                    {Object.entries(item.sizeQuantities)
                      .filter(([, q]) => q > 0)
                      .map(([size, q]) => `${size}×${q}`)
                      .join(', ')}
                  </td>
                  <td className="py-1.5 pr-3 text-right">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lieferanten-Bestellung (manueller Weg) */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Lieferanten-Bestellung</h2>

        {supplierGroups.length === 0 ? (
          <p className="text-sm text-gray-500">
            Keine Position dieser Bestellung hat eine hinterlegte Bezugsquelle (supplierRefs).
          </p>
        ) : (
          <div className="space-y-4">
            {supplierGroups.map((gruppe) => {
              const status = statusJeLieferant.get(gruppe.supplierId);
              const bestellt = status === 'ordered';
              return (
                <div key={gruppe.supplierId} className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{gruppe.supplierLabel}</p>
                    <p className="text-xs text-gray-500">
                      {gruppe.positions.length} Position(en) · {gruppe.totalQuantity} Stück gesamt
                    </p>
                  </div>

                  {gruppe.positions.map((pos, i) => (
                    <article key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                      <header className="mb-3">
                        <h3 className="text-base font-semibold text-gray-900">{pos.productName}</h3>
                        <p className="text-xs text-gray-500">
                          Artikelnummer <span className="font-mono text-gray-800">{pos.articleNumber}</span> ·{' '}
                          {gruppe.supplierLabel}
                        </p>
                      </header>

                      <dl className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-gray-500">Farbe im Shop</dt>
                          <dd className="mt-0.5 text-sm">
                            {pos.shopColor.kind === 'eindeutig' ? (
                              <span className="inline-flex items-center gap-2">
                                {pos.shopColor.hex && (
                                  <span
                                    aria-hidden
                                    className="inline-block h-4 w-4 rounded border border-gray-300"
                                    style={{ backgroundColor: `#${pos.shopColor.hex}` }}
                                  />
                                )}
                                <span className="font-medium text-gray-900">{pos.shopColor.name}</span>
                                {pos.shopColor.hex && (
                                  <span className="font-mono text-xs text-gray-500">#{pos.shopColor.hex}</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-amber-800">
                                <span className="font-medium">Nicht eindeutig zugeordnet</span> – bei uns
                                &bdquo;{pos.colorName}&ldquo;. Bitte im Shop selbst wählen.
                                {pos.shopColor.bekannteFarben.length > 0 && (
                                  <span className="mt-1 block text-xs text-gray-600">
                                    Für dieses Produkt bekannt:{' '}
                                    {pos.shopColor.bekannteFarben.map((f) => f.name).join(', ')}
                                  </span>
                                )}
                              </span>
                            )}
                            {pos.shopColor.kind === 'eindeutig' && pos.shopColor.name !== pos.colorName && (
                              <span className="mt-0.5 block text-xs text-gray-500">
                                (bei uns: {pos.colorName})
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-gray-500">Gesamtmenge</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-gray-900">{pos.totalQuantity} Stück</dd>
                        </div>
                      </dl>

                      <div className="mt-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Größen</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pos.sizes.map((s) => (
                            <span
                              key={s.size}
                              className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm tabular-nums"
                            >
                              <span className="font-medium text-gray-900">{s.size}</span>
                              <span className="text-gray-500"> × </span>
                              <span className="font-semibold text-gray-900">{s.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                        <a
                          href={pos.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-gold px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark"
                        >
                          Produkt bei Textil-Großhandel öffnen ↗
                        </a>
                        {order.productionSheetUrl && (
                          <a
                            href={order.productionSheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Produktionsblatt öffnen ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}

                  <div className="flex flex-wrap items-center gap-2">
                    {status ? (
                      <MarkOrderedButton
                        orderId={order.id}
                        supplierId={gruppe.supplierId}
                        bereitsBestellt={bestellt}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        Noch kein Lieferanten-Datensatz vorhanden (entsteht bei Rechnungsbestellungen automatisch).
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {order.supplierDraft.unresolved.length > 0 && (
          <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
            Ohne Bezugsquelle (manuell bestellen):{' '}
            {order.supplierDraft.unresolved.map((u) => `${u.productName} (${u.colorId})`).join(', ')}
          </p>
        )}

        {/* Protokolle der RUHENDEN Browser-Automatisierung. Bewusst
            eingeklappt und ohne Auslöse-Schaltfläche: der Regelweg ist die
            manuelle Bestellung oben. Siehe docs/manueller-lieferantenprozess.md */}
        {order.supplierOrders.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              Technische Details der ruhenden Automatisierung
            </summary>
            <div className="mt-2 space-y-2">
            {order.supplierOrders.map((so) => (
              <div key={so.supplierId} className="rounded border border-gray-100 p-2 text-xs text-gray-600">
                <span className="font-medium text-gray-800">
                  {SUPPLIERS[so.supplierId as SupplierId]?.label ?? so.supplierId}
                </span>{' '}
                · Status: {so.status} · Modus: {so.mode} · Stand:{' '}
                {new Date(so.updatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                {so.lastRun && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-gold-dark">
                      Letzter Lauf: {so.lastRun.outcome} ({so.lastRun.steps.length} Schritte)
                    </summary>
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {so.lastRun.steps.map((step, i) => (
                        <li key={i}>
                          {step.step}
                          {step.positionIndex !== undefined ? ` [Pos. ${step.positionIndex + 1}]` : ''}
                          {step.size ? ` ${step.size}` : ''} → {step.status}
                          {step.error ? ` (${step.error})` : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
