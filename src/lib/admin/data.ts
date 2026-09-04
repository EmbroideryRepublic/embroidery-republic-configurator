/**
 * Datenlade-Funktionen des Admin-Bereichs (NUR serverseitig verwenden –
 * nutzt den Supabase-Admin-Client, der RLS umgeht).
 *
 * Bewusst von den Server Actions (actions/admin.ts) getrennt: diese
 * Funktionen sind reine Leser für Server Components, die Actions sind
 * die einzigen Schreiber.
 */
import nodePath from 'node:path';
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber, type OrderPaymentMethod, type RefundStatus } from '@/lib/actions/orderTypes';
import { buildSupplierPositions } from '@/lib/suppliers';
import { berechneAdminStatus, produktionsfreigabeErlaubt, type AdminStatus } from '@/lib/orders/orderVisibility';
import { enqueueSupplierOrdersForOrder } from '@/lib/suppliers/lifecycle/enqueue';
import { getProductionFileSignedUrl, listProductionFileInfo } from '@/lib/supabase/storage';
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
  /** null = nie eine Rechnung erstellt – Voraussetzung für die echte
   *  Löschung einer stornierten Bestellung, siehe DeleteOrderButton.tsx. */
  invoiceNumber: string | null;
  /** Einordnung für Farbe/Badge in der Liste – siehe lib/orders/orderVisibility.ts.
   *  Entscheidet NIE, ob die Zeile erscheint, nur wie sie beschriftet ist. */
  adminStatus: AdminStatus;
  /** true, wenn für diese Bestellung ein ungelöster Fehlschlag vorliegt
   *  (Versandlabel, Bestellbestätigung oder Rechnung – dieselben Kategorien
   *  wie lastShippingError/lastConfirmationEmailError/lastInvoiceError auf
   *  der Detailseite, siehe getOrderDetail()). Fund vom 2026-08-26
   *  (Produktionsreife-Audit, admin_workflow_ux): genau diese Fälle waren
   *  bisher in der Liste unsichtbar, bevor man die Bestellung öffnete. */
  brauchtAufmerksamkeit: boolean;
}

/**
 * Ein platziertes Personalisierungselement (Logo/Text) für die
 * Produktionsvorschau – aus `configuration_elements` gelesen, keine eigene
 * Datenhaltung. Feldnamen bewusst analog zu `OrderElementRecord`
 * (lib/actions/orderTypes.ts), das dieselbe Zeile fürs Rendering nutzt.
 */
export interface AdminOrderElementRow {
  type: 'logo' | 'text';
  view: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotationDeg: number;
  // Text-spezifisch
  content?: string;
  fontFamily?: string;
  fontSizePx?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: string;
  // Logo-spezifisch
  fileName?: string;
  /** Signierte URL der tatsächlich verwendeten (ggf. freigestellten) Logo-
   *  Datei – dieselbe, die das Rendering nutzt. null, wenn keine Datei
   *  hinterlegt ist oder die Signed-URL nicht erzeugt werden konnte. */
  logoPreviewUrl: string | null;
  /** Basisname der ORIGINAL-Datei (vor evtl. Hintergrundentfernung) unter
   *  orders/<id>/ im Storage – Grundlage für den Admin-Download-Link
   *  (components/admin/KundendateienPanel.tsx). null bei Text-Elementen oder
   *  wenn diese Bestellung keinen getrennten Original-Pfad kennt (vor
   *  Migration 0003_element_render_fidelity). */
  originalStorageKey: string | null;
  /** Dateigröße der ORIGINAL-Datei in Bytes – aus einem einzigen Listing-
   *  Aufruf je Bestellung (listProductionFileInfo), kein Download nötig.
   *  null, wenn die Datei im Storage nicht gefunden wurde. */
  fileSizeBytes: number | null;
  /** MIME-Typ der ORIGINAL-Datei, sofern vom Storage geliefert (im
   *  Testmodus immer null – die lokale Testablage kennt keine MIME-Typen). */
  fileMimeType: string | null;
  /** true, wenn die ORIGINAL-Datei tatsächlich im Storage gefunden wurde.
   *  false bedeutet: die Datenbank kennt einen Pfad, die Datei fehlt aber
   *  (z.B. DSGVO-Altdatei-Löschung, scripts/dsgvoAltdateien.mts, oder eine
   *  sehr alte Testbestellung) – die Oberfläche zeigt dann "Datei nicht mehr
   *  vorhanden" statt eines kaputten Downloads. Bei Text-Elementen immer
   *  false (nicht zutreffend, keine Datei).
   */
  originalDateiVorhanden: boolean;
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
  /** Platzierte Logos/Texte dieser Position, aus configuration_elements. */
  elements: AdminOrderElementRow[];
  /** Signierte URLs der bereits in Phase 2 gerenderten Druckvorschauen
   *  (Kleidungsstück + Motive exakt wie im Editor platziert, siehe
   *  lib/rendering/renderPrintView.ts) – EINE Datei je Ansicht mit
   *  mindestens einem Element. Kein neues Rendering: Diese PNGs liegen
   *  bereits im Storage, sobald Phase 2 einmal erfolgreich lief (siehe
   *  orderCompletion.ts::erzeugeDruckvorschauen). Fehlender Eintrag = für
   *  diese Ansicht (noch) keine Vorschau vorhanden (Rendering nicht-fatal
   *  fehlgeschlagen, oder Phase 2 lief noch nicht – z.B. Zahlung offen). */
  previewUrlByView: Partial<Record<string, string>>;
}

