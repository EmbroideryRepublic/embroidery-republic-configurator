/**
 * RECHNUNG – reine Regeln, keine Nebenwirkungen.
 *
 * Nach demselben Muster wie config/zahlung.ts.
 */

/**
 * Nach wie vielen Minuten ein Rechnungserstellungs-Anspruch als verwaist
 * gilt.
 *
 * Nur der harte Absturz mitten in der Erstellung (kein Catch möglich)
 * hinterlässt einen gesetzten Claim ohne Ergebnis. Nach dieser Frist gibt
 * der Wiederherstellungslauf ihn frei. Großzügig – ein Lexware-Aufruf
 * dauert Sekunden, nicht Minuten.
 */
export const RECHNUNG_CLAIM_VERWAIST_NACH_MINUTEN = 15;
