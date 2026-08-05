import type { ProductConfig } from '@/config/products/types';
import type { PrintView } from '@/types';
import { PRINT_AREA_DATA } from '@/config/printAreaData';
import { sortierePositionen, istGueltigeView } from '@/config/decorationPositions';

/**
 * EINZIGE Laufzeit-Quelle „welche Druckansichten hat dieses Produkt".
 *
 * Bevorzugt die explizite Konfiguration (`product.views`); ist sie nicht
 * gesetzt, werden die Ansichten aus den hinterlegten Druckflächen abgeleitet
 * (`PRINT_AREA_DATA` – bereits pro Produkt gepflegt, inkl. Klassen-Alias).
 * Das Ergebnis ist immer:
 *   - auf in der View-Registry (decorationPositions.ts) bekannte Views gefiltert,
 *   - in fachlicher Reihenfolge sortiert.
 *
 * Konfigurator, Produktbrowser, Produktionsdaten, Canvas und Validierung sollen
 * ausschließlich hierüber ermitteln, welche Ansichten existieren – niemals über
 * feste front/back/sleeve-Listen. Siehe docs/adr/0001-generische-druckansichten.md.
 */
// Ergebnis je Produkt memoisieren: ansichtenVon läuft in Render-Pfaden und lieferte
// sonst bei jedem Aufruf ein NEUES Array (Object.keys + filter + Spread/Sort), obwohl
// es nur vom (stabilen) Produktobjekt abhängt. WeakMap = stabile Referenz + keine
// Wiederberechnung; kein Leak, da an die Produktlebensdauer gebunden. Ergebnis wird
// ausschließlich lesend genutzt.
const ansichtenCache = new WeakMap<ProductConfig, PrintView[]>();

export function ansichtenVon(product: ProductConfig): PrintView[] {
  const gecacht = ansichtenCache.get(product);
  if (gecacht) return gecacht;
  const roh = product.views ?? Object.keys(PRINT_AREA_DATA[product.id] ?? {});
  const ergebnis = sortierePositionen(roh.filter(istGueltigeView));
  ansichtenCache.set(product, ergebnis);
  return ergebnis;
}

/** Führt das Produkt diese Ansicht? */
export function hatAnsicht(product: ProductConfig, view: PrintView): boolean {
  return ansichtenVon(product).includes(view);
}
