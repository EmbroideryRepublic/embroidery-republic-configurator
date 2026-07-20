/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIEFERANTEN-BESTELLUNG – Lebenszyklus (Statusmaschine + Retry-Policy)
 * ═══════════════════════════════════════════════════════════════════════
 * REINE Domänenlogik ohne I/O – die einzige Quelle der Wahrheit dafür,
 *  - welche Status es gibt,
 *  - welche Übergänge erlaubt sind (verhindert ungültige Sprünge),
 *  - wie aus einem Worker-Lauf der Folgestatus + ein etwaiger Retry
 *    abgeleitet wird (transient vs. dauerhaft vs. blockiert).
 *
 * Ziel: jederzeit eindeutig, WO eine Lieferantenbestellung steht und WARUM
 * sie ggf. abgebrochen wurde – die Persistenz (lifecycle/store.ts) schreibt
 * jeden Übergang zusätzlich in ein Audit-Log.
 */
import type { SupplierWorkerRunResult } from '../types';

/**
 * Status einer (Bestellung × Lieferant)-Automatisierung.
 *  draft         – Snapshot erzeugt, noch nicht zur Verarbeitung freigegeben
 *  queued        – freigegeben/eingeplant (auch: wartet auf Retry)
 *  processing    – Worker läuft gerade (zugleich der LOCK-Status)
 *  cart_prepared – Warenkorb erfolgreich befüllt (Modus 'prepare-cart')
 *  ordered       – Bestellung erfolgreich abgeschlossen (Modus 'checkout')
 *  blocked       – braucht menschliches Eingreifen/Entscheidung (z.B.
 *                  fehlende Zugangsdaten, unverifizierte Variante, Adapter-
 *                  Stub) – KEIN automatischer Retry
 *  paused        – vom Admin angehalten (bewusster Halt, wieder aufnehmbar)
 *  failed        – dauerhaft fehlgeschlagen (Retries erschöpft/permanent)
 *  cancelled     – vom Admin dauerhaft abgebrochen
 */
export type SupplierOrderStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'cart_prepared'
  | 'ordered'
  | 'blocked'
  | 'paused'
  | 'failed'
  | 'cancelled';

/** Erlaubte Statusübergänge. Alles, was hier nicht steht, ist verboten und
 *  wird von transitionSupplierOrder() abgelehnt (schützt vor inkonsistenten
 *  Zuständen, z.B. „ordered" → „processing"). */
export const SUPPLIER_ORDER_TRANSITIONS: Readonly<Record<SupplierOrderStatus, readonly SupplierOrderStatus[]>> = {
  // 'ordered' ist aus fast jedem Zustand erreichbar, weil der REGELFALL die
  // MANUELLE Bestellung beim Lieferanten ist: der Betreiber bestellt im
  // Shop und markiert den Auftrag anschließend im Adminbereich. Das kann
  // jederzeit passieren – unabhängig davon, ob die (ruhende) Automatisierung
  // den Auftrag je angefasst hat.
  draft: ['queued', 'ordered', 'paused', 'cancelled'],
  queued: ['processing', 'ordered', 'paused', 'cancelled'],
  // 'processing' ist gesperrt/laufend – NICHT pausierbar (erst nach Ende).
  processing: ['cart_prepared', 'ordered', 'queued', 'blocked', 'failed'],
  // Erfolgszustände: erneut einreihbar (z.B. prepare-cart → später checkout),
  // pausierbar oder Admin-Abbruch.
  cart_prepared: ['queued', 'ordered', 'paused', 'cancelled'],
  ordered: ['cancelled'],
  // Wiederaufnahme nach Behebung (Zugangsdaten/Variante) bzw. manueller Retry.
  blocked: ['queued', 'ordered', 'paused', 'cancelled'],
  paused: ['queued', 'ordered', 'cancelled'],
  failed: ['queued', 'ordered', 'paused', 'cancelled'],
  cancelled: [],
};

/** Status, aus denen die Verarbeitung (Lock) gestartet werden darf.
 *  Wird von acquireLock() gelesen – die EINZIGE Stelle, die entscheidet,
 *  ob ein Datensatz verarbeitet werden darf. */
export const PROCESSABLE_STATUSES: readonly SupplierOrderStatus[] = ['draft', 'queued'];

export function canTransition(from: SupplierOrderStatus, to: SupplierOrderStatus): boolean {
  return SUPPLIER_ORDER_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: SupplierOrderStatus): boolean {
  // 'ordered' und 'cancelled' sind endgültig; 'failed'/'blocked' sind
  // „ruhend", aber vom Admin re-aktivierbar (kein automatischer Fortgang).
  return status === 'ordered' || status === 'cancelled';
}

