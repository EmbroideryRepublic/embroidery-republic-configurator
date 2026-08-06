/**
 * ERZEUGTE DATEI – nicht von Hand bearbeiten.
 *
 * Quelle: scripts/generatePrintAreaData.mts
 * Modell: Bildkontur (Position) + verifizierte Herstellermaße (Größe)
 *         + Prozessgrenzen der Veredelung (Deckelung).
 *
 * Herleitung und Quellenlage: docs/recherche-herstellermasse.md
 * Neu erzeugen: npx tsx --tsconfig tsconfig.scripts.json \
 *               scripts/generatePrintAreaData.mts
 */
import type { PrintView } from '@/types';

export interface GeneratedArea {
  /** Position im Bild, Prozent der Bildkante. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  imgW: number;
  imgH: number;
  /** Effektiv nutzbar in cm: Kleidungsstückmaß, gedeckelt durch die
   *  Prozessgrenze der Veredelung. Das ist der Wert, der gilt. */
  maxWidthCm: number;
  maxHeightCm: number;
  /** WAHRE cm-Ausdehnung der gezeichneten Box (Bewegungsbereich).
   *  Grundlage der Pixel↔Zentimeter-Umrechnung im Canvas. Bei Vorder-/
   *  Rückseite gleich maxWidthCm/maxHeightCm; auf der Ärmelansicht
   *  deutlich größer, weil dort die ganze Stofffläche bewegbar ist. */
  boxWidthCm: number;
  boxHeightCm: number;
  /** Startposition eines neu eingefügten Motivs innerhalb der Box (cm).
   *  Nur auf der Ärmelansicht gesetzt: Der Bewegungsbereich umfasst dort
   *  das ganze Kleidungsstück, das Motiv soll aber mittig auf dem
   *  Oberarm beginnen. */
  startXCm?: number;
  startYCm?: number;
  /** Aus dem Kleidungsstück abgeleitet, UNGEDECKELT – macht sichtbar,
   *  ob die Prozessgrenze oder der Schnitt die Fläche begrenzt. */
  garmentWidthCm: number;
  garmentHeightCm: number;
}

