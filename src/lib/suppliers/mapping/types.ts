/**
 * ═══════════════════════════════════════════════════════════════════════
 * SUPPLIER MAPPING – Typen der Übersetzungsschicht
 * ═══════════════════════════════════════════════════════════════════════
 * Diese Schicht sitzt zwischen der EINHEITLICHEN internen Darstellung von
 * Embroidery Republic (unsere Farb-IDs wie "royal", unsere Größen wie "M",
 * unsere Katalog-Produkt-IDs) und den Bezeichnungen/Kennungen, die der
 * jeweilige Lieferanten-Shop tatsächlich verwendet.
 *
 * Grundprinzip: Intern arbeitet die Anwendung IMMER mit ihren eigenen
 * kanonischen Schlüsseln. Erst unmittelbar vor der Browser-Automatisierung
 * (im supplierWorker, an der Grenze zum Adapter) werden diese Werte über
 * die hier definierten Tabellen in die Lieferantenbezeichnung übersetzt.
 *
 * Bewusst abhängigkeitsfrei bis auf den SupplierId-Typ (kein Import aus
 * config/ oder Komponenten) – dadurch bleibt die Schicht ohne Datenbank
 * und ohne Next.js-Laufzeit testbar.
 */
import type { SupplierId } from '../types';

/**
 * Eine EINZELNE Lieferanten-Variante (Farbe, Größe – und mit demselben
 * Schema künftige Varianten-Dimensionen). Vereinheitlicht die Darstellung
 * aller Dimensionen: es gibt nur diesen einen Beschreibungstyp.
 *
 * `label` ist die im Shop sichtbare Bezeichnung und immer Pflicht – sie
 * dient als Fallback für die Automatisierung. Die übrigen Felder sind
 * STABILE Lieferantenkennungen, die – wenn vorhanden – von der
 * Playwright-Automatisierung bevorzugt verwendet werden (unabhängig davon,
 * ob der Shop den sichtbaren Text später umbenennt oder übersetzt):
 *  - variantId:  interne Varianten-ID des Shops (z.B. data-variant-id),
 *  - selectValue: value-Attribut einer <option> (Dropdown-Auswahl),
 *  - sku:        farb-/größenspezifische Artikelnummer der Variante.
 *
 * Alle Zusatzfelder sind optional → Abwärtskompatibilität: eine reine
 * Text-Variante bleibt gültig und funktioniert unverändert.
 */
export interface SupplierVariant {
  /** Im Shop sichtbare Bezeichnung (Pflicht, Fallback für die Automation). */
  label: string;
  /** Stabile interne Varianten-ID des Shops (bevorzugt vor `label`). */
  variantId?: string;
  /** value-Attribut einer Dropdown-Option, falls der Shop <select> nutzt. */
  selectValue?: string;
  /** Farb-/größenspezifische Artikelnummer (SKU) der konkreten Variante. */
  sku?: string;
  /**
   * true = die Werte dieser Variante wurden im realen Shop bestätigt. Rein
   * dokumentarisch für den Abdeckungs-Report (buildSupplierMappingCoverage);
   * die Auswahl-Engine ignoriert das Flag. Ein Kurzform-String-Eintrag bzw.
   * ein Objekt OHNE `verified: true` gilt als noch zu verifizierende
   * Näherung. Am bequemsten über die `verified()`-Hilfe gesetzt.
   */
  verified?: boolean;
}

/**
 * Tabellen-Eintrag EINER Variante: entweder die Kurzform (nur der sichtbare
 * Text als String) ODER die Vollform als {@link SupplierVariant}. Die
 * Kurzform ist exakt die bisherige Schreibweise – dadurch bleiben alle
 * bestehenden Tabellen unverändert gültig (`'Königsblau'` ≡
 * `{ label: 'Königsblau' }`). Neue Einträge können schrittweise auf die
 * Vollform mit stabilen IDs erweitert werden, ohne dass anderer Code
 * angepasst werden muss.
 */
export type SupplierVariantEntry = string | SupplierVariant;

/**
 * PRODUKTSPEZIFISCHE Varianten-Overrides. Einige Shops führen Kennungen, die
 * je Produkt abweichen – z.B. needens `data-color-id` (Navy = 2305 bei
 * GN182, = 343 bei GN647). Solche IDs gehören NICHT in die per-Lieferant-
 * Tabelle, sondern hier je Katalog-Produkt-ID.
 *
 * Auflösung mit Vorrang: existiert für (productId, colorId/size) ein
 * Override, wird er genutzt; sonst gilt automatisch der per-Lieferant-
 * Default aus `colors`/`sizes`. Dadurch bleibt die bestehende
 * label-basierte Lösung vollständig erhalten und greift, solange keine
 * verifizierten produktbezogenen IDs vorliegen – ohne Änderung an API oder
 * Adaptern.
 */
export interface ProductVariantOverride {
  colors?: Readonly<Record<string, SupplierVariantEntry>>;
  sizes?: Readonly<Record<string, SupplierVariantEntry>>;
}

