/**
 * RÜCKERSTATTUNG – reine Regeln, keine Nebenwirkungen.
 *
 * Nach demselben Muster wie config/rechnung.ts und config/versand.ts.
 */

/**
 * Nach wie vielen Minuten ein Rückerstattungs-Anspruch als verwaist gilt.
 *
 * Anders als bei Rechnung/Label (config/rechnung.ts, config/versand.ts) ist
 * diese automatische Freigabe UNEINGESCHRÄNKT sicher, auch wenn der Anbieter
 * die Erstattung zwischenzeitlich bereits real ausgeführt hat: Jeder
 * Erstattungsaufruf trägt einen STABILEN Idempotenzschlüssel
 * (`refund-${orderId}`, siehe Erstattungsauftrag in lib/payments/types.ts).
 * Ein Retry nach Freigabe ruft denselben Anbieter-Endpunkt mit demselben
 * Schlüssel erneut auf und bekommt garantiert das Ergebnis des ursprünglichen
 * Aufrufs zurück – nie eine zweite echte Erstattung. Es gibt deshalb (anders
 * als bei Rechnung/Label) kein `refund_unklarer_zustand`-Flag, das dieser
 * Reaper zu respektieren hätte. Siehe supabase/migrations/0029_rueckerstattung.sql.
 */
export const ERSTATTUNG_CLAIM_VERWAIST_NACH_MINUTEN = 15;

/**
 * Wie viele Bestellungen `holeOffeneErstattungenNach` (refundService.ts) je
 * Cron-Lauf höchstens erneut versucht.
 *
 * Der Regelfall ist 0 Treffer – dieser Pfad greift nur, wenn der automatische
 * Anstoß bei der Stornierung UND ein etwaiger Admin-Retry beide (noch) nicht
 * zum Abschluss kamen. Bewusst klein: Jeder Treffer löst einen echten
 * Zahlungsanbieter-Aufruf aus, kein Massen-Batch.
 */
export const ERSTATTUNG_RETRY_LIMIT = 10;
