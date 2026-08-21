/**
 * Ansichtsmodell der Bestellung für den KUNDEN.
 *
 * Dieses Modul kennt die Zugriffsart bewusst NICHT. Es bekommt eine
 * Bestell-ID und liefert die Darstellung – ob der Aufrufer über den
 * signierten Link aus der E-Mail kam oder (künftig) über eine Anmeldung im
 * Kundenkonto, wurde vorher in `orderAccess` entschieden.
 *
 * Dadurch gibt es später genau EINE Bestellansicht statt zweier fast
 * gleicher Implementierungen.
 *
 * Bewusst NICHT enthalten: interne Daten wie Lieferantenzuordnung,
 * Einkaufspreise oder Produktionsblatt. Diese Ansicht ist öffentlich
 * erreichbar (wer den Link hat) und zeigt nur, was der Kunde ohnehin in
 * seiner Bestätigungsmail stehen hat.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import type { OrderStatus, OrderPaymentMethod, OrderPaymentStatus, RefundStatus } from '@/lib/actions/orderTypes';
import { stornofristEndet, stornofristLaeuftNoch, verbleibendeStornozeitMs } from '@/config/orderProcess';

/** Die drei Zustände, die die Seite unterscheidet. */
export type BestellAnsichtZustand =
  | 'stornierbar' // Frist läuft – Storno-Schaltfläche wird angezeigt
  | 'frist-abgelaufen' // Details sichtbar, Selbststornierung nicht mehr möglich
  | 'storniert'; // bereits storniert

export interface BestellAnsichtPosition {
  produktName: string;
  farbe: string;
  veredelung: 'DTF-Transferdruck' | 'Stickerei';
  groessen: { groesse: string; menge: number }[];
  menge: number;
}

export interface BestellAnsicht {
  orderId: string;
  bestellnummer: string;
  bestelltAm: string;
  zustand: BestellAnsichtZustand;
  /** Ende der Stornofrist – für die Anzeige „noch bis …". */
  stornofristBis: string;
  /** Reine Anzeige-Information. Die Entscheidung fällt IMMER serverseitig. */
  verbleibendeMs: number;
  storniertAm: string | null;
  /** Fachlicher Bestellstatus – unabhängig vom Storno-Zustand. */
  status: OrderStatus;
  /** Zahlungsart – steuert, ob unten der Rechnungs- oder "bereits bezahlt"-Text steht. */
  zahlungsart: OrderPaymentMethod | null;
  zahlungsstatus: OrderPaymentStatus;
  /** Rückerstattungszustand – nur relevant, wenn zustand==='storniert' UND
   *  zum Stornozeitpunkt bereits bezahlt war. 'not_applicable' sonst immer
   *  (siehe supabase/migrations/0029_rueckerstattung.sql). */
  erstattungsstatus: RefundStatus;
  trackingNummer: string | null;
  versendetAm: string | null;
  positionen: BestellAnsichtPosition[];
  gesamtpreis: number;
  /** Enthaltene Umsatzsteuer – nur vorhanden, wenn zum Bestellzeitpunkt
   *  bereits gespeichert (Migration 0014, ab 2026-07-22). Ältere Bestellungen
   *  liefern hier `null`; die Seite blendet die Zeile dann aus, statt eine
   *  falsche Schätzung zu zeigen. */
  steuerbetrag: number | null;
  steuersatz: number | null;
  lieferadresse: { strasse: string; plz: string; ort: string; land: string } | null;
  kundenName: string;
}

/**
 * Lädt die Bestellung für die Kundenansicht.
 *
 * Der Zustand wird IMMER aus `created_at` und `status` berechnet – es gibt
 * kein gespeichertes Sichtbarkeits-Flag, das abweichen könnte.
 */
export async function ladeBestellAnsicht(orderId: string, jetzt: Date = new Date()): Promise<BestellAnsicht | null> {
  const db = createAdminClient();

  const { data: order, error } = await db
    .from('orders')
    .select(
      'id, created_at, status, order_type, total_price, tax_amount, tax_rate, customer_name, cancelled_at, shipping_street, shipping_zip, shipping_city, shipping_country, tracking_number, shipped_at, payment_method, payment_status, refund_status'
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await db
    .from('order_items')
    .select('product_name, color_name, print_method, size_quantities, quantity')
    .eq('order_id', orderId);

  const storniert = order.status === 'cancelled';
  const zustand: BestellAnsichtZustand = storniert
    ? 'storniert'
    : stornofristLaeuftNoch(order.created_at as string, jetzt)
      ? 'stornierbar'
      : 'frist-abgelaufen';

  return {
    orderId: order.id as string,
    // Die Bestellnummer ist KEINE Spalte, sondern wird aus der ID abgeleitet
    // (buildOrderNumber) – identisch zu Adminbereich und E-Mails.
    bestellnummer: buildOrderNumber(order.id as string),
    bestelltAm: order.created_at as string,
    zustand,
    stornofristBis: stornofristEndet(order.created_at as string).toISOString(),
    verbleibendeMs: verbleibendeStornozeitMs(order.created_at as string, jetzt),
    storniertAm: (order.cancelled_at as string | null) ?? null,
    status: order.status as OrderStatus,
    zahlungsart: (order.payment_method as OrderPaymentMethod | null) ?? null,
    zahlungsstatus: order.payment_status as OrderPaymentStatus,
    erstattungsstatus: ((order.refund_status as RefundStatus | null) ?? 'not_applicable') as RefundStatus,
    trackingNummer: (order.tracking_number as string | null) ?? null,
    versendetAm: (order.shipped_at as string | null) ?? null,
    kundenName: (order.customer_name as string) ?? '',
    gesamtpreis: Number(order.total_price ?? 0),
    steuerbetrag: order.tax_amount !== null && order.tax_amount !== undefined ? Number(order.tax_amount) : null,
    steuersatz: order.tax_rate !== null && order.tax_rate !== undefined ? Number(order.tax_rate) : null,
    lieferadresse: order.shipping_street
      ? {
          strasse: order.shipping_street as string,
          plz: (order.shipping_zip as string) ?? '',
          ort: (order.shipping_city as string) ?? '',
          land: (order.shipping_country as string) ?? '',
        }
      : null,
    positionen: (items ?? []).map((i) => ({
      produktName: i.product_name as string,
      farbe: i.color_name as string,
      veredelung: i.print_method === 'embroidery' ? 'Stickerei' : 'DTF-Transferdruck',
      groessen: Object.entries((i.size_quantities ?? {}) as Record<string, number>)
        .filter(([, m]) => m > 0)
        .map(([groesse, menge]) => ({ groesse, menge })),
      menge: Number(i.quantity ?? 0),
    })),
  };
}
