/**
 * ═══════════════════════════════════════════════════════════════════════
 * DER VERSAND-PORT – die einzige Schnittstelle zu einem Versanddienstleister
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach exakt demselben Muster wie lib/payments/types.ts und
 * lib/invoicing/types.ts: Der Bestellprozess kennt ausschließlich die
 * Begriffe dieser Datei, nie DHL oder einen anderen Zusteller. Ein
 * Architekturtest sichert das ab (siehe __tests__/architektur.test.ts).
 *
 * ── Warum die Absenderadresse nicht im Port steht ──────────────────────
 * Sie ist eine feste Geschäftstatsache (`config/company.ts`), keine
 * Bestelldaten – genau dieselbe Überlegung, aus der `Zahlungsauftrag` auch
 * keine Verkäuferdaten trägt. Sie lebt im Adapter, nicht im Auftrag.
 */

/** Verfügbare Versandanbieter. Geschlossener Union-Typ wie bei den
 *  Zahlungs-/Rechnungsanbietern. */
export type VersandAnbieterId = 'test' | 'dhl';

/** Was der Versandanbieter braucht, um ein Label zu erstellen. */
export interface Versandauftrag {
  bestellId: string;
  /** Für die Kundschaft lesbar, z.B. „ER-2026-1A2B3C". */
  bestellnummer: string;
  empfaenger: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    land: string;
  };
  /** Paketgewicht in Kilogramm. Kein Feld im Datenmodell für Gewicht
   *  vorhanden (weder orders noch order_items) – wird bei der
   *  Label-Erstellung manuell angegeben, siehe shippingService.ts. */
  gewichtKg: number;
}

/** Was nach der Label-Erstellung zurückkommt. */
export interface Versanderstellung {
  /** Sendungsnummer – landet auf orders.tracking_number, damit die
   *  Kundschaft ihre Sendung nachverfolgen kann. */
  sendungsnummer: string;
  /** Das Versandlabel als PDF. */
  label: Buffer;
}

/**
 * Wird geworfen, wenn ein Versandanbieter die Sendung bereits ANGELEGT hat
 * (irreversibel, abrechnungswirksam), ein nachfolgender Schritt (Label
 * laden) aber scheitert. Trägt die bereits bekannte Sendungsnummer mit –
 * ohne sie wäre die angelegte Sendung für den Aufrufer nicht mehr
 * auffindbar, und ein automatischer Wiederholungsversuch müsste
 * `erstelleSendung()` blind ein zweites Mal aufrufen, was eine zweite echte
 * Sendung erzeugen würde.
 *
 * Steht bewusst VOR dem Port-Interface (nicht danach): Der Architekturtest
 * „Der Port hat genau die Methode, die gebraucht wird" liest ab der
 * Interface-Deklaration bis zum Dateiende – eine Klasse danach würde ihren
 * Konstruktor fälschlich als weitere Port-Methode zählen.
 */
export class VersandTeilerfolgFehler extends Error {
  constructor(
    message: string,
    public readonly sendungsnummer: string
  ) {
    super(message);
    this.name = 'VersandTeilerfolgFehler';
  }
}

/**
 * DER PORT.
 *
 * Bewusst eine einzige Methode. Ein Storno-Aufruf (DHL: DELETE /orders, nur
 * vor Manifestierung möglich) ist bei DHL vorhanden, aber von keiner
 * Anforderung dieses Batches verlangt – wächst mit Bedarf, nicht auf Vorrat
 * (dasselbe Prinzip wie beim Zahlungs- und Rechnungsport).
 */
export interface VersandAnbieter {
  readonly id: VersandAnbieterId;

  /**
   * Erstellt ein verbindliches Versandlabel.
   *
   * Wirft bei technischem Fehlschlag. Ist die Sendung beim Anbieter bereits
   * ANGELEGT (irreversibel, abrechnungswirksam), bevor ein nachfolgender
   * Schritt (Label laden) scheitert, wirft die Implementierung stattdessen
   * `VersandTeilerfolgFehler` mit der bereits bekannten Sendungsnummer –
   * siehe oben. Ohne diese Unterscheidung ginge die einzige Spur einer
   * bereits real entstandenen Sendung verloren und ein Retry könnte eine
   * zweite anlegen.
   */
  erstelleSendung(auftrag: Versandauftrag): Promise<Versanderstellung>;
}
