/**
 * Service-Einstiegspunkt der Lieferanten-Automatisierung:
 * createSupplierOrder(orderId) lädt eine Bestellung, erzeugt die
 * Lieferantenpositionen und bereitet je Lieferant einen Automatisierungs-
 * Job für den Playwright-Worker vor.
 *
 * Aufrufkontext: NUR serverseitig (nutzt den Supabase-Admin-Client).
 * Der spätere Admin-Button "Beim Lieferanten bestellen" ruft diese
 * Funktion über eine Server Action / Route auf und reicht die
 * zurückgegebenen Jobs an runSupplierJob() (worker/supplierWorker.ts)
 * weiter – siehe Ablaufskizze unten.
 *
 *   Admin-UI ──▶ createSupplierOrder(orderId)
 *                  1. Bestellung + Positionen laden (Supabase)
 *                  2. buildSupplierPositions() → Draft (je Lieferant
 *                     gruppiert + "unresolved"-Liste für Produkte ohne
 *                     Bezugsquelle)
 *                  3. Draft in supplier_orders persistieren (Status
 *                     'draft', Migration 0005) – Audit-Trail & spätere
 *                     Statusverfolgung
 *                  4. SupplierAutomationJob[] zurückgeben
 *              ──▶ runSupplierJob(job)  [Playwright-Worker, eigene Phase]
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { buildSupplierPositions, type SupplierSourceItem } from './buildSupplierPositions';
import type { SupplierAutomationJob, SupplierId, SupplierJobMode, SupplierOrderDraft } from './types';

export interface CreateSupplierOrderResult {
  success: boolean;
  error?: string;
  draft?: SupplierOrderDraft;
  /** Ein Job je beteiligtem Lieferanten – Übergabeformat für den Worker. */
  jobs?: SupplierAutomationJob[];
}

export async function createSupplierOrder(
  orderId: string,
  options: { mode?: SupplierJobMode } = {}
): Promise<CreateSupplierOrderResult> {
  // Standard bewusst 'prepare-cart': der Worker füllt nur den Warenkorb,
  // der Admin prüft und schließt selbst ab. 'checkout' ist ein explizites
  // Opt-in für später.
  const mode: SupplierJobMode = options.mode ?? 'prepare-cart';

  const supabase = createAdminClient();

  // 1. Bestellung laden (Existenz-Check + Bestellnummer für Logs/Jobs).
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .select('id, created_at')
    .eq('id', orderId)
    .single();

  if (orderError || !orderRow) {
    console.error('[suppliers] Bestellung nicht gefunden:', orderId, orderError);
    return { success: false, error: `Bestellung ${orderId} wurde nicht gefunden.` };
  }

  // 2. Positionen laden – Spalten wie in Migration 0002 definiert
  //    (size_quantities als jsonb-Map Größe → Menge).
  const { data: itemRows, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, color_id, size_quantities')
    .eq('order_id', orderId);

  if (itemsError || !itemRows) {
    console.error('[suppliers] order_items konnten nicht geladen werden:', itemsError);
    return { success: false, error: 'Die Bestellpositionen konnten nicht geladen werden.' };
  }

  const sourceItems: SupplierSourceItem[] = itemRows.map((row) => ({
    productId: row.product_id as string,
    colorId: row.color_id as string,
    sizeQuantities: (row.size_quantities ?? {}) as Record<string, number>,
  }));

  // 3. Lieferantenpositionen bilden (rein, testbar – siehe
  //    buildSupplierPositions.ts).
  const draft = buildSupplierPositions(orderId, sourceItems);

  const orderNumber = buildOrderNumber(orderId);
  const jobs: SupplierAutomationJob[] = (
    Object.entries(draft.positionsBySupplier) as [SupplierId, NonNullable<SupplierOrderDraft['positionsBySupplier'][SupplierId]>][]
  ).map(([supplierId, positions]) => ({
    jobId: `${orderId}:${supplierId}`,
    orderId,
    orderNumber,
    supplierId,
    mode,
    positions,
  }));

  // 4. Snapshot je Lieferant persistieren – Audit-Trail und Grundlage der
  //    Statusanzeige. WICHTIG (Idempotenz): der Lebenszyklus-Status wird
  //    dabei NICHT überschrieben. Erneutes createSupplierOrder() aktualisiert
  //    nur den Positions-Snapshot; eine bereits laufende/abgeschlossene
  //    Bestellung fällt nicht auf 'draft' zurück (das hätte Doppel-
  //    bestellungen ermöglicht). Ein Fehler hier ist NICHT fatal.
  const nowIso = new Date().toISOString();
  for (const job of jobs) {
    // 4a. Zeile sicherstellen (nur einfügen, wenn sie noch nicht existiert –
    //     bestehende Zeile inkl. Status bleibt unverändert).
    const { error: ensureError } = await supabase.from('supplier_orders').upsert(
      {
        order_id: orderId,
        supplier_id: job.supplierId,
        status: 'draft',
        mode,
        positions: job.positions,
        unresolved: draft.unresolved,
      },
      { onConflict: 'order_id,supplier_id', ignoreDuplicates: true }
    );
    if (ensureError) {
      console.error('[suppliers] supplier_orders-Insert fehlgeschlagen:', ensureError);
      continue;
    }
    // 4b. Snapshot (Positionen/unresolved/mode) auffrischen, Status unberührt.
    const { error: refreshError } = await supabase
      .from('supplier_orders')
      .update({ positions: job.positions, unresolved: draft.unresolved, mode, updated_at: nowIso })
      .eq('order_id', orderId)
      .eq('supplier_id', job.supplierId);
    if (refreshError) {
      console.error('[suppliers] supplier_orders-Snapshot-Update fehlgeschlagen:', refreshError);
    }
  }

  return { success: true, draft, jobs };
}
