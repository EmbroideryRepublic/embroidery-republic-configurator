/**
 * Wann darf eine Bestellung im Adminbereich erscheinen?
 *
 * EINE Regel, zwei Anwendungsorte (Bestellliste und Detailseite). Läge sie
 * doppelt vor, könnte eine Bestellung in der Liste fehlen, über die direkte
 * URL aber trotzdem erreichbar sein.
 *
 * ── Die Regel ─────────────────────────────────────────────────────────
 *  1. Stornierte Bestellungen erscheinen NICHT MEHR, SOBALD eine etwaige
 *     Rückerstattung abgeschlossen ist (oder nie fällig war) – der Betreiber
 *     soll dort ausschließlich sehen, was tatsächlich zu bearbeiten ist.
 *     AUSNAHME siehe Regel 5.
 *  2. Bestellungen erscheinen erst NACH Ablauf der Stornofrist. Vorher kann
 *     der Kunde noch selbst stornieren; eine vorzeitige Bearbeitung wäre ein
 *     Risiko (Ware bereits beschafft, dann storniert).
 *  3. ANFRAGEN sind davon ausgenommen: Sie sind keine Bestellungen, haben
 *     keine Stornofrist und erscheinen sofort.
 *  4. Bestellungen mit AUSSTEHENDER Zahlung erscheinen nicht. Sonst würde
 *     nach Ablauf der Stornofrist Ware für etwas beschafft, das nie bezahlt
 *     wurde – siehe unten.
 *  5. AUSNAHME von Regel 1: Eine stornierte, bereits BEZAHLTE Bestellung
 *     bleibt sichtbar, solange ihre Rückerstattung noch aussteht
 *     (`refund_status` in 'required'/'processing'/'failed') – sonst
 *     verschwindet eine offene Rückerstattung spurlos aus dem Adminbereich,
 *     siehe supabase/migrations/0029_rueckerstattung.sql.
 *
 * Der Zustand wird IMMER aus `created_at`, `status`, `payment_status` und
 * `refund_status` berechnet – es gibt kein gespeichertes Sichtbarkeits-Flag
 * und keinen Job, der zu einem Zeitpunkt etwas umschaltet.
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

/**
 * `refund_status`-Werte, bei denen eine STORNIERTE Bestellung trotzdem
 * sichtbar bleibt (Regel 5 oben). Bewusst NICHT enthalten: `refunded`
 * (abgeschlossen – Regel 1 greift wieder) und `not_applicable`
 * (Rechnungskauf oder nie bezahlt – hier war nie etwas zu erstatten).
 */
const REFUND_OFFEN: readonly string[] = ['required', 'processing', 'failed'];

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
  /**
   * Rückerstattungszustand (`orders.refund_status`). Ebenfalls Pflichtangabe
   * aus demselben Grund: Ein Standardwert (z.B. „nicht anwendbar") würde eine
   * tatsächlich offene Rückerstattung stillschweigend unsichtbar machen –
   * genau die Regelung, die Regel 5 einführt.
   */
  refundStatus: string;
}

/** Entscheidet für EINE Bestellung, ob sie im Adminbereich sichtbar ist. */
export function imAdminSichtbar(order: SichtbarkeitsEingabe, jetzt: Date = new Date()): boolean {
  if (order.status === 'cancelled') {
    // Regel 5: Ausnahme für eine noch offene Rückerstattung.
    return REFUND_OFFEN.includes(order.refundStatus);
  }
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

/**
 * Dieselbe Regel wie `imAdminSichtbar()` oben, als EIN PostgREST-Filterausdruck
 * für `.or()` in `listOrders()` (lib/admin/data.ts) – siehe Kopfkommentar
 * dieser Datei („EINE Regel, ZWEI Anwendungsorte"). Muss `imAdminSichtbar()`
 * fachlich exakt entsprechen; ändert sich eine der beiden Stellen, muss die
 * andere mitgezogen werden.
 *
 * Zwei nach `and(...)` gruppierte Zweige, oberste Ebene ODER-verknüpft:
 *  - der bisherige Normalfall (nicht storniert, Zahlung bearbeitbar,
 *    Anfrage ODER Stornofrist abgelaufen),
 *  - die neue Ausnahme (storniert, aber Rückerstattung noch offen).
 *
 * Ersetzt die vormals drei getrennten Filter-Aufrufe (`.neq('status', …)`,
 * `.or(order_type…)`, `.in('payment_status', …)`) vollständig: Sobald ein
 * zweiter Zweig ODER-verknüpft dazukommt, dürfen die übrigen Bedingungen
 * nicht mehr als separate, automatisch UND-verknüpfte Filter danebenstehen –
 * sie würden sonst auch den neuen Zweig einschränken.
 */
export function listSichtbarkeitsFilter(jetzt: Date = new Date()): string {
  const grenze = bearbeitungsGrenze(jetzt);
  const normalfall = `and(status.neq.cancelled,payment_status.in.(${BEARBEITBARE_ZAHLUNGSZUSTAENDE.join(',')}),or(order_type.neq.order,created_at.lte.${grenze}))`;
  const erstattungOffen = `and(status.eq.cancelled,refund_status.in.(${REFUND_OFFEN.join(',')}))`;
  return `${normalfall},${erstattungOffen}`;
}
