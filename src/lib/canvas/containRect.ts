import type { PrintArea } from '@/types';
import type { PixelRect } from './cmConversion';

/**
 * Berechnet die tatsächlich sichtbare Bild-Fläche innerhalb der Canvas,
 * OHNE das Seitenverhältnis zu verzerren ("contain"-Fit, mittig zentriert).
 *
 * Statt das GESAMTE Bild in die Leinwand einzupassen (wodurch Produkte mit
 * unterschiedlich viel Leerraum im Foto unterschiedlich groß/klein wirken),
 * wird die Skalierung anhand der tatsächlich vermessenen Kleidungsstück-
 * Fläche berechnet – das Kleidungsstück selbst nimmt dadurch bei jedem
 * Produkt einen ähnlichen Anteil der Leinwandhöhe ein (targetGarmentFraction),
 * unabhängig davon, wie eng oder großzügig das jeweilige Foto zugeschnitten
 * ist.
 *
 * Bewusst reine Zahlen-Arithmetik ohne DOM-Abhängigkeit (kein `document`/
 * `window`/`Image`) – dadurch aus dem Browser-Editor (ConfiguratorCanvas.tsx)
 * UND dem serverseitigen Druckvorschau-Rendering (src/lib/rendering/)
 * identisch verwendbar, damit beide geometrisch niemals auseinanderdriften.
 */
export function getContainRect(
  naturalWidth: number,
  naturalHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  garmentHeightFraction = 1,
  targetGarmentFraction = 0.74
): PixelRect {
  const garmentHeightPx = naturalHeight * garmentHeightFraction;
  const scaleForGarmentHeight = (targetGarmentFraction * canvasHeight) / garmentHeightPx;
  const scaleForCanvasWidth = canvasWidth / naturalWidth;
  const scale = Math.min(scaleForGarmentHeight, scaleForCanvasWidth);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Positioniert den Druckbereich (in Prozent von imageRect definiert)
 * relativ zur tatsächlichen Bild-Fläche (nicht relativ zur vollen Canvas).
 */
export function computeAreaPx(imageRect: PixelRect, printArea: PrintArea): PixelRect {
  return {
    x: imageRect.x + (printArea.xPercent / 100) * imageRect.width,
    y: imageRect.y + (printArea.yPercent / 100) * imageRect.height,
    width: (printArea.widthPercent / 100) * imageRect.width,
    height: (printArea.heightPercent / 100) * imageRect.height,
  };
}
