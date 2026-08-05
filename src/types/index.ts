/**
 * Zentrale Typdefinitionen für den Produktkonfigurator.
 *
 * Die Kern-Verträge (`PrintView`/`ProductType` als offene IDs, `PrintArea`,
 * `ConfiguratorState`, `CartItem`) sind bewusst GENERISCH (ADR 0001/0002) – KEIN
 * Supabase-Spiegel. Die Produktdefinition selbst lebt in `src/config/products`
 * (`ProductConfig`), nicht hier.
 */

/**
 * Druckansicht als OFFENE View-ID (früher geschlossene Union
 * 'front'|'back'|'sleeve_left'|'sleeve_right'). Die Menge gültiger Ansichten
 * kommt nicht mehr aus dem Typ, sondern aus der zentralen View-Registry
 * (src/config/decorationPositions.ts) und der pro-Produkt-Deklaration
 * (ProductConfig.views). Absicherung per Wächter-Tests statt Compiler-
 * Vollständigkeit — siehe docs/adr/0001-generische-druckansichten.md.
 */
export type PrintView = string;

/** Veredelungsart – bestimmt Druckbereichsgrößen, Preislogik und Farboptionen */
export type PrintMethod = 'dtf' | 'embroidery';

/**
 * Produktart als OFFENE ID (früher geschlossene 8er-Kleidungs-Union). Analog
 * zu `PrintView` (ADR 0001): die Menge gültiger Arten kommt nicht mehr aus dem
 * Typ, sondern aus dem zentralen PRODUCT_TYPES-Register
 * (src/config/products/productTypes.ts) – der EINZIGEN Quelle. So entsteht eine
 * neue Produktgruppe (Tasche, Schürze, Cap …) rein über einen Registereintrag,
 * ohne Typänderung quer durch den Code.
 *
 * Die verlorene Compiler-Vollständigkeit ersetzen Wächter-Tests
 * (config/products/__tests__/productTypes.test.ts): jede von einem Produkt oder
 * über `komplement` genutzte Art MUSS im Register stehen. Siehe ADR 0002 §1.
 * Bekannt heute: tshirt, longsleeve, polo, hoodie, zip-hoodie, sweater, vest, jacket.
 */
export type ProductType = string;

/** Vier feste Qualitätsstufen, genau eine pro Produkt. Bestimmt zusammen
 *  mit purchasePrice den Verkaufs-Grundpreis, siehe
 *  src/config/pricing/marginTiers.ts::computeBasePrice(). */
export type QualityTier = 'basic' | 'standard' | 'premium' | 'luxury';

/** Bedruckbarer Bereich einer Produktansicht, relativ positioniert (%) */
export interface PrintArea {
  id: string;
  productId: string;
  view: PrintView;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  maxWidthCm: number;
  maxHeightCm: number;
  seamMarginCm: number;
  /** WAHRE Höhe der GEZEICHNETEN Fläche in cm – Grundlage der Pixel↔cm-
   *  Umrechnung (cmConversion: pxPerCm = areaPx.height / dieser Wert).
   *
   *  Der Wert MUSS beschreiben, wie viel Stoff die gezeichnete Box abdeckt,
   *  sonst driften angezeigtes Maß und gezeichnete Strecke auseinander.
   *  Hier stand früher die KÖRPERLÄNGE (z.B. 72 cm), obwohl der Generator
   *  die Box als bedruckbaren Bereich zeichnet (z.B. 47 cm). Im laufenden
   *  Canvas nachgemessen: Box 457,7 px, Standardlogo 13,95 cm mit 89 px
   *  gezeichnet – 6,38 statt 9,74 px/cm. Jedes Motiv erschien mit 65 % der
   *  angegebenen Größe. Kommt jetzt als boxHeightCm aus dem Generator.
   *
   *  Nicht zu verwechseln mit maxHeightCm: Das ist die Motivgrenze. Auf
   *  Vorder-/Rückseite sind beide gleich (die Box IST der bedruckbare
   *  Bereich), auf der Ärmelansicht ist diese Fläche bewusst größer. */
  boxHeightCm: number;
  /** Wahre Breite der gezeichneten Fläche in cm (boxWidthCm, s.o.). */
  boxWidthCm: number;
  /** Startposition eines neu eingefügten Motivs innerhalb der Fläche, in cm.
   *  Nur auf der Ärmelansicht gesetzt: Dort umfasst der Bewegungsbereich das
   *  ganze Kleidungsstück, ein neues Motiv soll aber mittig auf dem Oberarm
   *  beginnen. Ohne Angabe gilt die bisherige Zentrierung. */
  startXCm?: number;
  startYCm?: number;
  /** Sperrzonen INNERHALB der Bewegungsfläche, auf denen kein Motiv
   *  platziert werden darf (z.B. Kragen-Naht/Knöpfe beim Polo,
   *  Reißverschluss bei Jacken/Hoodies). Prozentwerte relativ zum
   *  GESAMTEN Bild (dieselbe Basis wie xPercent/yPercent/widthPercent/
   *  heightPercent oben). */
  exclusionZones?: ExclusionZone[];
}

