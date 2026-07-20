/**
 * Automatische Übergabe einer Kundenbestellung an den Lieferantenprozess.
 *
 * Wird nach erfolgreichem Bestellabschluss aufgerufen (bei Rechnung sofort;
 * bei Karte/PayPal später aus dem Zahlungs-Webhook, sobald bezahlt). Erzeugt
 * die Lieferanten-Snapshots (idempotent) und reiht sie in die Warteschlange
 * ein (draft → queued, sofort fällig). Der Hintergrund-Processor verarbeitet
 * sie anschließend – ohne manuelle Admin-Aktion.
 *
 * Idempotent: bereits eingereihte/laufende/abgeschlossene Einträge werden
 * NICHT erneut eingereiht (transition greift nur bei Status 'draft').
 */
import { createAdminClient } from '@/lib/supabase/server';
import { createSupplierOrder } from '../createSupplierOrder';
import { transition } from './store';

export interface EnqueueResult {
  ok: boolean;
  enqueued: number;
  /** Bereits vorher eingereiht/verarbeitet (idempotent übersprungen). */
  skipped: number;
  error?: string;
}

export async function enqueueSupplierOrdersForOrder(orderId: string): Promise<EnqueueResult> {
  const created = await createSupplierOrder(orderId);
  if (!created.success || !created.jobs) {
    return { ok: false, enqueued: 0, skipped: 0, error: created.error ?? 'Snapshots konnten nicht erzeugt werden.' };
  }

  const client = createAdminClient();
  const nowIso = new Date().toISOString();
  let enqueued = 0;
  let skipped = 0;

  for (const job of created.jobs) {
    const ok = await transition(client, orderId, job.supplierId, {
      from: 'draft',
      to: 'queued',
      reason: 'Automatisch nach Bestelleingang eingereiht.',
      patch: { next_attempt_at: nowIso },
    });
    if (ok) enqueued++;
    else skipped++; // bereits queued/processing/ordered/…
  }

  return { ok: true, enqueued, skipped };
}
