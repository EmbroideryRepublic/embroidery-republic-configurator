/**
 * Admin-Status einer Bestellung: Sichtbarkeit und Bearbeitungsstatus sind
 * ZWEI GETRENNTE FRAGEN.
 *
 * ── Bis 2026-08-25: Sichtbarkeit und Bearbeitbarkeit waren dieselbe Frage ──
 * `imAdminSichtbar()` entschied früher zugleich, ob eine Bestellung in der
 * Liste/Detailseite überhaupt ERSCHEINT. Ergebnis: Eine frische, noch
 * stornierbare Bestellung war für den Betreiber bis zu zwei Stunden lang
 * UNSICHTBAR – er konnte sie nicht einmal ansehen. Das widerspricht dem
 * eigentlichen Arbeitsablauf (Entscheidung 2026-08-25): Jede Bestellung soll
 * sofort sichtbar sein, sobald sie angelegt wurde.
 *
 * ── Die neue Trennung ────────────────────────────────────────────────────
 *  • SICHTBARKEIT: Jede Bestellung ist immer sichtbar (lib/admin/data.ts
 *    filtert `orders` nicht mehr). Diese Datei liefert dafür keine
 *    Filterfunktion mehr.
 *  • STATUS (Anzeige): `berechneAdminStatus()` liefert eine Einordnung mit
 *    Farbe für Liste und Detailseite – erklärt, WAS mit der Bestellung
 *    passieren darf, verändert aber nie, OB sie erscheint.
 *  • PRODUKTIONSFREIGABE (Wirkung): `produktionsfreigabeErlaubt()` ist der
 *    EINZIGE Ort, der noch entscheidet, ob `enqueueSupplierOrdersForOrder()`
 *    laufen darf (lib/admin/data.ts, getOrderDetail). Das bleibt die
 *    scharfe Bedingung von vorher – nur nicht mehr an die Sichtbarkeit
 *    gekoppelt, sondern eigenständig geprüft, direkt an der einzigen Stelle,
 *    die eine echte Wirkung auslöst.
 *
 * Der teuerste Fehler bliebe unverändert derselbe wie vorher: Ein
 * Lieferantenauftrag für eine Bestellung, die der Kunde noch stornieren
 * kann oder die nie bezahlt wurde. `produktionsfreigabeErlaubt()` schützt
 * exakt davor – nur eben nicht mehr durch Verstecken der Seite, sondern
 * durch eine eigene, explizite Prüfung an der Wirkungsstelle.
 */
import { stornofristLaeuftNoch, stornofristEndet } from '@/config/orderProcess';

/**
 * `refund_status`-Werte, bei denen eine STORNIERTE Bestellung als „noch zu
 * klären" statt als abgeschlossen gilt. Bewusst NICHT enthalten: `refunded`
 * (abgeschlossen) und `not_applicable` (Rechnungskauf oder nie bezahlt –
 * hier war nie etwas zu erstatten).
 */
const REFUND_OFFEN: readonly string[] = ['required', 'processing', 'failed'];

export interface SichtbarkeitsEingabe {
  createdAt: string;
  status: string;
  orderType: string;
  /** Zahlungszustand (`orders.payment_status`). Pflichtangabe – ein
   *  Standardwert würde eine unbezahlte Bestellung stillschweigend als
   *  bearbeitbar durchgehen lassen. */
  paymentStatus: string;
  /** Rückerstattungszustand (`orders.refund_status`). Pflichtangabe aus
   *  demselben Grund: ein Standardwert würde eine offene Rückerstattung
   *  stillschweigend als „erledigt" anzeigen. */
  refundStatus: string;
}

export type AdminStatusCode =
  | 'anfrage'
  | 'stornierbar'
  | 'produktionsbereit'
  | 'storniert'
  | 'storniert_erstattung_offen'
  | 'zahlung_ausstehend'
  | 'zahlung_fehlgeschlagen';

export interface AdminStatus {
  code: AdminStatusCode;
  label: string;
  /** Reine Anzeigefarbe – die Bedeutung steht im `code`, nicht in der Farbe. */
  farbe: 'rot' | 'gruen' | 'grau' | 'amber' | 'blau';
  /** Nur bei `code === 'stornierbar'` gesetzt: Zeitpunkt, ab dem die
   *  Stornofrist abläuft und die Bestellung produktionsbereit wird. */
  stornofristEndeIso?: string;
}

/**
 * Einordnung EINER Bestellung für die Admin-Anzeige – die einzige
 * Auflösungsstelle, damit Liste und Detailseite nie auseinanderlaufen.
 *
 * Reihenfolge der Prüfungen ist die fachliche Priorität: Eine Anfrage ist
 * nie „storniert" im Bestellsinne; eine stornierte Bestellung bleibt
 * storniert, unabhängig vom Zahlungszustand; erst danach entscheiden
 * Zahlung und Stornofrist.
 */
export function berechneAdminStatus(order: SichtbarkeitsEingabe, jetzt: Date = new Date()): AdminStatus {
  if (order.orderType !== 'order') {
    return { code: 'anfrage', label: 'Anfrage', farbe: 'blau' };
  }
  if (order.status === 'cancelled') {
    if (REFUND_OFFEN.includes(order.refundStatus)) {
      return { code: 'storniert_erstattung_offen', label: 'Storniert – Rückerstattung offen', farbe: 'amber' };
    }
    return { code: 'storniert', label: 'Storniert', farbe: 'grau' };
  }
  if (order.paymentStatus === 'pending') {
    return { code: 'zahlung_ausstehend', label: 'Zahlung ausstehend', farbe: 'amber' };
  }
  if (order.paymentStatus === 'failed') {
    return { code: 'zahlung_fehlgeschlagen', label: 'Zahlung fehlgeschlagen', farbe: 'amber' };
  }
  if (stornofristLaeuftNoch(order.createdAt, jetzt)) {
    return {
      code: 'stornierbar',
      label: 'Stornierung möglich',
      farbe: 'rot',
      stornofristEndeIso: stornofristEndet(order.createdAt).toISOString(),
    };
  }
  return { code: 'produktionsbereit', label: 'Produktionsbereit', farbe: 'gruen' };
}

/**
 * Darf JETZT ein Lieferantenauftrag für diese Bestellung entstehen?
 *
 * Die EINZIGE noch verbleibende scharfe Bedingung aus der früheren
 * `imAdminSichtbar()` – aufgerufen ausschließlich von
 * `enqueueSupplierOrdersForOrder()` (lib/admin/data.ts), NICHT mehr davon,
 * ob die Seite überhaupt angezeigt wird.
 */
export function produktionsfreigabeErlaubt(order: SichtbarkeitsEingabe, jetzt: Date = new Date()): boolean {
  return berechneAdminStatus(order, jetzt).code === 'produktionsbereit';
}
