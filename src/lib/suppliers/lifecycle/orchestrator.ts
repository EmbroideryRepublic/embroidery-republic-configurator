/**
 * Orchestrator EINER Lieferantenbestellung (Bestellung × Lieferant) – der
 * robuste, wiederholbare Verarbeitungspfad für den Echtbetrieb.
 *
 * Ablauf (idempotent, resumbar):
 *   1. Lock übernehmen (verhindert parallele Verarbeitung; status→processing).
 *   2. Persistierten Snapshot laden → Automatisierungs-Job rekonstruieren.
 *   3. Test/Prod-Trennung: ist die Automatisierung deaktiviert (Standard),
 *      Dry-Run OHNE Browser (nichts wird real bestellt) → 'blocked'.
 *   4. Sonst: Playwright-Worker ausführen, Ergebnis klassifizieren
 *      (transient/blocked/permanent) und den Folgestatus samt etwaigem
 *      Retry-Zeitpunkt ableiten (status.ts).
 *   5. Statuswechsel + Audit-Ereignisse schreiben, Lock freigeben.
 *
 * Bewusst lädt der Orchestrator ausschließlich aus der Datenbank (nicht aus
 * einem übergebenen Job): was gespeichert ist, wird ausgeführt – dadurch
 * funktioniert der identische Pfad für den Admin-Button UND einen späteren
 * Hintergrund-Processor/Cron.
 */
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { runSupplierJob } from '../worker/supplierWorker';
import type { SupplierAutomationJob, SupplierId, SupplierJobMode, SupplierOrderPosition, SupplierWorkerRunResult } from '../types';
import { canTransition, classifyRunFailure, decideOutcome, type SupplierOrderStatus } from './status';
import { acquireLock, LOCK_TTL_MS, recordEvent, releaseLock, transition } from './store';
import { istTestmodus, meldeAbgefangen } from '@/config/testmodus';

/** Master-Schalter Test/Prod: nur bei '1' läuft echte Browser-Automatisierung.
 *  Default AUS – im Test-/Dev-Betrieb wird nichts real beim Lieferanten
 *  bestellt (Dry-Run). */
export function isAutomationEnabled(): boolean {
  // Der Testmodus überstimmt den Schalter. Ohne diese Sperre würde ein
  // Testlauf auf einer Umgebung mit SUPPLIER_AUTOMATION_ENABLED=1 eine
  // ECHTE Bestellung beim Großhändler auslösen – die teuerste denkbare
  // Nebenwirkung eines Tests, und die einzige hier, die sich nicht
  // zurücknehmen lässt.
  if (istTestmodus()) {
    meldeAbgefangen('Lieferantenautomatisierung', 'Ausführung im Testmodus gesperrt');
    return false;
  }
  return process.env.SUPPLIER_AUTOMATION_ENABLED === '1';
}

/**
 * Übernimmt VERWAISTE Locks: Datensätze, die seit mehr als LOCK_TTL_MS in
 * 'processing' hängen (Prozessabsturz/Serverneustart/abgebrochene
 * Browser-Sitzung), werden zurück auf 'queued' gesetzt und sofort fällig
 * gemacht – so laufen unterbrochene Bestellungen automatisch weiter, ohne
 * Doppelbestellung (der abgestürzte Lauf hat den Warenkorb höchstens
 * teilweise befüllt; der Adapter füllt idempotent auf, sobald echte Logik
 * existiert). Der verbrauchte Versuch bleibt gezählt (kein Endlos-Crash-Loop).
 */
