/**
 * Serverseitige, AUTORITATIVE Preisberechnung einer Bestellung/Anfrage.
 *
 * Sicherheitskern: der vom Client übermittelte Preis (CartItem.unitPrice/
 * totalPrice) wird NIEMALS vertraut. Der Server berechnet den Endpreis
 * ausschließlich aus
 *   (a) den KATALOG-Produktdaten (basePrice, serverseitig via getProduct) und
 *   (b) der KONFIGURATION der Position (Elemente, Größen-Mengen,
 *       Veredelungsart)
 * über exakt denselben Rechenkern wie der Client (calculatePrice +
 * getPricingRules). Dadurch ist der Serverpreis für echte Bestellungen
 * deckungsgleich mit der Anzeige (Abweichung 0), während ein manipulierter
 * Client-Preis wirkungslos bleibt.
 *
 * Der vom Client behauptete Preis wird höchstens zu Prüf-/Debug-Zwecken
 * protokolliert (priceClaimDeviation), nie gespeichert.
 */
import { getProduct } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculateShipping } from '@/config/shipping';
import { calculatePrice } from './calculatePrice';
import type { CartItem } from '@/types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Vertrauenswürdige Stückzahl EINER Position: Summe der Größen-Mengen aus der
 * Konfiguration – NICHT das ggf. manipulierte `CartItem.quantity`. Negative/
 * nicht-numerische Werte werden ignoriert.
 */
export function trustedQuantity(sizeQuantities: Record<string, number> | undefined | null): number {
  if (!sizeQuantities) return 0;
  return Object.values(sizeQuantities).reduce<number>((sum, q) => {
    const n = Number(q);
    return sum + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }, 0);
}

export interface ServerItemPrice {
  productId: string;
  /** Serverseitig aus den Größen-Mengen ermittelte Stückzahl. */
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** false = Produkt nicht im Katalog → nicht bepreisbar (ungültig/verdächtig). */
  priced: boolean;
}

/** Berechnet den Preis EINER Position autoritativ aus Katalog + Konfiguration. */
export async function priceCartItem(item: CartItem): Promise<ServerItemPrice> {
  const product = getProduct(item.productId);
  const quantity = trustedQuantity(item.sizeQuantities);
  if (!product) {
    // Unbekanntes Produkt → keine vertrauenswürdige Berechnung möglich.
    return { productId: item.productId, quantity, unitPrice: 0, totalPrice: 0, priced: false };
  }
  const pricingRules = await getPricingRules(item.printMethod);
  const { unitPrice, totalPrice } = calculatePrice({
    basePrice: product.basePrice,
    quantity,
    elements: item.elements,
    pricingRules,
  });
  return { productId: item.productId, quantity, unitPrice, totalPrice, priced: true };
}

export interface ServerCartPricing {
  items: ServerItemPrice[];
  /** Warenwert ohne Versand (Summe der Positionen). */
  subtotal: number;
  /** Serverseitig ermittelte Versandkosten (0, wenn Freigrenze erreicht). */
  shippingCost: number;
  /** Endsumme inkl. Versand – der Betrag, der gespeichert/berechnet wird. */
  totalPrice: number;
  totalQuantity: number;
  /** Produkt-IDs, die serverseitig NICHT bepreisbar waren (unbekanntes
   *  Produkt) – bei echten Bestellungen ein Ablehnungsgrund. */
  unpriceable: string[];
  /** true, wenn für das Lieferland KEIN Versandtarif hinterlegt ist. Dann ist
   *  `shippingCost` 0, der Betrag aber NICHT belastbar – Aufrufer müssen die
   *  Bestellung ablehnen statt stillschweigend 0 € Versand anzusetzen. */
  shippingUnavailable: boolean;
}

/**
 * Autoritativer Gesamtpreis eines Warenkorbs inklusive Versand.
 * Client-`unitPrice`/`totalPrice` gehen bewusst NICHT ein – jede Position wird
 * aus Katalog + Konfiguration neu berechnet, der Versand aus Lieferland +
 * serverseitigem Warenwert (shipping.ts). Ohne Lieferland (z.B. unverbindliche
 * Anfrage) wird kein Versand angesetzt.
 */
export async function priceCart(items: CartItem[], shippingCountry?: string): Promise<ServerCartPricing> {
  const priced = await Promise.all(items.map((it) => priceCartItem(it)));
  const subtotal = round2(priced.reduce((sum, p) => sum + p.totalPrice, 0));

  const shipping = shippingCountry ? calculateShipping(shippingCountry, subtotal) : null;
  const shippingUnavailable = Boolean(shippingCountry) && shipping === null;
  const shippingCost = shipping?.cost ?? 0;

  return {
    items: priced,
    subtotal,
    shippingCost,
    totalPrice: round2(subtotal + shippingCost),
    totalQuantity: priced.reduce((sum, p) => sum + p.quantity, 0),
    unpriceable: priced.filter((p) => !p.priced).map((p) => p.productId),
    shippingUnavailable,
  };
}

/**
 * NUR zu Prüf-/Debug-Zwecken: Abweichung (in €) zwischen dem vom Client
 * BEHAUPTETEN Gesamtpreis und dem serverseitig berechneten. > 0 = der Client
 * hat einen abweichenden (potenziell manipulierten) Preis geschickt; verwendet
 * wird ausschließlich der Serverpreis.
 */
export function priceClaimDeviation(clientClaimedTotal: number, serverTotal: number): number {
  const claimed = Number(clientClaimedTotal);
  return round2(Math.abs((Number.isFinite(claimed) ? claimed : 0) - serverTotal));
}
