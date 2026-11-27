/**
 * Gemeinsame Testhilfe für die Auftragsänderung (kein Test, wird von
 * orderEdit.test.ts und orderEditService.test.ts eingebunden).
 *
 * Baut die „gespeicherte Bestellung“ so, wie sie auch beim echten
 * Bestelleingang entsteht: durch `priceCart` über den echten Katalog. Dadurch
 * rechnen alle Tests, die darauf aufbauen, mit den REALEN Preisregeln
 * (Staffeln, Rundung auf ,99 €, Versandfreigrenze 75 €) – nichts ist
 * nachgebaut oder fest eingetragen.
 */
import assert from 'node:assert/strict';

import { getProduct } from '@/config/products';
import { priceCart } from '@/lib/pricing/serverPricing';
import type { CartItem } from '@/types';
import type { PreisAktion } from '@/config/aktion';
import type { AenderungsBestellung, AenderungsElement, AenderungsPosition, AenderungsStand } from '../orderEdit';

export const HOODIE = 'bandc-inspire-hoodie';
export const TSHIRT = 'gildan-heavy-t';

export const LOGO_VORNE: AenderungsElement = {
  type: 'logo',
  view: 'front',
  xCm: 5,
  yCm: 5,
  widthCm: 10,
  heightCm: 10,
  logoPfade: ['orders/o1/logo-item0-e1-original.png', 'orders/o1/logo-item0-e1-display.png'],
};

export interface PositionsSpez {
  id: string;
  productId: string;
  sizeQuantities: Record<string, number>;
  printMethod?: string;
  elements?: AenderungsElement[];
}

/** Preist die Positionen genau wie der Bestelleingang und liefert den daraus „gespeicherten“ Stand. */
export async function gespeicherterStand(
  spezifikationen: PositionsSpez[],
  bestellungUeberschreibungen: Partial<AenderungsBestellung> = {},
  lieferantenStatus: string[] = [],
  /** Preisaktion, die beim „Bestelleingang“ galt (z. B. Black Week) – im Stand steckt sie dann in den gespeicherten Preisen. */
  aktion: PreisAktion | null = null
): Promise<AenderungsStand> {
  const items: CartItem[] = spezifikationen.map((s) => ({
    id: s.id,
    printMethod: s.printMethod === 'embroidery' ? 'embroidery' : 'dtf',
    productId: s.productId,
    colorId: getProduct(s.productId)!.colors[0]!.id,
    sizeQuantities: s.sizeQuantities,
    quantity: Object.values(s.sizeQuantities).reduce((a, b) => a + b, 0),
    elements: (s.elements ?? [LOGO_VORNE]).map((e, i) => ({
      id: `e${i}`,
      type: e.type,
      view: e.view,
      xCm: e.xCm,
      yCm: e.yCm,
      widthCm: e.widthCm,
      heightCm: e.heightCm,
      rotationDeg: 0,
      isOutOfBounds: false,
      extraPrice: 0,
      estimatedStitches: 0,
      name: '',
      locked: false,
      hidden: false,
      fileUrl: '',
      fileName: '',
      originalWidthPx: 0,
      originalHeightPx: 0,
      originalFileUrl: '',
      backgroundRemoved: false,
      contentFillRatio: 0.85,
    })) as never,
    unitPrice: 0,
    totalPrice: 0,
    addedAt: 0,
  }));
  const preise = await priceCart(items, 'Deutschland', aktion);
  assert.equal(preise.blocked, false, 'Testaufbau: die Ausgangsbestellung muss bepreisbar sein');

  const positionen: AenderungsPosition[] = spezifikationen.map((s, i) => ({
    id: s.id,
    productId: s.productId,
    colorId: getProduct(s.productId)!.colors[0]!.id,
    productName: getProduct(s.productId)!.name,
    colorName: getProduct(s.productId)!.colors[0]!.name,
    printMethod: s.printMethod ?? 'dtf',
    sizeQuantities: s.sizeQuantities,
    quantity: preise.items[i]!.quantity,
    unitPrice: preise.items[i]!.unitPrice,
    totalPrice: preise.items[i]!.totalPrice,
    elements: s.elements ?? [LOGO_VORNE],
  }));

  return {
    bestellung: {
      id: 'order-1',
      orderNumber: 'ER-2026-ABC123',
      orderType: 'order',
      status: 'new',
      paymentStatus: 'not_required',
      paymentMethod: 'invoice',
      totalPrice: preise.totalPrice,
      quantity: preise.totalQuantity,
      taxRate: 0,
      shippingCountry: 'Deutschland',
      invoiceNumber: null,
      email: 'kunde@example.invalid',
      ...bestellungUeberschreibungen,
    },
    positionen,
    lieferantenStatus,
  };
}
