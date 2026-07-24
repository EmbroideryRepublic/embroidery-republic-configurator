import type { PrintView, ProductType, QualityTier } from '@/types';
import type { SupplierProductRef } from '@/lib/suppliers/types';

export interface ProductColorConfig {
  id: string;
  name: string;
  hex: string;
  images: Record<PrintView, string>;
}

export interface ProductConfig {
  id: string;
  name: string;
  brand: string;
  /** Feste Filter-/Navigations-Kategorie, siehe ProductType. Nicht zu
   *  verwechseln mit detailedDescription.productType (freier Marketing-
   *  Text des Lieferanten, z.B. "Poloshirts"). */
  productType: ProductType;
  /** Qualitätsstufe – bestimmt zusammen mit purchasePrice den basePrice,
   *  siehe src/config/pricing/marginTiers.ts::computeBasePrice(). */
  qualityTier: QualityTier;
  /** Einkaufspreis (Netto, pro Stück) – Grundlage für computeBasePrice().
   *  Bei den 12 Bestandsprodukten aus dem historischen basePrice
   *  zurückgerechnet (Platzhalter, keine echte EK-Preisprüfung). */
  purchasePrice: number;
  basePrice: number;
  sizes: string[];
  colors: ProductColorConfig[];
  tagline: string;
  material: string;
  weightGsm: number;
  fit: string;
  description: string;
  certifications: string[];
  careInstructions: string;
  hasRealPhotos?: boolean;
  /** false = Produkt hat keine Ärmel (z.B. Weste/Bodywarmer) – die
   *  Ärmel-Ansichten werden dann in Ansichtswechsler, Großansicht und
   *  Preis-Aufschlüsselung ausgeblendet. Default: true (hat Ärmel). */
  hasSleeves?: boolean;
  /** Link zum technischen Datenblatt des Herstellers (optional) */
  datasheetUrl?: string;
  /** Bezugsquelle für die Lieferanten-Automatisierung (Supplier Engine,
   *  src/lib/suppliers/): Lieferant + Artikelnummer + direkte Produkt-URL.
   *  Wird NICHT in den Marken-Dateien gepflegt, sondern zentral in
   *  supplierRefs.ts und beim Registrieren in index.ts angeheftet.
   *  Optional, weil nicht für jedes Produkt eine verifizierte
   *  Artikelnummer/URL vorliegt – Positionen solcher Produkte landen bei
   *  createSupplierOrder() in der "unresolved"-Liste statt im Job. */
  supplier?: SupplierProductRef;
  /** Größentabelle mit Maßen je Größe + "wie fällt aus"-Einordnung –
   *  wird als Popup über einen "Größenleitfaden"-Link geöffnet, nicht
   *  dauerhaft eingeblendet. */
  sizeGuide?: SizeGuide;
  /** Detaillierte Herstellerangaben (Material, Herkunft, Nachhaltigkeit
   *  etc.) – so wie sie vom Lieferanten mitgeliefert werden. */
  detailedDescription?: DetailedDescription;
  /** Lieferbarkeit – MANUELL gepflegt. Ohne Angabe gilt „lieferbar"; nur
   *  Ausnahmen werden hier eingetragen. Wird später von Lieferantendaten
   *  überschrieben, ohne dass sich die Architektur ändert – die Auflösung
   *  liegt zentral in `lib/catalog/verfuegbarkeit.ts`. */
  verfuegbarkeit?: Verfuegbarkeit;
  /** Aufnahmedatum in den Katalog (ISO, YYYY-MM-DD) – Grundlage der
   *  Sortierung „Neuheiten". Ohne Angabe gilt das Katalog-Startdatum. */
  aufgenommenAm?: string;
}

/** Lieferbarkeit eines Produkts.
 *
 *  `ausgelaufen` ist bewusst getrennt von `voruebergehend_nicht_lieferbar`:
 *  Ersteres ist endgültig und darf von einer späteren Lieferantenmeldung NICHT
 *  zurückgeholt werden (siehe Vorrangregel in verfuegbarkeit.ts). */
export type Verfuegbarkeit = 'lieferbar' | 'voruebergehend_nicht_lieferbar' | 'ausgelaufen';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tshirt: 'T-Shirt',
  longsleeve: 'Longsleeve',
  polo: 'Polo',
  hoodie: 'Hoodie',
  'zip-hoodie': 'Zip-Hoodie',
  sweater: 'Sweater',
  vest: 'Weste',
  jacket: 'Jacke',
};

export interface SizeGuide {
  /** z.B. [{ size: 'S', breiteCm: 49.5, hoeheCm: 70 }, ...] */
  measurements: { size: string; breiteCm: number; hoeheCm: number; aermelCm?: number }[];
  /** Position auf der "klein–normal–groß"-Skala, 0-100 (50 = normal) */
  fitRating: number;
}

export interface DetailedDescription {
  /** Lieferantenmarke, z.B. "B&C" (nicht die eigene Shop-Marke) */
  supplierBrand: string;
  productType: string;
  gender: string;
  sustainability: string;
  materialDetail: string;
  countryOfOrigin: string;
  /** Einzelne Stichpunkte aus dem Herstellerdatenblatt, z.B.
   *  "Piqué aus 100% ringgesponnener Bio-Baumwolle" */
  bulletPoints: string[];
}
