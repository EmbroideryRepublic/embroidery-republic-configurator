'use client';

/**
 * Statussteuerung auf der Admin-Bestelldetailseite.
 *
 * Zeigt den aktuellen Stand als Fortschritt und bietet ausschließlich die
 * Übergänge an, die die Zustandsmaschine erlaubt. Unerlaubte Schritte
 * erscheinen gar nicht erst — das ist verlässlicher, als sie anzubieten und
 * hinterher abzulehnen.
 *
 * Beim Versand kann eine Sendungsnummer erfasst werden. Sie ist optional:
 * Nicht jeder Versandweg liefert eine, und eine erfundene wäre schlimmer als
 * keine.
 */
import { useState, useTransition } from 'react';
import { aendereBestellstatus } from '@/lib/actions/orderStatusActions';
import {
  ERLAUBTE_UEBERGAENGE,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
  fortschrittIndex,
} from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

export function OrderStatusControl({
  orderId,
  status,
  trackingNummer,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNummer: string | null;
}) {
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [nummer, setNummer] = useState('');
  const [laeuft, starte] = useTransition();

  // Stornieren wird hier bewusst NICHT angeboten: Eine Betreiberstornierung
  // ist ein eigener Vorgang mit anderer Begründungspflicht (Kulanz,
  // Lieferausfall) und gehört nicht neben die regulären Fortschritte.
  const naechste = ERLAUBTE_UEBERGAENGE[status].filter((s) => s !== 'cancelled');
  const aktuellerIndex = fortschrittIndex(status);
  const storniert = status === 'cancelled';

  function wechsle(nach: OrderStatus) {
    starte(async () => {
      const r = await aendereBestellstatus(orderId, nach, nach === 'shipped' ? nummer : undefined);
      setMeldung({ ok: r.ok, text: r.meldung });
      if (r.ok) setNummer('');
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Bestellstatus</h2>

      {storniert ? (
        <p className="mt-3 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Diese Bestellung wurde storniert. Ein weiterer Statuswechsel ist nicht möglich.
        </p>
      ) : (
        <>
          {/* Fortschritt: erledigte Schritte gefüllt, kommende blass. */}
          <ol className="mt-3 flex items-center gap-1" aria-label="Fortschritt">
            {STATUS_REIHENFOLGE.map((s, i) => {
              const erreicht = i <= aktuellerIndex;
              return (
                <li key={s} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`h-1.5 w-full rounded-full ${erreicht ? 'bg-brand' : 'bg-gray-200'}`}
                    aria-hidden="true"
                  />
                  <span className={`text-[10px] ${erreicht ? 'font-medium text-brand' : 'text-gray-400'}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </li>
              );
            })}
          </ol>

          {trackingNummer && (
            <p className="mt-3 text-xs text-gray-600">
              Sendungsnummer: <span className="font-medium text-gray-900">{trackingNummer}</span>
            </p>
          )}

          {naechste.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">
              Die Bestellung ist abgeschlossen. Kein weiterer Schritt offen.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {naechste.includes('shipped') && (
                <label className="block">
                  <span className="text-xs text-gray-600">Sendungsnummer (optional)</span>
                  <input
                    type="text"
                    value={nummer}
                    onChange={(e) => setNummer(e.target.value)}
                    placeholder="z.B. 00340434161234567890"
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </label>
              )}

              {naechste.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={laeuft}
                  onClick={() => wechsle(s)}
                  className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  {laeuft ? 'Wird gespeichert …' : `Auf „${STATUS_LABELS[s]}" setzen`}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {meldung && (
        <p
          role="status"
          className={`mt-3 rounded px-3 py-2 text-sm ${
            meldung.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {meldung.text}
        </p>
      )}
    </div>
  );
}
