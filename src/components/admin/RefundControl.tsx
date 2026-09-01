'use client';

/**
 * Rückerstattungs-Steuerung auf der Admin-Bestelldetailseite.
 *
 * Nach demselben Muster wie ShippingLabelControl.tsx/OrderStatusControl.tsx.
 * Erscheint NUR, wenn überhaupt je eine Rückerstattung anstand
 * (`refundStatus !== 'not_applicable'`) – die weit überwiegende Mehrheit der
 * Bestellungen zeigt diesen Block also gar nicht.
 *
 * Der automatische ERSTE Versuch läuft bereits bei der Stornierung selbst
 * (siehe orderCancellation.ts/orderStatusActions.ts) – die Schaltfläche hier
 * deckt ausschließlich den Retry-Fall ab ('required': der erste Versuch ist
 * technisch noch offen, z.B. nach einem hängengebliebenen Cron-Reset;
 * 'failed': der letzte Versuch ist eindeutig gescheitert).
 */
import { useState, useTransition } from 'react';
import { retryErstattung } from '@/lib/actions/refundActions';
import { REFUND_STATUS_LABELS, type RefundStatus } from '@/lib/actions/orderTypes';
import { formatiereGeld, formatiereZeitpunkt } from '@/lib/format';

export function RefundControl({
  orderId,
  refundStatus,
  refundAmountCent,
  refundReference,
  refundedAt,
  cancellationSource,
}: {
  orderId: string;
  refundStatus: RefundStatus;
  refundAmountCent: number | null;
  refundReference: string | null;
  refundedAt: string | null;
  cancellationSource: string | null;
}) {
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  if (refundStatus === 'not_applicable') return null;

  function erneutVersuchen() {
    starte(async () => {
      const r = await retryErstattung(orderId);
      setMeldung({ ok: r.ok, text: r.meldung });
    });
  }

  const kannErneutVersuchen = refundStatus === 'required' || refundStatus === 'failed';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Rückerstattung</h2>
      <p className="mt-1 text-xs text-gray-500">
        Storniert durch: {cancellationSource === 'customer' ? 'Kunde (Selbststornierung)' : 'Betreiber (Kulanz)'}
      </p>

      <p
        className={`mt-3 inline-block rounded px-2 py-1 text-sm font-medium ${
          refundStatus === 'refunded'
            ? 'bg-green-50 text-green-800'
            : refundStatus === 'failed'
              ? 'bg-red-50 text-red-800'
              : 'bg-amber-50 text-amber-800'
        }`}
      >
        {REFUND_STATUS_LABELS[refundStatus]}
      </p>

      {refundStatus === 'refunded' && (
        <dl className="mt-3 space-y-1 text-sm text-gray-700">
          {refundAmountCent !== null && (
            <div>
              Betrag: <span className="font-medium">{formatiereGeld(refundAmountCent / 100)}</span>
            </div>
          )}
          {refundReference && (
            <div>
              Referenz: <span className="font-mono text-xs">{refundReference}</span>
            </div>
          )}
          {refundedAt && (
            <div>
              Abgeschlossen am:{' '}
              {formatiereZeitpunkt(refundedAt)}
            </div>
          )}
        </dl>
      )}

      {kannErneutVersuchen && (
        <button
          type="button"
          disabled={laeuft}
          onClick={erneutVersuchen}
          className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
        >
          {laeuft ? 'Wird ausgelöst …' : 'Rückerstattung erneut versuchen'}
        </button>
      )}

      {refundStatus === 'processing' && (
        <p className="mt-3 text-xs text-gray-500">
          Ein Versuch läuft aktuell (oder ein vorheriger ist hängengeblieben – wird automatisch nach Zeitüberschreitung
          zurückgesetzt und kann dann erneut ausgelöst werden).
        </p>
      )}

      {meldung && (
        <>
          <p
            role="status"
            className={`mt-3 rounded px-3 py-2 text-sm ${
              meldung.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {meldung.text}
          </p>
          {/* Bei Erfolg wird DIESE Seite bewusst nicht automatisch neu geladen
              (siehe Kommentar in refundActions.ts) – die Anzeige oben (Status-
              Badge, Retry-Button) bleibt deshalb auf dem Stand vor diesem
              Klick stehen, bis neu aufgerufen wird. Ohne diesen Hinweis sähe
              das wie ein Widerspruch aus („aussteht" + „abgeschlossen"
              gleichzeitig). */}
          {meldung.ok && (
            <p className="mt-1 text-xs text-gray-500">
              Diese Seite zeigt oben noch den Stand vor der Aktion – die Bestellung gilt jetzt als erledigt und
              verschwindet beim nächsten Laden aus der Bearbeitungsliste.
            </p>
          )}
        </>
      )}
    </div>
  );
}
