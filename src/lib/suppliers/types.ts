/**
 * ═══════════════════════════════════════════════════════════════════════
 * SUPPLIER ENGINE – zentrale Domänen-Typen
 * ═══════════════════════════════════════════════════════════════════════
 * Diese Datei ist das "Vokabular" der gesamten Lieferanten-Automatisierung
 * und bewusst abhängigkeitsfrei (importiert NICHTS aus config/, actions/
 * oder Komponenten) – dadurch können Produktkatalog, Bestell-Services,
 * Adapter und der spätere Playwright-Worker sie alle gefahrlos importieren,
 * ohne Zyklen zu erzeugen.
 *
 * Erweiterung um einen neuen Lieferanten:
 *   1. SupplierId-Union unten ergänzen (z.B. | 'ralawise').
 *   2. Adapter-Klasse unter adapters/ anlegen (Interface SupplierAdapter).
 *   3. Eintrag in registry.ts ergänzen (Record ist über SupplierId
 *      vollständig typisiert – ein vergessener Eintrag ist ein
 *      Compile-Fehler, kein stiller Laufzeitfehler).
 */

/** Alle bekannten Lieferanten. Bewusst eine geschlossene Union statt
 *  freiem String: Registry und Worker sind darüber VOLLSTÄNDIG
 *  typgeprüft – ein Tippfehler wie 'wordan' fällt beim Kompilieren auf. */
export type SupplierId = 'textil-grosshandel' | 'wordans' | 'needen' | 'ralawise';

/**
 * Lieferanten-Referenz EINES Katalogprodukts – hängt als optionales Feld
 * an ProductConfig (src/config/products/types.ts) und wird zentral in
 * src/config/products/supplierRefs.ts gepflegt (eine Datei statt über
 * 9 Marken-Dateien verstreut; später 1:1 in eine DB-Tabelle überführbar).
 */
export interface SupplierProductRef {
  supplierId: SupplierId;
  /** Artikelnummer beim Lieferanten (z.B. "G5000", "JH001", "Z108M"). */
  articleNumber: string;
  /** Direkte Produkt-Detail-URL beim Lieferanten – der Worker öffnet sie
   *  ohne Suche. */
  productUrl: string;
  /** true = URL wurde von uns per HTTP-Check bestätigt (Status 200);
   *  false/undefined = aus dem URL-Schema des Shops konstruiert und vor
   *  dem ersten Automatisierungslauf manuell zu prüfen. */
  urlVerified?: boolean;
}

/** Eine Größe/Menge-Zeile innerhalb einer Lieferantenposition. */
export interface SupplierSizeQuantity {
  size: string;
  quantity: number;
}

/**
 * EINE Bestellposition beim Lieferanten: genau ein Produkt in genau einer
 * Farbe mit seiner Größenverteilung. Enthält bewusst ALLES, was der
 * Playwright-Worker braucht (URL, Artikelnummer, Farbnamen) – der Worker
 * soll den Produktkatalog NICHT selbst laden müssen (er läuft später ggf.
 * als separater Prozess außerhalb von Next.js).
 */
export interface SupplierOrderPosition {
  supplierId: SupplierId;
  /** Unsere Katalog-Produkt-ID (z.B. "gildan-heavy-t") – für Rückverfolgung. */
  productId: string;
  productName: string;
  articleNumber: string;
  productUrl: string;
  /** Unsere Farb-ID (z.B. "royal") – für Rückverfolgung. */
  colorId: string;
  /** Anzeigename der Farbe (z.B. "Royal") – der Adapter nutzt ihn, um im
   *  Lieferanten-Shop die passende Farbvariante anzuklicken. Falls der
   *  Lieferant andere Farbnamen verwendet, übersetzt der jeweilige
   *  Adapter (NICHT dieser Datensatz). */
  colorName: string;
  sizes: SupplierSizeQuantity[];
}

/** Position, die keinem Lieferanten zugeordnet werden konnte (Produkt hat
 *  keinen supplierRefs-Eintrag) – wird dem Admin angezeigt statt still
 *  verschluckt. */
export interface UnresolvedSupplierPosition {
  productId: string;
  productName: string;
  colorId: string;
  reason: 'no_supplier_ref';
}

/**
 * Ergebnis von buildSupplierPositions(): alle Positionen einer Bestellung,
 * nach Lieferant gruppiert (eine Bestellung kann Produkte mehrerer
 * Lieferanten enthalten → ergibt mehrere getrennte Automatisierungs-Jobs).
 */
export interface SupplierOrderDraft {
  orderId: string;
  positionsBySupplier: Partial<Record<SupplierId, SupplierOrderPosition[]>>;
  unresolved: UnresolvedSupplierPosition[];
}

