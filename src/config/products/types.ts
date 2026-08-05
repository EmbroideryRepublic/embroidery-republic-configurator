import type { PrintView, PrintMethod, ProductType, QualityTier, ConfigElementType } from '@/types';

export interface ProductColorConfig {
  id: string;
  name: string;
  hex: string;
  // KEINE Bildpfade mehr (ADR 0004): die Produktdefinition kennt nur die
  // Farb-Identität; Bilder löst die Asset-Schicht über (productId, colorId, view)
  // aus dem Manifest auf (src/lib/assets, resolveColorImages).
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
  /** Größenleiter dieses Produkts (Verweis auf GROESSEN_LEITERN, groessen.ts).
   *  Ohne Angabe gilt die Leiter der Produktart (`PRODUCT_TYPES[type].groessenLeiter`),
   *  sonst die Konfektions-Standardleiter. Nur setzen, wenn ein Produkt von der
   *  Typ-Leiter abweicht (z.B. ein einzelnes Einheitsgrößen-Modell). */
  sizeScale?: string;
  colors: ProductColorConfig[];
  tagline: string;
  material: string;
  /** Flächengewicht in g/m². Optional: Für einzelne Lieferantenprodukte
   *  veröffentlicht die Quelle (textil-grosshandel.eu) keine Grammatur; dann
   *  bleibt das Feld leer (kein geschätzter Wert) und wird in der Oberfläche
   *  als „–" ausgewiesen. */
  weightGsm?: number;
  fit: string;
  description: string;
  certifications: string[];
  careInstructions: string;
  /**
   * Die vom Produkt geführten Druckansichten (View-IDs aus der zentralen
   * View-Registry, decorationPositions.ts) in fachlicher Reihenfolge – die
   * einzige produktseitige Quelle „welche Ansichten hat dieses Produkt".
   * Ohne Angabe leitet der Resolver `ansichtenVon()` sie aus den Druckflächen
   * des Produkts ab (Migrationspfad für den Bestand). Siehe
   * docs/adr/0001-generische-druckansichten.md.
   */
  views?: PrintView[];
  /** Link zum technischen Datenblatt des Herstellers (optional) */
  datasheetUrl?: string;
  // KEINE Bezugsquelle mehr auf dem Produkt (ADR 0004): die Beschaffungs-
  // beziehung (Lieferant/Artikelnummer/URL) liegt ausschließlich in der
  // Lieferantenschicht (lib/suppliers/supplierRefs.ts, Resolver supplierRefVon).
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
  /** Bildstatus. `'fehlt'` = für dieses Produkt liegen noch KEINE echten
   *  Fotos vor; alle Farben zeigen vorübergehend den neutralen Platzhalter
   *  (`platzhalterFarbSet()` in colorHelpers.ts). Die Farb-Swatches nutzen
   *  trotzdem den echten, aus der Lieferantenquelle verifizierten Hex. So
   *  lässt sich das Produkt vollständig pflegen und später gesammelt
   *  bebildern, ohne Platzhalter mit echten Fotos zu verwechseln. Ohne
   *  Angabe gilt „Fotos vorhanden". */
  bildStatus?: 'fehlt';

  // ── Produktfähigkeiten (Groundwork M2.5, wirksam ab M3+) ──────────────
  // Additiv/optional: Kein Laufzeit-Konsument liest diese Felder heute, das
  // Verhalten bleibt bytegleich. Sie geben Produktgruppen jenseits der
  // Kleidung (Taschen, Schürzen, Werbeartikel) einen Ort, um ihre fachlichen
  // Grenzen ZU DATEN zu machen, statt sie im Code zu verdrahten – Leitlinie
  // „je weniger Wissen im Code, je mehr in den Produktdefinitionen".
  // Auflösung/Defaults folgen zentral in M3; siehe docs/adr/0002-generisches-produktmodell.md.

  /** Erlaubte Veredelungsverfahren dieses Produkts. Ohne Angabe gelten ALLE
   *  bekannten Verfahren (heutiges Verhalten). Beispiel: eine wasserdichte
   *  Tasche kann Stickerei ausschließen und nur 'dtf' führen. */
  supportedMethods?: PrintMethod[];
  /** Erlaubte Personalisierungsarten (Logo, Text, künftig Namensliste …).
   *  Ohne Angabe gelten alle vom Konfigurator angebotenen Arten. */
  allowedPersonalizations?: ConfigElementType[];
  /** Produktspezifische Produktions-/Bestellregeln. Ohne Angabe gelten die
   *  globalen Defaults. */
  constraints?: ProductConstraints;
}

/** Produktspezifische Einschränkungen – bewusst schlank und rein additiv.
 *  Jedes Feld optional; fehlt es, gilt die globale Regel. Erweiterung erfolgt
 *  feldweise (kein „alles-oder-nichts"), damit neue Produktgruppen nur die für
 *  sie relevanten Grenzen setzen. */
export interface ProductConstraints {
  /** Mindestbestellmenge in Stück (z.B. Werbeartikel mit Staffel ab 50). */
  minOrderQuantity?: number;
  /** Höchstzahl Gestaltungselemente je Ansicht (Fläche/Produktionsgrenze). */
  maxElementsPerView?: number;
}

/** Lieferbarkeit eines Produkts.
 *
 *  `ausgelaufen` ist bewusst getrennt von `voruebergehend_nicht_lieferbar`:
 *  Ersteres ist endgültig und darf von einer späteren Lieferantenmeldung NICHT
 *  zurückgeholt werden (siehe Vorrangregel in verfuegbarkeit.ts). */
export type Verfuegbarkeit = 'lieferbar' | 'voruebergehend_nicht_lieferbar' | 'ausgelaufen';

/**
 * Produktart-Register, Reihenfolge und der Label-Resolver stammen aus dem
 * zentralen PRODUCT_TYPES-Register (./productTypes, ADR 0002 §1) und werden hier
 * re-exportiert, damit die bestehenden Importe aus '@/config/products/types'
 * unverändert funktionieren. `produktTypLabel()` ersetzt die frühere
 * `PRODUCT_TYPE_LABELS`-Map (eine Auflösungsstelle, robust zur offenen ID).
 */
export { PRODUCT_TYPE_ORDER, PRODUCT_TYPES, ALLE_PRODUCT_TYPES, produktTypLabel, produktTypLabelPlural } from './productTypes';
export type { ProductTypeDef, NaviAchse } from './productTypes';

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
