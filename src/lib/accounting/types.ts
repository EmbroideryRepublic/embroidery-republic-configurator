/**
 * ═══════════════════════════════════════════════════════════════════════
 * WIRE-VERTRAG DER BUCHHALTUNGS-SYNCHRONISIERUNG (v1)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Bewusst getrennt von den DB-Spalten (`orders`/`order_items`) – dieser
 * Vertrag ist versioniert (`/api/accounting/v1/...`) und darf sich unabhängig
 * vom Datenbankschema weiterentwickeln.
 *
 * ── Kein Steuerfeld ────────────────────────────────────────────────────
 * `totalGrossAmount` ist der EINZIGE Geldbetrag im Vertrag. Kein
 * `taxRate`/`taxAmount`/`netTotal` – die Website berechnet aktuell pauschal
 * 19 % USt. unabhängig vom (bestätigten) lokalen Kleinunternehmerstatus,
 * das ist eine offene, separat zu klärende Frage. Die Synchronisierung
 * übernimmt deshalb nur den Bruttobetrag und weist lokal nie eine
 * Umsatzsteuer aus – diese Entscheidung wird hier auf Typebene erzwungen,
 * nicht nur per Konvention.
 *
 * ── Kein eigenes Rechnungsnummernfeld auf Buchhaltungsseite ───────────
 * `invoice.number` ist die von Lexware Office vergebene, gesetzlich
 * fortlaufende Rechnungsnummer (§14 UStG) – die lokale Buchhaltung erstellt
 * für synchronisierte Bestellungen keine eigene Nummer, sondern übernimmt
 * diese als externe Referenz.
 */

export interface AccountingOrderCustomerDto {
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  /** `orders.customer_id`, sofern die Bestellung einem Kundenkonto zugeordnet ist. */
  externalCustomerId: string | null;
}

export interface AccountingOrderShippingAddressDto {
  street: string;
  zip: string;
  city: string;
  country: string;
}

export interface AccountingOrderItemDto {
  productName: string;
  colorName: string;
  printMethod: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AccountingOrderInvoiceDto {
  /** Von Lexware Office vergebene Rechnungsnummer (§14 UStG). */
  number: string;
  /** ISO-Datum (yyyy-MM-dd), wie an Lexware übergeben. */
  date: string;
  /** Zeitlich begrenzte, signierte URL auf das Lexware-PDF (kein Storage-Pfad). */
  pdfDownloadUrl: string;
}

export interface AccountingOrderDto {
  /** `orders.id` */
  externalOrderId: string;
  /** `buildOrderNumber(id)`, wiederverwendet – identisch zur Anzeige auf der Website. */
  orderNumber: string;
  createdAt: string;
  customer: AccountingOrderCustomerDto;
  shippingAddress: AccountingOrderShippingAddressDto | null;
  items: AccountingOrderItemDto[];
  /** `orders.total_price` – Bruttogesamtbetrag, der einzige Geldbetrag in diesem Vertrag. */
  totalGrossAmount: number;
  paymentMethod: 'invoice' | 'card' | 'paypal';
  /**
   * Bewusst nur diese zwei Werte: der Endpunkt liefert ausschließlich
   * Bestellungen mit `payment_status in ('paid', 'not_required')` –
   * `pending`/`failed` sind für die Buchhaltung nicht relevant.
   */
  paymentStatus: 'paid' | 'not_required';
  paymentTransactionId: string | null;
  paidAt: string | null;
  invoice: AccountingOrderInvoiceDto;
}

export interface AccountingOrdersCursorDto {
  readyAt: string;
  id: string;
}

export interface AccountingOrdersResponse {
  orders: AccountingOrderDto[];
  nextCursor: AccountingOrdersCursorDto | null;
  hasMore: boolean;
}
