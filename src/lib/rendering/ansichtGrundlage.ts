import { CANVAS_WIDTH, CANVAS_HEIGHT, getProduct } from '@/config/products';
import { bildFuerAnsicht } from '@/lib/assets';
import { getPrintAreas, flaecheFuerGroesse } from '@/config/printAreas';
import { kleinsteBestellteGroesse, groessenLeiterVon } from '@/config/products/groessen';
import { getContainRect } from '@/lib/canvas/containRect';
import type { PrintArea } from '@/types';
import { loadGarmentImageInfo, type GarmentImageInfo } from './garmentImageInfo';
import type { RenderPrintViewInput } from './types';

/**
 * Alles, was die Produktionsvorschau (renderPrintView.ts) und der Text-
 * Download (renderTextJpg.ts) über EINE Ansicht einer Bestellposition
 * wissen müssen, um Motive im richtigen Maßstab zu zeichnen.
 *
 * Aus renderPrintView herausgelöst, damit beide Wege garantiert dieselbe
 * Fläche und denselben Maßstab (Pixel je cm) verwenden – ein zweites,
 * nachgebautes Rechenstück könnte sonst unbemerkt davonlaufen, und ein Text
 * wäre im Download anders groß als in der Vorschau, die der Kunde sah.
 */
export interface AnsichtGrundlage {
  garment: GarmentImageInfo;
  /** Dieselbe, größenabhängig aufgelöste Druckfläche wie bei der
   *  Bestellprüfung (orderValidation.ts) und im Editor. */
  printArea: PrintArea;
  /** Bildpunkte je Zentimeter im LOGISCHEN Canvas (CANVAS_WIDTH ×
   *  CANVAS_HEIGHT) – in diesem Maß sind fontSizePx und letterSpacing der
   *  Text-Elemente gespeichert. */
  pxPerCmLogisch: number;
}

/**
 * Lädt Produktbild und Druckfläche der Ansicht und rechnet den Maßstab aus.
 *
 * Liefert `null`, wenn für diese Ansicht kein Herstellerbild oder keine
 * Druckfläche existiert (offenes View-Modell: nicht jedes Produkt führt jede
 * Ansicht) – kein Fehler, dann gibt es eben nichts zu zeichnen. Wirft bei
 * einer unbekannten Produkt-/Farbkennung (Datenfehler).
 */
export async function ladeAnsichtGrundlage(
  input: Pick<RenderPrintViewInput, 'productId' | 'colorId' | 'view' | 'printMethod' | 'sizeQuantities'>
): Promise<AnsichtGrundlage | null> {
  const product = getProduct(input.productId);
  if (!product) throw new Error(`Unbekannte Produkt-ID "${input.productId}".`);
  const color = product.colors.find((c) => c.id === input.colorId);
  if (!color) throw new Error(`Unbekannte Farb-ID "${input.colorId}" für Produkt "${input.productId}".`);
  const imagePath = bildFuerAnsicht(input.productId, input.colorId, input.view);
  // Kein Herstellerbild für diese Ansicht (offenes View-Modell: nicht jedes
  // Produkt führt jede Ansicht) → keine Produktionsvorschau für diese Ansicht,
  // analog zur fehlenden Druckfläche unten. Kein Fehler.
  if (!imagePath) return null;

  const printAreas = await getPrintAreas(input.productId, input.printMethod);
  const printAreaRoh = printAreas.find((a) => a.view === input.view);
  if (!printAreaRoh) return null;
  // Dieselbe Fläche wie bei der Bestellprüfung (orderValidation.ts) und im
  // Editor (ConfiguratorPrototype.tsx) – gegen die kleinste bestellte Größe
  // dieser Position aufgelöst, sonst platziert das Produktionsbild die
  // Elemente in einem anderen Maßstab als der, gegen den geprüft wurde.
  const groesseFuerFlaeche = kleinsteBestellteGroesse(input.sizeQuantities, groessenLeiterVon(product));
  const printArea = flaecheFuerGroesse(printAreaRoh, groesseFuerFlaeche);

  const garment = await loadGarmentImageInfo(imagePath);

  // Logische Geometrie (renderScale=1) NUR um pxPerCm zu ermitteln, damit die
  // Ziel-DPI unabhängig vom tatsächlichen Zuschnitt/Seitenverhältnis des
  // jeweiligen Produktfotos konsistent ist.
  const imageRectLogical = getContainRect(garment.naturalWidth, garment.naturalHeight, CANVAS_WIDTH, CANVAS_HEIGHT, printArea.heightPercent / 100);
  const areaPxHeightLogical = (printArea.heightPercent / 100) * imageRectLogical.height;
  const pxPerCmLogisch = areaPxHeightLogical / printArea.boxHeightCm;

  return { garment, printArea, pxPerCmLogisch };
}
