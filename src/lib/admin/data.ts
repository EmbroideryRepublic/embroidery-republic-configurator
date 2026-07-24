/**
 * Datenlade-Funktionen des Admin-Bereichs (NUR serverseitig verwenden –
 * nutzt den Supabase-Admin-Client, der RLS umgeht).
 *
 * Bewusst von den Server Actions (actions/admin.ts) getrennt: diese
 * Funktionen sind reine Leser für Server Components, die Actions sind
 * die einzigen Schreiber.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber, type OrderPaymentMethod } from '@/lib/actions/orderTypes';
import { buildSupplierPositions } from '@/lib/suppliers';
import { bearbeitungsGrenze, imAdminSichtbar, BEARBEITBARE_ZAHLUNGSZUSTAENDE } from '@/lib/orders/orderVisibility';
import { enqueueSupplierOrdersForOrder } from '@/lib/suppliers/lifecycle/enqueue';
import { getProductionFileSignedUrl } from '@/lib/supabase/storage';
import type { SupplierOrderDraft, SupplierWorkerRunResult } from '@/lib/suppliers';

export interface AdminOrderListRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderType: 'inquiry' | 'order';
  customerName: string;
  company: string | null;
  email: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
}

export interface AdminOrderItemRow {
  productId: string;
  productName: string;
  colorId: string;
  colorName: string;
  printMethod: string | null;
  sizeQuantities: Record<string, number>;
  unitPrice: number;
  quantity: number;
}

export interface AdminSupplierOrderRow {
  supplierId: string;
  status: string;
  mode: string;
  updatedAt: string;
  lastRun: SupplierWorkerRunResult | null;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderType: 'inquiry' | 'order';
  status: string;
  paymentStatus: string;
  /** Gewählte Zahlungsart. null bei Anfragen und bei Bestellungen, die vor
   *  Migration 0012 ohne diese Angabe erfasst wurden. */
  paymentMethod: OrderPaymentMethod | null;
  customerName: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  totalPrice: number;
  shipping: { street: string; zip: string; city: string; country: string } | null;
  items: AdminOrderItemRow[];
  /** Live berechnete Lieferanten-Vorschau (unabhängig davon, ob schon ein
   *  supplier_orders-Snapshot existiert) – zeigt dem Admin VOR dem Klick,
   *  was die Automatisierung tun würde, inkl. unresolved-Produkten. */
  supplierDraft: SupplierOrderDraft;
  /** Zeitlich befristete Download-URL des Produktionsblatts (null, solange
   *  keines erzeugt wurde). Wird beim Seitenaufbau frisch signiert. */
  productionSheetUrl: string | null;
  /** Sendungsnummer, sofern beim Versand erfasst. */
  trackingNumber: string | null;
  shippedAt: string | null;
  /** Persistierte Automatisierungs-Snapshots inkl. letztem Lauf. */
  supplierOrders: AdminSupplierOrderRow[];
}

export interface AdminSupplierPipelineEvent {
  at: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
}

export interface AdminSupplierPipelineRow {
  orderId: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  mode: string;
  attemptCount: number;
  maxAttempts: number;
  lockedAt: string | null;
  nextAttemptAt: string | null;
  lastError: string | null;
  updatedAt: string;
  lastRun: SupplierWorkerRunResult | null;
  events: AdminSupplierPipelineEvent[];
}

/**
 * Vollständige Monitoring-Sicht des Lieferantenprozesses: jede (Bestellung ×
 * Lieferant) mit Status/Versuchen/nächstem Versuch/letztem Fehler und dem
 * jüngsten Audit-Verlauf. Events werden gebündelt geladen (kein N+1) und je
 * (order_id, supplier_id) zugeordnet.
 */
