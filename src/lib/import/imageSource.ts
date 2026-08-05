/**
 * Der **einzige Vertrag**, den ein Bild-Quellen-Adapter (Hersteller, needen, …)
 * erfüllen muss (ADR 0006, „Mehrquellen-Bildpipeline").
 *
 * Ein Adapter liefert für ein Produkt **nur Bild-Referenzen** (Roh-URLs +
 * Provenienz) – er lädt/verarbeitet NICHTS. Alles danach – Download,
 * Normalisierung, webp/png, Content-Hash-Versionierung, Merge/Priorität,
 * Manifest, Validierung, Report – läuft **zentral und identisch für ALLE**
 * Quellen (`mediaMerge.ts` + die Pipeline). Ein neuer Hersteller = ein Adapter,
 * der dieses Interface erfüllt, plus sein Farb-/Produkt-Mapping.
 *
 * Grundsatz „nichts erfinden": Nur der Hersteller/die Quelle liefert Bilder. Wo
 * keine Quelle ein Bild führt, bleibt der Platzhalter – nie ein künstliches Bild.
 */

/** Medienrolle eines Assets – offene ID (künftige Medien additiv, ADR 0004 §6). */
export type AssetRolle =
  | 'ansicht-flach' // reguläres Produktfoto einer Ansicht (front/back/sleeve/side …)
  | 'freisteller' // freigestelltes Packshot
  | 'detail' // Detailaufnahme (Naht, Label, Material)
  | 'mockup' // Mockup/Vorlage
  | 'stickvorschau'
  | 'druckvorschau'
  | 'lifestyle' // getragen/inszeniert
  | 'video'
  | 'ansicht-360'
  | (string & {});

/**
 * Wie sicher die Ansicht (front/back/sleeve/side) einer Referenz ist.
 * `gelabelt`  – die Quelle benennt die Ansicht eindeutig (PIM-Label, CSS-Klasse …).
 * `inferiert` – nur aus Reihenfolge/Heuristik geraten.
 * WÄCHTER-Regel (mediaMerge): eine NICHT-repräsentative Ansicht (back/side/sleeve)
 * mit `inferiert` wird VERWORFEN – eine blanke Rück-/Seitenansicht lässt sich ohne
 * Label nicht von der Vorderseite unterscheiden; lieber Platzhalter als falsch.
 */
export type ViewKonfidenz = 'gelabelt' | 'inferiert';

/**
 * Herkunft eines Assets.
 * `original`  – echtes Herstellerfoto (immer bevorzugt).
 * `generiert` – hochwertige Visualisierung als LETZTER Fallback (z. B. eine
 *               Rückansicht, die nachweislich bei KEINER offiziellen Quelle
 *               existiert). Ersetzt NIE ein Original, ist intern eindeutig
 *               gekennzeichnet und wird automatisch durch ein echtes Foto
 *               ersetzt, sobald eines verfügbar wird. In externen Ausgaben
 *               (SEO/JSON-LD/OpenGraph) wird `generiert` wie ein Platzhalter
 *               ausgefiltert – nie als echtes Produktfoto veröffentlicht.
 */
export type AssetHerkunft = 'original' | 'generiert';

/** Eine einzelne Bild-Referenz, wie ein Adapter sie liefert (nur Rohdaten). */
export interface BildReferenz {
  /** Auf die Produktfarbe gemappte ID (der Adapter/das Mapping löst Herstellerfarbe → colorId auf). */
  colorId: string;
  /** Ansichts-/View-ID (front | back | sleeve_left | sleeve_right | side | detail-1 …). */
  view: string;
  /** Sicherheit der Ansichts-Zuordnung – steuert den Wächter in `mergeBildReferenzen`. */
  viewKonfidenz: ViewKonfidenz;
  /** Medienrolle (Default `ansicht-flach`). */
  rolle: AssetRolle;
  /** Herkunft – `original` schlägt `generiert` IMMER (mediaMerge). */
  herkunft: AssetHerkunft;
  /** Bildquelle in HÖCHSTER verfügbarer Auflösung. */
  quellUrl: string;
  /** Provenienz-Label (z. B. `gildan.eu`, `needen.de`, `generiert:<verfahren>`). */
  quelle: string;
  /** Priorität unter GLEICHER Herkunft: KLEINER = Vorrang (Hersteller < needen < …). */
  prioritaet: number;
}

/**
 * Ein Bild-Quellen-Adapter. Reine Datenbeschaffung – kein Download, keine
 * Verarbeitung (das ist Sache der zentralen Pipeline).
 */
export interface ImageSource {
  /** Provenienz-Label dieser Quelle. */
  quelle: string;
  /** Standard-Priorität dieser Quelle (Hersteller < Fallback). */
  prioritaet: number;
  /**
   * Alle verfügbaren Bild-Referenzen eines Produkts. Der Adapter kennt das
   * Produkt nur über fachliche Eckdaten (ID, Artikelnummer, Marke, Farben) –
   * nie über Bildpfade der Produktdefinition (ADR 0004).
   */
  bilderFuer(produkt: ImportProduktRef): Promise<BildReferenz[]>;
}

/** Fachliche Eckdaten eines Produkts, die einem Bild-Adapter übergeben werden. */
export interface ImportProduktRef {
  id: string;
  artNr?: string;
  brand: string;
  colors: { id: string; name: string; hex: string }[];
}
