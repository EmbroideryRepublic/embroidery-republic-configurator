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
    sleeve_left: { x0: 33.5, y0: 8.8, x1: 63.5, y1: 88.9, imgW: 650, imgH: 717, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 12.3, boxHeightCm: 36.2, startXCm: 6.4, startYCm: 9.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 36.5, y0: 8.8, x1: 66.5, y1: 88.9, imgW: 650, imgH: 717, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 12.3, boxHeightCm: 36.2, startXCm: 5.9, startYCm: 9.1, garmentWidthCm: 10.9, garmentHeightCm: 10 },
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
    sleeve_left: { x0: 15.9, y0: 9.3, x1: 84.1, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25, boxHeightCm: 34.8, startXCm: 12.6, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 15.9, y0: 9.3, x1: 84.1, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 25, boxHeightCm: 34.8, startXCm: 12.5, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-premium-polo': {
    front: { x0: 30.9, y0: 16.5, x1: 69.6, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 27.9, maxHeightCm: 47, boxWidthCm: 27.9, boxHeightCm: 58, garmentWidthCm: 48, garmentHeightCm: 61 },
    back: { x0: 31, y0: 16.5, x1: 69.2, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 27.4, maxHeightCm: 47, boxWidthCm: 27.4, boxHeightCm: 58, garmentWidthCm: 48, garmentHeightCm: 61 },
    sleeve_left: { x0: 16.9, y0: 9.7, x1: 83, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.8, boxHeightCm: 29.5, startXCm: 10.4, startYCm: 14.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 16.7, y0: 9.7, x1: 83.1, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.9, boxHeightCm: 29.5, startXCm: 10.5, startYCm: 14.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'fotl-ladies-premium-polo': {
    front: { x0: 32, y0: 17.4, x1: 68, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 23.7, maxHeightCm: 47, boxWidthCm: 23.7, boxHeightCm: 49.4, garmentWidthCm: 43, garmentHeightCm: 55 },
    back: { x0: 32, y0: 17.4, x1: 68, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 23.7, maxHeightCm: 47, boxWidthCm: 23.7, boxHeightCm: 49.4, garmentWidthCm: 43, garmentHeightCm: 55 },
    sleeve_left: { x0: 11.7, y0: 10, x1: 88.5, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.4, boxHeightCm: 25.8, startXCm: 10.4, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 11.7, y0: 10, x1: 88.2, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.3, boxHeightCm: 25.8, startXCm: 10.8, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
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
    sleeve_left: { x0: 10.2, y0: 10.3, x1: 89.8, y1: 89.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.5, boxHeightCm: 28.3, startXCm: 12.2, startYCm: 13.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.2, y0: 10.3, x1: 89.8, y1: 89.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.5, boxHeightCm: 28.3, startXCm: 12.2, startYCm: 13.5, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'sols-north-fleece': {
    front: { x0: 31.2, y0: 24.2, x1: 68.8, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.8, garmentWidthCm: 56, garmentHeightCm: 61 },
    back: { x0: 31.1, y0: 24.2, x1: 68.7, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.8, garmentWidthCm: 56, garmentHeightCm: 61 },
  },
  'gildan-heavy-t': {
    front: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.3, boxHeightCm: 59.5, garmentWidthCm: 46.8, garmentHeightCm: 62.6 },
    back: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.3, boxHeightCm: 59.5, garmentWidthCm: 46.8, garmentHeightCm: 62.6 },
    sleeve_left: { x0: 13.3, y0: 9.8, x1: 86.7, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22, boxHeightCm: 28, startXCm: 11, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 13.3, y0: 9.8, x1: 86.7, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22, boxHeightCm: 28, startXCm: 11, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-softstyle-polo': {
    front: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.5, boxHeightCm: 59.8, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 28, y0: 16.3, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 32.6, boxHeightCm: 59.9, garmentWidthCm: 49, garmentHeightCm: 63 },
    sleeve_left: { x0: 14.8, y0: 9.3, x1: 85.1, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.1, boxHeightCm: 35.2, startXCm: 13, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.8, y0: 9.3, x1: 85.7, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 26.4, boxHeightCm: 35.2, startXCm: 13.2, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-vneck-t': {
    front: { x0: 28, y0: 25, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.5, boxHeightCm: 53.9, garmentWidthCm: 47, garmentHeightCm: 63 },
    back: { x0: 28, y0: 17.7, x1: 72, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 34, boxHeightCm: 61.4, garmentWidthCm: 47, garmentHeightCm: 63 },
    sleeve_left: { x0: 18.7, y0: 9.3, x1: 81.2, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23, boxHeightCm: 34.9, startXCm: 11.7, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 18.7, y0: 9.3, x1: 81.2, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 23, boxHeightCm: 34.9, startXCm: 11.4, startYCm: 15.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-t': {
    front: { x0: 31, y0: 19.5, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.9, maxHeightCm: 47, boxWidthCm: 26.9, boxHeightCm: 48.9, garmentWidthCm: 40, garmentHeightCm: 55 },
    back: { x0: 31, y0: 18.6, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.1, maxHeightCm: 47, boxWidthCm: 26.1, boxHeightCm: 48.1, garmentWidthCm: 40, garmentHeightCm: 55 },
    sleeve_left: { x0: 10.2, y0: 10.6, x1: 89.8, y1: 89.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.5, boxHeightCm: 28.2, startXCm: 12.2, startYCm: 11.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.2, y0: 10.3, x1: 89.8, y1: 89.8, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.3, boxHeightCm: 28.2, startXCm: 12.2, startYCm: 11.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-heavy-t': {
    front: { x0: 30, y0: 17.4, x1: 70, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.4, maxHeightCm: 47, boxWidthCm: 26.4, boxHeightCm: 47.1, garmentWidthCm: 42, garmentHeightCm: 55 },
    back: { x0: 30, y0: 17.4, x1: 70, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 26.4, maxHeightCm: 47, boxWidthCm: 26.4, boxHeightCm: 47.1, garmentWidthCm: 42, garmentHeightCm: 55 },
    sleeve_left: { x0: 10.7, y0: 14.1, x1: 89.3, y1: 86.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21, boxHeightCm: 22.3, startXCm: 10.2, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.7, y0: 14.1, x1: 89.3, y1: 86.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21, boxHeightCm: 22.3, startXCm: 10.8, startYCm: 10.7, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-vneck-t': {
    front: { x0: 29.7, y0: 31, x1: 69.2, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 29.3, maxHeightCm: 44, boxWidthCm: 29.3, boxHeightCm: 44, garmentWidthCm: 40, garmentHeightCm: 53 },
    back: { x0: 29.8, y0: 22.3, x1: 70.2, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 51.5, garmentWidthCm: 40, garmentHeightCm: 53 },
    sleeve_left: { x0: 13.3, y0: 10, x1: 86.7, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.4, boxHeightCm: 25.7, startXCm: 10, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 13.3, y0: 10, x1: 86.6, y1: 90, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 20.3, boxHeightCm: 25.7, startXCm: 10.4, startYCm: 9.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'gildan-ladies-polo': {
    front: { x0: 30, y0: 17.7, x1: 69, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 24.9, maxHeightCm: 47, boxWidthCm: 24.9, boxHeightCm: 47.7, garmentWidthCm: 43, garmentHeightCm: 53 },
    back: { x0: 30, y0: 17.7, x1: 69, y1: 82, imgW: 620, imgH: 720, maxWidthCm: 24.9, maxHeightCm: 47, boxWidthCm: 24.9, boxHeightCm: 47.7, garmentWidthCm: 43, garmentHeightCm: 53 },
    sleeve_left: { x0: 14.6, y0: 9.8, x1: 85.4, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.3, boxHeightCm: 28.1, startXCm: 10.5, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.8, y0: 9.8, x1: 85.2, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.2, boxHeightCm: 28.1, startXCm: 10.7, startYCm: 13.6, garmentWidthCm: 10.9, garmentHeightCm: 10 },
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
    sleeve_left: { x0: 12.6, y0: 9.9, x1: 87.4, y1: 90.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.7, boxHeightCm: 27, startXCm: 10.8, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 12.6, y0: 9.9, x1: 87.2, y1: 90.1, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 21.6, boxHeightCm: 27, startXCm: 10.8, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-workwear-t': {
    front: { x0: 26, y0: 17.5, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 36.2, boxHeightCm: 60, garmentWidthCm: 50, garmentHeightCm: 62 },
    back: { x0: 26, y0: 16.4, x1: 74, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 35.1, boxHeightCm: 59.1, garmentWidthCm: 50, garmentHeightCm: 62 },
    sleeve_left: { x0: 15.5, y0: 9.3, x1: 84.3, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.8, boxHeightCm: 34, startXCm: 12.4, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 15.5, y0: 9.3, x1: 84.3, y1: 90.7, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.8, boxHeightCm: 34, startXCm: 12.4, startYCm: 15.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'russell-ladies-authentic-t': {
    front: { x0: 31, y0: 17.7, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 24.3, maxHeightCm: 45.5, boxWidthCm: 24.3, boxHeightCm: 45.5, garmentWidthCm: 41, garmentHeightCm: 53 },
    back: { x0: 31, y0: 17.7, x1: 69, y1: 79, imgW: 620, imgH: 720, maxWidthCm: 24.3, maxHeightCm: 45.5, boxWidthCm: 24.3, boxHeightCm: 45.5, garmentWidthCm: 41, garmentHeightCm: 53 },
    sleeve_left: { x0: 11, y0: 12.8, x1: 89, y1: 87.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.4, boxHeightCm: 21.5, startXCm: 9.6, startYCm: 11, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 11, y0: 12.9, x1: 89, y1: 87.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 19.4, boxHeightCm: 21.5, startXCm: 9.8, startYCm: 11, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-classic-polo': {
    front: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 49, garmentHeightCm: 60 },
    back: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 49, garmentHeightCm: 60 },
    sleeve_left: { x0: 14.8, y0: 9.4, x1: 85.3, y1: 90.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.3, boxHeightCm: 32.5, startXCm: 12, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14.8, y0: 9.4, x1: 85.3, y1: 90.6, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 24.3, boxHeightCm: 32.5, startXCm: 12.3, startYCm: 16.2, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'neutral-rollsleeve-t': {
    front: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 47, garmentHeightCm: 60 },
    back: { x0: 28, y0: 16.7, x1: 73, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 31.9, boxHeightCm: 57.1, garmentWidthCm: 47, garmentHeightCm: 60 },
    sleeve_left: { x0: 10.5, y0: 11.4, x1: 89.5, y1: 88.4, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 25, startXCm: 11, startYCm: 12.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 10.5, y0: 11.5, x1: 89.5, y1: 88.5, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.1, boxHeightCm: 25, startXCm: 11.1, startYCm: 12.3, garmentWidthCm: 10.9, garmentHeightCm: 10 },
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
    sleeve_left: { x0: 12, y0: 9.8, x1: 87.8, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.8, boxHeightCm: 28.1, startXCm: 11.4, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 12, y0: 9.8, x1: 88, y1: 90.2, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.9, boxHeightCm: 28.1, startXCm: 11.4, startYCm: 13.9, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jn-active-t': {
    front: { x0: 29.6, y0: 19, x1: 70.2, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.5, garmentWidthCm: 49, garmentHeightCm: 63 },
    back: { x0: 29.6, y0: 19, x1: 70.2, y1: 86, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 30, boxHeightCm: 57.5, garmentWidthCm: 49, garmentHeightCm: 63 },
    sleeve_left: { x0: 14, y0: 9.7, x1: 85.8, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.3, boxHeightCm: 29.1, startXCm: 11.2, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
    sleeve_right: { x0: 14, y0: 9.7, x1: 85.8, y1: 90.3, imgW: 620, imgH: 720, maxWidthCm: 8.9, maxHeightCm: 10, boxWidthCm: 22.3, boxHeightCm: 29.1, startXCm: 11.1, startYCm: 14, garmentWidthCm: 10.9, garmentHeightCm: 10 },
  },
  'jn-halfzip-sweat': {
    front: { x0: 28, y0: 24.6, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.7, boxHeightCm: 49.3, garmentWidthCm: 53, garmentHeightCm: 58 },
    back: { x0: 28, y0: 24.6, x1: 72, y1: 80, imgW: 620, imgH: 720, maxWidthCm: 30, maxHeightCm: 47, boxWidthCm: 33.7, boxHeightCm: 49.3, garmentWidthCm: 53, garmentHeightCm: 58 },
  },
};
