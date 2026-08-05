import { Resvg } from '@resvg/resvg-js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, getProduct } from '@/config/products';
import { bildFuerAnsicht } from '@/lib/assets';
import { getPrintAreas } from '@/config/printAreas';
import { getContainRect, computeAreaPx } from '@/lib/canvas/containRect';
import { getScaleFactors, elementToPixelRect } from '@/lib/canvas/cmConversion';
import { getFontFiles } from './fonts';
import { loadGarmentImageInfo } from './garmentImageInfo';
import { buildSceneSvg, type PositionedElement } from './svgScene';
import type { RenderPrintViewInput, RenderPrintViewResult } from './types';

// Zielauflösung des Druckbereichs, bewusst identisch zu LogoUploader.tsx
// MIN_DPI – die neue Render-Qualität hängt damit an derselben Meßlatte wie
// die bereits bestehende Upload-Qualitätsprüfung.
const TARGET_PRINT_AREA_DPI = 150;
const TARGET_PX_PER_CM = TARGET_PRINT_AREA_DPI / 2.54;
const MIN_RENDER_SCALE = 3;
const MAX_RENDER_SCALE = 10;

const DEFAULT_FONT_FAMILY = 'Arimo';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Rendert EINE Ansicht (front/back/sleeve_left/sleeve_right) EINER
 * Bestellposition zu einem hochauflösenden PNG – reine Funktion: bekommt
 * bereits geladene Element-Daten (inkl. Logo-Bytes) mit, lädt selbst
 * nichts aus Supabase nach (das übernimmt der Aufrufer, siehe orders.ts).
 * Dadurch auch für ein späteres Reprint-Werkzeug wiederverwendbar, das die
 * Elemente stattdessen direkt aus der DB + Storage lädt.
 *
 * Nutzt exakt dieselbe Geometrie (getContainRect/computeAreaPx/
 * getScaleFactors/elementToPixelRect) wie der Browser-Editor
 * (ConfiguratorCanvas.tsx), damit beide niemals auseinanderdriften.
 */
export async function renderPrintView(input: RenderPrintViewInput): Promise<RenderPrintViewResult | null> {
  if (input.elements.length === 0) return null;

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
  const printArea = printAreas.find((a) => a.view === input.view);
  if (!printArea) return null;

  const garment = await loadGarmentImageInfo(imagePath);

  // Schritt 1: logische Geometrie (renderScale=1) NUR um pxPerCm zu
  // ermitteln, damit die Ziel-DPI unabhängig vom tatsächlichen
  // Zuschnitt/Seitenverhältnis des jeweiligen Produktfotos konsistent ist.
  const imageRectLogical = getContainRect(garment.naturalWidth, garment.naturalHeight, CANVAS_WIDTH, CANVAS_HEIGHT, printArea.heightPercent / 100);
  const areaPxHeightLogical = (printArea.heightPercent / 100) * imageRectLogical.height;
  const pxPerCmLogical = areaPxHeightLogical / printArea.boxHeightCm;
  const renderScale = clamp(TARGET_PX_PER_CM / pxPerCmLogical, MIN_RENDER_SCALE, MAX_RENDER_SCALE);

  const canvasWidthPx = CANVAS_WIDTH * renderScale;
  const canvasHeightPx = CANVAS_HEIGHT * renderScale;

  // Schritt 2: dieselbe Geometrie erneut, diesmal bei voller Render-Auflösung.
  const imageRect = getContainRect(garment.naturalWidth, garment.naturalHeight, canvasWidthPx, canvasHeightPx, printArea.heightPercent / 100);
  const areaPx = computeAreaPx(imageRect, printArea);
  const scaleFactors = getScaleFactors(areaPx, printArea);

  const positionedElements: PositionedElement[] = input.elements.map((element) => ({
    element,
    rect: elementToPixelRect(areaPx, scaleFactors, element),
  }));

  const svg = buildSceneSvg({
    canvasWidthPx,
    canvasHeightPx,
    renderScale,
    garment,
    imageRect,
    elements: positionedElements,
  });

  const resvg = new Resvg(svg, {
    font: { fontFiles: getFontFiles(), loadSystemFonts: false, defaultFontFamily: DEFAULT_FONT_FAMILY },
  });
  const pngBuffer = resvg.render().asPng();

  return { pngBuffer, widthPx: canvasWidthPx, heightPx: canvasHeightPx };
}
