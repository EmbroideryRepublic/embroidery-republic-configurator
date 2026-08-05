/**
 * Alias-bewusste Single-Source der Druckflächen-Daten.
 *
 * Vereint die GEMESSENEN Flächen (printAreaData.generated.ts) mit der
 * Klassen-Übernahme (printAreaAlias.generated.ts): Ein neu importiertes
 * Produkt ohne eigene Messung erhält hier die Flächen des zugeordneten
 * Bestandsprodukts gleicher Klasse – transparent für ALLE Konsumenten
 * (Konfigurator, Produktseite, Tests), die dadurch aliasierte Produkte
 * genauso sehen wie gemessene.
 *
 * Jeder Verbraucher importiert PRINT_AREA_DATA von HIER, nicht direkt aus der
 * generierten Datei – so gibt es genau eine Wahrheit über die Flächen.
 */
import { PRINT_AREA_DATA as GEMESSEN, type GeneratedArea } from './printAreaData.generated';
import { GEOMETRY_ALIAS } from './printAreaAlias.generated';

const merged: Record<string, Partial<Record<import('@/types').PrintView, GeneratedArea>>> = { ...GEMESSEN };
for (const [neu, rep] of Object.entries(GEOMETRY_ALIAS)) {
  const flaechen = GEMESSEN[rep];
  if (flaechen) merged[neu] = flaechen;
}

export const PRINT_AREA_DATA = merged;
export type { GeneratedArea };
