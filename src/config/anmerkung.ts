/**
 * Anmerkung der Kundschaft zu einer Bestellung bzw. Nachricht in einer Anfrage (Feld `message` der Tabelle `orders`).
 *
 * Eine Stelle für Browser (Zeichenzähler, maxLength) und Server (Bereinigung, Prüfung) – dieselbe Grenze auf beiden Seiten.
 * Der Text ist freie Eingabe der Kundschaft: Er wird im Adminbereich und in E-Mails nur als Text angezeigt (React escaped,
 * kein HTML), hier werden Steuerzeichen entfernt und Zeilenumbrüche vereinheitlicht.
 */

/** Höchstzahl Zeichen. Genug für Wunschtermin, Hinweise zum Motiv und zur Lieferung, zu kurz für Romane in die Datenbank. */
export const ANMERKUNG_MAX_ZEICHEN = 1000;

/**
 * Macht aus beliebigem Eingang entweder einen sauberen Text oder `undefined` (nichts eingegeben).
 * - Kein Text (Zahl, null, Objekt) → undefined.
 * - Zeilenumbrüche (\r\n, \r) → \n, mehr als eine Leerzeile hintereinander → eine Leerzeile.
 * - Steuerzeichen (außer Zeilenumbruch und Tabulator) fliegen raus.
 * - Außen getrimmt; nur Leerraum → undefined.
 * Kürzt NICHT: Ein zu langer Text soll abgelehnt werden (validateSubmission), nicht stillschweigend abgeschnitten.
 */
export function bereinigeAnmerkung(wert: unknown): string | undefined {
  if (typeof wert !== 'string') return undefined;
  const einheitlich = wert.replace(/\r\n?/g, '\n');
  let sauber = '';
  for (const zeichen of einheitlich) {
    const code = zeichen.codePointAt(0) ?? 0;
    const steuerzeichen = (code < 32 && zeichen !== '\n' && zeichen !== '\t') || code === 127;
    if (!steuerzeichen) sauber += zeichen;
  }
  const text = sauber.replace(/\n{3,}/g, '\n\n').trim();
  return text === '' ? undefined : text;
}
