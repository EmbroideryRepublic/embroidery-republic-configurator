/**
 * ═══════════════════════════════════════════════════════════════════════
 * BUCHHALTUNGS-SYNCHRONISIERUNG (v1) – GET /api/accounting/v1/orders
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Einziger Endpunkt der sicheren PULL-Synchronisierung mit der lokalen
 * Buchhaltungs-Anwendung (embroidery-republic-buchhaltung, Schritt 6). Die
 * Website macht hier NICHTS von sich aus erreichbar – die Buchhaltung ruft
 * kontrolliert ab, authentifiziert über ein geteiltes Secret. Kein Push,
 * keine ungeschützte lokale Gegenstelle.
 *
 * Absicherung exakt nach dem Vorbild von
 * src/app/api/cron/process-supplier-orders/route.ts: ausschließlich
 * `Authorization: Bearer <ACCOUNTING_API_KEY>`, SHA-256+timingSafeEqual,
 * 503 wenn nicht konfiguriert, 401 bei falschem Schlüssel. Rate-Limit NACH
 * der Auth-Prüfung (etablierte Reihenfolge, siehe Webhook-Route).
 *
 * ── Vertrag ─────────────────────────────────────────────────────────────
 * Antwortform: AccountingOrdersResponse (src/lib/accounting/types.ts).
 * Bewusst KEIN Steuerfeld – dieser Endpunkt liefert ausschließlich den
 * Bruttogesamtbetrag. Die Website ist seit 2026-08-21 durchgängig
 * Kleinunternehmer-bewusst (config/company.ts, IST_KLEINUNTERNEHMER; siehe
 * lib/pricing/stages/orderStage.ts) – der Bruttobetrag selbst war davon nie
 * betroffen, nur die (hier ohnehin nicht übertragene) Steueraufschlüsselung.
 *
 * ── Cursor ──────────────────────────────────────────────────────────────
 * Keyset-Paginierung über (accounting_ready_at, id) – siehe Migration
 * 0027_buchhaltung_sync_export.sql für die Begründung (orders hat keine
 * generische updated_at-Spalte, created_at korreliert nicht mit
 * Buchhaltungsreife). Nur Bestellungen mit gesetztem accounting_ready_at
 * UND invoice_number sind buchhaltungsreif.
 *
 * ── Stornierung/Erstattung: Redelivery statt Ausschluss ────────────────
 * status='cancelled' ist bewusst KEIN Ausschlusskriterium dieser Query –
 * eine stornierte, bereits synchronisierte Bestellung soll der Buchhaltung
 * weiterhin gemeldet werden, mit cancelledAt gesetzt, statt spurlos aus dem
 * Feed zu verschwinden. Beide Stornierungspfade (orderService.ts,
 * storniereBestellungDurchKunden/setzeBestellstatus) setzen accounting_ready_at
 * bei der Stornierung erneut auf now() – der aufsteigende Cursor liefert die
 * Bestellung dadurch im nächsten Sync-Lauf automatisch erneut aus, ohne
 * eigene Redelivery-Logik auf dieser Seite. Die tatsächliche Rückabwicklung
 * (Rechnung/Zahlung/Buchung stornieren) läuft ausschließlich in der
 * bestehenden lokalen Storno-Logik der Buchhaltung, nicht über diesen
 * Endpunkt.
 *
 * ── Fehlerisolierung beim PDF-Signieren ───────────────────────────────
 * invoice_pdf_url ist ein Storage-PFAD, keine URL – wird hier über das
 * bestehende getProductionFileSignedUrl() in eine zeitlich begrenzte
 * signierte URL umgewandelt. Schlägt das für eine Bestellung fehl, wird die
 * Seite genau davor abgeschnitten (nextCursor zeigt auf die letzte
 * erfolgreiche Zeile) statt die Bestellung stillschweigend zu überspringen
 * – ein wiederholter Abruf holt sie garantiert nach.
 *
 * Beispiel (manuell/Test):
 *   curl -H "Authorization: Bearer $ACCOUNTING_API_KEY" \
 *        "http://localhost:3001/api/accounting/v1/orders?limit=50"
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getProductionFileSignedUrl } from '@/lib/supabase/storage';
import { protokoll } from '@/lib/observability/log';
import { pruefeRateLimit } from '@/lib/security/rateLimit';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { leseApiSchluessel, AccountingSyncKonfigurationFehlt } from '@/lib/accounting/accountingSyncKonfiguration';
import type { AccountingOrderDto, AccountingOrdersResponse } from '@/lib/accounting/types';

export const dynamic = 'force-dynamic';

const SEITENGROESSE_STANDARD = 50;
const SEITENGROESSE_MAX = 200;
const PDF_URL_GUELTIG_SEKUNDEN = 60 * 60;

const ISO_ZEITSTEMPEL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest): Promise<NextResponse> {
  let apiSchluessel: string;
  try {
    apiSchluessel = leseApiSchluessel();
  } catch (fehler) {
    if (fehler instanceof AccountingSyncKonfigurationFehlt) {
      return NextResponse.json(
        { error: 'ACCOUNTING_API_KEY nicht konfiguriert – Endpunkt deaktiviert.' },
        { status: 503 }
      );
    }
    throw fehler;
  }

  // Zeitkonstanter Vergleich – dasselbe Vorgehen wie beim Cron-Endpunkt und
  // orderAccessToken.ts: die Laufzeit darf nicht verraten, wie viele Zeichen
  // des Schlüssels stimmten.
  const mitgeliefert = req.headers.get('authorization') ?? '';
  const erwartet = `Bearer ${apiSchluessel}`;
  const a = createHash('sha256').update(mitgeliefert).digest();
  const b = createHash('sha256').update(erwartet).digest();
  if (!timingSafeEqual(a, b)) {
    protokoll.warnung('ORDER', 'accounting_sync_unauthorized', 'Ungültiger oder fehlender Bearer-Token.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate-Limit NACH der Auth-Prüfung: davor könnte eine Flut falscher
  // Anfragen das Limit aufbrauchen und den echten Client aussperren.
  const grenze = await pruefeRateLimit('accountingSync');
  if (!grenze.erlaubt) {
    return NextResponse.json({ error: grenze.meldung }, { status: 429 });
  }

  const params = req.nextUrl.searchParams;
  const cursorReadyAtRaw = params.get('cursorReadyAt');
  const cursorIdRaw = params.get('cursorId');
  if ((cursorReadyAtRaw && !cursorIdRaw) || (!cursorReadyAtRaw && cursorIdRaw)) {
    return NextResponse.json({ error: 'cursorReadyAt und cursorId müssen zusammen angegeben werden.' }, { status: 400 });
  }
  if (cursorReadyAtRaw && (!ISO_ZEITSTEMPEL.test(cursorReadyAtRaw) || !UUID.test(cursorIdRaw!))) {
    return NextResponse.json({ error: 'cursorReadyAt oder cursorId ist ungültig formatiert.' }, { status: 400 });
  }
  const cursor = cursorReadyAtRaw ? { readyAt: cursorReadyAtRaw, id: cursorIdRaw! } : null;

  const limitRaw = Number(params.get('limit') ?? SEITENGROESSE_STANDARD);
  const seitengroesse =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), SEITENGROESSE_MAX) : SEITENGROESSE_STANDARD;

  const db = createAdminClient();

  let abfrage = db
    .from('orders')
    .select(
      'id, order_number, created_at, customer_name, company, email, phone, customer_id, shipping_street, shipping_zip, shipping_city, shipping_country, total_price, payment_method, payment_status, payment_transaction_id, paid_at, invoice_number, invoice_date, invoice_pdf_url, accounting_ready_at, cancelled_at'
    )
    .eq('order_type', 'order')
    .in('payment_status', ['paid', 'not_required'])
    .not('invoice_number', 'is', null)
    .not('accounting_ready_at', 'is', null)
    .order('accounting_ready_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(seitengroesse + 1);

  // Keyset-Paginierung: (accounting_ready_at, id) > (cursor.readyAt, cursor.id).
  // PostgREST kennt keinen Zeilenwertvergleich – nachgebaut über .or() mit
  // zwei Zweigen. cursor.readyAt/cursor.id sind oben strikt gegen
  // ISO-Zeitstempel/UUID geprüft, bevor sie in den Filterstring eingehen.
  if (cursor) {
    abfrage = abfrage.or(
      `accounting_ready_at.gt.${cursor.readyAt},and(accounting_ready_at.eq.${cursor.readyAt},id.gt.${cursor.id})`
    );
  }

  const { data: bestellungenRoh, error: abfrageFehler } = await abfrage;
  if (abfrageFehler) {
    protokoll.fehler('ORDER', 'accounting_sync_abfrage_fehlgeschlagen', undefined, abfrageFehler);
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }

  const weitereVorhanden = (bestellungenRoh?.length ?? 0) > seitengroesse;
  const seite = (bestellungenRoh ?? []).slice(0, seitengroesse);

  const bestellIds = seite.map((b) => b.id as string);
  const { data: positionenRoh, error: positionenFehler } = bestellIds.length
    ? await db
        .from('order_items')
        .select('order_id, product_name, color_name, print_method, quantity, unit_price, total_price')
        .in('order_id', bestellIds)
    : { data: [] as Array<Record<string, unknown>>, error: null };
  if (positionenFehler) {
    protokoll.fehler('ORDER', 'accounting_sync_positionen_fehlgeschlagen', undefined, positionenFehler);
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }

  const positionenNachBestellung = new Map<string, Array<Record<string, unknown>>>();
  for (const position of positionenRoh ?? []) {
    const orderId = position.order_id as string;
    const liste = positionenNachBestellung.get(orderId) ?? [];
    liste.push(position);
    positionenNachBestellung.set(orderId, liste);
  }

  const orders: AccountingOrderDto[] = [];
  let letzterErfolgreicherCursor = cursor;
  let vorzeitigAbgebrochen = false;

  for (const bestellung of seite) {
    const pdfUrl = await getProductionFileSignedUrl(bestellung.invoice_pdf_url as string, PDF_URL_GUELTIG_SEKUNDEN).catch(
      () => null
    );
    if (!pdfUrl) {
      protokoll.fehler(
        'ORDER',
        'accounting_sync_pdf_signierung_fehlgeschlagen',
        'Rechnungs-PDF konnte nicht signiert werden – Seite wird hier abgeschnitten, nächster Abruf holt nach.',
        undefined,
        { bestellung: bestellung.id as string }
      );
      vorzeitigAbgebrochen = true;
      break;
    }

    const positionen = positionenNachBestellung.get(bestellung.id as string) ?? [];
    orders.push({
      externalOrderId: bestellung.id as string,
      orderNumber: (bestellung.order_number as string | null) ?? buildOrderNumber(bestellung.id as string),
      createdAt: bestellung.created_at as string,
      customer: {
        name: bestellung.customer_name as string,
        company: (bestellung.company as string | null) ?? null,
        email: bestellung.email as string,
        phone: (bestellung.phone as string | null) ?? null,
        externalCustomerId: (bestellung.customer_id as string | null) ?? null,
      },
      shippingAddress:
        bestellung.shipping_street && bestellung.shipping_zip && bestellung.shipping_city && bestellung.shipping_country
          ? {
              street: bestellung.shipping_street as string,
              zip: bestellung.shipping_zip as string,
              city: bestellung.shipping_city as string,
              country: bestellung.shipping_country as string,
            }
          : null,
      items: positionen.map((p) => ({
        productName: p.product_name as string,
        colorName: p.color_name as string,
        printMethod: (p.print_method as string | null) ?? null,
        quantity: p.quantity as number,
        unitPrice: p.unit_price as number,
        totalPrice: (p.total_price as number | null) ?? Math.round((p.unit_price as number) * (p.quantity as number) * 100) / 100,
      })),
      totalGrossAmount: bestellung.total_price as number,
      paymentMethod: bestellung.payment_method as AccountingOrderDto['paymentMethod'],
      paymentStatus: bestellung.payment_status as AccountingOrderDto['paymentStatus'],
      paymentTransactionId: (bestellung.payment_transaction_id as string | null) ?? null,
      paidAt: (bestellung.paid_at as string | null) ?? null,
      cancelledAt: (bestellung.cancelled_at as string | null) ?? null,
      invoice: {
        number: bestellung.invoice_number as string,
        date: (bestellung.invoice_date as string | null) ?? (bestellung.created_at as string).slice(0, 10),
        pdfDownloadUrl: pdfUrl,
      },
    });
    letzterErfolgreicherCursor = { readyAt: bestellung.accounting_ready_at as string, id: bestellung.id as string };
  }

  const antwort: AccountingOrdersResponse = {
    orders,
    nextCursor: letzterErfolgreicherCursor,
    hasMore: vorzeitigAbgebrochen || weitereVorhanden,
  };

  protokoll.info('ORDER', 'accounting_sync_seite_ausgeliefert', undefined, {
    anzahl: orders.length,
    hasMore: antwort.hasMore,
  });

  return NextResponse.json(antwort);
}