export async function reclaimStaleLocks(client: ReturnType<typeof createAdminClient>): Promise<number> {
  const nowIso = new Date().toISOString();
  const staleIso = new Date(Date.now() - LOCK_TTL_MS).toISOString();
  const { data, error } = await client
    .from('supplier_orders')
    .update({
      status: 'queued',
      locked_at: null,
      locked_by: null,
      next_attempt_at: nowIso,
      last_error: 'Verwaister Lock (Prozessabbruch) automatisch zurückgesetzt.',
      updated_at: nowIso,
    })
    .eq('status', 'processing')
    .lt('locked_at', staleIso)
    .select('order_id, supplier_id');

  if (error) {
    console.error('[lifecycle] reclaimStaleLocks fehlgeschlagen:', error.message);
    return 0;
  }
  for (const r of data ?? []) {
    await recordEvent(client, {
      orderId: r.order_id as string,
      supplierId: r.supplier_id as string,
      eventType: 'unlock',
      fromStatus: 'processing',
      toStatus: 'queued',
      reason: 'Verwaister Lock nach Timeout zurückgesetzt – erneut eingereiht.',
    });
  }
  return data?.length ?? 0;
}

/**
 * Hintergrund-Processor: verarbeitet alle FÄLLIGEN Einträge (queued und
 * next_attempt_at erreicht). Übernimmt zuvor verwaiste Locks. Läuft bereits
 * verarbeitete/gesperrte Einträge NICHT doppelt an (processSupplierOrder →
 * acquireLock ist atomar; ein bereits laufender Eintrag wird übersprungen).
 * Von einem geschützten Cron-Endpoint bzw. Scheduler aufzurufen.
 */
export async function processDueSupplierOrders(
  opts: { limit?: number } = {}
): Promise<{ reclaimed: number; processed: ProcessResult[] }> {
  const client = createAdminClient();
  const reclaimed = await reclaimStaleLocks(client);

  const nowIso = new Date().toISOString();
  const { data: due, error } = await client
    .from('supplier_orders')
    .select('order_id, supplier_id')
    .eq('status', 'queued')
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .order('next_attempt_at', { ascending: true, nullsFirst: true })
    .limit(opts.limit ?? 25);

  if (error) {
    console.error('[lifecycle] processDueSupplierOrders – Auswahl fehlgeschlagen:', error.message);
    return { reclaimed, processed: [] };
  }

  const processed: ProcessResult[] = [];
  for (const row of due ?? []) {
    processed.push(await processSupplierOrder(row.order_id as string, row.supplier_id as SupplierId));
  }
  return { reclaimed, processed };
}

/**
 * Gemeinsames Gerüst der drei einfachen Admin-Statusübergänge (pausieren/
 * als-bestellt-markieren/abbrechen): Status laden → Sonderfälle prüfen
 * (bereits im Zielstatus / läuft gerade, in der übergebenen Reihenfolge) →
 * canTransition prüfen → transition() ausführen. Da ein Datensatz immer nur
 * EINEN Status gleichzeitig hat, ist die Prüfreihenfolge der Sonderfälle
 * verhaltensneutral – es kann ohnehin nur einer zutreffen.
 */
async function ladeStatusUndPruefeUebergang(
  client: ReturnType<typeof createAdminClient>,
  orderId: string,
  supplierId: SupplierId,
  optionen: {
    zielStatus: SupplierOrderStatus;
    /** Vor der allgemeinen canTransition-Prüfung geprüft (z.B. „bereits im Zielstatus" oder „läuft gerade"). */
    sonderfaelle: Array<{ wenn: (status: SupplierOrderStatus) => boolean; ergebnis: { ok: boolean; reason: string } }>;
    nichtErlaubtReason: (status: SupplierOrderStatus) => string;
    transitionReason: string;
    patch?: Record<string, unknown>;
    erfolgReason: string;
    fehlschlagReason: string;
  }
): Promise<{ ok: boolean; reason: string }> {
  const { data } = await client
    .from('supplier_orders')
    .select('status')
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId)
    .maybeSingle<{ status: SupplierOrderStatus }>();
  if (!data) return { ok: false, reason: 'Kein Lieferanten-Snapshot vorhanden.' };

  for (const sonderfall of optionen.sonderfaelle) {
    if (sonderfall.wenn(data.status)) return sonderfall.ergebnis;
  }

  if (!canTransition(data.status, optionen.zielStatus)) {
    return { ok: false, reason: optionen.nichtErlaubtReason(data.status) };
  }

  const ok = await transition(client, orderId, supplierId, {
    from: data.status,
    to: optionen.zielStatus,
    reason: optionen.transitionReason,
    patch: optionen.patch,
  });
  return { ok, reason: ok ? optionen.erfolgReason : optionen.fehlschlagReason };
}