/** Ein Eintrag der Bestell-Historie (order_events), ungefiltert – Grundlage
 *  für BestellVerlauf.tsx. `detail` ist absichtlich das rohe jsonb-Feld: die
 *  Zeitleiste zeigt nur ausgewählte, für Menschen relevante Schlüssel daraus
 *  (siehe dort), statt ein zweites, striktes Detail-Schema zu pflegen. */
export interface AdminOrderEvent {
  at: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  detail: Record<string, unknown> | null;
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
  /** Netto-/Steuer-Aufschlüsselung – nur gesetzt, wenn zum Bestellzeitpunkt
   *  bereits gespeichert (Migration 0014, ab 2026-07-22). Ältere Bestellungen
   *  liefern hier `null`. */
  taxAmount: number | null;
  taxRate: number | null;
  netTotal: number | null;
  shipping: { street: string; zip: string; city: string; country: string } | null;
  items: AdminOrderItemRow[];
  /** Vollständige, ungefilterte Bestell-Historie, neueste zuerst – siehe
   *  BestellVerlauf.tsx. Enthält automatisch auch die neuen proof_requested/
   *  proof_approved/proof_change_requested-Ereignisse aus der Kundenfreigabe. */
  events: AdminOrderEvent[];
  /** Live berechnete Lieferanten-Vorschau (unabhängig davon, ob schon ein
   *  supplier_orders-Snapshot existiert) – zeigt dem Admin VOR dem Klick,
   *  was die Automatisierung tun würde, inkl. unresolved-Produkten. */
  supplierDraft: SupplierOrderDraft;
  /** Zeitlich befristete Download-URL des Produktionsblatts (null, solange
   *  keines erzeugt wurde). Wird beim Seitenaufbau frisch signiert. */
  productionSheetUrl: string | null;
  /** Sendungsnummer – seit der DHL-Anbindung von dort vorbefüllt, davor
   *  manuelle Admin-Eingabe. Beide Wege schreiben dasselbe Feld. */
  trackingNumber: string | null;
  shippedAt: string | null;
  /** Von Lexware vergebene Rechnungsnummer (null, solange keine Rechnung
   *  erzeugt wurde). */
  invoiceNumber: string | null;
  /** Zeitlich befristete Download-URL der Lexware-Rechnung. */
  invoicePdfUrl: string | null;
  /** Zeitlich befristete Download-URL des DHL-Versandlabels. */
  dhlLabelUrl: string | null;
  /** Grund des letzten gescheiterten Label-Versuchs (order_events,
   *  event_type shipping_label_failed/shipping_label_partial_failure) – die
   *  tatsächliche, bereits von shippingService.ts geloggte Fehlermeldung
   *  (DHL-Antwort bzw. technischer Fehler), NICHT die generische Meldung, die
   *  im Fehlerfall an den Admin-Client zurückgegeben wird. null, solange noch
   *  kein Versuch fehlgeschlagen ist oder der letzte Versuch erfolgreich war
   *  (dhlLabelUrl/trackingNumber dann bereits gesetzt). Enthält keine
   *  Zugangsdaten – DHL meldet bei ungültigen Credentials nur eine
   *  Fehlerbeschreibung, nie die Werte selbst. */
  lastShippingError: string | null;
  /** Zeitpunkt, an dem die Bestellbestätigung erfolgreich zugestellt wurde
   *  (order_confirmation_sent_at) – null, solange noch keine zugestellt ist
   *  (entweder wartet der claim-geschützte Versand noch, oder er ist
   *  fehlgeschlagen, siehe lastConfirmationEmailError). */
  orderConfirmationSentAt: string | null;
  /** Grund des letzten gescheiterten Bestellbestätigungs-Versands
   *  (order_events, event_type email_failed, detail.anlass=order_confirmation)
   *  – nach demselben Muster wie lastShippingError. null, solange die
   *  Bestätigung noch nie fehlschlug ODER bereits zugestellt ist
   *  (orderConfirmationSentAt dann gesetzt). */
  lastConfirmationEmailError: string | null;
  /** Grund des letzten Rechnungs-Fehlschlags (order_events, event_type
   *  invoice_creation_failed/invoice_creation_partial_failure/
   *  invoice_accounting_marking_failed) – bleibt auch dann relevant, wenn
   *  invoiceNumber inzwischen gesetzt ist (z.B. Buchhaltungs-Markierung
   *  scheiterte NACH erfolgreicher Rechnungserstellung). Unterscheidet
   *  "wartet normal auf Zahlung" (invoiceNumber null, lastInvoiceError null)
   *  von "Erstellung ist echt fehlgeschlagen" (lastInvoiceError gesetzt). */
  lastInvoiceError: string | null;
  /** Zeitpunkt, an dem der Betreiber die Druckvorschau zur Kundenfreigabe
   *  verschickt hat (orders.freigabe_angefragt_am). null = noch nicht
   *  angefragt – siehe naechsteAktion.ts und RequestProofApprovalButton.tsx. */
  freigabeAngefragtAm: string | null;
  /** Zeitpunkt der Kundenfreigabe (orders.freigabe_erteilt_am). Zusätzliche,
   *  von adminStatus unabhängige Bedingung für den Übergang new→in_production
   *  – siehe orderService.ts::setzeBestellstatus. */
  freigabeErteiltAm: string | null;
  /** Persistierte Automatisierungs-Snapshots inkl. letztem Lauf. */
  supplierOrders: AdminSupplierOrderRow[];
  /** 'customer' oder 'admin', null bei einer nicht stornierten Bestellung –
   *  siehe orderService.ts (storniereBestellungDurchKunden/setzeBestellstatus). */
  cancellationSource: string | null;
  /** Rückerstattungszustand – siehe supabase/migrations/0029_rueckerstattung.sql
   *  und RefundControl.tsx. 'not_applicable' bei Rechnungskauf oder wenn nie
   *  bezahlt wurde. */
  refundStatus: RefundStatus;
  refundAmountCent: number | null;
  refundReference: string | null;
  refundedAt: string | null;
  /** Einordnung für Farbe/Badge auf der Detailseite – siehe
   *  lib/orders/orderVisibility.ts. Entscheidet NICHT mehr darüber, ob die
   *  Seite ausgeliefert wird (das war bis 2026-08-25 derselbe Wert). */
  adminStatus: AdminStatus;
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

