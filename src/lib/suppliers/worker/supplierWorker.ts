/**
 * Playwright-Worker der Supplier Engine – Ablauf-Orchestrierung.
 *
 * runSupplierJob() nimmt einen fertig vorbereiteten SupplierAutomationJob
 * (aus createSupplierOrder()) entgegen, wählt über die Registry den
 * passenden Lieferanten-Adapter und führt den festen Bestell-Ablauf aus:
 *
 *   login
 *   └─ je Position:  openProduct → selectColor → setQuantity (je Größe)
 *                     → addToCart
 *   └─ nur im Modus 'checkout':  checkout
 *
 * Der Worker kennt KEINE Shop-Details – die stecken ausschließlich in den
 * Adaptern. Er kennt auch KEIN Playwright direkt – die Browser-Sitzung
 * kommt aus browserSession.ts (dort ist der einzige Integrationspunkt).
 *
 * In der aktuellen Architektur-Phase sind Adapter und Browser-Sitzung
 * Stubs: jeder Schritt endet als 'not_implemented'. Der Worker läuft
 * dennoch vollständig durch und liefert das komplette Schrittprotokoll –
 * damit sind Job-Aufbau, Adapter-Auswahl und Ablauf-Reihenfolge schon
 * heute end-to-end testbar.
 */
import { createSupplierAdapter, getSupplierCredentials, getSupplierDescriptor } from '../registry';
import { resolveSupplierPosition, SupplierMappingError } from '../mapping';
import type { VariantSelectionResult } from '../adapters/selectionEngine';
import {
  NotImplementedError,
  type SupplierAutomationContext,
  type SupplierAutomationJob,
  type SupplierRunPositionSummary,
  type SupplierWorkerRunResult,
  type SupplierWorkerStepResult,
} from '../types';
import { createBrowserSession, type BrowserSession } from './browserSession';

/** Optionale Abhängigkeiten – erlauben Tests, eine kontrollierte
 *  Browser-Sitzung zu injizieren, ohne die produktive Signatur zu ändern
 *  (Default: echtes Chromium via createBrowserSession). */
export interface SupplierWorkerDeps {
  createSession?: () => Promise<BrowserSession>;
  /** Nur für Tests: überschreibt die Shop-Basis-URL (Login-Startseite), damit
   *  der E2E-Dry-Run gegen lokale Fixtures statt der echten Shop-Seite läuft.
   *  Produktiv immer aus der Registry (getSupplierDescriptor). */
  baseUrl?: string;
}

