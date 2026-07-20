/**
 * Bestellbestätigung/Anfrage-Bestätigung für den Kunden. Inhaltlich 1:1
 * aus der früheren HTML-String-Version (`sendCustomerConfirmation` in
 * orderEmails.ts) übernommen, jetzt als React-Komponente.
 */
import { Text } from '@react-email/components';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { PAYMENT_TERM_DAYS } from '@/config/company';
import { EmailLayout, OrderItemsTable } from './EmailLayout';

export function OrderConfirmationEmail({ order }: { order: OrderRecord }) {
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
            Zwischensumme: {order.subtotal.toFixed(2)} €
          </Text>
          <Text style={{ margin: '2px 0 0', textAlign: 'right', fontSize: 13 }}>
            Versand: {order.shippingCost ? `${order.shippingCost.toFixed(2)} €` : 'kostenlos'}
          </Text>
        </>
      )}

      <Text style={{ marginTop: 8, textAlign: 'right', fontSize: 16, fontWeight: 600 }}>
        {isOrder ? 'Gesamtsumme' : 'Ungefährer Richtpreis'}: {order.totalPrice.toFixed(2)} €
      </Text>

      {isOrder && (
        <Text style={{ marginTop: 16, fontSize: 13 }}>
          Die Zahlung erfolgt auf Rechnung. Die Rechnung senden wir Ihnen separat mit der
          Auftragsbearbeitung zu; sie ist innerhalb von {PAYMENT_TERM_DAYS} Tagen ab Rechnungsdatum
          ohne Abzug zu begleichen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der
          Versand erfolgt anschließend innerhalb von 1 bis 2 Werktagen.
        </Text>
      )}
    </EmailLayout>
  );
}
