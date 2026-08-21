'use client';

/**
 * Kulanzstornierung durch den Betreiber – bewusst EIGENE Komponente, nicht
 * Teil von OrderStatusControl.tsx (siehe dortiger Kommentar: „ein eigener
 * Vorgang mit anderer Begründungspflicht, gehört nicht neben die regulären
 * Fortschritte").
 *
 * Backend (setzeBestellstatus mit nach='cancelled', Rückerstattungs-Anstoß,
 * Storno-Mail, cancellation_source='admin') war bereits vollständig gebaut –
 * dieser Komponente fehlte bislang schlicht der UI-Zugang (Review vom
 * 2026-08-20: der Pfad war dadurch aus der Weboberfläche nie erreichbar).
 *
 * Erscheint nur, wenn 'cancelled' laut Zustandsmaschine überhaupt ein
 * erlaubter Folgezustand ist (Endzustände `completed`/`cancelled` bieten
 * keinen Übergang mehr an).
 */
import { useState, useTransition } from 'react';
import { aendereBestellstatus } from '@/lib/actions/orderStatusActions';
import { ERLAUBTE_UEBERGAENGE } from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

export function AdminCancelControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [offen, setOffen] = useState(false);
  const [grund, setGrund] = useState('');
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  if (!ERLAUBTE_UEBERGAENGE[status].includes('cancelled')) return null;

  function stornieren() {
    starte(async () => {
      const r = await aendereBestellstatus(orderId, 'cancelled', undefined, grund);
      setMeldung({ ok: r.ok, text: r.meldung });
      if (r.ok) setOffen(false);
    });
  }

  if (!offen) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Kulanzstornierung</h2>
        <p className="mt-1 text-xs text-gray-500">
          Storniert die Bestellung durch den Betreiber, z.B. bei Lieferausfall. War die Bestellung bereits bezahlt,
          wird automatisch eine Rückerstattung angestoßen.
        </p>
        <button
          type="button"
          onClick={() => setOffen(true)}
          className="mt-3 w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          Bestellung stornieren …
        </button>
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

  return (
    <div className="rounded-lg border border-red-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Kulanzstornierung – Begründung</h2>
      <label className="mt-2 block">
        <span className="text-xs text-gray-600">Grund (Pflichtangabe, landet in der Bestell-Historie)</span>
        <textarea
          value={grund}
          onChange={(e) => setGrund(e.target.value)}
          placeholder="z.B. Lieferausfall beim Großhändler, Kundenwunsch per Telefon …"
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={laeuft || !grund.trim()}
          onClick={stornieren}
          className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {laeuft ? 'Wird storniert …' : 'Endgültig stornieren'}
        </button>
        <button
          type="button"
          disabled={laeuft}
          onClick={() => setOffen(false)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
