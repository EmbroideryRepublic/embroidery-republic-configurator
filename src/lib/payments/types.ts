/**
 * ═══════════════════════════════════════════════════════════════════════
 * DER ZAHLUNGS-PORT – die einzige Schnittstelle zu einem Zahlungsanbieter
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Bestellprozess kennt ausschließlich die Begriffe dieser Datei. Er
 * weiß nicht, ob dahinter Stripe, PayPal oder ein Testdoppel steckt, und
 * darf es nie erfahren: Sonst zieht sich die Kenntnis eines Anbieters durch
 * das System und ein Wechsel wird zum Umbau.
 *
 * ── Was hier NICHT hingehört ──────────────────────────────────────────
 * Keine Anbieter-Typen, keine SDK-Importe, keine Feldnamen fremder APIs.
 * Ein `Stripe.Checkout.Session` in dieser Datei wäre bereits der Bruch.
 * Ein Architekturtest sichert das ab (siehe __tests__/architektur.test.ts).
 *
 * ── Beträge ───────────────────────────────────────────────────────────
 * Immer in GANZEN CENT als Ganzzahl. Fließkommazahlen sind für Geld
 * ungeeignet, und jeder ernsthafte Anbieter rechnet ohnehin in der
 * kleinsten Einheit. Die Umrechnung liegt an genau einer Stelle:
 * `betrag.ts`.
 */

/**
 * Verfügbare Anbieter.
 *
 * Bewusst ein geschlossener Union-Typ und kein freier String: So ist eine
 * vergessene Verdrahtung ein Übersetzungsfehler statt eines Laufzeitfehlers
 * im Checkout – dasselbe Vorgehen wie bei den Preisregel-Handlern.
 *
 * `test` ist ein vollwertiger Anbieter, kein Sonderfall: Damit lässt sich
 * der gesamte Zahlungsablauf durchspielen, ohne ein fremdes Konto zu
 * benötigen. `stripe` folgt in S5.
 */
export type ZahlungsAnbieterId = 'test' | 'stripe';

/**
 * Währung. Vorerst ausschließlich Euro.
 *
 * Die Anzeige kennt zusätzlich CHF, rechnet aber über einen fest
 * verdrahteten Näherungskurs um – als verbindlicher Zahlbetrag wäre das
 * eine Preisangabe, die wir nicht einhalten könnten. Solange diese
 * Geschäftsentscheidung offen ist (siehe docs/zahlungsarchitektur.md, B12),
 * bleibt es bei einem Wert. Ein zweiter wäre hier leicht zu ergänzen –
 * aber erst, wenn er tatsächlich gebraucht wird.
 */
export type Waehrung = 'EUR';

/** Was der Anbieter braucht, um einen Bezahlvorgang zu eröffnen. */
export interface Zahlungsauftrag {
  bestellId: string;
  /** Für die Kundschaft lesbar, z.B. „ER-2026-1A2B3C". */
  bestellnummer: string;
  /**
   * Zu zahlender Betrag in ganzen Cent.
   *
   * Stammt IMMER aus der Preispipeline und ist zuvor gegen den gespeicherten
   * Bestellbetrag geprüft worden (siehe betrag.ts). Ein vom Browser
   * übermittelter Betrag darf hier unter keinen Umständen ankommen.
   */
  betragCent: number;
  waehrung: Waehrung;
  /** Erscheint auf dem Kontoauszug bzw. beim Anbieter. */
  beschreibung: string;
  /** Wohin die Kundschaft nach dem Bezahlen zurückkehrt. */
  rueckkehrUrl: string;
  /** Wohin bei Abbruch. */
  abbruchUrl: string;
  /**
   * Verhindert, dass ein wiederholter Aufruf beim Anbieter einen ZWEITEN
   * Bezahlvorgang anlegt – dasselbe Prinzip wie die Absendekennung beim
   * Bestellabschluss (A6).
   */
  idempotenzSchluessel: string;
}

