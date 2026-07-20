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
import type { OrderRecord } from '@/lib/actions/orderTypes';

export async function sendOrderConfirmationEmail(order: OrderRecord): Promise<{ success: boolean }> {
  const isOrder = order.orderType === 'order';
  const subject = isOrder ? `Bestellbestätigung ${order.orderNumber}` : `Ihre Anfrage ${order.orderNumber}`;
  const result = await sendEmail({
    to: order.contact.email,
    subject,
    react: <OrderConfirmationEmail order={order} />,
    // Antworten sollen bei uns landen – auch solange der Absender technisch
    // noch onboarding@resend.dev ist (Domain nicht verifiziert).
    replyTo: getReplyToAddress(),
  });
  return { success: result.success };
}

export async function sendInternalOrderNotificationEmail(
  order: OrderRecord,
  productionSheetSignedUrl: string | null
): Promise<{ success: boolean }> {
  const isOrder = order.orderType === 'order';
  const subject = `${isOrder ? 'Neue Bestellung' : 'Neue Anfrage'}: ${order.orderNumber}`;
  const result = await sendEmail({
    to: getInternalNotificationAddress(),
    subject,
    react: <InternalOrderNotificationEmail order={order} productionSheetSignedUrl={productionSheetSignedUrl} />,
    // Direkt aus der Benachrichtigung heraus der Kundin/dem Kunden antworten.
    replyTo: order.contact.email,
  });
  return { success: result.success };
}
