/**
 * Geplanter E-Mail-Versand über Resend (`scheduledAt`) und dessen Widerruf.
 *
 * ── Rolle im System ───────────────────────────────────────────────────
 * Resend ist hier AUSSCHLIESSLICH Versandmechanismus, niemals Teil der
 * Geschäftslogik. Führende Quelle für jeden Bestellzustand bleibt unsere
 * Datenbank.
 *
 * Konkret heißt das: Schlägt das Planen oder das Widerrufen fehl, wird das
 * protokolliert und sonst nichts. Weder Bestellstatus noch Sichtbarkeit im
 * Adminbereich noch der Lieferantenprozess hängen davon ab – die ergeben
 * sich allein aus `created_at` und `status`.
 *
 * Schlimmster Fall eines fehlgeschlagenen Widerrufs: Der Betreiber bekommt
 * eine interne Mail zu einer bereits stornierten Bestellung. Die Bestellung
 * taucht im Adminbereich trotzdem nicht auf (dort wird `cancelled`
 * gefiltert), der Schaden bleibt also eine überflüssige E-Mail.
 */
import { getResendClient } from './resendClient';
import { istTestmodus, meldeAbgefangen, TESTMODUS_PRAEFIX } from '@/config/testmodus';

/**
 * Zieht eine geplante E-Mail zurück.
 *
 * Wirft NIE – der Aufrufer soll sich auf nichts verlassen müssen. Der
 * Rückgabewert sagt lediglich, ob der Widerruf tatsächlich griff; er dient
 * der Nachvollziehbarkeit (Historie), nicht der Steuerung. Kein Aufrufer
 * darf seinen fachlichen Ablauf davon abhängig machen.
 */
export async function widerrufeGeplanteEmail(emailId: string): Promise<boolean> {
  // Im Testmodus wurde nie etwas geplant – der Widerruf meldet Erfolg, damit
  // der Stornopfad denselben Zweig durchläuft wie produktiv.
  //
  // Die Kennung wird zusätzlich geprüft: Eine ECHTE Resend-ID darf auch im
  // Testmodus niemals stillschweigend übergangen werden. Stünde hier eine
  // echte geplante Mail, wäre das Verschlucken des Widerrufs ein Fehler mit
  // Außenwirkung – dann lieber der normale Weg.
  if (istTestmodus() && emailId.startsWith(TESTMODUS_PRAEFIX)) {
    meldeAbgefangen('E-Mail-Widerruf', emailId);
    return true;
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] Widerruf ${emailId} übersprungen: kein Resend-Client konfiguriert.`);
    return false;
  }
  try {
    const { error } = await resend.emails.cancel(emailId);
    if (error) {
      // Häufigste Gründe: Die Mail wurde bereits versendet (Frist vorbei),
      // oder der API-Schlüssel hat nur Senderechte ("restricted to only
      // send emails") – dann fehlt die Berechtigung zum Widerruf.
      console.warn(`[email] Geplante Mail ${emailId} nicht widerrufen: ${error.message}`);
      return false;
    }
    console.info(`[email] Geplante interne Benachrichtigung ${emailId} zurückgezogen.`);
    return true;
  } catch (err) {
    console.warn(`[email] Widerruf ${emailId} fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