/** Admin-Aktion: bewusst pausieren (wieder aufnehmbar). Ein laufender
 *  ('processing') Eintrag ist nicht pausierbar (erst nach Ende). */
export async function pauseSupplierOrder(
  orderId: string,
  supplierId: SupplierId
): Promise<{ ok: boolean; reason: string }> {
  const client = createAdminClient();
  return ladeStatusUndPruefeUebergang(client, orderId, supplierId, {
    zielStatus: 'paused',
    sonderfaelle: [
      { wenn: (s) => s === 'processing', ergebnis: { ok: false, reason: 'Läuft gerade – erst nach Abschluss pausierbar.' } },
    ],
    nichtErlaubtReason: (s) => `Aus Status "${s}" nicht pausierbar.`,
    transitionReason: 'Vom Admin pausiert.',
    patch: { next_attempt_at: null },
    erfolgReason: 'Pausiert.',
    fehlschlagReason: 'Pausieren fehlgeschlagen (Status geändert).',
  });
}

/**
 * Admin-Aktion des MANUELLEN Prozesses: „Ich habe beim Lieferanten bestellt."
 *
 * Der Betreiber bestellt selbst im Shop des Lieferanten und hält das Ergebnis
 * hier fest. Das ist der Regelweg des Soft-Launch; die Browser-Automatisierung
 * ruht (siehe docs/manueller-lieferantenprozess.md).
 */
export async function markSupplierOrderAsOrdered(
  orderId: string,
  supplierId: SupplierId
): Promise<{ ok: boolean; reason: string }> {
  const client = createAdminClient();
  return ladeStatusUndPruefeUebergang(client, orderId, supplierId, {
    zielStatus: 'ordered',
    sonderfaelle: [
      { wenn: (s) => s === 'ordered', ergebnis: { ok: true, reason: 'War bereits als bestellt markiert.' } },
      { wenn: (s) => s === 'processing', ergebnis: { ok: false, reason: 'Läuft gerade – bitte kurz warten.' } },
    ],
    nichtErlaubtReason: (s) => `Aus Status "${s}" nicht als bestellt markierbar.`,
    transitionReason: 'Manuell beim Lieferanten bestellt (Adminbereich).',
    patch: { next_attempt_at: null },
    erfolgReason: 'Als bestellt markiert.',
    fehlschlagReason: 'Markieren fehlgeschlagen (Status geändert).',
  });
}

/** Admin-Aktion: dauerhaft abbrechen (terminal). */
export async function cancelSupplierOrder(
  orderId: string,
  supplierId: SupplierId
): Promise<{ ok: boolean; reason: string }> {
  const client = createAdminClient();
  return ladeStatusUndPruefeUebergang(client, orderId, supplierId, {
    zielStatus: 'cancelled',
    sonderfaelle: [
      { wenn: (s) => s === 'cancelled', ergebnis: { ok: true, reason: 'Bereits abgebrochen.' } },
      { wenn: (s) => s === 'processing', ergebnis: { ok: false, reason: 'Läuft gerade – erst nach Abschluss abbrechbar.' } },
    ],
    nichtErlaubtReason: (s) => `Aus Status "${s}" nicht abbrechbar.`,
    transitionReason: 'Vom Admin dauerhaft abgebrochen.',
    patch: { next_attempt_at: null, locked_at: null, locked_by: null },
    erfolgReason: 'Abgebrochen.',
    fehlschlagReason: 'Abbrechen fehlgeschlagen (Status geändert).',
  });
}

