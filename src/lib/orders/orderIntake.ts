/**
 * Kommunikation nach Bestelleingang – gebündelt an EINER Stelle.
 *
 * `orders.ts` orchestriert nur noch den Bestellablauf und ruft hier EINE
 * Funktion auf. Alles Fachliche liegt hier: Storno-Link erzeugen,
 * Kundenbestätigung senden, interne Benachrichtigung planen, Message-ID
 * sichern, Ereignisse schreiben.
 *
 * ── Die Bestellung hat IMMER Vorrang ──────────────────────────────────
 * Zum Zeitpunkt des Aufrufs ist die Bestellung bereits gespeichert. Nichts
 * hier darf sie gefährden: Jeder Teilschritt ist einzeln abgesichert, und
 * die Funktion wirft grundsätzlich nicht. Schlägt der Versand fehl, wird
 * das protokolliert – die Bestellung bleibt gültig und vollständig.
 *
 * ── Idempotenz ────────────────────────────────────────────────────────
 * Ein erneuter Aufruf für dieselbe Bestellung darf keine zweite interne
 * Benachrichtigung erzeugen. Als Merker dient `internal_notification_email_id`
 * an der Bestellung: Ist sie gesetzt, wurde bereits geplant und der Schritt
 * wird übersprungen.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS } from '@/config/orderProcess';
import { erzeugeBestellToken } from './orderAccessToken';
import { sendOrderConfirmationEmail, sendInternalOrderNotificationEmail } from '@/lib/email/orderEmails';
import { protokolliereBestellereignis } from './orderService';
import type { OrderRecord } from '@/lib/actions/orderTypes';

/** Basis-URL für Links in E-Mails. */
function basisUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3007').replace(/\/$/, '');
}

/**
 * Öffentlicher Link auf die Bestellansicht (mit Storno-Möglichkeit während
 * der Frist). Gibt null zurück, wenn kein Token erzeugt werden kann – die
 * Bestätigungsmail bleibt dann ohne Link, aber inhaltlich vollständig.
 */
export function bestellansichtUrl(orderId: string): string | null {
  const token = erzeugeBestellToken(orderId);
  if (!token) {
    console.warn('[orders] Kein Storno-Link erzeugt: ORDER_TOKEN_SECRET fehlt oder ist zu kurz.');
    return null;
  }
  return `${basisUrl()}/bestellung/${token}`;
}

/**
 * Hält einen einzelnen Versandvorgang in der Bestell-Historie fest.
 *
 * Nimmt bewusst das rohe `PromiseSettledResult` entgegen: So gibt es genau
 * einen Ort, an dem „geplant / gesendet / fehlgeschlagen" unterschieden wird,
 * statt die Fallunterscheidung je Empfänger zu wiederholen.
 *
 * Nicht-fatal wie die Historie insgesamt – `protokolliereBestellereignis`
 * schluckt seine eigenen Fehler.
 */
async function protokolliereVersand(
  orderId: string,
  anlass: string,
  ergebnis: PromiseSettledResult<{ success: boolean; messageId?: string }>,
  geplantFuer?: string
): Promise<void> {
  if (ergebnis.status === 'rejected') {
    await protokolliereBestellereignis({
      orderId,
      eventType: 'email_failed',
      reason: `E-Mail „${anlass}" konnte nicht versendet werden.`,
      detail: {
        anlass,
        fehler: ergebnis.reason instanceof Error ? ergebnis.reason.message : String(ergebnis.reason),
      },
    });
    return;
  }

  // Ein abgelehnter Versand meldet sich NICHT immer über eine Ausnahme –
  // sendEmail gibt Fehler auch als `success: false` zurück. Ohne diese
  // Prüfung stünde „versendet" in der Historie, obwohl nichts rausging.
  if (!ergebnis.value.success) {
    await protokolliereBestellereignis({
      orderId,
      eventType: 'email_failed',
      reason: `E-Mail „${anlass}" wurde vom Versanddienst abgelehnt.`,
      detail: { anlass },
    });
    return;
  }

  await protokolliereBestellereignis({
    orderId,
    eventType: geplantFuer ? 'email_scheduled' : 'email_sent',
    reason: geplantFuer
      ? `E-Mail „${anlass}" für ${geplantFuer} eingeplant.`
      : `E-Mail „${anlass}" versendet.`,
    detail: { anlass, messageId: ergebnis.value.messageId ?? null, geplantFuer: geplantFuer ?? null },
  });
}

/**
 * Versendet bzw. plant alle E-Mails zu einer eingegangenen Bestellung.
 *
 * Wirft NIE. Der Aufrufer braucht das Ergebnis nicht auszuwerten – die
 * Bestellung gilt unabhängig davon als erfolgreich.
 */
export async function verarbeiteBestelleingang(
  order: OrderRecord,
  productionSheetSignedUrl: string | null
): Promise<void> {
  const istBestellung = order.orderType === 'order';
  const db = createAdminClient();

  // Idempotenz-Prüfung: Wurde für diese Bestellung schon geplant?
  let bereitsGeplant = false;
  if (istBestellung) {
    const { data } = await db
      .from('orders')
      .select('internal_notification_email_id')
      .eq('id', order.id)
      .maybeSingle<{ internal_notification_email_id: string | null }>();
    bereitsGeplant = Boolean(data?.internal_notification_email_id);
    if (bereitsGeplant) {
      console.info(`[orders] Bestelleingang ${order.id} bereits verarbeitet – kein erneuter Versand.`);
      return;
    }
  }

  const startedAt = Date.now();

  // Bestellungen: interne Meldung ERST nach Ablauf der Stornofrist.
  // Anfragen haben keine Frist und gehen sofort raus.
  const geplantFuer = istBestellung
    ? new Date(Date.now() + INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS).toISOString()
    : undefined;

  const [kunde, intern] = await Promise.allSettled([
    sendOrderConfirmationEmail(order, bestellansichtUrl(order.id) ?? undefined),
    sendInternalOrderNotificationEmail(order, productionSheetSignedUrl, geplantFuer),
  ]);

  // Jeder Versand hinterlässt eine Spur in der Bestell-Historie – auch der
  // gescheiterte. Ohne das ließe sich später nicht beantworten, warum ein
  // Kunde keine Bestätigung erhalten hat.
  await protokolliereVersand(order.id, 'order_confirmation', kunde);
  await protokolliereVersand(order.id, 'internal_order_notification', intern, geplantFuer);

  if (kunde.status === 'rejected') {
    console.error('[orders] Kundenbestätigung fehlgeschlagen (nicht-fatal):', kunde.reason);
  }

  if (intern.status === 'rejected') {
    console.error('[orders] Interne Benachrichtigung fehlgeschlagen (nicht-fatal):', intern.reason);
  } else if (intern.value.messageId && istBestellung) {
    // Die ID wird gebraucht, um die geplante Mail bei einer Stornierung
    // zurückziehen zu können. Schlägt das Speichern fehl, bleibt die
    // Bestellung unberührt – im schlimmsten Fall geht später eine
    // überflüssige interne Mail raus.
    const { error } = await db
      .from('orders')
      .update({ internal_notification_email_id: intern.value.messageId })
      .eq('id', order.id);
    if (error) {
      console.error(`[orders] Message-ID der geplanten Mail nicht gespeichert (nicht-fatal):`, error.message);
    }
  }

  console.info(
    `[orders] Bestelleingang ${order.orderNumber} verarbeitet in ${Date.now() - startedAt} ms` +
      `${geplantFuer ? ` (interne Meldung geplant für ${geplantFuer})` : ''}.`
  );
}
