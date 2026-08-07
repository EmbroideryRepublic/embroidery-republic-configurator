/**
 * Resend-Client + Absender-/Empfänger-Adressen – gemeinsam genutzt von
 * jeder E-Mail-Art (Bestellbestätigung, interne Benachrichtigung,
 * Kontaktformular und künftige, siehe sendEmail.ts).
 *
 * ── Warum der Absender NICHT frei wählbar ist ──────────────────────────
 * Resend versendet nur von Domains, die im Resend-Konto verifiziert sind.
 * Eine Freemail-Adresse (GMX, Gmail, …) lässt sich dort NICHT verifizieren –
 * die Domain gehört dem Freemail-Anbieter. Bis die eigene Domain verifiziert
 * ist, bleibt daher nur Resends Test-Absender `onboarding@resend.dev`;
 * dieser liefert ausschließlich an die E-Mail-Adresse, mit der das
 * Resend-Konto registriert wurde.
 *
 * Umstellung auf die eigene Domain später: in .env.local lediglich
 *   RESEND_FROM_EMAIL=info@ergermany.de
 *   EMAIL_TEST_MODE=false
 * setzen (nachdem die Domain bei Resend verifiziert ist). Am Code ändert
 * sich nichts.
 */
import { Resend } from 'resend';
import { COMPANY } from '@/config/company';

/** Liest eine Umgebungsvariable und behandelt Leerstrings wie „nicht gesetzt". */
function envOr(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY fehlt – E-Mail-Versand übersprungen.');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Absenderadresse mit Anzeigenamen im Format „Name <adresse>". Ohne
 * Anzeigenamen zeigen die meisten Mail-Clients im Posteingang nur die rohe
 * Adresse statt eines erkennbaren Markennamens.
 *
 * Die Adresse selbst ist bewusst die künftige eigene Adresse – solange deren
 * Domain nicht verifiziert ist, MUSS in .env.local
 * `RESEND_FROM_EMAIL=onboarding@resend.dev` gesetzt sein, sonst lehnt Resend
 * den Versand ab.
 */
export function getFromAddress(): string {
  const adresse = envOr('RESEND_FROM_EMAIL', COMPANY.email);
  return `${COMPANY.tradeName} <${adresse}>`;
}

/** Interne Empfängeradresse für Bestell-/Anfrage-Benachrichtigungen. */
export function getInternalNotificationAddress(): string {
  return envOr('INTERNAL_NOTIFICATION_EMAIL', COMPANY.email);
}

/**
 * Antwortadresse für E-Mails AN Kundinnen und Kunden. Damit erreichen
 * Antworten das Postfach, das aktuell tatsächlich gelesen wird – auch wenn
 * als Absender (technisch bedingt) noch `onboarding@resend.dev` steht.
 */
export function getReplyToAddress(): string {
  return envOr('EMAIL_REPLY_TO', getInternalNotificationAddress());
}
