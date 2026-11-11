/**
 * MELDUNG AN DEN BETREIBER ÜBER NEUE BESTELLUNGEN UND ANFRAGEN – reine Regeln,
 * keine Nebenwirkungen.
 *
 * Nach demselben Muster wie config/bestaetigung.ts.
 *
 * Die Meldung geht beim Eingang sofort raus (config/orderProcess.ts,
 * INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS = 0) – mit zwei weiteren Versuchen
 * bei einem kurzen Aussetzer des Versanddienstes. Der Wiederherstellungslauf
 * (holeOffeneBetreibermeldungenNach, orderCompletion.ts) fängt auf, was trotzdem
 * nie ankam: harter Abbruch der Anfrage, dauerhaft abgelehnter Versand.
 */

/**
 * Frühestens so viele Minuten nach dem Eingang wird eine ausgebliebene Meldung
 * nachgeholt. Bis dahin läuft der reguläre Versand noch; ein früherer Zugriff
 * des Cron-Laufs könnte ihn überholen und die Meldung doppelt auslösen.
 */
export const BETREIBERMELDUNG_NACHHOLEN_NACH_MINUTEN = 10;

/**
 * Nur Eingänge der letzten Stunden werden nachgemeldet. Eine Meldung, die erst
 * nach Tagen ankommt, wäre für den Betreiber eher verwirrend als hilfreich –
 * zumal er die Anfrage dann längst im Adminbereich gesehen haben kann.
 */
export const BETREIBERMELDUNG_NACHHOLEN_BIS_STUNDEN = 48;

/**
 * Wie viele Eingänge `holeOffeneBetreibermeldungenNach` je Cron-Lauf höchstens
 * nachmeldet. Der Regelfall ist 0 Treffer.
 */
export const BETREIBERMELDUNG_RETRY_LIMIT = 10;
