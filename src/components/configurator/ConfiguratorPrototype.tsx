'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, ChevronDown } from 'lucide-react';
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
import { getPrintAreas, flaecheFuerGroesse } from '@/config/printAreas';
import { getPricingRules } from '@/config/pricingRules';
import { PRODUCTS, getProduct, type ProductConfig } from '@/config/products';
import { kleinsteBestellteGroesse, groessenLeiterVon } from '@/config/products/groessen';
import { resolveColorImages, repraesentativeFarbe } from '@/lib/assets';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { calculatePrice, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import { findeMengenTipp } from '@/lib/pricing/mengenTipp';
import type { PricingRule, PrintArea, PrintMethod } from '@/types';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { ansichtenVon, sichtbareAnsichten } from '@/lib/products/ansichten';
import { vorladenAlleFarben } from '@/lib/configurator/vorladen';
import { passendeGroessen } from '@/lib/configurator/uebernahme';
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
  // Ausbauplan (quickwins): Preisregeln der JEWEILS ANDEREN Veredelungsart,
  // ausschließlich für den Vergleichspreis im MethodSwitcher – niemals für
  // den tatsächlichen, im Store gespeicherten Preis (dessen einzige Quelle
  // bleibt der Effekt unten, der `setPrices` aufruft).
  const [otherMethodPricingRules, setOtherMethodPricingRules] = useState<PricingRule[]>([]);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculationResult['breakdown'] | null>(null);
  // Preisbausteine, die nicht verarbeitet werden konnten. Nicht leer =
  // der Preis ist ungültig und darf NICHT bestellbar sein (siehe
  // lib/pricing/ruleEngine.ts, Abschnitt „FAIL FAST").
  const [priceHasErrors, setPriceHasErrors] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // true = die Schublade wurde gerade durch ein erfolgreiches "In den
  // Warenkorb" geöffnet (nicht durch den Header-Klick) – steuert die kurze
  // Erfolgsbestätigung oben in CartDrawer.
  const [cartJustAdded, setCartJustAdded] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Nur Handy/Tablet (unter lg): Die Produktliste ist eingeklappt, damit nach dem Öffnen des Konfigurators
  // zuerst die Vorschau kommt statt einer 700 px hohen Liste (Test 2026-11-10: Vorschau erst bei y=1138).
  const [browserOffenMobil, setBrowserOffenMobil] = useState(false);
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
  const previewSize = useConfiguratorStore((s) => s.previewSize);
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
  const setSizeQuantities = useConfiguratorStore((s) => s.setSizeQuantities);
  const setPrices = useConfiguratorStore((s) => s.setPrices);
  const unitPrice = useConfiguratorStore((s) => s.unitPrice);
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
  //
  // `?farbe=<id>` trägt die auf der Produktseite GEWÄHLTE Variante weiter
  // (siehe ProduktFarbeContext/KonfiguratorCta). Ohne diese Auswertung wählte
  // der Konfigurator hier erneut eigenständig die repräsentative Farbe – hatte
  // der Kunde auf der Produktseite eine ANDERE Farbe gewählt, öffnete der
  // Konfigurator auf einem Bild, das der Kunde so nie angeklickt hatte. Nur
  // gültig, wenn das Produkt diese Farbe tatsächlich führt (defensiv gegen
  // eine von Hand veränderte URL).
  useEffect(() => {
    if (!isHydrated) return;

    const params = new URLSearchParams(window.location.search);
    const gewuenscht = params.get('produkt');
    if (gewuenscht && gewuenscht !== productId) {
      const ziel = getProduct(gewuenscht);
      if (ziel) {
        setProduct(ziel.id);
        const gewuenschteFarbe = params.get('farbe');
        const passendeFarbe = ziel.colors.find((c) => c.id === gewuenschteFarbe);
        const farbe = passendeFarbe ?? repraesentativeFarbe(ziel.id, ziel.colors);
        if (farbe) setColor(farbe.id);
        // Größen/Mengen der bisherigen Auswahl auf das neue Produkt abbilden
        // (dieselbe Logik wie beim Produktwechsel über ProduktBrowser,
        // waehleModell) – ohne diese Zuordnung blieb eine Menge unter einer
        // Größe stehen, die es beim neuen Produkt gar nicht gibt: unsichtbar
        // in der Größentabelle, aber weiterhin in der Summe und im Preis
        // enthalten, bis die Bestellung erst beim Absenden mit einer
        // verwirrenden Fehlermeldung abgelehnt wurde.
        setSizeQuantities(passendeGroessen(ziel, useConfiguratorStore.getState().sizeQuantities));
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
  }, [isHydrated, productId, setProduct, setColor, setSizeQuantities]);

  const product = getProduct(productId ?? '') ?? DEFAULT_PRODUCT;

  // Nach einem Produktwechsel die Liste (unter lg) wieder einklappen: Man will das gewählte Produkt sehen, nicht die Liste.
  useEffect(() => {
    setBrowserOffenMobil(false);
  }, [product.id]);

  // ── Größenabhängige Druckflächen: EINZIGE Auflösungsstelle ─────────────
  // Ein Motiv wird einmal platziert und identisch auf jede bestellte Größe
  // gedruckt – es muss deshalb auf der KLEINSTEN bestellten Größe passen,
  // sonst ragt es dort über den bedruckbaren Bereich hinaus, obwohl bei einer
  // größeren Größe noch Platz wäre (siehe kleinsteBestellteGroesse). Ohne
  // gewählte Stückzahl (Warenkorb noch leer) gilt ersatzweise die im
  // Größenfeld gehoverte Größe, sonst die Referenzgröße der Leiter – exakt
  // die bisherige Fallback-Kette der Lineal-Beschriftung, jetzt aber
  // bestimmend für die TATSÄCHLICHE Fläche, nicht nur deren Beschriftung.
  //
  // Ab hier ersetzt effectivePrintAreas ausnahmslos die roh geladenen
  // printAreas – jede Stelle, die eine Fläche zeigt oder gegen sie
  // begrenzt (Canvas, Werkzeugleiste, Großvorschau, Pfeiltasten-Clamp),
  // muss dieselbe, für dieselbe Größe aufgelöste Fläche sehen, sonst zeigt
  // der Kunde ein anderes Maximum als das, wogegen tatsächlich geprüft wird.
  const leiter = groessenLeiterVon(product);
  const governingSize = kleinsteBestellteGroesse(sizeQuantities, leiter) ?? previewSize ?? leiter.referenz;
  const effectivePrintAreas = useMemo(
    () => printAreas.map((a) => flaecheFuerGroesse(a, governingSize)),
    [printAreas, governingSize]
  );

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

  // Dieselbe Ref-Regel für governingSize: `syncElementsToPrintAreas` unten
  // muss gegen die für die AKTUELL bestellte(n) Größe(n) aufgelöste Fläche
  // prüfen (sonst könnte ein Element fälschlich als „zu groß" markiert
  // werden, obwohl die tatsächlich geltende Größe mehr Platz böte) – ohne
  // dass jede Mengenänderung einen kompletten Neu-Fetch der Druckflächen
  // auslöst (getPrintAreas hängt nicht von der Größe ab).
  const governingSizeRef = useRef(governingSize);
  governingSizeRef.current = governingSize;

  // Druckbereiche und Preisregeln neu laden, sobald sich Produkt oder
  // Veredelungsart ändern. Bestehendes Design wird NICHT verworfen, sondern
  // an die neuen Druckbereiche angepasst (syncElementsToPrintAreas).
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!isHydrated || !productId) return;
    let isMounted = true;
    if (isFirstLoad.current) setIsLoadingContext(true);

    const andereMethode: PrintMethod = printMethod === 'dtf' ? 'embroidery' : 'dtf';
    Promise.all([
      getPrintAreas(productId, printMethod),
      getPricingRules(printMethod),
      getPricingRules(andereMethode),
    ]).then(([areas, rules, andereRules]) => {
        if (!isMounted) return;
        setPrintAreas(areas);
        setPricingRules(rules);
        setOtherMethodPricingRules(andereRules);
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

        const areasFuerAktuelleGroesse = areas.map((a) => flaecheFuerGroesse(a, governingSizeRef.current));
        const dropped = syncElementsToPrintAreas(areasFuerAktuelleGroesse);
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

  // Vergleichspreis der JEWEILS ANDEREN Veredelungsart für den
  // MethodSwitcher (Ausbauplan, quickwins) – reine Anzeige, verändert nie
  // Store-Zustand oder das Preismodell selbst. Bewusst als useMemo statt
  // eines weiteren setState-Effekts: es gibt keinen Grund, diesen Wert
  // zwischen Renderns zu persistieren.
  const otherMethodUnitPrice = useMemo(() => {
    if (otherMethodPricingRules.length === 0) return null;
    return calculatePrice({
      basePrice: product.basePrice,
      quantity,
      elements,
      pricingRules: otherMethodPricingRules,
    }).unitPrice;
  }, [elements, quantity, otherMethodPricingRules, product.basePrice]);

  // Mengen-Tipp (lib/pricing/mengenTipp.ts): Liegt knapp über der gewählten Menge eine Staffelgrenze, bei der der GESAMTpreis
  // sinkt (z. B. 50 statt 49 Stück), zeigt die Kauf-Leiste das an. Reine Anzeige; die Bestellung rechnet mit der gewählten Menge.
  // Bei Stickerei (nur Anfrage, Kostenschätzung) bewusst kein Tipp.
  const mengenTipp = useMemo(
    () =>
      printMethod === 'embroidery' || pricingRules.length === 0
        ? null
        : findeMengenTipp({ basePrice: product.basePrice, quantity, elements, pricingRules }),
    [printMethod, product.basePrice, quantity, elements, pricingRules]
  );

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
        pasteElement(activeView, effectivePrintAreas);
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
        const area = effectivePrintAreas.find((a) => a.view === activeView);
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
        const area = effectivePrintAreas.find((a) => a.view === activeView);
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
  }, [undo, redo, selectedElementId, removeElement, duplicateElement, copyElement, pasteElement, commitElement, elements, effectivePrintAreas, activeView]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);
  const handleOpenCart = useCallback(() => setIsCartOpen(true), []);
  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
    setCartJustAdded(false);
  }, []);
  // Nach erfolgreichem "In den Warenkorb": Schublade öffnen UND als "gerade
  // hinzugefügt" markieren, statt nur den Badge-Zähler in der Kopfzeile zu
  // ändern – siehe CartDrawer.geradeHinzugefuegt.
  const handleItemAddedToCart = useCallback(() => {
    setCartJustAdded(true);
    setIsCartOpen(true);
  }, []);
  const handleOpenCompare = useCallback(() => setIsCompareOpen(true), []);
  const handleCloseCompare = useCallback(() => setIsCompareOpen(false), []);

  const currentPrintArea = effectivePrintAreas.find((area) => area.view === activeView) ?? null;
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
          <p className="text-sm text-brand/70">{t('canvas_loading')}</p>
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
            {/* Unter lg: Schalter statt offener Liste. Ab lg bleibt alles wie bisher (Schalter ausgeblendet). */}
            <button
              type="button"
              onClick={() => setBrowserOffenMobil((offen) => !offen)}
              aria-expanded={browserOffenMobil}
              aria-controls="produkt-browser-bereich"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gold/20 bg-white px-4 py-3 text-left lg:hidden"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-brand">{t('browser_mobile_toggle')}</span>
                <span className="block truncate text-xs text-brand/70">{product.name}</span>
              </span>
              <ChevronDown className={`h-5 w-5 flex-shrink-0 text-brand/70 transition-transform ${browserOffenMobil ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {/* lg:h-full ist ZWINGEND: Der Produkt-Browser rechnet seine Höhe mit lg:h-full gegen diesen Container. Ohne feste Höhe
                hier wuchs er auf die Länge der ganzen Modellliste (z. B. 11.952 px bei „Hoodie“), die Liste war nicht mehr scrollbar
                und das Mausrad bewegte die ganze Seite (Fehler seit dem Handy-Umbau vom 2026-11-10, gemeldet 2026-11-12). */}
            <div id="produkt-browser-bereich" className={browserOffenMobil ? 'mt-3 lg:mt-0 lg:h-full' : 'hidden lg:block lg:h-full'}>
              <ProduktBrowser />
            </div>
          </div>

          {/* Mitte: Farbe/Größe, Ansichts-Miniaturen + Canvas – größter Bereich */}
          {/* Unter lg ohne eigenen Kasten (display: contents): So wird die Vorschau (sticky) ein direktes Kind der
              ganzen Zeile und bleibt beim Scrollen durch die Werkzeuge sichtbar. Ab lg wie bisher. */}
          <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:items-center lg:gap-2">
            <div className="w-full animate-fade-in" key={`meta-${product.id}`}>
              <ColorSizeSelector product={product} />
            </div>
            <ProductDetails product={product} />

            <div className="contents lg:flex lg:w-full lg:max-w-full lg:flex-row lg:items-start lg:gap-3">
              <ViewSwitcher imageUrls={currentImages} views={produktViews} />

              {/* Unter lg: klebt unter Kopfzeile + Schrittleiste fest (z-20, darunter die beiden), klein gehalten, damit
                  darunter Platz für die Werkzeuge bleibt. Test 2026-11-10: Schrift/Farbe lagen 751 px unter der Vorschau. */}
              <div className="sticky top-[96px] z-20 flex w-full flex-col items-center gap-2 bg-brand-light/95 pb-2 backdrop-blur lg:static lg:z-auto lg:min-w-0 lg:flex-1 lg:bg-transparent lg:pb-0 lg:backdrop-blur-none">
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
                  className="relative w-full max-w-[210px] sm:max-w-[260px] md:max-w-[340px] lg:max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1100px]"
                  style={{ maxHeight: 'min(840px, calc(100vh - 20rem))' }}
                >
                  {isLoadingContext ? (
                    <CanvasSkeleton />
                  ) : (
                    <ConfiguratorCanvas productImageUrl={currentImageUrl} printArea={currentPrintArea} zoom={zoom} governingSize={governingSize} garmentLight={garmentLight} />
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
                  <p className="text-xs text-amber-800">
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
          {/* Ab lg ist die Spalte EIN eigener Scrollbereich (höchstens so hoch wie das Fenster, sticky unter der
              Kopfzeile). Vorher hatte sie eine feste Höhe, und der Werkzeugbereich durfte nur bis auf 280 px
              schrumpfen: Bei Fensterhöhen unter ca. 1180 px (1440×900, 1366×768, auch 1920×1080) ragte die Spalte
              über ihren Kasten hinaus – Größen, Preis und „In den Warenkorb“ lagen unter dem Sichtbereich und
              beim Scrollen über der Fußzeile (Prüfung 2026-11-12, live bestätigt). Jetzt scrollt die Spalte innen;
              die Kauf-Leiste (Preis + Bestellknopf) klebt am Fuß der Spalte, solange das Fenster mindestens 600 px
              hoch ist; Werkzeuge und Größentabelle scrollen darüber. */}
          <div className="flex w-full flex-col gap-2 lg:sticky lg:top-24 lg:-mx-1 lg:max-h-[calc(100vh-6.5rem)] lg:w-[20.5rem] lg:flex-shrink-0 lg:self-start lg:overflow-y-auto lg:p-1 lg:[scrollbar-width:thin] xl:w-[22.5rem] 2xl:w-[24.5rem]">
            {/* Status-Übersicht zuerst: Der Kunde sieht auf einen Blick, wo er
                steht und was als Nächstes ansteht – der geführte Einkauf
                beginnt mit Orientierung, nicht mit Werkzeugen. */}
            <div className="flex-shrink-0">
              <KonfigUebersicht priceHasErrors={priceHasErrors} />
            </div>
            <div className="flex-shrink-0">
              <MethodSwitcher currentUnitPrice={unitPrice} otherMethodUnitPrice={otherMethodUnitPrice} />
            </div>
            <div className="flex-shrink-0">
              <ToolPanelTabs printArea={currentPrintArea} printAreas={effectivePrintAreas} />
            </div>
            {/* Zwei Kästen (Größen/Staffel, Kauf-Leiste); die Kauf-Leiste klebt am Fuß der Spalte. */}
            <SummaryPanel
              productName={product.name}
              breakdown={priceBreakdown}
              mengenTipp={mengenTipp}
              priceHasErrors={priceHasErrors}
              onItemAdded={handleItemAddedToCart}
            />
          </div>
        </div>
      </div>

      {isCartOpen && <CartDrawer onClose={handleCloseCart} geradeHinzugefuegt={cartJustAdded} />}
      {isCompareOpen && <CompareModal onClose={handleCloseCompare} />}
      {isPreviewOpen && (
        <LargePreviewModal
          imageUrls={currentImages}
          printAreas={effectivePrintAreas}
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
