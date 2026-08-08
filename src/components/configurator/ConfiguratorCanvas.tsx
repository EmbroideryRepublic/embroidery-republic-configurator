'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Circle, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import type { ConfigElement, LogoElement, PrintArea, PrintView, TextElement } from '@/types';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getScaleFactors, elementToPixelRect, pxToCm, cmToPx, type PixelRect, type ScaleFactors } from '@/lib/canvas/cmConversion';
import { getContainRect, computeAreaPx } from '@/lib/canvas/containRect';
import { isNearSeam, overlapsExclusionZone, pushOutOfExclusionZones } from '@/lib/canvas/bounds';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { measureInkCoverageRatio } from '@/lib/canvas/measureText';
import { estimateLogoStitches, estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products';
import { cm as formatCm } from '@/lib/format';
import { gewebeTextur } from '@/lib/canvas/fabricTexture';

/** Platz für die seitlichen/unteren Maß-Lineale (Linie + cm-Beschriftung),
 *  in CSS-Pixeln – bewusst klein gehalten, damit die Leinwand selbst kaum
 *  kleiner wird. */
const RULER_TRACK_PX = 34;

/** Sicherheitsabstand beim Herausschieben aus einer Sperrzone (Kragen,
 *  Knöpfe, Reißverschluss) – deutlich kleiner als der äußere Nahtabstand
 *  (seamMarginCm), da es hier nur um kleine Hardware-Objekte geht, aber
 *  groß genug, dass ein herausgeschobenes Motiv sichtbaren Luftraum hat
 *  statt nur hauchdünn (rechnerisch korrekt, optisch aber wie
 *  überlappend wirkend) daneben zu landen. */
const EXCLUSION_ZONE_MARGIN_CM = 0.5;

/**
 * Einheitlicher, markeneigener Stil der Transformier-Griffe (Auswahlrahmen).
 *
 * Die Standard-Konva-Griffe sind grellblaue Quadrate – sie lassen den Editor
 * „Werkzeug von der Stange" wirken. Weiße, dezent gerundete Griffe mit
 * goldenem Rahmen greifen die Markenfarben auf und fügen sich in das ruhige,
 * hochwertige Erscheinungsbild ein, ohne die Bedienung zu verändern.
 */
const TRANSFORMER_STYLE = {
  anchorFill: '#ffffff',
  anchorStroke: '#a8792f',
  anchorStrokeWidth: 1.5,
  anchorSize: 9,
  anchorCornerRadius: 5,
  borderStroke: '#a8792f',
  borderStrokeWidth: 1.5,
  rotateAnchorOffset: 22,
} as const;

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
  /** Größenbezeichnung, die neben dem Lineal steht (z.B. "XL") – dieselbe
   *  Größe, für die `printArea` bereits aufgelöst wurde (siehe
   *  ConfiguratorPrototype.tsx, governingSize/flaecheFuerGroesse). Bewusst
   *  ALS PROP statt hier selbst neu bestimmt: Lineal-ZAHL (aus printArea)
   *  und Lineal-BESCHRIFTUNG müssen zwingend zur selben Größe gehören, sonst
   *  zeigt die Leinwand ein anderes Maximum an, als tatsächlich geprüft wird. */
  governingSize?: string;
  /** Helles Textil → Motive werden per „multiply" mit dem Stoff verrechnet
   *  (realistische Vorschau). Aus der echten Kleidungsfarbe abgeleitet
   *  (lib/canvas/garmentLuminance). Ohne Angabe: kein Effekt (sicher). */
  garmentLight?: boolean;
}

