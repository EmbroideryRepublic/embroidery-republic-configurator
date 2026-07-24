'use server';

/**
 * Server-Action für das Kontaktformular (/kontakt).
 *
 * Bewusst schlank und OHNE neue Infrastruktur: nutzt ausschließlich den
 * bereits vorhandenen E-Mail-Versand (Resend über sendEmail.ts). Der Client-
 * Input wird serverseitig validiert – die Client-Validierung ist reiner
 * Komfort. Missbrauchsschutz: Honeypot-Feld + zentrales Rate-Limit
 * (lib/security/rateLimit.ts).
 */
import { pruefeRateLimit } from '@/lib/security/rateLimit';
import { sendContactMessageEmail } from '@/lib/email/contactEmails';

export interface ContactFormInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /**
   * Honeypot: für echte Nutzer:innen unsichtbar und immer leer. Ein befülltes
   * Feld deutet stark auf einen Bot hin – wir signalisieren Erfolg, versenden
   * aber nichts (kein Hinweis, der einem Bot Rückschlüsse erlaubt).
   */
  website?: string;
}

export interface ContactFormResult {
  success: boolean;
  error?: string;
}

// Rate-Limit: zentral in lib/security/rateLimit.ts. Der frühere Zähler lag
// im Prozessspeicher und war auf einer serverlosen Plattform wirkungslos –
// jede Instanz zählte für sich (siehe docs/rate-limiting.md).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(input: ContactFormInput): Promise<ContactFormResult> {
  // 1) Honeypot: befülltes Feld => stiller "Erfolg" ohne Versand.
  if (input.website && input.website.trim() !== '') {
    return { success: true };
  }

  // 2) Serverseitige Validierung (autoritativ, unabhängig vom Client).
  const name = input.name?.trim() ?? '';
  const email = input.email?.trim() ?? '';
  const subject = input.subject?.trim() ?? '';
  const message = input.message?.trim() ?? '';

  if (name.length < 2 || name.length > 100) {
    return { success: false, error: 'Bitte geben Sie Ihren Namen an (2–100 Zeichen).' };
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' };
  }
  if (subject.length > 150) {
    return { success: false, error: 'Der Betreff ist zu lang (max. 150 Zeichen).' };
  }
  if (message.length < 10 || message.length > 5000) {
    return { success: false, error: 'Bitte formulieren Sie Ihre Nachricht (10–5000 Zeichen).' };
  }

  // 3) Rate-Limit erst NACH erfolgreicher Validierung – Tippfehler eines
  //    Menschen sollen das Kontingent nicht verbrauchen.
  // Die E-Mail-Adresse als zweites Merkmal: Sonst trifft das Limit alle
  // hinter derselben Firmenadresse gemeinsam.
  const grenze = await pruefeRateLimit('kontakt', email);
  if (!grenze.erlaubt) {
    return { success: false, error: grenze.meldung };
  }

  // 4) Versand über die bestehende E-Mail-Infrastruktur.
  const result = await sendContactMessageEmail({
    name,
    email,
    subject: subject || undefined,
    message,
  });
  if (!result.success) {
    return {
      success: false,
      error:
        'Ihre Nachricht konnte gerade nicht gesendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt per E-Mail.',
    };
  }
  return { success: true };
}
