import type { PrintMethod, PrintView } from '@/types';

/**
 * Bewusst entkoppelt von OrderElementRecord/Supabase: eine RenderableElement
 * hat bereits alle Bytes/Werte geladen, die zum Zeichnen gebraucht werden.
 * Ein Aufrufer (orders.ts oder später ein Reprint-Werkzeug) baut diese aus
 * gespeicherten Bestelldaten, renderPrintView() selbst lädt nichts aus
 * Supabase nach.
 */
export interface RenderableLogoElement {
  type: 'logo';
  view: PrintView;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotationDeg: number;
  /** PNG-Bytes der tatsächlich angezeigten Version (display_file_url,
   *  Fallback auf original_file_url bei Alt-Datensätzen vor Migration 0003). */
  imageBuffer: Buffer;
}

export interface RenderableTextElement {
  type: 'text';
  view: PrintView;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotationDeg: number;
  content: string;
  fontFamily: string;
  fontSizePx: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  hasShadow: boolean;
  hasOutline: boolean;
  outlineColor: string;
}

export type RenderableElement = RenderableLogoElement | RenderableTextElement;

export interface RenderPrintViewInput {
  productId: string;
  colorId: string;
  view: PrintView;
  printMethod: PrintMethod;
  /** Bereits auf diese Ansicht gefiltert, in der ursprünglichen
   *  Ebenen-Reihenfolge (Array-Reihenfolge == Zeichenreihenfolge, analog zu
   *  Konvas impliziter Paint-Order im Editor). */
  elements: RenderableElement[];
  /**
   * Stückzahl je Größe dieser Bestellposition – bestimmt, gegen welche
   * größenabhängige Druckfläche gerendert wird (config/printAreas.ts,
   * flaecheFuerGroesse). MUSS dieselbe Größe ergeben wie die Prüfung in
   * orderValidation.ts (dieselbe Funktion, kleinsteBestellteGroesse), sonst
   * platziert das Produktionsbild die Elemente in einem ANDEREN Maßstab, als
   * der Kunde im Editor gesehen und wogegen validiert wurde.
   */
  sizeQuantities: Record<string, number>;
}

export interface RenderPrintViewResult {
  pngBuffer: Buffer;
  widthPx: number;
  heightPx: number;
}
