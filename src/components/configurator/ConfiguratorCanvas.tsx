'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import type { ConfigElement, LogoElement, PrintArea, PrintView, TextElement } from '@/types';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getScaleFactors, type PixelRect, type ScaleFactors } from '@/lib/canvas/cmConversion';
import { isNearSeam, overlapsExclusionZone } from '@/lib/canvas/bounds';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { measureInkCoverageRatio } from '@/lib/canvas/measureText';
import { estimateLogoStitches, estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products';

/**
 * Berechnet die tatsächlich sichtbare Bild-Fläche innerhalb der Canvas,
 * OHNE das Seitenverhältnis zu verzerren ("contain"-Fit, mittig zentriert).
 *
 * BUGFIX: Vorher wurde jedes Produktbild zwangsweise auf exakt
 * CANVAS_WIDTH×CANVAS_HEIGHT gestreckt – bei Bildern mit anderem
 * Seitenverhältnis sah das Kleidungsstück dadurch "gestaucht" oder "fett"
 * aus. Jetzt wird das Bild proportional skaliert und zentriert; die
 * Druckbereiche (siehe unten) werden relativ zu DIESER Fläche berechnet,
 * nicht mehr relativ zur vollen Canvas – funktioniert dadurch automatisch
 * korrekt für jedes Bildformat, ohne die Druckbereichs-Prozentwerte je
 * Bildquelle von Hand anpassen zu müssen.
 */
function getContainRect(
  naturalWidth: number,
  naturalHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  garmentHeightFraction = 1,
  targetGarmentFraction = 0.74
): PixelRect {
  // Statt das GESAMTE Bild in die Leinwand einzupassen (wodurch
  // Produkte mit unterschiedlich viel Leerraum im Foto unterschiedlich
  // groß/klein wirken), wird die Skalierung anhand der tatsächlich
  // vermessenen Kleidungsstück-Fläche berechnet – das Kleidungsstück
  // selbst nimmt dadurch bei jedem Produkt einen ähnlichen Anteil der
  // Leinwandhöhe ein (targetGarmentFraction), unabhängig davon, wie eng
  // oder großzügig das jeweilige Foto zugeschnitten ist.
  const garmentHeightPx = naturalHeight * garmentHeightFraction;
  const scaleForGarmentHeight = (targetGarmentFraction * canvasHeight) / garmentHeightPx;
  const scaleForCanvasWidth = canvasWidth / naturalWidth;
  const scale = Math.min(scaleForGarmentHeight, scaleForCanvasWidth);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

interface ConfiguratorCanvasProps {
  productImageUrl: string;
  printArea: PrintArea | null;
  zoom?: number;
  hideGuides?: boolean;
  /** Überschreibt die aktive Ansicht aus dem Store – wird von der
   *  Großansicht genutzt, die einen eigenen, vom Bearbeitungsbildschirm
   *  unabhängigen Ansichtswechsel hat. Ohne das würden IMMER die Elemente
   *  der zuletzt im Editor aktiven Ansicht gezeigt, unabhängig davon,
   *  welche Ansicht in der Großansicht gerade ausgewählt ist. */
  viewOverride?: PrintView;
}

export function ConfiguratorCanvas({
  productImageUrl,
  printArea,
  zoom = 1,
  hideGuides = false,
  viewOverride,
}: ConfiguratorCanvasProps) {
  const [productImage] = useImage(productImageUrl);
  const storeActiveView = useConfiguratorStore((s) => s.activeView);
  const activeView = viewOverride ?? storeActiveView;
  const elements = useConfiguratorStore((s) => s.elements);
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);
  const updateElement = useConfiguratorStore((s) => s.updateElement);
  const commitElement = useConfiguratorStore((s) => s.commitElement);

  const [isAreaHovered, setIsAreaHovered] = useState(false);
  // Hilfslinien: zeigen an, wenn ein gezogenes Element mittig im
  // Druckbereich ausgerichtet ist (horizontal/vertikal) – wie in
  // klassischen Design-Werkzeugen ("Snap-Guides").
  const [centerGuides, setCenterGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  // Sanfter Übergang bei Bildwechsel (Ansicht/Farbe/Produkt) OHNE die Stage
  // neu zu mounten – ein Remount würde Konva komplett neu aufbauen und
  // genau das Geflacker verursachen, das vermieden werden soll. Stattdessen
  // wird die Stage nur kurz abgeblendet und wieder eingeblendet.
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousImageUrl = useRef(productImageUrl);
  useEffect(() => {
    if (previousImageUrl.current !== productImageUrl) {
      setIsTransitioning(true);
      previousImageUrl.current = productImageUrl;
      const timeout = setTimeout(() => setIsTransitioning(false), 180);
      return () => clearTimeout(timeout);
    }
  }, [productImageUrl]);

  // Responsive Skalierung: die logische Koordinatenwelt bleibt immer
  // CANVAS_WIDTH×CANVAS_HEIGHT (alle cm↔px-Umrechnungen im Projekt bauen
  // darauf auf). Auf schmalen Bildschirmen (Smartphone) wird nur die
  // Stage selbst über Konvas eigenes scaleX/scaleY visuell verkleinert –
  // Klick-/Drag-Koordinaten werden von Konva dabei automatisch korrekt
  // zurückgerechnet, anders als bei einem reinen CSS-transform-Hack.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const containerWidth = containerRef.current?.offsetWidth ?? CANVAS_WIDTH;
      // Verfügbare Höhe direkt aus der Fensterhöhe ableiten (abzüglich
      // Platz für Header/Werkzeugleiste/Zusammenfassung) statt die Höhe
      // eines Containers zu messen, der selbst nur eine CSS max-height
      // (keine feste Höhe) hat – das führte zu einem Henne-Ei-Problem:
      // der Container hatte noch keine echte Höhe, solange die Leinwand
      // (deren Größe genau von dieser Messung abhängt) noch nicht
      // gerendert war, wodurch eine winzige Höhe gemessen wurde.
      const availableHeight = typeof window !== 'undefined' ? window.innerHeight * 0.72 : CANVAS_HEIGHT;
      const widthScale = containerWidth / CANVAS_WIDTH;
      const heightScale = availableHeight / CANVAS_HEIGHT;
      setScale(Math.min(1, widthScale, heightScale));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Nur Elemente der aktuell aktiven Ansicht anzeigen – die anderen bleiben
  // unverändert im Store erhalten (setActiveView löscht keine Elemente,
  // sondern wechselt nur den Filter).
  const viewElements = elements.filter((el) => el.view === activeView);
  const hasSelectionInView = viewElements.some((el) => el.id === selectedElementId);

  // Tatsächlich sichtbare (unverzerrte) Bildfläche innerhalb der Canvas.
  // Solange das Bild noch lädt, wird die volle Canvas als Fallback
  // angenommen (verhindert kurzzeitiges Springen der Druckbereiche).
  const imageRect: PixelRect = productImage
    ? getContainRect(
        productImage.naturalWidth,
        productImage.naturalHeight,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        printArea ? printArea.heightPercent / 100 : 1
      )
    : { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };

  const areaPx: PixelRect | null = printArea
    ? {
        x: imageRect.x + (printArea.xPercent / 100) * imageRect.width,
        y: imageRect.y + (printArea.yPercent / 100) * imageRect.height,
        width: (printArea.widthPercent / 100) * imageRect.width,
        height: (printArea.heightPercent / 100) * imageRect.height,
      }
    : null;

  const scaleFactors = printArea && areaPx ? getScaleFactors(areaPx, printArea) : null;
  const seamMarginPx = scaleFactors && printArea ? printArea.seamMarginCm * scaleFactors.pxPerCmX : 0;
  // Tatsächlicher Skalierungsfaktor der <Stage> (siehe scaleX={scale*zoom}
  // unten) – wird an die Zieh-Begrenzung durchgereicht, damit absolute
  // (skalierte) Konva-Koordinaten korrekt ins logische Koordinatensystem
  // umgerechnet werden können, in dem areaPx/widthPx berechnet sind.
  const stageScale = scale * zoom;

  // Prüft, ob der Mittelpunkt eines gezogenen Elements nah genug am
  // Mittelpunkt des Druckbereichs liegt, um eine Hilfslinie einzublenden.
  function checkCenterGuides(elX: number, elY: number, elWidth: number, elHeight: number) {
    if (!areaPx) return;
    const tolerancePx = 4;
    const elCenterX = elX + elWidth / 2;
    const elCenterY = elY + elHeight / 2;
    const areaCenterX = areaPx.x + areaPx.width / 2;
    const areaCenterY = areaPx.y + areaPx.height / 2;
    setCenterGuides({
      x: Math.abs(elCenterX - areaCenterX) < tolerancePx,
      y: Math.abs(elCenterY - areaCenterY) < tolerancePx,
    });
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full max-w-[700px] justify-center overflow-auto rounded-lg"
      style={{ maxHeight: zoom > 1 ? CANVAS_HEIGHT * scale + 20 : undefined }}
    >
      <Stage
        width={CANVAS_WIDTH * scale * zoom}
        height={CANVAS_HEIGHT * scale * zoom}
        scaleX={scale * zoom}
        scaleY={scale * zoom}
        className={`rounded-lg bg-white shadow-elegant ring-1 ring-gold/15 transition-opacity duration-200 ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        }`}
        onMouseDown={(e) => {
          const target = e.target;
          if (target === target.getStage() || target.name() === 'print-area') {
            setSelectedElementId(null);
          }
        }}
        onTouchStart={(e) => {
          const target = e.target;
          if (target === target.getStage() || target.name() === 'print-area') {
            setSelectedElementId(null);
          }
        }}
      >
        <Layer>
          {productImage && (
            <KonvaImage
              image={productImage}
              x={imageRect.x}
              y={imageRect.y}
              width={imageRect.width}
              height={imageRect.height}
              listening={false}
            />
          )}

          {/* Druckbereich: dezente halbtransparente Goldfläche, beim
              Bearbeiten stärker hervorgehoben; Hover zeigt Maße als Tooltip. */}
          {areaPx && !hideGuides && (
            <>
              <Rect
                name="print-area"
                x={areaPx.x}
                y={areaPx.y}
                width={areaPx.width}
                height={areaPx.height}
                fill="transparent"
                stroke={hasSelectionInView ? '#a8792f' : isAreaHovered ? '#c9b183' : 'rgba(201,177,131,0.35)'}
                strokeWidth={hasSelectionInView ? 1.5 : 1}
                dash={hasSelectionInView ? undefined : [5, 4]}
                cornerRadius={4}
                onMouseEnter={() => setIsAreaHovered(true)}
                onMouseLeave={() => setIsAreaHovered(false)}
              />
              {(isAreaHovered || hasSelectionInView) && printArea && (
                <KonvaText
                  x={areaPx.x}
                  y={areaPx.y - 18}
                  text={`Bewegungsbereich · Motiv max. ${printArea.maxWidthCm}×${printArea.maxHeightCm} cm`}
                  fontSize={11}
                  fontFamily="Inter, sans-serif"
                  fill="#8a6a3a"
                  listening={false}
                />
              )}

              {/* Sperrzonen (z.B. Knopfleiste, Reißverschluss) – kein Motiv
                  darf hier platziert werden. Schraffiert + roter Rahmen,
                  klar vom normalen Druckbereich unterscheidbar. */}
              {printArea?.exclusionZones?.map((zone, i) => {
                const zonePx = {
                  x: imageRect.x + (zone.xPercent / 100) * imageRect.width,
                  y: imageRect.y + (zone.yPercent / 100) * imageRect.height,
                  width: (zone.widthPercent / 100) * imageRect.width,
                  height: (zone.heightPercent / 100) * imageRect.height,
                };
                return (
                  <Group key={i} listening={false}>
                    <Rect
                      x={zonePx.x}
                      y={zonePx.y}
                      width={zonePx.width}
                      height={zonePx.height}
                      fill="rgba(220,38,38,0.08)"
                      stroke="rgba(220,38,38,0.5)"
                      strokeWidth={1}
                      dash={[4, 3]}
                    />
                    <KonvaText
                      x={zonePx.x}
                      y={zonePx.y + zonePx.height / 2 - 5}
                      width={zonePx.width}
                      align="center"
                      text={zone.label}
                      fontSize={8}
                      fontFamily="Inter, sans-serif"
                      fill="rgba(185,28,28,0.8)"
                      listening={false}
                    />
                  </Group>
                );
              })}

              {/* Mittig-Hilfslinien */}
              {centerGuides.x && (
                <Rect
                  x={areaPx.x + areaPx.width / 2 - 0.5}
                  y={areaPx.y - 10}
                  width={1}
                  height={areaPx.height + 20}
                  fill="#e0559a"
                  listening={false}
                />
              )}
              {centerGuides.y && (
                <Rect
                  x={areaPx.x - 10}
                  y={areaPx.y + areaPx.height / 2 - 0.5}
                  width={areaPx.width + 20}
                  height={1}
                  fill="#e0559a"
                  listening={false}
                />
              )}
            </>
          )}

          {areaPx &&
            scaleFactors &&
            viewElements
              .filter((el) => !el.hidden)
              .map((element) =>
              element.type === 'logo' ? (
                <LogoNode
                  key={element.id}
                  element={element}
                  printArea={printArea}
                  areaPx={areaPx}
                  imageRect={imageRect}
                  seamMarginPx={seamMarginPx}
                  scaleFactors={scaleFactors}
                  stageScale={stageScale}
                  isSelected={!hideGuides && element.id === selectedElementId}
                  readOnly={hideGuides}
                  onSelect={() => setSelectedElementId(element.id)}
                  onChange={(changes) => updateElement(element.id, changes)}
                  onCommit={(changes) => commitElement(element.id, changes)}
                  onDragCheck={checkCenterGuides}
                  onDragStop={() => setCenterGuides({ x: false, y: false })}
                />
              ) : (
                <TextNode
                  key={element.id}
                  element={element}
                  printArea={printArea}
                  areaPx={areaPx}
                  imageRect={imageRect}
                  seamMarginPx={seamMarginPx}
                  scaleFactors={scaleFactors}
                  stageScale={stageScale}
                  isSelected={!hideGuides && element.id === selectedElementId}
                  readOnly={hideGuides}
                  onSelect={() => setSelectedElementId(element.id)}
                  onChange={(changes) => updateElement(element.id, changes)}
                  onCommit={(changes) => commitElement(element.id, changes)}
                  onDragCheck={checkCenterGuides}
                  onDragStop={() => setCenterGuides({ x: false, y: false })}
                />
              )
            )}
        </Layer>
      </Stage>
    </div>
  );
}

// ---------------------------------------------------------------
// Gemeinsame Geometrie-Helfer für Logo- und Text-Knoten
// ---------------------------------------------------------------

interface GeometryProps {
  areaPx: PixelRect;
  scaleFactors: ScaleFactors;
  element: Pick<ConfigElement, 'xCm' | 'yCm' | 'widthCm' | 'heightCm'>;
}

/** Kombiniert Nahtabstand- und Sperrzonen-Prüfung (Knopfleiste,
 *  Reißverschluss) zu einem einzigen "außerhalb erlaubt"-Ergebnis. */
function checkOutOfBounds(
  rect: { x: number; y: number; width: number; height: number },
  areaPx: PixelRect,
  seamMarginPx: number,
  printArea: PrintArea | null,
  imageRect: PixelRect
): boolean {
  const nearSeam = isNearSeam(rect, areaPx, seamMarginPx);
  if (nearSeam) return true;
  if (!printArea?.exclusionZones) return false;
  return printArea.exclusionZones.some((zone) => {
    const zonePx = {
      x: imageRect.x + (zone.xPercent / 100) * imageRect.width,
      y: imageRect.y + (zone.yPercent / 100) * imageRect.height,
      width: (zone.widthPercent / 100) * imageRect.width,
      height: (zone.heightPercent / 100) * imageRect.height,
    };
    return overlapsExclusionZone(rect, zonePx);
  });
}

function toPixelRect({ areaPx, scaleFactors, element }: GeometryProps) {
  return {
    x: areaPx.x + element.xCm * scaleFactors.pxPerCmX,
    y: areaPx.y + element.yCm * scaleFactors.pxPerCmY,
    width: element.widthCm * scaleFactors.pxPerCmX,
    height: element.heightCm * scaleFactors.pxPerCmY,
  };
}

function clampDragPosition(
  pos: { x: number; y: number },
  areaPx: PixelRect,
  widthPx: number,
  heightPx: number,
  stageScale: number
) {
  // WICHTIG – eigentliche Ursache des "kann nur nach rechts, nicht nach
  // links"-Bugs: dragBoundFunc liefert die Position in ABSOLUTEN
  // Stage-Koordinaten (also bereits multipliziert mit scaleX/scaleY der
  // Stage, siehe <Stage scaleX={scale*zoom}>). areaPx/widthPx/heightPx
  // sind dagegen im LOGISCHEN, unskalierten Koordinatensystem berechnet
  // (CANVAS_WIDTH/CANVAS_HEIGHT-Basis). Bei jedem Skalierungsfaktor ≠ 1
  // wurden dadurch zwei unterschiedliche Maßstäbe miteinander verglichen –
  // das erklärt die krumme, asymmetrische Begrenzung. Deshalb hier zuerst
  // zurück ins logische System umrechnen, dort klemmen, dann wieder zurück
  // in absolute Koordinaten (die Konva von dragBoundFunc erwartet).
  const logicalPos = { x: pos.x / stageScale, y: pos.y / stageScale };

  // Wenn das Element breiter/höher als der Druckbereich ist, gibt es
  // keine "richtige" Position mehr innerhalb der Grenzen – statt es dann
  // immer an eine feste Seite (links/oben) zu kleben, wird es zentriert.
  const maxX = areaPx.x + areaPx.width - widthPx;
  const maxY = areaPx.y + areaPx.height - heightPx;
  const clampedLogicalX = maxX >= areaPx.x ? Math.min(Math.max(logicalPos.x, areaPx.x), maxX) : areaPx.x + (areaPx.width - widthPx) / 2;
  const clampedLogicalY = maxY >= areaPx.y ? Math.min(Math.max(logicalPos.y, areaPx.y), maxY) : areaPx.y + (areaPx.height - heightPx) / 2;

  return { x: clampedLogicalX * stageScale, y: clampedLogicalY * stageScale };
}

/** Wie clampDragPosition, aber für zentrumsbasiert positionierte Knoten
 *  (TextNode: x/y sind wegen offsetX/offsetY bereits der Mittelpunkt,
 *  nicht die obere linke Ecke). */
function clampDragPositionCentered(
  pos: { x: number; y: number },
  areaPx: PixelRect,
  widthPx: number,
  heightPx: number,
  stageScale: number
) {
  const logicalPos = { x: pos.x / stageScale, y: pos.y / stageScale };

  const halfW = widthPx / 2;
  const halfH = heightPx / 2;
  const minX = areaPx.x + halfW;
  const maxX = areaPx.x + areaPx.width - halfW;
  const minY = areaPx.y + halfH;
  const maxY = areaPx.y + areaPx.height - halfH;
  const clampedLogicalX = Math.min(Math.max(logicalPos.x, Math.min(minX, maxX)), Math.max(minX, maxX));
  const clampedLogicalY = Math.min(Math.max(logicalPos.y, Math.min(minY, maxY)), Math.max(minY, maxY));

  return { x: clampedLogicalX * stageScale, y: clampedLogicalY * stageScale };
}

// ---------------------------------------------------------------
// Logo-Knoten
// ---------------------------------------------------------------

interface LogoNodeProps {
  element: LogoElement;
  printArea: PrintArea | null;
  areaPx: PixelRect;
  imageRect: PixelRect;
  seamMarginPx: number;
  scaleFactors: ScaleFactors;
  stageScale: number;
  isSelected: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<LogoElement>) => void;
  onCommit: (changes: Partial<LogoElement>) => void;
  onDragCheck: (x: number, y: number, width: number, height: number) => void;
  onDragStop: () => void;
}

function LogoNode({
  element,
  printArea,
  areaPx,
  imageRect,
  seamMarginPx,
  scaleFactors,
  stageScale,
  isSelected,
  readOnly = false,
  onSelect,
  onChange,
  onCommit,
  onDragCheck,
  onDragStop,
}: LogoNodeProps) {
  const [image] = useImage(element.fileUrl);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const { x: xPx, y: yPx, width: widthPx, height: heightPx } = toPixelRect({ areaPx, scaleFactors, element });

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={xPx}
        y={yPx}
        width={widthPx}
        height={heightPx}
        rotation={element.rotationDeg}
        draggable={!element.locked && !readOnly}
        listening={!readOnly}
        opacity={element.locked ? 0.7 : 1}
        stroke={element.isOutOfBounds ? '#dc2626' : undefined}
        strokeWidth={element.isOutOfBounds ? 3 : 0}
        onClick={onSelect}
        onTap={onSelect}
        dragBoundFunc={(pos) => clampDragPosition(pos, areaPx, widthPx, heightPx, stageScale)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const nearSeam = checkOutOfBounds(
            { x: node.x(), y: node.y(), width: widthPx, height: heightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );
          if (nearSeam !== element.isOutOfBounds) onChange({ isOutOfBounds: nearSeam });
          onDragCheck(node.x(), node.y(), widthPx, heightPx);
        }}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          onCommit({
            xCm: (node.x() - areaPx.x) / scaleFactors.pxPerCmX,
            yCm: (node.y() - areaPx.y) / scaleFactors.pxPerCmY,
          });
          onDragStop();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;

          let newWidthPx = Math.max(node.width() * node.scaleX(), 15);
          let newHeightPx = Math.max(node.height() * node.scaleY(), 15);
          node.scaleX(1);
          node.scaleY(1);

          // Logo darf die Druckfläche nie überragen – sonst kollabiert
          // die Zieh-Begrenzung auf eine feste Seite (siehe
          // clampDragPosition), was sich wie "nur links/oben bedruckbar"
          // anfühlt. Seitenverhältnis bleibt beim Herunterskalieren erhalten.
          if (printArea) {
            const maxWidthPx = printArea.maxWidthCm * scaleFactors.pxPerCmX;
            const maxHeightPx = printArea.maxHeightCm * scaleFactors.pxPerCmY;
            if (newWidthPx > maxWidthPx || newHeightPx > maxHeightPx) {
              const scale = Math.min(maxWidthPx / newWidthPx, maxHeightPx / newHeightPx);
              newWidthPx *= scale;
              newHeightPx *= scale;
            }
          }

          const nearSeam = checkOutOfBounds(
            { x: node.x(), y: node.y(), width: newWidthPx, height: newHeightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );

          const newWidthCm = newWidthPx / scaleFactors.pxPerCmX;
          const newHeightCm = newHeightPx / scaleFactors.pxPerCmY;

          onCommit({
            widthCm: newWidthCm,
            heightCm: newHeightCm,
            xCm: (node.x() - areaPx.x) / scaleFactors.pxPerCmX,
            yCm: (node.y() - areaPx.y) / scaleFactors.pxPerCmY,
            rotationDeg: node.rotation(),
            isOutOfBounds: nearSeam,
          });

          // Stichzahl hängt von der physischen Größe ab – nach dem
          // Skalieren neu schätzen (asynchron, Bildanalyse blockiert die
          // Ziehgeste selbst nicht).
          estimateLogoStitches(element.fileUrl, newWidthCm, newHeightCm).then((stitches) => {
            onChange({ estimatedStitches: stitches });
          });
        }}
      />
      {isSelected && !element.locked && (
        <>
          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 15 || newBox.height < 15 ? oldBox : newBox)}
          />
          {/* Live-Maßanzeige direkt am Element – zusätzlich zur Anzeige im
              Bedienfeld rechts, damit die tatsächliche Druckgröße beim
              Skalieren sofort sichtbar ist, ohne den Blick wechseln zu müssen. */}
          <KonvaText
            text={`${element.widthCm.toFixed(1)} × ${element.heightCm.toFixed(1)} cm`}
            x={xPx}
            y={yPx - 20}
            fontSize={12}
            fontFamily="Inter, sans-serif"
            fill="#a8792f"
            listening={false}
          />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------
// Text-Knoten – gleiche Interaktionslogik wie Logo (Drag, Skalieren,
// Drehen), zusätzlich Schriftformatierung.
// ---------------------------------------------------------------

interface TextNodeProps {
  element: TextElement;
  printArea: PrintArea | null;
  areaPx: PixelRect;
  imageRect: PixelRect;
  seamMarginPx: number;
  scaleFactors: ScaleFactors;
  stageScale: number;
  isSelected: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<TextElement>) => void;
  onCommit: (changes: Partial<TextElement>) => void;
  onDragCheck: (x: number, y: number, width: number, height: number) => void;
  onDragStop: () => void;
}