/** Was der Worker am Ende tun soll: nur den Warenkorb füllen (Standard –
 *  der Admin prüft und schließt selbst ab) oder bis zum Checkout gehen. */
export type SupplierJobMode = 'prepare-cart' | 'checkout';

/**
 * EIN Automatisierungs-Job = ein Lieferant + alle seine Positionen einer
 * Bestellung. Genau dieses Objekt wird später (serialisiert) an den
 * Playwright-Worker übergeben – deshalb nur JSON-fähige Werte.
 */
export interface SupplierAutomationJob {
  /** Eindeutige Job-ID (für Logs/Status), Format "orderId:supplierId". */
  jobId: string;
  orderId: string;
  orderNumber: string;
  supplierId: SupplierId;
  mode: SupplierJobMode;
  positions: SupplierOrderPosition[];
}

// ---------------------------------------------------------------------
// Worker-/Adapter-Laufzeit-Typen
// ---------------------------------------------------------------------

/**
 * PLATZHALTER für die spätere Playwright-Seite. Bewusst ein eigener,
 * minimaler struktureller Typ statt `import type { Page } from
 * 'playwright'`: Playwright ist noch NICHT installiert, und die Adapter
 * sollen trotzdem vollständig kompilieren. Playwrights echte `Page`
 * erfüllt diese Signaturen strukturell – bei der Integration wird hier
 * nur der Import getauscht (`export type AutomationPage = Page`), alle
 * Adapter bleiben unverändert.
 */
export interface AutomationPage {
  goto(url: string): Promise<unknown>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  /** Setzt eine Checkbox/Radio-Option (z.B. Farb-Radio bei needen). */
  check(selector: string): Promise<void>;
  /** Wählt eine <option> in einem <select> (value-basiert). */
  selectOption(selector: string, value: string): Promise<unknown>;
  /** Wartet auf ein Element in einem bestimmten Zustand. Die optionalen
   *  Optionen entsprechen Playwrights Signatur (state/timeout) – so bleibt
   *  Playwrights echte `Page` strukturell kompatibel. `state: 'detached'`
   *  wartet z.B. darauf, dass ein Element VERSCHWINDET (Login-Trigger nach
   *  erfolgreicher Anmeldung). */
  waitForSelector(
    selector: string,
    options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }
  ): Promise<unknown>;
  /** Optional (nur die echte Playwright-Page): führt eine Funktion im
   *  Seitenkontext aus. Wird für NICHT-FATALE Zusatzaktionen genutzt (z.B.
   *  Entfernen von Cookie-Consent-Overlays oder ein Sichtbarkeits-Fallback-
   *  Klick auf 0×0-Karussell-Elemente). Test-Fakes dürfen es weglassen – die
   *  Aufrufer prüfen `if (page.evaluate)`. Struktur-kompatibel zu Playwrights
   *  `Page.evaluate` (mit und ohne Argument). */
  evaluate?: {
    <R>(pageFunction: () => R): Promise<R>;
    <R, A>(pageFunction: (arg: A) => R, arg: A): Promise<R>;
  };
  /** Optional (nur die echte Playwright-Page): löst einen ECHTEN Tastendruck
   *  auf einem Element aus. Notwendig, weil `fill()` den Wert zwar setzt, aber
   *  KEINE Tastatur-Ereignisse erzeugt – manche Shops (textil-grosshandel)
   *  schalten ihre „In den Warenkorb"-Schaltfläche aber genau darauf frei.
   *  Test-Fakes dürfen es weglassen; Aufrufer prüfen `if (page.press)`. */
  press?(selector: string, key: string): Promise<void>;
}

/** Zugangsdaten eines Lieferanten-Kontos. Werden NIE hart kodiert –
 *  die Registry benennt pro Lieferant die env-Variablen, aus denen sie
 *  zur Laufzeit gelesen werden. */
export interface SupplierCredentials {
  username: string;
  password: string;
}

/** Laufzeit-Kontext, den der Worker jedem Adapter übergibt. */
export interface SupplierAutomationContext {
  page: AutomationPage;
  credentials: SupplierCredentials;
  /** Basis-URL des Lieferanten-Shops (aus der Registry). Startpunkt des
   *  Logins, wenn der Login-Plan keine eigene absolute loginUrl vorgibt –
   *  und der Injektionspunkt, über den E2E-Dry-Run-Tests statt der echten
   *  Shop-Seite eine Fixture ansteuern. */
  baseUrl: string;
  /** Strukturierte Log-Senke (Worker sammelt daraus das Schrittprotokoll). */
  log: (message: string) => void;
}

