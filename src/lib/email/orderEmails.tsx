/**
 * Ergebnis eines Versandvorgangs.
 *
 * Die `messageId` ist die Kennung beim Versanddienst. Sie wird in der
 * Bestell-Historie festgehalten und ist damit die Brücke zwischen einer
 * Bestellung und einer konkret versendeten E-Mail. Sie fehlt, wenn der
 * Versand fehlschlug oder im Testmodus nichts rausging – deshalb optional.
 */
export interface EmailVersandErgebnis {
  success: boolean;
  messageId?: string;
}

/**
 * Dünne Domain-Wrapper für bestellbezogene E-Mails – rufen ausschließlich
 * den generischen Versand-Kern (sendEmail.ts) mit dem passenden React-
 * Template auf. Namensschema `send<Art>Email()` überträgt sich direkt auf
 * künftige E-Mail-Arten (z.B. sendPaymentReceivedEmail, in einer neuen
 * Datei wie paymentEmails.tsx, ebenfalls über sendEmail()).
 */
import { sendEmail } from './sendEmail';
import { getInternalNotificationAddress, getReplyToAddress } from './resendClient';
import { OrderConfirmationEmail } from './templates/OrderConfirmationEmail';
import { InternalOrderNotificationEmail } from './templates/InternalOrderNotificationEmail';
import { OrderCancellationEmail } from './templates/OrderCancellationEmail';
import { OrderShippedEmail } from './templates/OrderShippedEmail';
import { OrderInProductionEmail } from './templates/OrderInProductionEmail';
import { OrderCompletedEmail } from './templates/OrderCompletedEmail';
import type { OrderRecord } from '@/lib/actions/orderTypes';

export async function sendOrderConfirmationEmail(
  order: OrderRecord,
  /** Link auf die öffentliche Bestellansicht (mit Storno-Möglichkeit während
   *  der Frist). Fehlt er – z.B. weil ORDER_TOKEN_SECRET nicht gesetzt ist –,
   *  bleibt die E-Mail trotzdem vollständig verständlich. */
  bestellansichtUrl?: string
): Promise<EmailVersandErgebnis> {
  const isOrder = order.orderType === 'order';
  const subject = isOrder ? `Bestellbestätigung ${order.orderNumber}` : `Ihre Anfrage ${order.orderNumber}`;
  const result = await sendEmail({
    to: order.contact.email,
    subject,
    react: <OrderConfirmationEmail order={order} bestellansichtUrl={bestellansichtUrl} />,
    kontext: { anlass: isOrder ? 'order_confirmation' : 'inquiry_confirmation', orderId: order.id },
    // Antworten sollen bei uns landen – auch solange der Absender technisch
    // noch onboarding@resend.dev ist (Domain nicht verifiziert).
    replyTo: getReplyToAddress(),
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}

export async function sendInternalOrderNotificationEmail(
  order: OrderRecord,
  productionSheetSignedUrl: string | null,
  /** Geplanter Zustellzeitpunkt (ISO). Bestellungen werden erst NACH Ablauf
   *  der Stornofrist gemeldet – der Betreiber soll nicht über etwas
   *  informiert werden, das Minuten später storniert wird. Anfragen haben
   *  keine Frist und gehen sofort raus. */
  scheduledAt?: string
): Promise<EmailVersandErgebnis> {
  const isOrder = order.orderType === 'order';
  const subject = `${isOrder ? 'Neue Bestellung' : 'Neue Anfrage'}: ${order.orderNumber}`;
  const result = await sendEmail({
    to: getInternalNotificationAddress(),
    subject,
    react: <InternalOrderNotificationEmail order={order} productionSheetSignedUrl={productionSheetSignedUrl} />,
    // Direkt aus der Benachrichtigung heraus der Kundin/dem Kunden antworten.
    replyTo: order.contact.email,
    kontext: { anlass: 'internal_order_notification', orderId: order.id },
    ...(scheduledAt ? { scheduledAt } : {}),
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}

/**
 * Bestätigt dem Kunden eine erfolgreiche Selbststornierung.
 *
 * Wird ausschließlich von orderService aufgerufen – und zwar NACH dem
 * erfolgreichen Statuswechsel. Ein Fehlschlag hier darf die Stornierung
 * nicht in Frage stellen; der Aufrufer behandelt das entsprechend.
 */
export async function sendOrderCancellationEmail(params: {
  orderId: string;
  orderNumber: string;
  empfaenger: string;
  storniertAm: string;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Stornierung bestätigt: ${params.orderNumber}`,
    react: <OrderCancellationEmail orderNumber={params.orderNumber} storniertAm={params.storniertAm} />,
    replyTo: getReplyToAddress(),
    kontext: { anlass: 'order_cancelled', orderId: params.orderId },
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}

/**
 * Benachrichtigt den Kunden über den Versand.
 *
 * Wird ausschließlich von orderService beim Übergang nach `shipped`
 * aufgerufen — NACH dem erfolgreichen Statuswechsel. Ein Fehlschlag hier
 * darf den Versandstatus nicht in Frage stellen.
 */
export async function sendOrderShippedEmail(params: {
  orderId: string;
  orderNumber: string;
  empfaenger: string;
  trackingNummer: string | null;
  bestellansichtUrl?: string | null;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Ihre Bestellung ${params.orderNumber} ist unterwegs`,
    react: (
      <OrderShippedEmail
        orderNumber={params.orderNumber}
        trackingNummer={params.trackingNummer}
        bestellansichtUrl={params.bestellansichtUrl ?? null}
      />
    ),
    kontext: { anlass: 'order_shipped', orderId: params.orderId },
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}

/**
 * Benachrichtigt den Kunden, dass die Produktion begonnen hat.
 *
 * Wird ausschließlich von orderService beim Übergang nach `in_production`
 * aufgerufen — NACH dem erfolgreichen Statuswechsel.
 */
export async function sendOrderInProductionEmail(params: {
  orderId: string;
  orderNumber: string;
  empfaenger: string;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Ihre Bestellung ${params.orderNumber} ist in Produktion`,
    react: <OrderInProductionEmail orderNumber={params.orderNumber} />,
    kontext: { anlass: 'order_in_production', orderId: params.orderId },
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}

/**
 * Benachrichtigt den Kunden über den Abschluss der Bestellung.
 *
 * Wird ausschließlich von orderService beim Übergang nach `completed`
 * aufgerufen — NACH dem erfolgreichen Statuswechsel.
 */
export async function sendOrderCompletedEmail(params: {
  orderId: string;
  orderNumber: string;
  empfaenger: string;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Bestellung ${params.orderNumber} abgeschlossen`,
    react: <OrderCompletedEmail orderNumber={params.orderNumber} />,
    kontext: { anlass: 'order_completed', orderId: params.orderId },
  });
  return { success: result.success, ...(result.messageId ? { messageId: result.messageId } : {}) };
}
