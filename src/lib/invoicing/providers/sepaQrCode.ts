/**
 * ═══════════════════════════════════════════════════════════════════════
 * SEPA-ÜBERWEISUNGS-QR-CODE (GiroCode / EPC-QR-Code)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Erzeugt einen echten SEPA-Überweisungs-QR-Code nach dem offiziellen
 * European-Payments-Council-Standard "EPC069-12" (Quick Response Code
 * Guidelines to Enable the Data Capture for the Initiation of a SEPA Credit
 * Transfer) – demselben Format, das deutsche Banking-Apps unter dem Namen
 * "GiroCode" scannen und automatisch als Überweisung übernehmen. KEIN
 * beliebiger QR-Code mit einer URL – der Inhalt ist reiner, strukturierter
 * Text nach fester Zeilenreihenfolge.
 *
 * Feste Zeilenreihenfolge (jede Position MUSS an ihrem Platz stehen, auch
 * wenn leer – nur am ENDE dürfen leere Zeilen entfallen):
 *   1  "BCD"              Service-Kennung
 *   2  "002"               Versionsnummer
 *   3  "1"                 Zeichensatz (1 = UTF-8)
 *   4  "SCT"                SEPA Credit Transfer
 *   5  BIC                  optional – seit Version 002 leer zulässig für
 *                            SEPA-Überweisungen innerhalb des EWR (Verordnung
 *                            (EU) Nr. 260/2012); hier bewusst leer, da keine
 *                            BIC hinterlegt ist (siehe COMPANY_BANK)
 *   6  Empfängername        max. 70 Zeichen
 *   7  IBAN                 ohne Leerzeichen
 *   8  Betrag                "EUR" + Betrag mit Punkt, z.B. "EUR52.88"
 *   9  Zweck                 optional, hier leer
 *   10 Strukturierte Referenz optional, hier leer (unstrukturierter Verwendungszweck stattdessen)
 *   11 Verwendungszweck (unstrukturiert) max. 140 Zeichen – hier immer die
 *      echte Rechnungsnummer dieses Belegs
 */
import QRCode from 'qrcode';

export interface SepaUeberweisung {
  /** Kontoinhaber (Zahlungsempfänger), max. 70 Zeichen laut EPC069-12. */
  empfaenger: string;
  /** IBAN, mit oder ohne Leerzeichen – wird intern normalisiert. */
  iban: string;
  /** Rechnungsbetrag in EURO (nicht Cent), z.B. 52.88 – IMMER der echte,
   *  tatsächliche Rechnungsbetrag, nie ein Beispielwert. */
  betragEuro: number;
  /** Unstrukturierter Verwendungszweck – hier immer die echte
   *  Rechnungsnummer dieses konkreten Belegs. */
  verwendungszweck: string;
}

/** Baut den EPC069-12-Nutztext. Exportiert für Tests, die den Inhalt direkt
 *  prüfen wollen, ohne den QR-Code selbst zu dekodieren. */
export function baueEpcPayload(daten: SepaUeberweisung): string {
  const ibanOhneLeerzeichen = daten.iban.replace(/\s+/g, '').toUpperCase();
  const betrag = daten.betragEuro.toFixed(2); // Punkt als Dezimaltrennzeichen, exakt 2 Nachkommastellen laut Standard
  const zeilen = [
    'BCD',
    '002',
    '1',
    'SCT',
    '', // BIC – siehe Kopfkommentar
    daten.empfaenger.slice(0, 70),
    ibanOhneLeerzeichen,
    `EUR${betrag}`,
    '', // Zweck
    '', // strukturierte Referenz
    daten.verwendungszweck.slice(0, 140),
  ];
  return zeilen.join('\n');
}

/**
 * Rendert den SEPA-QR-Code als PNG-Puffer, einbettbar über
 * `<Image src={{ data: buffer, format: 'png' }} />` in @react-pdf/renderer.
 *
 * Fehlerkorrektur-Stufe "M" (Medium, ~15 %) – von der EPC-Guideline für
 * GiroCodes empfohlen, guter Kompromiss zwischen Robustheit (Falten,
 * Druckqualität) und Bildgröße.
 */
export async function erzeugeSepaQrPng(daten: SepaUeberweisung): Promise<Buffer> {
  const payload = baueEpcPayload(daten);
  return QRCode.toBuffer(payload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });
}
