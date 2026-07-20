import type { PrintView } from '@/types';

/**
 * Von den rohen Client-Typen (CartItem/ConfigElement, die auch UI-nur-
 * relevante Felder wie isOutOfBounds/locked/hidden tragen) entkoppelte
 * Zusammenfassung EINER Bestellung/Anfrage – gemeinsame Grundlage für
 * Produktionsblatt-PDF und E-Mail-Versand, damit beide exakt dieselben
 * Daten zeigen.
 */
export interface OrderContact {
  name: string;
  company?: string;
  email: string;
  phone?: string;
}

export interface OrderShippingAddress {
  street: string;
  zip: string;
  city: string;
  country: string;
}

export type OrderPaymentMethod = 'card' | 'paypal' | 'invoice';

export type OrderStatus = 'new' | 'in_production' | 'shipped' | 'completed' | 'cancelled';

export type OrderPaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed';

/** Gemeinsame Bestellnummer-Logik – wird sowohl bei der Erstellung
 *  (orders.ts) als auch bei der Stripe-Webhook-seitigen Rekonstruktion
 *  (reconstructOrder.ts) aus derselben DB-ID berechnet, damit beide
 *  garantiert dieselbe Nummer erzeugen. */
export function buildOrderNumber(dbId: string): string {
  const year = new Date().getFullYear();
  const shortId = dbId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ER-${year}-${shortId}`;
}

export interface OrderElementRecord {
  type: 'logo' | 'text';
  view: PrintView;
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
  letterSpacing?: number;
  lineHeight?: number;
  hasShadow?: boolean;
  hasOutline?: boolean;
  outlineColor?: string;
  // Logo-spezifisch
  fileName?: string;
  /** Storage-Pfad der Originaldatei (vor Hintergrundentfernung) – Archiv/Referenz. */
  logoStoragePath?: string;
  /** Storage-Pfad der tatsächlich angezeigten/verwendeten Version (ggf.
   *  freigestellt) – das ist die Datei, die das Rendering (Phase 2) nutzt. */
  logoDisplayStoragePath?: string;
}

export interface OrderItemRecord {
  /** Roh-Config-ID aus src/config/products.ts – wird vom Rendering
   *  (Phase 2) gebraucht, um getProduct()/getPrintAreas() aufzurufen. */
  productId: string;
  colorId: string;
  productName: string;
  colorName: string;
  printMethod: 'dtf' | 'embroidery';
  sizeQuantities: Record<string, number>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  elements: OrderElementRecord[];
  /** Gerenderte Druckvorschau-PNGs (Phase 2, src/lib/rendering/) je Ansicht
   *  mit mindestens einem Element – wird von buildProductionSheet.tsx ins
   *  Produktionsblatt eingebettet. Nur für Ansichten vorhanden, in denen
   *  das Rendering erfolgreich war (nicht-fatal, siehe orders.ts). */
  previews?: Partial<Record<PrintView, Buffer>>;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  orderType: 'inquiry' | 'order';
  createdAt: string;
  contact: OrderContact;
  shipping?: OrderShippingAddress;
  paymentMethod?: OrderPaymentMethod;
  message?: string;
  /** Warenwert ohne Versand. */
  subtotal?: number;
  /** Serverseitig berechnete Versandkosten (0 = versandkostenfrei). */
  shippingCost?: number;
  /** Endsumme inklusive Versand. */
  totalPrice: number;
  items: OrderItemRecord[];
}

export const PRINT_VIEW_LABELS: Record<PrintView, string> = {
  front: 'Vorderseite',
  back: 'Rückseite',
  sleeve_left: 'Ärmel links',
  sleeve_right: 'Ärmel rechts',
};

export const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  card: 'Kreditkarte',
  paypal: 'PayPal',
  invoice: 'Kauf auf Rechnung',
};