  // Gebündelt statt je Zeile (kein N+1) – derselbe orderIds-Batch wie beim
  // events-Query gleich darunter. Siehe Migration 0036 (Bestellnummer-
  // Jahreswechsel-Fix): buildOrderNumber(orderId) bleibt nur Rückfall.
  const orderNumberById = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data: numberRows } = await supabase.from('orders').select('id, order_number').in('id', orderIds);
    for (const r of numberRows ?? []) {
      if (r.order_number) orderNumberById.set(r.id as string, r.order_number as string);
    }
  }

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
      orderNumber: orderNumberById.get(orderId) ?? buildOrderNumber(orderId),
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

/**
 * Statusfilter für die Bestellliste (Fund vom 2026-09-01: bei vielen
 * Testbestellungen ging die Übersicht über tatsächlich handlungsbedürftige
 * Bestellungen verloren). `aktiv` ist bewusst der Vorgabewert überall, wo
 * dieser Typ verwendet wird – siehe admin/page.tsx.
 */
export type BestellungsListenFilter = 'aktiv' | 'abgeschlossen' | 'storniert' | 'alle';

const AKTIVE_STATUS = ['new', 'in_production', 'shipped'] as const;

export interface ListOrdersOptions {
  /** Volltextsuche über Bestellnummer, Name und E-Mail (siehe Anmerkung unten). */
  suche?: string;
  /** 0-basiert. */
  seite?: number;
  jeSeite?: number;
  /** Vorgabe 'aktiv' (new/in_production/shipped) – siehe BestellungsListenFilter. */
  filter?: BestellungsListenFilter;
}

export interface ListOrdersErgebnis {
  zeilen: AdminOrderListRow[];
  gesamt: number;
}

/**
 * Bestellliste mit serverseitiger Suche und Pagination (M1,
 * docs/audit-produktionsreife.md: bislang `.limit(200)` ohne Suche/Blättern
 * – bei 10.000 Bestellungen wären 9.800 unerreichbar gewesen).
 *
 * Die Suche läuft über `.or()` mit `ilike` auf Name/E-Mail/Firma sowie
 * (seit Migration 0036, order_number als persistierte Spalte) zusätzlich auf
 * Bestell-, Rechnungs- und Sendungsnummer – der Kundenservice kann damit
 * anhand jeder am Telefon genannten Nummer sofort finden, statt zu scrollen.
 */
