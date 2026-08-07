/**
 * Systemereignisse-Übersicht. Die Abfragen (`letzteEreignisse`, `haeufungen`)
 * existierten bereits (docs/betriebsbeobachtung.md, docs/go-live-checkliste.md:
 * "Abfragen fertig, Auswertung im Adminbereich offen") – diese Seite ist die
 * fehlende Anzeige.
 */
import { istAdmin } from '@/lib/admin/auth';
import { haeufungen, letzteEreignisse } from '@/lib/observability/ereignis';

export const dynamic = 'force-dynamic';

const SCHWERE_STYLE: Record<string, string> = {
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  ERROR: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
};

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function AdminEreignissePage() {
  if (!(await istAdmin())) return null;
  const [ereignisse, haeufungenListe] = await Promise.all([letzteEreignisse(100), haeufungen(1)]);

  const auffaellig = haeufungenListe.filter((h) => h.faktor >= 2 && h.anzahlAktuell >= 3);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Systemereignisse</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kritische Betriebsereignisse ab WARNING, beantwortet &bdquo;seit wann?&ldquo; und &bdquo;häuft sich das?&ldquo;.
          90 Tage Aufbewahrung (automatisches Aufräumen über die Cron-Route).
        </p>
      </div>

      {auffaellig.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-red-800">Auffällige Häufungen (letzte Stunde)</h2>
          <ul className="space-y-1 text-sm text-red-700">
            {auffaellig.map((h, i) => (
              <li key={i}>
                <strong>{h.kategorie}</strong> · {h.ereignis} ({h.schwere}): {h.anzahlAktuell}× in der letzten
                Stunde, {h.faktor}× über dem 7-Tage-Schnitt ({h.schnittJeStunde}/h)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Letzte 100 Ereignisse</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-2">Zeit</th>
              <th className="pb-2">Schwere</th>
              <th className="pb-2">Kategorie</th>
              <th className="pb-2">Ereignis</th>
              <th className="pb-2">Meldung</th>
              <th className="pb-2">Bestellung</th>
            </tr>
          </thead>
          <tbody>
            {ereignisse.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
                <td className="whitespace-nowrap py-2 text-gray-500">{zeit(e.zeit)}</td>
                <td className="py-2">
                  <span className={`rounded border px-1.5 py-0.5 text-xs ${SCHWERE_STYLE[e.schwere] ?? 'border-gray-200 text-gray-600'}`}>
                    {e.schwere}
                  </span>
                </td>
                <td className="py-2 text-gray-600">{e.kategorie}</td>
                <td className="py-2 font-medium">{e.ereignis}</td>
                <td className="py-2 text-gray-500">{e.meldung ?? '–'}</td>
                <td className="py-2 text-gray-500">{e.bestellnummer ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ereignisse.length === 0 && <p className="text-sm text-gray-500">Keine Ereignisse ab WARNING – guter Zustand.</p>}
      </div>
    </section>
  );
}
