/**
 * ═══════════════════════════════════════════════════════════════════════
 * DER RECHNUNGS-PORT – die einzige Schnittstelle zu einem Rechnungssystem
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach exakt demselben Muster wie `lib/payments/types.ts`: Der Bestellprozess
 * kennt ausschließlich die Begriffe dieser Datei, nie Lexware oder ein
 * anderes Buchhaltungswerkzeug. Ein Architekturtest sichert das ab (siehe
 * __tests__/architektur.test.ts, Spiegel von
 * lib/payments/__tests__/architektur.test.ts).
 *
 * ── Warum kein eigenes Rechnungsnummernsystem ──────────────────────────
 * Lexware Office ist das führende Rechnungssystem (Geschäftsentscheidung).
 * Die Rechnungsnummer wird AUSSCHLIESSLICH von dort vergeben (§ 14 Abs. 4
 * Nr. 4 UStG verlangt eine eindeutige, üblicherweise lückenlose Nummer) –
 * `Rechnungserstellung.rechnungsnummer` ist deshalb ein Ergebnis, kein
 * Eingabewert.
 */

/** Verfügbare Rechnungsanbieter. Geschlossener Union-Typ wie bei den
 *  Zahlungsanbietern – eine vergessene Verdrahtung wird zum Übersetzungs-
 *  statt zum Laufzeitfehler. */
export type RechnungsAnbieterId = 'test' | 'lexware';

/** Eine Rechnungsposition. */
export interface Rechnungsposition {
  bezeichnung: string;
  menge: number;
  /** Bruttoeinzelpreis in ganzen Cent (Preise sind hier wie überall im
   *  Projekt brutto, siehe orders.prices_include_tax). */
  einzelpreisBruttoCent: number;
  /** Steuersatz in Prozent, z.B. 19. */
  steuersatzProzent: number;
}

/** Was der Rechnungsanbieter braucht, um eine Rechnung zu erstellen. */
export interface Rechnungsauftrag {
  bestellId: string;
  /** Für die Kundschaft lesbar, z.B. „ER-2026-1A2B3C" – erscheint als
   *  Bezugsangabe auf der Rechnung, ist aber NICHT die Rechnungsnummer. */
  bestellnummer: string;
  /** ISO-Datum (yyyy-mm-dd), an dem die Rechnung ausgestellt wird. */
  rechnungsdatum: string;
  kaeufer: {
    name: string;
    firma?: string;
    strasse: string;
    plz: string;
    ort: string;
    land: string;
    /** USt-IdNr. der Käuferschaft, sofern hinterlegt (orders.customer_vat_id). */
    ustIdNr?: string;
  };
  positionen: Rechnungsposition[];
  /** Versandkosten in ganzen Cent, brutto. 0 = versandkostenfrei. */
  versandkostenBruttoCent: number;
  gesamtBruttoCent: number;
  waehrung: 'EUR';
  /**
   * Zahlungsziel in Tagen ab Rechnungsdatum. `0` bedeutet: bereits bezahlt
   * (Karte/PayPal – die Rechnung dokumentiert eine abgeschlossene Zahlung).
   * Bei Rechnungskauf der reguläre Wert aus `config/company.ts`
   * (PAYMENT_TERM_DAYS).
   */
  zahlungszielTage: number;
}

/** Was nach der Rechnungserstellung zurückkommt. */
export interface Rechnungserstellung {
  /** ID des Belegs beim Anbieter, für spätere Nachschlagen. */
  rechnungsId: string;
  /** Vom Anbieter vergebene, fortlaufende Rechnungsnummer. */
  rechnungsnummer: string;
  /** Das tatsächliche Rechnungsdokument als PDF. */
  pdf: Buffer;
}

/**
 * DER PORT.
 *
 * Bewusst eine einzige Methode – Storno/Gutschrift werden erst ergänzt, wenn
 * sie gebraucht werden (dasselbe "wächst mit Bedarf, nicht auf Vorrat" wie
 * beim Zahlungsport, siehe dortiger Kommentar).
 */
export interface RechnungsAnbieter {
  readonly id: RechnungsAnbieterId;

  /** Erstellt eine verbindliche Rechnung und liefert das PDF gleich mit.
   *  Wirft bei technischem Fehlschlag. */
  erstelle(auftrag: Rechnungsauftrag): Promise<Rechnungserstellung>;
}
