/**
 * Übergabe einer Kundenbestellung an den Lieferantenprozess.
 *
 * ── WANN das passiert ─────────────────────────────────────────────────
 * NICHT mehr beim Bestelleingang. Aufgerufen wird ausschließlich beim
 * Öffnen der Bestelldetailseite im Adminbereich (`lib/admin/data.ts`) –
 * und die wird für Bestellungen erst nach Ablauf der Stornofrist
 * ausgeliefert. Daraus folgt zweierlei:
 *
 *   • Für stornierte Bestellungen entsteht NIE ein Lieferantenauftrag.
 *   • Der Auslöser ist der Betreiber, nicht der Bestelleingang.
 *
 * ── WAS danach passiert ───────────────────────────────────────────────
 * Der Auftrag wird angelegt und eingereiht, aber NICHT automatisch beim
 * Lieferanten ausgeführt – die Bestellung beim Lieferanten erfolgt derzeit
 * bewusst manuell über den Adminbereich (siehe docs/lieferantenprozess.md).
 *
 * Idempotent: bereits eingereihte/laufende/abgeschlossene Einträge werden
 * NICHT erneut eingereiht (transition greift nur bei Status 'draft'). Das
 * ist wesentlich, weil die Detailseite beliebig oft geöffnet werden kann.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { createSupplierOrder } from '../createSupplierOrder';
import { transition } from './store';
import { protokolliereBestellereignis } from '@/lib/orders/orderService';

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

  const eingereihteLieferanten: string[] = [];

  for (const job of created.jobs) {
    const ok = await transition(client, orderId, job.supplierId, {
      from: 'draft',
      to: 'queued',
      reason: 'Nach Ablauf der Stornofrist beim Öffnen im Adminbereich eingereiht.',
      patch: { next_attempt_at: nowIso },
    });
    if (ok) {
      enqueued++;
      eingereihteLieferanten.push(job.supplierId);
    } else {
      skipped++; // bereits queued/processing/ordered/…
    }
  }

  // Nur beim TATSÄCHLICHEN Start protokollieren. Die Detailseite ruft diese
  // Funktion bei jedem Aufruf auf; ohne diese Bedingung stünde in der
  // Historie ein Eintrag je Seitenaufruf statt einer je Bestellung.
  if (enqueued > 0) {
    await protokolliereBestellereignis({
      orderId,
      eventType: 'supplier_process_started',
      reason: `Lieferantenprozess gestartet (${enqueued} Auftrag/Aufträge eingereiht).`,
      detail: { lieferanten: eingereihteLieferanten, uebersprungen: skipped },
    });
  }

  return { ok: true, enqueued, skipped };
}