/** Rechteckige Sperrzone (Standardfall, z.B. Reißverschluss-Streifen,
 *  Knopfleiste). xPercent/yPercent = obere linke Ecke. */
export interface RectExclusionZone {
  shape?: 'rect';
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  label: string;
}

/** Kreisförmige Sperrzone (z.B. ein einzelner Knopf) – präziser als ein
 *  Rechteck, da sie keine "toten Ecken" um das runde Objekt herum sperrt.
 *  xPercent/yPercent = Mittelpunkt. */
export interface CircleExclusionZone {
  shape: 'circle';
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  label: string;
}

export type ExclusionZone = RectExclusionZone | CircleExclusionZone;

// ---------------------------------------------------------------
// Preisregeln
// ---------------------------------------------------------------

/**
 * Preisbausteine. Jeder Typ braucht einen Handler in
 * `lib/pricing/ruleEngine.ts` – ein Typ OHNE Handler löst bewusst einen
 * Fehler aus, statt still übersprungen zu werden (siehe dort).
 */
export type PricingRuleType =
  // ── Veredelungskosten je Stück ──────────────────────────────────────
  | 'per_logo'
  | 'per_text'
  | 'per_position'
  | 'per_cm2'
  | 'per_1000_stitches'
  /** Wird nicht über einen Handler, sondern über QUANTITY_TIERS abgebildet. */
  | 'quantity_discount'
  // ── Einmalige Kosten ────────────────────────────────────────────────
  /** EINMALIGE Kosten des Auftrags (Rüsten, Digitalisieren, Einrichten) –
   *  nicht je Stück. Wie oft der Betrag anfällt, steuert `multiplier`. */
  | 'setup_fee'
  // ── Zuschläge ───────────────────────────────────────────────────────
  /** Zuschlag je Stück, z.B. Premiumgarn, Spezialfolie, Sondermaterial. */
  | 'surcharge_per_unit'
  /** Einmaliger Zuschlag, z.B. Expressproduktion. */
  | 'surcharge_per_order'
  // ── Nachlässe ───────────────────────────────────────────────────────
  /** Prozentualer Nachlass, z.B. Vereins-/Geschäftskundenrabatt, Aktion. */
  | 'discount_percent'
  /** Absoluter Nachlass je Stück, z.B. Gutschein auf den Stückpreis. */
  | 'discount_per_unit';

/**
 * Wie oft der Betrag einer EINMALIGEN Regel anfällt.
 *
 * `once`         – einmal je Auftragsposition, unabhängig von Motiven
 * `per_position` – je genutzter Veredelungsposition (Brust, Rücken, Ärmel …)
 * `per_element`  – je Motiv (mehrere Logos auf derselben Position zählen einzeln)
 */
export type PricingRuleMultiplier = 'once' | 'per_position' | 'per_element';

export interface PricingRule {
  id: string;
  ruleType: PricingRuleType;
  /** Begrenzt die Regel auf EINE Ansicht. Ohne Angabe gilt sie für alle. */
  printView?: PrintView;
  price: number;
  label: string;
  isActive: boolean;

  // ── Optionale Steuerung (alle Felder sind freiwillig) ────────────────
  // Damit lassen sich Preisstrategien konfigurieren, OHNE die
  // Berechnungslogik anzufassen – siehe lib/pricing/ruleEngine.ts.

  /** Nur für einmalige Regeln. Ohne Angabe: `once`. */
  multiplier?: PricingRuleMultiplier;
  /** Nur ab dieser Stückzahl gültig (Staffeln, Mengenaktionen). */
  minQuantity?: number;
  /** Nur bis zu dieser Stückzahl gültig. */
  maxQuantity?: number;
  /** ISO-Datum – Aktionen mit Start-/Enddatum. */
  validFrom?: string;
  validUntil?: string;
}

// ---------------------------------------------------------------
// Live-Konfigurator-State (im Browser, noch nicht gespeichert)
// ---------------------------------------------------------------

export type ConfigElementType = 'logo' | 'text';