/**
 * Eine Lieferanten-Variantentabelle: bildet unsere internen kanonischen
 * Schlüssel auf die Bezeichnungen/Kennungen ab, die der Shop des
 * Lieferanten kennt.
 *
 * WICHTIG – zugleich Existenz-Whitelist: Ein Schlüssel, der hier NICHT
 * steht, gilt als "beim Lieferanten nicht vorhanden". Genau diese
 * Eigenschaft nutzt die Validierung: fehlt eine angeforderte Farbe/Größe,
 * wird die Position nicht automatisiert bestellt, sondern ein klarer
 * Fehler erzeugt.
 *
 * `colors` und `sizes` verwenden dasselbe Eintrags-Schema
 * ({@link SupplierVariantEntry}); eine künftige weitere Varianten-Dimension
 * würde als weiteres `Readonly<Record<string, SupplierVariantEntry>>`
 * ergänzt und über denselben Resolver aufgelöst.
 */
export interface SupplierVariantMap {
  supplierId: SupplierId;
  /**
   * interne Farb-ID (z.B. "royal") → Shop-Variante. Kurzform (String) oder
   * Vollform mit stabilen IDs. Nur hier gelistete Farben gelten als lieferbar.
   */
  colors: Readonly<Record<string, SupplierVariantEntry>>;
  /**
   * interne Größe (z.B. "XXL") → Shop-Variante. Nur hier gelistete Größen
   * gelten als lieferbar.
   */
  sizes: Readonly<Record<string, SupplierVariantEntry>>;
  /**
   * OPTIONAL: abweichende PRODUKT-Artikelnummer je Katalog-Produkt-ID, falls
   * der Lieferant für ein Produkt einen anderen Schlüssel führt als in
   * supplierRefs hinterlegt. (Nicht zu verwechseln mit SupplierVariant.sku,
   * die farb-/größenspezifisch ist.) Fehlt der Eintrag, gilt die
   * Artikelnummer aus der Bestellposition.
   */
  articleNumberByProduct?: Readonly<Record<string, string>>;
  /**
   * OPTIONAL: produktspezifische Varianten-Overrides (Vorrang vor
   * colors/sizes). Für Shops, deren stabile IDs je Produkt abweichen
   * (z.B. needens data-color-id). Additiv – ohne Eintrag greift der
   * per-Lieferant-Default. Siehe {@link ProductVariantOverride}.
   */
  productOverrides?: Readonly<Record<string, ProductVariantOverride>>;
  /**
   * false = die Farb-/Größen-Labels UND etwaige stabile IDs sind eine
   * dokumentierte Näherung und müssen vor dem ERSTEN echten
   * Automatisierungslauf gegen den realen Shop abgeglichen werden (analog
   * zu SupplierProductRef.urlVerified). Die Existenzprüfung funktioniert in
   * beiden Fällen; das Flag betrifft nur die Korrektheit der Werte.
   */
  labelsVerified: boolean;
}

/**
 * Gründe, aus denen eine Variante NICHT eindeutig aufgelöst werden konnte.
 *  - unknown-color / unknown-size: Schlüssel fehlt in der Tabelle.
 *  - invalid-variant: Eintrag vorhanden, aber fehlerhaft (leeres Label oder
 *    ein deklariertes, aber leeres ID-Feld) – wird wie ein fehlender
 *    Eintrag behandelt (Fail-Fast), damit keine mehrdeutige/kaputte
 *    Auswahl automatisiert wird.
 */
export type SupplierMappingErrorReason = 'unknown-color' | 'unknown-size' | 'invalid-variant';

/** Eine einzelne, bereits in die Lieferantenbezeichnung übersetzte Größe.
 *  Form BEWUSST unverändert gegenüber der Erstfassung (Abwärtskompatibilität);
 *  die vollständige Variante inkl. stabiler IDs liegt in
 *  ResolvedSupplierPosition.sizeVariants. */
export interface ResolvedSupplierSize {
  /** Unsere interne Größe (für Logging/Rückverfolgung). */
  size: string;
  /** Größen-LABEL im Lieferanten-Shop (= sizeVariant.label). */
  supplierSize: string;
  quantity: number;
}

/**
 * Eine vollständig in Lieferantenbezeichnungen übersetzte Bestellposition –
 * genau das, was der Adapter unmittelbar vor dem Anklicken der
 * Shop-Varianten braucht. Enthält weiterhin die internen IDs, damit Logs
 * und Fehlermeldungen rückverfolgbar bleiben.
 *
 * Abwärtskompatibel erweitert: `supplierColor` (Label) und `sizes` bleiben
 * unverändert bestehen; die reichhaltigen Deskriptoren mit stabilen IDs
 * kommen ADDITIV in `colorVariant` und `sizeVariants` hinzu.
 */
export interface ResolvedSupplierPosition {
  supplierId: SupplierId;
  productId: string;
  productName: string;
  /** Finale Artikelnummer (Override aus der Map oder Wert aus der Position). */
  articleNumber: string;
  productUrl: string;
  colorId: string;
  /** Unser interner Farb-Anzeigename (Rückverfolgung). */
  colorName: string;
  /** Farb-LABEL im Lieferanten-Shop (= colorVariant.label) – unverändert. */
  supplierColor: string;
  /** Vollständige Farb-Variante inkl. etwaiger stabiler IDs (NEU). */
  colorVariant: SupplierVariant;
  /** Größen im Label-Format (unverändert). */
  sizes: ResolvedSupplierSize[];
  /** interne Größe → vollständige Größen-Variante inkl. stabiler IDs (NEU). */
  sizeVariants: Readonly<Record<string, SupplierVariant>>;
}
