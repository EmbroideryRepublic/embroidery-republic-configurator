/**
 * Benachrichtigung beim Übergang in den Status 'in_production'. Gesendet
 * von orderService.ts (setzeBestellstatus), NACH dem erfolgreichen
 * Statuswechsel im Adminbereich.
 */
import { Text } from '@react-email/components';
import { COLORS, EmailLayout } from './EmailLayout';

export function OrderInProductionEmail({ orderNumber }: { orderNumber: string }) {
  const title = `Ihre Bestellung ${orderNumber} ist in Produktion`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Gute Nachrichten: Wir haben mit der Fertigung Ihrer Bestellung <strong>{orderNumber}</strong> begonnen.
      </Text>
      <Text style={{ marginTop: 12 }}>
        Sobald die Ware versandbereit ist, erhalten Sie von uns eine Versandbestätigung mit
        Sendungsverfolgung.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand 1 bis 2 Werktage.
      </Text>
    </EmailLayout>
  );
}
