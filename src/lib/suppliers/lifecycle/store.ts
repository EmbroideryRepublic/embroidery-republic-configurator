/**
 * Persistenz des Lieferanten-Bestell-Lebenszyklus (server-only, Supabase
 * Admin-Client). Setzt die reine Statusmaschine (status.ts) in die Datenbank
 * um und schreibt JEDEN Statuswechsel/jedes Ereignis ins Audit-Log
 * (supplier_order_events, Migration 0006).
 *
 * Kernbausteine für den Echtbetrieb:
 *  - acquireLock/releaseLock: verhindert PARALLELE Verarbeitung derselben
 *    (Bestellung × Lieferant) über eine atomare bedingte UPDATE-Anweisung
 *    (inkl. Übernahme verwaister Locks nach LOCK_TTL_MS).
 *  - transition: wendet einen Statuswechsel NUR an, wenn der Ausgangsstatus
 *    noch stimmt (optimistische Sperre) UND der Übergang erlaubt ist
 *    (canTransition) – und protokolliert ihn.
 */
import type { createAdminClient } from '@/lib/supabase/server';
import { canTransition, PROCESSABLE_STATUSES, type SupplierOrderStatus } from './status';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Verwaiste Locks (Prozess abgestürzt) werden nach dieser Dauer übernehmbar. */
export const LOCK_TTL_MS = 10 * 60_000;

export type SupplierOrderEventType = 'transition' | 'attempt' | 'lock' | 'unlock' | 'error' | 'note';

export interface RecordEventInput {
  orderId: string;
  supplierId: string;
  eventType: SupplierOrderEventType;
  fromStatus?: SupplierOrderStatus | null;
  toStatus?: SupplierOrderStatus | null;
  reason?: string;
  detail?: unknown;
}

/** Schreibt einen Audit-Eintrag. Fehler werden geloggt, aber nie geworfen –
 *  ein Protokoll-Ausfall darf den Bestellablauf nicht stoppen. */
export async function recordEvent(client: AdminClient, input: RecordEventInput): Promise<void> {
  const { error } = await client.from('supplier_order_events').insert({
    order_id: input.orderId,
    supplier_id: input.supplierId,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    reason: input.reason ?? null,
    detail: input.detail === undefined ? null : input.detail,
  });
  if (error) console.error('[lifecycle] recordEvent fehlgeschlagen:', error.message);
}

export interface AcquireLockResult {
  acquired: boolean;
  /** Nummer DIESES Versuchs (1-basiert) – nur bei acquired. */
  attemptCount?: number;
}

/**
 * Versucht, die Verarbeitung exklusiv zu übernehmen: setzt atomar
 * status='processing' + Lock, sofern der Datensatz verarbeitbar (draft/
 * queued), fällig (next_attempt_at) und nicht (frisch) gesperrt ist.
 * Liefert acquired=false, wenn bereits ein anderer Prozess arbeitet.
 */
export async function acquireLock(
  client: AdminClient,
  orderId: string,
  supplierId: string,
  lockId: string
): Promise<AcquireLockResult> {
  const nowIso = new Date().toISOString();
  const staleBeforeIso = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  const { data, error } = await client
    .from('supplier_orders')
    .update({ status: 'processing', locked_at: nowIso, locked_by: lockId, updated_at: nowIso })
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId)
    // Einzige Quelle der Wahrheit für „darf verarbeitet werden" – zuvor stand
    // dieselbe Liste hier hart verdrahtet UND als Konstante in status.ts, die
    // niemand las: eine Änderung an der Konstante wäre wirkungslos geblieben.
    .in('status', [...PROCESSABLE_STATUSES])
    .or(`locked_at.is.null,locked_at.lt.${staleBeforeIso}`)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .select('attempt_count')
    .maybeSingle();

  if (error) {
    console.error('[lifecycle] acquireLock fehlgeschlagen:', error.message);
    return { acquired: false };
  }
  if (!data) return { acquired: false };

  // Unter Lock sicher: Versuchszähler hochsetzen, Fehler des Vorlaufs leeren.
  const attemptCount = (data.attempt_count ?? 0) + 1;
  await client
    .from('supplier_orders')
    .update({ attempt_count: attemptCount, last_error: null, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId);

  await recordEvent(client, {
    orderId,
    supplierId,
    eventType: 'lock',
    toStatus: 'processing',
    reason: `Verarbeitung übernommen (Lock ${lockId}), Versuch ${attemptCount}.`,
    detail: { lockId, attemptCount },
  });
  return { acquired: true, attemptCount };
}

/** Gibt den Lock frei (Status wird separat über transition() gesetzt). */
export async function releaseLock(client: AdminClient, orderId: string, supplierId: string): Promise<void> {
  const { error } = await client
    .from('supplier_orders')
    .update({ locked_at: null, locked_by: null, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId);
  if (error) console.error('[lifecycle] releaseLock fehlgeschlagen:', error.message);
}

export interface TransitionInput {
  from: SupplierOrderStatus;
  to: SupplierOrderStatus;
  reason: string;
  /** Zusätzliche Spalten-Updates (z.B. last_run, last_error, next_attempt_at). */
  patch?: Record<string, unknown>;
  /** Strukturierte Zusatzdaten fürs Audit-Log. */
  detail?: unknown;
}

/**
 * Wendet einen Statuswechsel an – nur wenn er erlaubt ist (canTransition)
 * UND der aktuelle Status noch `from` ist (optimistische Sperre gegen
 * konkurrierende Änderungen). Protokolliert den Übergang.
 * @returns true, wenn angewendet; false bei ungültigem/kollidierendem Übergang.
 */
export async function transition(
  client: AdminClient,
  orderId: string,
  supplierId: string,
  input: TransitionInput
): Promise<boolean> {
  if (!canTransition(input.from, input.to)) {
    console.error(`[lifecycle] verbotener Übergang ${input.from} → ${input.to} (${orderId}/${supplierId})`);
    return false;
  }

  const { data, error } = await client
    .from('supplier_orders')
    .update({ status: input.to, updated_at: new Date().toISOString(), ...(input.patch ?? {}) })
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId)
    .eq('status', input.from)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[lifecycle] transition-Update fehlgeschlagen:', error.message);
    return false;
  }
  if (!data) return false; // Status hatte sich zwischenzeitlich geändert.

  await recordEvent(client, {
    orderId,
    supplierId,
    eventType: 'transition',
    fromStatus: input.from,
    toStatus: input.to,
    reason: input.reason,
    detail: input.detail,
  });
  return true;
}
