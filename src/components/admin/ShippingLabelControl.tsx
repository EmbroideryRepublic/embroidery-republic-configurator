'use client';

/**
 * DHL-Versandlabel-Steuerung auf der Admin-Bestelldetailseite.
 *
 * Nach demselben Muster wie OrderStatusControl.tsx. Zeigt entweder das
 * bereits erstellte Label (Sendungsnummer kommt schon über
 * OrderStatusControl, hier zusätzlich der Link zum PDF) oder eine
 * Gewichtseingabe + "Label erstellen"-Schaltfläche.
 *
 * Gewicht wird bewusst bei JEDER Erstellung neu abgefragt statt an der
 * Bestellung gespeichert – es gibt kein Gewichtsfeld im Datenmodell (weder
 * orders noch order_items), siehe shippingService.ts.
 */
import { useState, useTransition } from 'react';
import { erstelleDhlLabel } from '@/lib/actions/shippingActions';

export function ShippingLabelControl({
  orderId,
  trackingNummer,
  labelUrl,
}: {
  orderId: string;
  trackingNummer: string | null;
  labelUrl: string | null;
}) {
  const [gewicht, setGewicht] = useState('');
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  function erstellen() {
    const kg = Number(gewicht.replace(',', '.'));
    starte(async () => {
      const r = await erstelleDhlLabel(orderId, kg);
      setMeldung({ ok: r.ok, text: r.meldung });
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">DHL-Versandlabel</h2>

      {trackingNummer ? (
        <div className="mt-3 text-sm text-gray-700">
          <p>
            Sendungsnummer: <span className="font-medium text-gray-900">{trackingNummer}</span>
          </p>
          {labelUrl && (
            <a
              href={labelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Label öffnen (PDF) ↗
            </a>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="text-xs text-gray-600">Gewicht (kg)</span>
            <input
              type="text"
              inputMode="decimal"
              value={gewicht}
              onChange={(e) => setGewicht(e.target.value)}
              placeholder="z.B. 1.2"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={laeuft || !gewicht.trim()}
            onClick={erstellen}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {laeuft ? 'Wird erstellt …' : 'DHL-Label erstellen'}
          </button>
        </div>
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