function TextNode({
  element,
  printArea,
  areaPx,
  imageRect,
  seamMarginPx,
  scaleFactors,
  stageScale,
  isSelected,
  readOnly = false,
  onSelect,
  onChange,
  onCommit,
  onDragCheck,
  onDragStop,
}: TextNodeProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const { x: xPx, y: yPx, width: widthPx, height: heightPx } = toPixelRect({ areaPx, scaleFactors, element });

  const fontStyle = [element.bold ? 'bold' : '', element.italic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal';

  // Mittelpunkt der (in cm gespeicherten) Box – wird für die Positionierung
  // verwendet, DA Konva selbst keine width/height-Vorgabe mehr bekommt und
  // deshalb nicht mehr selbst zentrieren kann (align/verticalAlign
  // benötigen dafür eine vorgegebene Box). Die Zentrierung übernehmen wir
  // stattdessen selbst, mit der zuletzt bekannten (oben laufend
  // selbstkorrigierten) Boxgröße als Referenz.
  const centerXPxForRender = xPx + widthPx / 2;
  const centerYPxForRender = yPx + heightPx / 2;

  return (
    <>
      <KonvaText
        ref={shapeRef}
        text={element.content}
        x={centerXPxForRender}
        y={centerYPxForRender}
        offsetX={widthPx / 2}
        offsetY={heightPx / 2}
        fontSize={element.fontSizePx}
        fontFamily={element.fontFamily}
        fontStyle={fontStyle}
        fill={element.color}
        align={element.align}
        verticalAlign="middle"
        wrap="none"
        letterSpacing={element.letterSpacing ?? 0}
        lineHeight={element.lineHeight ?? 1.2}
        shadowColor={element.hasShadow ?? false ? 'rgba(0,0,0,0.45)' : undefined}
        shadowBlur={(element.hasShadow ?? false) ? 4 : 0}
        shadowOffsetX={(element.hasShadow ?? false) ? 2 : 0}
        shadowOffsetY={(element.hasShadow ?? false) ? 2 : 0}
        rotation={element.rotationDeg}
        draggable={!element.locked && !readOnly}
        listening={!readOnly}
        opacity={element.locked ? 0.7 : 1}
        stroke={element.isOutOfBounds ? '#dc2626' : (element.hasOutline ?? false) ? (element.outlineColor ?? '#ffffff') : undefined}
        strokeWidth={element.isOutOfBounds ? 1 : (element.hasOutline ?? false) ? 0.8 : 0}
        onClick={onSelect}
        onTap={onSelect}
        dragBoundFunc={(pos) => clampDragPositionCentered(pos, areaPx, widthPx, heightPx, stageScale)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          const nearSeam = checkOutOfBounds({ x: cornerX, y: cornerY, width: widthPx, height: heightPx }, areaPx, seamMarginPx, printArea, imageRect);
          if (nearSeam !== element.isOutOfBounds) onChange({ isOutOfBounds: nearSeam });
          onDragCheck(cornerX, cornerY, widthPx, heightPx);
        }}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          onCommit({
            xCm: (cornerX - areaPx.x) / scaleFactors.pxPerCmX,
            yCm: (cornerY - areaPx.y) / scaleFactors.pxPerCmY,
          });
          onDragStop();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;

          const scaleXFactor = node.scaleX();
          const scaleYFactor = node.scaleY();
          // WICHTIG: node.x()/node.y() sind jetzt bereits der MITTELPUNKT
          // des Textes (wegen offsetX/offsetY = Breite/Höhe halbe, siehe
          // oben) – anders als früher, wo x/y die obere linke Ecke waren.
          const oldCenterX = node.x();
          const oldCenterY = node.y();
          node.scaleX(1);
          node.scaleY(1);

          // Schriftgröße proportional zur Ziehgeste mitführen …
          const newFontSizePx = Math.max(element.fontSizePx * scaleXFactor, 6);

          // … aber die gespeicherte Box IMMER aus der echten Textgröße bei
          // dieser Schriftgröße neu berechnen. Sonst könnte die Box (und
          // damit der berechnete Flächenpreis) beliebig größer werden als
          // der sichtbare Text – genau der gemeldete Fehler.
          const box = printArea
            ? computeTextBoxCm(element.content, element.fontFamily, newFontSizePx, element.bold, element.italic, printArea)
            : { widthCm: newFontSizePx / scaleFactors.pxPerCmX, heightCm: newFontSizePx / scaleFactors.pxPerCmY };

          const newWidthPx = box.widthCm * scaleFactors.pxPerCmX;
          const newHeightPx = box.heightCm * scaleFactors.pxPerCmY;

          const newX = oldCenterX - newWidthPx / 2;
          const newY = oldCenterY - newHeightPx / 2;

          const nearSeam = checkOutOfBounds(
            { x: newX, y: newY, width: newWidthPx, height: newHeightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );

          const inkRatio = measureInkCoverageRatio(element.content, element.fontFamily, newFontSizePx, element.bold, element.italic);

          onCommit({
            widthCm: box.widthCm,
            heightCm: box.heightCm,
            xCm: (newX - areaPx.x) / scaleFactors.pxPerCmX,
            yCm: (newY - areaPx.y) / scaleFactors.pxPerCmY,
            rotationDeg: node.rotation(),
            fontSizePx: newFontSizePx,
            isOutOfBounds: nearSeam,
            inkCoverageRatio: inkRatio,
            estimatedStitches: estimateTextStitches(box.widthCm * box.heightCm, inkRatio),
          });
        }}
      />
      {isSelected && !element.locked && (
        <>
          <Transformer
            ref={transformerRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 15 || newBox.height < 15 ? oldBox : newBox)}
          />
          <KonvaText
            text={`${element.widthCm.toFixed(1)} × ${element.heightCm.toFixed(1)} cm`}
            x={xPx}
            y={yPx - 20}
            fontSize={12}
            fontFamily="Inter, sans-serif"
            fill="#a8792f"
            listening={false}
          />
        </>
      )}
    </>
  );
}
