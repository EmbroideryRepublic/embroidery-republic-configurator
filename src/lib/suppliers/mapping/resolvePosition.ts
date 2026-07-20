/**
 * Übersetzt eine komplette Bestellposition (interne Darstellung) in
 * Lieferantenbezeichnungen – die Klammer zwischen der reinen
 * Feld-Übersetzung (resolve.ts) und dem Worker.
 *
 * Zwei Einstiegspunkte:
 *  - resolveSupplierPosition(): übersetzt EINE Position und WIRFT beim
 *    ersten fehlenden/ungültigen Wert. Der Worker ruft sie je Position auf
 *    und überspringt bei einem Fehler genau diese Position.
 *  - resolveSupplierPositions(): übersetzt viele Positionen und SAMMELT
 *    Erfolge und Fehler getrennt (wirft nicht). Für Admin-Vorschau und
 *    Tests, die alle Probleme auf einmal sehen wollen.
 *
 * Das Ergebnis trägt sowohl die sichtbaren Labels (supplierColor / sizes –
 * unverändert) als auch die vollständigen Varianten-Deskriptoren inkl.
 * etwaiger stabiler IDs (colorVariant / sizeVariants). Die Übersetzung
 * passiert BEWUSST erst hier, direkt vor der Browser-Automatisierung; alle
 * vorgelagerten Schritte arbeiten mit der einheitlichen internen Darstellung.
 */
import type { SupplierOrderPosition } from '../types';
import { getVariantMap } from './registry';
import { resolveArticleNumber, resolveColorVariant, resolveSizeVariant } from './resolve';
import type { SupplierMappingError } from './SupplierMappingError';
import type { ResolvedSupplierPosition, ResolvedSupplierSize, SupplierVariant, SupplierVariantMap } from './types';

/**
 * Übersetzt eine Position vollständig in Lieferantenbezeichnungen.
 *
 * @param map  Optionaler Tabellen-Override. Standard: die im Registry
 *   hinterlegte Tabelle des Lieferanten der Position. Der Parameter ist
 *   ABWÄRTSKOMPATIBEL (Vorgabe-Wert) – bestehende Aufrufe bleiben
 *   unverändert; er dient v.a. Tests und Single-Supplier-Aufrufern.
 * @throws SupplierMappingError, sobald Farbe ODER eine Größe der Position
 *   beim Lieferanten nicht verfügbar oder ungültig ist.
 */
export function resolveSupplierPosition(
  position: SupplierOrderPosition,
  map: SupplierVariantMap = getVariantMap(position.supplierId)
): ResolvedSupplierPosition {
  const colorVariant = resolveColorVariant(map, position.colorId, position.productId);

  const sizeVariants: Record<string, SupplierVariant> = {};
  const sizes: ResolvedSupplierSize[] = position.sizes.map((s) => {
    const variant = resolveSizeVariant(map, s.size, position.productId);
    sizeVariants[s.size] = variant;
    return { size: s.size, supplierSize: variant.label, quantity: s.quantity };
  });

  return {
    supplierId: position.supplierId,
    productId: position.productId,
    productName: position.productName,
    articleNumber: resolveArticleNumber(map, position.productId, position.articleNumber),
    productUrl: position.productUrl,
    colorId: position.colorId,
    colorName: position.colorName,
    supplierColor: colorVariant.label,
    colorVariant,
    sizes,
    sizeVariants,
  };
}

/** Ergebnis der Sammel-Übersetzung: erfolgreiche und gescheiterte
 *  Positionen getrennt, Original-Reihenfolge über den Index bewahrt. */
export interface SupplierPositionResolution {
  resolved: ResolvedSupplierPosition[];
  failed: Array<{ index: number; position: SupplierOrderPosition; error: SupplierMappingError }>;
}

/**
 * Übersetzt mehrere Positionen und trennt Erfolge von Fehlern, ohne zu
 * werfen. Gescheiterte Positionen dürfen nicht automatisiert bestellt
 * werden – der Aufrufer verarbeitet nur `resolved`.
 *
 * @param map Optionaler Tabellen-Override für ALLE Positionen (nur sinnvoll,
 *   wenn alle denselben Lieferanten haben – der Normalfall eines Jobs).
 *   Ohne Angabe wird je Position die Registry-Tabelle genutzt.
 */
export function resolveSupplierPositions(
  positions: SupplierOrderPosition[],
  map?: SupplierVariantMap
): SupplierPositionResolution {
  const resolved: ResolvedSupplierPosition[] = [];
  const failed: SupplierPositionResolution['failed'] = [];

  positions.forEach((position, index) => {
    try {
      resolved.push(resolveSupplierPosition(position, map ?? getVariantMap(position.supplierId)));
    } catch (error) {
      // Nur unsere Mapping-Fehler abfangen; unerwartete Fehler durchreichen.
      if ((error as SupplierMappingError)?.name === 'SupplierMappingError') {
        failed.push({ index, position, error: error as SupplierMappingError });
      } else {
        throw error;
      }
    }
  });

  return { resolved, failed };
}
