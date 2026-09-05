/**
 * Aufbereitung einer Lieferantenposition für die MANUELLE Bestellung.
 *
 * Der Adminbereich soll alles zeigen, was zum Bestellen beim Lieferanten
 * nötig ist – ohne dass irgendwo nachgeschlagen werden muss. Kernpunkt ist
 * die Farbe: intern heißt sie z.B. „Navy", im Shop je nach Marke aber
 * „French Navy", „Navy Blue" oder „Oxford Navy", und die Farbfelder tragen
 * dort teilweise gar keinen Namen, sondern nur einen Hex-Wert.
 *
 * Diese Datei ist BEWUSST rein (keine Datenbank, kein Netz): sie übersetzt
 * nur vorhandene Positionsdaten über die Mapping-Tabellen und ist damit
 * vollständig testbar. Sie ist unabhängig von der Browser-Automatisierung –
 * die ruht (siehe docs/manueller-lieferantenprozess.md).
 */
import { resolveSupplierPosition, SupplierMappingError, SUPPLIER_VARIANT_MAPS } from '@/lib/suppliers/mapping';
import { SUPPLIERS } from '@/lib/suppliers';
import type { SupplierId, SupplierOrderPosition } from '@/lib/suppliers';

/** Wie die Farbe beim Lieferanten zu finden ist. */
export type ShopColor =
  | {
      kind: 'eindeutig';
      /** Bezeichnung im Shop (kann von unserer abweichen). */
      name: string;
      /** Farbfeld-Kennung im Shop, sofern gepflegt (bei TG der Hex-Wert). */
      hex?: string;
    }
  | {
      kind: 'unklar';
      /** Warum die Zuordnung fehlt – wird im Adminbereich angezeigt. */
      grund: string;
      /** Für dieses Produkt bekannte Shop-Farbnamen als Orientierung. */
      bekannteFarben: { name: string; hex?: string }[];
    };

export interface ManualSupplierPosition {
  productName: string;
  /** Artikelnummer beim Lieferanten (nach Mapping). */
  articleNumber: string;
  productUrl: string;
  /** Unsere interne Farbbezeichnung. */
  colorName: string;
  shopColor: ShopColor;
  sizes: { size: string; quantity: number }[];
  totalQuantity: number;
}

export interface ManualSupplierGroup {
  supplierId: SupplierId;
  supplierLabel: string;
  positions: ManualSupplierPosition[];
  /** Summe über alle Positionen dieses Lieferanten. */
  totalQuantity: number;
}

/**
 * Sammelt die im Mapping hinterlegten Shop-Farben EINES Produkts. Dient als
 * Orientierung, wenn die konkrete Farbe nicht eindeutig zugeordnet ist:
 * lieber die bekannten Bezeichnungen dieses Produkts anzeigen als gar nichts.
 *
 * Die vollständigen Kandidatenlisten der Shop-Farbfelder sind derzeit NICHT
 * hinterlegt – bei der ursprünglichen Verifikation wurden nur die eindeutig
 * aufgelösten Farben übernommen. Solange das so ist, kann hier nur gezeigt
 * werden, was wir tatsächlich verifiziert haben; nichts wird geraten.
 */
function bekannteFarbenDesProdukts(supplierId: SupplierId, productId: string): { name: string; hex?: string }[] {
  const colors = SUPPLIER_VARIANT_MAPS[supplierId]?.productOverrides?.[productId]?.colors;
  if (!colors) return [];
  return Object.values(colors)
    .map((entry) =>
      typeof entry === 'string'
        ? { name: entry }
        : { name: entry.label, ...(entry.variantId ? { hex: entry.variantId } : {}) }
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/**
 * textil-grosshandel.eu wählt die Farbe serverseitig vor, wenn die
 * Produkt-URL den Hex-Wert als `?color=`-Parameter trägt (live am Shop
 * geprüft, 2026-09-05: `?color=224D8F` lädt die Seite direkt mit "Royal"
 * ausgewählt statt nur den Swatch-Button anzuzeigen). Andere Lieferanten
 * (aktuell needen.de) haben dafür keinen geprüften Mechanismus – deshalb
 * NUR für textil-grosshandel anhängen, nicht pauschal für jede URL.
 */
function mitVorausgewaehlterFarbe(url: string, supplierId: string, hex: string | undefined): string {
  if (supplierId !== 'textil-grosshandel' || !hex) return url;
  return `${url}?color=${hex}`;
}

/** Übersetzt EINE Position in die Ansicht für die manuelle Bestellung. */
export function toManualPosition(position: SupplierOrderPosition): ManualSupplierPosition {
  const totalQuantity = position.sizes.reduce((sum, s) => sum + s.quantity, 0);
  const basis = {
    productName: position.productName,
    productUrl: position.productUrl,
    colorName: position.colorName,
    sizes: position.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
    totalQuantity,
  };

  try {
    const resolved = resolveSupplierPosition(position);
    return {
      ...basis,
      productUrl: mitVorausgewaehlterFarbe(position.productUrl, position.supplierId, resolved.colorVariant.variantId),
      articleNumber: resolved.articleNumber,
      shopColor: {
        kind: 'eindeutig',
        name: resolved.supplierColor,
        ...(resolved.colorVariant.variantId ? { hex: resolved.colorVariant.variantId } : {}),
      },
    };
  } catch (error) {
    // Fehlende/mehrdeutige Farbzuordnung darf die Seite NICHT zerlegen – der
    // Betreiber wählt die Farbe dann selbst im Shop.
    if (!(error instanceof SupplierMappingError)) throw error;
    return {
      ...basis,
      articleNumber: position.articleNumber,
      shopColor: {
        kind: 'unklar',
        grund: error.message,
        bekannteFarben: bekannteFarbenDesProdukts(position.supplierId, position.productId),
      },
    };
  }
}

/** Baut die Gruppen je Lieferant für die Bestell-Detailseite. */
export function buildManualSupplierGroups(
  positionsBySupplier: Partial<Record<SupplierId, SupplierOrderPosition[]>>
): ManualSupplierGroup[] {
  const groups: ManualSupplierGroup[] = [];
  for (const [supplierId, positions] of Object.entries(positionsBySupplier) as [SupplierId, SupplierOrderPosition[]][]) {
    if (!positions?.length) continue;
    const aufbereitet = positions.map(toManualPosition);
    groups.push({
      supplierId,
      supplierLabel: SUPPLIERS[supplierId]?.label ?? supplierId,
      positions: aufbereitet,
      totalQuantity: aufbereitet.reduce((sum, p) => sum + p.totalQuantity, 0),
    });
  }
  return groups;
}
