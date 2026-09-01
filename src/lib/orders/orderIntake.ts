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
 * Die Kundenbestätigung und die interne Meldung haben JEWEILS ihren eigenen,
 * unabhängigen Erfolgsnachweis:
 *
 *   – Kundenbestätigung: `orders.order_confirmation_sent_at` (Migration 0030),
 *     claim-geschützt über `versucheBestellbestaetigung` unten. Bewusst
 *     GETRENNT von der internen Meldung – schlägt nur die Kundenbestätigung
 *     fehl, während die interne Meldung durchkommt, darf ein späterer Retry
 *     sie trotzdem erneut versuchen (siehe Vorfall 2026-08-21: vorher hing
 *     die gesamte Funktion an `internal_notification_email_id` und hätte in
 *     genau diesem Fall die Kundenbestätigung für immer übersprungen).
 *   – Interne Meldung: `internal_notification_email_id` an der Bestellung –
 *     ist sie gesetzt, wurde bereits geplant, der Schritt wird übersprungen.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS } from '@/config/orderProcess';
import { erzeugeBestellToken } from './orderAccessToken';
import {
  sendOrderConfirmationEmail, sendInternalOrderNotificationEmail, type EmailVersandErgebnis,
} from '@/lib/email/orderEmails';
import { protokolliereBestellereignis, protokolliereVersand } from './orderService';
import type { OrderRecord, RechnungFuerEmail } from '@/lib/actions/orderTypes';

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
 * Versucht die Kundenbestätigung zuzustellen – claim-geschützt
 * (`beanspruche_bestellbestaetigung`, Migration 0030), damit weder ein
 * zeitgleicher zweiter Aufruf noch der Cron-Retry
 * (`holeOffeneBestellbestaetigungenNach`, orderCompletion.ts) dieselbe
 * Bestätigung doppelt verschickt. `order_confirmation_sent_at` ist der
 * ALLEINIGE Erfolgsnachweis für DIESE eine E-Mail.
 *
 * Nur für Bestellungen (order_type='order') gedacht – der Aufrufer
 * (`verarbeiteBestelleingang`) ruft für Anfragen unverändert direkt
 * `sendOrderConfirmationEmail` auf, ohne Claim (Anfragen haben keinen
 * Zahlungs-/Webhook-Umweg, der einen Retry nötig macht).
 *
 * Wirft nie – jeder Fehlschlag (Claim-Aufruf oder Versand) kommt als
 * `{success:false, error}` zurück, exakt wie `sendEmail` selbst.
 */
export async function versucheBestellbestaetigung(
  order: OrderRecord,
  rechnung: RechnungFuerEmail | null = null
): Promise<EmailVersandErgebnis> {
  const db = createAdminClient();
  const { data: anspruch, error: claimFehler } = await db.rpc('beanspruche_bestellbestaetigung', {
    p_order_id: order.id,
  });
  if (claimFehler) {
    console.error(`[orders] Bestätigungs-Anspruch für ${order.id} fehlgeschlagen:`, claimFehler.message);
    return { success: false, error: claimFehler.message };
  }
  const beansprucht = Array.isArray(anspruch) ? anspruch.length > 0 : Boolean(anspruch);
  if (!beansprucht) {
    // Bereits erfolgreich zugestellt oder ein anderer Lauf ist gerade dran.
    return { success: true };
  }

  const ergebnis = await sendOrderConfirmationEmail(order, bestellansichtUrl(order.id) ?? undefined, rechnung);
  if (ergebnis.success) {
    const { error } = await db
      .from('orders')
      .update({ order_confirmation_sent_at: new Date().toISOString() })
      .eq('id', order.id);
    if (error) {
      // Versand war erfolgreich (Resend hat angenommen) – nur die Markierung
      // schlug fehl. Anspruch bewusst NICHT freigeben: Ein Retry würde sonst
      // eine bereits zugestellte Mail ein zweites Mal verschicken. Rein
      // kosmetisches Risiko (order_confirmation_sent_at bleibt null, obwohl
      // zugestellt), kein Kundenschaden.
      console.error(`[orders] order_confirmation_sent_at für ${order.id} nicht gespeichert:`, error.message);
    }
  } else {
    await db.rpc('gib_bestellbestaetigung_frei', { p_order_id: order.id });
  }
  return ergebnis;
}

/**
 * Versendet bzw. plant alle E-Mails zu einer eingegangenen Bestellung.
 *
 * Wirft NIE. Der Aufrufer braucht das Ergebnis nicht auszuwerten – die
 * Bestellung gilt unabhängig davon als erfolgreich.
 */
export async function verarbeiteBestelleingang(
  order: OrderRecord,
  productionSheetSignedUrl: string | null,
  /** Vorhanden, sobald die Rechnung VOR dieser Kommunikation bereits
   *  erstellt wurde (Regelfall, siehe orderCompletion.ts::
   *  schliesseBestellungAb) – wird dann in DERSELBEN Bestellbestätigung
   *  mitgeschickt statt in einer eigenen E-Mail. */
  rechnung: RechnungFuerEmail | null = null
): Promise<void> {
  const istBestellung = order.orderType === 'order';
  const db = createAdminClient();

  // Idempotenz-Prüfung NUR für die interne Meldung – siehe Kopfkommentar.
  // Die Kundenbestätigung hat ihren eigenen Claim (versucheBestellbestaetigung)
  // und wird deshalb unten IMMER versucht, unabhängig davon, ob die interne
  // Meldung bereits geplant ist.
  let bereitsGeplant = false;
  if (istBestellung) {
    const { data } = await db
      .from('orders')
      .select('internal_notification_email_id')
      .eq('id', order.id)
      .maybeSingle<{ internal_notification_email_id: string | null }>();
    bereitsGeplant = Boolean(data?.internal_notification_email_id);
  }

  const startedAt = Date.now();

  // Bestellungen: interne Meldung ERST nach Ablauf der Stornofrist.
  // Anfragen haben keine Frist und gehen sofort raus.
  const geplantFuer = istBestellung
    ? new Date(Date.now() + INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS).toISOString()
    : undefined;

  const [kunde, intern] = await Promise.allSettled([
    istBestellung
      ? versucheBestellbestaetigung(order, rechnung)
      : sendOrderConfirmationEmail(order, bestellansichtUrl(order.id) ?? undefined),
    bereitsGeplant
      ? Promise.resolve<EmailVersandErgebnis>({ success: true })
      : sendInternalOrderNotificationEmail(order, productionSheetSignedUrl, geplantFuer),
  ]);

  // Jeder Versand hinterlässt eine Spur in der Bestell-Historie – auch der
  // gescheiterte. Ohne das ließe sich später nicht beantworten, warum ein
  // Kunde keine Bestätigung erhalten hat.
  await protokolliereVersand(order.id, 'order_confirmation', kunde);
  if (!bereitsGeplant) {
    await protokolliereVersand(order.id, 'internal_order_notification', intern, geplantFuer);
  } else {
    console.info(`[orders] Bestelleingang ${order.id}: interne Meldung bereits geplant – kein erneuter Versand.`);
  }

  if (kunde.status === 'rejected') {
    console.error('[orders] Kundenbestätigung fehlgeschlagen (nicht-fatal):', kunde.reason);
  }

  if (!bereitsGeplant) {
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
  }

  console.info(
    `[orders] Bestelleingang ${order.orderNumber} verarbeitet in ${Date.now() - startedAt} ms` +
      `${geplantFuer && !bereitsGeplant ? ` (interne Meldung geplant für ${geplantFuer})` : ''}.`
  );
}
