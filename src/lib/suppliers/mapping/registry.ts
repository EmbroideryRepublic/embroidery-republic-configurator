/**
 * Zentrale Mapping-Registry – die EINZIGE Stelle, an der jedem Lieferanten
 * seine Variantentabelle zugeordnet wird.
 *
 * `Record<SupplierId, SupplierVariantMap>` erzwingt Vollständigkeit: wird
 * die SupplierId-Union (../types) um einen Lieferanten erweitert,
 * kompiliert das Projekt erst wieder, wenn hier auch seine Tabelle
 * eingetragen ist – ein vergessenes Mapping ist ein Compile-Fehler, kein
 * stiller Laufzeitfehler.
 *
 * Bewusst getrennt von der Adapter-Registry (../registry.ts): Adapter
 * kapseln die Browser-Steuerung, diese Registry die Datenübersetzung. Ein
 * Lieferant kann seine Übersetzungstabellen unabhängig vom (noch nicht
 * implementierten) Browser-Adapter pflegen.
 */
import type { SupplierId } from '../types';
import type { SupplierVariantMap } from './types';
import { textilGrosshandelMap } from './tables/textilGrosshandel';
import { wordansMap } from './tables/wordans';
import { needenMap } from './tables/needen';
import { ralawiseMap } from './tables/ralawise';

export const SUPPLIER_VARIANT_MAPS: Record<SupplierId, SupplierVariantMap> = {
  'textil-grosshandel': textilGrosshandelMap,
  wordans: wordansMap,
  needen: needenMap,
  ralawise: ralawiseMap,
};

/** Variantentabelle eines Lieferanten (immer vorhanden – Record ist über
 *  die SupplierId-Union vollständig typgeprüft). */
export function getVariantMap(id: SupplierId): SupplierVariantMap {
  return SUPPLIER_VARIANT_MAPS[id];
}
