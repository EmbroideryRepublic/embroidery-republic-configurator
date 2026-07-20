import type { ConfigElement, PrintArea } from '@/types';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScaleFactors {
  pxPerCmX: number;
  pxPerCmY: number;
}

/**
 * Berechnet den Umrechnungsfaktor Pixel↔Zentimeter für einen Druckbereich.
 * Grundlage: die tatsächliche Pixelgröße des Druckbereichs auf dem Canvas
 * im Verhältnis zu seiner realen Größe in cm (aus der Produktdatenbank).
 */
export function getScaleFactors(printAreaPx: PixelRect, printArea: PrintArea): ScaleFactors {
  const pxPerCm = printAreaPx.height / printArea.referenceGarmentHeightCm;
  return {
    pxPerCmX: pxPerCm,
    pxPerCmY: pxPerCm,
  };
}

export function pxToCm(px: number, pxPerCm: number): number {
  return px / pxPerCm;
}

export function cmToPx(cm: number, pxPerCm: number): number {
  return cm * pxPerCm;
}

/**
 * Wandelt die in cm gespeicherte Position/Größe eines Elements in einen
 * Pixel-Rect innerhalb des Druckbereichs um. Bewusst als eigenständige,
 * exportierte Funktion (statt privat im Editor), damit der Browser-Editor
 * (ConfiguratorCanvas.tsx) und das serverseitige Druckvorschau-Rendering
 * (src/lib/rendering/) exakt dieselbe Umrechnung verwenden und geometrisch
 * niemals auseinanderdriften.
 */
export function elementToPixelRect(
  areaPx: PixelRect,
  scaleFactors: ScaleFactors,
  element: Pick<ConfigElement, 'xCm' | 'yCm' | 'widthCm' | 'heightCm'>
): PixelRect {
  return {
    x: areaPx.x + element.xCm * scaleFactors.pxPerCmX,
    y: areaPx.y + element.yCm * scaleFactors.pxPerCmY,
    width: element.widthCm * scaleFactors.pxPerCmX,
    height: element.heightCm * scaleFactors.pxPerCmY,
  };
}