/** Gemeinsame Basis für Logo- und Text-Elemente im Canvas */
interface BaseConfigElement {
  id: string;               // clientseitig generierte UUID
  type: ConfigElementType;
  view: PrintView;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotationDeg: number;
  isOutOfBounds: boolean;   // true → visuelle Warnung anzeigen
  extraPrice: number;       // aus Preisregeln berechnet
  /** Geschätzte Stichzahl bei Stickerei (Branchen-Näherung, siehe
   *  estimateStitches.ts – kein Ersatz für die echte Digitalisierung in
   *  Chroma Inspire o.ä., aber eine fundierte Vorab-Schätzung für die
   *  Preisberechnung). Bei DTF ungenutzt (bleibt 0). */
  estimatedStitches: number;
  /** Anzeigename in der Ebenenliste (frei editierbar) */
  name: string;
  /** Gesperrte Elemente lassen sich nicht mehr verschieben/skalieren */
  locked: boolean;
  /** Ausgeblendete Elemente werden im Canvas nicht gerendert (bleiben aber erhalten) */
  hidden: boolean;
}

export interface LogoElement extends BaseConfigElement {
  type: 'logo';
  fileUrl: string;
  fileName: string;
  originalWidthPx: number;
  originalHeightPx: number;
  /** Unveränderte Originaldatei (vor Hintergrundentfernung) – ermöglicht,
   *  die Hintergrundentfernung nachträglich ein-/auszuschalten, ohne die
   *  Datei erneut hochladen zu müssen. */
  originalFileUrl: string;
  /** true = fileUrl ist aktuell die freigestellte Version */
  backgroundRemoved: boolean;
  /** Anteil der (bereits auf den Inhalt zugeschnittenen) Box, der
   *  tatsächlich sichtbares Motiv ist (0-1) – z.B. ein rundes Logo in
   *  eckiger Box füllt nur ca. 78%. Reduziert die für den Preis
   *  berechnete Fläche, analog zu inkCoverageRatio bei Text. */
  contentFillRatio: number;
}

export interface TextElement extends BaseConfigElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSizePx: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  /** Buchstabenabstand in px (Konva letterSpacing) */
  letterSpacing: number;
  /** Zeilenabstand als Vielfaches der Schriftgröße (Konva lineHeight) */
  lineHeight: number;
  /** Schatten hinter dem Text */
  hasShadow: boolean;
  /** Umrandung/Outline um die Buchstaben */
  hasOutline: boolean;
  outlineColor: string;
  /** Anteil der Auswahl-Box, der tatsächlich von Buchstaben bedeckt ist
   *  (0–1). Wird für die Preisberechnung genutzt, damit nur die echte
   *  Textfläche bezahlt wird, nicht die komplette Box. */
  inkCoverageRatio: number;
}

export type ConfigElement = LogoElement | TextElement;

/** Gesamter Zustand einer laufenden Konfiguration */
export interface ConfiguratorState {
  printMethod: PrintMethod;
  productId: string | null;
  colorId: string | null;
  /** Menge je Größe, z.B. { S: 10, M: 50 } – ein Design, mehrere Größen
   *  gleichzeitig konfigurierbar. */
  sizeQuantities: Record<string, number>;
  activeView: PrintView;
  elements: ConfigElement[];
  unitPrice: number;
  totalPrice: number;
  /** Größe, deren Maße gerade live an der Leinwand als Lineal angezeigt
   *  werden (z.B. beim Fokussieren eines Größenfelds) – reine UI-Auswahl,
   *  nicht Teil der gespeicherten Konfiguration. null = kein Hover/Fokus,
   *  Anzeige fällt dann auf eine Referenzgröße zurück. */
  previewSize: string | null;
}

// ---------------------------------------------------------------
// Bestellung / Anfrage
// ---------------------------------------------------------------

export interface ContactInfo {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message?: string;
}

export type OrderType = 'inquiry' | 'order';

// ---------------------------------------------------------------
// Warenkorb
// ---------------------------------------------------------------

/** Eine fertig konfigurierte Position im Warenkorb (ein Produkt inkl. Design) */
export interface CartItem {
  id: string;
  printMethod: PrintMethod;
  productId: string;
  colorId: string;
  /** Menge je Größe, z.B. { S: 10, M: 50, L: 20 } – ein Design, mehrere
   *  Größen gleichzeitig, statt für jede Größe einzeln neu zum Warenkorb
   *  hinzufügen zu müssen (wobei vorher das Design verloren ging). */
  sizeQuantities: Record<string, number>;
  /** Summe aller Größen – bestimmt die Mengenrabatt-Stufe. */
  quantity: number;
  elements: ConfigElement[];
  unitPrice: number;
  totalPrice: number;
  /** Einmalige Rüstkosten dieser Position (nicht je Stück). Wird
   *  mitgeführt, damit eine Mengenänderung im Warenkorb sie NICHT
   *  vervielfacht – sie fällt pro Auftrag genau einmal an. */
  setupTotal?: number;
  addedAt: number;
}