export function ConfiguratorCanvas({
  productImageUrl,
  printArea,
  zoom = 1,
  hideGuides = false,
  viewOverride,
  governingSize,
  garmentLight = false,
}: ConfiguratorCanvasProps) {
  const [productImage] = useImage(productImageUrl);
  const storeActiveView = useConfiguratorStore((s) => s.activeView);
  const activeView = viewOverride ?? storeActiveView;
  const elements = useConfiguratorStore((s) => s.elements);
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);
  const updateElement = useConfiguratorStore((s) => s.updateElement);
  const commitElement = useConfiguratorStore((s) => s.commitElement);

  // ── Realistische Vorschau (Stufe 1) ─────────────────────────────────
  // Auf HELLEN Kleidungsstücken wird das Motiv im Blend-Modus „multiply"
  // gezeichnet: Es übernimmt dadurch Falten, Licht und Schatten des echten
  // Produktfotos darunter und wirkt gedruckt statt aufgeklebt. Auf DUNKLEN
  // Teilen sitzt echter Druck mit weißer Unterlage deckend obenauf – „multiply"
  // würde ihn dort fälschlich verschwinden lassen, also bleibt der normale
  // Blend. Die Entscheidung kommt aus der ECHTEN Kleidungsfarbe (garmentLight-
  // Prop, siehe lib/canvas/garmentLuminance), NICHT aus dem Foto – ein
  // schwarzes Shirt-Foto mittelt wegen Glanzlichtern zu hoch und würde falsch
  // als hell gelten.
  //
  // Rein visuelle Bildschirmvorschau: dieser Canvas wird nirgends exportiert
  // (kein toDataURL/toImage); Produktionsblatt und Bestell-Vorschau rendern
  // vollständig getrennt über src/lib/rendering – die Druckdatei bleibt exakt.
  const druckMischung: 'multiply' | undefined = garmentLight ? 'multiply' : undefined;

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
      // Die gemessene Breite kann auf schmalen Bildschirmen zu groß ausfallen:
      // Der Container (`w-full` mit `overflow-auto`) und die Stage bedingen
      // sich gegenseitig, sodass die Messung nicht unter die Fensterbreite
      // fällt und die Leinwand seitlich überliefe. Deshalb zusätzlich an die
      // sichtbare Fensterbreite (abzüglich Lineal + Rand) klemmen. Auf großen
      // Bildschirmen greift die eigentliche Spaltenbreite (kleiner als das
      // Fenster), dort ändert `Math.min` nichts.
      const gemessen = containerRef.current?.offsetWidth ?? CANVAS_WIDTH;
      const fensterbreite =
        typeof window !== 'undefined' ? document.documentElement.clientWidth : gemessen;
      // Reserve = Lineal (34) + seitliche Seitenpolsterung (px-4 = 2×16) + Luft.
      // Nur auf schmalen Bildschirmen wirksam; auf großen greift die kleinere
      // Spaltenbreite via Math.min, sodass die Leinwand dort voll bleibt.
      const containerWidth = Math.min(gemessen, fensterbreite - (RULER_TRACK_PX + 36));
      // Verfügbare Höhe direkt aus der Fensterhöhe ableiten (abzüglich
      // Platz für Header/Werkzeugleiste/Zusammenfassung) statt die Höhe
      // eines Containers zu messen, der selbst nur eine CSS max-height
      // (keine feste Höhe) hat – das führte zu einem Henne-Ei-Problem:
      // der Container hatte noch keine echte Höhe, solange die Leinwand
      // (deren Größe genau von dieser Messung abhängt) noch nicht
      // gerendert war, wodurch eine winzige Höhe gemessen wurde.
      //
      // WICHTIG: Nicht `window.innerHeight * 0.72` – dieser Anteil ignoriert,
      // was ÜBER der Leinwand liegt (Kopfzeile, Schrittleiste, Produktkopf,
      // Werkzeugleiste, zusammen rund 320 px). Die Leinwand ragte dadurch
      // unten aus dem Sichtbereich und erzwang Scrollen, obwohl sie
      // rechnerisch „nur 72 %" belegte.
      //
      // Stattdessen wird der Abstand des Containers zur Fensteroberkante
      // gemessen und von der Fensterhöhe abgezogen. Das Henne-Ei-Problem der
      // Vorgängerfassung entsteht dabei nicht: Gemessen wird die POSITION des
      // Containers, nicht seine Höhe – die steht schon vor dem ersten
      // Leinwand-Render fest.
      const obenImFenster = containerRef.current?.getBoundingClientRect().top ?? 0;
      const RESERVE_UNTEN = 16; // Luft zur Fensterunterkante
      const availableHeight =
        typeof window !== 'undefined'
          ? Math.max(240, window.innerHeight - obenImFenster - RESERVE_UNTEN)
          : CANVAS_HEIGHT;
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
  // sondern wechselt nur den Filter). ALS useMemo: ohne Cache entstünde bei
  // JEDEM Render ein neues Array, was den Sperrzonen-Effekt weiter unten
  // (der viewElements als Abhängigkeit hat) unnötig oft erneut auslöst.
  const viewElements = useMemo(() => elements.filter((el) => el.view === activeView), [elements, activeView]);
  const hasSelectionInView = viewElements.some((el) => el.id === selectedElementId);

  // Tatsächlich sichtbare (unverzerrte) Bildfläche innerhalb der Canvas.
  // Solange das Bild noch lädt, wird die volle Canvas als Fallback
  // angenommen (verhindert kurzzeitiges Springen der Druckbereiche).
  // ALS useMemo (statt bei jedem Render neu berechnet), da der
  // Sperrzonen-Sanitize-Effekt weiter unten imageRect/areaPx als
  // Abhängigkeit braucht – ohne Memoisierung wäre das bei jedem Render
  // ein neues Objekt und der Effekt liefe unnötig auf jedem Tastenanschlag
  // o.ä. erneut.
  const imageRect: PixelRect = useMemo(
    () =>
      productImage
        ? getContainRect(
            productImage.naturalWidth,
            productImage.naturalHeight,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            printArea ? printArea.heightPercent / 100 : 1
          )
        : { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    [productImage, printArea]
  );

  const areaPx: PixelRect | null = useMemo(
    () => (printArea ? computeAreaPx(imageRect, printArea) : null),
    [imageRect, printArea]
  );

  const scaleFactors = printArea && areaPx ? getScaleFactors(areaPx, printArea) : null;
  const seamMarginPx = scaleFactors && printArea ? cmToPx(printArea.seamMarginCm, scaleFactors.pxPerCmX) : 0;
  // Tatsächlicher Skalierungsfaktor der <Stage> (siehe scaleX={scale*zoom}
  // unten) – wird an die Zieh-Begrenzung durchgereicht, damit absolute
  // (skalierte) Konva-Koordinaten korrekt ins logische Koordinatensystem
  // umgerechnet werden können, in dem areaPx/widthPx berechnet sind.
  const stageScale = scale * zoom;

  const rulerPxPerCm = scaleFactors?.pxPerCmX ?? null;
  // ── Maßlinien der DRUCKFLÄCHE ────────────────────────────────────────
  // Vorher maßen die Lineale das KLEIDUNGSSTÜCK (sizeRow.breiteCm/hoeheCm
  // aus der Größentabelle). Angezeigt wurde also z.B. „56 cm" für die
  // Shirtbreite, während der Kunde die Maße seiner Druckfläche braucht.
  //
  // Jetzt kommen Länge UND Beschriftung aus derselben Quelle wie die
  // gezeichnete Fläche: printArea.maxWidthCm/maxHeightCm und areaPx. Damit
  // ist ein Auseinanderlaufen konstruktiv ausgeschlossen – die Linie IST
  // die Kante der Fläche.
  const druckBreiteCm = printArea?.maxWidthCm ?? null;
  const druckHoeheCm = printArea?.maxHeightCm ?? null;
  const heightRulerPx = areaPx ? areaPx.height * stageScale : null;
  const widthRulerPx = areaPx ? areaPx.width * stageScale : null;
  const hasRulers =
    !hideGuides && !!areaPx && druckBreiteCm !== null && druckHoeheCm !== null &&
    heightRulerPx !== null && widthRulerPx !== null;

  // Neue Elemente (Upload, Text, Vorlage, Duplikat, Einfügen, Positions-
  // Presets) starten alle standardmäßig MITTIG im Druckbereich – bei
  // Reißverschluss-Produkten liegt das exakt auf der Sperrzone. Statt
  // jede einzelne Erzeugungsstelle einzeln zu korrigieren, fängt dieser
  // Effekt jede Überlappung mit Kragen/Reißverschluss zentral ab, sobald
  // ein Element in der aktiven Ansicht erscheint oder sich der Druckbereich
  // ändert (Produkt-/Methodenwechsel). updateElement statt commitElement,
  // damit diese automatische Korrektur keinen eigenen Undo-Schritt erzeugt.
  useEffect(() => {
    if (!areaPx || !scaleFactors) return;
    const zonesPx = computeExclusionZonesPx(printArea, imageRect);
    if (zonesPx.length === 0) return;

    const zoneMarginPx = cmToPx(EXCLUSION_ZONE_MARGIN_CM, scaleFactors.pxPerCmX);
    for (const el of viewElements) {
      const rectPx = elementToPixelRect(areaPx, scaleFactors, el);
      if (!zonesPx.some((zone) => overlapsExclusionZone(rectPx, zone))) continue;
      const pushed = pushOutOfExclusionZones(rectPx, areaPx, zonesPx, zoneMarginPx);

      // NUR schreiben, wenn das Verschieben die Überlappung tatsächlich löst.
      //
      // Bei MEHREREN Sperrzonen (Fleecejacke: Reißverschluss + zwei Taschen)
      // kann `pushOutOfExclusionZones` ein Element aus der einen Zone genau in
      // die nächste schieben und im Folgedurchlauf wieder zurück. Es gibt dann
      // eine Position zurück, die weiterhin überlappt. Wurde die trotzdem
      // gespeichert, lief dieser Effekt bei jedem Render erneut und React brach
      // mit „Maximum update depth exceeded" ab – der Konfigurator war für
      // Kunden mit einem betroffenen gespeicherten Entwurf nicht mehr bedienbar.
      const restposition = { ...rectPx, x: pushed.x, y: pushed.y };
      if (zonesPx.some((zone) => overlapsExclusionZone(restposition, zone))) {
        // Keine freie Position gefunden: Das Element bleibt stehen, wird aber
        // als außerhalb markiert – sonst läge ein Motiv unbemerkt auf dem
        // Reißverschluss und ginge so in die Bestellung. Die `isOutOfBounds`-
        // Abfrage ist zwingend: ohne sie schriebe der Effekt bei jedem Render
        // denselben Wert und die Endlosschleife wäre zurück.
        if (!el.isOutOfBounds) updateElement(el.id, { isOutOfBounds: true });
        continue;
      }

      // Float-Toleranz statt exaktem Vergleich: px → cm → px ist nicht
      // verlustfrei. Ein exakter Vergleich hielt eine Abweichung von
      // Bruchteilen eines Pixels für eine echte Änderung und schrieb endlos.
      if (Math.abs(pushed.x - rectPx.x) < 0.5 && Math.abs(pushed.y - rectPx.y) < 0.5) continue;

      updateElement(el.id, {
        xCm: pxToCm(pushed.x - areaPx.x, scaleFactors.pxPerCmX),
        yCm: pxToCm(pushed.y - areaPx.y, scaleFactors.pxPerCmY),
      });
    }
  }, [viewElements, areaPx, scaleFactors, printArea, imageRect, updateElement]);

  // Prüft, ob der Mittelpunkt eines gezogenen Elements nah genug am
  // Mittelpunkt des Druckbereichs liegt, um eine Hilfslinie einzublenden.
  // ALS useCallback (stabile Referenz, solange sich areaPx nicht ändert):
  // wird unten unverändert an jeden LogoNode/TextNode durchgereicht – ohne
  // stabile Referenz würde React.memo dort wirkungslos bleiben, weil sich
  // die Prop bei jedem Render neu "ändern" würde.
  const checkCenterGuides = useCallback(
    (elX: number, elY: number, elWidth: number, elHeight: number) => {
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
    },
    [areaPx]
  );

  // Ebenfalls aus demselben Grund als stabile Referenz (setCenterGuides
  // selbst ist als React-State-Setter bereits stabil, das leere
  // Abhängigkeits-Array hält auch den Wrapper dauerhaft stabil).
  const clearCenterGuides = useCallback(() => setCenterGuides({ x: false, y: false }), []);

  return (
    <div className="flex w-full max-w-[820px] flex-col items-center xl:max-w-[960px] 2xl:max-w-[1100px]">
      <div className="flex w-full flex-row items-start justify-center">
        {hasRulers && heightRulerPx !== null && (
          <div
            className="relative flex-shrink-0"
            style={{ width: RULER_TRACK_PX, height: CANVAS_HEIGHT * scale * zoom }}
          >
            {governingSize && (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-wide text-gold-dark/70">
                {governingSize}
              </span>
            )}
            <div
              className="absolute flex flex-col items-center"
              style={{ left: RULER_TRACK_PX - 16, top: areaPx!.y * stageScale, height: heightRulerPx, width: 16 }}
            >
              <span className="h-0 w-2.5 border-t border-gold-dark/70" />
              <div className="w-0 flex-1 border-l border-dashed border-gold-dark/60" />
              <span className="h-0 w-2.5 border-b border-gold-dark/70" />
              <span
                className="absolute left-1/2 top-1/2 whitespace-nowrap text-[10px] font-medium text-gold-dark"
                style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
              >
                {formatCm(druckHoeheCm!)}
              </span>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="flex w-full max-w-[820px] justify-center overflow-auto rounded-lg xl:max-w-[960px] 2xl:max-w-[1100px]"
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

              {/* Sperrzonen (z.B. Kragen-Innenkante, Knöpfe, Reißverschluss) –
                  kein Motiv darf hier platziert werden. Schraffiert + roter
                  Rahmen, klar vom normalen Druckbereich unterscheidbar.
                  Kreisförmige Zonen (Knöpfe) werden als echter Kreis
                  gezeichnet statt als quadratische Box, damit keine "toten
                  Ecken" um das runde Objekt herum optisch gesperrt wirken. */}
              {printArea?.exclusionZones?.map((zone, i) => {
                if (zone.shape === 'circle') {
                  const centerX = imageRect.x + (zone.xPercent / 100) * imageRect.width;
                  const centerY = imageRect.y + (zone.yPercent / 100) * imageRect.height;
                  const radiusPx = (zone.radiusPercent / 100) * imageRect.height;
                  return (
                    <Circle
                      key={i}
                      x={centerX}
                      y={centerY}
                      radius={radiusPx}
                      fill="rgba(220,38,38,0.15)"
                      stroke="rgba(220,38,38,0.5)"
                      strokeWidth={1}
                      dash={[3, 2]}
                      listening={false}
                    />
                  );
                }

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
                  blend={druckMischung}
                  onSelect={setSelectedElementId}
                  onChange={updateElement}
                  onCommit={commitElement}
                  onDragCheck={checkCenterGuides}
                  onDragStop={clearCenterGuides}
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
                  blend={druckMischung}
                  onSelect={setSelectedElementId}
                  onChange={updateElement}
                  onCommit={commitElement}
                  onDragCheck={checkCenterGuides}
                  onDragStop={clearCenterGuides}
                />
              )
            )}
          </Layer>
          </Stage>
        </div>
      </div>

      {hasRulers && widthRulerPx !== null && (
        <div
          className="relative"
          style={{ width: CANVAS_WIDTH * stageScale + RULER_TRACK_PX, height: RULER_TRACK_PX }}
        >
          <div
            className="absolute flex flex-row items-center"
            style={{
              left: RULER_TRACK_PX + areaPx!.x * stageScale,
              top: 4,
              width: widthRulerPx,
              height: 14,
            }}
          >
            <span className="h-2.5 w-0 border-l border-gold-dark/70" />
            <div className="h-0 flex-1 border-t border-dashed border-gold-dark/60" />
            <span className="h-2.5 w-0 border-r border-gold-dark/70" />
          </div>
          <span
            className="absolute whitespace-nowrap text-[10px] font-medium text-gold-dark"
            style={{
              left: RULER_TRACK_PX + (areaPx!.x + areaPx!.width / 2) * stageScale,
              top: 18,
              transform: 'translateX(-50%)',
            }}
          >
            {formatCm(druckBreiteCm!)}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Gemeinsame Geometrie-Helfer für Logo- und Text-Knoten
// ---------------------------------------------------------------

/** Rechnet die Sperrzonen eines Druckbereichs (Kragen, Reißverschluss, …)
 *  einmalig in Pixel-Rechtecke um – Grundlage sowohl für die Zeichnung
 *  (roter Schraffur-Rahmen) als auch für die Warnung UND die harte
 *  Zieh-/Skalier-Begrenzung, damit alle drei garantiert dieselbe Fläche
 *  meinen. */
function computeExclusionZonesPx(printArea: PrintArea | null, imageRect: PixelRect): PixelRect[] {
  if (!printArea?.exclusionZones) return [];
  return printArea.exclusionZones.map((zone) => {
    if (zone.shape === 'circle') {
      const centerX = imageRect.x + (zone.xPercent / 100) * imageRect.width;
      const centerY = imageRect.y + (zone.yPercent / 100) * imageRect.height;
      const radiusPx = (zone.radiusPercent / 100) * imageRect.height;
      // Für Kollision/Herausschieben genügt die quadratische Bounding-Box
      // des Kreises – Knöpfe sind klein genug, dass die minimale
      // Übergenauigkeit an den vier Ecken praktisch nicht ins Gewicht
      // fällt, erspart dafür ein eigenes Kreis-Rechteck-Kollisionssystem.
      return { x: centerX - radiusPx, y: centerY - radiusPx, width: radiusPx * 2, height: radiusPx * 2 };
    }
    return {
      x: imageRect.x + (zone.xPercent / 100) * imageRect.width,
      y: imageRect.y + (zone.yPercent / 100) * imageRect.height,
      width: (zone.widthPercent / 100) * imageRect.width,
      height: (zone.heightPercent / 100) * imageRect.height,
    };
  });
}

/** Kombiniert Nahtabstand- und Sperrzonen-Prüfung (Knopfleiste,
 *  Reißverschluss) zu einem einzigen "außerhalb erlaubt"-Ergebnis. Dient
 *  nur noch der optischen Warnung (roter Rahmen) – die eigentliche
 *  Verhinderung der Platzierung übernimmt pushOutOfExclusionZones. */
function checkOutOfBounds(
  rect: { x: number; y: number; width: number; height: number },
  areaPx: PixelRect,
  seamMarginPx: number,
  printArea: PrintArea | null,
  imageRect: PixelRect
): boolean {
  const nearSeam = isNearSeam(rect, areaPx, seamMarginPx);
  if (nearSeam) return true;
  return computeExclusionZonesPx(printArea, imageRect).some((zone) => overlapsExclusionZone(rect, zone));
}

/** Klemmt die Zieh-Position eines zentrumsbasiert positionierten Knotens
 *  (LogoNode/TextNode: x/y sind wegen offsetX/offsetY bereits der
 *  Mittelpunkt, nicht die obere linke Ecke) auf den Druckbereich.
 *
 *  WICHTIG – eigentliche Ursache des früheren "kann nur nach rechts, nicht
 *  nach links"-Bugs: dragBoundFunc liefert die Position in ABSOLUTEN
 *  Stage-Koordinaten (also bereits multipliziert mit scaleX/scaleY der
 *  Stage, siehe <Stage scaleX={scale*zoom}>). areaPx/widthPx/heightPx sind
 *  dagegen im LOGISCHEN, unskalierten Koordinatensystem berechnet
 *  (CANVAS_WIDTH/CANVAS_HEIGHT-Basis). Bei jedem Skalierungsfaktor ≠ 1
 *  wurden dadurch zwei unterschiedliche Maßstäbe miteinander verglichen –
 *  das erklärt die krumme, asymmetrische Begrenzung. Deshalb hier zuerst
 *  zurück ins logische System umrechnen, dort klemmen, dann wieder zurück
 *  in absolute Koordinaten (die Konva von dragBoundFunc erwartet). */
function clampDragPositionCentered(
  pos: { x: number; y: number },
  areaPx: PixelRect,
  widthPx: number,
  heightPx: number,
  stageScale: number,
  exclusionZonesPx: PixelRect[],
  zoneMarginPx: number
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

  const pushed = pushOutOfExclusionZones(
    { x: clampedLogicalX - halfW, y: clampedLogicalY - halfH, width: widthPx, height: heightPx },
    areaPx,
    exclusionZonesPx,
    zoneMarginPx
  );

  return { x: (pushed.x + halfW) * stageScale, y: (pushed.y + halfH) * stageScale };
}

/** Klemmt die obere-linke Ecke eines Rechtecks (bereits im logischen,
 *  unskalierten Koordinatensystem – kein stageScale-Umweg nötig, anders als
 *  clampDragPositionCentered) auf den Druckbereich.
 *
 *  Anders als beim Ziehen (dragBoundFunc, siehe oben) hatte das Resize per
 *  Transformer-Griff KEINE Positions-Begrenzung: onTransformEnd klemmte nur
 *  die GRÖSSE auf maxWidthCm/maxHeightCm und schob danach lediglich aus
 *  Sperrzonen heraus (pushOutOfExclusionZones) – die neue Position (aus dem
 *  ALTEN Mittelpunkt + NEUER Größe berechnet) konnte dadurch außerhalb der
 *  Druckfläche landen, wenn z.B. am oberen linken Eckgriff gezogen wurde.
 *  isOutOfBounds zeigte das zwar an (roter Rahmen), verhinderte aber nichts:
 *  weder den Warenkorb noch den Checkout noch die serverseitige Prüfung
 *  (orderValidation.ts prüft bewusst nur die Größe, nicht die Position –
 *  in der Annahme, der Konfigurator halte die Position ohnehin in der
 *  Fläche). Das produzierte PNG wurde exakt mit dieser Position gerendert. */
function clampRectTopLeftToArea(
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  areaPx: PixelRect
): { x: number; y: number } {
  const minX = areaPx.x;
  const maxX = areaPx.x + areaPx.width - width;
  const minY = areaPx.y;
  const maxY = areaPx.y + areaPx.height - height;
  return {
    x: Math.min(Math.max(rawX, Math.min(minX, maxX)), Math.max(minX, maxX)),
    y: Math.min(Math.max(rawY, Math.min(minY, maxY)), Math.max(minY, maxY)),
  };
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
  /** Blend-Modus des Motivs über dem Textil (realistische Vorschau). */
  blend?: 'multiply';
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<LogoElement>) => void;
  onCommit: (id: string, changes: Partial<LogoElement>) => void;
  onDragCheck: (x: number, y: number, width: number, height: number) => void;
  onDragStop: () => void;
}

/** ALS React.memo: ohne das würde JEDES Logo/Text-Element bei JEDEM
 *  Zieh-Frame eines EINZELNEN anderen Elements neu gerendert, weil
 *  viewElements (oben) bei jeder Store-Änderung ein neues Array liefert.
 *  Wirkt nur zusammen mit stabilen Props – deshalb werden hier bewusst die
 *  Store-Actions direkt durchgereicht (Zustand hält sie referenzstabil)
 *  statt sie pro Element in eine neue Inline-Funktion einzupacken. */
const LogoNode = memo(function LogoNode({
  element,
  printArea,
  areaPx,
  imageRect,
  seamMarginPx,
  scaleFactors,
  stageScale,
  isSelected,
  readOnly = false,
  blend,
  onSelect,
  onChange,
  onCommit,
  onDragCheck,
  onDragStop,
}: LogoNodeProps) {
  const [rawImage] = useImage(element.fileUrl);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Realistische Vorschau: eine feine Gewebetextur NUR in die Motivfläche
  // einrechnen (overlay, danach auf die Motivkontur maskiert). Ergebnis ist ein
  // reines Anzeige-Bild – `element.fileUrl` (= Produktionsdaten) bleibt exakt.
  // Wird nur neu berechnet, wenn sich das Rohbild ändert (nicht beim Verschieben
  // /Skalieren), also ohne Performance-Kosten bei der Bedienung.
  const [displayImage, setDisplayImage] = useState<HTMLImageElement | HTMLCanvasElement | undefined>(undefined);
  useEffect(() => {
    if (!rawImage) {
      setDisplayImage(undefined);
      return;
    }
    const w = rawImage.naturalWidth || rawImage.width;
    const h = rawImage.naturalHeight || rawImage.height;
    const textur = gewebeTextur();
    if (!w || !h || !textur) {
      setDisplayImage(rawImage);
      return;
    }
    try {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d');
      if (!ctx) {
        setDisplayImage(rawImage);
        return;
      }
      ctx.drawImage(rawImage, 0, 0, w, h);
      // Gewebe als „overlay" über die gesamte Fläche (moduliert die Helligkeit),
      // dann per „destination-in" wieder auf die Motivkontur beschneiden, damit
      // die Textur ausschließlich auf der Farbe liegt, nie auf dem Textil daneben.
      const muster = ctx.createPattern(textur, 'repeat');
      if (muster) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = muster;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(rawImage, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      setDisplayImage(cv);
    } catch {
      setDisplayImage(rawImage); // im Zweifel das unveränderte Bild zeigen
    }
  }, [rawImage]);

  const image = displayImage ?? rawImage;

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const { x: xPx, y: yPx, width: widthPx, height: heightPx } = elementToPixelRect(areaPx, scaleFactors, element);
  const exclusionZonesPx = useMemo(() => computeExclusionZonesPx(printArea, imageRect), [printArea, imageRect]);
  const zoneMarginPx = cmToPx(EXCLUSION_ZONE_MARGIN_CM, scaleFactors.pxPerCmX);

  // Zentrumsbasierte Positionierung (x/y + offsetX/offsetY = Mitte des
  // Motivs, analog zu TextNode unten): Konva dreht ein Shape immer um
  // seinen eigenen x/y-Punkt. Mit x/y = obere linke Ecke (wie vorher) dreht
  // sich das Logo also um die Ecke statt um die Mitte und springt sichtbar
  // aus seiner Position – exakt der gemeldete Fehler.
  const centerXPx = xPx + widthPx / 2;
  const centerYPx = yPx + heightPx / 2;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={centerXPx}
        y={centerYPx}
        offsetX={widthPx / 2}
        offsetY={heightPx / 2}
        width={widthPx}
        height={heightPx}
        rotation={element.rotationDeg}
        draggable={!element.locked && !readOnly}
        listening={!readOnly}
        opacity={element.locked ? 0.7 : 1}
        globalCompositeOperation={blend}
        stroke={element.isOutOfBounds ? '#dc2626' : undefined}
        strokeWidth={element.isOutOfBounds ? 3 : 0}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        dragBoundFunc={(pos) => clampDragPositionCentered(pos, areaPx, widthPx, heightPx, stageScale, exclusionZonesPx, zoneMarginPx)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          const nearSeam = checkOutOfBounds(
            { x: cornerX, y: cornerY, width: widthPx, height: heightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );
          if (nearSeam !== element.isOutOfBounds) onChange(element.id, { isOutOfBounds: nearSeam });
          onDragCheck(cornerX, cornerY, widthPx, heightPx);
        }}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          onCommit(element.id, {
            xCm: pxToCm(cornerX - areaPx.x, scaleFactors.pxPerCmX),
            yCm: pxToCm(cornerY - areaPx.y, scaleFactors.pxPerCmY),
          });
          onDragStop();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;

          let newWidthPx = Math.max(node.width() * node.scaleX(), 15);
          let newHeightPx = Math.max(node.height() * node.scaleY(), 15);
          // node.x()/node.y() sind wegen offsetX/offsetY oben bereits der
          // MITTELPUNKT des Motivs (nicht mehr die obere linke Ecke) – die
          // Mitte muss VOR dem Zurücksetzen von scaleX/scaleY gelesen
          // werden, danach bleibt sie als Referenz für die Neuberechnung.
          const oldCenterX = node.x();
          const oldCenterY = node.y();
          node.scaleX(1);
          node.scaleY(1);

          // Logo darf die Druckfläche nie überragen – sonst kollabiert
          // die Zieh-Begrenzung auf eine feste Seite (siehe
          // clampDragPositionCentered), was sich wie "nur links/oben
          // bedruckbar" anfühlt. Seitenverhältnis bleibt beim
          // Herunterskalieren erhalten.
          if (printArea) {
            const maxWidthPx = cmToPx(printArea.maxWidthCm, scaleFactors.pxPerCmX);
            const maxHeightPx = cmToPx(printArea.maxHeightCm, scaleFactors.pxPerCmY);
            if (newWidthPx > maxWidthPx || newHeightPx > maxHeightPx) {
              const scale = Math.min(maxWidthPx / newWidthPx, maxHeightPx / newHeightPx);
              newWidthPx *= scale;
              newHeightPx *= scale;
            }
          }

          // Position auf die Druckfläche klemmen, BEVOR aus Sperrzonen
          // herausgeschoben wird – sonst kann der aus dem alten Mittelpunkt
          // + neuer Größe berechnete Punkt außerhalb der Fläche liegen
          // (siehe clampRectTopLeftToArea).
          const clampedTopLeft = clampRectTopLeftToArea(
            oldCenterX - newWidthPx / 2,
            oldCenterY - newHeightPx / 2,
            newWidthPx,
            newHeightPx,
            areaPx
          );

          // Nach dem Skalieren kann das Motiv (auch ohne eigenes Zutun beim
          // Ziehen) neu in eine Sperrzone hineinragen – deshalb auch hier
          // aus Kragen/Reißverschluss herausschieben, nicht nur beim Drag.
          const pushed = pushOutOfExclusionZones(
            { x: clampedTopLeft.x, y: clampedTopLeft.y, width: newWidthPx, height: newHeightPx },
            areaPx,
            exclusionZonesPx,
            zoneMarginPx
          );

          const nearSeam = checkOutOfBounds(
            { x: pushed.x, y: pushed.y, width: newWidthPx, height: newHeightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );

          const newWidthCm = pxToCm(newWidthPx, scaleFactors.pxPerCmX);
          const newHeightCm = pxToCm(newHeightPx, scaleFactors.pxPerCmY);

          onCommit(element.id, {
            widthCm: newWidthCm,
            heightCm: newHeightCm,
            xCm: pxToCm(pushed.x - areaPx.x, scaleFactors.pxPerCmX),
            yCm: pxToCm(pushed.y - areaPx.y, scaleFactors.pxPerCmY),
            rotationDeg: node.rotation(),
            isOutOfBounds: nearSeam,
          });

          // Stichzahl hängt von der physischen Größe ab – nach dem
          // Skalieren neu schätzen (asynchron, Bildanalyse blockiert die
          // Ziehgeste selbst nicht).
          estimateLogoStitches(element.fileUrl, newWidthCm, newHeightCm).then((stitches) => {
            onChange(element.id, { estimatedStitches: stitches });
          });
        }}
      />
      {isSelected && !element.locked && (
        <>
          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio
            {...TRANSFORMER_STYLE}
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
});

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
  /** Blend-Modus des Motivs über dem Textil (realistische Vorschau). */
  blend?: 'multiply';
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<TextElement>) => void;
  onCommit: (id: string, changes: Partial<TextElement>) => void;
  onDragCheck: (x: number, y: number, width: number, height: number) => void;
  onDragStop: () => void;
}

/** ALS React.memo, siehe Begründung bei LogoNode oben. */
const TextNode = memo(function TextNode({
  element,
  printArea,
  areaPx,
  imageRect,
  seamMarginPx,
  scaleFactors,
  stageScale,
  isSelected,
  readOnly = false,
  blend,
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

  const { x: xPx, y: yPx, width: widthPx, height: heightPx } = elementToPixelRect(areaPx, scaleFactors, element);
  const exclusionZonesPx = useMemo(() => computeExclusionZonesPx(printArea, imageRect), [printArea, imageRect]);
  const zoneMarginPx = cmToPx(EXCLUSION_ZONE_MARGIN_CM, scaleFactors.pxPerCmX);

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
        globalCompositeOperation={blend}
        stroke={element.isOutOfBounds ? '#dc2626' : (element.hasOutline ?? false) ? (element.outlineColor ?? '#ffffff') : undefined}
        strokeWidth={element.isOutOfBounds ? 1 : (element.hasOutline ?? false) ? 0.8 : 0}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        dragBoundFunc={(pos) => clampDragPositionCentered(pos, areaPx, widthPx, heightPx, stageScale, exclusionZonesPx, zoneMarginPx)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          const nearSeam = checkOutOfBounds({ x: cornerX, y: cornerY, width: widthPx, height: heightPx }, areaPx, seamMarginPx, printArea, imageRect);
          if (nearSeam !== element.isOutOfBounds) onChange(element.id, { isOutOfBounds: nearSeam });
          onDragCheck(cornerX, cornerY, widthPx, heightPx);
        }}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          const cornerX = node.x() - widthPx / 2;
          const cornerY = node.y() - heightPx / 2;
          onCommit(element.id, {
            xCm: pxToCm(cornerX - areaPx.x, scaleFactors.pxPerCmX),
            yCm: pxToCm(cornerY - areaPx.y, scaleFactors.pxPerCmY),
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
            : { widthCm: pxToCm(newFontSizePx, scaleFactors.pxPerCmX), heightCm: pxToCm(newFontSizePx, scaleFactors.pxPerCmY) };

          const newWidthPx = cmToPx(box.widthCm, scaleFactors.pxPerCmX);
          const newHeightPx = cmToPx(box.heightCm, scaleFactors.pxPerCmY);

          // Wie bei LogoNode: erst auf die Druckfläche klemmen (siehe
          // clampRectTopLeftToArea), dann aus einer neu entstandenen
          // Überlappung mit Kragen/Reißverschluss herausschieben.
          const clampedTopLeft = clampRectTopLeftToArea(
            oldCenterX - newWidthPx / 2,
            oldCenterY - newHeightPx / 2,
            newWidthPx,
            newHeightPx,
            areaPx
          );
          const pushed = pushOutOfExclusionZones(
            { x: clampedTopLeft.x, y: clampedTopLeft.y, width: newWidthPx, height: newHeightPx },
            areaPx,
            exclusionZonesPx,
            zoneMarginPx
          );
          const newX = pushed.x;
          const newY = pushed.y;

          const nearSeam = checkOutOfBounds(
            { x: newX, y: newY, width: newWidthPx, height: newHeightPx },
            areaPx,
            seamMarginPx,
            printArea,
            imageRect
          );

          const inkRatio = measureInkCoverageRatio(element.content, element.fontFamily, newFontSizePx, element.bold, element.italic);

          onCommit(element.id, {
            widthCm: box.widthCm,
            heightCm: box.heightCm,
            xCm: pxToCm(newX - areaPx.x, scaleFactors.pxPerCmX),
            yCm: pxToCm(newY - areaPx.y, scaleFactors.pxPerCmY),
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
            {...TRANSFORMER_STYLE}
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
});
