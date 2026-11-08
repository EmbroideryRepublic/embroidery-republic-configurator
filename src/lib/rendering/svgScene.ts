import type { PixelRect } from '@/lib/canvas/cmConversion';
import { hatEchtenSchnitt, resolveFontFamily } from './fonts';
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

type TextElement = Extract<RenderableElement, { type: 'text' }>;

/** Neigung, mit der ein fehlender Kursiv-Schnitt nachgebildet wird: tan = 0,25
 *  (≈ 14°) – dieselbe künstliche Schrägstellung, die Browser (Skia) bei einer
 *  Schrift ohne Kursiv-Variante wie Impact anwenden, also das, was die
 *  Kundschaft im Editor gesehen hat. */
const KURSIV_NEIGUNG_GRAD = 14;

/** Zeilen genau wie im Editor: dort ist der Zeilenumbruch ein Teil des
 *  Textes (Eingabetaste im Textfeld), jede Zeile steht für sich. */
export function zerlegeInZeilen(inhalt: string): string[] {
  return inhalt.split(/\r\n|\r|\n/);
}

/** Zeilenabstand in Pixeln. Der Editor (Konva) rechnet je Zeile
 *  `lineHeight × fontSize`; fehlt/ungültig → Editor-Standard 1,2. */
function zeilenabstandPx(element: TextElement, renderScale: number): number {
  const faktor = Number.isFinite(element.lineHeight) && element.lineHeight > 0 ? element.lineHeight : 1.2;
  return faktor * element.fontSizePx * renderScale;
}

/** Die Attribute EINER Textzeile. `kursivNachbilden` setzt font-style auf
 *  normal – die Schrägstellung kommt dann ausschließlich aus der Scherung,
 *  damit eine künftige Rendering-Version nicht zusätzlich selbst schert. */
function textAttribute(
  element: TextElement,
  x: number,
  y: number,
  renderScale: number,
  kursivNachbilden: boolean,
  zeilenerhalt: boolean
): string {
  const fontFamily = resolveFontFamily(element.fontFamily);
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
    `y="${y}"`,
    `text-anchor="${textAnchorAttr(element.align)}"`,
    `dominant-baseline="central"`,
    `font-family="${escapeXml(fontFamily)}"`,
    `font-size="${fontSizePx}"`,
    `font-weight="${element.bold ? 700 : 400}"`,
    `font-style="${element.italic && !kursivNachbilden ? 'italic' : 'normal'}"`,
    `letter-spacing="${letterSpacing}"`,
    `fill="${escapeXml(element.color)}"`,
  ];
  if (element.hasOutline) {
    attrs.push(`stroke="${escapeXml(element.outlineColor)}"`, `stroke-width="${outlineStrokeWidth}"`);
  }
  if (element.hasShadow) {
    attrs.push(`filter="url(#text-shadow)"`);
  }
  // Mehrzeiliger Text: Leerzeichen so lassen, wie sie getippt wurden – der
  // Editor misst und zentriert jede Zeile samt Leerzeichen am Zeilenende
  // ("Team " + Zeilenumbruch steht dort einen halben Leerschritt weiter links).
  if (zeilenerhalt) {
    attrs.push(`xml:space="preserve"`);
  }
  return attrs.join(' ');
}

/**
 * Zeichnet ein Text-Element um die Mitte von `rect` (Drehung um diese Mitte,
 * wie im Editor).
 *
 * ── Mehrzeiliger Text ──────────────────────────────────────────────────
 * Ein Zeilenumbruch im Text (Eingabetaste im Editor) wird in SVG von einem
 * einzelnen <text> wie ein Leerzeichen behandelt – "Team ⏎ Schüplitz" stand
 * dadurch in der Vorschau und im Produktionsblatt auf EINER Zeile (Fund
 * Bestellung ER-2026-F5EE03). Jetzt bekommt jede Zeile ihr eigenes <text>,
 * Abstand je Zeile = lineHeight × Schriftgröße.
 *
 * Der Zeilenblock beginnt an der OBEREN Kante der Box – genau wie im Editor:
 * Dort ist die Box nur die Position (Konva-Text ohne feste Höhe, siehe
 * ConfiguratorCanvas TextNode), der Text hängt an ihrer oberen linken Ecke und
 * ragt bei mehr als einer Zeile unten über die gespeicherte Box hinaus. Mittig
 * gesetzt säße ein zweizeiliger Text rund 1 cm höher als im Editor.
 * Einzeiliger Text bleibt Zeichen für Zeichen wie vorher.
 *
 * ── Kursiv ohne Kursiv-Schnitt ────────────────────────────────────────
 * Fehlt der Ersatzschrift ein echter Kursiv-Schnitt (Anton für Impact), wird
 * die Zeile um KURSIV_NEIGUNG_GRAD geschert – siehe fonts.ts::hatEchtenSchnitt.
 */
