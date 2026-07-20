/**
 * Kern-Logik der Übersetzungsschicht: einzelne kanonische Werte (Farbe,
 * Größe, Artikelnummer) gegen eine SupplierVariantMap auflösen bzw. auf
 * Verfügbarkeit prüfen.
 *
 * Alle Funktionen sind rein (keine Nebenwirkungen, kein I/O) und arbeiten
 * ausschließlich auf der übergebenen Tabelle – dadurch trivial testbar.
 * Die "resolve*"-Varianten WERFEN bei fehlender/fehlerhafter Verfügbarkeit
 * (SupplierMappingError), die "isSupported*"-Varianten liefern nur einen
 * Wahrheitswert (für Vorab-Prüfungen ohne Kontrollfluss über Exceptions).
 *
 * Zwei Auflösungs-Tiefen, dieselbe Mechanik:
 *  - resolve*Variant  → vollständiger {@link SupplierVariant} (Label +
 *    etwaige stabile IDs); von der Automatisierung bevorzugt genutzt.
 *  - resolve*Label    → nur der sichtbare Text (String). BLEIBT für
 *    Abwärtskompatibilität bestehen und ist ein dünner Wrapper um
 *    resolve*Variant().label.
 *
 * Es findet BEWUSST kein Fuzzy-Matching statt: die Übersetzung muss
 * deterministisch und vorhersehbar sein, ein unbekannter Schlüssel ist ein
 * echter Konfigurationsfehler und soll auffallen.
 */
import { SupplierMappingError } from './SupplierMappingError';
import type { SupplierId } from '../types';
import type { SupplierVariant, SupplierVariantEntry, SupplierVariantMap } from './types';

type Dimension = 'color' | 'size';

/**
 * Liest einen EIGENEN (nicht geerbten) Eintrag aus einer Variantentabelle.
 * Bewusst über hasOwnProperty statt einfachem Zugriff: ein Lookup wie
 * `record["toString"]` würde sonst die geerbte Object.prototype-Funktion
 * treffen und fälschlich als "vorhandene Variante" gelten. Liefert
 * undefined, wenn der Schlüssel nicht als eigener Eintrag existiert.
 */
