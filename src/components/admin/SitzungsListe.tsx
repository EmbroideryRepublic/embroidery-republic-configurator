'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { widerrufeSitzungAction, beendeAlleSitzungenAction } from '@/lib/actions/admin';
import type { SitzungsUebersicht } from '@/lib/admin/auth';
import { formatiereZeitpunkt } from '@/lib/format';

function zeit(iso: string): string {
  return formatiereZeitpunkt(iso);
}

export function SitzungsListe({ sitzungen }: { sitzungen: SitzungsUebersicht[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function widerrufen(id: string) {
    startTransition(async () => {
      await widerrufeSitzungAction(id);
      router.refresh();
    });
  }

  function alleBeenden() {
    if (!window.confirm('Wirklich ALLE Admin-Sitzungen beenden – auch die eigene?')) return;
    startTransition(async () => {
      await beendeAlleSitzungenAction();
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={alleBeenden}
          disabled={pending}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Alle Sitzungen beenden
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="pb-2">Angemeldet seit</th>
            <th className="pb-2">Letzter Zugriff</th>
            <th className="pb-2">Läuft ab</th>
            <th className="pb-2">Herkunft</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {sitzungen.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-2">{zeit(s.erstelltAm)}</td>
              <td className="py-2">{zeit(s.letzterZugriff)}</td>
              <td className="py-2">{zeit(s.laeuftAbAm)}</td>
              <td className="py-2 text-gray-500">{s.herkunft ?? '–'}</td>
              <td className="py-2 text-right">
                {s.aktuelle ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">diese Sitzung</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => widerrufen(s.id)}
                    disabled={pending}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    beenden
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sitzungen.length === 0 && <p className="text-sm text-gray-500">Keine aktiven Sitzungen.</p>}
    </div>
  );
}
