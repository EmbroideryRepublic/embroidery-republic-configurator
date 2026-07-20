/**
 * Variantentabelle für wordans.de.
 *
 * BEWUSST NOCH LEER: aktuell ist kein Katalogprodukt diesem Lieferanten
 * zugeordnet (wordans.de lieferte bei der Recherche zeitweise HTTP 500).
 * Eine leere Tabelle ist die sichere Voreinstellung – sollte doch ein
 * Produkt auf Wordans zeigen, ohne dass hier Farben/Größen gepflegt sind,
 * schlägt die Übersetzung mit einem klaren SupplierMappingError fehl und
 * die Position wird NICHT automatisiert bestellt (statt stillschweigend
 * falsche Werte in den Shop einzugeben).
 *
 * Befüllen, sobald das erste Wordans-Produkt aufgenommen wird: die
 * verwendeten internen Farb-IDs/Größen den Shop-Bezeichnungen zuordnen
 * (Vorlage: textilGrosshandel.ts) und labelsVerified nach dem Abgleich
 * im realen Shop auf true setzen.
 */
import type { SupplierVariantMap } from '../types';

export const wordansMap: SupplierVariantMap = {
  supplierId: 'wordans',
  colors: {},
  sizes: {},
  labelsVerified: false,
};