/** Was nach dem Eröffnen zurückkommt. */
export interface Zahlungseroeffnung {
  /**
   * Referenz des Vorgangs beim Anbieter → `orders.payment_reference`.
   * Wird gebraucht, um einen unterbrochenen Vorgang fortzusetzen oder zu
   * verwerfen.
   */
  referenz: string;
  /** Dorthin wird die Kundschaft weitergeleitet. */
  weiterleitungUrl: string;
}

/**
 * Was mit einer Zahlung geschehen ist – anbieterunabhängig.
 *
 * Bewusst nur VIER Ausgänge. Anbieter unterscheiden weit mehr Zustände,
 * aber für unseren Ablauf ist allein entscheidend, ob Geld geflossen ist
 * und ob ein weiterer Versuch sinnvoll ist. Feinheiten gehören als Grund in
 * die Bestell-Historie, nicht in den Zustand.
 */
export type ZahlungsEreignisArt = 'bestaetigt' | 'fehlgeschlagen' | 'abgebrochen' | 'abgelaufen';

export interface ZahlungsEreignis {
  /** Kennung des Ereignisses beim Anbieter – für die Nachvollziehbarkeit. */
  ereignisId: string;
  /** Unsere Bestellung. Kommt aus den Metadaten, die wir mitgegeben haben,
   *  NICHT aus der gespeicherten Referenz: Nach einer Wiederaufnahme zeigt
   *  die auf einen neueren Vorgang, und ein Ereignis zum alten wäre sonst
   *  keiner Bestellung mehr zuzuordnen. */
  bestellId: string;
  referenz: string;
  art: ZahlungsEreignisArt;
  /**
   * Vom Anbieter gemeldeter Betrag in Cent.
   *
   * Wird ABGEGLICHEN, niemals übernommen. Weicht er vom erwarteten Betrag
   * ab, gilt die Zahlung nicht als bestätigt.
   */
  betragCent: number;
  waehrung: string;
  /** Referenz der Buchung → `orders.payment_transaction_id`, Grundlage
   *  späterer Erstattungen. */
  transaktionId?: string;
  /** Klartext für die Historie, z.B. „Karte abgelehnt". */
  grund?: string;
}

/**
 * DER PORT.
 *
 * Bewusst drei Methoden. `ladeStand()` und `erstatte()` aus dem ersten
 * Entwurf sind entfallen: Ersteres war durch nichts belegt (Anbieter stellen
 * Ereignisse tagelang erneut zu), Letzteres wird erst bei den Erstattungen
 * gebraucht und kommt dann dazu. Ein Port wächst mit dem Bedarf, nicht auf
 * Vorrat.
 */
export interface ZahlungsAnbieter {
  readonly id: ZahlungsAnbieterId;

  /** Eröffnet einen Bezahlvorgang. Wirft bei technischem Fehlschlag. */
  eroeffne(auftrag: Zahlungsauftrag): Promise<Zahlungseroeffnung>;

  /**
   * Prüft die Echtheit einer eingehenden Meldung und übersetzt sie in
   * unsere Begriffe. `null` = nicht echt oder nicht relevant.
   *
   * Die Echtheitsprüfung gehört ZWINGEND in den Anbieter: Nur er kennt das
   * Verfahren. Ohne sie könnte jeder eine Bestellung als bezahlt melden.
   * Der Rohtext wird unverändert übergeben, weil jede Umformung – auch
   * JSON.parse und erneutes Serialisieren – die Signatur ungültig macht.
   */
  leseEreignis(rohBody: string, signatur: string | null): ZahlungsEreignis | null;

  /**
   * Erklärt einen offenen Vorgang für ungültig.
   *
   * Voraussetzung dafür, dass eine Wiederaufnahme ohne zweiten
   * Datensatz sicher ist: Ohne dieses Verwerfen könnte in einem noch
   * offenen Browser-Tab der ALTE Vorgang bezahlt werden, während die
   * Bestellung längst auf einen neuen zeigt.
   *
   * Wirft NICHT – ein bereits abgelaufener Vorgang ist kein Fehler.
   */
  verwerfe(referenz: string): Promise<void>;
}
