'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Hero } from '@/components/layout/Hero';
import { Stepper } from '@/components/layout/Stepper';
import { TrustBar } from '@/components/layout/TrustBar';
import { MethodSwitcher } from './MethodSwitcher';
import { ProductList } from './ProductList';
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
import { PRODUCTS, getProduct } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { calculatePrice, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import type { PricingRule, PrintArea } from '@/types';

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

const DEFAULT_PRODUCT = PRODUCTS[0];
if (!DEFAULT_PRODUCT) {
  throw new Error('PRODUCTS ist leer – mindestens ein Produkt muss konfiguriert sein.');
}
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;

export function ConfiguratorPrototype() {
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculationResult['breakdown'] | null>(null);
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
  const quantity = Object.values(sizeQuantities).reduce((sum, n) => sum + n, 0);
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
  useEffect(() => {
    if (!isHydrated) return;
    if (!productId) {
      setProduct(DEFAULT_PRODUCT.id);
      const firstColor = DEFAULT_PRODUCT.colors[0];
      if (firstColor) setColor(firstColor.id);
    }
  }, [isHydrated, productId, setProduct, setColor]);

  const product = getProduct(productId ?? '') ?? DEFAULT_PRODUCT;

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

        // Ärmellose Produkte (z.B. Weste) haben keine Ärmel-Ansichten –
        // falls man von einem Produkt MIT Ärmeln kommt und gerade auf
        // einer Ärmel-Ansicht war, gäbe es sonst eine aktive Ansicht, die
        // für dieses Produkt gar nicht existiert.
        const hasSleeves = product.hasSleeves ?? true;
        if (!hasSleeves && (activeView === 'sleeve_left' || activeView === 'sleeve_right')) {
          setActiveView('front');
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
  }, [isHydrated, productId, printMethod, syncElementsToPrintAreas]);

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
        duplicateElement(selectedElementId, area ? { movementWidthCm: area.movementWidthCm, referenceGarmentHeightCm: area.referenceGarmentHeightCm } : undefined);
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
        const xCm = Math.max(0, Math.min(el.xCm + dx * step, area.movementWidthCm - el.widthCm));
        const yCm = Math.max(0, Math.min(el.yCm + dy * step, area.referenceGarmentHeightCm - el.heightCm));
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
  const currentColor = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const currentImages = currentColor?.images ?? { front: '', back: '', sleeve_left: '', sleeve_right: '' };
  const currentImageUrl = currentImages[activeView];

  const progressStep = quantity === 0
    ? 0
    : elements.length === 0
      ? 1
      : elements.some((el) => !el.isOutOfBounds)
        ? 2
        : 3;

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

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <Hero />
        <TrustBar />
        <Stepper activeStep={progressStep} />
        <MethodSwitcher />

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
        <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start">
          {/* Linke Sidebar: Produktliste, sticky unterhalb des Headers,
              eigener Scroll-Bereich */}
          <div className="w-full lg:sticky lg:top-20 lg:w-56 lg:flex-shrink-0 lg:self-start">
            <ProductList />
          </div>

          {/* Mitte: Farbe/Größe, Ansichts-Miniaturen + Canvas – größter Bereich */}
          <div className="flex flex-1 flex-col items-center gap-4">
            <div className="w-full animate-fade-in" key={`meta-${product.id}`}>
              <ColorSizeSelector product={product} />
            </div>
            <ProductDetails product={product} />

            <div className="flex w-full max-w-[780px] flex-col items-start gap-3 lg:flex-row">
              <ViewSwitcher imageUrls={currentImages} hasSleeves={product.hasSleeves ?? true} />

              <div className="flex flex-1 flex-col items-center gap-2">
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
                <div className="w-full max-w-[700px]" style={{ maxHeight: 'min(840px, 78vh)' }}>
                  {isLoadingContext ? (
                    <CanvasSkeleton />
                  ) : (
                    <ConfiguratorCanvas productImageUrl={currentImageUrl} printArea={currentPrintArea} zoom={zoom} />
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
          <div className="w-full space-y-4 lg:sticky lg:top-20 lg:w-72 lg:flex-shrink-0 lg:self-start">
            <ToolPanelTabs printArea={currentPrintArea} printAreas={printAreas} />
            <SummaryPanel productName={product.name} breakdown={priceBreakdown} />
          </div>
        </div>
      </div>

      {isCartOpen && <CartDrawer onClose={handleCloseCart} />}
      {isCompareOpen && <CompareModal onClose={handleCloseCompare} />}
      {isPreviewOpen && (
        <LargePreviewModal
          imageUrls={currentImages}
          printAreas={printAreas}
          hasSleeves={product.hasSleeves ?? true}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}

/** Dezenter Platzhalter statt weißer Fläche/Sprung während des Ladens. */
function CanvasSkeleton() {
  return (
    <div className="flex h-[840px] w-full max-w-[700px] animate-pulse items-center justify-center rounded-lg bg-cream ring-1 ring-gold/15">
      <div className="h-3/4 w-1/2 rounded-lg bg-gold/10" />
    </div>
  );
}
