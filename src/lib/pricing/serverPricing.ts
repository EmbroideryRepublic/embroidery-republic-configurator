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
import { steuersatzFuer } from '@/config/pricing/steuer';
import { calculatePipeline } from './pipeline';
import { sumSizeQuantities } from './quantity';
import type { PriceLine } from './priceLine';
import { groupByCategory } from './priceLine';
import { calculatePrice } from './calculatePrice';
import type { CartItem } from '@/types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Vertrauenswürdige Stückzahl EINER Position: Summe der Größen-Mengen aus der
 * Konfiguration – NICHT das ggf. manipulierte `CartItem.quantity`.
 *
 * Die Regel selbst liegt in `quantity.ts` und wird von Oberfläche UND Server
 * genutzt; hier bleibt nur der sprechende Name für den Sicherheitskontext.
 */
export const trustedQuantity = sumSizeQuantities;

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
  /** Endsumme inkl. Versand – der BRUTTObetrag, der gespeichert wird. */
  totalPrice: number;
  /**
   * Enthaltene Umsatzsteuer. Der Satz stammt ausschließlich aus
   * `config/pricing/steuer.ts`; hier wird er nur weitergereicht.
   */
  taxAmount: number;
  /** Steuersatz in Prozent zum Zeitpunkt dieser Berechnung. */
  taxRate: number;
  /** Nettosumme = `totalPrice − taxAmount`. Grundlage jeder Auswertung. */
  netTotal: number;
  totalQuantity: number;
  /** Produkt-IDs, die serverseitig NICHT bepreisbar waren (unbekanntes
   *  Produkt) – bei echten Bestellungen ein Ablehnungsgrund. */
  unpriceable: string[];
  /** true, wenn für das Lieferland KEIN Versandtarif hinterlegt ist. Dann ist
   *  `shippingCost` 0, der Betrag aber NICHT belastbar – Aufrufer müssen die
   *  Bestellung ablehnen statt stillschweigend 0 € Versand anzusetzen. */
  shippingUnavailable: boolean;
  /** Vollständige Aufschlüsselung aller Preisbestandteile (alle Stufen). */
  lines: PriceLine[];
  /** Dieselben Posten nach Kategorie gruppiert – für Anzeige und Rechnung. */
  grouped: ReturnType<typeof groupByCategory>;
  /** true = Ergebnis nicht belastbar (z.B. fehlender Versandtarif). */
  blocked: boolean;
  issues: string[];
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

  // Die Stufen 1–3 laufen über die PIPELINE (lib/pricing/pipeline.ts) – es
  // gibt bewusst keine zweite Rechenlogik für den Warenkorb. Positionen, die
  // serverseitig nicht bepreisbar sind (unbekanntes Produkt), gehen NICHT in
  // die Pipeline; sie werden unten über `unpriceable` gemeldet.
  const pipelinePositionen = await Promise.all(
    items
      .map((item, i) => ({ item, ergebnis: priced[i]! }))
      .filter(({ ergebnis }) => ergebnis.priced)
      .map(async ({ item, ergebnis }) => {
        const product = getProduct(item.productId)!;
        return {
          itemId: item.id,
          productName: product.name,
          basePrice: product.basePrice,
          quantity: ergebnis.quantity,
          elements: item.elements,
          pricingRules: await getPricingRules(item.printMethod),
        };
      })
  );

  const pipeline = calculatePipeline({ positions: pipelinePositionen, shippingCountry });

  return {
    items: priced,
    subtotal: pipeline.subtotal,
    shippingCost: round2(pipeline.lines.filter((l) => l.category === 'versand').reduce((s, l) => s + l.total, 0)),
    totalPrice: pipeline.grandTotal,
    taxAmount: pipeline.taxAmount,
    taxRate: steuersatzFuer().satz,
    netTotal: round2(pipeline.grandTotal - pipeline.taxAmount),
    totalQuantity: priced.reduce((sum, p) => sum + p.quantity, 0),
    unpriceable: priced.filter((p) => !p.priced).map((p) => p.productId),
    // Kein hinterlegter Versandtarif blockiert die Pipeline – das ist
    // derselbe Sachverhalt wie bisher, nur an einer Stelle geprüft.
    shippingUnavailable: Boolean(shippingCountry) && pipeline.issues.some((i) => i.includes('Versandtarif')),
    /** Vollständige Aufschlüsselung für Warenkorb, Rechnung und Auswertung. */
    lines: pipeline.lines,
    grouped: pipeline.grouped,
    blocked: pipeline.blocked,
    issues: pipeline.issues,
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
