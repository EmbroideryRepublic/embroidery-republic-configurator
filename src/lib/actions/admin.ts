'use server';

/**
 * Server Actions des Admin-Bereichs – die EINZIGEN Schreiber:
 *  - adminLogin/adminLogout: Cookie-Gate (siehe lib/admin/auth.ts)
 *  - prepareSupplierOrderAction: der "Beim Lieferanten bestellen"-Button.
 *
 * Jede schreibende Action prüft die Admin-Authentifizierung selbst –
 * das Layout-Gate schützt nur die Anzeige, Actions sind eigenständige
 * Endpunkte und dürfen sich darauf nicht verlassen.
 */
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, isAdminAuthenticated, isAdminConfigured } from '@/lib/admin/auth';
import { createSupplierOrder } from '@/lib/suppliers';
import type { SupplierId } from '@/lib/suppliers';
import {
  cancelSupplierOrder,
  pauseSupplierOrder,
  markSupplierOrderAsOrdered,
  processDueSupplierOrders,
  processSupplierOrder,
  requeueForProcessing,
  type ProcessResult,
} from '@/lib/suppliers/lifecycle/orchestrator';

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

export async function adminLogin(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  if (!isAdminConfigured()) {
    return { success: false, error: 'ADMIN_SECRET ist nicht konfiguriert (mind. 12 Zeichen in .env.local setzen).' };
  }
  const key = String(formData.get('key') ?? '');
  if (key !== process.env.ADMIN_SECRET) {
    return { success: false, error: 'Falscher Zugangsschlüssel.' };
  }
  cookies().set(ADMIN_COOKIE_NAME, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 Stunden – danach erneut anmelden
  });
  revalidatePath('/admin');
  return { success: true };
}

export async function adminLogout(): Promise<void> {
  cookies().delete(ADMIN_COOKIE_NAME);
  revalidatePath('/admin');
}

export interface PrepareSupplierOrderResult extends AdminActionResult {
  results?: ProcessResult[];
}

/**
 * "Beim Lieferanten bestellen": erzeugt/aktualisiert die Lieferanten-
 * Snapshots (createSupplierOrder – idempotent, überschreibt den Status
 * nicht) und stößt je Lieferant den robusten Verarbeitungspfad an:
 * requeueForProcessing() bringt re-runnable Bestellungen nach 'queued'
 * (ordered/cancelled/processing bleiben geschützt), processSupplierOrder()
 * übernimmt dann Lock, Lauf, Klassifikation, Statuswechsel und Audit.
 * Jeder Statuswechsel landet im Audit-Log (supplier_order_events).
 */
export async function prepareSupplierOrderAction(orderId: string): Promise<PrepareSupplierOrderResult> {
  if (!isAdminAuthenticated()) {
    return { success: false, error: 'Nicht angemeldet.' };
  }

  const created = await createSupplierOrder(orderId);
  if (!created.success || !created.jobs) {
    return { success: false, error: created.error ?? 'Lieferantenpositionen konnten nicht erzeugt werden.' };
  }
  if (created.jobs.length === 0) {
    return {
      success: false,
      error:
        'Keine Position dieser Bestellung hat eine hinterlegte Bezugsquelle (supplierRefs) – nichts zu automatisieren.',
    };
  }

  const results: ProcessResult[] = [];
  for (const job of created.jobs) {
    const requeue = await requeueForProcessing(orderId, job.supplierId);
    if (!requeue.ok) {
      results.push({ orderId, supplierId: job.supplierId, skipped: true, reason: requeue.reason });
      continue;
    }
    results.push(await processSupplierOrder(orderId, job.supplierId));
  }

  revalidatePath(`/admin/bestellung/${orderId}`);
  return { success: true, results };
}

const MONITOR_PATH = '/admin/lieferanten-bestellungen';

/** Admin-Monitoring: erneut anstoßen (re-queue + sofort verarbeiten). */
export async function retrySupplierOrderAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!isAdminAuthenticated()) return { success: false, error: 'Nicht angemeldet.' };
  const requeue = await requeueForProcessing(orderId, supplierId);
  if (!requeue.ok) {
    revalidatePath(MONITOR_PATH);
    return { success: false, error: requeue.reason };
  }
  const result = await processSupplierOrder(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  return { success: !result.skipped, error: result.skipped ? result.reason : undefined };
}

/** Admin-Monitoring: pausieren (wieder aufnehmbar). */
export async function pauseSupplierOrderAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!isAdminAuthenticated()) return { success: false, error: 'Nicht angemeldet.' };
  const r = await pauseSupplierOrder(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Manueller Prozess: „Bei Textil-Grosshandel bestellt" festhalten. */
export async function markSupplierOrderedAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!isAdminAuthenticated()) return { success: false, error: 'Nicht angemeldet.' };
  const r = await markSupplierOrderAsOrdered(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  revalidatePath(`/admin/bestellung/${orderId}`);
  revalidatePath('/admin');
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Admin-Monitoring: dauerhaft abbrechen. */
export async function cancelSupplierOrderAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!isAdminAuthenticated()) return { success: false, error: 'Nicht angemeldet.' };
  const r = await cancelSupplierOrder(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Admin-Monitoring: den Hintergrund-Processor manuell auslösen (fällige
 *  Einträge jetzt verarbeiten – nützlich ohne aktiven Cron). */
export async function runSupplierProcessorAction(): Promise<AdminActionResult> {
  if (!isAdminAuthenticated()) return { success: false, error: 'Nicht angemeldet.' };
  const { reclaimed, processed } = await processDueSupplierOrders({ limit: 25 });
  revalidatePath(MONITOR_PATH);
  return { success: true, error: `${processed.length} verarbeitet, ${reclaimed} Locks zurückgesetzt.` };
}
