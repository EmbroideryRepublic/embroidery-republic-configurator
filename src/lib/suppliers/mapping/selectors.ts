/**
 * Auswahl-Strategie für die Playwright-Automatisierung.
 *
 * Kernidee der Erweiterung: Die Automatisierung soll NICHT allein auf
 * sichtbaren Text (der übersetzt/umbenannt werden kann) angewiesen sein.
 * Hat eine Variante stabile Lieferantenkennungen, werden diese bevorzugt.
 *
 * `preferredVariantSelector` ist rein und trifft diese Entscheidung
 * deterministisch – der (spätere) Adapter fragt sie ab und wählt die
 * konkrete Browser-Interaktion passend zur Strategie:
 *   variant-id   → Element über data-/DOM-Variant-ID ansteuern
 *   select-value → <option value="…"> im Dropdown wählen
 *   sku          → Variante über die SKU identifizieren/verifizieren
 *   label        → Fallback: sichtbaren Text anklicken
 *
 * Reihenfolge = absteigende Stabilität. `label` ist immer vorhanden und
 * damit der garantierte Fallback.
 */
import type { SupplierVariant } from './types';

export type VariantSelectorStrategy = 'variant-id' | 'select-value' | 'sku' | 'label';

export interface VariantSelector {
  strategy: VariantSelectorStrategy;
  value: string;
}

/**
 * Kanonische Reihenfolge absteigender Stabilität – die EINZIGE Definition
 * dieser Priorität. Sowohl preferredVariantSelector als auch die
 * Auswahl-Engine (adapters/selectionEngine) leiten ihre Wahl hieraus ab, um
 * doppelte Reihenfolge-Logik zu vermeiden.
 */
export const VARIANT_STRATEGY_ORDER: readonly VariantSelectorStrategy[] = [
  'variant-id',
  'select-value',
  'sku',
  'label',
];

/** Wert der Variante für eine Strategie (label immer gesetzt, Rest optional). */
export function variantValueFor(variant: SupplierVariant, strategy: VariantSelectorStrategy): string | undefined {
  switch (strategy) {
    case 'variant-id':
      return variant.variantId;
    case 'select-value':
      return variant.selectValue;
    case 'sku':
      return variant.sku;
    case 'label':
      return variant.label;
  }
}

/**
 * Wählt die stabilste verfügbare Kennung einer Variante. Voraussetzung:
 * die Variante wurde bereits über resolve*Variant() aufgelöst und damit
 * validiert (nicht-leeres Label, keine leeren ID-Felder).
 */
export function preferredVariantSelector(variant: SupplierVariant): VariantSelector {
  for (const strategy of VARIANT_STRATEGY_ORDER) {
    const value = variantValueFor(variant, strategy);
    if (value) return { strategy, value };
  }
  // Unerreichbar (label ist stets vorhanden), aber typsicher abgesichert.
  return { strategy: 'label', value: variant.label };
}

/** true, wenn die Variante mindestens eine stabile Kennung trägt (also
 *  nicht nur auf den sichtbaren Text angewiesen ist). */
export function hasStableIdentifier(variant: SupplierVariant): boolean {
  return Boolean(variant.variantId || variant.selectValue || variant.sku);
}