export async function listSupplierOrderPipeline(): Promise<AdminSupplierPipelineRow[]> {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from('supplier_orders')
    .select(
      'order_id, supplier_id, status, mode, attempt_count, max_attempts, locked_at, next_attempt_at, last_error, updated_at, last_run'
    )
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error || !rows) {
    console.error('[admin] supplier_orders-Pipeline konnte nicht geladen werden:', error);
    return [];
  }

  const orderIds = [...new Set(rows.map((r) => r.order_id as string))];
  const eventsByKey = new Map<string, AdminSupplierPipelineEvent[]>();
  if (orderIds.length > 0) {
    const { data: events } = await supabase
      .from('supplier_order_events')
      .select('order_id, supplier_id, at, event_type, from_status, to_status, reason')
      .in('order_id', orderIds)
      .order('at', { ascending: false })
      .limit(500);
    for (const ev of events ?? []) {
      const key = `${ev.order_id}:${ev.supplier_id}`;
      const list = eventsByKey.get(key) ?? [];
      if (list.length < 8) {
        list.push({
          at: ev.at as string,
          eventType: ev.event_type as string,
          fromStatus: (ev.from_status as string | null) ?? null,
          toStatus: (ev.to_status as string | null) ?? null,
          reason: (ev.reason as string | null) ?? null,
        });
      }
      eventsByKey.set(key, list);
    }
  }

  return rows.map((row) => {
    const orderId = row.order_id as string;
    const supplierId = row.supplier_id as string;
    return {
      orderId,
      orderNumber: buildOrderNumber(orderId),
      supplierId,
      status: row.status as string,
      mode: row.mode as string,
      attemptCount: Number(row.attempt_count ?? 0),
      maxAttempts: Number(row.max_attempts ?? 3),
      lockedAt: (row.locked_at as string | null) ?? null,
      nextAttemptAt: (row.next_attempt_at as string | null) ?? null,
      lastError: (row.last_error as string | null) ?? null,
      updatedAt: row.updated_at as string,
      lastRun: (row.last_run as SupplierWorkerRunResult | null) ?? null,
      events: eventsByKey.get(`${orderId}:${supplierId}`) ?? [],
    };
  });
}

export async function listOrders(): Promise<AdminOrderListRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, order_type, customer_name, company, email, total_price, status, payment_status')
    // Sichtbarkeitsregel (lib/orders/orderVisibility): stornierte Bestellungen
    // nie; echte Bestellungen erst nach Ablauf der Stornofrist; Anfragen sofort.
    // Bereits in der Datenbank gefiltert statt nachträglich zu verwerfen.
    .neq('status', 'cancelled')
    .or(`order_type.neq.order,created_at.lte.${bearbeitungsGrenze()}`)
    // Ausstehende Zahlungen gehören nicht in die Bearbeitungsliste – sonst
    // würde Ware für einen abgebrochenen Bezahlvorgang beschafft. Dieselbe
    // Regel wie in imAdminSichtbar; die Zustände kommen von dort, damit sie
    // nicht an zwei Stellen gepflegt werden müssen.
    .in('payment_status', [...BEARBEITBARE_ZAHLUNGSZUSTAENDE])
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error('[admin] Bestellliste konnte nicht geladen werden:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    orderNumber: buildOrderNumber(row.id as string),
    createdAt: row.created_at as string,
    orderType: row.order_type as 'inquiry' | 'order',
    customerName: row.customer_name as string,
    company: (row.company as string | null) ?? null,
    email: row.email as string,
    totalPrice: Number(row.total_price ?? 0),
    status: row.status as string,
    paymentStatus: (row.payment_status as string) ?? 'not_required',
  }));
}

