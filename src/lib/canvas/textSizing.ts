import type { PrintArea, TextElement } from '@/types';
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
  printArea: PrintArea,
  /**
   * Bildpunkte je Zentimeter, wie der Konfigurator die Fläche TATSÄCHLICH
   * zeichnet (ConfiguratorCanvas: areaPx.height / boxHeightCm, bezogen auf das
   * Produktfoto). Nur mit diesem Wert entspricht die Box in cm dem, was die
   * Lineale und die Vorschau zeigen.
   *
   * Ohne Angabe gilt der ÄLTERE Näherungswert: Prozente der ganzen LEINWAND
   * statt des Produktfotos. Er weicht je nach Foto-Format um bis zu rund
   * −20 % / +18 % vom gezeichneten Maßstab ab (Hoodie-Rückseite: 3 %) – ein
   * Text wurde dadurch in zu kleinen bzw. zu großen Zentimetern gemeldet.
   * Der Konfigurator gleicht die Boxen deshalb an den echten Maßstab an
   * (ConfiguratorCanvas, "Text-Boxen an den Maßstab angleichen").
   */
  pxPerCm?: number
): TextBoxCm {
  const metrics = measureTextPx(content, fontFamily, fontSizePx, bold, italic);

  if (pxPerCm !== undefined && Number.isFinite(pxPerCm) && pxPerCm > 0) {
    return { widthCm: metrics.widthPx / pxPerCm, heightCm: metrics.heightPx / pxPerCm };
  }

  const areaPx: PixelRect = {
    x: (printArea.xPercent / 100) * CANVAS_WIDTH,
    y: (printArea.yPercent / 100) * CANVAS_HEIGHT,
    width: (printArea.widthPercent / 100) * CANVAS_WIDTH,
    height: (printArea.heightPercent / 100) * CANVAS_HEIGHT,
  };
  const scaleFactors = getScaleFactors(areaPx, printArea);

  return {
    widthCm: metrics.widthPx / scaleFactors.pxPerCmX,
    heightCm: metrics.heightPx / scaleFactors.pxPerCmY,
  };
}

export interface TextBoxAngleichung {
  fontSizePx: number;
  widthCm: number;
  heightCm: number;
}

/**
 * Bringt die gespeicherte Box eines Textes auf den tatsächlich gezeichneten
 * Maßstab (siehe computeTextBoxCm, Parameter `pxPerCm`). Liefert `null`, wenn
 * nichts zu tun ist.
 *
 * ── Die Größenregel bleibt, wie sie war ───────────────────────────────────
 * Der Konfigurator verkleinert die Schrift, sobald ein Text die empfohlene
 * Maximalgröße der Fläche überschreiten würde (ElementToolbar, TextToolPanel,
 * TemplateToolPanel, Produktwechsel). Gemessen wurde dabei bisher mit dem
 * ungenauen Näherungsmaßstab; ein Text, der dort noch "gerade passte", war in
 * Wirklichkeit bis zu 18 % größer als die Fläche – und der Server lehnt Motive
 * über der Maximalgröße ab. Würde nur die Box korrigiert, bliebe so ein Text
 * stehen, wäre aber plötzlich zu groß: Die Bestellung scheiterte erst ganz am
 * Ende. Deshalb gilt dieselbe Regel jetzt mit den echten Maßen: Passte der Text
 * bisher in die Maximalgröße und tut es nach der Korrektur nicht mehr, wird die
 * Schrift wie gewohnt (2 % Puffer) verkleinert.
 *
 * Was jemand bewusst über die Maximalgröße hinaus gezogen hat (gespeicherte Box
 * schon größer als erlaubt), wird NICHT zurückgenommen – das war nie anders:
 * Der Editor lässt es zu, die Bestellprüfung entscheidet.
 */
export function gleicheTextBoxAn(
  text: Pick<TextElement, 'content' | 'fontFamily' | 'fontSizePx' | 'bold' | 'italic' | 'widthCm' | 'heightCm'>,
  printArea: PrintArea,
  pxPerCm: number
): TextBoxAngleichung | null {
  let fontSizePx = text.fontSizePx;
  let box = computeTextBoxCm(text.content, text.fontFamily, fontSizePx, text.bold, text.italic, printArea, pxPerCm);

  const warInnerhalb = text.widthCm <= printArea.maxWidthCm && text.heightCm <= printArea.maxHeightCm;
  if (warInnerhalb && (box.widthCm > printArea.maxWidthCm || box.heightCm > printArea.maxHeightCm)) {
    const faktor = Math.min(printArea.maxWidthCm / box.widthCm, printArea.maxHeightCm / box.heightCm);
    fontSizePx = Math.max(6, fontSizePx * faktor * 0.98); // 2 % Puffer, wie ElementToolbar.updateText
    box = computeTextBoxCm(text.content, text.fontFamily, fontSizePx, text.bold, text.italic, printArea, pxPerCm);
  }

  // Toleranz gegen Rundung: sonst hielte ein Bruchteil eines Millimeters eine
  // Änderung für nötig und die Korrektur liefe in einer Endlosschleife.
  const unveraendert =
    fontSizePx === text.fontSizePx && Math.abs(box.widthCm - text.widthCm) < 0.05 && Math.abs(box.heightCm - text.heightCm) < 0.05;
  return unveraendert ? null : { fontSizePx, widthCm: box.widthCm, heightCm: box.heightCm };
}
