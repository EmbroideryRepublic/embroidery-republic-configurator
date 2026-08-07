/**
 * BERECHTIGUNG für die Bestellansicht – bewusst getrennt von Darstellung
 * und Datenbeschaffung.
 *
 * Die Bestellansicht selbst kennt nur eine Frage: „Darf dieser Aufrufer
 * Bestellung X sehen?" WIE die Antwort zustande kommt, entscheidet allein
 * dieses Modul.
 *
 * Zwei Wege: der signierte Link aus der Bestellbestätigung (Gastkauf, wie
 * von Anfang an) UND – additiv seit dem Kundenkonto
 * (supabase/migrations/0023_kundenkonto.sql) – die Anmeldung, sofern die
 * Bestellung diesem Konto gehört (`orders.customer_id`). Seite, Datenleser
 * (ladeBestellAnsicht) und Ansichtsmodell bleiben für BEIDE Wege exakt
 * gleich – das war der Grund, die Prüfung hier zu bündeln statt in der
 * Seite, lange bevor es ein Konto gab.
 *
 * Dies ist genau der Erweiterungsweg, der hier zuvor als Kommentar
 * vorgezeichnet war: „Bestellzugriff um { art: 'konto'; kundenId } erweitern,
 * prüfen ob die Bestellung diesem Kunden gehört, fertig."
 */
import { pruefeBestellToken } from './orderAccessToken';
import { gehoertBestellungKunden } from '@/lib/account/data';

/** Wie der Aufrufer sich ausweist: signierter Link ODER angemeldetes Konto. */
export type Bestellzugriff = { art: 'token'; token: string } | { art: 'konto'; kundenId: string; orderId: string };

export type Zugriffsergebnis =
  | { erlaubt: true; orderId: string; art: Bestellzugriff['art'] }
  | { erlaubt: false; grund: 'ungueltig' | 'abgelaufen' | 'nicht-konfiguriert' };

/**
 * Prüft die Zugriffsberechtigung. Gibt NUR die Bestell-ID zurück – geladen
 * wird die Bestellung erst danach vom Datenleser.
 *
 * Wichtig: Ein erlaubter Zugriff bedeutet ausschließlich „darf ansehen".
 * Ob eine Stornierung zulässig ist, entscheidet unabhängig davon die
 * Fristprüfung gegen `created_at` (siehe config/orderProcess).
 *
 * Async, weil der 'konto'-Zweig (anders als die reine Signaturprüfung des
 * Tokens) einen Datenbank-Nachschlag braucht: gehört diese Bestellung
 * wirklich diesem Kunden?
 */
export async function pruefeBestellzugriff(zugriff: Bestellzugriff): Promise<Zugriffsergebnis> {
  if (zugriff.art === 'konto') {
    const gehoert = await gehoertBestellungKunden(zugriff.orderId, zugriff.kundenId);
    // Dieselbe Zusammenfassung wie beim Token: nicht verraten, ob die
    // Bestellung existiert, aber einem anderen Konto gehört, oder ob sie
    // gar nicht existiert – für den Aufrufer ist beides "ungültig".
    return gehoert ? { erlaubt: true, orderId: zugriff.orderId, art: 'konto' } : { erlaubt: false, grund: 'ungueltig' };
  }

  const r = pruefeBestellToken(zugriff.token);
  if (r.gueltig) return { erlaubt: true, orderId: r.orderId, art: 'token' };

  // Fehlerursachen bewusst zusammengefasst: Dem Aufrufer wird nicht
  // verraten, ob eine Signatur falsch oder eine Bestell-ID unbekannt ist.
  // Der Ablauf ist davon ausgenommen – dafür gibt es eine eigene,
  // freundliche Anzeige.
  if (r.grund === 'kein-secret') return { erlaubt: false, grund: 'nicht-konfiguriert' };
  if (r.grund === 'abgelaufen') return { erlaubt: false, grund: 'abgelaufen' };
  return { erlaubt: false, grund: 'ungueltig' };
}
