/**
 * Wann darf eine Bestellung im Adminbereich erscheinen?
 *
 * EINE Regel, zwei Anwendungsorte (Bestellliste und Detailseite). Läge sie
 * doppelt vor, könnte eine Bestellung in der Liste fehlen, über die direkte
 * URL aber trotzdem erreichbar sein.
 *
 * ── Die Regel ─────────────────────────────────────────────────────────
 *  1. Stornierte Bestellungen erscheinen NIEMALS – der Betreiber soll dort
 *     ausschließlich sehen, was tatsächlich zu bearbeiten ist.
 *  2. Bestellungen erscheinen erst NACH Ablauf der Stornofrist. Vorher kann
 *     der Kunde noch selbst stornieren; eine vorzeitige Bearbeitung wäre ein
 *     Risiko (Ware bereits beschafft, dann storniert).
 *  3. ANFRAGEN sind davon ausgenommen: Sie sind keine Bestellungen, haben
 *     keine Stornofrist und erscheinen sofort.
 *  4. Bestellungen mit AUSSTEHENDER Zahlung erscheinen nicht. Sonst würde
 *     nach Ablauf der Stornofrist Ware für etwas beschafft, das nie bezahlt
 *     wurde – siehe unten.
 *
 * Der Zustand wird IMMER aus `created_at`, `status` und `payment_status`
 * berechnet – es gibt kein gespeichertes Sichtbarkeits-Flag und keinen Job,
 * der zu einem Zeitpunkt etwas umschaltet.
 */
import { bearbeitungFreigegeben, STORNOFRIST_MS } from '@/config/orderProcess';

/**
 * Zahlungszustände, bei denen NICHT gearbeitet werden darf.
 *
 * `pending` = Bezahlvorgang läuft noch oder wurde abgebrochen.
 * `failed`  = nie zustande gekommen; die Kundschaft kann ihn wieder
 *             aufnehmen, bis er verfällt.
 *
 * Bewusst NICHT enthalten:
 *   `not_required` – Rechnungskauf. Hier steht nichts aus, die Bestellung
 *                    verhält sich exakt wie vor der Zahlungsintegration.
 *   `paid`         – bezahlt, also zu bearbeiten.
 */
const ZAHLUNG_STEHT_AUS: readonly string[] = ['pending', 'failed'];

export interface SichtbarkeitsEingabe {
  createdAt: string;
  status: string;
  orderType: string;
  /**
   * Zahlungszustand der Bestellung (`orders.payment_status`).
   *
   * Pflichtangabe und nicht optional: Ein Standardwert würde bedeuten, dass
   * ein vergessener Aufrufer eine unbezahlte Bestellung stillschweigend
   * sichtbar macht – genau der Fehler, den diese Regel verhindern soll. So
   * meldet ihn der Compiler.
   */
  paymentStatus: string;
}

/** Entscheidet für EINE Bestellung, ob sie im Adminbereich sichtbar ist. */
export function imAdminSichtbar(order: SichtbarkeitsEingabe, jetzt: Date = new Date()): boolean {
  if (order.status === 'cancelled') return false;
  if (order.orderType !== 'order') return true; // Anfragen sofort

  // ── Warum die Zahlung VOR der Frist geprüft wird ────────────────────
  // Beim Öffnen der Detailseite entsteht der Lieferantenauftrag. Ohne diese
  // Bedingung erschiene eine unbezahlte Kartenbestellung nach zwei Stunden
  // im Adminbereich, und beim ersten Öffnen würde Ware bestellt – für einen
  // Bezahlvorgang, den jemand abgebrochen hat.
  if (ZAHLUNG_STEHT_AUS.includes(order.paymentStatus)) return false;

  return bearbeitungFreigegeben(order.createdAt, jetzt);
}

/**
 * Zahlungszustände, die im Adminbereich bearbeitet werden dürfen – für die
 * Datenbankabfrage, damit dieselbe Regel dort nicht nachgebaut werden muss.
 */
export const BEARBEITBARE_ZAHLUNGSZUSTAENDE: readonly string[] = ['not_required', 'paid'];

/**
 * Zeitgrenze für die Datenbankabfrage: Bestellungen müssen älter sein.
 *
 * Die Liste filtert damit bereits in der Datenbank statt alle Datensätze zu
 * laden und danach zu verwerfen. Anfragen werden über eine ODER-Bedingung
 * ausgenommen (siehe lib/admin/data.ts).
 */
export function bearbeitungsGrenze(jetzt: Date = new Date()): string {
  // Alles, was VOR dieser Grenze erstellt wurde, hat die Frist hinter sich.
  return new Date(jetzt.getTime() - STORNOFRIST_MS).toISOString();
}
