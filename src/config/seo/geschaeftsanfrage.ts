/**
 * Geschäftsanfrage auf /geschaeftskunden (Ziel des QR-Codes in den Anschreiben).
 *
 * Ein kurzes Formular mit festen Auswahlfeldern (Branche, Kleidung, Stückzahl, Veredelung) statt eines freien Nachrichtenfelds: Wer zum ersten Mal anfragt,
 * muss nichts formulieren, und wir bekommen vergleichbare Angaben. Das Ergebnis geht über den vorhandenen Kontaktversand (`submitContactMessage`) als E-Mail
 * an uns – Betreff und Text tragen die Kennung des Briefes (`B2B-0011`), damit sich jede Anfrage dem Brief zuordnen lässt.
 *
 * Es wird nur DTF-Transferdruck angeboten (die Stickerei ist pausiert und kommt hier nicht vor).
 * Kundentext – erst nach Freigabe des Wortlauts live. Die Logik steht in lib/seo/geschaeftsanfrage.ts, die Oberfläche in components/seo/GeschaeftsanfrageForm.tsx.
 */
export const GESCHAEFTSANFRAGE_BETREFF = 'Geschäftsanfrage Firmenkleidung';

/** Format der Kennung aus dem Brief (steht unter dem QR-Code und im Link). */
const KENNUNG = /^B2B-\d{4}$/;
export const istGueltigeKennung = (ref: string | null | undefined): ref is string => typeof ref === 'string' && KENNUNG.test(ref);

/** Kennung aus Link oder Eingabe: Leerraum weg, Großbuchstaben. Nur das exakte Format wird übernommen, sonst `null`. */
export function normalisiereKennung(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const k = wert.trim().toUpperCase();
  return istGueltigeKennung(k) ? k : null;
}

interface Option {
  id: string;
  label: string;
}

export const BRANCHEN: readonly Option[] = [
  { id: 'handwerk', label: 'Handwerk (z. B. Maler, Elektro, Sanitär und Heizung)' },
  { id: 'reinigung', label: 'Gebäudereinigung und Dienstleistung' },
  { id: 'gastro', label: 'Gastronomie und Hotel' },
  { id: 'praxis', label: 'Praxis und Therapie' },
  { id: 'verein', label: 'Verein' },
  { id: 'fitness', label: 'Fitness und Kampfsport' },
  { id: 'salon', label: 'Salon und Studio' },
  { id: 'sonstige', label: 'Sonstige Branche' },
];

export const KLEIDUNG: readonly Option[] = [
  { id: 'polo', label: 'Poloshirts' },
  { id: 'tshirt', label: 'T-Shirts' },
  { id: 'hoodie', label: 'Hoodies und Sweatshirts' },
  { id: 'jacke', label: 'Jacken' },
  { id: 'unklar', label: 'Weiß ich noch nicht – bitte beraten Sie mich' },
];

export const MENGEN: readonly Option[] = [
  { id: '1-9', label: '1–9 Stück' },
  { id: '10-24', label: '10–24 Stück' },
  { id: '25-49', label: '25–49 Stück' },
  { id: '50-99', label: '50–99 Stück' },
  { id: '100+', label: '100 Stück und mehr' },
  { id: 'unklar', label: 'Weiß ich noch nicht' },
];

export const VEREDELUNG: readonly Option[] = [
  { id: 'dtf', label: 'DTF-Transferdruck (vollfarbiges Logo oder Motiv)' },
  { id: 'beratung', label: 'Weiß ich noch nicht – bitte beraten Sie mich' },
];

/** Logo-Anhang: Die Plattform nimmt höchstens ca. 4,5 MB je Anfrage an; Dateien werden als Base64 gesendet (+ ca. ein Drittel). 3 MB Rohdaten bleiben sicher darunter. */
export const LOGO_GRENZEN = { maxDateien: 2, maxBytesGesamt: 3 * 1024 * 1024, erlaubteTypen: ['image/png', 'image/jpeg', 'application/pdf'] } as const;

export const ANFRAGE_GRENZEN = { firmaMin: 2, firmaMax: 120, nameMin: 2, nameMax: 100, emailMax: 200, anmerkungMax: 1500 } as const;

/** Alle Beschriftungen und Meldungen des Formulars an einer Stelle (zur Textfreigabe). */
export const FORMULAR_TEXTE = {
  firma: 'Unternehmen',
  firmaPlatzhalter: 'z. B. Mustermann Heizung GmbH',
  branche: 'Branche',
  brancheLeer: 'Bitte wählen …',
  kleidung: 'Gewünschte Kleidung',
  kleidungHinweis: 'Mehrfachauswahl möglich',
  menge: 'Ungefähre Stückzahl',
  mengeLeer: 'Bitte wählen …',
  veredelung: 'Gewünschte Veredelung',
  name: 'Ihr Name',
  email: 'E-Mail',
  telefon: 'Telefon',
  telefonHinweis: 'optional – falls wir Sie zurückrufen sollen',
  anmerkung: 'Anmerkung',
  anmerkungHinweis: 'optional – z. B. Wunschtermin, Farben oder besondere Wünsche',
  logo: 'Logo hochladen',
  logoHinweis: 'optional – PNG, JPEG oder PDF, zusammen höchstens 3 MB. Ein Foto oder eine Skizze Ihres bisherigen Logos genügt.',
  logoWaehlen: 'Datei auswählen',
  kennung: 'Kennung aus Ihrem Brief',
  kennungHinweis: 'optional – steht unter dem QR-Code',
  kennungUebernommen: 'Aus Ihrem Brief übernommen.',
  senden: 'Unverbindlich anfragen',
  sendet: 'Wird gesendet …',
  datenschutz: 'Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeitet. Es entsteht keine Bestellung und keine Zahlungsverpflichtung.',
  erfolgTitel: 'Anfrage gesendet',
  erfolgText: 'Vielen Dank für Ihre Anfrage! Wir melden uns persönlich bei Ihnen zurück – in der Regel innerhalb eines Werktags.',
  erfolgNochmal: 'Weitere Anfrage stellen',
  sammelfehler: 'Bitte prüfen Sie die markierten Felder.',
  sendefehler: 'Ihre Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt per E-Mail an info@ergermany.de.',
  fehler: {
    firma: 'Bitte nennen Sie Ihr Unternehmen (mindestens 2 Zeichen).',
    branche: 'Bitte wählen Sie Ihre Branche.',
    kleidung: 'Bitte wählen Sie mindestens eine Kleidungsart – oder „Weiß ich noch nicht“.',
    menge: 'Bitte wählen Sie eine ungefähre Stückzahl – oder „Weiß ich noch nicht“.',
    veredelung: 'Bitte wählen Sie eine Veredelung.',
    name: 'Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen).',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
    telefon: 'Bitte prüfen Sie die Telefonnummer (nur Ziffern, Leerzeichen und + - / ( )).',
    anmerkung: 'Die Anmerkung ist zu lang (höchstens 1.500 Zeichen).',
    kennung: 'Die Kennung hat das Format B2B-0000 und steht unter dem QR-Code Ihres Briefes.',
    logoZuViele: 'Bitte hängen Sie höchstens 2 Dateien an.',
    logoZuGross: 'Die Dateien sind zusammen zu groß (höchstens 3 MB). Größere Dateien schicken Sie uns bitte per E-Mail an info@ergermany.de.',
    logoFormat: 'Dieses Dateiformat wird nicht unterstützt. Erlaubt sind PNG, JPEG und PDF.',
  },
} as const;
