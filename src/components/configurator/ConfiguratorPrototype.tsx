'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Stepper } from '@/components/layout/Stepper';
import { MethodSwitcher } from './MethodSwitcher';
import { KonfigUebersicht } from './KonfigUebersicht';
import { ProduktBrowser } from './ProduktBrowser';
import { ColorSizeSelector } from './ColorSizeSelector';
import { ProductDetails } from './ProductDetails';
import { ViewSwitcher } from './ViewSwitcher';
import { CanvasToolbar } from './CanvasToolbar';
import { ToolPanelTabs } from './ToolPanelTabs';
import { SummaryPanel } from './SummaryPanel';
import { CompareModal } from './CompareModal';
import { LargePreviewModal } from './LargePreviewModal';
import { getPrintAreas } from '@/config/printAreas';
import { getPricingRules } from '@/config/pricingRules';
import { PRODUCTS, getProduct, type ProductConfig } from '@/config/products';
import { resolveColorImages, repraesentativeFarbe } from '@/lib/assets';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { calculatePrice, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import type { PricingRule, PrintArea } from '@/types';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { ansichtenVon, sichtbareAnsichten } from '@/lib/products/ansichten';
import { vorladenAlleFarben } from '@/lib/configurator/vorladen';
import { istHellesTextil } from '@/lib/canvas/garmentLuminance';

// Konva greift auf `window` zu und darf deshalb nicht serverseitig gerendert
// werden – dynamischer Import mit ssr:false ist bei react-konva in Next.js
// App Router Pflicht.
const ConfiguratorCanvas = dynamic(
  () => import('./ConfiguratorCanvas').then((m) => m.ConfiguratorCanvas),
  {
    ssr: false,
    loading: () => <CanvasSkeleton />,
  }
);

// Wichtig: Als Funktion mit explizitem Rückgabetyp `ProductConfig` (statt
// eines Guards direkt auf einer Modul-Konstante) implementiert. TypeScript
// trägt Narrowing von Modul-Level-Konstanten NICHT in später definierte,
// verschachtelte Funktionen (Komponenten-Body, Closures, useEffect-Callbacks)
// hinein – dort gilt wieder der deklarierte Typ `ProductConfig | undefined`.
// Der explizite Rückgabetyp hier sorgt dafür, dass DEFAULT_PRODUCT überall im
// Modul strukturell als `ProductConfig` (nie `undefined`) bekannt ist.
function getDefaultProduct(): ProductConfig {
  const product = PRODUCTS[0];
  if (!product) {
    throw new Error('PRODUCTS ist leer – mindestens ein Produkt muss konfiguriert sein.');
  }
  return product;
}

const DEFAULT_PRODUCT = getDefaultProduct();
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;

export function ConfiguratorPrototype() {
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculationResult['breakdown'] | null>(null);
  // Preisbausteine, die nicht verarbeitet werden konnten. Nicht leer =
  // der Preis ist ungültig und darf NICHT bestellbar sein (siehe
  // lib/pricing/ruleEngine.ts, Abschnitt „FAIL FAST").
  const [priceHasErrors, setPriceHasErrors] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // localStorage-Zwischenspeicherung (zustand/persist) lädt asynchron NACH
  // dem ersten Render. Bis dahin nicht auf productId==null reagieren, sonst
  // würde eine wiederhergestellte Konfiguration sofort wieder überschrieben.
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    if (useConfiguratorStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }
    const unsub = useConfiguratorStore.persist.onFinishHydration(() => setIsHydrated(true));
    return unsub;
  }, []);

  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const activeView = useConfiguratorStore((s) => s.activeView);
  const setActiveView = useConfiguratorStore((s) => s.setActiveView);
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const quantity = sumSizeQuantities(sizeQuantities);
  const elements = useConfiguratorStore((s) => s.elements);
  const history = useConfiguratorStore((s) => s.history);
  const future = useConfiguratorStore((s) => s.future);
  const undo = useConfiguratorStore((s) => s.undo);
  const redo = useConfiguratorStore((s) => s.redo);
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const removeElement = useConfiguratorStore((s) => s.removeElement);
  const duplicateElement = useConfiguratorStore((s) => s.duplicateElement);
  const copyElement = useConfiguratorStore((s) => s.copyElement);
  const pasteElement = useConfiguratorStore((s) => s.pasteElement);
  const clipboardElement = useConfiguratorStore((s) => s.clipboardElement);
  const commitElement = useConfiguratorStore((s) => s.commitElement);
  const setProduct = useConfiguratorStore((s) => s.setProduct);
  const setColor = useConfiguratorStore((s) => s.setColor);
  const setPrices = useConfiguratorStore((s) => s.setPrices);
  const syncElementsToPrintAreas = useConfiguratorStore((s) => s.syncElementsToPrintAreas);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  // Erstbesuch (kein wiederhergestellter Zustand vorhanden): Standardprodukt
  // vorbelegen. Läuft erst NACH der Hydration, sonst würde ein
  // wiederhergestelltes Design überschrieben.
  //
  // `?produkt=<id>` hat Vorrang: Die Produktseiten verlinken so in den
  // Konfigurator („Jetzt konfigurieren"). Ohne diese Auswertung landete der
  // Kunde beim zuletzt konfigurierten Produkt statt bei dem, das er gerade
  // angesehen hat.
  useEffect(() => {
    if (!isHydrated) return;

    const gewuenscht = new URLSearchParams(window.location.search).get('produkt');
    if (gewuenscht && gewuenscht !== productId) {
      const ziel = getProduct(gewuenscht);
      if (ziel) {
        setProduct(ziel.id);
        const ersteFarbe = repraesentativeFarbe(ziel.id, ziel.colors);
        if (ersteFarbe) setColor(ersteFarbe.id);
        // Parameter entfernen, damit ein späterer Reload nicht erneut
        // zurücksetzt und der Kunde seine Änderungen behält.
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    }

    if (!productId) {
      setProduct(DEFAULT_PRODUCT.id);
      const firstColor = repraesentativeFarbe(DEFAULT_PRODUCT.id, DEFAULT_PRODUCT.colors);
      if (firstColor) setColor(firstColor.id);
    }
  }, [isHydrated, productId, setProduct, setColor]);

  const product = getProduct(productId ?? '') ?? DEFAULT_PRODUCT;

  // Alle Farbansichten des aktuellen Produkts im Hintergrund vorladen, damit
  // auch der Farbwechsel ohne Wartezeit erfolgt. Läuft nur bei Produktwechsel.
  useEffect(() => {
    vorladenAlleFarben(product);
  }, [product]);

  // Aktuellen activeView-Wert per Ref verfügbar machen, OHNE ihn als
  // Dependency in den untenstehenden Effekt aufzunehmen – der Effekt soll
  // nur bei Produkt-/Methodenwechsel neu laden, nicht bei jedem simplen
  // Ansichtswechsel (Vorderseite/Rückseite). Der Ref wird bei jedem Render
  // aktuell gehalten, das ist ein sicheres, von React unterstütztes Muster.
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;

  // Druckbereiche und Preisregeln neu laden, sobald sich Produkt oder
  // Veredelungsart ändern. Bestehendes Design wird NICHT verworfen, sondern
  // an die neuen Druckbereiche angepasst (syncElementsToPrintAreas).
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!isHydrated || !productId) return;
    let isMounted = true;
    if (isFirstLoad.current) setIsLoadingContext(true);

    Promise.all([getPrintAreas(productId, printMethod), getPricingRules(printMethod)]).then(
      ([areas, rules]) => {
        if (!isMounted) return;
        setPrintAreas(areas);
        setPricingRules(rules);
        setIsLoadingContext(false);
        isFirstLoad.current = false;

        // Aktive Ansicht mit dem neuen Produkt abgleichen: Führt das Produkt
        // die aktuelle Ansicht nicht (z.B. Wechsel von einem Kleidungsstück
        // mit Ärmeln zu einem ärmellosen Produkt, oder zu einer Tasche/Schürze
        // mit ganz anderen Flächen), auf die erste geführte Ansicht setzen.
        // Datengetrieben über ansichtenVon() – keine Produktart-Annahme.
        const produktViews = ansichtenVon(product);
        if (produktViews[0] && !produktViews.includes(activeViewRef.current)) {
          setActiveView(produktViews[0]);
        }

        const dropped = syncElementsToPrintAreas(areas);
        if (dropped > 0) {
          setSyncNotice(
            `${dropped} Element${dropped > 1 ? 'e' : ''} ${dropped > 1 ? 'wurden' : 'wurde'} entfernt, da für diese Ansicht(en) im neuen Kontext kein Druckbereich existiert.`
          );
          setTimeout(() => setSyncNotice(null), 6000);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [isHydrated, productId, printMethod, syncElementsToPrintAreas, setActiveView, product]);

  // Preis live neu berechnen – einzige Stelle, die calculatePrice aufruft.
  useEffect(() => {
    if (pricingRules.length === 0) return;
    const result = calculatePrice({
      basePrice: product.basePrice,
      quantity,
      elements,
      pricingRules,
    });
    setPrices(result.unitPrice, result.totalPrice);
    setPriceBreakdown(result.breakdown);
    setPriceHasErrors(result.hasErrors);
  }, [elements, quantity, pricingRules, product.basePrice, setPrices]);

  // Tastenkürzel: Strg/Cmd+Z = Rückgängig, Strg/Cmd+Y bzw. Strg+Shift+Z =
  // Wiederholen, Entf/Rücktaste = ausgewähltes Element löschen, Strg+D =
  // duplizieren, Pfeiltasten = fein verschieben (0,1cm, mit Shift 1cm).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (isModifier && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (isModifier && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteElement(activeView, printAreas);
        return;
      }

      if (!selectedElementId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeElement(selectedElementId);
        return;
      }

      if (isModifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const area = printAreas.find((a) => a.view === activeView);
        duplicateElement(selectedElementId, area ? { boxWidthCm: area.boxWidthCm, boxHeightCm: area.boxHeightCm } : undefined);
        return;
      }

      if (isModifier && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyElement(selectedElementId);
        return;
      }

      const arrowDeltas: Record<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const el = elements.find((el) => el.id === selectedElementId);
        const area = printAreas.find((a) => a.view === activeView);
        if (!el || !area) return;
        const step = e.shiftKey ? 1 : 0.1;
        const [dx, dy] = arrowDeltas[e.key];
        const xCm = Math.max(0, Math.min(el.xCm + dx * step, area.boxWidthCm - el.widthCm));
        const yCm = Math.max(0, Math.min(el.yCm + dy * step, area.boxHeightCm - el.heightCm));
        commitElement(selectedElementId, { xCm, yCm });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElementId, removeElement, duplicateElement, copyElement, pasteElement, commitElement, elements, printAreas, activeView]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);
  const handleOpenCart = useCallback(() => setIsCartOpen(true), []);
  const handleCloseCart = useCallback(() => setIsCartOpen(false), []);
  const handleOpenCompare = useCallback(() => setIsCompareOpen(true), []);
  const handleCloseCompare = useCallback(() => setIsCompareOpen(false), []);

  const currentPrintArea = printAreas.find((area) => area.view === activeView) ?? null;
  const currentColor = product.colors.find((c) => c.id === colorId) ?? repraesentativeFarbe(product.id, product.colors);
  const currentImages: Record<string, string> = currentColor ? resolveColorImages(product.id, currentColor.id) : {};
  const currentImageUrl = currentImages[activeView] ?? '';
  // Die dem Kunden ZEIGBAREN Ansichten – einzige Quelle für Ansichtswechsler und
  // Großvorschau. Ärmelansichten ohne eigenes Bild werden ausgeblendet, statt sie
  // mit dem Vorderbild zu füllen (siehe sichtbareAnsichten).
  const produktViews = sichtbareAnsichten(product, currentColor?.id ?? null);
  // Zeigt die aktive Ansicht für DIESE Farbe kein Bild (Ärmel sind nicht in
  // jeder Farbe fotografiert), auf die erste zeigbare Ansicht wechseln – sonst
  // bliebe die Leinwand leer.
  const ersteSichtbareView = produktViews[0];
  const activeViewZeigbar = produktViews.includes(activeView);
  useEffect(() => {
    if (ersteSichtbareView && !activeViewZeigbar) setActiveView(ersteSichtbareView);
  }, [ersteSichtbareView, activeViewZeigbar, setActiveView]);

  // Realistische Vorschau: auf hellen Textilien werden Motive per multiply mit
  // dem Stoff verrechnet – abgeleitet aus der echten Farbe, nicht dem Foto.
  const garmentLight = currentColor ? istHellesTextil(currentColor.hex) : false;

  const progressStep = quantity === 0
    ? 0
    : elements.length === 0
      ? 1
      : elements.every((el) => !el.isOutOfBounds)
        ? 3
        : 2;

  if (!isHydrated) {
    return (
      <>
        <SiteHeader onCartClick={handleOpenCart} />
        <div className="flex min-h-[500px] w-full items-center justify-center">
          <p className="text-sm text-brand/40">{t('canvas_loading')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader onCartClick={handleOpenCart} onCompareClick={handleOpenCompare} />

      {/* Schrittleiste liegt AUSSERHALB des Inhaltscontainers, weil sie über
          die volle Breite unter der Navigation klebt. */}
      <Stepper activeStep={progressStep} />

      {/* Zentrierter Inhalt, 1280 px, gleichmäßige Ränder. Der frühere
          Hero-Banner und die Trust-Leiste sind entfallen: Beide standen
          zwischen Navigation und Konfigurator und kosteten auf jedem Aufruf
          Bildschirmhöhe, die dem eigentlichen Werkzeug fehlte. */}
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-4 py-3 lg:px-6 2xl:px-8">

        {syncNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {syncNotice}
          </div>
        )}

        {/*
          WICHTIG: Kein `key`-Prop auf diesem Wrapper (frühere Version
          hatte hier `key={product.id}`) – das hätte bei jedem
          Produktwechsel die komplette Zeile inkl. Produktliste und
          Werkzeugleiste neu gemountet und genau das sichtbare "Flackern"
          verursacht, das behoben werden sollte. Nur die tatsächlich vom
          Produkt betroffenen Teile (Bild, Druckbereiche) aktualisieren sich.
        */}
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-start">
          {/* Linke Sidebar: Produktliste, sticky unterhalb des Headers,
              eigener Scroll-Bereich */}
          {/* Linke Spalte: der Produktbrowser. Breite bestimmt er selbst –
              sie wächst, sobald die Modellliste neben dem Baum aufgeht.
              Höhe an den Viewport gebunden; gescrollt wird INNEN, damit die
              Seite nicht mitwandert. */}
          <div className="w-full lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-auto lg:flex-shrink-0 lg:self-start">
            <ProduktBrowser />
          </div>

          {/* Mitte: Farbe/Größe, Ansichts-Miniaturen + Canvas – größter Bereich */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="w-full animate-fade-in" key={`meta-${product.id}`}>
              <ColorSizeSelector product={product} />
            </div>
            <ProductDetails product={product} />

            <div className="flex w-full max-w-full flex-col items-start gap-3 lg:flex-row">
              <ViewSwitcher imageUrls={currentImages} views={produktViews} />

              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <CanvasToolbar
                  zoom={zoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                  canUndo={history.length > 0}
                  canRedo={future.length > 0}
                  onUndo={undo}
                  onRedo={redo}
                  onOpenPreview={() => setIsPreviewOpen(true)}
                />

                {/* Canvas-Wrapper: max-Höhe orientiert sich am verfügbaren
                    Viewport (abzüglich Header/Toolbar-Schätzwert), damit das
                    Produkt bei jedem Bildschirm vollständig sichtbar bleibt,
                    ohne dass innerhalb der Canvas gescrollt werden muss. */}
                {/* Höhe an den TATSÄCHLICH verbleibenden Platz gebunden.
                    Die frühere Angabe 78vh ignorierte, dass oberhalb rund
                    320 px für Kopfzeile, Schrittleiste, Produktkopf und
                    Werkzeugleiste verbraucht werden – der Canvas ragte
                    dadurch aus dem Sichtbereich und erzwang Scrollen. */}
                <div
                  // Prüfanker für die Sichtprüfung. Das Kleidungsstück wird auf
                  // eine Konva-Leinwand gezeichnet – im DOM gibt es dafür kein
                  // <img>, dessen src man lesen könnte. Ohne diesen Anker lässt
                  // sich nicht nachweisen, dass der Konfigurator dieselbe Datei
                  // zeigt wie die Produktseite; genau dort lag der gemeldete
                  // Fehler ("Liste zeigt Foto, Konfigurator zeigt Silhouette").
                  data-konfigbild={`${currentColor?.id ?? '-'}/${activeView}/${currentImageUrl}`}
                  className="relative w-full max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1100px]"
                  style={{ maxHeight: 'min(840px, calc(100vh - 20rem))' }}
                >
                  {isLoadingContext ? (
                    <CanvasSkeleton />
                  ) : (
                    <ConfiguratorCanvas productImageUrl={currentImageUrl} printArea={currentPrintArea} zoom={zoom} product={product} garmentLight={garmentLight} />
                  )}
                  {/* Eleganter Produktwechsel: Eine Ebene mit dem neuen Teil
                      gleitet herein und löst sich auf; darunter liegt bereits
                      die fertige Leinwand. Schlüssel = product.id, damit die
                      Animation NUR beim Produktwechsel läuft, nicht bei jedem
                      Farb- oder Ansichtswechsel. Konva bleibt unberührt. */}
                  {!isLoadingContext && currentImageUrl && (
                    <div
                      key={`gleiten-${product.id}`}
                      aria-hidden
                      className="animate-produkt-gleiten pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-lg bg-cream"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentImageUrl} alt="" className="max-h-full max-w-full object-contain p-6" />
                    </div>
                  )}
                </div>

                {!isLoadingContext && !currentPrintArea && (
                  <p className="text-xs text-amber-600">
                    {t('canvas_no_print_area')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rechts: Werkzeuge als Tabs + immer sichtbare Preis-Zusammenfassung,
              sticky unterhalb des Headers */}
          {/* Rechte Spalte: Werkzeuge + Zusammenfassung. Der
              Veredelungswechsler sitzt hier statt in einer eigenen Zeile über
              den Spalten – er gehört inhaltlich zu den Optionen und kostete
              oben 62 px Höhe, die dem Entwurfsbereich fehlten. */}
          {/* Rechte Spalte nach dem Muster professioneller Werkzeug-
              oberflächen (Figma, Canva): Die Werkzeuge scrollen INNEN, Preis
              und Bestellknopf sind am Fuß verankert und dadurch dauerhaft
              sichtbar. Vorher scrollte die ganze Spalte – der Bestellknopf
              lag je nach Produkt unterhalb des Sichtbereichs. */}
          <div className="flex w-full flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-6.5rem)] lg:w-80 lg:flex-shrink-0 xl:w-[22rem] 2xl:w-96 lg:self-start">
            {/* Status-Übersicht zuerst: Der Kunde sieht auf einen Blick, wo er
                steht und was als Nächstes ansteht – der geführte Einkauf
                beginnt mit Orientierung, nicht mit Werkzeugen. */}
            <div className="flex-shrink-0">
              <KonfigUebersicht priceHasErrors={priceHasErrors} />
            </div>
            <div className="flex-shrink-0">
              <MethodSwitcher />
            </div>
            {/* min-h-[280px] statt min-h-0: Ohne eine feste Untergrenze darf
                dieser Bereich im Flex-Container bis auf 0 schrumpfen, sobald
                KonfigUebersicht + MethodSwitcher + SummaryPanel bei knappen
                Bildschirmhöhen (1366×768, 1440×900 – verbreitete Laptop-
                Auflösungen) mehr Platz beanspruchen als die feste Spaltenhöhe
                hergibt. Folge: Die Tab-Leiste (u.a. der „Logo"-Tab, der
                Standardtab zum Motiv-Hinzufügen) wird auf einen nicht mehr
                anklickbaren Streifen zusammengedrückt – live per
                elementFromPoint() bestätigt. 280px sichert die Tab-Leiste
                plus etwas Inhalt; reicht der Platz nicht, wächst die Spalte
                über ihre sticky-Höhe hinaus und die Seite scrollt, statt die
                Werkzeuge unbedienbar zu machen. Reicht der Platz, greift
                overflow-y-auto weiterhin normal. */}
            <div className="min-h-[280px] flex-1 overflow-y-auto lg:pr-0.5">
              <ToolPanelTabs printArea={currentPrintArea} printAreas={printAreas} />
            </div>
            <div className="flex-shrink-0">
              <SummaryPanel productName={product.name} breakdown={priceBreakdown} priceHasErrors={priceHasErrors} />
            </div>
          </div>
        </div>
      </div>

      {isCartOpen && <CartDrawer onClose={handleCloseCart} />}
      {isCompareOpen && <CompareModal onClose={handleCloseCompare} />}
      {isPreviewOpen && (
        <LargePreviewModal
          imageUrls={currentImages}
          printAreas={printAreas}
          views={produktViews}
          garmentLight={garmentLight}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}

/** Dezenter Platzhalter statt weißer Fläche/Sprung während des Ladens. */
function CanvasSkeleton() {
  return (
    <div className="flex h-[840px] w-full max-w-[820px] animate-pulse xl:max-w-[960px] 2xl:max-w-[1100px] items-center justify-center rounded-lg bg-cream ring-1 ring-gold/15">
      <div className="h-3/4 w-1/2 rounded-lg bg-gold/10" />
    </div>
  );
}
