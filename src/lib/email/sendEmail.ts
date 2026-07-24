/**
 * Generischer, wiederverwendbarer Versand-Kern – JEDE E-Mail-Art
 * (Bestellbestätigung, interne Benachrichtigung und künftig Zahlung
 * eingegangen, Produktionsstatus, Versandbestätigung, Passwort-Reset,
 * Kontoverifizierung, Kontaktformular, Newsletter, ...) ruft ausschließlich
 * diese Funktion auf, nie direkt Resend.
 *
 * Rendert das übergebene React-Element selbst zu HTML + Text-Fallback
 * (statt `react:` direkt an resend.emails.send() zu übergeben) – macht
 * beide Ausgaben direkt inspizier-/testbar und umgeht die Unsicherheit,
 * wie Next.js Resends internen lazy `require('@react-email/render')`
 * bündelt (siehe next.config.js-Kommentar zu @resvg/resvg-js für einen
 * bereits aufgetretenen Fall dieser Problemklasse).
 *
 * Wirft NIE einen Fehler nach außen – fehlender API-Key oder ein
 * fehlgeschlagener Versand werden geloggt und als {success:false}
 * zurückgegeben (dieselbe "DB ist Quelle der Wahrheit, Mail ist nice-to-
 * have"-Haltung wie im Rest des Bestellflusses, siehe orders.ts).
 */
import type { ReactElement } from 'react';
import { protokoll } from '@/lib/observability/log';
import { render } from '@react-email/render';
import { getResendClient, getFromAddress, getInternalNotificationAddress } from './resendClient';
import { istTestmodus, meldeAbgefangen, testmodusKennung } from '@/config/testmodus';

/**
 * Warum diese E-Mail entsteht. Pflichtangabe, damit im Nachhinein
 * nachvollziehbar ist, wodurch eine Nachricht ausgelöst wurde – statt nur
 * zu sehen, DASS etwas versendet wurde.
 *
 * Die Werte sind bewusst frei erweiterbar (neue Anlässe brauchen keine
 * Typänderung an dieser Datei), aber immer anzugeben.
 */
export interface EmailKontext {
  /** z.B. 'order_confirmation', 'order_cancelled', 'internal_order_notification'. */
  anlass: string;
  /** Bezugsbestellung, sofern die Nachricht zu einer gehört. */
  orderId?: string;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
  /** Auslöser der Nachricht – erscheint im Protokoll und ermöglicht später
   *  eine vollständige Kommunikationshistorie. */
  kontext: EmailKontext;
  /**
   * Geplanter Versandzeitpunkt (ISO). Resend hält die Nachricht bis dahin
   * zurück. Wird für die interne Benachrichtigung genutzt, die erst nach
   * Ablauf der Stornofrist zugestellt werden soll.
   */
  scheduledAt?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
  /** Resend-Nachrichten-ID – nötig, um eine GEPLANTE Mail später wieder
   *  zurückziehen zu können. */
  messageId?: string;
}

/** Testmodus ist AN, außer der Wert ist exakt "false" – bewusst sicherer
 *  Default, solange keine verifizierte Resend-Absender-Domain final
 *  eingerichtet ist. Im Testmodus geht JEDE Mail an EMAIL_TEST_RECIPIENT
 *  (Fallback: INTERNAL_NOTIFICATION_EMAIL) statt an die echte Adresse,
 *  der Betreff bekommt einen "[TEST → ursprüngliche@adresse]"-Hinweis. */
function isTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE !== 'false';
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  kontext,
  scheduledAt,
}: SendEmailParams): Promise<SendEmailResult> {
  // ── Testmodus: nichts verlässt den Rechner ──────────────────────────
  // Bewusst {success: true} MIT Nachrichten-ID statt eines Fehlschlags: Ein
  // `success: false` würde den FEHLERZWEIG des Bestellprozesses prüfen statt
  // des Erfolgszweigs. Die ID wird eine Ebene höher gebraucht – sie landet in
  // orders.internal_notification_email_id und in der Bestell-Historie, und
  // genau dort weist der End-to-End-Test sie später nach.
  //
  // Der Aufruf steht VOR getResendClient(): Der Testlauf soll auch ohne
  // hinterlegten RESEND_API_KEY vollständig durchlaufen.
  if (istTestmodus()) {
    const empfaenger = Array.isArray(to) ? to.join(', ') : to;
    meldeAbgefangen('E-Mail', `„${subject}" an ${empfaenger}${scheduledAt ? ` (geplant für ${scheduledAt})` : ''}`);
    return { success: true, messageId: testmodusKennung(kontext.anlass) };
  }

  const resend = getResendClient();
  if (!resend) return { success: false, error: 'RESEND_API_KEY fehlt' };

  const testMode = isTestMode();
  const originalTo = Array.isArray(to) ? to.join(', ') : to;
  const effectiveTo = testMode ? process.env.EMAIL_TEST_RECIPIENT || getInternalNotificationAddress() : to;
  const effectiveSubject = testMode ? `[TEST → ${originalTo}] ${subject}` : subject;

  try {
    // Rendern bewusst INNERHALB des try: ein Template-/Renderfehler soll wie
    // ein Versandfehler als {success:false} zurückkommen, statt zu werfen
    // (Vertrag: sendEmail wirft NIE nach außen).
    const html = await render(react);
    const text = await render(react, { plainText: true });

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: effectiveTo,
      subject: effectiveSubject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
      // Geplanter Versand: Resend hält die Nachricht bis zum Zeitpunkt
      // zurück. Wird u.a. für die interne Benachrichtigung genutzt, die erst
      // nach Ablauf der Stornofrist zugestellt werden soll.
      ...(scheduledAt ? { scheduledAt } : {}),
    });
    if (error) {
      protokoll.fehler('EMAIL', 'versand_fehlgeschlagen', effectiveSubject, error);
      return { success: false, error: error.message };
    }
    // Bewusst beibehalten: die Resend-Nachrichten-ID ist der einzige Weg, eine
    // konkrete Mail später im Resend-Dashboard nachzuverfolgen (z.B. bei einer
    // Kundenrückfrage „ich habe nichts bekommen"). Kein Debug-Rauschen.
    // Der ANLASS steht bewusst im Protokoll: Ohne ihn liesse sich später
    // nicht mehr feststellen, wodurch eine Nachricht entstanden ist.
    protokoll.info('EMAIL', scheduledAt ? 'geplant' : 'gesendet', effectiveSubject, {
      anlass: kontext.anlass,
      bestellung: kontext.orderId,
      nachricht_id: data?.id ?? 'unbekannt',
      geplant_fuer: scheduledAt,
    });
    return { success: true, ...(data?.id ? { messageId: data.id } : {}) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    protokoll.fehler('EMAIL', 'versand_fehlgeschlagen', effectiveSubject, err);
    return { success: false, error: message };
  }
}
