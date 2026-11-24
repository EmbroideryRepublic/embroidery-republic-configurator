/**
 * Geschäftsanfrage auf /geschaeftskunden (Ziel des QR-Codes in den Anschreiben).
 *
 * Das Formular ist das vorhandene Kontaktformular, vorbelegt mit einer Vorlage. Kommt die Seite über einen Brief, steht die Kennung des Briefes
 * (`?ref=B2B-0011`) in der Nachricht – so lässt sich eine Anfrage dem Brief zuordnen. Die Kennung wird nur übernommen, wenn sie genau dieses Format hat.
 * Kundentext – erst nach Freigabe des Wortlauts live.
 */
export const GESCHAEFTSANFRAGE_BETREFF = 'Geschäftsanfrage Firmenkleidung';

const KENNUNG = /^B2B-\d{4}$/;
export const istGueltigeKennung = (ref: string | null | undefined): ref is string => typeof ref === 'string' && KENNUNG.test(ref);

/** Vorlage für das Nachrichtenfeld; mit gültiger Kennung wird sie als letzte Zeile angehängt. */
export function geschaeftsanfrageText(ref?: string | null): string {
  const zeilen = [
    'Unternehmen / Branche:',
    'Gewünschte Kleidung (z. B. Poloshirts, Hoodies):',
    'Ungefähre Menge:',
    'Logo vorhanden (ja/nein):',
    'Gewünschter Termin:',
  ];
  return `${zeilen.join('\n')}${istGueltigeKennung(ref) ? `\n\nKennung aus Ihrem Schreiben: ${ref}` : ''}`;
}
