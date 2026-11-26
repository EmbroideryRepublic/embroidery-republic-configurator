/**
 * ═══════════════════════════════════════════════════════════════════════
 * RECHNUNGSAUFTRAG AUS EINER BESTELLUNG – eine Stelle für Positionen, Versand,
 * Steuer und Zahlungsziel
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Bis 2026-11-26 stand dieser Aufbau mitten in `erzeugeRechnung()`
 * (orderCompletion.ts). Seit es Ersatzrechnungen nach einer Auftragsänderung
 * gibt (orderInvoiceReplacement.ts), braucht ihn ein zweiter Aufrufer. Statt
 * ihn zu kopieren – und damit Steuer-, Kleinunternehmer- und Versandrest-Regeln
 * an zwei Stellen zu pflegen – liegt er jetzt hier. Die Regeln selbst sind
 * UNVERÄNDERT aus `erzeugeRechnung` übernommen (siehe Tests in
 * __tests__/rechnungsauftrag.test.ts).
 *
 * Rein: kein Datenbankzugriff, keine Nummernvergabe. Die Rechnungsnummer
 * liefert der Aufrufer als Funktion (`naechsteRechnungsnummer`) – beim
 * Erstellen einer ersten Rechnung zieht sie eine neue Nummer, beim Ersetzen
 * gibt sie die bereits reservierte zurück.
 */
import { PAYMENT_TERM_DAYS, IST_KLEINUNTERNEHMER } from '@/config/company';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import type { Rechnungsauftrag } from '@/lib/invoicing/types';

/** Obergrenze für einen plausiblen Versandrest, wie bisher: großzügig über dem höchsten realen Satz (config/shipping.ts). */
export const VERSANDREST_OBERGRENZE_CENT = 2000; // 20,00 €

export interface RechnungsauftragOptionen {
  /** ISO-Datum (yyyy-mm-dd), an dem die Rechnung ausgestellt wird. */
  rechnungsdatum: string;
  /** Siehe `Rechnungsauftrag.naechsteRechnungsnummer`. */
  naechsteRechnungsnummer: () => Promise<string>;
  /** Nur bei einer Ersatzrechnung: die frühere Rechnung, die sie ersetzt. */
  ersetzt?: Rechnungsauftrag['ersetzt'];
  /** Meldung bei einem auffällig abweichenden Versandanteil (Standard: console.warn). */
  warnung?: (text: string) => void;
}

/**
 * Baut den Auftrag an den Rechnungsanbieter aus einer vollständig geladenen
 * Bestellung. Wirft bei einer Bestellung, aus der sich KEINE verlässliche
 * Rechnung bauen lässt (ohne Lieferadresse, unplausibler Versandrest) – der
 * Aufrufer gibt dann seinen Anspruch frei, bevor ein Beleg entsteht.
 */
export function baueRechnungsauftrag(order: OrderRecord, optionen: RechnungsauftragOptionen): Rechnungsauftrag {
  if (!order.shipping) {
    throw new Error('Bestellung ohne Lieferadresse – Rechnungsadresse fehlt.');
  }

  // Kleinunternehmer nach § 19 UStG: niemals eine Steuer ausweisen, auch
  // wenn orders.tax_rate (pauschal 19 %, siehe Migration 0014) etwas
  // anderes sagt – das war bislang ein echter, unbemerkter Fehler auf
  // jeder erstellten Rechnung.
  const steuersatz = IST_KLEINUNTERNEHMER ? 0 : (order.taxRate ?? 19);
  const zahlungszielTage = !order.paymentMethod || order.paymentMethod === 'invoice' ? PAYMENT_TERM_DAYS : 0;

  // Positionen: der bereits validierte POSITIONSGESAMTPREIS als
  // "Einzelpreis" mit menge=1, NICHT unitPrice × echte Menge. unit_price ist
  // ein auf den Cent gerundeter EFFEKTIVER Stückpreis, der laut Migration-0013-
  // Kommentar je nach Menge um mehrere Cent vom gespeicherten Positions-
  // gesamtpreis abweichen kann. menge=1 mit dem vollen, validierten
  // Positionspreis garantiert eine centgenaue Rechnungszeile; die tatsächliche
  // Stückzahl steht lesbar in der Bezeichnung.
  const positionen = order.items.map((item) => ({
    bezeichnung: `${item.productName} · ${item.colorName} (${item.quantity}×)`,
    menge: 1,
    einzelpreisBruttoCent: Math.round(item.totalPrice * 100),
    steuersatzProzent: steuersatz,
  }));

  // Versandzeile als ECHTER REST (Gesamtbetrag minus Positionssumme), nicht
  // aus dem separat abgeleiteten order.shippingCost übernommen: So
  // summieren sich Positionen + Versand IMMER exakt auf den tatsächlich
  // autoritativen, bereits geprüften Bestellbetrag.
  const positionenSummeCent = positionen.reduce((summe, p) => summe + p.einzelpreisBruttoCent, 0);
  const gesamtCent = Math.round(order.totalPrice * 100);
  const versandRestCent = gesamtCent - positionenSummeCent;
  const abgeleiteterVersandCent = Math.round((order.shippingCost ?? 0) * 100);

  // Ein Rest außerhalb des realen Rahmens beweist eine Inkonsistenz zwischen
  // order.totalPrice und der Summe der Positionspreise. Er wird NICHT still
  // geklemmt: Die Erstellung bricht hart ab, BEVOR ein Beleg entsteht.
  if (versandRestCent < -1 || versandRestCent > VERSANDREST_OBERGRENZE_CENT) {
    throw new Error(
      `Versandrest ${versandRestCent}ct ist unplausibel (Positionssumme ${positionenSummeCent}ct, ` +
        `Bestellbetrag ${gesamtCent}ct, separat abgeleiteter Versandanteil ${abgeleiteterVersandCent}ct) – ` +
        `Rechnungserstellung abgebrochen statt eines falschen Betrags. Bestellung manuell prüfen.`
    );
  }
  if (Math.abs(versandRestCent - abgeleiteterVersandCent) > 50) {
    (optionen.warnung ?? console.warn)(
      `[orders] Rechnung ${order.id}: Versandrest (${versandRestCent}ct) weicht deutlich vom separat ` +
        `abgeleiteten Versandanteil (${abgeleiteterVersandCent}ct) ab – Positionssumme möglicherweise inkonsistent.`
    );
  }

  return {
    bestellId: order.id,
    bestellnummer: order.orderNumber,
    rechnungsdatum: optionen.rechnungsdatum,
    kaeufer: {
      name: order.contact.name,
      firma: order.contact.company,
      strasse: order.shipping.street,
      plz: order.shipping.zip,
      ort: order.shipping.city,
      land: order.shipping.country,
      ustIdNr: order.customerVatId,
    },
    positionen,
    versandkostenBruttoCent: versandRestCent,
    gesamtBruttoCent: gesamtCent,
    waehrung: 'EUR',
    zahlungszielTage,
    naechsteRechnungsnummer: optionen.naechsteRechnungsnummer,
    ...(optionen.ersetzt ? { ersetzt: optionen.ersetzt } : {}),
  };
}