export function renderTextElement(rect: PixelRect, element: TextElement, renderScale: number): string {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const x = textAnchorX(element.align, rect.width);
  const zeilen = zerlegeInZeilen(element.content);
  const kursivNachbilden = element.italic && !hatEchtenSchnitt(element.fontFamily, 'italic');
  const scherung = `skewX(-${KURSIV_NEIGUNG_GRAD})`;

  let inhalt: string;
  if (zeilen.length === 1) {
    const text = `<text ${textAttribute(element, x, 0, renderScale, kursivNachbilden, false)}>${escapeXml(element.content)}</text>`;
    inhalt = kursivNachbilden ? `<g transform="${scherung}">${text}</g>` : text;
  } else {
    const abstand = zeilenabstandPx(element, renderScale);
    inhalt = zeilen
      .map((zeile, i) => {
        // Leere Zeile: nichts zeichnen, aber den Platz im Block lassen.
        if (zeile.length === 0) return '';
        // Mitte der Zeile i: obere Boxkante + (i + ½) Zeilenhöhen (Konva).
        const y = -rect.height / 2 + (i + 0.5) * abstand;
        if (!kursivNachbilden) {
          return `<text ${textAttribute(element, x, y, renderScale, false, true)}>${escapeXml(zeile)}</text>`;
        }
        // Scherung um die Mitte der EIGENEN Zeile, nicht um die Blockmitte.
        return (
          `<g transform="translate(0,${y}) ${scherung}">` +
          `<text ${textAttribute(element, x, 0, renderScale, true, true)}>${escapeXml(zeile)}</text>` +
          `</g>`
        );
      })
      .join('');
  }

  return `<g transform="translate(${centerX},${centerY}) rotate(${element.rotationDeg})">${inhalt}</g>`;
}

/** Gemeinsamer <defs>-Block (Textschatten) für alle Szenen dieser Datei. */
function szenenDefinitionen(renderScale: number): string {
  return `<defs>
    <filter id="text-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${2 * renderScale}" dy="${2 * renderScale}" stdDeviation="${2 * renderScale}" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
  </defs>`;
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
  ${szenenDefinitionen(params.renderScale)}
  <rect width="100%" height="100%" fill="white"/>
  ${renderGarment(garment, imageRect)}
  ${elementMarkup}
</svg>`;
}

/** Rechteck in Szenenkoordinaten (Pixel). */
export interface Ausschnitt {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSzeneParams {
  /** Nennmaße der Fläche, in der der Text liegt: Ausrichtung (links/mittig/
   *  rechts) und Mitte beziehen sich darauf, wie bei der Textbox im Editor. */
  widthPx: number;
  heightPx: number;
  /** Bildpunkte je logischem Editor-Pixel (siehe renderTextJpg.ts). */
  renderScale: number;
  element: TextElement;
  /** Sichtbarer Ausschnitt der Szene; ohne Angabe die ganze Fläche. */
  ausschnitt?: Ausschnitt;
  /** Deckender Hintergrund als CSS-Farbe; ohne Angabe transparent. */
  hintergrund?: string;
}

/**
 * Szene NUR mit dem Text – ohne Kleidungsstück, unverdreht und mittig in der
 * Fläche. Grundlage für den Text-Download (renderTextJpg.ts): derselbe
 * Zeichenweg wie in der Produktionsvorschau, damit beide nie auseinanderlaufen.
 *
 * Mit `ausschnitt` zeigt das Bild nur diesen Teil der Szene (viewBox), ohne
 * die Fläche in voller Größe rastern zu müssen.
 */
export function buildTextOnlySvg(params: TextSzeneParams): string {
  const { widthPx, heightPx, renderScale, element } = params;
  const aus = params.ausschnitt ?? { x: 0, y: 0, width: widthPx, height: heightPx };
  const aufrecht: TextElement = { ...element, rotationDeg: 0 };
  const markup = renderTextElement({ x: 0, y: 0, width: widthPx, height: heightPx }, aufrecht, renderScale);
  const hintergrund = params.hintergrund
    ? `<rect x="${aus.x}" y="${aus.y}" width="${aus.width}" height="${aus.height}" fill="${escapeXml(params.hintergrund)}"/>`
    : '';
  return `<svg width="${aus.width}" height="${aus.height}" viewBox="${aus.x} ${aus.y} ${aus.width} ${aus.height}" xmlns="http://www.w3.org/2000/svg">
  ${szenenDefinitionen(renderScale)}
  ${hintergrund}
  ${markup}
</svg>`;
}
