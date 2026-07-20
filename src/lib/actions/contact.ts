'use server';

/**
 * Server-Action für das Kontaktformular (/kontakt).
 *
 * Bewusst schlank und OHNE neue Infrastruktur: nutzt ausschließlich den
 * bereits vorhandenen E-Mail-Versand (Resend über sendEmail.ts). Der Client-
 * Input wird serverseitig validiert – die Client-Validierung ist reiner
 * Komfort. Missbrauchsschutz mit einfachen Mitteln: Honeypot-Feld +
 * best-effort In-Memory-Rate-Limit pro IP.
 */
import { headers } from 'next/headers';
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

// ---- Einfaches In-Memory-Rate-Limit (best effort) --------------------------
// Bewusst simpel und ohne zusätzliche Infrastruktur: greift pro Server-
// Instanz. Für harte, instanzübergreifende Limits bräuchte es einen geteilten
// Store (z.B. Upstash) – das wird hier bewusst NICHT eingeführt. Reicht als
// Grundschutz gegen versehentliche Doppel-Sends und einfache Spam-Wellen.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 Minuten
const RATE_LIMIT_MAX = 5; // max. 5 Nachrichten pro Fenster & IP
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, hits);
    return true;
  }
  hits.push(now);
  recentSubmissions.set(key, hits);

  // Gelegentliches Aufräumen, damit die Map nicht unbegrenzt wächst.
  if (recentSubmissions.size > 5000) {
    for (const [k, ts] of recentSubmissions) {
      const fresh = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (fresh.length === 0) recentSubmissions.delete(k);
      else recentSubmissions.set(k, fresh);
    }
  }
  return false;
}

function clientKey(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return ip;
}

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
  if (isRateLimited(clientKey())) {
    return {
      success: false,
      error: 'Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in ein paar Minuten erneut.',
    };
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
