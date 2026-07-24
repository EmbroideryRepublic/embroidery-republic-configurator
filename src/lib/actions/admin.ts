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
import {
  beendeAlleAdminSitzungen,
  isAdminConfigured,
  istAdmin,
  meldeAdminAb,
  meldeAdminAn,
  widerrufeSitzung,
} from '@/lib/admin/auth';
import { pruefeRateLimit } from '@/lib/security/rateLimit';
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
  // VOR dem Vergleich: Ohne Begrenzung ließe sich das Secret beliebig oft
  // raten, und wer es errät, sieht alle Bestellungen und Kundendaten.
  // Gezählt wird jeder Versuch, auch der erfolglose – sonst bliebe Raten
  // unbegrenzt möglich.
  const grenze = await pruefeRateLimit('adminLogin');
  if (!grenze.erlaubt) {
    return { success: false, error: grenze.meldung };
  }

  // Prüfung und Sitzungsanlage liegen vollständig in lib/admin/auth.ts:
  // Das Secret wird dort zeitkonstant verglichen und danach verworfen. Ins
  // Cookie geht ein zufälliges Sitzungstoken, nie das Secret selbst.
  const anmeldung = await meldeAdminAn(String(formData.get('key') ?? ''));
  if (!anmeldung.ok) {
    return { success: false, error: anmeldung.fehler };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function adminLogout(): Promise<void> {
  // Widerruft die Sitzung serverseitig UND entfernt das Cookie. Ein bloßes
  // Löschen des Cookies würde eine kopierte Sitzung gültig lassen.
  await meldeAdminAb();
  revalidatePath('/admin');
}

/**
 * Beendet alle Zugänge, ohne das Secret zu ändern.
 *
 * Für den Fall eines vergessenen Zugangs auf einem fremden Rechner. Vorher
 * ging das nur über das Ändern des Secrets – womit auch alle anderen
 * ausgesperrt waren.
 */
export async function beendeAlleSitzungenAction(): Promise<AdminActionResult> {
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const anzahl = await beendeAlleAdminSitzungen();
  revalidatePath('/admin');
  return { success: true, error: `${anzahl} Sitzung(en) beendet.` };
}

/** Beendet eine einzelne Sitzung aus der Übersicht. */
export async function widerrufeSitzungAction(id: string): Promise<AdminActionResult> {
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const ok = await widerrufeSitzung(id);
  revalidatePath('/admin');
  return { success: ok, error: ok ? undefined : 'Die Sitzung konnte nicht beendet werden.' };
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
  if (!(await istAdmin())) {
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
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
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
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const r = await pauseSupplierOrder(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Manueller Prozess: „Bei Textil-Grosshandel bestellt" festhalten. */
export async function markSupplierOrderedAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const r = await markSupplierOrderAsOrdered(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  revalidatePath(`/admin/bestellung/${orderId}`);
  revalidatePath('/admin');
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Admin-Monitoring: dauerhaft abbrechen. */
export async function cancelSupplierOrderAction(orderId: string, supplierId: SupplierId): Promise<AdminActionResult> {
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const r = await cancelSupplierOrder(orderId, supplierId);
  revalidatePath(MONITOR_PATH);
  return { success: r.ok, error: r.ok ? undefined : r.reason };
}

/** Admin-Monitoring: den Hintergrund-Processor manuell auslösen (fällige
 *  Einträge jetzt verarbeiten – nützlich ohne aktiven Cron). */
export async function runSupplierProcessorAction(): Promise<AdminActionResult> {
  if (!(await istAdmin())) return { success: false, error: 'Nicht angemeldet.' };
  const { reclaimed, processed } = await processDueSupplierOrders({ limit: 25 });
  revalidatePath(MONITOR_PATH);
  return { success: true, error: `${processed.length} verarbeitet, ${reclaimed} Locks zurückgesetzt.` };
}
