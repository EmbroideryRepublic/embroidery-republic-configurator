'use server';

/**
 * Server-Action der Geschäftsanfrage (/geschaeftskunden).
 *
 * Bewusst ohne neue Infrastruktur: Die Angaben werden serverseitig geprüft (lib/seo/geschaeftsanfrage.ts – dieselbe Logik wie im Browser, hier maßgeblich),
 * zu Betreff und Text zusammengesetzt und über den bestehenden Kontaktversand (`submitContactMessage`: Honeypot, Rate-Limit, Anhangsprüfung, E-Mail) an uns
 * gesendet. Die Kennung aus dem Brief steht im Betreff und im Text.
 */
import { submitContactMessage } from '@/lib/actions/contact';
import { LOGO_GRENZEN } from '@/config/seo/geschaeftsanfrage';
import { pruefeGeschaeftsanfrage, type FeldFehler } from '@/lib/seo/geschaeftsanfrage';
import { base64Bytelaenge } from '@/lib/upload/pruefeUpload';

export interface GeschaeftsanfrageErgebnis {
  success: boolean;
  error?: string;
  felder?: FeldFehler;
}

export async function submitGeschaeftsanfrage(eingabe: unknown): Promise<GeschaeftsanfrageErgebnis> {
  const input = (eingabe !== null && typeof eingabe === 'object' ? eingabe : {}) as Record<string, unknown>;

  // Honeypot: befülltes Feld => stiller "Erfolg" ohne Versand (kein Hinweis für Bots).
  if (typeof input.website === 'string' && input.website.trim() !== '') return { success: true };

  const geprueft = pruefeGeschaeftsanfrage(input);
  if (!geprueft.ok) return { success: false, error: 'Bitte prüfen Sie Ihre Angaben.', felder: geprueft.felder };

  // Anhänge: höchstens 2 Dateien, zusammen höchstens 3 MB (Plattformgrenze je Anfrage ca. 4,5 MB). Format und Inhalt prüft submitContactMessage.
  let attachments: { dateiname: string; dataUrl: string }[] | undefined;
  if (Array.isArray(input.attachments) && input.attachments.length > 0) {
    const roh = input.attachments as unknown[];
    const liste = roh.map((a) => {
      const o = (a !== null && typeof a === 'object' ? a : {}) as Record<string, unknown>;
      return { dateiname: typeof o.dateiname === 'string' ? o.dateiname : '', dataUrl: typeof o.dataUrl === 'string' ? o.dataUrl : '' };
    });
    const bytes = liste.reduce((s, a) => s + base64Bytelaenge(a.dataUrl.slice(a.dataUrl.indexOf(',') + 1)), 0);
    if (liste.length > LOGO_GRENZEN.maxDateien || bytes > LOGO_GRENZEN.maxBytesGesamt) {
      return { success: false, error: 'Die angehängten Dateien sind zu groß oder zu viele (höchstens 2 Dateien mit zusammen 3 MB).' };
    }
    attachments = liste;
  }

  const ergebnis = await submitContactMessage({
    name: geprueft.name,
    email: geprueft.email,
    subject: geprueft.betreff,
    message: geprueft.nachricht,
    attachments,
  });
  return ergebnis.success ? { success: true } : { success: false, error: ergebnis.error };
}
