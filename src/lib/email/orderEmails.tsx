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
  /** Fehlermeldung des Versanddiensts bei success:false – für die
   *  Bestell-Historie (order_events.detail), damit ein Fehlschlag ohne
   *  Rückgriff auf ephemere Server-Logs nachvollziehbar bleibt. */
  error?: string;
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
import { OrderProofRequestEmail } from './templates/OrderProofRequestEmail';
import { ProofFeedbackEmail } from './templates/ProofFeedbackEmail';
import type { OrderRecord, RechnungFuerEmail } from '@/lib/actions/orderTypes';
import type { OrderItemsTableItem } from './templates/EmailLayout';

export async function sendOrderConfirmationEmail(
  order: OrderRecord,
  /** Link auf die öffentliche Bestellansicht (mit Storno-Möglichkeit während
   *  der Frist). Fehlt er – z.B. weil ORDER_TOKEN_SECRET nicht gesetzt ist –,
   *  bleibt die E-Mail trotzdem vollständig verständlich. */
  bestellansichtUrl?: string,
  /** Vorhanden, sobald die Rechnung bereits erstellt ist – wird als PDF
   *  angehängt UND im Text erwähnt, STATT einer eigenen Rechnungs-E-Mail
   *  (siehe orderCompletion.ts::schliesseBestellungAb). */
  rechnung?: RechnungFuerEmail | null
): Promise<EmailVersandErgebnis> {
  const isOrder = order.orderType === 'order';
  const subject = isOrder ? `Bestellbestätigung ${order.orderNumber}` : `Ihre Anfrage ${order.orderNumber}`;

  // EIN gemeinsames Gültigkeits-Gate für Text UND Anhang – niemals getrennt
  // geprüft. Sonst könnte (z.B. bei einem leeren/defekten PDF-Puffer) der
  // Text "im Anhang" behaupten, während tatsächlich kein Anhang mitgeschickt
  // wird. `rechnungGeprueft` ist deshalb die EINZIGE Stelle, die entscheidet
  // – sowohl `<OrderConfirmationEmail rechnung={…}>` unten als auch
  // `attachments` lesen ausschließlich aus dieser einen Variable.
  const rechnungGeprueft = rechnung && rechnung.pdf && rechnung.pdf.length > 0 ? rechnung : null;

  const result = await sendEmail({
    to: order.contact.email,
    subject,
    react: <OrderConfirmationEmail order={order} bestellansichtUrl={bestellansichtUrl} rechnung={rechnungGeprueft ?? undefined} />,
    kontext: { anlass: isOrder ? 'order_confirmation' : 'inquiry_confirmation', orderId: order.id },
    // Antworten sollen bei uns landen – auch solange der Absender technisch
    // noch onboarding@resend.dev ist (Domain nicht verifiziert).
    replyTo: getReplyToAddress(),
    ...(rechnungGeprueft
      ? { attachments: [{ filename: `Rechnung-${rechnungGeprueft.rechnungsnummer}.pdf`, content: rechnungGeprueft.pdf }] }
      : {}),
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
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
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
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
  /** Siehe OrderCancellationEmail.tsx – true nur, wenn zum Stornierungs-
   *  zeitpunkt bereits bezahlt war (payment_status='paid'). Default false,
   *  damit ein Aufrufer, der das Feld vergisst, den sicheren „keine Kosten"-
   *  Text bekommt statt fälschlich eine Erstattung zu versprechen. */
  erstattungFaellig?: boolean;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Stornierung bestätigt: ${params.orderNumber}`,
    react: (
      <OrderCancellationEmail
        orderNumber={params.orderNumber}
        storniertAm={params.storniertAm}
        erstattungFaellig={params.erstattungFaellig ?? false}
      />
    ),
    replyTo: getReplyToAddress(),
    kontext: { anlass: 'order_cancelled', orderId: params.orderId },
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
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
  /** orders.carrier – bestimmt, ob ein anklickbarer Tracking-Link gezeigt
   *  werden kann (aktuell nur für 'dhl' hinterlegt). */
  carrier?: string | null;
  bestellansichtUrl?: string | null;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Ihre Bestellung ${params.orderNumber} ist unterwegs`,
    react: (
      <OrderShippedEmail
        orderNumber={params.orderNumber}
        trackingNummer={params.trackingNummer}
        carrier={params.carrier ?? null}
        bestellansichtUrl={params.bestellansichtUrl ?? null}
      />
    ),
    kontext: { anlass: 'order_shipped', orderId: params.orderId },
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
}

/**
 * Benachrichtigt den Kunden, dass die Produktion begonnen hat.
 *
 * Wird ausschließlich von orderService beim Übergang nach `in_production`
 * aufgerufen — NACH dem erfolgreichen Statuswechsel. Nimmt (anders als die
 * übrigen Status-Mails) das volle `OrderRecord` entgegen, damit die Mail die
 * Positionsliste über dieselbe OrderItemsTable wie die Bestellbestätigung
 * zeigen kann (Ausbauplan, quickwins).
 */
export async function sendOrderInProductionEmail(params: {
  orderId: string;
  orderNumber: string;
  items: OrderItemsTableItem[];
  empfaenger: string;
  bestellansichtUrl?: string | null;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Ihre Bestellung ${params.orderNumber} ist in Produktion`,
    react: (
      <OrderInProductionEmail
        orderNumber={params.orderNumber}
        items={params.items}
        bestellansichtUrl={params.bestellansichtUrl}
      />
    ),
    kontext: { anlass: 'order_in_production', orderId: params.orderId },
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
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
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
}

/**
 * Bittet die Kundschaft um Freigabe der Druckvorschau – admin-ausgelöst
 * (sendeVorschauFreigabeAnfrage), NICHT bei einem Statusübergang. Anders als
 * bei den übrigen Status-Mails ist `bestellansichtUrl` hier PFLICHT: der Link
 * ist der eigentliche Zweck dieser Mail (siehe OrderProofRequestEmail.tsx).
 */
export async function sendOrderProofRequestEmail(params: {
  orderId: string;
  orderNumber: string;
  empfaenger: string;
  bestellansichtUrl: string;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: params.empfaenger,
    subject: `Bitte Druckvorschau für ${params.orderNumber} freigeben`,
    react: <OrderProofRequestEmail orderNumber={params.orderNumber} bestellansichtUrl={params.bestellansichtUrl} />,
    kontext: { anlass: 'order_proof_request', orderId: params.orderId },
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
}

/**
 * Interne Benachrichtigung, wenn die Kundschaft auf die Freigabeanfrage
 * reagiert – Freigabe erteilt oder Änderung gewünscht (freigebeVorschauDurch-
 * Kunden/wuenscheAenderungDurchKunden). Nicht-fatal beim Aufrufer: das
 * fachliche Ereignis steht bereits über protokolliereBestellereignis fest,
 * diese Mail ist reine Zusatzinformation.
 */
export async function sendProofFeedbackEmail(params: {
  orderId: string;
  orderNumber: string;
  adminUrl: string;
  art: 'freigegeben' | 'aenderung_gewuenscht';
  kundeEmail: string;
  kommentar?: string;
}): Promise<EmailVersandErgebnis> {
  const result = await sendEmail({
    to: getInternalNotificationAddress(),
    subject:
      params.art === 'freigegeben'
        ? `Vorschau freigegeben: ${params.orderNumber}`
        : `Änderung gewünscht: ${params.orderNumber}`,
    react: (
      <ProofFeedbackEmail
        orderNumber={params.orderNumber}
        adminUrl={params.adminUrl}
        art={params.art}
        kommentar={params.kommentar}
      />
    ),
    replyTo: params.kundeEmail,
    kontext: { anlass: 'proof_feedback', orderId: params.orderId },
  });
  return {
    success: result.success,
    ...(result.messageId ? { messageId: result.messageId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
}
