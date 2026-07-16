/**
 * Zentrale Typdefinitionen für den Bekleidungskonfigurator.
 * Diese Typen spiegeln das Supabase-Schema (supabase/migrations/0001_init.sql).
 */

export type PrintView = 'front' | 'back' | 'sleeve_left' | 'sleeve_right';

/** Veredelungsart – bestimmt Druckbereichsgrößen, Preislogik und Farboptionen */
export type PrintMethod = 'dtf' | 'embroidery';

// ---------------------------------------------------------------
// Produktdaten (aus Supabase geladen)
// ---------------------------------------------------------------

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  basePrice: number;
  material?: string;
  weightGsm?: number;
  fit?: string;
  targetGroup?: string;
  careInstructions?: string;
  certifications: string[];
  description?: string;
  isActive: boolean;
}

export interface ProductColor {
  id: string;
  productId: string;
  colorName: string;
  colorHex?: string;
  imageFront: string;
  imageBack: string;
  imageSleeveL?: string;
  imageSleeveR?: string;
}

export interface ProductSize {
  id: string;
  productId: string;
  sizeLabel: string;
  inStock: boolean;
}

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
  /** Echte Höhe des Kleidungsstücks (Referenzgröße, meist "M") in cm –
   *  wird für die Pixel-zu-cm-Umrechnung der GESAMTEN Bewegungsfläche
   *  verwendet. WICHTIG: bewusst getrennt von maxHeightCm (das ist nur
   *  die maximale Motivgröße, eine Maschinen-/Produktionsgrenze, kein
   *  Körpermaß) – vorher wurden beide fälschlich gleichgesetzt, wodurch
   *  alle angezeigten cm-Werte nicht der Realität entsprachen. */
  referenceGarmentHeightCm: number;
  /** Reale Breite des GESAMTEN Bewegungsbereichs (nicht die maximale
   *  Motivgröße!) in cm – bevorzugt aus echten Lieferantendaten
   *  (sizeGuide-Breite), sonst aus dem Foto-Seitenverhältnis geschätzt.
   *  Wird für Positionierung/Zentrierung neuer Elemente verwendet, damit
   *  die Mitte des Koordinatensystems der visuellen Mitte des
   *  Kleidungsstücks entspricht. */
  movementWidthCm: number;
  /** Sperrzonen INNERHALB der Bewegungsfläche, auf denen kein Motiv
   *  platziert werden darf (z.B. Knopfleiste beim Polo, Reißverschluss
   *  beim Zip-Hoodie). Prozentwerte relativ zum GESAMTEN Bild (dieselbe
   *  Basis wie xPercent/yPercent/widthPercent/heightPercent oben). */
  exclusionZones?: { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number; label: string }[];
}

// ---------------------------------------------------------------
// Preisregeln
// ---------------------------------------------------------------

export type PricingRuleType =
  | 'per_logo'
  | 'per_text'
  | 'per_position'
  | 'per_cm2'
  | 'per_1000_stitches'
  | 'quantity_discount';

export interface PricingRule {
  id: string;
  ruleType: PricingRuleType;
  printView?: PrintView;
  sizeThresholdCm2?: number;
  price: number;
  label: string;
  isActive: boolean;
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

export interface OrderSubmission {
  contact: ContactInfo;
  orderType: OrderType;
  productId: string;
  colorId: string;
  sizeLabel: string;
  quantity: number;
  elements: ConfigElement[];
  unitPrice: number;
  totalPrice: number;
}

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
  addedAt: number;
}