export async function listOrders(optionen: ListOrdersOptions = {}): Promise<ListOrdersErgebnis> {
  const supabase = createAdminClient();
  const seite = Math.max(0, optionen.seite ?? 0);
  const jeSeite = Math.min(200, Math.max(1, optionen.jeSeite ?? 50));
  const von = seite * jeSeite;
  const bis = von + jeSeite - 1;

  // Bewusst KEIN Sichtbarkeitsfilter mehr (Entscheidung 2026-08-25): Jede
  // Bestellung erscheint sofort nach Anlage. Was mit ihr passieren darf
  // (Stornofrist, Zahlung, Produktion), zeigt stattdessen `adminStatus` je
  // Zeile – siehe berechneAdminStatus() in lib/orders/orderVisibility.ts.
  let query = supabase
    .from('orders')
    .select(
      'id, created_at, order_type, customer_name, company, email, total_price, status, payment_status, refund_status, tracking_number, order_confirmation_sent_at, invoice_number, order_number',
      { count: 'exact' }
    );

  const suche = optionen.suche?.trim();
  if (suche) {
    const jokerErlaubt = suche.replace(/[%_]/g, '');
    query = query.or(
      `customer_name.ilike.%${jokerErlaubt}%,email.ilike.%${jokerErlaubt}%,company.ilike.%${jokerErlaubt}%,` +
        `order_number.ilike.%${jokerErlaubt}%,invoice_number.ilike.%${jokerErlaubt}%,tracking_number.ilike.%${jokerErlaubt}%`
    );
  }

  const filter = optionen.filter ?? 'aktiv';
  if (filter === 'aktiv') query = query.in('status', AKTIVE_STATUS);
  else if (filter === 'abgeschlossen') query = query.eq('status', 'completed');
  else if (filter === 'storniert') query = query.eq('status', 'cancelled');
  // 'alle': kein zusätzlicher Filter.

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(von, bis);

  if (error || !data) {
    console.error('[admin] Bestellliste konnte nicht geladen werden:', error);
    return { zeilen: [], gesamt: 0 };
  }

  // "Braucht Aufmerksamkeit"-Signal (Fund vom 2026-08-26, admin_workflow_ux-
  // Audit): dieselben drei Fehlerkategorien wie auf der Detailseite
  // (getOrderDetail(), oben), aber EIN gemeinsamer Query über alle
  // Bestellungen dieser Seite statt eines pro Zeile – bleibt damit unabhängig
  // von der Seitengröße bei genau einem zusätzlichen Roundtrip.
  const bestellIds = data
    .filter((row) => (row.order_type as string) === 'order')
    .map((row) => row.id as string);

  const problemOrderIds = new Set<string>();
  if (bestellIds.length > 0) {
    const { data: problemEvents } = await supabase
      .from('order_events')
      .select('order_id, event_type, detail')
      .in('order_id', bestellIds)
      .in('event_type', [
        'shipping_label_failed',
        'shipping_label_partial_failure',
        'email_failed',
        'invoice_creation_failed',
        'invoice_creation_partial_failure',
        'invoice_accounting_marking_failed',
      ]);

    const trackingByOrder = new Map(data.map((row) => [row.id as string, row.tracking_number as string | null]));
    const bestaetigungByOrder = new Map(
      data.map((row) => [row.id as string, row.order_confirmation_sent_at as string | null])
    );

    for (const ev of problemEvents ?? []) {
      const orderId = ev.order_id as string;
      const eventType = ev.event_type as string;
      if (
        (eventType === 'shipping_label_failed' || eventType === 'shipping_label_partial_failure') &&
        !trackingByOrder.get(orderId)
      ) {
        problemOrderIds.add(orderId);
      } else if (
        eventType === 'email_failed' &&
        (ev.detail as Record<string, unknown> | null)?.anlass === 'order_confirmation' &&
        !bestaetigungByOrder.get(orderId)
      ) {
        problemOrderIds.add(orderId);
      } else if (
        eventType === 'invoice_creation_failed' ||
        eventType === 'invoice_creation_partial_failure' ||
        eventType === 'invoice_accounting_marking_failed'
      ) {
        problemOrderIds.add(orderId);
      }
    }
  }

  const zeilen = data.map((row) => {
    const createdAt = row.created_at as string;
    const status = row.status as string;
    const orderType = row.order_type as 'inquiry' | 'order';
    const paymentStatus = (row.payment_status as string) ?? 'not_required';
    const refundStatus = (row.refund_status as string) ?? 'not_applicable';
    return {
      id: row.id as string,
      orderNumber: (row.order_number as string | null) ?? buildOrderNumber(row.id as string),
      createdAt,
      orderType,
      customerName: row.customer_name as string,
      company: (row.company as string | null) ?? null,
      email: row.email as string,
      totalPrice: Number(row.total_price ?? 0),
      status,
      paymentStatus,
      invoiceNumber: (row.invoice_number as string | null) ?? null,
      adminStatus: berechneAdminStatus({ createdAt, status, orderType, paymentStatus, refundStatus }),
      brauchtAufmerksamkeit: problemOrderIds.has(row.id as string),
    };
  });

  return { zeilen, gesamt: count ?? zeilen.length };
}

