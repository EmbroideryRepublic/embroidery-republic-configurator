/**
 * Vollständige Chronologie einer Bestellung (order_events), neueste zuerst.
 *
 * Zeigt AUSSCHLIESSLICH bereits vorhandene Daten – keine neue Datenhaltung,
 * kein neues Protokoll. `order_events` wird längst lückenlos befüllt
 * (orderService.ts::protokolliereBestellereignis, von praktisch jedem
 * fachlichen Vorgang aufgerufen); es fehlte bislang nur eine Stelle, die die
 * volle Liste zeigt (getOrderDetail() las bisher nur eine gefilterte
 * Teilmenge für die Inline-Warnhinweise oben auf der Seite).
 *
 * `reason` ist bei praktisch jedem Ereignis bereits ein vollständiger,
 * deutscher Satz (siehe die Aufrufer von protokolliereBestellereignis) – die
 * Zeile zeigt ihn deshalb direkt an, statt ein zweites Zusammenfassungs-
 * Schema zu erfinden. `eventType` bekommt zusätzlich ein knappes deutsches
 * Label, damit die Zeile auch ohne reason (theoretisch möglich) einordbar
 * bleibt.
 */
import type { AdminOrderEvent } from '@/lib/admin/data';
import { formatiereZeitpunkt } from '@/lib/format';

const EVENT_LABELS: Record<string, string> = {
  status_changed: 'Statuswechsel',
  cancelled: 'Storniert',
  email_sent: 'E-Mail versendet',
  email_scheduled: 'E-Mail eingeplant',
  email_failed: 'E-Mail fehlgeschlagen',
  scheduled_email_cancelled: 'Geplante E-Mail zurückgezogen',
  scheduled_email_cancel_failed: 'Geplante E-Mail konnte nicht zurückgezogen werden',
  proof_requested: 'Freigabe angefragt',
  proof_approved: 'Freigabe erteilt',
  proof_change_requested: 'Änderung an Vorschau gewünscht',
  invoice_created: 'Rechnung erstellt',
  invoice_creation_failed: 'Rechnungserstellung fehlgeschlagen',
  invoice_creation_partial_failure: 'Rechnung erstellt, Nacharbeit fehlgeschlagen',
  invoice_accounting_marking_failed: 'Buchhaltungs-Markierung fehlgeschlagen',
  refund_succeeded: 'Rückerstattung erfolgreich',
  refund_failed: 'Rückerstattung fehlgeschlagen',
  refund_confirmed_via_webhook: 'Rückerstattung bestätigt',
  shipping_label_created: 'Versandlabel erstellt',
  shipping_label_partial_failure: 'Versandlabel erstellt, Nacharbeit fehlgeschlagen',
  shipping_label_failed: 'Versandlabel fehlgeschlagen',
  payment_blocked: 'Zahlung blockiert',
  payment_started: 'Zahlung gestartet',
  payment_amount_mismatch: 'Zahlungsbetrag weicht ab',
  payment_succeeded: 'Zahlung erfolgreich',
  payment_failed: 'Zahlung fehlgeschlagen',
  payment_abandoned: 'Zahlung abgebrochen',
  payment_expired: 'Zahlung abgelaufen',
  supplier_process_started: 'Lieferantenprozess gestartet',
  address_corrected: 'Name/Adresse korrigiert',
};

function istFehlschlag(eventType: string): boolean {
  return (
    eventType.endsWith('_failed') ||
    eventType.endsWith('_failure') ||
    eventType === 'payment_blocked' ||
    eventType === 'payment_amount_mismatch'
  );
}

export function BestellVerlauf({ events }: { events: AdminOrderEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400">Für diese Bestellung liegen noch keine Ereignisse vor.</p>;
  }

  return (
    <ol className="space-y-2">
      {events.map((ev, i) => {
        const fehlschlag = istFehlschlag(ev.eventType);
        const trackingNummer = (ev.detail?.trackingNummer as string | null | undefined) ?? null;
        // Der eigentliche Kundenwunsch bei "Änderung wünschen" – reason trägt
        // dort nur den generischen Satz, der tatsächliche Text steckt in
        // detail.kommentar (siehe orderService.ts::wuenscheAenderungDurchKunden).
        // Ohne diese Zeile sähe der Admin NUR "Änderung gewünscht", nie WAS
        // geändert werden soll – das wäre der Punkt der ganzen Funktion.
        const kommentar = (ev.detail?.kommentar as string | null | undefined) ?? null;
        const vorherigeAdresse = (ev.detail?.vorher as string | null | undefined) ?? null;
        return (
          <li
            key={i}
            className={`rounded-md border px-3 py-2 text-sm ${
              fehlschlag ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50/60 text-gray-700'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="font-medium">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</span>
              <span className="text-xs opacity-70">{formatiereZeitpunkt(ev.at, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            {ev.reason && <p className="mt-0.5 opacity-90">{ev.reason}</p>}
            {kommentar && (
              <p className="mt-1 whitespace-pre-wrap rounded bg-white/60 px-2 py-1 text-sm italic text-gray-800">
                „{kommentar}&rdquo;
              </p>
            )}
            {trackingNummer && <p className="mt-0.5 font-mono text-xs opacity-70">Sendungsnummer: {trackingNummer}</p>}
            {vorherigeAdresse && <p className="mt-0.5 text-xs opacity-70">Zuvor: {vorherigeAdresse}</p>}
          </li>
        );
      })}
    </ol>
  );
}
