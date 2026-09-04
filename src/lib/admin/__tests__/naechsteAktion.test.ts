/**
 * Absicherung von naechsteAktion.ts, insbesondere der beiden neuen
 * Kundenfreigabe-Zweige (siehe orderService.ts::setzeBestellstatus,
 * freigabe-fehlt-Prüfung).
 *
 * Reine Ableitungslogik ohne Datenbankzugriff (bekommt ein bereits
 * geladenes AdminOrderDetail) – anders als orderService.ts/admin/data.ts
 * deshalb mit echten Fixtures statt Quelltext-Prüfung getestet, wie auch
 * config/__tests__/orderStatus.test.ts für die ebenfalls reine
 * Zustandsmaschine.
 *
 * Regressionstest für einen Fund aus der eigenen Implementierung dieser
 * Funktion (2026-09-04): ein erster Entwurf platzierte die beiden neuen
 * Freigabe-Zweige UNBEDINGT zwischen Rechnungsprüfung und status==='new',
 * wodurch JEDE bereits shipped/completed-Bestellung mit (dauerhaft null
 * bleibenden) freigabe_*-Feldern fälschlich "Vorschau senden" gemeldet
 * hätte – insbesondere jede Bestellung von vor Einführung dieses Features.
 * Die Korrektur verschachtelt beide Zweige innerhalb von status==='new'.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneNaechsteAktion, fehlenVorschauen } from '../naechsteAktion';
import type { AdminOrderDetail, AdminOrderItemRow } from '../data';

function item(overrides: Partial<AdminOrderItemRow> = {}): AdminOrderItemRow {
  return {
    productId: 'gildan-heavy-t',
    productName: 'Heavy T-Shirt',
    colorId: 'navy',
    colorName: 'Navy',
    printMethod: 'dtf',
    sizeQuantities: { M: 1 },
    unitPrice: 20,
    quantity: 1,
    elements: [
      {
        type: 'logo',
        view: 'front',
        xCm: 10,
        yCm: 10,
        widthCm: 10,
        heightCm: 10,
        rotationDeg: 0,
        fileName: 'logo.png',
        logoPreviewUrl: null,
        originalStorageKey: null,
        fileSizeBytes: null,
        fileMimeType: null,
        originalDateiVorhanden: true,
      },
    ],
    previewUrlByView: { front: 'https://example.test/preview-front.png' },
    ...overrides,
  };
}

/** Eine in jeder Hinsicht "erledigte" Bestellung: produktionsbereit, Rechnung
 *  vorhanden, keine Fehler, kein Lieferantenbezug. Jeder Test überschreibt
 *  gezielt genau die Felder, die er prüfen will. */
function basis(overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    id: 'order-1',
    orderNumber: 'ER-2026-100001',
    createdAt: '2026-09-01T10:00:00.000Z',
    orderType: 'order',
    status: 'new',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    customerName: 'Max Mustermann',
    company: null,
    email: 'max@example.test',
    phone: null,
    message: null,
    totalPrice: 24,
    taxAmount: 4,
    taxRate: 19,
    netTotal: 20,
    shipping: { street: 'Teststr. 1', zip: '12345', city: 'Berlin', country: 'DE' },
    items: [item()],
    events: [],
    supplierDraft: { orderId: 'order-1', positionsBySupplier: {}, unresolved: [] },
    productionSheetUrl: null,
    trackingNumber: null,
    shippedAt: null,
    invoiceNumber: 'RE-2026-000001',
    invoicePdfUrl: null,
    dhlLabelUrl: null,
    lastShippingError: null,
    orderConfirmationSentAt: '2026-09-01T10:01:00.000Z',
    lastConfirmationEmailError: null,
    lastInvoiceError: null,
    freigabeAngefragtAm: null,
    freigabeErteiltAm: null,
    supplierOrders: [],
    cancellationSource: null,
    refundStatus: 'not_applicable',
    refundAmountCent: null,
    refundReference: null,
    refundedAt: null,
    adminStatus: { code: 'produktionsbereit', label: 'Produktionsbereit', farbe: 'gruen' },
    ...overrides,
  };
}

test("status 'new' ohne Freigabeanfrage: bittet um Versand der Vorschau zur Freigabe", () => {
  const aktion = berechneNaechsteAktion(basis());
  assert.deepEqual(aktion, { text: 'Vorschau zur Freigabe an die Kundschaft senden.', ton: 'ok' });
});

test("status 'new' mit gesendeter, aber noch nicht erteilter Freigabe: wartet", () => {
  const aktion = berechneNaechsteAktion(basis({ freigabeAngefragtAm: '2026-09-02T09:00:00.000Z' }));
  assert.deepEqual(aktion, { text: 'Wartet auf Kundenfreigabe der Druckvorschau.', ton: 'hinweis' });
});

test("status 'new' mit erteilter Freigabe: bereit für den Übergang nach in_production", () => {
  const aktion = berechneNaechsteAktion(
    basis({ freigabeAngefragtAm: '2026-09-02T09:00:00.000Z', freigabeErteiltAm: '2026-09-02T09:05:00.000Z' })
  );
  assert.deepEqual(aktion, { text: 'Auf „In Produktion" setzen.', ton: 'ok' });
});

test('eine bereits versendete Bestellung mit dauerhaft leeren freigabe_*-Feldern (Altbestellung von vor diesem Feature) zeigt NICHT die Freigabe-Hinweise', () => {
  const aktion = berechneNaechsteAktion(
    basis({ status: 'shipped', trackingNumber: '00340000000', shippedAt: '2026-08-01T12:00:00.000Z' })
  );
  assert.deepEqual(aktion, { text: 'Nach Zustellung auf „Abgeschlossen" setzen.', ton: 'hinweis' });
});

test('eine abgeschlossene Bestellung mit leeren freigabe_*-Feldern meldet nichts mehr zu tun', () => {
  const aktion = berechneNaechsteAktion(basis({ status: 'completed' }));
  assert.equal(aktion, null);
});

test("status 'in_production' mit leeren freigabe_*-Feldern (Altbestellung) springt direkt zur Versandprüfung", () => {
  const aktion = berechneNaechsteAktion(basis({ status: 'in_production' }));
  assert.deepEqual(aktion, { text: 'Versandlabel erstellen (oder Sendungsnummer manuell eintragen).', ton: 'ok' });
});

test('fehlenVorschauen: true, wenn eine Ansicht mit Elementen keine Vorschau-URL hat', () => {
  const order = basis({ items: [item({ previewUrlByView: {} })] });
  assert.equal(fehlenVorschauen(order), true);
});

test('fehlenVorschauen: false, wenn jede Ansicht mit Elementen eine Vorschau-URL hat', () => {
  const order = basis();
  assert.equal(fehlenVorschauen(order), false);
});

test('fehlenVorschauen: false ohne jede Personalisierung (keine Ansichten zu prüfen)', () => {
  const order = basis({ items: [item({ elements: [], previewUrlByView: {} })] });
  assert.equal(fehlenVorschauen(order), false);
});
