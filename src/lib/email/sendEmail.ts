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
import { render } from '@react-email/render';
import { getResendClient, getFromAddress, getInternalNotificationAddress } from './resendClient';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/** Testmodus ist AN, außer der Wert ist exakt "false" – bewusst sicherer
 *  Default, solange keine verifizierte Resend-Absender-Domain final
 *  eingerichtet ist. Im Testmodus geht JEDE Mail an EMAIL_TEST_RECIPIENT
 *  (Fallback: INTERNAL_NOTIFICATION_EMAIL) statt an die echte Adresse,
 *  der Betreff bekommt einen "[TEST → ursprüngliche@adresse]"-Hinweis. */
function isTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE !== 'false';
}

export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams): Promise<SendEmailResult> {
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
    });
    if (error) {
      console.error(`[email] Versand fehlgeschlagen (${effectiveSubject}): ${error.message}`);
      return { success: false, error: error.message };
    }
    // Bewusst beibehalten: die Resend-Nachrichten-ID ist der einzige Weg, eine
    // konkrete Mail später im Resend-Dashboard nachzuverfolgen (z.B. bei einer
    // Kundenrückfrage „ich habe nichts bekommen"). Kein Debug-Rauschen.
    console.info(`[email] Gesendet: "${effectiveSubject}" → ${originalTo} (ID ${data?.id ?? 'unbekannt'})`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Versand fehlgeschlagen (${effectiveSubject}): ${message}`);
    return { success: false, error: message };
  }
}
