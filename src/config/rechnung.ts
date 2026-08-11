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
 *
 * WICHTIG: Diese automatische Freigabe gilt ausschließlich für den Fall
 * "Lexware nie erreicht bzw. vor jeder Anlage abgelehnt". Hat Lexware
 * bereits real angelegt, aber die anschließende Persistierung ist
 * vollständig gescheitert, wird die Bestellung stattdessen als
 * rechnung_unklarer_zustand markiert (Migration 0026) und dieser Reaper
 * rührt sie NIE an, egal wie lange dieser Wert ist – siehe dortiger
 * Kommentar zu gib_haengende_rechnungserstellung_frei.
 */
export const RECHNUNG_CLAIM_VERWAIST_NACH_MINUTEN = 15;