export const PRINT_AREA_DATA: Record<string, Partial<Record<PrintView, GeneratedArea>>> = {
  'fotl-heavy-t': {
    front: { x0: 31.8, y0: 19, x1: 70.8, y1: 86, imgW: 668, imgH: 726, maxWidthCm: 28.9, maxHeightCm: 47, boxWidthCm: 28.9, boxHeightCm: 54, garmentWidthCm: 47, garmentHeightCm: 60 },
    back: { x0: 32, y0: 19, x1: 69.4, y1: 86, imgW: 661, imgH: 711, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.8, garmentWidthCm: 47, garmentHeightCm: 60 },
    sleeve_left: { x0: 36.1, y0: 7.1, x1: 67.6, y1: 91.5, imgW: 663, imgH: 729, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.4, boxHeightCm: 68.9, startXCm: 11.7, startYCm: 14.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.1, y0: 7.1, x1: 65.6, y1: 91.5, imgW: 663, imgH: 729, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.4, boxHeightCm: 68.9, startXCm: 11.7, startYCm: 14.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-valueweight-vneck': {
    front: { x0: 31.7, y0: 34, x1: 69.2, y1: 82, imgW: 602, imgH: 691, maxWidthCm: 24.2, maxHeightCm: 35.6, boxWidthCm: 24.2, boxHeightCm: 35.6, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    back: { x0: 31.1, y0: 16.3, x1: 68.2, y1: 82, imgW: 681, imgH: 736, maxWidthCm: 25.3, maxHeightCm: 47, boxWidthCm: 25.3, boxHeightCm: 48.4, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    sleeve_left: { x0: 35.4, y0: 6.8, x1: 68.3, y1: 89.8, imgW: 641, imgH: 735, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.4, boxHeightCm: 61.9, startXCm: 10.4, startYCm: 8.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 31.5, y0: 6.8, x1: 64.5, y1: 89.8, imgW: 641, imgH: 735, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.4, boxHeightCm: 61.9, startXCm: 11, startYCm: 8.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-original-longsleeve': {
    front: { x0: 29.9, y0: 20, x1: 71.5, y1: 86, imgW: 668, imgH: 723, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.5, garmentWidthCm: 47, garmentHeightCm: 58 },
    back: { x0: 31.4, y0: 20, x1: 74.1, y1: 86, imgW: 654, imgH: 741, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 52.5, garmentWidthCm: 47, garmentHeightCm: 58 },
    sleeve_left: { x0: 35.8, y0: 7.8, x1: 65.7, y1: 91.2, imgW: 677, imgH: 743, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.8, boxHeightCm: 66.9, startXCm: 11.1, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 36.1, y0: 7.8, x1: 65.8, y1: 91.2, imgW: 677, imgH: 743, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.8, boxHeightCm: 66.9, startXCm: 10.7, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-original-vneck': {
    front: { x0: 31.7, y0: 27, x1: 70.2, y1: 86, imgW: 667, imgH: 732, maxWidthCm: 28.4, maxHeightCm: 47, boxWidthCm: 28.4, boxHeightCm: 47.8, garmentWidthCm: 47, garmentHeightCm: 58 },
    back: { x0: 31.8, y0: 18.2, x1: 69.6, y1: 86, imgW: 655, imgH: 737, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 54.7, garmentWidthCm: 47, garmentHeightCm: 58 },
    sleeve_left: { x0: 35.6, y0: 7.9, x1: 66.7, y1: 87.4, imgW: 569, imgH: 780, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19, boxHeightCm: 66.9, startXCm: 9.5, startYCm: 15.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.5, y0: 7.9, x1: 65.5, y1: 87.4, imgW: 569, imgH: 780, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19, boxHeightCm: 66.9, startXCm: 9.5, startYCm: 15.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-original-t': {
    front: { x0: 32, y0: 20, x1: 68, y1: 80, imgW: 632, imgH: 685, maxWidthCm: 24.7, maxHeightCm: 44.6, boxWidthCm: 24.7, boxHeightCm: 44.6, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    back: { x0: 32, y0: 20, x1: 68, y1: 80, imgW: 624, imgH: 698, maxWidthCm: 24.1, maxHeightCm: 45, boxWidthCm: 24.1, boxHeightCm: 45, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    sleeve_left: { x0: 33.4, y0: 8.7, x1: 63.6, y1: 88.9, imgW: 650, imgH: 717, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 12.7, boxHeightCm: 37.1, startXCm: 6.6, startYCm: 9.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 36.4, y0: 8.7, x1: 66.6, y1: 88.9, imgW: 650, imgH: 717, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 12.7, boxHeightCm: 37.1, startXCm: 6.1, startYCm: 9.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-iconic195-longsleeve': {
    front: { x0: 31, y0: 20, x1: 69, y1: 82, imgW: 662, imgH: 682, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 53.6, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 31, y0: 20, x1: 69, y1: 82, imgW: 595, imgH: 669, maxWidthCm: 29.1, maxHeightCm: 47, boxWidthCm: 29.1, boxHeightCm: 53.4, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.5, y0: 7.3, x1: 63.9, y1: 91, imgW: 616, imgH: 689, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 69.9, startXCm: 11.1, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 36, y0: 7.3, x1: 64.3, y1: 91, imgW: 616, imgH: 689, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 69.9, startXCm: 10.1, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-pure-cotton-t': {
    front: { x0: 28, y0: 17.5, x1: 70, y1: 86, imgW: 632, imgH: 816, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 60.4, garmentWidthCm: 47, garmentHeightCm: 60 },
    back: { x0: 28, y0: 17.2, x1: 70, y1: 86, imgW: 644, imgH: 787, maxWidthCm: 29.4, maxHeightCm: 47, boxWidthCm: 29.4, boxHeightCm: 58.8, garmentWidthCm: 47, garmentHeightCm: 60 },
    sleeve_left: { x0: 33.7, y0: 7.4, x1: 62.9, y1: 87.6, imgW: 608, imgH: 798, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.2, boxHeightCm: 68.9, startXCm: 9.9, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 36.9, y0: 7.4, x1: 66.2, y1: 87.6, imgW: 608, imgH: 798, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.2, boxHeightCm: 68.9, startXCm: 9.2, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-super-premium-t': {
    front: { x0: 30.6, y0: 20, x1: 70.2, y1: 86, imgW: 632, imgH: 722, maxWidthCm: 29.3, maxHeightCm: 47, boxWidthCm: 29.3, boxHeightCm: 55.8, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 30.4, y0: 20, x1: 69.3, y1: 86, imgW: 653, imgH: 707, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 55.2, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 37, y0: 5, x1: 66.1, y1: 86.2, imgW: 620, imgH: 707, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.9, boxHeightCm: 69.9, startXCm: 11.5, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.2, y0: 5, x1: 63.3, y1: 86.2, imgW: 620, imgH: 707, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.9, boxHeightCm: 69.9, startXCm: 10.5, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-valueweight-t': {
    front: { x0: 33.2, y0: 20, x1: 67.4, y1: 86, imgW: 613, imgH: 733, maxWidthCm: 25.6, maxHeightCm: 47, boxWidthCm: 25.6, boxHeightCm: 59.1, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 34.3, y0: 20, x1: 68.7, y1: 86, imgW: 589, imgH: 773, maxWidthCm: 23.2, maxHeightCm: 47, boxWidthCm: 23.2, boxHeightCm: 58.3, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.2, y0: 7.5, x1: 65.9, y1: 87.1, imgW: 497, imgH: 756, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 17.7, boxHeightCm: 69.9, startXCm: 9.1, startYCm: 13.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.1, y0: 7.5, x1: 64.7, y1: 87.1, imgW: 497, imgH: 756, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 17.6, boxHeightCm: 69.9, startXCm: 8.6, startYCm: 13.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-valueweight-vneck': {
    front: { x0: 33, y0: 24, x1: 68.8, y1: 86, imgW: 645, imgH: 713, maxWidthCm: 28.1, maxHeightCm: 47, boxWidthCm: 28.1, boxHeightCm: 53.8, garmentWidthCm: 44.5, garmentHeightCm: 61 },
    back: { x0: 33.2, y0: 14, x1: 69, y1: 86, imgW: 627, imgH: 696, maxWidthCm: 27.4, maxHeightCm: 47, boxWidthCm: 27.4, boxHeightCm: 61.3, garmentWidthCm: 44.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 38.9, y0: 6.3, x1: 68.6, y1: 88.9, imgW: 660, imgH: 737, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.5, boxHeightCm: 69.9, startXCm: 11.5, startYCm: 3.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 32, y0: 6.3, x1: 61.7, y1: 88.9, imgW: 660, imgH: 737, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.5, boxHeightCm: 69.9, startXCm: 11, startYCm: 3.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-iconic195-t': {
    front: { x0: 34, y0: 20, x1: 68.6, y1: 86, imgW: 669, imgH: 679, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 58, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 33.2, y0: 20, x1: 67.2, y1: 86, imgW: 656, imgH: 667, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 59.2, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.7, y0: 6.8, x1: 64, y1: 83, imgW: 614, imgH: 724, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 69.9, startXCm: 11.5, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 35.8, y0: 6.8, x1: 64.2, y1: 83, imgW: 614, imgH: 724, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 69.9, startXCm: 10.6, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-iconic195-t': {
    front: { x0: 34, y0: 19, x1: 66, y1: 80, imgW: 631, imgH: 673, maxWidthCm: 23.6, maxHeightCm: 47, boxWidthCm: 23.6, boxHeightCm: 47.9, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    back: { x0: 34, y0: 19, x1: 66, y1: 80, imgW: 607, imgH: 676, maxWidthCm: 22.2, maxHeightCm: 47, boxWidthCm: 22.2, boxHeightCm: 47.2, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    sleeve_left: { x0: 35.4, y0: 7, x1: 65.4, y1: 82.4, imgW: 540, imgH: 696, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.1, boxHeightCm: 61.9, startXCm: 9.8, startYCm: 10.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.4, y0: 7, x1: 64.4, y1: 82.4, imgW: 540, imgH: 696, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.1, boxHeightCm: 61.9, startXCm: 9.3, startYCm: 10.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-original-t': {
    front: { x0: 31.4, y0: 20, x1: 69.3, y1: 86, imgW: 676, imgH: 762, maxWidthCm: 27.7, maxHeightCm: 47, boxWidthCm: 27.7, boxHeightCm: 54.3, garmentWidthCm: 47, garmentHeightCm: 58 },
    back: { x0: 31.4, y0: 20, x1: 69.2, y1: 86, imgW: 631, imgH: 748, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 56, garmentWidthCm: 47, garmentHeightCm: 58 },
    sleeve_left: { x0: 34.3, y0: 5.5, x1: 64.5, y1: 82.6, imgW: 631, imgH: 752, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22, boxHeightCm: 66.9, startXCm: 11.3, startYCm: 14.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 35.8, y0: 5.5, x1: 65.8, y1: 82.6, imgW: 631, imgH: 752, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.9, boxHeightCm: 66.9, startXCm: 10.6, startYCm: 14.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-valueweight-t': {
    front: { x0: 33, y0: 20, x1: 67, y1: 80, imgW: 622, imgH: 735, maxWidthCm: 22.4, maxHeightCm: 46.7, boxWidthCm: 22.4, boxHeightCm: 46.7, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    back: { x0: 33, y0: 20, x1: 67, y1: 80, imgW: 639, imgH: 736, maxWidthCm: 22.9, maxHeightCm: 46.5, boxWidthCm: 22.9, boxHeightCm: 46.5, garmentWidthCm: 42.5, garmentHeightCm: 53 },
    sleeve_left: { x0: 36.2, y0: 6.8, x1: 66.8, y1: 87.3, imgW: 535, imgH: 769, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 16.4, boxHeightCm: 61.9, startXCm: 7.9, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 33.8, y0: 6.8, x1: 64.4, y1: 87.3, imgW: 535, imgH: 769, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 16.4, boxHeightCm: 61.9, startXCm: 8.4, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-baseball-t': {
    front: { x0: 35, y0: 32, x1: 65, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 22.5, maxHeightCm: 47, boxWidthCm: 22.5, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 60 },
    back: { x0: 35, y0: 32, x1: 65, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 22.2, maxHeightCm: 46.5, boxWidthCm: 22.2, boxHeightCm: 46.5, garmentWidthCm: 45, garmentHeightCm: 60 },
    sleeve_left: { x0: 15.9, y0: 9.2, x1: 84.1, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.7, boxHeightCm: 35.7, startXCm: 12.9, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 15.9, y0: 9.2, x1: 84.1, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.7, boxHeightCm: 35.7, startXCm: 12.8, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-premium-polo': {
    front: { x0: 31.3, y0: 23.4, x1: 69.3, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.4, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 31.1, y0: 23.4, x1: 69.1, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.4, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 16.8, y0: 9.6, x1: 83.1, y1: 90.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.6, boxHeightCm: 30.6, startXCm: 10.8, startYCm: 14.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 16.6, y0: 9.6, x1: 83.2, y1: 90.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.7, boxHeightCm: 30.6, startXCm: 10.9, startYCm: 14.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-premium-polo': {
    front: { x0: 32, y0: 25, x1: 68, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 26.4, maxHeightCm: 47, boxWidthCm: 26.4, boxHeightCm: 48.5, garmentWidthCm: 43, garmentHeightCm: 55 },
    back: { x0: 32, y0: 24.2, x1: 68, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 26.1, maxHeightCm: 47, boxWidthCm: 26.1, boxHeightCm: 48.6, garmentWidthCm: 43, garmentHeightCm: 55 },
    sleeve_left: { x0: 11.5, y0: 9.9, x1: 88.6, y1: 90.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.2, boxHeightCm: 26.7, startXCm: 10.8, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 11.5, y0: 9.9, x1: 88.3, y1: 90.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 26.7, startXCm: 11.2, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-baseball-longsleeve': {
    front: { x0: 35, y0: 32, x1: 65, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 21.3, maxHeightCm: 44.5, boxWidthCm: 21.3, boxHeightCm: 44.5, garmentWidthCm: 45, garmentHeightCm: 60 },
    back: { x0: 35, y0: 32, x1: 65, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 21.3, maxHeightCm: 44.5, boxWidthCm: 21.3, boxHeightCm: 44.5, garmentWidthCm: 45, garmentHeightCm: 60 },
    sleeve_left: { x0: 34.2, y0: 8.2, x1: 65.7, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.4, boxHeightCm: 68.9, startXCm: 11.2, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.2, y0: 8.2, x1: 65.7, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.4, boxHeightCm: 68.9, startXCm: 11.2, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-imperial-t': {
    front: { x0: 26, y0: 16.9, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.1, boxHeightCm: 58.6, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 26, y0: 16.5, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34.6, boxHeightCm: 58.1, garmentWidthCm: 49, garmentHeightCm: 61 },
    sleeve_left: { x0: 10.1, y0: 10.2, x1: 89.9, y1: 89.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.1, boxHeightCm: 29.1, startXCm: 12.6, startYCm: 13.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.1, y0: 10.2, x1: 89.9, y1: 89.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.1, boxHeightCm: 29.1, startXCm: 12.6, startYCm: 13.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-north-fleece': {
    front: { x0: 31.2, y0: 24.2, x1: 68.8, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.8, garmentWidthCm: 56, garmentHeightCm: 61 },
    back: { x0: 31.1, y0: 24.2, x1: 68.7, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.8, garmentWidthCm: 56, garmentHeightCm: 61 },
  },
  'gildan-heavy-t': {
    front: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.3, boxHeightCm: 59.5, garmentWidthCm: 46.8, garmentHeightCm: 62.6 },
    back: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.3, boxHeightCm: 59.5, garmentWidthCm: 46.8, garmentHeightCm: 62.6 },
    sleeve_left: { x0: 13.3, y0: 9.7, x1: 86.7, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.6, boxHeightCm: 28.7, startXCm: 11.3, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 13.3, y0: 9.7, x1: 86.7, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.6, boxHeightCm: 28.7, startXCm: 11.3, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-softstyle-polo': {
    front: { x0: 28, y0: 23.2, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.7, boxHeightCm: 59.2, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 28, y0: 23.2, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.8, boxHeightCm: 59.3, garmentWidthCm: 49, garmentHeightCm: 63 },
    sleeve_left: { x0: 14.7, y0: 9.2, x1: 85.1, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 27.1, boxHeightCm: 36.4, startXCm: 13.5, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.7, y0: 9.2, x1: 85.8, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 27.3, boxHeightCm: 36.4, startXCm: 13.6, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-vneck-t': {
    front: { x0: 28, y0: 25, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.5, boxHeightCm: 53.9, garmentWidthCm: 47, garmentHeightCm: 63 },
    back: { x0: 28, y0: 17.7, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34, boxHeightCm: 61.4, garmentWidthCm: 47, garmentHeightCm: 63 },
    sleeve_left: { x0: 18.6, y0: 9.2, x1: 81.2, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.7, boxHeightCm: 35.8, startXCm: 12, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 18.6, y0: 9.2, x1: 81.2, y1: 90.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.7, boxHeightCm: 35.8, startXCm: 11.7, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-t': {
    front: { x0: 31, y0: 19.5, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.9, maxHeightCm: 47, boxWidthCm: 26.9, boxHeightCm: 48.9, garmentWidthCm: 40, garmentHeightCm: 55 },
    back: { x0: 31, y0: 18.6, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.1, maxHeightCm: 47, boxWidthCm: 26.1, boxHeightCm: 48.1, garmentWidthCm: 40, garmentHeightCm: 55 },
    sleeve_left: { x0: 10.1, y0: 10.5, x1: 89.9, y1: 89.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.2, boxHeightCm: 29, startXCm: 12.6, startYCm: 11.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.1, y0: 10.2, x1: 89.9, y1: 89.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25, boxHeightCm: 29, startXCm: 12.5, startYCm: 11.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-heavy-t': {
    front: { x0: 30, y0: 17.4, x1: 70, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.4, maxHeightCm: 47, boxWidthCm: 26.4, boxHeightCm: 47.1, garmentWidthCm: 42, garmentHeightCm: 55 },
    back: { x0: 30, y0: 17.4, x1: 70, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.4, maxHeightCm: 47, boxWidthCm: 26.4, boxHeightCm: 47.1, garmentWidthCm: 42, garmentHeightCm: 55 },
    sleeve_left: { x0: 10.6, y0: 14, x1: 89.4, y1: 86.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.6, boxHeightCm: 23, startXCm: 10.5, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.6, y0: 14, x1: 89.4, y1: 86.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.6, boxHeightCm: 23, startXCm: 11.1, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-vneck-t': {
    front: { x0: 29.7, y0: 31, x1: 69.2, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 29.3, maxHeightCm: 44, boxWidthCm: 29.3, boxHeightCm: 44, garmentWidthCm: 40, garmentHeightCm: 53 },
    back: { x0: 29.8, y0: 22.3, x1: 70.2, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.5, garmentWidthCm: 40, garmentHeightCm: 53 },
    sleeve_left: { x0: 13.2, y0: 10, x1: 86.8, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.9, boxHeightCm: 26.4, startXCm: 10.2, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 13.2, y0: 10, x1: 86.6, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.9, boxHeightCm: 26.4, startXCm: 10.7, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-polo': {
    front: { x0: 30, y0: 24.5, x1: 69, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 27.4, maxHeightCm: 46.9, boxWidthCm: 27.4, boxHeightCm: 46.9, garmentWidthCm: 43, garmentHeightCm: 53 },
    back: { x0: 30, y0: 24.5, x1: 69, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 27.4, maxHeightCm: 46.9, boxWidthCm: 27.4, boxHeightCm: 46.9, garmentWidthCm: 43, garmentHeightCm: 53 },
    sleeve_left: { x0: 14.5, y0: 9.7, x1: 85.5, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 29.1, startXCm: 10.9, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.7, y0: 9.7, x1: 85.3, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22, boxHeightCm: 29.1, startXCm: 11.1, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-zip-hoodie': {
    front: { x0: 27, y0: 28.9, x1: 73, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 28.5, boxWidthCm: 38.8, boxHeightCm: 28.5, garmentWidthCm: 52, garmentHeightCm: 60 },
    back: { x0: 27, y0: 28.9, x1: 73, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 38.8, boxHeightCm: 50.1, garmentWidthCm: 52, garmentHeightCm: 60 },
    sleeve_left: { x0: 30.4, y0: 8.2, x1: 69.2, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 27.5, boxHeightCm: 68.9, startXCm: 15.6, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 30.6, y0: 8.2, x1: 69.1, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 27.3, boxHeightCm: 68.9, startXCm: 12, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-authentic-t': {
    front: { x0: 27, y0: 16.8, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.1, boxHeightCm: 56.2, garmentWidthCm: 47, garmentHeightCm: 59 },
    back: { x0: 27, y0: 16.8, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.1, boxHeightCm: 56.2, garmentWidthCm: 47, garmentHeightCm: 59 },
    sleeve_left: { x0: 12.6, y0: 9.8, x1: 87.4, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.3, boxHeightCm: 27.7, startXCm: 11.1, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 12.6, y0: 9.8, x1: 87.3, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.2, boxHeightCm: 27.7, startXCm: 11.1, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-workwear-t': {
    front: { x0: 26, y0: 17.5, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 36.2, boxHeightCm: 60, garmentWidthCm: 50, garmentHeightCm: 62 },
    back: { x0: 26, y0: 16.4, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.1, boxHeightCm: 59.1, garmentWidthCm: 50, garmentHeightCm: 62 },
    sleeve_left: { x0: 15.5, y0: 9.3, x1: 84.4, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.5, boxHeightCm: 34.9, startXCm: 12.7, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 15.5, y0: 9.3, x1: 84.4, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.5, boxHeightCm: 34.9, startXCm: 12.7, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-ladies-authentic-t': {
    front: { x0: 31, y0: 17.7, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 24.3, maxHeightCm: 45.5, boxWidthCm: 24.3, boxHeightCm: 45.5, garmentWidthCm: 41, garmentHeightCm: 53 },
    back: { x0: 31, y0: 17.7, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 24.3, maxHeightCm: 45.5, boxWidthCm: 24.3, boxHeightCm: 45.5, garmentWidthCm: 41, garmentHeightCm: 53 },
    sleeve_left: { x0: 10.9, y0: 12.7, x1: 89.1, y1: 87.5, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.9, boxHeightCm: 22.1, startXCm: 9.8, startYCm: 11, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.9, y0: 12.8, x1: 89.1, y1: 87.5, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20, boxHeightCm: 22.1, startXCm: 10.1, startYCm: 11, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-classic-polo': {
    front: { x0: 28, y0: 24.1, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.3, boxHeightCm: 56.4, garmentWidthCm: 49, garmentHeightCm: 60 },
    back: { x0: 28, y0: 24.6, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.6, boxHeightCm: 56.4, garmentWidthCm: 49, garmentHeightCm: 60 },
    sleeve_left: { x0: 14.7, y0: 9.4, x1: 85.4, y1: 90.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.2, boxHeightCm: 33.7, startXCm: 12.5, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.7, y0: 9.4, x1: 85.4, y1: 90.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.2, boxHeightCm: 33.7, startXCm: 12.7, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-rollsleeve-t': {
    front: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 47, garmentHeightCm: 60 },
    back: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 47, garmentHeightCm: 60 },
    sleeve_left: { x0: 10.4, y0: 11.3, x1: 89.6, y1: 88.5, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.7, boxHeightCm: 25.7, startXCm: 11.3, startYCm: 12.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.4, y0: 11.5, x1: 89.6, y1: 88.5, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.7, boxHeightCm: 25.7, startXCm: 11.4, startYCm: 12.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'justhoods-college-hoodie': {
    front: { x0: 31.3, y0: 26.7, x1: 68.6, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 29.2, boxWidthCm: 30, boxHeightCm: 29.2, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.4, y0: 26.7, x1: 68.7, y1: 81, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 50.6, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 33.4, y0: 8.2, x1: 66.8, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.4, boxHeightCm: 67.9, startXCm: 12.4, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 32.9, y0: 8.2, x1: 66.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.6, boxHeightCm: 67.9, startXCm: 11.2, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'justhoods-zoodie': {
    front: { x0: 21, y0: 26.7, x1: 79, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 29.2, boxWidthCm: 46.6, boxHeightCm: 29.2, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 21, y0: 26.7, x1: 79, y1: 81, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 46.6, boxHeightCm: 50.6, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 32.2, y0: 8.2, x1: 67.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.7, boxHeightCm: 67.9, startXCm: 13.3, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 32.4, y0: 8.2, x1: 67.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.6, boxHeightCm: 67.9, startXCm: 11.4, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'justhoods-awdis-sweat': {
    front: { x0: 28, y0: 16.7, x1: 72, y1: 83, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.2, boxHeightCm: 54.6, garmentWidthCm: 52, garmentHeightCm: 60 },
    back: { x0: 28, y0: 16.7, x1: 72, y1: 83, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.2, boxHeightCm: 54.6, garmentWidthCm: 52, garmentHeightCm: 60 },
    sleeve_left: { x0: 33.7, y0: 8.2, x1: 66.2, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23, boxHeightCm: 68.9, startXCm: 10.7, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 32.5, y0: 8.2, x1: 67.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.9, boxHeightCm: 68.9, startXCm: 13.2, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'justhoods-contrast-hoodie': {
    front: { x0: 27, y0: 27.5, x1: 73, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 28.8, boxWidthCm: 37.4, boxHeightCm: 28.8, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 27, y0: 27.5, x1: 73, y1: 81, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 37.4, boxHeightCm: 50.5, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 30.9, y0: 8.2, x1: 68.9, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.5, boxHeightCm: 67.9, startXCm: 13.5, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 30.9, y0: 8.2, x1: 68.9, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.5, boxHeightCm: 67.9, startXCm: 13, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'justhoods-quarterzip-sweat': {
    front: { x0: 28, y0: 24.4, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34.2, boxHeightCm: 50.1, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 28, y0: 24.4, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34.2, boxHeightCm: 50.1, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 34.8, y0: 8.2, x1: 65, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 67.9, startXCm: 10.5, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 34.8, y0: 8.2, x1: 65, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 67.9, startXCm: 10.7, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'bandc-inspire-hoodie': {
    front: { x0: 31, y0: 27.3, x1: 69, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 29.8, boxWidthCm: 31.8, boxHeightCm: 29.8, garmentWidthCm: 52, garmentHeightCm: 61 },
    back: { x0: 31, y0: 27.3, x1: 69, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.8, boxHeightCm: 51.2, garmentWidthCm: 52, garmentHeightCm: 61 },
  },
  'bandc-inspire-zip-hood': {
    front: { x0: 30, y0: 27.3, x1: 71, y1: 58, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 29.8, boxWidthCm: 34.3, boxHeightCm: 29.8, garmentWidthCm: 52, garmentHeightCm: 61 },
    back: { x0: 30, y0: 27.3, x1: 71, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34.3, boxHeightCm: 51.2, garmentWidthCm: 52, garmentHeightCm: 61 },
  },
  'stedman-slimfit-t': {
    front: { x0: 27, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.6, boxHeightCm: 57.1, garmentWidthCm: 44, garmentHeightCm: 60 },
    back: { x0: 27, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.6, boxHeightCm: 57.1, garmentWidthCm: 44, garmentHeightCm: 60 },
    sleeve_left: { x0: 12, y0: 9.7, x1: 87.9, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.4, boxHeightCm: 28.9, startXCm: 11.7, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 12, y0: 9.7, x1: 88, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.5, boxHeightCm: 28.9, startXCm: 11.7, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jn-active-t': {
    front: { x0: 29.6, y0: 19, x1: 70.2, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.5, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 29.6, y0: 19, x1: 70.2, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.5, garmentWidthCm: 49, garmentHeightCm: 63 },
    sleeve_left: { x0: 13.9, y0: 9.6, x1: 85.9, y1: 90.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.9, boxHeightCm: 29.9, startXCm: 11.5, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 13.9, y0: 9.6, x1: 85.9, y1: 90.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.9, boxHeightCm: 29.9, startXCm: 11.4, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jn-halfzip-sweat': {
    front: { x0: 28, y0: 24.6, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.7, boxHeightCm: 49.3, garmentWidthCm: 53, garmentHeightCm: 58 },
    back: { x0: 28, y0: 24.6, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.7, boxHeightCm: 49.3, garmentWidthCm: 53, garmentHeightCm: 58 },
  },
  'bundc-t-shirt-e190': {
    front: { x0: 31.2, y0: 19.2, x1: 68.6, y1: 71, imgW: 620, imgH: 720, maxWidthCm: 29.3, maxHeightCm: 47, boxWidthCm: 29.3, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 32.9, y0: 18.5, x1: 67.8, y1: 71.5, imgW: 620, imgH: 720, maxWidthCm: 26.7, maxHeightCm: 47, boxWidthCm: 26.7, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
  },
  'bundc-t-shirt-e190-women': {
    front: { x0: 28, y0: 19.9, x1: 72, y1: 81.5, imgW: 620, imgH: 720, maxWidthCm: 28.9, maxHeightCm: 47, boxWidthCm: 28.9, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
    back: { x0: 28.8, y0: 18.2, x1: 70.7, y1: 83.2, imgW: 620, imgH: 720, maxWidthCm: 26.1, maxHeightCm: 47, boxWidthCm: 26.1, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
  },
  'bundc-inspire-e150-t-shirt': {
    front: { x0: 29.3, y0: 16.5, x1: 70.2, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.3, maxHeightCm: 47, boxWidthCm: 29.3, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 30.4, y0: 16.5, x1: 69.5, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 28.1, maxHeightCm: 47, boxWidthCm: 28.1, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
  },
  'bundc-t-shirt-e150': {
    front: { x0: 31.5, y0: 19.6, x1: 69.2, y1: 70.6, imgW: 620, imgH: 720, maxWidthCm: 29.9, maxHeightCm: 47, boxWidthCm: 29.9, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 61 },
    back: { x0: 32.9, y0: 21.7, x1: 68.1, y1: 69.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 61 },
    sleeve_left: { x0: 33.8, y0: 8.1, x1: 66, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.2, boxHeightCm: 69.9, startXCm: 11.8, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'bundc-inspire-e150-t-shirt-women': {
    front: { x0: 28, y0: 18.1, x1: 70.8, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 26.5, maxHeightCm: 47, boxWidthCm: 26.5, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
    back: { x0: 28, y0: 18.1, x1: 70.8, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 26.5, maxHeightCm: 47, boxWidthCm: 26.5, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
  },
  'bundc-t-shirt-e150-women': {
    front: { x0: 30, y0: 21, x1: 72.5, y1: 80.4, imgW: 620, imgH: 720, maxWidthCm: 28.9, maxHeightCm: 47, boxWidthCm: 28.9, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
    back: { x0: 29.6, y0: 18.7, x1: 71.1, y1: 82.8, imgW: 620, imgH: 720, maxWidthCm: 26.2, maxHeightCm: 47, boxWidthCm: 26.2, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
    sleeve_left: { x0: 32.6, y0: 8.3, x1: 67.3, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.5, boxHeightCm: 59.9, startXCm: 11.4, startYCm: 9.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'bundc-e220-t': {
    front: { x0: 31.9, y0: 21.9, x1: 68.1, y1: 70.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 59 },
    back: { x0: 31.6, y0: 21.5, x1: 68.4, y1: 71.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 59 },
  },
  'bundc-inspire-v-t-men': {
    front: { x0: 30.3, y0: 16.5, x1: 71.4, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.6, maxHeightCm: 47, boxWidthCm: 29.6, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
    back: { x0: 30.3, y0: 16.5, x1: 71.4, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.6, maxHeightCm: 47, boxWidthCm: 29.6, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
  },
  'bundc-inspire-v-t-women': {
    front: { x0: 28.8, y0: 17.4, x1: 73, y1: 78.8, imgW: 620, imgH: 720, maxWidthCm: 29.1, maxHeightCm: 47, boxWidthCm: 29.1, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 55 },
    back: { x0: 28.8, y0: 17.4, x1: 73, y1: 78.8, imgW: 620, imgH: 720, maxWidthCm: 29.1, maxHeightCm: 47, boxWidthCm: 29.1, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 55 },
  },
  'bundc-inspire-t-men': {
    front: { x0: 29.1, y0: 16.5, x1: 70.8, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
    back: { x0: 30.4, y0: 16.5, x1: 70.2, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
  },
  'bundc-inspire-t-women': {
    front: { x0: 28.7, y0: 17, x1: 69.9, y1: 72.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 28.9, y0: 16.5, x1: 70.3, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.7, maxHeightCm: 47, boxWidthCm: 29.7, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 31.6, y0: 8.1, x1: 68.9, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.9, boxHeightCm: 69.9, startXCm: 13, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-round-t-heavy': {
    front: { x0: 28.2, y0: 16.8, x1: 71.1, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 59 },
    back: { x0: 28.1, y0: 16.8, x1: 71, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 59 },
    sleeve_left: { x0: 33.5, y0: 8.2, x1: 66.5, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23, boxHeightCm: 67.9, startXCm: 11.5, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-ladies-active-t': {
    front: { x0: 28.6, y0: 17.9, x1: 71.7, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 52 },
    back: { x0: 28.6, y0: 17.9, x1: 71.7, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 52 },
    sleeve_left: { x0: 33.4, y0: 8.3, x1: 66.8, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21, boxHeightCm: 60.9, startXCm: 11.1, startYCm: 11.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-men-s-basic-t': {
    front: { x0: 29.1, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
    back: { x0: 29.1, y0: 16.5, x1: 67.4, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 27.5, maxHeightCm: 47, boxWidthCm: 27.5, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 61 },
    sleeve_left: { x0: 33.5, y0: 8.1, x1: 66.5, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.7, boxHeightCm: 69.9, startXCm: 11.9, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-ladies-basic-t': {
    front: { x0: 28, y0: 18.1, x1: 71.9, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 27.2, maxHeightCm: 47, boxWidthCm: 27.2, boxHeightCm: 47, garmentWidthCm: 41, garmentHeightCm: 51 },
    back: { x0: 28, y0: 18.1, x1: 71.9, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 27.2, maxHeightCm: 47, boxWidthCm: 27.2, boxHeightCm: 47, garmentWidthCm: 41, garmentHeightCm: 51 },
    sleeve_left: { x0: 32.9, y0: 8.3, x1: 66.9, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 59.9, startXCm: 11.4, startYCm: 9.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-workwear-t-men': {
    front: { x0: 29.4, y0: 16.5, x1: 70.5, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.5, maxHeightCm: 47, boxWidthCm: 29.5, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 29.4, y0: 16.5, x1: 70.4, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.5, maxHeightCm: 47, boxWidthCm: 29.5, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.6, y0: 8.1, x1: 64.3, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.6, boxHeightCm: 69.9, startXCm: 10.6, startYCm: 14.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-workwear-t-women': {
    front: { x0: 28.8, y0: 18.1, x1: 70.3, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 25.7, maxHeightCm: 47, boxWidthCm: 25.7, boxHeightCm: 47, garmentWidthCm: 41, garmentHeightCm: 51 },
    back: { x0: 29.1, y0: 18.1, x1: 70.6, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 25.7, maxHeightCm: 47, boxWidthCm: 25.7, boxHeightCm: 47, garmentWidthCm: 41, garmentHeightCm: 51 },
    sleeve_left: { x0: 33.9, y0: 8.3, x1: 66, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.9, boxHeightCm: 59.9, startXCm: 10.4, startYCm: 11.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-mens-bio-workwear-t-shirt': {
    front: { x0: 30, y0: 16.3, x1: 70.6, y1: 71, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 63 },
    back: { x0: 29.8, y0: 16.3, x1: 70.4, y1: 71, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 63 },
    sleeve_left: { x0: 34.7, y0: 8.1, x1: 65.3, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.5, boxHeightCm: 71.9, startXCm: 11.8, startYCm: 16.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-ladies-bio-workwear-t-shirt': {
    front: { x0: 28.8, y0: 17.7, x1: 71.4, y1: 81.1, imgW: 620, imgH: 720, maxWidthCm: 27.2, maxHeightCm: 47, boxWidthCm: 27.2, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 53 },
    back: { x0: 28.8, y0: 17.7, x1: 71, y1: 81.1, imgW: 620, imgH: 720, maxWidthCm: 27, maxHeightCm: 47, boxWidthCm: 27, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 53 },
    sleeve_left: { x0: 32.4, y0: 8.3, x1: 67.6, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.5, boxHeightCm: 61.9, startXCm: 11.3, startYCm: 13.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-russell-classic-t': {
    front: { x0: 30.9, y0: 16.8, x1: 69.4, y1: 71.8, imgW: 620, imgH: 720, maxWidthCm: 28.4, maxHeightCm: 47, boxWidthCm: 28.4, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 62 },
    back: { x0: 35.7, y0: 16.7, x1: 65, y1: 71.7, imgW: 620, imgH: 720, maxWidthCm: 21.5, maxHeightCm: 47, boxWidthCm: 21.5, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 62 },
    sleeve_left: { x0: 34.8, y0: 8.1, x1: 65.1, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 70.9, startXCm: 11.4, startYCm: 15.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-classic-heavyweight-t-shirt': {
    front: { x0: 30.4, y0: 17.2, x1: 69.6, y1: 71.1, imgW: 620, imgH: 720, maxWidthCm: 29.5, maxHeightCm: 47, boxWidthCm: 29.5, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 62 },
    back: { x0: 36.1, y0: 17.3, x1: 65.1, y1: 71.8, imgW: 620, imgH: 720, maxWidthCm: 21.6, maxHeightCm: 47, boxWidthCm: 21.6, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 62 },
    sleeve_left: { x0: 36, y0: 9.8, x1: 63.3, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.8, maxHeightCm: 10, boxWidthCm: 8.8, boxHeightCm: 29.9, startXCm: 4.5, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-mens-pure-organic-heavy-tee': {
    front: { x0: 31.1, y0: 18.1, x1: 69.9, y1: 70.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 62 },
    back: { x0: 31.1, y0: 18.1, x1: 69.9, y1: 70.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 62 },
  },
  'russell-ladies-pure-organic-heavy-tee': {
    front: { x0: 29.9, y0: 16.5, x1: 69.8, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 29.9, y0: 16.5, x1: 69.8, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
  },
  'russell-mens-pure-organic-v-neck-tee': {
    front: { x0: 29.1, y0: 16.4, x1: 70.1, y1: 71.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
    back: { x0: 28.9, y0: 16.5, x1: 69.7, y1: 71.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
    sleeve_left: { x0: 33.8, y0: 8.1, x1: 66.2, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.6, boxHeightCm: 70.9, startXCm: 11.8, startYCm: 14.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ultra-cotton-t-shirt': {
    front: { x0: 32.2, y0: 20.8, x1: 67.2, y1: 68.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 63 },
    back: { x0: 32.3, y0: 20.6, x1: 67.5, y1: 68, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 63 },
  },
  'gildan-light-cotton-adult-t-shirt': {
    front: { x0: 33, y0: 19.9, x1: 67.9, y1: 70.2, imgW: 620, imgH: 720, maxWidthCm: 28.2, maxHeightCm: 47, boxWidthCm: 28.2, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    back: { x0: 34.2, y0: 16.5, x1: 67.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 24.2, maxHeightCm: 47, boxWidthCm: 24.2, boxHeightCm: 47, garmentWidthCm: 49.5, garmentHeightCm: 61 },
    sleeve_left: { x0: 37.5, y0: 8.1, x1: 62.5, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 17.9, boxHeightCm: 69.9, startXCm: 8.8, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-men-s-classic-t-shirt': {
    front: { x0: 30.3, y0: 16.5, x1: 70.8, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 29.1, maxHeightCm: 47, boxWidthCm: 29.1, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 61 },
    back: { x0: 31.3, y0: 16.5, x1: 69.3, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 27.3, maxHeightCm: 47, boxWidthCm: 27.3, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 61 },
  },
  'neutral-oversized-t-shirt': {
    front: { x0: 30.3, y0: 17.1, x1: 69.6, y1: 70.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 55, garmentHeightCm: 64 },
    back: { x0: 30.3, y0: 17.1, x1: 69.6, y1: 70.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 55, garmentHeightCm: 64 },
  },
  'neutral-ladies-classic-t-shirt': {
    front: { x0: 30.1, y0: 17.4, x1: 71.2, y1: 78.8, imgW: 620, imgH: 720, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 55 },
    back: { x0: 31.4, y0: 17.4, x1: 70.3, y1: 78.8, imgW: 620, imgH: 720, maxWidthCm: 25.6, maxHeightCm: 47, boxWidthCm: 25.6, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 55 },
    sleeve_left: { x0: 33, y0: 8.3, x1: 67, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.4, boxHeightCm: 63.9, startXCm: 12.5, startYCm: 10.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-men-s-fit-t-shirt': {
    front: { x0: 29.3, y0: 16.7, x1: 71.6, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 60 },
    back: { x0: 29.7, y0: 16.7, x1: 70.4, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 28.8, maxHeightCm: 47, boxWidthCm: 28.8, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 60 },
  },
  'neutral-unisex-performance-t-shirt': {
    front: { x0: 29.6, y0: 16.4, x1: 70.7, y1: 71.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
    back: { x0: 29.5, y0: 16.4, x1: 70.7, y1: 71.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
    sleeve_left: { x0: 34, y0: 8.1, x1: 65.9, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.3, boxHeightCm: 70.9, startXCm: 11.7, startYCm: 14.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-ladies-fit-t-shirt': {
    front: { x0: 29, y0: 17.1, x1: 72.1, y1: 76.7, imgW: 620, imgH: 720, maxWidthCm: 29.2, maxHeightCm: 47, boxWidthCm: 29.2, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 57 },
    back: { x0: 31.6, y0: 17.1, x1: 71, y1: 76.7, imgW: 620, imgH: 720, maxWidthCm: 26.7, maxHeightCm: 47, boxWidthCm: 26.7, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 57 },
    sleeve_left: { x0: 33.9, y0: 8.2, x1: 65.9, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.8, boxHeightCm: 65.9, startXCm: 10.7, startYCm: 9.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-unisex-regular-t-shirt': {
    front: { x0: 29.5, y0: 17, x1: 70.7, y1: 72.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 51, garmentHeightCm: 61 },
    back: { x0: 29.6, y0: 16.9, x1: 69.3, y1: 72.6, imgW: 620, imgH: 720, maxWidthCm: 28.8, maxHeightCm: 47, boxWidthCm: 28.8, boxHeightCm: 47, garmentWidthCm: 51, garmentHeightCm: 61 },
    sleeve_left: { x0: 32.4, y0: 8.1, x1: 67.5, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25.2, boxHeightCm: 69.9, startXCm: 12.4, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'stedman-stedman-classic-t': {
    front: { x0: 28.5, y0: 16.7, x1: 70.8, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
    back: { x0: 28.5, y0: 16.7, x1: 70.8, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
  },
  'stedman-classic-t-for-women': {
    front: { x0: 28, y0: 17.9, x1: 72, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.7, maxHeightCm: 47, boxWidthCm: 27.7, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 52 },
    back: { x0: 28, y0: 17.9, x1: 72, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.7, maxHeightCm: 47, boxWidthCm: 27.7, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 52 },
  },
  'stedman-classic-t-v-neck': {
    front: { x0: 28.8, y0: 16.7, x1: 71.1, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
    back: { x0: 28.8, y0: 16.7, x1: 71.1, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
  },
  'stedman-classic-t-v-neck-for-women': {
    front: { x0: 27.9, y0: 17.9, x1: 71.3, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.3, maxHeightCm: 47, boxWidthCm: 27.3, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 52 },
    back: { x0: 27.9, y0: 17.9, x1: 71.3, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 27.3, maxHeightCm: 47, boxWidthCm: 27.3, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 52 },
  },
  'stedman-comfort-t': {
    front: { x0: 28.8, y0: 16.7, x1: 71.1, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
    back: { x0: 28.8, y0: 16.7, x1: 71.1, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 60 },
  },
  'stedman-clive-crew-neck': {
    front: { x0: 29.7, y0: 16.7, x1: 70.2, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 60 },
    back: { x0: 29.7, y0: 16.7, x1: 70.2, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 28.7, maxHeightCm: 47, boxWidthCm: 28.7, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 60 },
  },
  'bundc-unisex-polo-id-001': {
    front: { x0: 32.5, y0: 25.9, x1: 67.4, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 32.5, y0: 25.9, x1: 67.4, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
  },
  'bundc-my-polo-180': {
    front: { x0: 31.5, y0: 25.6, x1: 68.1, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 59 },
    back: { x0: 31.5, y0: 25.6, x1: 68.1, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 59 },
  },
  'bundc-inspire-polo-men': {
    front: { x0: 33.5, y0: 26.2, x1: 67.5, y1: 72, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 33.5, y0: 26.2, x1: 67.5, y1: 72, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
  },
  'bundc-inspire-polo-women': {
    front: { x0: 31.9, y0: 24.2, x1: 68.4, y1: 73.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 31.9, y0: 24.2, x1: 68.4, y1: 73.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
  },
  'bundc-my-eco-polo-6535': {
    front: { x0: 35.2, y0: 26.4, x1: 67.4, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 27.5, maxHeightCm: 47, boxWidthCm: 27.5, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 59 },
    back: { x0: 35.2, y0: 26.4, x1: 67.4, y1: 73.8, imgW: 620, imgH: 720, maxWidthCm: 27.5, maxHeightCm: 47, boxWidthCm: 27.5, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 59 },
  },
  'bundc-my-eco-polo-6535-women': {
    front: { x0: 30.1, y0: 27.4, x1: 69.7, y1: 80.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 53 },
    back: { x0: 30.1, y0: 27.4, x1: 69.7, y1: 80.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 53 },
  },
  'jamesnicholson-classic-polo': {
    front: { x0: 30.9, y0: 23.5, x1: 68.9, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 31, y0: 23.4, x1: 68.9, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 34.8, y0: 8.1, x1: 65.1, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.8, boxHeightCm: 69.9, startXCm: 11, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-classic-polo-ladies': {
    front: { x0: 30, y0: 24.7, x1: 69.9, y1: 83.2, imgW: 620, imgH: 720, maxWidthCm: 27.5, maxHeightCm: 47, boxWidthCm: 27.5, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 52 },
    back: { x0: 30.4, y0: 24.7, x1: 69.6, y1: 83.2, imgW: 620, imgH: 720, maxWidthCm: 27.1, maxHeightCm: 47, boxWidthCm: 27.1, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 52 },
    sleeve_left: { x0: 33.7, y0: 8.3, x1: 66.2, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.4, boxHeightCm: 60.9, startXCm: 10.3, startYCm: 9.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-men-s-bio-workwear-polo': {
    front: { x0: 31, y0: 23.2, x1: 67.9, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 63 },
    back: { x0: 30.8, y0: 23.2, x1: 67.8, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 63 },
    sleeve_left: { x0: 33.5, y0: 8.1, x1: 66.5, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.5, boxHeightCm: 71.9, startXCm: 12.1, startYCm: 15.8, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jamesnicholson-workwear-polo-men': {
    front: { x0: 30.9, y0: 23.9, x1: 68.6, y1: 74.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 30.9, y0: 23.9, x1: 68.6, y1: 74.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.9, y0: 8.1, x1: 63.9, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.1, boxHeightCm: 69.9, startXCm: 10, startYCm: 15.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'earthpositive-pique-polo-shirt': {
    front: { x0: 34.9, y0: 28.6, x1: 65.2, y1: 69.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 63 },
    back: { x0: 34.8, y0: 28.6, x1: 65.2, y1: 69.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 63 },
  },
  'earthpositive-jersey-polo-shirt': {
    front: { x0: 35.1, y0: 29.2, x1: 64.9, y1: 69.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 63 },
    back: { x0: 35.1, y0: 29.2, x1: 64.9, y1: 69.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 63 },
  },
  'russell-strapazierfaehiges-poloshirt-599': {
    front: { x0: 30.7, y0: 23.7, x1: 69.8, y1: 76.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
    back: { x0: 30.7, y0: 24.3, x1: 69.1, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 29.8, maxHeightCm: 47, boxWidthCm: 29.8, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
    sleeve_left: { x0: 34.8, y0: 8.2, x1: 65, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 67.9, startXCm: 10.9, startYCm: 15.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-men-s-ultimate-cotton-polo': {
    front: { x0: 31.4, y0: 23.7, x1: 70.5, y1: 76.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
    back: { x0: 30.8, y0: 24.3, x1: 69.5, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
  },
  'russell-men-s-classic-cotton-polo': {
    front: { x0: 31, y0: 23.7, x1: 70, y1: 76.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
    back: { x0: 30.8, y0: 24.8, x1: 69.2, y1: 76.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
  },
  'russell-poloshirt-6535': {
    front: { x0: 29.7, y0: 25.2, x1: 71.1, y1: 81.3, imgW: 620, imgH: 720, maxWidthCm: 29.9, maxHeightCm: 47, boxWidthCm: 29.9, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 54 },
    back: { x0: 29.6, y0: 25.5, x1: 70.7, y1: 81.3, imgW: 620, imgH: 720, maxWidthCm: 29.8, maxHeightCm: 47, boxWidthCm: 29.8, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 54 },
    sleeve_left: { x0: 33.6, y0: 8.3, x1: 66.2, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.1, boxHeightCm: 62.9, startXCm: 10.8, startYCm: 16, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-ladies-poloshirt-6535': {
    front: { x0: 31.5, y0: 23.2, x1: 68.5, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 31.5, y0: 23.2, x1: 68.5, y1: 73, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 63 },
  },
  'sols-men-s-polo-shirt-prime': {
    front: { x0: 32.3, y0: 23.5, x1: 68.7, y1: 74.4, imgW: 620, imgH: 720, maxWidthCm: 29, maxHeightCm: 47, boxWidthCm: 29, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 30.6, y0: 24.1, x1: 68.2, y1: 74.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    sleeve_left: { x0: 33, y0: 8.1, x1: 66.4, y1: 91.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.1, boxHeightCm: 69.9, startXCm: 12.2, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-women-s-polo-shirt-prime': {
    front: { x0: 30.7, y0: 24.3, x1: 69.6, y1: 80.8, imgW: 620, imgH: 720, maxWidthCm: 27.9, maxHeightCm: 47, boxWidthCm: 27.9, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 54 },
    back: { x0: 31.1, y0: 25.4, x1: 68.3, y1: 81.3, imgW: 620, imgH: 720, maxWidthCm: 26.9, maxHeightCm: 47, boxWidthCm: 26.9, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 54 },
    sleeve_left: { x0: 33, y0: 8.3, x1: 67.3, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.3, boxHeightCm: 62.9, startXCm: 10.8, startYCm: 10, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-men-s-polo-shirt-perfect': {
    front: { x0: 40, y0: 29.1, x1: 62.3, y1: 71.5, imgW: 620, imgH: 720, maxWidthCm: 21.3, maxHeightCm: 47, boxWidthCm: 21.3, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 32.7, y0: 28.1, x1: 65.5, y1: 72.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.4, y0: 8.1, x1: 63.8, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.4, boxHeightCm: 69.9, startXCm: 9.9, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-unisex-pulse-polo-shirt': {
    front: { x0: 30.6, y0: 23.4, x1: 68.6, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 31.7, y0: 24.1, x1: 69.3, y1: 74.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 31.6, y0: 8.1, x1: 68.4, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.5, boxHeightCm: 69.9, startXCm: 13, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-heavy-blend-hooded-sweatshirt': {
    front: { x0: 32, y0: 27.5, x1: 68.3, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 60 },
    back: { x0: 31.7, y0: 27.6, x1: 68, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 60 },
    sleeve_left: { x0: 31.9, y0: 8.2, x1: 68.8, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.1, boxHeightCm: 68.9, startXCm: 13.5, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 31.6, y0: 8.2, x1: 68.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.2, boxHeightCm: 68.9, startXCm: 12.4, startYCm: 11.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-softstyle-midweight-sweat-adult-hoodie': {
    front: { x0: 31.5, y0: 27.6, x1: 68.4, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.7, y0: 28.3, x1: 68.2, y1: 77.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
  },
  'gildan-hammer-maxweight-adult-hooded-sweatshirt': {
    front: { x0: 34.8, y0: 39.6, x1: 64.7, y1: 79.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 34.8, y0: 39.6, x1: 64.7, y1: 79.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
  },
  'fruit-of-the-loom-classic-hooded-sweat': {
    front: { x0: 30.7, y0: 27.9, x1: 69.3, y1: 79.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    back: { x0: 30.6, y0: 27.9, x1: 69.2, y1: 79.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    sleeve_left: { x0: 33.1, y0: 8.2, x1: 67.1, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.7, boxHeightCm: 64.9, startXCm: 12.5, startYCm: 10.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fruit-of-the-loom-premium-hooded-sweat': {
    front: { x0: 30.9, y0: 28.5, x1: 69.1, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    back: { x0: 30.9, y0: 28.5, x1: 69.1, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    sleeve_left: { x0: 33.6, y0: 8.2, x1: 66.2, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.8, boxHeightCm: 64.9, startXCm: 12.3, startYCm: 10.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fruit-of-the-loom-lightweight-hooded-sweat': {
    front: { x0: 34.9, y0: 39.6, x1: 65, y1: 80.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 42.3, y0: 27.5, x1: 62.7, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 16.6, maxHeightCm: 47, boxWidthCm: 16.6, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 32.9, y0: 8.2, x1: 67, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23.8, boxHeightCm: 67.9, startXCm: 14.8, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fruit-of-the-loom-iconic-premium-hooded-sweat': {
    front: { x0: 33.3, y0: 32.6, x1: 67.3, y1: 78.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 32, y0: 28.4, x1: 68.4, y1: 77.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 32.9, y0: 8.2, x1: 67.4, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.2, boxHeightCm: 67.9, startXCm: 12.9, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fruit-of-the-loom-iconic-250-hooded-sweat': {
    front: { x0: 32.4, y0: 31.6, x1: 67, y1: 78.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.6, y0: 27.8, x1: 68.4, y1: 77.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 31.6, y0: 8.2, x1: 68.9, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.1, boxHeightCm: 67.9, startXCm: 15.3, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'build-your-brand-heavy-hoody': {
    front: { x0: 32.3, y0: 27.1, x1: 67.7, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 62 },
    back: { x0: 32.3, y0: 27.1, x1: 67.7, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 62 },
    sleeve_left: { x0: 35.4, y0: 8.1, x1: 64.9, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.5, boxHeightCm: 70.9, startXCm: 9.1, startYCm: 11.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'build-your-brand-fluffy-hoody': {
    front: { x0: 32.2, y0: 27.1, x1: 67.6, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 57, garmentHeightCm: 62 },
    back: { x0: 32.3, y0: 27.1, x1: 67.7, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 57, garmentHeightCm: 62 },
    sleeve_left: { x0: 34.8, y0: 8.1, x1: 65.1, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 70.9, startXCm: 11.3, startYCm: 11.4, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'build-your-brand-ultra-heavy-cotton-box-hoody': {
    front: { x0: 31.5, y0: 27.5, x1: 68.4, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.5, y0: 27.5, x1: 68.4, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 36.9, y0: 8.2, x1: 63.4, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 18.5, boxHeightCm: 67.9, startXCm: 6.3, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'build-your-brand-ladies-heavy-hoody': {
    front: { x0: 29.2, y0: 28.4, x1: 70.2, y1: 83.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 52 },
    back: { x0: 29.5, y0: 28.4, x1: 70.5, y1: 83.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 52 },
    sleeve_left: { x0: 31.9, y0: 8.3, x1: 67.4, y1: 91.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.3, boxHeightCm: 60.9, startXCm: 7.8, startYCm: 9.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'bundc-id-333-hoodie': {
    front: { x0: 34.8, y0: 41.4, x1: 65.3, y1: 82.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    back: { x0: 35.9, y0: 33.9, x1: 64.1, y1: 72, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
  },
  'bundc-king-hooded-sweat': {
    front: { x0: 31.5, y0: 28.3, x1: 68.4, y1: 78.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 57 },
    back: { x0: 31.1, y0: 28.1, x1: 68.8, y1: 79.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 45, garmentHeightCm: 57 },
  },
  'bundc-id-223-hoodie': {
    front: { x0: 34.8, y0: 41.4, x1: 65.4, y1: 82.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
    back: { x0: 35.9, y0: 33.9, x1: 64.1, y1: 72, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 56 },
  },
  'bundc-influence-hoodie': {
    front: { x0: 34.7, y0: 41.9, x1: 65.3, y1: 83.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 55 },
    back: { x0: 35.2, y0: 33.4, x1: 64.8, y1: 73.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 55 },
  },
  'bundc-hoodie': {
    front: { x0: 32.1, y0: 30, x1: 68, y1: 78.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 58 },
    back: { x0: 32.1, y0: 30, x1: 68, y1: 78.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 46, garmentHeightCm: 58 },
  },
  'earthpositive-earth-positive-pullover-hoodie': {
    front: { x0: 37, y0: 42, x1: 63, y1: 77, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.5, y0: 27.5, x1: 68.5, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
  },
  'earthpositive-earth-positive-women-s-half-zip-hoodie': {
    front: { x0: 29.4, y0: 29.5, x1: 70.5, y1: 84.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 51, garmentHeightCm: 51 },
    back: { x0: 29.1, y0: 28.6, x1: 70.8, y1: 84.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 51, garmentHeightCm: 51 },
  },
  'earthpositive-earth-positive-super-heavy-hoodie': {
    front: { x0: 34.9, y0: 40.3, x1: 64.6, y1: 80.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 34.9, y0: 40.3, x1: 64.6, y1: 80.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
  },
  'earthpositive-earthpositive-organic-mensunisex-pullover-hoodie': {
    front: { x0: 37.7, y0: 41.6, x1: 62.4, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 63 },
    back: { x0: 37.6, y0: 41.5, x1: 62.3, y1: 74.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 63 },
  },
  'earthpositive-unisex-organic-pullover-hood-ep': {
    front: { x0: 32.5, y0: 27, x1: 67.4, y1: 74.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 63 },
    back: { x0: 32.5, y0: 27, x1: 67.4, y1: 74.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 63 },
  },
  'just-hoods-organic-hoodie-jh201': {
    front: { x0: 31.5, y0: 27.5, x1: 68.5, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
    back: { x0: 31.5, y0: 27.5, x1: 68.5, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 59 },
  },
  'just-hoods-vision-heavyweight-hoodie': {
    front: { x0: 32.3, y0: 30.6, x1: 67.5, y1: 78.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 32.3, y0: 30.6, x1: 67.5, y1: 78.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
  },
  'russell-authentic-hooded-sweat': {
    front: { x0: 32.4, y0: 32.2, x1: 67.3, y1: 79.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 58 },
    back: { x0: 31.8, y0: 28.8, x1: 68.6, y1: 78.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 58 },
    sleeve_left: { x0: 36.8, y0: 8.2, x1: 63.1, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 18.1, boxHeightCm: 66.9, startXCm: 10.3, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-ladies-authentic-hood': {
    front: { x0: 31.9, y0: 27.6, x1: 68.7, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 32, y0: 27.5, x1: 69, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 32.2, y0: 8.2, x1: 67.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.7, boxHeightCm: 67.9, startXCm: 16, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-hooded-sweatshirt': {
    front: { x0: 32, y0: 27.4, x1: 68.4, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 60 },
    back: { x0: 32, y0: 27.4, x1: 68.4, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 60 },
  },
  'just-hoods-signature-heavyweight-sweat': {
    front: { x0: 28.6, y0: 16.8, x1: 71.3, y1: 74.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 59 },
    back: { x0: 28.6, y0: 16.8, x1: 71.3, y1: 74.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 53, garmentHeightCm: 59 },
  },
  'jhk-hooded-sweater': {
    front: { x0: 31.5, y0: 27.5, x1: 68.4, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    back: { x0: 31.6, y0: 27.6, x1: 68.4, y1: 77.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 59 },
    sleeve_left: { x0: 32.2, y0: 8.2, x1: 67.6, y1: 91.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.7, boxHeightCm: 67.9, startXCm: 11.8, startYCm: 10.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'earthpositive-premium-long-sleeve-t-shirt': {
    front: { x0: 30.1, y0: 19.7, x1: 70, y1: 73.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 58 },
    back: { x0: 30.1, y0: 19.7, x1: 70, y1: 73.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 58 },
  },
  'gildan-ultra-cotton-long-sleeve-t-shirt': {
    front: { x0: 34.9, y0: 22.3, x1: 67.1, y1: 65.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 65 },
    back: { x0: 31.4, y0: 16, x1: 69.8, y1: 69.4, imgW: 620, imgH: 720, maxWidthCm: 29.1, maxHeightCm: 47, boxWidthCm: 29.1, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 65 },
    sleeve_left: { x0: 39.4, y0: 8.1, x1: 60.5, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 16, boxHeightCm: 73.9, startXCm: 8.4, startYCm: 11.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-men-s-long-sleeve-t-shirt-imperial': {
    front: { x0: 29.1, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 29.5, y0: 16.5, x1: 71.2, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    sleeve_left: { x0: 35.4, y0: 8.1, x1: 64.9, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.2, boxHeightCm: 69.9, startXCm: 10.5, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-ladies-long-sleeve-t-shirt': {
    front: { x0: 27.5, y0: 17.2, x1: 72.4, y1: 77.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 56 },
    back: { x0: 27.6, y0: 17.2, x1: 72.5, y1: 77.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 42, garmentHeightCm: 56 },
  },
  'russell-classic-t-long-sleeve': {
    front: { x0: 29.9, y0: 17.3, x1: 70.4, y1: 71.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 61 },
    back: { x0: 29.2, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 61 },
    sleeve_left: { x0: 34.3, y0: 8.1, x1: 66.2, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.9, boxHeightCm: 69.9, startXCm: 11.7, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'bundc-t-shirt-e150-long-sleeve-unisex-exact': {
    front: { x0: 29.1, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 29.1, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
  },
  'earthpositive-unisex-organic-longsleeve-t-shirt': {
    front: { x0: 30.6, y0: 19.8, x1: 69.4, y1: 72.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 59 },
    back: { x0: 30.6, y0: 19.8, x1: 69.4, y1: 72.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 59 },
  },
  'just-cool-long-sleeve-cool-t': {
    front: { x0: 28.5, y0: 16.8, x1: 71.4, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 59 },
    back: { x0: 28.5, y0: 16.8, x1: 71.4, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 59 },
  },
  'bundc-t-shirt-e150-long-sleeve-women-exact': {
    front: { x0: 25.8, y0: 18.1, x1: 74.2, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
    back: { x0: 25.8, y0: 18.1, x1: 74.2, y1: 83.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 43, garmentHeightCm: 51 },
  },
  'bundc-mens-t-shirt-e190-long-sleeve-exact': {
    front: { x0: 29.2, y0: 16.5, x1: 70.9, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    back: { x0: 29.1, y0: 16.5, x1: 70.8, y1: 72.8, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 61 },
    sleeve_left: { x0: 36.1, y0: 8.1, x1: 64.6, y1: 91.9, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.5, boxHeightCm: 69.9, startXCm: 10.2, startYCm: 11.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-recycled-performance-long-sleeve-t-shirt': {
    front: { x0: 29.4, y0: 16.4, x1: 70.5, y1: 71.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
    back: { x0: 29.4, y0: 16.4, x1: 70.5, y1: 71.9, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 62 },
  },
  'neutral-men-s-long-sleeve-t-shirt': {
    front: { x0: 28.5, y0: 16.8, x1: 71.4, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 59 },
    back: { x0: 28.2, y0: 16.8, x1: 71.1, y1: 74.7, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 59 },
  },
  'sols-men-s-plain-fleece-jacket-norman': {
    front: { x0: 31.6, y0: 26.8, x1: 68.3, y1: 76.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 60 },
    back: { x0: 31.5, y0: 26.7, x1: 68.3, y1: 76.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 48, garmentHeightCm: 60 },
  },
  'sols-women-s-plain-fleece-jacket-norman': {
    front: { x0: 29.9, y0: 26.5, x1: 70.7, y1: 81.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 54 },
    back: { x0: 29.6, y0: 26.7, x1: 70.2, y1: 81.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 44, garmentHeightCm: 54 },
  },
  'sols-women-s-fleecejacket-north': {
    front: { x0: 29, y0: 27.8, x1: 69.4, y1: 82.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 53 },
    back: { x0: 29.8, y0: 27.6, x1: 70.2, y1: 82.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 53 },
  },
  'sols-mens-factor-zipped-fleece-jacket': {
    front: { x0: 31.5, y0: 27.2, x1: 68, y1: 76.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 60 },
    back: { x0: 32, y0: 27.5, x1: 68.3, y1: 76.5, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 50, garmentHeightCm: 60 },
  },
  'russell-outdoor-fleece-jacke': {
    front: { x0: 31.2, y0: 28.3, x1: 68.5, y1: 78.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 57 },
    back: { x0: 31.3, y0: 28, x1: 69.1, y1: 79.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 49, garmentHeightCm: 57 },
  },
  'jamesnicholson-men-s-fleece-jacket-jn': {
    front: { x0: 31.4, y0: 25.8, x1: 68.6, y1: 76.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 54, garmentHeightCm: 60 },
    back: { x0: 31.6, y0: 26, x1: 68.8, y1: 76.1, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 54, garmentHeightCm: 60 },
  },
  'id-identity-microfleece-jacke': {
    front: { x0: 31.6, y0: 25.6, x1: 68.4, y1: 75.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 56, garmentHeightCm: 61 },
    back: { x0: 31.5, y0: 25.4, x1: 68.4, y1: 75.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 56, garmentHeightCm: 61 },
  },
  'jamesnicholson-ladies-fleece-jacket-jn781': {
    front: { x0: 29.5, y0: 25.4, x1: 70.9, y1: 81.3, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 54 },
    back: { x0: 29.7, y0: 26.8, x1: 70.2, y1: 81.6, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 47, garmentHeightCm: 54 },
  },
  'bundc-microfleece-duo-id501': {
    front: { x0: 31.4, y0: 28.8, x1: 68.2, y1: 78.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 58 },
    back: { x0: 31.4, y0: 28.8, x1: 68.2, y1: 78.4, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 52, garmentHeightCm: 58 },
  },
  'bundc-microfleece-duo-id501-women': {
    front: { x0: 32.4, y0: 28.4, x1: 67.7, y1: 76, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 56, garmentHeightCm: 61 },
    back: { x0: 31.4, y0: 25.4, x1: 68.3, y1: 75.2, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 47, garmentWidthCm: 56, garmentHeightCm: 61 },
  },
};
