/**
 * Storno-Schaltfläche mit Sicherheitsabfrage.
 *
 * Zwei Schritte sind Absicht: Eine Stornierung ist nicht umkehrbar, ein
 * versehentlicher Klick auf dem Handy soll die Bestellung nicht auflösen.
 *
 * Die Restzeit wird bewusst NICHT im Browser heruntergezählt. Ob storniert
 * werden darf, entscheidet ausschließlich der Server anhand von
 * `created_at` – ein Zähler im Browser würde suggerieren, die Uhrzeit des
 * Geräts spiele eine Rolle.
 */
'use client';

import { useState, useTransition } from 'react';
import { storniereBestellungAction } from '@/lib/actions/orderCancellation';

export function CancelOrderButton({ token, fristBis }: { token: string; fristBis: string }) {
  const [nachfrage, setNachfrage] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!nachfrage) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setNachfrage(true)}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Bestellung stornieren
        </button>
        <p className="mt-2 text-xs text-brand/50">Möglich bis {fristBis}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">Bestellung wirklich stornieren?</p>
      <p className="mt-1 text-xs text-red-800">
        Die Stornierung kann nicht rückgängig gemacht werden. Sie erhalten anschließend eine Bestätigung per E-Mail.
      </p>
      {fehler && <p className="mt-2 text-xs font-medium text-red-900">{fehler}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setFehler(null);
              const r = await storniereBestellungAction(token);
              if (!r.ok) setFehler(r.fehler ?? 'Die Stornierung war nicht möglich.');
              // Bei Erfolg lädt die Seite neu und zeigt den Zustand „storniert".
            })
          }
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? 'Wird storniert …' : 'Ja, Bestellung stornieren'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setNachfrage(false);
            setFehler(null);
          }}
          className="rounded-md border border-brand/20 bg-white px-4 py-2 text-sm text-brand/70 transition-colors hover:bg-cream/60 disabled:opacity-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
