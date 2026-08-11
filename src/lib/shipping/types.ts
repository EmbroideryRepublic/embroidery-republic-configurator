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
 * DER PORT.
 *
 * Bewusst eine einzige Methode. Ein Storno-Aufruf (DHL: DELETE /orders, nur
 * vor Manifestierung möglich) ist bei DHL vorhanden, aber von keiner
 * Anforderung dieses Batches verlangt – wächst mit Bedarf, nicht auf Vorrat
 * (dasselbe Prinzip wie beim Zahlungs- und Rechnungsport).
 */
export interface VersandAnbieter {
  readonly id: VersandAnbieterId;

  /** Erstellt ein verbindliches Versandlabel. Wirft bei technischem
   *  Fehlschlag. */
  erstelleSendung(auftrag: Versandauftrag): Promise<Versanderstellung>;
}
