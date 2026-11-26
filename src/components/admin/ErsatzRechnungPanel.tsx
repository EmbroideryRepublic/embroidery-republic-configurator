'use client';

/**
 * Ersatzrechnung nach einer Auftragsänderung – Stand und Wiederholung.
 *
 * Zeigt zweierlei, jeweils nur, wenn es etwas zu zeigen gibt:
 *
 *  1. FEHLT die neue Rechnung (die Änderung ist gespeichert, die Erzeugung ist
 *     gescheitert oder ausgeblieben), steht hier deutlich „Neue Rechnung fehlt“
 *     mit der Schaltfläche „Neue Rechnung erzeugen“. Ob eine aussteht, leitet die
 *     Seite aus der Historie ab (orderEdit.ts::ermittleAusstehendeErsetzung); die
 *     Aktion tut es serverseitig noch einmal – der Browser nennt keine
 *     Rechnungsnummer. Ein zweiter Klick erzeugt keine zweite Rechnung: Die
 *     Nummer ist pro abgelöster Rechnung nur EINMAL vergeben (Migration 0039).
 *
 *  2. Bereits ERSETZTE Rechnungen: „Rechnung RE-… ersetzt RE-…“ mit Download
 *     beider PDFs. Die alte Rechnung verschwindet nicht.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { erzeugeErsatzrechnungNeu } from '@/lib/actions/orderEditActions';
import type { AdminInvoiceHistoryRow } from '@/lib/admin/data';
import { formatiereDatum } from '@/lib/format';

export function ErsatzRechnungPanel({
  orderId,
  ausstehend,
  kundenEmailVorhanden,
  aktuelleRechnung,
  historie,
}: {
  orderId: string;
  /** Welche Rechnung noch ersetzt werden muss; null = nichts offen. */
  ausstehend: { alteNummer: string; kundenmailVorgesehen: boolean } | null;
  kundenEmailVorhanden: boolean;
  aktuelleRechnung: { nummer: string | null; datum: string | null; pdfUrl: string | null };
  historie: AdminInvoiceHistoryRow[];
}) {
  const router = useRouter();
  const [mailSenden, setMailSenden] = useState(Boolean(ausstehend?.kundenmailVorgesehen) && kundenEmailVorhanden);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  const abgeschlossen = historie.filter((h) => h.status === 'completed');
  if (!ausstehend && abgeschlossen.length === 0 && !meldung) return null;

  // Nummer → PDF-Adresse, damit jede Zeile „X ersetzt Y“ beide Dateien verlinken kann.
  const pdfJeNummer = new Map<string, string>();
  for (const h of historie) if (h.altePdfUrl) pdfJeNummer.set(h.alteNummer, h.altePdfUrl);
  if (aktuelleRechnung.nummer && aktuelleRechnung.pdfUrl) pdfJeNummer.set(aktuelleRechnung.nummer, aktuelleRechnung.pdfUrl);
  const datumJeNummer = new Map<string, string | null>();
  for (const h of historie) {
    datumJeNummer.set(h.alteNummer, h.altesDatum);
    datumJeNummer.set(h.neueNummer, h.neuesDatum);
  }

  function erzeugen() {
    starte(async () => {
      const r = await erzeugeErsatzrechnungNeu(orderId, mailSenden);
      setMeldung({ ok: r.ok, text: r.meldung });
      router.refresh();
    });
  }

  return (
    <div className={`rounded-lg border p-4 ${ausstehend ? 'border-red-300 bg-red-50/60' : 'border-gray-200 bg-white'}`}>
      <h2 className={`text-sm font-semibold ${ausstehend ? 'text-red-900' : 'text-gray-900'}`}>Ersatzrechnung</h2>

      {ausstehend && (
        <>
          <p className="mt-1 text-sm font-medium text-red-900">
            Neue Rechnung fehlt – bitte erneut erzeugen.
          </p>
          <p className="mt-1 text-xs text-red-800">
            Die Auftragsänderung ist gespeichert, die ersetzende Rechnung ist aber noch nicht da. Bis dahin gilt die Rechnung{' '}
            <strong>{ausstehend.alteNummer}</strong> für den ALTEN Stand. Ein erneuter Versuch verbraucht keine zweite
            Rechnungsnummer und erzeugt nie zwei neue Rechnungen für dieselbe Änderung.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              className="mt-1"
              checked={mailSenden && kundenEmailVorhanden}
              disabled={laeuft || !kundenEmailVorhanden}
              onChange={(e) => setMailSenden(e.target.checked)}
            />
            <span>
              {kundenEmailVorhanden
                ? 'Die neue Rechnung nach dem Erzeugen per Mail an die Kundschaft schicken (PDF im Anhang)'
                : 'Keine E-Mail-Adresse hinterlegt – die Rechnung steht danach zum Download bereit.'}
            </span>
          </label>
          <button
            type="button"
            onClick={erzeugen}
            disabled={laeuft}
            className="mt-3 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {laeuft ? 'Wird erzeugt …' : 'Neue Rechnung erzeugen'}
          </button>
        </>
      )}

      {meldung && (
        <p
          role="status"
          className={`mt-3 rounded px-3 py-2 text-sm ${meldung.ok ? 'bg-green-50 text-green-800' : 'bg-white text-red-800'}`}
        >
          {meldung.text}
        </p>
      )}

      {abgeschlossen.length > 0 && (
        <ul className={`${ausstehend ? 'mt-4 border-t border-red-200 pt-3' : 'mt-2'} space-y-2`}>
          {abgeschlossen.map((h) => {
            const neueUrl = pdfJeNummer.get(h.neueNummer);
            const alteUrl = pdfJeNummer.get(h.alteNummer);
            return (
              <li key={h.alteNummer} className="rounded border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm text-gray-800">
                <p>
                  Rechnung <strong>{h.neueNummer}</strong>
                  {datumJeNummer.get(h.neueNummer) ? ` vom ${formatiereDatum(datumJeNummer.get(h.neueNummer)!)}` : ''} ersetzt Rechnung{' '}
                  <strong>{h.alteNummer}</strong>
                  {h.altesDatum ? ` vom ${formatiereDatum(h.altesDatum)}` : ''}.
                </p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                  {neueUrl ? (
                    <a href={neueUrl} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                      PDF der neuen Rechnung ↗
                    </a>
                  ) : (
                    <span className="text-gray-400">PDF der neuen Rechnung nicht abrufbar</span>
                  )}
                  {alteUrl ? (
                    <a href={alteUrl} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                      PDF der ersetzten Rechnung ↗
                    </a>
                  ) : (
                    <span className="text-gray-400">PDF der ersetzten Rechnung nicht abrufbar</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
