import type { PrintArea } from '@/types';

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
