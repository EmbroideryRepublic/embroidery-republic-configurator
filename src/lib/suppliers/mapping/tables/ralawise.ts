/**
 * Variantentabelle für ralawise.com.
 *
 * BEWUSST NOCH LEER: aktuell ist kein Katalogprodukt diesem Lieferanten
 * zugeordnet. Gleiche Sicherheitslogik wie bei wordans.ts – ohne gepflegte
 * Tabelle schlägt jede Übersetzung mit klarem Fehler fehl, statt falsche
 * Werte zu automatisieren.
 *
 * BESONDERHEIT für die spätere Befüllung: Ralawise ist ein britischer Shop
 * und verwendet voraussichtlich ENGLISCHE Farb- und Größenbezeichnungen –
 * genau der Fall, für den diese Mapping-Schicht existiert. Beispiele beim
 * Befüllen (real im Shop zu verifizieren, hier NICHT geraten):
 *   navy → "French Navy", grey → "Sport Grey", XXL → "2XL" o.ä.
 * Deshalb die interne Darstellung strikt kanonisch halten und die
 * Abweichungen ausschließlich hier abbilden.
 */
import type { SupplierVariantMap } from '../types';

export const ralawiseMap: SupplierVariantMap = {
  supplierId: 'ralawise',
  colors: {},
  sizes: {},
  labelsVerified: false,
};
