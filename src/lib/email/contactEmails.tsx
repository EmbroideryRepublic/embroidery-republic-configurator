/**
 * Dünner Domain-Wrapper für die Kontaktformular-E-Mail – ruft ausschließlich
 * den generischen Versand-Kern (sendEmail.ts) mit dem passenden Template auf,
 * analog zu orderEmails.tsx. Keine neue Infrastruktur.
 */
import { sendEmail } from './sendEmail';
import { getInternalNotificationAddress } from './resendClient';
import { ContactMessageEmail } from './templates/ContactMessageEmail';

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
    // Antworten gehen direkt an die/den Interessent:in statt an die interne Adresse.
    replyTo: payload.email,
  });
  return { success: result.success };
}
