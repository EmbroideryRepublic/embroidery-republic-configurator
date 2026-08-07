/**
 * Benachrichtigung beim Übergang in den Status 'completed' – der Abschluss
 * des sichtbaren Bestellablaufs (Ware ist beim Kunden angekommen bzw. der
 * Vorgang gilt als erledigt). Gesendet von orderService.ts, NACH dem
 * erfolgreichen Statuswechsel.
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { COLORS, EmailLayout } from './EmailLayout';

export function OrderCompletedEmail({ orderNumber }: { orderNumber: string }) {
  const title = `Bestellung ${orderNumber} abgeschlossen`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Ihre Bestellung <strong>{orderNumber}</strong> ist abgeschlossen. Wir hoffen, die Ware gefällt Ihnen!
      </Text>
      <Text style={{ marginTop: 12 }}>
        Sollte doch einmal etwas nicht passen, melden Sie sich bitte zeitnah bei uns – wir finden eine Lösung.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 13 }}>
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: {COMPANY.email}
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Vielen Dank für Ihr Vertrauen in Embroidery Republic – wir freuen uns auf die nächste Bestellung.
      </Text>
    </EmailLayout>
  );
}
