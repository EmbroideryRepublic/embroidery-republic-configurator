/**
 * Bestätigung einer erfolgreichen Selbststornierung.
 *
 * Wird versendet, nachdem der Kunde seine Bestellung über den signierten
 * Link innerhalb der Stornofrist storniert hat. Zweck ist ein belastbarer
 * Nachweis für den Kunden: Er soll schriftlich haben, dass die Bestellung
 * aufgehoben ist und keine Kosten entstehen.
 *
 * Bewusst kurz gehalten – die Bestelldetails hat der Kunde bereits in der
 * Bestätigungsmail, und eine erneute vollständige Aufstellung könnte den
 * Eindruck erwecken, es sei doch noch etwas offen.
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { EmailLayout } from './EmailLayout';

export function OrderCancellationEmail({
  orderNumber,
  storniertAm,
}: {
  orderNumber: string;
  /** Zeitpunkt der Stornierung, bereits formatiert. */
  storniertAm: string;
}) {
  const title = `Stornierung bestätigt: ${orderNumber}`;

  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Ihre Bestellung <strong>{orderNumber}</strong> wurde am {storniertAm} storniert.
      </Text>

      <Text style={{ marginTop: 12 }}>
        Es entstehen Ihnen dadurch <strong>keine Kosten</strong>. Eine Rechnung wird nicht gestellt, und wir beschaffen
        keine Ware für diesen Auftrag.
      </Text>

      <Text style={{ marginTop: 12 }}>
        Falls Sie die Bestellung versehentlich storniert haben oder etwas anpassen möchten, geben Sie uns gern kurz
        Bescheid – wir helfen Ihnen weiter.
      </Text>

      <Text style={{ marginTop: 12, fontSize: 13 }}>
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: {COMPANY.email}
      </Text>
    </EmailLayout>
  );
}
