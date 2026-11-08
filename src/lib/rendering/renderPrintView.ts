import { Resvg } from '@resvg/resvg-js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products';
import { getContainRect, computeAreaPx } from '@/lib/canvas/containRect';
import { getScaleFactors, elementToPixelRect } from '@/lib/canvas/cmConversion';
import { ladeAnsichtGrundlage } from './ansichtGrundlage';
import { resvgSchriftOptionen } from './fonts';
import { buildSceneSvg, type PositionedElement } from './svgScene';
import type { RenderPrintViewInput, RenderPrintViewResult } from './types';

// Zielauflösung des Druckbereichs, bewusst identisch zu LogoUploader.tsx
// MIN_DPI – die neue Render-Qualität hängt damit an derselben Meßlatte wie
// die bereits bestehende Upload-Qualitätsprüfung.
const TARGET_PRINT_AREA_DPI = 150;
const TARGET_PX_PER_CM = TARGET_PRINT_AREA_DPI / 2.54;
const MIN_RENDER_SCALE = 3;
const MAX_RENDER_SCALE = 10;

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

  // Schritt 1: Produktbild, (größenabhängige) Druckfläche und der logische
  // Maßstab pxPerCm – damit die Ziel-DPI unabhängig vom tatsächlichen
  // Zuschnitt/Seitenverhältnis des jeweiligen Produktfotos konsistent ist.
  // Die Rechnung steckt in ansichtGrundlage.ts, weil der Text-Download
  // (renderTextJpg.ts) exakt denselben Maßstab braucht.
  const grundlage = await ladeAnsichtGrundlage(input);
  if (!grundlage) return null;
  const { garment, printArea, pxPerCmLogisch: pxPerCmLogical } = grundlage;
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

  const resvg = new Resvg(svg, { font: resvgSchriftOptionen() });
  const pngBuffer = resvg.render().asPng();

  return { pngBuffer, widthPx: canvasWidthPx, heightPx: canvasHeightPx };
}
