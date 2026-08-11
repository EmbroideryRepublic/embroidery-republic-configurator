/**
 * VERSAND – reine Regeln, keine Nebenwirkungen.
 *
 * Nach demselben Muster wie config/zahlung.ts und config/rechnung.ts.
 */

/**
 * Nach wie vielen Minuten ein Versandlabel-Erstellungs-Anspruch als verwaist
 * gilt. Gleiche Überlegung wie RECHNUNG_CLAIM_VERWAIST_NACH_MINUTEN,
 * einschließlich der Ausnahme: Ist label_unklarer_zustand gesetzt (DHL hat
 * bereits real angelegt, tracking_number-Persistierung ist vollständig
 * gescheitert), gibt der Reaper diesen Claim NIE frei, unabhängig von
 * dieser Frist – siehe Migration 0026.
 */
export const VERSANDLABEL_CLAIM_VERWAIST_NACH_MINUTEN = 15;