// ── Retry-Policy ────────────────────────────────────────────────────────

export const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 60_000; // 1 min
const BACKOFF_CAP_MS = 15 * 60_000; // 15 min

/** Exponentielles Backoff für den (1-basierten) nächsten Versuch. */
export function backoffMs(attempt: number): number {
  const exp = BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1);
  return Math.min(exp, BACKOFF_CAP_MS);
}

/**
 * Fehlerart eines fehlgeschlagenen Laufs:
 *  transient – vorübergehend (Netz/Timeout/Browser) → Retry sinnvoll
 *  blocked   – braucht Mensch/Entscheidung (Daten/Zugangsdaten/Stub) → kein Retry
 *  permanent – dauerhaft, aber kein menschliches Eingreifen definiert → failed
 */
export type FailureKind = 'transient' | 'blocked' | 'permanent';

/**
 * Klassifiziert einen fehlgeschlagenen/teilweisen Worker-Lauf. Heuristisch
 * anhand der Schrittfehler; bewusst konservativ:
 *  - Mapping-/Varianten-/Zugangsdaten-Fehler und Adapter-Stubs → 'blocked'
 *    (kein sinnloser Retry, sondern Sichtbarkeit für den Admin),
 *  - Browser-/Netz-/Timeout-Signale → 'transient',
 *  - unklarer Rest → 'transient' (mit Versuchsobergrenze abgesichert).
 */
export function classifyRunFailure(run: Pick<SupplierWorkerRunResult, 'outcome' | 'steps'>): FailureKind {
  if (run.outcome === 'not_implemented') return 'blocked';

  const errors = run.steps
    .filter((s) => s.status === 'failed' || s.status === 'not_implemented')
    .map((s) => (s.error ?? '').toLowerCase());
  const anyMatch = (patterns: RegExp) => errors.some((e) => patterns.test(e));

  if (anyMatch(/zugangsdaten|credential|login|nicht verfügbar|ungültig|invalid|unknown-|mapping|auswahlstrategie|verifizier/)) {
    return 'blocked';
  }
  if (anyMatch(/timeout|net::|econn|navigation|browser|chromium|playwright|target closed|disconnected/)) {
    return 'transient';
  }
  return 'transient';
}

export interface OutcomeDecisionInput {
  runOutcome: SupplierWorkerRunResult['outcome'];
  mode: 'prepare-cart' | 'checkout';
  /** Nummer DIESES Versuchs (1-basiert). */
  attemptCount: number;
  maxAttempts?: number;
  /** Fehlerart bei runOutcome 'failed'/'partial' (sonst ignoriert). */
  failureKind?: FailureKind;
}

export interface OutcomeDecision {
  status: SupplierOrderStatus;
  /** Nur gesetzt, wenn ein automatischer Retry eingeplant wird. */
  retryDelayMs?: number;
  reason: string;
}

/**
 * Leitet aus dem Worker-Ergebnis den Folgestatus ab (reine Funktion) –
 * inklusive Retry-Entscheidung bei transienten Fehlern.
 */
export function decideOutcome(input: OutcomeDecisionInput): OutcomeDecision {
  const maxAttempts = input.maxAttempts ?? MAX_ATTEMPTS;

  if (input.runOutcome === 'prepared') {
    return input.mode === 'checkout'
      ? { status: 'ordered', reason: 'Bestellung beim Lieferanten abgeschlossen.' }
      : { status: 'cart_prepared', reason: 'Warenkorb beim Lieferanten vorbereitet.' };
  }

  if (input.runOutcome === 'not_implemented') {
    return { status: 'blocked', reason: 'Adapter-Schritt noch nicht implementiert – braucht Eingriff.' };
  }

  // 'failed' oder 'partial'
  const kind = input.failureKind ?? 'transient';
  if (kind === 'blocked') {
    return { status: 'blocked', reason: 'Blockiert – braucht Klärung (Daten/Zugangsdaten/Variante).' };
  }
  if (kind === 'permanent') {
    return { status: 'failed', reason: 'Dauerhafter Fehler.' };
  }
  // transient
  if (input.attemptCount < maxAttempts) {
    const retryDelayMs = backoffMs(input.attemptCount);
    return {
      status: 'queued',
      retryDelayMs,
      reason: `Vorübergehender Fehler – Retry ${input.attemptCount + 1}/${maxAttempts} in ${Math.round(retryDelayMs / 1000)}s.`,
    };
  }
  return { status: 'failed', reason: `Vorübergehender Fehler – Versuche erschöpft (${maxAttempts}).` };
}
