/**
 * Benachrichtigung beim Übergang in den Status 'in_production'. Gesendet
 * von orderService.ts (setzeBestellstatus), NACH dem erfolgreichen
 * Statuswechsel im Adminbereich.
 *
 * Ausbauplan (quickwins): trug bislang nur drei Sätze mit hart kodiertem
 * "3 bis 4 Werktage" statt der zentralen Konstante, ohne Link zur
 * Bestellansicht und ohne Positionsliste – beantwortet "Wann kommt es?"
 * jetzt ohne Rückfrage.
 *
 * Bewusst flache Props statt volles OrderRecord (wie bei OrderShippedEmail):
 * orderService.ts::sendeInProductionMail() lädt die Positionen über eine
 * eigene schlanke Query statt über orderCompletion.ts – ein Import von dort
 * wäre ein Zirkelimport (orderCompletion.ts importiert bereits von
 * orderService.ts, siehe dortiger Kopfkommentar).
 */
import { Text, Link } from '@react-email/components';
import { COLORS, EmailLayout, OrderItemsTable, type OrderItemsTableItem } from './EmailLayout';
import { PRODUKTIONSZEIT_TEXT, VERSANDTAGE } from '@/config/company';

export function OrderInProductionEmail({
  orderNumber,
  items,
  bestellansichtUrl,
}: {
  orderNumber: string;
  items: OrderItemsTableItem[];
  /** Fehlt, wenn kein Token erzeugt werden konnte (ORDER_TOKEN_SECRET) –
   *  die Mail bleibt dann ohne Link, aber inhaltlich vollständig. */
  bestellansichtUrl?: string | null;
}) {
  const title = `Ihre Bestellung ${orderNumber} ist in Produktion`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Gute Nachrichten: Wir haben mit der Fertigung Ihrer Bestellung <strong>{orderNumber}</strong> begonnen.
      </Text>
      <OrderItemsTable items={items} />
      <Text style={{ marginTop: 12 }}>
        Sobald die Ware versandbereit ist, erhalten Sie von uns eine Versandbestätigung mit
        Sendungsverfolgung.
      </Text>
      {bestellansichtUrl && (
        <Text style={{ marginTop: 12 }}>
          <Link href={bestellansichtUrl}>Bestellung ansehen</Link>
        </Text>
      )}
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Die reguläre Produktionszeit beträgt {PRODUKTIONSZEIT_TEXT}, der anschließende Versand {VERSANDTAGE.von} bis{' '}
        {VERSANDTAGE.bis} Werktage.
      </Text>
    </EmailLayout>
  );
}
