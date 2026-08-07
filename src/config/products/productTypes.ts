/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZENTRALES PRODUKTART-REGISTER (PRODUCT_TYPES)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Einzige Quelle der Wahrheit für ALLES, was pro Produktart (ProductType)
 * gilt: Anzeigename (Ein-/Mehrzahl), Reihenfolge, repräsentative Ansicht,
 * Navigationsachse und Größenleiter. Vorher lagen dieselben Fakten verstreut
 * und teils dupliziert (PRODUCT_TYPE_LABELS, dreifaches Reihenfolge-Literal,
 * KOMPLEMENT/KACHELFARBE/KATEGORIE_TEXT, „Bühne = Hoodie"). Siehe
 * docs/adr/0002-generisches-produktmodell.md §1.
 *
 * ── Datengetrieben, Kernlogik unberührt ───────────────────────────────
 * Eine neue Produktgruppe (Tasche, Schürze, Cap …) entsteht durch EINEN Eintrag
 * hier – ohne Eingriff in Navigation, Größenlogik oder Filter. `ProductType`
 * ist eine OFFENE ID (analog PrintView, ADR 0001); dieses Register ist die
 * EINZIGE Quelle der gültigen Arten. Die verlorene Compiler-Vollständigkeit
 * ersetzen Wächter-Tests (config/products/__tests__/productTypes.test.ts): jede
 * von einem Produkt oder über `komplement` genutzte Art MUSS hier stehen.
 *
 * ── Bestandswerte = heutiges Verhalten ────────────────────────────────
 * Alle acht Bestands-Kleidungsarten tragen die Werte, die den bisherigen,
 * fest verdrahteten Ablauf 1:1 abbilden (`primaryView:'front'`,
 * `naviAchse:'geschlecht'`, `groessenLeiter:'konfektion-eu'`). Der abgeleitete
 * `PRODUCT_TYPE_ORDER` und der Label-Resolver `produktTypLabel()` bleiben dadurch
 * byte-identisch zum früheren Verhalten.
 */
import type { ProductType, PrintView } from '@/types';

/** Primäre Navigationsachse einer Produktgruppe (steuert künftig `baueBaum`,
 *  löst H1): 'geschlecht' (Herren/Damen/Unisex, heutiges Kleidungsverhalten),
 *  'anlass', 'einheit' (keine weitere Achse – Produkte direkt) … Offen, damit
 *  neue Gruppen eigene Achsen mitbringen. */
export type NaviAchse = 'geschlecht' | 'anlass' | 'einheit' | (string & {});

export interface ProductTypeDef {
  /** Anzeigename Einzahl, z.B. „T-Shirt". */
  labelSingular: string;
  /** Anzeigename Mehrzahl, z.B. „T-Shirts" – ersetzt das naive `'{Label}s'`
   *  (das aus „Jacke"/„Weste" falsch „Jackes"/„Westes" machte). */
  labelPlural: string;
  /** Fachliche Reihenfolge – häufigste Anfrage zuerst. Eindeutig je Register. */
  order: number;
  /** Repräsentative Ansicht für Kachel-/Vorschaubilder (statt fix `front`). */
  primaryView: PrintView;
  /** Primäre Navigationsachse im Produktbrowser (löst H1 in M3.3). */
  naviAchse: NaviAchse;
  /** Verweis auf die Größenleiter (GROESSEN_LEITERN, M3.4 – löst H2). Bestand:
   *  Konfektionsgrößen. */
  groessenLeiter: string;
  /** Komplementäre Arten für die „Passt dazu"-Empfehlung (Cross-Selling).
   *  Pflicht, ggf. leer – bewusste, nachvollziehbare Zuordnung statt geratener
   *  Ähnlichkeit. */
  komplement: ProductType[];
  /** Wunsch-Farbfamilien der Startseiten-Kachel (erste vorhandene gewinnt;
   *  Fallback = erste Katalogfarbe). Leer = keine Vorgabe. */
  kachelFarbe: string[];
  /** Kurzcharakterisierung auf der Startseiten-Kachel. */
  kachelText: string;
  /** Diese Art trägt die Startseiten-Bühne (großer Aufmacher). Höchstens eine.
   *  Ohne Angabe: keine Bühne. */
  hero?: boolean;
  /** Freigestelltes Bühnenbild (nur sinnvoll mit hero). */
  heroBild?: string;
  /** Alternativtext des Bühnenbilds (Barrierefreiheit). */
  heroAlt?: string;
}

/**
 * Das Register. Reihenfolge der Einträge entspricht `order` (Lesbarkeit); die
 * Konsumenten greifen ausschließlich per Schlüssel zu, nie über die Reihenfolge.
 */
export const PRODUCT_TYPES: Record<ProductType, ProductTypeDef> = {
  tshirt: {
    labelSingular: 'T-Shirt', labelPlural: 'T-Shirts', order: 1, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['hoodie', 'polo', 'sweater'], kachelFarbe: ['rot'], kachelText: 'Klassisch, bequem, vielseitig.',
  },
  polo: {
    labelSingular: 'Polo', labelPlural: 'Polos', order: 2, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['tshirt', 'sweater', 'jacket'], kachelFarbe: ['blau'], kachelText: 'Sportlich, elegant, hochwertig.',
  },
  hoodie: {
    labelSingular: 'Hoodie', labelPlural: 'Hoodies', order: 3, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['tshirt', 'zip-hoodie', 'sweater'], kachelFarbe: ['grau'], kachelText: 'Bequem, warm, ein echter Klassiker.',
    hero: true, heroBild: '/buehne/hoodie.png', heroAlt: 'Hoodie aus dem Sortiment, bereit zur Veredelung',
  },
  'zip-hoodie': {
    labelSingular: 'Zip-Hoodie', labelPlural: 'Zip-Hoodies', order: 4, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['hoodie', 'tshirt', 'jacket'], kachelFarbe: ['schwarz'], kachelText: 'Praktisch, modern, lässig.',
  },
  sweater: {
    labelSingular: 'Sweater', labelPlural: 'Sweater', order: 5, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['tshirt', 'hoodie', 'longsleeve'], kachelFarbe: ['gruen'], kachelText: 'Wärmend, hochwertig, zeitlos.',
  },
  longsleeve: {
    labelSingular: 'Longsleeve', labelPlural: 'Longsleeves', order: 6, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['tshirt', 'hoodie', 'sweater'], kachelFarbe: ['weiss'], kachelText: 'Ideal zum Layern, stark im Look.',
  },
  jacket: {
    labelSingular: 'Jacke', labelPlural: 'Jacken', order: 7, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['hoodie', 'sweater', 'vest'], kachelFarbe: ['blau'], kachelText: 'Schützt, hält warm, macht Eindruck.',
  },
  // Bewusst vorbereitete Kategorie ohne Bestandsprodukt: Register-Eintrag,
  // Größenleiter und Kachel stehen bereit, aber im Katalog gibt es aktuell
  // kein Produkt mit `productType:'vest'`. Kein Versehen – taucht deshalb in
  // keiner Kategorieliste auf, bis ein erstes Produkt hinzukommt.
  vest: {
    labelSingular: 'Weste', labelPlural: 'Westen', order: 8, primaryView: 'front',
    naviAchse: 'geschlecht', groessenLeiter: 'konfektion-eu',
    komplement: ['tshirt', 'jacket', 'hoodie'], kachelFarbe: ['rot'], kachelText: 'Leicht, sportlich, das gewisse Etwas.',
  },
};

/** Alle bekannten Produktart-IDs (Schlüssel des Registers). */
export const ALLE_PRODUCT_TYPES = Object.keys(PRODUCT_TYPES) as ProductType[];

/**
 * Anzeigename (Einzahl) einer Produktart – die EINZIGE Auflösungsstelle.
 * Unbekannte Art → die rohe ID als defensiver Fallback (Muster wie
 * `positionLabel()`); die Wächter-Tests verhindern unbekannte Arten im Bestand.
 * Ersetzt die frühere `PRODUCT_TYPE_LABELS`-Tabelle: eine Funktion statt Map +
 * Streu-Lookup, und robust gegenüber der jetzt offenen `ProductType`-ID.
 */
export function produktTypLabel(type: ProductType): string {
  return PRODUCT_TYPES[type]?.labelSingular ?? type;
}

/**
 * Anzeigename (Mehrzahl) einer Produktart – die EINZIGE Auflösungsstelle für
 * Plurale. Ersetzt das frühere naive `'{Label}s'`, das aus „Jacke"/„Weste"
 * falsch „Jackes"/„Westes" machte (deutsche Plurale folgen keiner Anhängeregel).
 * Unbekannte Art → die rohe ID als defensiver Fallback.
 */
export function produktTypLabelPlural(type: ProductType): string {
  return PRODUCT_TYPES[type]?.labelPlural ?? type;
}

/**
 * Fachliche Reihenfolge der Produktarten – abgeleitet aus `order`. Ersetzt das
 * vormals dreifach duplizierte Literal (produktbaum `ARTFOLGE`, Startseiten-
 * Kacheln, `KategorieReiter`). `readonly`, weil alle Konsumenten nur lesen.
 */
export const PRODUCT_TYPE_ORDER: readonly ProductType[] = Object.entries(PRODUCT_TYPES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([id]) => id);
