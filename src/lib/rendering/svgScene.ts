import type { PixelRect } from '@/lib/canvas/cmConversion';
import { resolveFontFamily } from './fonts';
import type { GarmentImageInfo } from './garmentImageInfo';
import type { RenderableElement } from './types';

export interface PositionedElement {
  element: RenderableElement;
  /** Bereits mit renderScale multiplizierter Pixel-Rect (siehe renderPrintView.ts). */
  rect: PixelRect;
}

export interface SceneParams {
  canvasWidthPx: number;
  canvasHeightPx: number;
  renderScale: number;
  garment: GarmentImageInfo;
  imageRect: PixelRect;
  elements: PositionedElement[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Extrahiert den Inhalt eines <svg>-Wurzelelements (ohne die äußeren
 *  <svg>/</svg>-Tags), damit er als Inline-Fragment in die Gesamt-Szene
 *  eingebettet werden kann – schärfer als ein Rasterisierungs-Umweg. */
function extractSvgInnerContent(svgMarkup: string): string {
  const inner = svgMarkup.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (inner === undefined) {
    throw new Error('Konnte <svg>-Inhalt nicht extrahieren (unerwartetes Markup-Format).');
  }
  return inner;
}

function renderGarment(garment: GarmentImageInfo, imageRect: PixelRect): string {
  if (garment.kind === 'svg') {
    const inner = extractSvgInnerContent(garment.svgMarkup);
    const scaleX = imageRect.width / garment.naturalWidth;
    const scaleY = imageRect.height / garment.naturalHeight;
    return `<g transform="translate(${imageRect.x},${imageRect.y}) scale(${scaleX},${scaleY})">${inner}</g>`;
  }
  const base64 = garment.pngBuffer.toString('base64');
  return `<image href="data:image/png;base64,${base64}" x="${imageRect.x}" y="${imageRect.y}" width="${imageRect.width}" height="${imageRect.height}" preserveAspectRatio="none"/>`;
}

/** Dreht das Motiv um seine EIGENE Mitte (wie der Editor, siehe
 *  ConfiguratorCanvas.tsx LogoNode), nicht um die obere linke Ecke von
 *  `rect` – sonst weicht die gedrehte Position im Druck-Rendering sichtbar
 *  von der im Editor gezeigten Position ab. */
function renderLogoElement(rect: PixelRect, rotationDeg: number, imageBuffer: Buffer): string {
  const base64 = imageBuffer.toString('base64');
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  return `<g transform="translate(${centerX},${centerY}) rotate(${rotationDeg})">` +
    `<image href="data:image/png;base64,${base64}" x="${-rect.width / 2}" y="${-rect.height / 2}" width="${rect.width}" height="${rect.height}" preserveAspectRatio="none"/>` +
    `</g>`;
}

/** Baut den <text>-Anker-Offset innerhalb der (bereits vermessenen, in
 *  Konva "wrap=none" nie mehr neu umgebrochenen) Text-Box, passend zu
 *  Konvas horizontalem `align`. Bei align=center liegt der Anker exakt in
 *  der Boxmitte (x=0 relativ zur Gruppe); bei left/right am jeweiligen
 *  Boxrand, damit der Textlauf dort beginnt/endet statt mittig zu
 *  bleiben. */
function textAnchorX(align: 'left' | 'center' | 'right', widthPx: number): number {
  if (align === 'left') return -widthPx / 2;
  if (align === 'right') return widthPx / 2;
  return 0;
}

function textAnchorAttr(align: 'left' | 'center' | 'right'): string {
  if (align === 'left') return 'start';
  if (align === 'right') return 'end';
  return 'middle';
}

function renderTextElement(rect: PixelRect, element: Extract<RenderableElement, { type: 'text' }>, renderScale: number): string {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const fontFamily = resolveFontFamily(element.fontFamily);
  const x = textAnchorX(element.align, rect.width);
  // fontSizePx/letterSpacing sind im Editor Pixelwerte relativ zum
  // LOGISCHEN 700×840-Canvas (Konva-Stage-Zoom ist rein visuell, ändert
  // diese Werte nicht) – müssen hier wie alle anderen Positions-/
  // Größenwerte mit renderScale hochskaliert werden, sonst wirkt der Text
  // bei hoher Zielauflösung viel zu klein.
  const fontSizePx = element.fontSizePx * renderScale;
  const letterSpacing = element.letterSpacing * renderScale;
  const outlineStrokeWidth = 0.8 * renderScale;
  const attrs = [
    `x="${x}"`,
    `y="0"`,
    `text-anchor="${textAnchorAttr(element.align)}"`,
    `dominant-baseline="central"`,
    `font-family="${escapeXml(fontFamily)}"`,
    `font-size="${fontSizePx}"`,
    `font-weight="${element.bold ? 700 : 400}"`,
    `font-style="${element.italic ? 'italic' : 'normal'}"`,
    `letter-spacing="${letterSpacing}"`,
    `fill="${escapeXml(element.color)}"`,
  ];
  if (element.hasOutline) {
    attrs.push(`stroke="${escapeXml(element.outlineColor)}"`, `stroke-width="${outlineStrokeWidth}"`);
  }
  if (element.hasShadow) {
    attrs.push(`filter="url(#text-shadow)"`);
  }
  return `<g transform="translate(${centerX},${centerY}) rotate(${element.rotationDeg})">` +
    `<text ${attrs.join(' ')}>${escapeXml(element.content)}</text>` +
    `</g>`;
}

export function buildSceneSvg(params: SceneParams): string {
  const { canvasWidthPx, canvasHeightPx, garment, imageRect, elements } = params;

  const elementMarkup = elements
    .map(({ element, rect }) => {
      if (element.type === 'logo') {
        return renderLogoElement(rect, element.rotationDeg, element.imageBuffer);
      }
      return renderTextElement(rect, element, params.renderScale);
    })
    .join('\n');

  return `<svg width="${canvasWidthPx}" height="${canvasHeightPx}" viewBox="0 0 ${canvasWidthPx} ${canvasHeightPx}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="text-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${2 * params.renderScale}" dy="${2 * params.renderScale}" stdDeviation="${2 * params.renderScale}" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
  ${renderGarment(garment, imageRect)}
  ${elementMarkup}
</svg>`;
}