export async function getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, created_at, order_type, status, payment_status, payment_method, customer_name, company, email, phone, message, total_price, tax_amount, tax_rate, net_total, shipping_street, shipping_zip, shipping_city, shipping_country, pdf_url, tracking_number, shipped_at, invoice_number, invoice_pdf_url, dhl_label_url, cancellation_source, refund_status, refund_amount_cent, refund_reference, refunded_at, order_confirmation_sent_at, freigabe_angefragt_am, freigabe_erteilt_am'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('[admin] Bestellung nicht gefunden:', orderId, orderError);
    return null;
  }

  // Bewusst KEINE Sichtbarkeitsprüfung mehr (Entscheidung 2026-08-25): Jede
  // Bestellung ist über ihre Detailseite erreichbar, sobald sie angelegt
  // wurde. Die frühere Prüfung hier entschied zugleich über Sichtbarkeit
  // UND Produktionsfreigabe – siehe stattdessen produktionsfreigabeErlaubt()
  // weiter unten, direkt an der einzigen Stelle mit echter Wirkung.
  const adminStatusEingabe = {
    createdAt: order.created_at as string,
    status: order.status as string,
    orderType: order.order_type as string,
    paymentStatus: (order.payment_status as string) ?? 'not_required',
    refundStatus: (order.refund_status as string) ?? 'not_applicable',
  };

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, product_id, product_name, color_id, color_name, print_method, size_quantities, unit_price, quantity')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('[admin] order_items konnten nicht geladen werden:', itemsError);
  }

  const itemIds = (items ?? []).map((row) => row.id as string);

  // Personalisierungselemente (Logo/Text) je Position – für die
  // Produktionsvorschau unten. Keine neue Datenhaltung: dieselbe Tabelle,
  // die auch das Rendering (Phase 2) und das Produktionsblatt-PDF nutzen.
  const { data: elementRows, error: elementsError } = itemIds.length
    ? await supabase
        .from('configuration_elements')
        .select(
          'order_item_id, element_type, view, x_cm, y_cm, width_cm, height_cm, rotation_deg, text_content, font_family, font_size, font_color, font_weight, font_style, text_align, file_name, display_file_url, original_file_url'
        )
        .in('order_item_id', itemIds)
    : { data: [] as Record<string, unknown>[], error: null };

  if (elementsError) {
    console.error('[admin] configuration_elements konnten nicht geladen werden:', elementsError);
  }

  // EIN Listing-Aufruf für die gesamte Bestellung statt eines Downloads je
  // Logo-Element – Grundlage für Dateigröße/-typ und die "Datei nicht mehr
  // vorhanden"-Erkennung im neuen Kundendateien-Panel (siehe
  // listProductionFileInfo, storage.ts). Läuft auch für Bestellungen ohne
  // jedes Logo mit (leere Map), kein Sonderfall nötig.
  const dateiInfo = await listProductionFileInfo(`orders/${orderId}`);

  const { data: supplierRows, error: supplierError } = await supabase
    .from('supplier_orders')
    .select('supplier_id, status, mode, updated_at, last_run')
    .eq('order_id', orderId);

  if (supplierError) {
    // Nicht fatal: Tabelle existiert erst ab Migration 0005 – der Rest der
    // Detailseite soll trotzdem funktionieren.
    console.error('[admin] supplier_orders konnten nicht geladen werden:', supplierError);
  }

  // Letzte gescheiterte Vorgänge – dieselbe Grundidee wie schon bei DHL
  // (shippingService.ts loggt die TATSÄCHLICHE Fehlermeldung inkl. Anbieter-
  // Antwort bereits verlässlich in order_events, nur zeigte bisher keine
  // Admin-Seite sie an). Fund vom 2026-08-26 (Produktionsreife-Audit): Genau
  // dieselbe Lücke bestand für die Bestellbestätigung und die Rechnung –
  // protokolliereVersand()/erzeugeRechnung() schreiben ihre Fehlschläge
  // seit Langem zuverlässig, nur las sie nie jemand aus. EIN gemeinsamer
  // Query statt drei getrennter Roundtrips (Performance-Audit vom selben
  // Datum: keine zusätzlichen N+1-Abfragen einführen).
  let lastShippingError: string | null = null;
  let lastConfirmationEmailError: string | null = null;
  let lastInvoiceError: string | null = null;
  if ((order.order_type as string) === 'order') {
    const brauchtVersandPruefung = !order.tracking_number;
    const brauchtBestaetigungsPruefung = !order.order_confirmation_sent_at;
    // Rechnungsfehler bleiben relevant, auch wenn invoice_number inzwischen
    // gesetzt ist (z.B. invoice_accounting_marking_failed NACH erfolgreicher
    // Rechnungserstellung) – deshalb hier ohne Vorbedingung mitgeladen.
    const relevanteEventTypen = [
      ...(brauchtVersandPruefung ? ['shipping_label_failed', 'shipping_label_partial_failure'] : []),
      ...(brauchtBestaetigungsPruefung ? ['email_failed'] : []),
      'invoice_creation_failed',
      'invoice_creation_partial_failure',
      'invoice_accounting_marking_failed',
    ];
    const { data: problemEvents } = await supabase
      .from('order_events')
      .select('event_type, reason, detail, at')
      .eq('order_id', orderId)
      .in('event_type', relevanteEventTypen)
      .order('at', { ascending: false })
      .limit(20);

    for (const ev of problemEvents ?? []) {
      const eventType = ev.event_type as string;
      if (
        !lastShippingError &&
        (eventType === 'shipping_label_failed' || eventType === 'shipping_label_partial_failure')
      ) {
        lastShippingError = (ev.reason as string | null) ?? null;
      }
      if (
        !lastConfirmationEmailError &&
        eventType === 'email_failed' &&
        (ev.detail as Record<string, unknown> | null)?.anlass === 'order_confirmation'
      ) {
        lastConfirmationEmailError = (ev.reason as string | null) ?? null;
      }
      if (
        !lastInvoiceError &&
        (eventType === 'invoice_creation_failed' ||
          eventType === 'invoice_creation_partial_failure' ||
          eventType === 'invoice_accounting_marking_failed')
      ) {
        lastInvoiceError = (ev.reason as string | null) ?? null;
      }
    }
  }

  // Vollständige, UNGEFILTERTE Bestell-Historie für die Zeitleiste unten
  // (BestellVerlauf.tsx) – bewusst ein zweiter, eigener Query statt den
  // gefilterten problemEvents-Query oben wiederzuverwenden: der obige ist auf
  // drei Fehlerkategorien UND (bei Versand/Bestätigung) auf "noch ungelöst"
  // eingeschränkt, die Zeitleiste soll dagegen jedes Ereignis zeigen,
  // inklusive erfolgreicher (status_changed, invoice_created, proof_approved, …).
  const { data: eventRows, error: eventsError } = await supabase
    .from('order_events')
    .select('event_type, from_status, to_status, reason, detail, at')
    .eq('order_id', orderId)
    .order('at', { ascending: false });
  if (eventsError) {
    console.error('[admin] order_events (Historie) konnten nicht geladen werden:', eventsError);
  }
  const events: AdminOrderEvent[] = (eventRows ?? []).map((ev) => ({
    at: ev.at as string,
    eventType: ev.event_type as string,
    fromStatus: (ev.from_status as string | null) ?? null,
    toStatus: (ev.to_status as string | null) ?? null,
    reason: (ev.reason as string | null) ?? null,
    detail: (ev.detail as Record<string, unknown> | null) ?? null,
  }));

  const itemRows: AdminOrderItemRow[] = await Promise.all(
    (items ?? []).map(async (row, itemIndex) => {
      const eigeneElemente = (elementRows ?? []).filter((el) => el.order_item_id === row.id);

      const elements: AdminOrderElementRow[] = await Promise.all(
        eigeneElemente.map(async (el) => {
          const istLogo = el.element_type === 'logo';
          const displayPath = (el.display_file_url as string | null) ?? null;
          const originalPath = (el.original_file_url as string | null) ?? null;
          const originalKey = originalPath ? nodePath.basename(originalPath) : null;
          const originalInfo = originalKey ? (dateiInfo.get(originalKey) ?? null) : null;
          return {
            type: istLogo ? 'logo' : 'text',
            view: el.view as string,
            xCm: Number(el.x_cm ?? 0),
            yCm: Number(el.y_cm ?? 0),
            widthCm: Number(el.width_cm ?? 0),
            heightCm: Number(el.height_cm ?? 0),
            rotationDeg: Number(el.rotation_deg ?? 0),
            content: (el.text_content as string | null) ?? undefined,
            fontFamily: (el.font_family as string | null) ?? undefined,
            fontSizePx: el.font_size !== null && el.font_size !== undefined ? Number(el.font_size) : undefined,
            color: (el.font_color as string | null) ?? undefined,
            bold: el.font_weight === 'bold',
            italic: el.font_style === 'italic',
            align: (el.text_align as string | null) ?? undefined,
            fileName: (el.file_name as string | null) ?? undefined,
            logoPreviewUrl: istLogo && displayPath ? await getProductionFileSignedUrl(displayPath) : null,
            originalStorageKey: istLogo ? originalKey : null,
            fileSizeBytes: istLogo ? (originalInfo?.size ?? null) : null,
            fileMimeType: istLogo ? (originalInfo?.mimeType ?? null) : null,
            originalDateiVorhanden: istLogo && originalInfo !== null,
          } satisfies AdminOrderElementRow;
        })
      );

      // Bereits gerenderte Druckvorschau je Ansicht mit mindestens einem
      // Element – derselbe Speicherpfad, den orderCompletion.ts beim
      // Bestellabschluss befüllt (erzeugeDruckvorschauen). Kein neues
      // Rendering: getProductionFileSignedUrl liefert null, wenn die Datei
      // (noch) nicht existiert, wirft nicht.
      const ansichtenMitElementen = [...new Set(elements.map((e) => e.view))];
      const previewEintraege = await Promise.all(
        ansichtenMitElementen.map(async (view) => {
          const pfad = `orders/${orderId}/preview-item${itemIndex}-${view}.png`;
          return [view, await getProductionFileSignedUrl(pfad)] as const;
        })
      );
      const previewUrlByView: Partial<Record<string, string>> = {};
      for (const [view, url] of previewEintraege) {
        if (url) previewUrlByView[view] = url;
      }

      return {
        productId: row.product_id as string,
        productName: row.product_name as string,
        colorId: row.color_id as string,
        colorName: row.color_name as string,
        printMethod: (row.print_method as string | null) ?? null,
        sizeQuantities: (row.size_quantities ?? {}) as Record<string, number>,
        unitPrice: Number(row.unit_price ?? 0),
        quantity: Number(row.quantity ?? 0),
        elements,
        previewUrlByView,
      } satisfies AdminOrderItemRow;
    })
  );

  // Lieferantenauftrag bedarfsgerecht anlegen: Der Aufruf ist idempotent
  // (bestehende Snapshots werden nicht überschrieben) und läuft NUR, wenn
  // produktionsfreigabeErlaubt() zustimmt (Stornofrist abgelaufen, bezahlt,
  // nicht storniert) – seit der Trennung von Sichtbarkeit und Produktions-
  // freigabe (2026-08-25) die alleinige Bedingung dafür, unabhängig davon,
  // dass die Seite selbst jetzt immer ausgeliefert wird. Für stornierte oder
  // unbezahlte Bestellungen entsteht damit weiterhin nie ein Auftrag.
  // Nicht-fatal: die Detailseite muss auch ohne funktionieren.
  if ((order.order_type as string) === 'order' && produktionsfreigabeErlaubt(adminStatusEingabe)) {
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

  // Drei voneinander unabhängige Signed-URLs – parallel statt nacheinander
  // (Performance-Fund vom 2026-09-01: drei sequenzielle awaits verzögerten
  // das Öffnen einer Bestellung um die Summe aller drei Netzwerk-Laufzeiten,
  // obwohl keiner der drei Aufrufe vom Ergebnis eines anderen abhängt).
  const [productionSheetUrl, invoicePdfUrl, dhlLabelUrl] = await Promise.all([
    order.pdf_url ? getProductionFileSignedUrl(order.pdf_url as string) : Promise.resolve(null),
    order.invoice_pdf_url ? getProductionFileSignedUrl(order.invoice_pdf_url as string) : Promise.resolve(null),
    order.dhl_label_url ? getProductionFileSignedUrl(order.dhl_label_url as string) : Promise.resolve(null),
  ]);

  return {
    id: order.id as string,
    orderNumber: (order.order_number as string | null) ?? buildOrderNumber(order.id as string),
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
    taxAmount: order.tax_amount !== null && order.tax_amount !== undefined ? Number(order.tax_amount) : null,
    taxRate: order.tax_rate !== null && order.tax_rate !== undefined ? Number(order.tax_rate) : null,
    netTotal: order.net_total !== null && order.net_total !== undefined ? Number(order.net_total) : null,
    shipping: order.shipping_street
      ? {
          street: order.shipping_street as string,
          zip: (order.shipping_zip as string) ?? '',
          city: (order.shipping_city as string) ?? '',
          country: (order.shipping_country as string) ?? '',
        }
      : null,
    items: itemRows,
    events,
    supplierDraft,
    productionSheetUrl,
    trackingNumber: (order.tracking_number as string | null) ?? null,
    shippedAt: (order.shipped_at as string | null) ?? null,
    invoiceNumber: (order.invoice_number as string | null) ?? null,
    invoicePdfUrl,
    dhlLabelUrl,
    lastShippingError,
    orderConfirmationSentAt: (order.order_confirmation_sent_at as string | null) ?? null,
    lastConfirmationEmailError,
    lastInvoiceError,
    freigabeAngefragtAm: (order.freigabe_angefragt_am as string | null) ?? null,
    freigabeErteiltAm: (order.freigabe_erteilt_am as string | null) ?? null,
    cancellationSource: (order.cancellation_source as string | null) ?? null,
    refundStatus: ((order.refund_status as RefundStatus | null) ?? 'not_applicable') as RefundStatus,
    refundAmountCent:
      order.refund_amount_cent !== null && order.refund_amount_cent !== undefined
        ? Number(order.refund_amount_cent)
        : null,
    refundReference: (order.refund_reference as string | null) ?? null,
    refundedAt: (order.refunded_at as string | null) ?? null,
    adminStatus: berechneAdminStatus(adminStatusEingabe),
    supplierOrders: (supplierRows ?? []).map((row) => ({
      supplierId: row.supplier_id as string,
      status: row.status as string,
      mode: row.mode as string,
      updatedAt: row.updated_at as string,
      lastRun: (row.last_run as SupplierWorkerRunResult | null) ?? null,
    })),
  };
}

