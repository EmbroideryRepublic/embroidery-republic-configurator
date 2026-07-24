/**
 * Fortschrittsanzeige für die Kundenbestellansicht.
 *
 * Beantwortet die häufigste Kundenfrage — „wo steht meine Bestellung?" —
 * ohne dass jemand nachfragen muss. Server-Komponente: Der Zustand kommt aus
 * der Datenbank und ändert sich nicht durch Interaktion.
 *
 * Stornierte Bestellungen bekommen KEINEN Fortschritt: Dort ist der Ablauf
 * beendet, eine Kette mit abgebrochenem Verlauf wäre irreführend.
 */
import { Check } from 'lucide-react';
import {
  STATUS_KUNDENTEXT,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
  fortschrittIndex,
} from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' });
}

export function Bestellfortschritt({
  status,
  trackingNummer,
  versendetAm,
}: {
  status: OrderStatus;
  trackingNummer: string | null;
  versendetAm: string | null;
}) {
  if (status === 'cancelled') return null;

  const aktuell = fortschrittIndex(status);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">{STATUS_LABELS[status]}</h2>
      <p className="mt-1 text-sm text-gray-700">{STATUS_KUNDENTEXT[status]}</p>

      <ol className="mt-4 space-y-2">
        {STATUS_REIHENFOLGE.map((s, i) => {
          const erledigt = i < aktuell;
          const hier = i === aktuell;
          return (
            <li key={s} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                  erledigt
                    ? 'bg-brand text-white'
                    : hier
                      ? 'bg-gold text-white ring-2 ring-gold/30'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {erledigt ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={`text-sm ${hier ? 'font-medium text-gray-900' : erledigt ? 'text-gray-700' : 'text-gray-400'}`}
              >
                {STATUS_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {versendetAm && (
        <p className="mt-4 border-t border-gray-100 pt-3 text-sm text-gray-700">
          Versendet am {zeit(versendetAm)}
          {trackingNummer && (
            <>
              <br />
              <span className="text-gray-500">Sendungsnummer:</span>{' '}
              <span className="font-medium">{trackingNummer}</span>
            </>
          )}
        </p>
      )}
    </section>
  );
}