/**
 * Bringt eine (Bestellung × Lieferant) in einen verarbeitbaren Zustand
 * (→ 'queued'), sofern sinnvoll. Schützt idempotent vor Doppelbestellung:
 * 'ordered'/'cancelled' werden NICHT erneut eingereiht, 'processing' läuft
 * bereits. 'failed'/'blocked'/'cart_prepared' können manuell erneut
 * angestoßen werden.
 */
export async function requeueForProcessing(
  orderId: string,
  supplierId: SupplierId
): Promise<{ ok: boolean; reason: string }> {
  const client = createAdminClient();
  const { data: row } = await client
    .from('supplier_orders')
    .select('status')
    .eq('order_id', orderId)
    .eq('supplier_id', supplierId)
    .maybeSingle<{ status: SupplierOrderStatus }>();

  if (!row) return { ok: false, reason: 'Kein Lieferanten-Snapshot vorhanden.' };
  const status = row.status;
  if (status === 'draft' || status === 'queued') return { ok: true, reason: 'Bereits verarbeitbar.' };
  if (status === 'processing') return { ok: false, reason: 'Wird bereits verarbeitet.' };
  if (status === 'ordered') return { ok: false, reason: 'Bereits beim Lieferanten bestellt.' };
  if (status === 'cancelled') return { ok: false, reason: 'Abgebrochen – nicht erneut eingereiht.' };

  const ok = await transition(client, orderId, supplierId, {
    from: status,
    to: 'queued',
    reason: 'Manuell erneut eingereiht.',
    patch: { next_attempt_at: null },
  });
  return { ok, reason: ok ? 'Erneut eingereiht.' : 'Einreihen fehlgeschlagen.' };
}

export interface ProcessResult {
  orderId: string;
  supplierId: SupplierId;
  /** true, wenn kein Lock erlangt wurde (läuft schon / nicht fällig / erledigt). */
  skipped: boolean;
  status?: SupplierOrderStatus;
  reason: string;
  run?: SupplierWorkerRunResult;
}

interface SupplierOrderRow {
  status: SupplierOrderStatus;
  mode: SupplierJobMode;
  positions: SupplierOrderPosition[];
  attempt_count: number;
  max_attempts: number;
}

function firstError(run: SupplierWorkerRunResult): string | undefined {
  return run.steps.find((s) => s.status === 'failed')?.error ?? run.steps.find((s) => s.status === 'not_implemented')?.error;
}

/**
 * Verarbeitet eine (Bestellung × Lieferant). Fängt intern alle Fehler ab und
 * gibt ein strukturiertes Ergebnis zurück (wirft nicht) – der Aufrufer
 * (Admin-Action/Processor) soll dadurch nie abstürzen.
 */
