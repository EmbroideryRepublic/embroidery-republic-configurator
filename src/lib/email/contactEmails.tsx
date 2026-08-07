/**
 * Dünner Domain-Wrapper für die Kontaktformular-E-Mail – ruft ausschließlich
 * den generischen Versand-Kern (sendEmail.ts) mit dem passenden Template auf,
 * analog zu orderEmails.tsx. Keine neue Infrastruktur.
 */
import { sendEmail } from './sendEmail';
import { getInternalNotificationAddress, getReplyToAddress } from './resendClient';
import { ContactMessageEmail } from './templates/ContactMessageEmail';
import { ContactAutoReplyEmail } from './templates/ContactAutoReplyEmail';

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function sendContactMessageEmail(payload: ContactMessagePayload): Promise<{ success: boolean }> {
  const subjectLine = payload.subject?.trim()
    ? `Kontaktanfrage: ${payload.subject.trim()}`
    : `Kontaktanfrage von ${payload.name}`;

  const result = await sendEmail({
    to: getInternalNotificationAddress(),
    subject: subjectLine,
    react: <ContactMessageEmail {...payload} />,
    kontext: { anlass: 'contact_form' },
    // Antworten gehen direkt an die/den Interessent:in statt an die interne Adresse.
    replyTo: payload.email,
  });

  // Eingangsbestätigung AN die anfragende Person – nicht-fatal: Die interne
  // Benachrichtigung (oben) ist der eigentlich wichtige Versand; ohne
  // Bestätigung würde die Anfrage selbst trotzdem ankommen.
  await sendEmail({
    to: payload.email,
    subject: 'Ihre Nachricht ist bei uns angekommen',
    react: <ContactAutoReplyEmail name={payload.name} message={payload.message} />,
    kontext: { anlass: 'contact_form_autoreply' },
    replyTo: getReplyToAddress(),
  }).catch(() => {});

  return { success: result.success };
}
