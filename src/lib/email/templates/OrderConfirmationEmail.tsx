/**
 * Bestellbestätigung/Anfrage-Bestätigung für den Kunden. Inhaltlich 1:1
 * aus der früheren HTML-String-Version (`sendCustomerConfirmation` in
 * orderEmails.ts) übernommen, jetzt als React-Komponente.
 */
import { Text } from '@react-email/components';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { PAYMENT_METHOD_LABELS } from '@/lib/actions/orderTypes';
import { PAYMENT_TERM_DAYS, IST_KLEINUNTERNEHMER } from '@/config/company';
import { STORNOFRIST_MS } from '@/config/orderProcess';
import { EmailLayout, OrderItemsTable } from './EmailLayout';
import { formatiereGeld } from '@/lib/format';

export function OrderConfirmationEmail({
  order,
  bestellansichtUrl,
}: {
  order: OrderRecord;
  /** Optional: Link zur Bestellansicht mit Storno-Möglichkeit. Die E-Mail
   *  erklärt den Ablauf auch OHNE diesen Link vollständig – er ist ein
   *  zusätzlicher Weg, nicht die Erklärung selbst. */
  bestellansichtUrl?: string;
}) {
  const stornofristStunden = Math.round(STORNOFRIST_MS / (60 * 60 * 1000));
  const isOrder = order.orderType === 'order';
  const title = isOrder ? `Bestellbestätigung ${order.orderNumber}` : `Ihre Anfrage ${order.orderNumber}`;
  const intro = isOrder
    ? `Vielen Dank für Ihre Bestellung! Wir haben sie unter der Nummer ${order.orderNumber} erhalten und beginnen mit der Produktion, sobald alles final geprüft ist.`
    : `Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze persönlich bei Ihnen. Bis dahin ist nichts verbindlich bestellt und nichts bezahlt.`;

  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>{intro}</Text>
      <OrderItemsTable order={order} />

      {isOrder && order.subtotal !== undefined && (
        <>
          <Text style={{ margin: '12px 0 0', textAlign: 'right', fontSize: 13 }}>
            Zwischensumme: {formatiereGeld(order.subtotal)}
          </Text>
          <Text style={{ margin: '2px 0 0', textAlign: 'right', fontSize: 13 }}>
            Versand: {order.shippingCost ? formatiereGeld(order.shippingCost) : 'kostenlos'}
          </Text>
        </>
      )}

      <Text style={{ marginTop: 8, textAlign: 'right', fontSize: 16, fontWeight: 600 }}>
        {isOrder ? 'Gesamtsumme' : 'Ungefährer Richtpreis'}: {formatiereGeld(order.totalPrice)}
      </Text>
      {/* Steuerzeile: Pflichtangabe gegenüber Verbrauchern (Preisangabenverordnung).
          Bei Bruttopreisen nur AUSGEWIESEN, in der Gesamtsumme oben bereits
          enthalten – dieselbe Semantik wie orderStage.ts. */}
      {order.taxAmount !== undefined && order.taxRate !== undefined && (
        <Text style={{ margin: '2px 0 0', textAlign: 'right', fontSize: 12, color: '#6b675e' }}>
          {IST_KLEINUNTERNEHMER
            ? 'Kein Steuerausweis (§ 19 UStG)'
            : `davon enthaltene USt. (${order.taxRate} %): ${formatiereGeld(order.taxAmount)}`}
        </Text>
      )}

      {isOrder && (
        <Text style={{ marginTop: 16, fontSize: 13 }}>
          {!order.paymentMethod || order.paymentMethod === 'invoice' ? (
            <>
              Die Zahlung erfolgt auf Rechnung. Die Rechnung senden wir Ihnen separat mit der
              Auftragsbearbeitung zu; sie ist innerhalb von {PAYMENT_TERM_DAYS} Tagen ab
              Rechnungsdatum ohne Abzug zu begleichen.{' '}
            </>
          ) : (
            <>
              Die Zahlung ist bereits per {PAYMENT_METHOD_LABELS[order.paymentMethod]} bei uns
              eingegangen – vielen Dank.{' '}
            </>
          )}
          Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der Versand erfolgt anschließend
          innerhalb von 1 bis 2 Werktagen.
        </Text>
      )}

      {/* Stornofrist – bewusst als Fließtext erklärt, damit der Ablauf auch
          ohne Klick auf den Link vollständig verständlich ist. */}
      {isOrder && (
        <>
          <Text style={{ marginTop: 16, fontSize: 13 }}>
            <strong>Sie können diese Bestellung noch stornieren.</strong> Innerhalb von{' '}
            {stornofristStunden} Stunden nach Bestelleingang können Sie sie ohne Angabe von Gründen
            selbst stornieren – es entstehen Ihnen dann keine Kosten. Nach Ablauf dieser Frist
            beginnen wir mit der Bearbeitung und beschaffen die Ware; eine Selbststornierung ist
            dann nicht mehr möglich.
          </Text>
          {bestellansichtUrl && (
            <Text style={{ marginTop: 12, fontSize: 13 }}>
              Ihre Bestellung ansehen und bei Bedarf stornieren:{' '}
              <a href={bestellansichtUrl} style={{ color: '#8a6d3b' }}>
                {bestellansichtUrl}
              </a>
            </Text>
          )}
        </>
      )}
    </EmailLayout>
  );
}