/** Die im Worker-Ablauf protokollierten Schritte (siehe supplierWorker.ts). */
export type SupplierWorkerStepName =
  | 'resolveVariants'
  | 'login'
  | 'openProduct'
  | 'selectColor'
  | 'setQuantity'
  | 'addToCart'
  /** Belegt NACH allen Positionen, dass der Warenkorb beim Lieferanten
   *  tatsächlich liegt und die Sitzung überdauert. */
  | 'confirmCart'
  | 'checkout';

export interface SupplierWorkerStepResult {
  step: SupplierWorkerStepName;
  /** Position, auf die sich der Schritt bezieht (login/checkout: keine). */
  positionIndex?: number;
  size?: string;
  /** Gesetzte Stückzahl – nur bei setQuantity. Ohne diese Angabe lässt sich
   *  im Nachhinein NICHT belegen, welche Menge beim Lieferanten hinterlegt
   *  wurde (bei einer Reklamation die entscheidende Frage). */
  quantity?: number;
  status: 'ok' | 'failed' | 'not_implemented';
  error?: string;
  /** Zeitpunkt, zu dem der Schritt endete (ISO 8601). */
  at: string;
  /** Dauer des Schrittes in Millisekunden – macht Ausreißer (z.B. ein in
   *  einen Timeout laufender Klick) ohne Zusatzwerkzeug sichtbar. */
  durationMs: number;
  /** Welche Selektionsmethode die Browser-Auswahl tatsächlich genutzt hat
   *  (nur bei selectColor/setQuantity gesetzt) – für die spätere
   *  Fehleranalyse: variant-id/select-value/sku vs. Label-Fallback. */
  selection?: { strategy: 'variant-id' | 'select-value' | 'sku' | 'label'; value: string };
}

/**
 * Was für EINE Position tatsächlich beim Lieferanten hinterlegt wurde –
 * bewusst als eigenständiger Schnappschuss im Lauf gespeichert und nicht
 * nur als Verweis auf die Bestellung: Katalog, Mapping-Tabellen und Preise
 * ändern sich, das Audit muss aber auch in einem Jahr noch beweisen, WAS
 * damals bestellt wurde.
 */
export interface SupplierRunPositionSummary {
  positionIndex: number;
  productId: string;
  productName: string;
  /** Artikelnummer NACH Mapping (kann lieferantenspezifisch abweichen). */
  articleNumber: string;
  productUrl?: string;
  /** Unsere interne Farbbezeichnung … */
  colorId: string;
  colorName: string;
  /** … und die Entsprechung im Shop des Lieferanten. */
  supplierColor: string;
  /** Stabile Varianten-ID der Farbe im Shop (bei textil-grosshandel der
   *  Hex-Schlüssel des Swatches), sofern gepflegt. */
  colorVariantId?: string;
  /** VOLLSTÄNDIGE Größenverteilung der Position – auch die Größen, deren
   *  Schritt fehlschlug. */
  sizes: {
    size: string;
    supplierSize: string;
    supplierSizeVariantId?: string;
    quantity: number;
  }[];
  /** Summe aller Stückzahlen dieser Position. */
  totalQuantity: number;
}

export interface SupplierWorkerRunResult {
  jobId: string;
  supplierId: SupplierId;
  /** Anzeigename des Lieferanten aus der Registry – damit das Audit auch
   *  lesbar bleibt, wenn eine Lieferanten-ID später umbenannt wird. */
  supplierName: string;
  /** Betriebsart des Laufs. Im Audit festgehalten, weil sie den Unterschied
   *  zwischen „nur Warenkorb befüllt" und „Bestellung ausgelöst" markiert. */
  mode: SupplierJobMode;
  startedAt: string;
  finishedAt: string;
  /** Gesamtdauer des Laufs in Millisekunden. */
  durationMs: number;
  /** 'prepared' = alle Schritte ok; 'partial' = einzelne Schritte
   *  fehlgeschlagen; 'not_implemented' = Adapter ist noch ein Stub. */
  outcome: 'prepared' | 'partial' | 'not_implemented' | 'failed';
  /** Was je Position beim Lieferanten hinterlegt wurde. */
  positions: SupplierRunPositionSummary[];
  steps: SupplierWorkerStepResult[];
  /** Protokollzeilen der Adapter (Consent, Layout-Eingriffe, Selektionen).
   *  Wurden zuvor gesammelt, aber nie zurückgegeben – das Audit blieb
   *  dadurch stumm. */
  logs: string[];
}

/** Fehlerklasse für die bewusst noch leeren Adapter-Methoden – der Worker
 *  erkennt sie und protokolliert 'not_implemented' statt 'failed'. */
export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} ist noch nicht implementiert (Architektur-Stub).`);
    this.name = 'NotImplementedError';
  }
}