export async function getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, created_at, order_type, status, payment_status, payment_method, customer_name, company, email, phone, message, total_price, shipping_street, shipping_zip, shipping_city, shipping_country, pdf_url, tracking_number, shipped_at'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('[admin] Bestellung nicht gefunden:', orderId, orderError);
    return null;
  }

  // Dieselbe Sichtbarkeitsregel wie in der Liste. Ohne diese Prüfung wäre
  // eine noch stornierbare oder stornierte Bestellung über die direkte URL
  // erreichbar, obwohl sie in der Liste fehlt.
  if (
    !imAdminSichtbar({
      createdAt: order.created_at as string,
      status: order.status as string,
      orderType: order.order_type as string,
      paymentStatus: (order.payment_status as string) ?? 'not_required',
    })
  ) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, product_name, color_id, color_name, print_method, size_quantities, unit_price, quantity')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('[admin] order_items konnten nicht geladen werden:', itemsError);
  }

  const { data: supplierRows, error: supplierError } = await supabase
    .from('supplier_orders')
    .select('supplier_id, status, mode, updated_at, last_run')
    .eq('order_id', orderId);

  if (supplierError) {
    // Nicht fatal: Tabelle existiert erst ab Migration 0005 – der Rest der
    // Detailseite soll trotzdem funktionieren.
    console.error('[admin] supplier_orders konnten nicht geladen werden:', supplierError);
  }

  const itemRows: AdminOrderItemRow[] = (items ?? []).map((row) => ({
    productId: row.product_id as string,
    productName: row.product_name as string,
    colorId: row.color_id as string,
    colorName: row.color_name as string,
    printMethod: (row.print_method as string | null) ?? null,
    sizeQuantities: (row.size_quantities ?? {}) as Record<string, number>,
    unitPrice: Number(row.unit_price ?? 0),
    quantity: Number(row.quantity ?? 0),
  }));

  // Lieferantenauftrag bedarfsgerecht anlegen: Der Aufruf ist idempotent
  // (bestehende Snapshots werden nicht überschrieben) und erfolgt frühestens
  // hier – also nach Ablauf der Stornofrist, weil die Detailseite vorher gar
  // nicht ausgeliefert wird. Für stornierte Bestellungen entsteht damit nie
  // ein Auftrag. Nicht-fatal: die Detailseite muss auch ohne funktionieren.
  if ((order.order_type as string) === 'order') {
    try {
      await enqueueSupplierOrdersForOrder(orderId);
    } catch (err) {
      console.error('[admin] Lieferanten-Einreihung fehlgeschlagen (nicht-fatal):', err);
    }
  }

  const supplierDraft = buildSupplierPositions(
    orderId,
    itemRows.map((item) => ({
      productId: item.productId,
      colorId: item.colorId,
      sizeQuantities: item.sizeQuantities,
    }))
  );

  return {
    id: order.id as string,
    orderNumber: buildOrderNumber(order.id as string),
    createdAt: order.created_at as string,
    orderType: order.order_type as 'inquiry' | 'order',
    status: order.status as string,
    paymentStatus: (order.payment_status as string) ?? 'not_required',
    paymentMethod: (order.payment_method as OrderPaymentMethod | null) ?? null,
    customerName: order.customer_name as string,
    company: (order.company as string | null) ?? null,
    email: order.email as string,
    phone: (order.phone as string | null) ?? null,
    message: (order.message as string | null) ?? null,
    totalPrice: Number(order.total_price ?? 0),
    shipping: order.shipping_street
      ? {
          street: order.shipping_street as string,
          zip: (order.shipping_zip as string) ?? '',
          city: (order.shipping_city as string) ?? '',
          country: (order.shipping_country as string) ?? '',
        }
      : null,
    items: itemRows,
    supplierDraft,
    productionSheetUrl: order.pdf_url ? await getProductionFileSignedUrl(order.pdf_url as string) : null,
    trackingNumber: (order.tracking_number as string | null) ?? null,
    shippedAt: (order.shipped_at as string | null) ?? null,
    supplierOrders: (supplierRows ?? []).map((row) => ({
      supplierId: row.supplier_id as string,
      status: row.status as string,
      mode: row.mode as string,
      updatedAt: row.updated_at as string,
      lastRun: (row.last_run as SupplierWorkerRunResult | null) ?? null,
    })),
  };
}
