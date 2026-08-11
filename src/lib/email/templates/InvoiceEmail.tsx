/**
 * Rechnung als E-Mail – enthält alle Pflichtangaben nach § 14 Abs. 4 UStG
 * (Verkäufer, Käufer, Rechnungsnummer, Datum, Leistungsbeschreibung, Entgelt
 * netto, Steuersatz und -betrag, Endbetrag), soweit sie im System vorliegen.
 *
 * ── Seit 2026-08-10: automatisch verschickt, mit Lexware als Quelle ─────
 * `invoiceNumber`/`invoiceDate` kommen jetzt NICHT mehr von `order.orderNumber`
 * (das bleibt weiterhin nur die Bestellnummer, siehe buildOrderNumber,
 * orderTypes.ts), sondern von Lexware Office – dort entsteht beim Anlegen
 * der Rechnung (lib/invoicing/providers/lexware.ts) die fortlaufende, § 14
 * Abs. 4 Nr. 4 UStG-konforme Nummer. Dieses Template ist die E-Mail-
 * ZUSAMMENFASSUNG; das rechtsverbindliche Dokument ist das angehängte
 * Lexware-PDF (siehe lib/orders/orderCompletion.ts, erzeugeRechnung – dort
 * wird diese Komponente aufgerufen und das PDF als Anhang mitgeschickt).
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { formatiereGeld } from '@/lib/format';
import { COLORS, EmailLayout } from './EmailLayout';
import type { OrderRecord } from '@/lib/actions/orderTypes';

export function InvoiceEmail({
  order,
  invoiceNumber,
  invoiceDate,
  vatId,
}: {
  order: OrderRecord;
  /** Eigenständig zu vergeben, siehe Hinweis oben – NICHT order.orderNumber. */
  invoiceNumber: string;
  invoiceDate: string;
  /**
   * USt-IdNr. der Käuferschaft (Schnappschuss aus orders.customer_vat_id,
   * Migration 0025), NICHT `order.contact` – OrderRecord (orderTypes.ts)
   * trägt bewusst keine Rechnungs-spezifischen Felder, die außerhalb dieser
   * (noch unverdrahteten, siehe Hinweis oben) Vorlage nirgends gebraucht
   * werden. Fehlt sie (Gastkauf oder kein Eintrag im Profil), wird die Zeile
   * schlicht weggelassen – nach § 14 Abs. 4 UStG ist sie nur Pflicht, wenn
   * eine der beiden Vertragsparteien innergemeinschaftlich reverse-charge-
   * pflichtig ist, nicht bei jeder Rechnung.
   */
  vatId?: string | null;
}) {
  const title = `Rechnung ${invoiceNumber}`;
  return (
    <EmailLayout previewText={title} title={title}>
      <table style={{ width: '100%', fontSize: 13, marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '50%' }}>
              <strong>{COMPANY.legalName}</strong>
              <br />
              {COMPANY.street}
              <br />
              {COMPANY.zip} {COMPANY.city}
              <br />
              {COMPANY.email}
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
              <strong>{order.contact.name}</strong>
              <br />
              {order.contact.company && (
                <>
                  {order.contact.company}
                  <br />
                </>
              )}
              {order.shipping?.street}
              <br />
              {order.shipping?.zip} {order.shipping?.city}
              {vatId && (
                <>
                  <br />
                  USt-IdNr.: {vatId}
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <Text style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
        Rechnungsnummer: <strong>{invoiceNumber}</strong> · Rechnungsdatum: {invoiceDate} · Bestellung:{' '}
        {order.orderNumber}
      </Text>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
            <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 12, color: COLORS.muted }}>Position</th>
            <th style={{ textAlign: 'right', padding: '4px 0', fontSize: 12, color: COLORS.muted }}>Betrag</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: '6px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                {item.productName} · {item.colorName} ({item.quantity}×)
              </td>
              <td style={{ padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, textAlign: 'right' }}>
                {formatiereGeld(item.totalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: '100%', marginTop: 12, fontSize: 13 }}>
        <tbody>
          {order.subtotal !== undefined && (
            <tr>
              <td>Zwischensumme</td>
              <td style={{ textAlign: 'right' }}>{formatiereGeld(order.subtotal)}</td>
            </tr>
          )}
          {order.shippingCost !== undefined && (
            <tr>
              <td>Versand</td>
              <td style={{ textAlign: 'right' }}>{order.shippingCost ? formatiereGeld(order.shippingCost) : 'kostenlos'}</td>
            </tr>
          )}
          {order.taxRate !== undefined && order.taxAmount !== undefined && (
            <tr>
              <td>enthaltene USt. ({order.taxRate} %)</td>
              <td style={{ textAlign: 'right' }}>{formatiereGeld(order.taxAmount)}</td>
            </tr>
          )}
          <tr style={{ fontWeight: 600, fontSize: 15 }}>
            <td style={{ paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>Gesamtbetrag</td>
            <td style={{ paddingTop: 8, borderTop: `1px solid ${COLORS.border}`, textAlign: 'right' }}>
              {formatiereGeld(order.totalPrice)}
            </td>
          </tr>
        </tbody>
      </table>

      <Text style={{ marginTop: 20, fontSize: 12, color: COLORS.muted }}>
        Zahlbar innerhalb der vereinbarten Zahlungsfrist ohne Abzug. Diese Rechnung enthält die gesetzlich
        vorgeschriebenen Angaben nach § 14 UStG, soweit zum Zeitpunkt der Erstellung hinterlegt.
      </Text>
    </EmailLayout>
  );
}