export async function runSupplierJob(
  job: SupplierAutomationJob,
  deps: SupplierWorkerDeps = {}
): Promise<SupplierWorkerRunResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const steps: SupplierWorkerStepResult[] = [];
  const positionSummaries: SupplierRunPositionSummary[] = [];
  const logs: string[] = [];
  const createSession = deps.createSession ?? createBrowserSession;

  const adapter = createSupplierAdapter(job.supplierId);

  // Fehlende Zugangsdaten sind ein KONFIGURATIONS-Fehler, kein Absturz:
  // der Lauf endet kontrolliert mit einem fehlgeschlagenen login-Schritt
  // und einer klaren Meldung (welche env-Variablen fehlen), statt die
  // aufrufende Server Action mit einer Exception zu beenden.
  /** Kontrollierter Abbruch VOR dem ersten Browser-Schritt (fehlende
   *  Zugangsdaten, Browser nicht startbar). Liefert dasselbe Audit-Format wie
   *  ein regulärer Lauf – ein abgebrochener Lauf darf im Audit keine Lücke
   *  hinterlassen. */
  function abortRun(error: unknown): SupplierWorkerRunResult {
    const now = Date.now();
    return {
      jobId: job.jobId,
      supplierId: job.supplierId,
      supplierName: getSupplierDescriptor(job.supplierId).label,
      mode: job.mode,
      startedAt,
      finishedAt: new Date(now).toISOString(),
      durationMs: now - startedAtMs,
      outcome: 'failed',
      positions: [],
      steps: [
        {
          step: 'login',
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          at: new Date(now).toISOString(),
          durationMs: now - startedAtMs,
        },
      ],
      logs,
    };
  }

  let credentials;
  try {
    credentials = getSupplierCredentials(job.supplierId);
  } catch (error) {
    return abortRun(error);
  }

  // Browser-Start ist ein Infrastruktur-Schritt: schlägt er fehl (Playwright
  // bzw. Chromium nicht installiert), endet der Lauf kontrolliert mit einem
  // fehlgeschlagenen login-Schritt statt einer Exception in der Server Action.
  let session;
  try {
    session = await createSession();
  } catch (error) {
    return abortRun(error);
  }

  const ctx: SupplierAutomationContext = {
    page: session.page,
    credentials,
    baseUrl: deps.baseUrl ?? getSupplierDescriptor(job.supplierId).baseUrl,
    log: (message) => logs.push(message),
  };

  /** Führt einen Schritt aus und übersetzt sein Ergebnis in einen
   *  Protokoll-Eintrag. NotImplementedError (Architektur-Stub) wird
   *  bewusst von echten Fehlern unterschieden. */
  async function runStep(
    step: SupplierWorkerStepResult['step'],
    fn: () => Promise<void | VariantSelectionResult>,
    detail: Pick<SupplierWorkerStepResult, 'positionIndex' | 'size' | 'quantity'> = {}
  ): Promise<boolean> {
    const stepStartedAt = Date.now();
    /** Zeitstempel + Dauer gehören an JEDEN Schritt – auch an die
     *  fehlgeschlagenen, denn genau dort ist die Frage „wie lange hing das?"
     *  am wichtigsten. */
    const timing = () => ({ at: new Date().toISOString(), durationMs: Date.now() - stepStartedAt });
    try {
      const result = await fn();
      // Hat der Schritt eine Variante ausgewählt, wird die tatsächlich
      // genutzte Selektionsmethode fürs Protokoll übernommen.
      const selection =
        result && typeof result === 'object' && 'strategy' in result
          ? { strategy: result.strategy, value: result.value }
          : undefined;
      steps.push({ step, ...detail, status: 'ok', ...timing(), ...(selection ? { selection } : {}) });
      return true;
    } catch (error) {
      if (error instanceof NotImplementedError) {
        steps.push({ step, ...detail, status: 'not_implemented', error: error.message, ...timing() });
      } else {
        steps.push({
          step,
          ...detail,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          ...timing(),
        });
      }
      return false;
    }
  }

  try {
    await runStep('login', () => adapter.login(ctx));

    for (const [positionIndex, position] of job.positions.entries()) {
      // Übersetzung in die Lieferantenbezeichnung passiert BEWUSST erst
      // hier, unmittelbar vor der Browser-Automatisierung. Existiert eine
      // Farbe/Größe beim Lieferanten nicht, wird die Position mit klarem
      // Fehler protokolliert und NICHT bestellt (kein openProduct/addToCart).
      const resolveStartedAt = Date.now();
      let resolved;
      try {
        resolved = resolveSupplierPosition(position);
      } catch (error) {
        if (error instanceof SupplierMappingError) {
          steps.push({
            step: 'resolveVariants',
            positionIndex,
            status: 'failed',
            error: error.message,
            at: new Date().toISOString(),
            durationMs: Date.now() - resolveStartedAt,
          });
          continue;
        }
        throw error;
      }
      steps.push({
        step: 'resolveVariants',
        positionIndex,
        status: 'ok',
        at: new Date().toISOString(),
        durationMs: Date.now() - resolveStartedAt,
      });

      // Schnappschuss dessen, was für diese Position beim Lieferanten
      // hinterlegt wird – VOR den Browser-Schritten festgehalten, damit die
      // vollständige Größenverteilung auch dann im Audit steht, wenn ein
      // einzelner Schritt später scheitert.
      positionSummaries.push({
        positionIndex,
        productId: position.productId,
        productName: position.productName,
        articleNumber: resolved.articleNumber,
        ...(position.productUrl ? { productUrl: position.productUrl } : {}),
        colorId: position.colorId,
        colorName: position.colorName,
        supplierColor: resolved.supplierColor,
        ...(resolved.colorVariant.variantId ? { colorVariantId: resolved.colorVariant.variantId } : {}),
        sizes: resolved.sizes.map(({ size, supplierSize, quantity }) => {
          const variantId = resolved.sizeVariants[size]?.variantId;
          return { size, supplierSize, ...(variantId ? { supplierSizeVariantId: variantId } : {}), quantity };
        }),
        totalQuantity: resolved.sizes.reduce((sum, s) => sum + s.quantity, 0),
      });

      // Effektive Position trägt die finale (ggf. lieferantenspezifische)
      // Artikelnummer – alle anderen Felder bleiben unverändert.
      const effectivePosition = { ...position, articleNumber: resolved.articleNumber };

      await runStep('openProduct', () => adapter.openProduct(ctx, effectivePosition), { positionIndex });
      await runStep('selectColor', () => adapter.selectColor(ctx, effectivePosition, resolved.colorVariant), {
        positionIndex,
      });
      for (const { size, supplierSize, quantity } of resolved.sizes) {
        // Vollständige Größen-Variante (Label + etwaige stabile IDs); der
        // Adapter bevorzugt die stabilste Kennung. Fallback auf das reine
        // Label-Deskriptor kann nach erfolgreicher Auflösung nicht eintreten.
        const sizeVariant = resolved.sizeVariants[size] ?? { label: supplierSize };
        await runStep('setQuantity', () => adapter.setQuantity(ctx, size, quantity, sizeVariant), {
          positionIndex,
          size,
          quantity,
        });
      }
      await runStep('addToCart', () => adapter.addToCart(ctx), { positionIndex });
    }

    // Erst dieser Schritt macht aus „geklickt" ein „liegt im Warenkorb":
    // manche Shops übernehmen den Warenkorb erst beim nächsten Seitenaufruf
    // dauerhaft ins Konto. Ohne ihn meldete der Lauf Erfolg, während der
    // Inhalt mit der Browser-Sitzung verfiel (real bei textil-grosshandel).
    // Läuft nur, wenn überhaupt etwas in den Warenkorb gelegt wurde.
    if (steps.some((s) => s.step === 'addToCart' && s.status === 'ok')) {
      await runStep('confirmCart', () => adapter.confirmCart(ctx));
    }

    if (job.mode === 'checkout') {
      await runStep('checkout', () => adapter.checkout(ctx));
    }
  } finally {
    await session.dispose();
  }

  return {
    jobId: job.jobId,
    supplierId: job.supplierId,
    supplierName: getSupplierDescriptor(job.supplierId).label,
    mode: job.mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAtMs,
    outcome: deriveOutcome(steps),
    positions: positionSummaries,
    steps,
    logs,
  };
}

/**
 * Leitet das Gesamt-Ergebnis aus den Einzelschritten ab:
 *  - alle ok            → 'prepared'
 *  - ein echter Fehler  → 'failed' (nichts gelang) bzw. 'partial' (teils ok)
 *  - sonst nur Stubs    → 'not_implemented'
 *  - Rest               → 'partial'
 */
function deriveOutcome(steps: SupplierWorkerStepResult[]): SupplierWorkerRunResult['outcome'] {
  if (steps.every((s) => s.status === 'ok')) return 'prepared';
  const hasOk = steps.some((s) => s.status === 'ok');
  if (steps.some((s) => s.status === 'failed')) return hasOk ? 'partial' : 'failed';
  if (steps.some((s) => s.status === 'not_implemented')) return 'not_implemented';
  return 'partial';
}