export async function processSupplierOrder(
  orderId: string,
  supplierId: SupplierId
): Promise<ProcessResult> {
  const client = createAdminClient();
  const lockId = randomUUID();

  const lock = await acquireLock(client, orderId, supplierId, lockId);
  if (!lock.acquired) {
    return { orderId, supplierId, skipped: true, reason: 'Bereits in Verarbeitung, nicht fällig oder abgeschlossen.' };
  }
  const attemptCount = lock.attemptCount ?? 1;

  try {
    const { data: row, error } = await client
      .from('supplier_orders')
      .select('status, mode, positions, attempt_count, max_attempts')
      .eq('order_id', orderId)
      .eq('supplier_id', supplierId)
      .maybeSingle<SupplierOrderRow>();

    if (error || !row) {
      await recordEvent(client, { orderId, supplierId, eventType: 'error', reason: 'Snapshot nicht ladbar.' });
      await transition(client, orderId, supplierId, {
        from: 'processing',
        to: 'failed',
        reason: 'Lieferanten-Snapshot konnte nicht geladen werden.',
      });
      return { orderId, supplierId, skipped: false, status: 'failed', reason: 'Snapshot nicht ladbar.' };
    }

    // ── Test/Prod-Trennung: Dry-Run ohne Browser ─────────────────────────
    if (!isAutomationEnabled()) {
      await recordEvent(client, {
        orderId,
        supplierId,
        eventType: 'note',
        reason: 'Dry-Run: Automatisierung deaktiviert (SUPPLIER_AUTOMATION_ENABLED≠1) – Job vorbereitet, nicht ausgeführt.',
        detail: { positions: row.positions.length, mode: row.mode },
      });
      await transition(client, orderId, supplierId, {
        from: 'processing',
        to: 'blocked',
        reason: 'Automatisierung im Testmodus deaktiviert – zum Ausführen SUPPLIER_AUTOMATION_ENABLED=1 setzen.',
      });
      return { orderId, supplierId, skipped: false, status: 'blocked', reason: 'Testmodus (Dry-Run).' };
    }

    // ── Echter Lauf ──────────────────────────────────────────────────────
    const job: SupplierAutomationJob = {
      jobId: `${orderId}:${supplierId}`,
      orderId,
      orderNumber: buildOrderNumber(orderId),
      supplierId,
      mode: row.mode,
      positions: row.positions,
    };

    const run = await runSupplierJob(job);
    const failureKind =
      run.outcome === 'failed' || run.outcome === 'partial' ? classifyRunFailure(run) : undefined;
    const decision = decideOutcome({
      runOutcome: run.outcome,
      mode: row.mode,
      attemptCount,
      maxAttempts: row.max_attempts,
      failureKind,
    });

    await recordEvent(client, {
      orderId,
      supplierId,
      eventType: 'attempt',
      reason: `Lauf beendet: ${run.outcome} → ${decision.status}.`,
      detail: {
        attemptCount,
        outcome: run.outcome,
        // Wer/wann/wie lange – ohne diese Angaben ist ein Audit-Eintrag im
        // Streitfall wertlos.
        supplierName: run.supplierName,
        mode: run.mode,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        durationMs: run.durationMs,
        // WAS beim Lieferanten hinterlegt wurde: vollständige
        // Größenverteilung inkl. Stückzahlen und Varianten-IDs.
        positions: run.positions,
        // Ergebnis JEDES Schrittes, nicht nur der Selektionen.
        steps: run.steps.map((s) => ({
          step: s.step,
          status: s.status,
          ...(s.positionIndex === undefined ? {} : { positionIndex: s.positionIndex }),
          ...(s.size ? { size: s.size } : {}),
          ...(s.quantity === undefined ? {} : { quantity: s.quantity }),
          ...(s.selection ? { selection: s.selection } : {}),
          ...(s.error ? { error: s.error } : {}),
          at: s.at,
          durationMs: s.durationMs,
        })),
        error: firstError(run),
      },
    });

    const patch: Record<string, unknown> = { last_run: run, last_error: firstError(run) ?? null };
    patch.next_attempt_at = decision.retryDelayMs ? new Date(Date.now() + decision.retryDelayMs).toISOString() : null;

    await transition(client, orderId, supplierId, {
      from: 'processing',
      to: decision.status,
      reason: decision.reason,
      patch,
      detail: { attemptCount, outcome: run.outcome, failureKind },
    });

    return { orderId, supplierId, skipped: false, status: decision.status, reason: decision.reason, run };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordEvent(client, { orderId, supplierId, eventType: 'error', reason: `Unerwarteter Fehler: ${message}` });
    // Unerwarteter Fehler (außerhalb des klassifizierten Worker-Laufs, z.B.
    // beim Laden/Transition) → bewusst 'failed', KEIN Auto-Retry: solche Fehler
    // sind eher Code-/Infrastrukturprobleme als transiente Netzfehler; der Admin
    // kann nach Klärung manuell erneut anstoßen (requeueForProcessing).
    await transition(client, orderId, supplierId, {
      from: 'processing',
      to: 'failed',
      reason: `Unerwarteter Fehler während der Verarbeitung: ${message}`,
      patch: { last_error: message },
    });
    return { orderId, supplierId, skipped: false, status: 'failed', reason: message };
  } finally {
    await releaseLock(client, orderId, supplierId);
  }
}