export interface AdminCustomerRow {
  id: string;
  email: string;
  createdAt: string;
  displayName: string | null;
  phone: string | null;
  company: string | null;
  newsletterOptIn: boolean;
  emailConfirmed: boolean;
  orderCount: number;
}

/**
 * Kundenliste für den Adminbereich – additiv seit dem Kundenkonto
 * (supabase/migrations/0023). Führt zwei Quellen zusammen: `auth.users`
 * (E-Mail, Bestätigungsstatus – nur über `auth.admin.listUsers()` erreichbar,
 * ein normaler `.from('users')`-Zugriff funktioniert hier nicht, weil
 * `auth` ein eigenes, von PostgREST getrenntes Schema ist) und
 * `customer_profiles` (Name, Telefon, Newsletter). Zusätzlich die Anzahl
 * verknüpfter Bestellungen – bewusst gezählt, nicht geladen, damit die
 * Liste bei vielen Bestellungen je Kunde nicht schwer wird.
 */
export async function listCustomers(): Promise<AdminCustomerRow[]> {
  const supabase = createAdminClient();

  const { data: nutzer, error: authFehler } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authFehler) {
    console.error('[admin] Kundenliste (auth.users) konnte nicht geladen werden:', authFehler.message);
    return [];
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, display_name, phone, company, newsletter_opt_in');
  const profilNachId = new Map((profile ?? []).map((p) => [p.id as string, p]));

  const { data: bestellzahlen } = await supabase.from('orders').select('customer_id').not('customer_id', 'is', null);
  const anzahlNachId = new Map<string, number>();
  for (const row of bestellzahlen ?? []) {
    const id = row.customer_id as string;
    anzahlNachId.set(id, (anzahlNachId.get(id) ?? 0) + 1);
  }

  return nutzer.users
    .map((u) => {
      const p = profilNachId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? '(keine E-Mail)',
        createdAt: u.created_at,
        displayName: (p?.display_name as string | null) ?? null,
        phone: (p?.phone as string | null) ?? null,
        company: (p?.company as string | null) ?? null,
        newsletterOptIn: Boolean(p?.newsletter_opt_in),
        emailConfirmed: Boolean(u.email_confirmed_at),
        orderCount: anzahlNachId.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface AdminStatistik {
  bestellungenGesamt: number;
  anfragenGesamt: number;
  umsatzBrutto: number;
  umsatzNetto: number;
  durchschnittsbestellwert: number;
  statusVerteilung: { status: string; anzahl: number }[];
  bestellungenLetzte30Tage: number;
  umsatzLetzte30Tage: number;
}

/**
 * Kennzahlen für das Admin-Dashboard. Bewusst aus echten Bestelldaten
 * berechnet (keine Schätzung) – dieselbe Regel wie überall im Projekt:
 * lieber eine kleine, wahre Zahl als eine große, geratene.
 *
 * NUR echte Bestellungen (order_type = 'order') fließen in Umsatzzahlen
 * ein; Anfragen sind unverbindlich und werden separat gezählt.
 */
export async function ladeStatistik(): Promise<AdminStatistik> {
  const supabase = createAdminClient();
  const leer: AdminStatistik = {
    bestellungenGesamt: 0,
    anfragenGesamt: 0,
    umsatzBrutto: 0,
    umsatzNetto: 0,
    durchschnittsbestellwert: 0,
    statusVerteilung: [],
    bestellungenLetzte30Tage: 0,
    umsatzLetzte30Tage: 0,
  };

  const { data, error } = await supabase
    .from('orders')
    .select('order_type, status, total_price, net_total, created_at')
    .neq('status', 'cancelled');
  if (error || !data) {
    console.error('[admin] Statistik konnte nicht geladen werden:', error?.message);
    return leer;
  }

  const bestellungen = data.filter((r) => r.order_type === 'order');
  const anfragen = data.filter((r) => r.order_type === 'inquiry');
  const grenze30Tage = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const letzte30Tage = bestellungen.filter((r) => (r.created_at as string) >= grenze30Tage);

  const summiere = (rows: typeof bestellungen, feld: 'total_price' | 'net_total') =>
    rows.reduce((s, r) => s + Number(r[feld] ?? 0), 0);

  const statusZaehler = new Map<string, number>();
  for (const r of bestellungen) {
    const status = r.status as string;
    statusZaehler.set(status, (statusZaehler.get(status) ?? 0) + 1);
  }

  const umsatzBrutto = summiere(bestellungen, 'total_price');

  return {
    bestellungenGesamt: bestellungen.length,
    anfragenGesamt: anfragen.length,
    umsatzBrutto: Math.round(umsatzBrutto * 100) / 100,
    umsatzNetto: Math.round(summiere(bestellungen, 'net_total') * 100) / 100,
    durchschnittsbestellwert: bestellungen.length > 0 ? Math.round((umsatzBrutto / bestellungen.length) * 100) / 100 : 0,
    statusVerteilung: [...statusZaehler.entries()].map(([status, anzahl]) => ({ status, anzahl })),
    bestellungenLetzte30Tage: letzte30Tage.length,
    umsatzLetzte30Tage: Math.round(summiere(letzte30Tage, 'total_price') * 100) / 100,
  };
}
