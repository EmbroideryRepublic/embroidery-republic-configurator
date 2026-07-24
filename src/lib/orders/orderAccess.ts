/**
 * BERECHTIGUNG für die Bestellansicht – bewusst getrennt von Darstellung
 * und Datenbeschaffung.
 *
 * Die Bestellansicht selbst kennt nur eine Frage: „Darf dieser Aufrufer
 * Bestellung X sehen?" WIE die Antwort zustande kommt, entscheidet allein
 * dieses Modul.
 *
 * Heute gibt es genau einen Weg: der signierte Link aus der
 * Bestellbestätigung (es existiert kein Kundenkonto). Kommt später eine
 * Anmeldung dazu, wird hier ein zweiter Fall ergänzt – Seite, Datenleser
 * und Ansichtsmodell bleiben unverändert. Genau deshalb liegt die Prüfung
 * hier und nicht in der Seite.
 *
 * Erweiterung um ein Kundenkonto sähe so aus:
 *   1. `Bestellzugriff` um `{ art: 'konto'; kundenId: string }` erweitern,
 *   2. in `pruefeBestellzugriff` prüfen, ob die Bestellung diesem Kunden
 *      gehört (E-Mail bzw. künftige customer_id),
 *   3. fertig – kein weiterer Code ändert sich.
 */
import { pruefeBestellToken } from './orderAccessToken';

/** Wie der Aufrufer sich ausweist. Heute nur der signierte Link. */
export type Bestellzugriff = { art: 'token'; token: string };

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
 */
export function pruefeBestellzugriff(zugriff: Bestellzugriff): Zugriffsergebnis {
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
