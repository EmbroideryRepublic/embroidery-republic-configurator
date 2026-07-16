import type { PrintArea } from '@/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products';
import { getScaleFactors, type PixelRect } from './cmConversion';
import { measureTextPx } from './measureText';

export interface TextBoxCm {
  widthCm: number;
  heightCm: number;
}

/**
 * Berechnet die tatsächliche Text-Box in cm aus Inhalt/Schriftart/-größe,
 * basierend auf echten Canvas-Textmetriken (nicht auf einer frei
 * skalierbaren Platzhalter-Box). Wird sowohl beim Erstellen eines neuen
 * Text-Elements als auch bei jeder Änderung (Inhalt, Schrift, Größe,
 * Fett/Kursiv) erneut aufgerufen, damit die für die Preisberechnung
 * genutzte Fläche immer der sichtbaren Textgröße entspricht.
 */
export function computeTextBoxCm(
  content: string,
  fontFamily: string,
  fontSizePx: number,
  bold: boolean,
  italic: boolean,
  printArea: PrintArea
): TextBoxCm {
  const areaPx: PixelRect = {
    x: (printArea.xPercent / 100) * CANVAS_WIDTH,
    y: (printArea.yPercent / 100) * CANVAS_HEIGHT,
    width: (printArea.widthPercent / 100) * CANVAS_WIDTH,
    height: (printArea.heightPercent / 100) * CANVAS_HEIGHT,
  };
  const scaleFactors = getScaleFactors(areaPx, printArea);
  const metrics = measureTextPx(content, fontFamily, fontSizePx, bold, italic);

  return {
    widthCm: metrics.widthPx / scaleFactors.pxPerCmX,
    heightCm: metrics.heightPx / scaleFactors.pxPerCmY,
  };
}