function ownEntry(
  record: Readonly<Record<string, SupplierVariantEntry>>,
  key: string
): SupplierVariantEntry | undefined {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Wandelt einen Tabellen-Eintrag in die einheitliche Vollform um. Die
 * Kurzform (String) wird zu `{ label }`; eine bestehende Vollform wird
 * flach kopiert, damit Aufrufer die Tabelle nicht versehentlich mutieren.
 */
export function normalizeVariant(entry: SupplierVariantEntry): SupplierVariant {
  return typeof entry === 'string' ? { label: entry } : { ...entry };
}

/**
 * Ergonomik-Hilfe zum Pflegen VERIFIZIERTER Einträge: markiert die Variante
 * als im Shop bestätigt (`verified: true`) und nimmt optional die stabilen
 * Kennungen auf. Beispiele:
 *   red:  verified('Red')
 *   navy: verified('Navy', { variantId: '2305' })   // in productOverrides
 * Ein Kurzform-String bleibt bewusst „unverifiziert" (Näherung) und taucht
 * im Abdeckungs-Report als noch zu prüfen auf.
 */
export function verified(label: string, extra: Omit<SupplierVariant, 'label' | 'verified'> = {}): SupplierVariant {
  return { label, verified: true, ...extra };
}

/**
 * Prüft eine Variante auf Eindeutigkeit/Gültigkeit. Ungültig ist ein
 * leeres Label oder ein deklariertes, aber leeres stabiles ID-Feld – beides
 * würde die Automatisierung zu einer mehrdeutigen/kaputten Auswahl
 * verleiten und löst daher (Fail-Fast) einen SupplierMappingError aus.
 */
function validateVariant(
  variant: SupplierVariant,
  ctx: { supplierId: SupplierId; value: string; productId?: string }
): void {
  const fail = (detail: string): never => {
    throw new SupplierMappingError({ reason: 'invalid-variant', detail, ...ctx });
  };
  if (isBlank(variant.label)) fail('leeres Label');
  if (variant.variantId !== undefined && isBlank(variant.variantId)) fail('leere variantId');
  if (variant.selectValue !== undefined && isBlank(variant.selectValue)) fail('leerer selectValue');
  if (variant.sku !== undefined && isBlank(variant.sku)) fail('leere sku');
}

/**
 * Löst einen Schlüssel gegen die per-Lieferant-Tabelle auf – mit VORRANG
 * für einen etwaigen produktspezifischen Override. Ohne Override greift
 * automatisch der Basis-Eintrag (label-basierte Lösung bleibt erhalten).
 */
function resolveEntry(
  base: Readonly<Record<string, SupplierVariantEntry>>,
  override: Readonly<Record<string, SupplierVariantEntry>> | undefined,
  key: string,
  dimension: Dimension,
  supplierId: SupplierId,
  productId?: string
): SupplierVariant {
  const overrideEntry = override ? ownEntry(override, key) : undefined;
  const entry = overrideEntry !== undefined ? overrideEntry : ownEntry(base, key);
  if (entry === undefined) {
    const reason = dimension === 'color' ? 'unknown-color' : 'unknown-size';
    throw new SupplierMappingError({ reason, supplierId, value: key, productId });
  }
  const variant = normalizeVariant(entry);
  validateVariant(variant, { supplierId, value: key, productId });
  return variant;
}

// ── Existenzprüfungen (werfen nicht) ───────────────────────────────────

/** true, wenn der Lieferant die interne Farbe FÜHRT (Schlüssel vorhanden).
 *  Prüft nur Existenz, nicht Gültigkeit – ein vorhandener, aber
 *  fehlerhafter Eintrag fällt erst beim Auflösen als 'invalid-variant' auf. */
export function isColorSupported(map: SupplierVariantMap, colorId: string): boolean {
  return ownEntry(map.colors, colorId) !== undefined;
}

/** true, wenn der Lieferant die interne Größe führt. */
export function isSizeSupported(map: SupplierVariantMap, size: string): boolean {
  return ownEntry(map.sizes, size) !== undefined;
}

// ── Vollständige Varianten-Auflösung (Label + stabile IDs) ──────────────

/**
 * Löst die vollständige Farb-Variante auf (Label + etwaige stabile IDs).
 * @throws SupplierMappingError ('unknown-color' | 'invalid-variant').
 */
export function resolveColorVariant(map: SupplierVariantMap, colorId: string, productId?: string): SupplierVariant {
  const override = productId ? map.productOverrides?.[productId]?.colors : undefined;
  return resolveEntry(map.colors, override, colorId, 'color', map.supplierId, productId);
}

/**
 * Löst die vollständige Größen-Variante auf (Label + etwaige stabile IDs).
 * @throws SupplierMappingError ('unknown-size' | 'invalid-variant').
 */
export function resolveSizeVariant(map: SupplierVariantMap, size: string, productId?: string): SupplierVariant {
  const override = productId ? map.productOverrides?.[productId]?.sizes : undefined;
  return resolveEntry(map.sizes, override, size, 'size', map.supplierId, productId);
}

// ── Nur-Label-Auflösung (Abwärtskompatibilität) ────────────────────────

/**
 * Übersetzt eine interne Farb-ID in die sichtbare Shop-Bezeichnung.
 * Unveränderte Signatur/Rückgabe – dünner Wrapper um resolveColorVariant.
 * @throws SupplierMappingError, wenn nicht verfügbar oder ungültig.
 */
export function resolveColorLabel(map: SupplierVariantMap, colorId: string, productId?: string): string {
  return resolveColorVariant(map, colorId, productId).label;
}

/**
 * Übersetzt eine interne Größe in die sichtbare Shop-Bezeichnung.
 * @throws SupplierMappingError, wenn nicht verfügbar oder ungültig.
 */
export function resolveSizeLabel(map: SupplierVariantMap, size: string, productId?: string): string {
  return resolveSizeVariant(map, size, productId).label;
}

/**
 * Liefert die beim Lieferanten gültige PRODUKT-Artikelnummer: ein Override
 * aus der Map (falls der Lieferant für dieses Produkt einen anderen
 * Schlüssel führt) oder – Standardfall – die mitgegebene Artikelnummer aus
 * der Bestellposition (supplierRefs). Wirft nicht: eine fehlende Override
 * ist kein Fehler, sondern der Normalfall.
 */
export function resolveArticleNumber(
  map: SupplierVariantMap,
  productId: string,
  fallbackArticleNumber: string
): string {
  return map.articleNumberByProduct?.[productId] ?? fallbackArticleNumber;
}
