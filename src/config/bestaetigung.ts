/**
 * BESTELLBESTÄTIGUNG – reine Regeln, keine Nebenwirkungen.
 *
 * Nach demselben Muster wie config/rechnung.ts/config/rueckerstattung.ts.
 */

/**
 * Nach wie vielen Minuten ein Bestätigungs-Versandanspruch als verwaist gilt.
 *
 * Nur der harte Absturz mitten im Versandversuch (kein Catch möglich)
 * hinterlässt einen gesetzten Claim ohne Ergebnis. Nach dieser Frist gibt
 * der Wiederherstellungslauf ihn frei. Großzügig – ein Resend-Aufruf dauert
 * Sekunden, nicht Minuten.
 */
export const BESTAETIGUNG_CLAIM_VERWAIST_NACH_MINUTEN = 15;

/**
 * Wie viele Bestellungen `holeOffeneBestellbestaetigungenNach`
 * (orderCompletion.ts) je Cron-Lauf höchstens erneut versucht.
 *
 * Der Regelfall ist 0 Treffer – dieser Pfad greift nur, wenn ein früherer
 * Versand sauber fehlgeschlagen ist (Versanddienst hat abgelehnt) und
 * seitdem nie wiederholt wurde.
 */
export const BESTAETIGUNG_RETRY_LIMIT = 25;
