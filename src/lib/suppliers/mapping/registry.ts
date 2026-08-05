/**
 * Zentrale Mapping-Registry – die EINZIGE Stelle, an der jedem Lieferanten
 * seine Variantentabelle zugeordnet wird.
 *
 * `SupplierId` ist eine OFFENE ID (`string`, ADR 0004); Vollständigkeit erzwingt
 * daher NICHT der Compiler, sondern der Wächter-Test (`../__tests__/registry.test.ts`):
 * fehlt einem registrierten Lieferanten die Tabelle (oder umgekehrt), schlägt der
 * Test an – ein vergessenes Mapping wird so vor dem Merge sichtbar, statt erst im
 * fail-loud `getVariantMap` zur Laufzeit.
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

/** Variantentabelle eines Lieferanten. Fail-loud: unbekannte ID wirft mit klarer
 *  Meldung (SupplierId ist offen; Wächter-Test sichert, dass jeder genutzte
 *  Lieferant eine Tabelle hat). */
export function getVariantMap(id: SupplierId): SupplierVariantMap {
  const map = SUPPLIER_VARIANT_MAPS[id];
  if (!map) {
    throw new Error(`Keine Variantentabelle für Lieferant "${id}" registriert (mapping/registry.ts).`);
  }
  return map;
}
