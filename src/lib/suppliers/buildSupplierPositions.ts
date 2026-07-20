/**
 * Reine (nebenwirkungsfreie) Umwandlung: Bestellpositionen unseres Shops
 * → Lieferantenpositionen für die Automatisierung.
 *
 * Bewusst vom Laden der Bestellung (createSupplierOrder.ts) getrennt:
 * diese Funktion ist ohne Datenbank/Netz testbar und wird sowohl vom
 * Service als auch später von Admin-Vorschau-UI verwendet werden können.
 */
import { getProduct } from '@/config/products';
import type {
  SupplierId,
  SupplierOrderDraft,
  SupplierOrderPosition,
  UnresolvedSupplierPosition,
} from './types';

/** Minimale Sicht auf eine Bestellposition – strukturell kompatibel mit
 *  OrderItemRecord (src/lib/actions/orderTypes.ts) UND mit den rohen
 *  order_items-Zeilen aus Supabase (nach Spalten-Mapping). */
export interface SupplierSourceItem {
  productId: string;
  colorId: string;
  sizeQuantities: Record<string, number>;
}

export function buildSupplierPositions(orderId: string, items: SupplierSourceItem[]): SupplierOrderDraft {
  const positionsBySupplier: Partial<Record<SupplierId, SupplierOrderPosition[]>> = {};
  const unresolved: UnresolvedSupplierPosition[] = [];

  for (const item of items) {
    const product = getProduct(item.productId);
    const supplierRef = product?.supplier;

    if (!product || !supplierRef) {
      unresolved.push({
        productId: item.productId,
        productName: product?.name ?? item.productId,
        colorId: item.colorId,
        reason: 'no_supplier_ref',
      });
      continue;
    }

    const color = product.colors.find((c) => c.id === item.colorId);

    const sizes = Object.entries(item.sizeQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({ size, quantity }));

    // Position ohne einzige Größe > 0 wäre für den Lieferanten sinnlos –
    // kann bei stornierten/leeren Positionen vorkommen, wird übersprungen.
    if (sizes.length === 0) continue;

    const position: SupplierOrderPosition = {
      supplierId: supplierRef.supplierId,
      productId: product.id,
      productName: product.name,
      articleNumber: supplierRef.articleNumber,
      productUrl: supplierRef.productUrl,
      colorId: item.colorId,
      colorName: color?.name ?? item.colorId,
      sizes,
    };

    (positionsBySupplier[supplierRef.supplierId] ??= []).push(position);
  }

  return { orderId, positionsBySupplier, unresolved };
}
