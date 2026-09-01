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
import { formatiereZeitpunkt } from '@/lib/format';

function zeit(iso: string): string {
  return formatiereZeitpunkt(iso, { dateStyle: 'long', timeStyle: 'short' });
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
    <section className="rounded-lg border border-brand/[0.08] bg-white p-4">
      <h2 className="text-sm font-semibold text-brand">{STATUS_LABELS[status]}</h2>
      <p className="mt-1 text-sm text-brand/70">{STATUS_KUNDENTEXT[status]}</p>

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
                      : 'bg-brand/[0.06] text-brand/40'
                }`}
              >
                {erledigt ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={`text-sm ${hier ? 'font-medium text-brand' : erledigt ? 'text-brand/70' : 'text-brand/40'}`}
              >
                {STATUS_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {versendetAm && (
        <p className="mt-4 border-t border-brand/[0.06] pt-3 text-sm text-brand/70">
          Versendet am {zeit(versendetAm)}
          {trackingNummer && (
            <>
              <br />
              <span className="text-brand/50">Sendungsnummer:</span>{' '}
              <span className="font-medium">{trackingNummer}</span>
            </>
          )}
        </p>
      )}
    </section>
  );
}
