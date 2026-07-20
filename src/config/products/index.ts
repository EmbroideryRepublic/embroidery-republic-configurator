/**
 * Registry aller Produktmarken – das ist der einzige Ort, den eine neue
 * Marke anfassen muss, um sich in den Katalog einzuklinken.
 *
 * Eine neue Marke (z.B. Gildan) hinzufügen:
 * 1. src/config/products/<marke>.ts anlegen, `PRODUCTS: ProductConfig[]`
 *    exportieren (realPhotoColorSet/svgColorSet aus colorHelpers.ts
 *    wiederverwenden, neue Farben additiv in COLOR_META ergänzen).
 * 2. Fotos unter public/products/<marke>-<modell>[-<farbe>]/... ablegen.
 * 3. Druckflächen-Einträge in src/config/printAreas.ts ergänzen (Pflicht –
 *    ein Produkt ohne MEASURED-Eintrag bekommt keine Druckfläche).
 * 4. Hier unten eine Import- + eine Spread-Zeile ergänzen.
 * 5. Build + visueller Check im Konfigurator.
 *
 * Lieferantenarchitektur: Ein neues Produkt fließt AUTOMATISCH in Mapping,
 * Coverage-Report und Konsistenz-Tests (alles iteriert über PRODUCTS). Nur
 * zwei VERIFIZIERTE Datenpunkte müssen von Hand nach (kein Raten):
 * (a) Bezugsquelle in supplierRefs.ts (articleNumber/URL), sonst erscheint das
 *     Produkt im Coverage-Status unter „ohne Lieferantenzuordnung";
 * (b) neue Farben/Größen in mapping/tables/<lieferant>.ts bzw. als verifizierte
 *     Overrides. Fehlt etwas, listet `npm run coverage:suppliers` es als offene
 *     Aufgabe und `catalogConsistency.test.ts` schlägt bei fehlendem Mapping an.
 * Details: docs/lieferanten-integrationen.md → „Automatische Integration".
 */
import { PRODUCTS as FRUIT_OF_THE_LOOM_PRODUCTS } from './fruitOfTheLoom';
import { PRODUCTS as SOLS_PRODUCTS } from './sols';
import { PRODUCTS as GILDAN_PRODUCTS } from './gildan';
import { PRODUCTS as RUSSELL_PRODUCTS } from './russell';
import { PRODUCTS as NEUTRAL_PRODUCTS } from './neutral';
import { PRODUCTS as JUSTHOODS_PRODUCTS } from './justhoods';
import { PRODUCTS as BANDC_PRODUCTS } from './bAndC';
import { PRODUCTS as STEDMAN_PRODUCTS } from './stedman';
import { PRODUCTS as JAMES_NICHOLSON_PRODUCTS } from './jamesNicholson';
import { SUPPLIER_REFS } from './supplierRefs';
import type { ProductConfig } from './types';

// Lieferanten-Referenz (Bezugsquelle für die Supplier Engine) wird hier
// zentral angeheftet statt in den Marken-Dateien gepflegt – siehe
// supplierRefs.ts. Produkte ohne Eintrag behalten supplier: undefined.
const RAW_PRODUCTS: ProductConfig[] = [
  ...FRUIT_OF_THE_LOOM_PRODUCTS,
  ...SOLS_PRODUCTS,
  ...GILDAN_PRODUCTS,
  ...RUSSELL_PRODUCTS,
  ...NEUTRAL_PRODUCTS,
  ...JUSTHOODS_PRODUCTS,
  ...BANDC_PRODUCTS,
  ...STEDMAN_PRODUCTS,
  ...JAMES_NICHOLSON_PRODUCTS,
];

export const PRODUCTS: ProductConfig[] = RAW_PRODUCTS.map((product) =>
  SUPPLIER_REFS[product.id] ? { ...product, supplier: SUPPLIER_REFS[product.id] } : product
);

export const TEST_PRODUCT_ID = PRODUCTS[0]?.id ?? '';

export function getProduct(productId: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.id === productId);
}

export { CANVAS_WIDTH, CANVAS_HEIGHT } from './colorHelpers';
export * from './types';
