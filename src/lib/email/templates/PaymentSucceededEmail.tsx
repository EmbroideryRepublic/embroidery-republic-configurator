/**
 * Zahlungsbestätigung nach erfolgreicher Vorabzahlung (Karte/PayPal via
 * Stripe). Ergänzt die bereits vorhandene Bestellbestätigung – die ging
 * schon bei Bestelleingang raus (mit dem Hinweis "Zahlung ausstehend"),
 * diese hier bestätigt den tatsächlichen Zahlungseingang und dass die
 * Produktion jetzt beginnt.
 */
import { Text } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';
import { formatiereGeld } from '@/lib/format';

export function PaymentSucceededEmail({ orderNumber, betrag }: { orderNumber: string; betrag: number }) {
  const title = `Zahlung erhalten: ${orderNumber}`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Vielen Dank! Wir haben Ihre Zahlung über <strong>{formatiereGeld(betrag)}</strong> für Bestellung{' '}
        <strong>{orderNumber}</strong> erhalten.
      </Text>
      <Text style={{ marginTop: 12 }}>
        Ihre Bestellung geht damit direkt in die Produktion. Sobald sie versandt wird, erhalten Sie eine weitere
        Nachricht von uns.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Diese E-Mail dient als Zahlungsbestätigung. Die Rechnung erhalten Sie separat.
      </Text>
    </EmailLayout>
  );
}
