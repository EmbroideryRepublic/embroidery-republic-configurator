/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZAHLUNG – reine Regeln, keine Nebenwirkungen
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Beantwortet zwei Fragen, die an mehreren Stellen gebraucht werden, ohne
 * dass diese Stellen den Zahlungsstatus selbst interpretieren müssen. Reine
 * Funktionen – keine Datenbank, siehe geschaeftsarchitektur.md.
 */
import type { OrderPaymentMethod } from '@/lib/actions/orderTypes';

/**
 * Braucht diese Zahlungsart eine Vorabzahlung, bevor produziert wird?
 *
 * Der Rechnungskauf wird nach Lieferung bezahlt – die Produktion läuft
 * sofort. Karte und PayPal werden vorab bezahlt – erst nach bestätigter
 * Zahlung darf produziert und die Bestätigung verschickt werden.
 *
 * Das ist die Weiche für Phase 2 (siehe bestellablauf.md, Abschnitt 5).
 */
export function brauchtVorabZahlung(methode: OrderPaymentMethod): boolean {
  return methode !== 'invoice';
}

/** Der Zahlungsstatus, mit dem eine neue Bestellung startet. */
export function anfangsZahlungsstatus(methode: OrderPaymentMethod): 'not_required' | 'pending' {
  return brauchtVorabZahlung(methode) ? 'pending' : 'not_required';
}

/**
 * Nach wie vielen Stunden gilt eine offene Zahlung als gescheitert.
 *
 * Eine 'pending'-Bestellung bliebe sonst unbegrenzt offen. 24 Stunden geben
 * genug Zeit für einen unterbrochenen Bezahlvorgang (Kunde zahlt am nächsten
 * Tag), ohne die Bestellung ewig im Ungewissen zu lassen.
 */
export const ZAHLUNG_VERFAELLT_NACH_STUNDEN = 24;

/**
 * Nach wie vielen Minuten ein Phase-2-Anspruch als verwaist gilt.
 *
 * Nur der harte Absturz mitten in Phase 2 (kein Catch möglich) hinterlässt
 * einen gesetzten Claim ohne Ergebnis. Nach dieser Frist gibt der
 * Wiederherstellungslauf ihn frei. 15 Minuten sind großzügig – Phase 2
 * dauert Sekunden.
 */
export const ABSCHLUSS_CLAIM_VERWAIST_NACH_MINUTEN = 15;
