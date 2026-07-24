/**
 * Zustandsmaschine einer Kundenbestellung.
 *
 * Bisher gab es die Status nur als Typ-Union — gesetzt wurde ausschließlich
 * `cancelled`. Jede Bestellung blieb dadurch dauerhaft auf `new`, und der
 * Betreiber konnte weder „in Produktion" noch „versendet" festhalten.
 *
 * Diese Datei definiert die erlaubten Übergänge an EINER Stelle, damit sie
 * prüfbar sind. Sie ist bewusst frei von Datenbank- und UI-Bezügen: Wer
 * wissen will, ob ein Übergang zulässig ist, braucht keinen Datenbankzugriff.
 *
 * ── Der Ablauf ────────────────────────────────────────────────────────
 *
 *   new ──────► in_production ──────► shipped ──────► completed
 *    │                │                   │
 *    └────────────────┴───────────────────┴──────► cancelled
 *
 * `cancelled` ist ein Endzustand: Aus einer stornierten Bestellung führt
 * kein Weg zurück. Wird sie doch noch benötigt, ist das fachlich eine neue
 * Bestellung — und keine Rückabwicklung, die stillschweigend Ware auslöst.
 *
 * `completed` ist ebenfalls ein Endzustand.
 */
import type { OrderStatus } from '@/lib/actions/orderTypes';

/** Erlaubte Folgezustände je Status. Leere Liste = Endzustand. */
export const ERLAUBTE_UEBERGAENGE: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['in_production', 'cancelled'],
  in_production: ['shipped', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Reihenfolge für Anzeige und Fortschrittsdarstellung. */
export const STATUS_REIHENFOLGE: readonly OrderStatus[] = [
  'new',
  'in_production',
  'shipped',
  'completed',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Eingegangen',
  in_production: 'In Produktion',
  shipped: 'Versendet',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

/** Was der Kunde in der Bestellansicht dazu liest. */
export const STATUS_KUNDENTEXT: Record<OrderStatus, string> = {
  new: 'Ihre Bestellung ist bei uns eingegangen und wird vorbereitet.',
  in_production: 'Ihre Bestellung ist in Produktion. Wir veredeln Ihre Ware.',
  shipped: 'Ihre Bestellung ist unterwegs.',
  completed: 'Ihre Bestellung ist abgeschlossen. Vielen Dank!',
  cancelled: 'Diese Bestellung wurde storniert.',
};

export function istUebergangErlaubt(von: OrderStatus, nach: OrderStatus): boolean {
  return ERLAUBTE_UEBERGAENGE[von].includes(nach);
}

/** Endzustand = kein Übergang mehr möglich. */
export function istEndzustand(status: OrderStatus): boolean {
  return ERLAUBTE_UEBERGAENGE[status].length === 0;
}

/**
 * Position im Ablauf, für die Fortschrittsanzeige.
 * `cancelled` liegt außerhalb der Kette und liefert -1.
 */
export function fortschrittIndex(status: OrderStatus): number {
  return STATUS_REIHENFOLGE.indexOf(status);
}
