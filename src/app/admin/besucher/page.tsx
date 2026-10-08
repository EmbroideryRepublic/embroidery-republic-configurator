/**
 * Admin: Besucherauswertung – wie viele Menschen die öffentliche Website
 * aufrufen, welche Seiten sie sehen und über welche gekennzeichneten Links sie
 * kommen. Datenquelle: eigener, cookieloser Zähler (Migration 0037,
 * lib/besuch/*). Herleitung, Datenschutz und Grenzen: docs/besucherzaehler.md.
 */
import { istAdmin } from '@/lib/admin/auth';
import { ladeBesuchsstatistik, type BesuchTag } from '@/lib/besuch/statistik';
import { achsenSkala, anteilText, kurzesDatum, langesDatum, seitenName } from '@/lib/besuch/anzeige';
import { BESUCH_QUELLEN, quellenName } from '@/config/besuch';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { zahl } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Kanäle, für die die Seite fertige Links zum Kopieren zeigt. */
const LINK_BEISPIELE = ['instagram', 'gbp', 'qr', 'flyer', 'newsletter'] as const;

function Kennzahl({ label, wert, unterzeile }: { label: string; wert: string; unterzeile?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{wert}</p>
      {unterzeile && <p className="mt-0.5 text-xs text-gray-500">{unterzeile}</p>}
    </div>
  );
}

/** Besucher je Tag als Balken; der heutige (noch laufende) Tag ist heller. */
function Verlauf({ tage }: { tage: BesuchTag[] }) {
  const erster = tage[0]!;
  const letzter = tage[tage.length - 1]!;
  const spitze = tage.reduce((a, b) => (b.besucher > a.besucher ? b : a), erster);
  const skala = achsenSkala(spitze.besucher);
  const beschreibung =
    spitze.besucher > 0
      ? `Balkendiagramm: Besucher pro Tag vom ${langesDatum(erster.tag)} bis ${langesDatum(letzter.tag)}. ` +
        `Höchster Wert: ${spitze.besucher} am ${langesDatum(spitze.tag)}. Alle Werte stehen in der Tabelle darunter.`
      : `Balkendiagramm: Im Zeitraum ${langesDatum(erster.tag)} bis ${langesDatum(letzter.tag)} wurden noch keine Besucher gezählt.`;

  return (
    <div>
      <figure role="img" aria-label={beschreibung} className="m-0">
        <div className="flex gap-2">
          <div className="relative h-40 w-8 flex-shrink-0 text-right text-[10px] tabular-nums text-gray-400" aria-hidden="true">
            {skala.marken.map((marke) => (
              <span
                key={marke}
                className="absolute right-0 translate-y-1/2 leading-none"
                style={{ bottom: `${(marke / skala.obergrenze) * 100}%` }}
              >
                {marke}
              </span>
            ))}
          </div>
          <div className="relative h-40 flex-1 border-b border-gray-300" aria-hidden="true">
            {skala.marken
              .filter((marke) => marke > 0)
              .map((marke) => (
                <div
                  key={marke}
                  className="absolute inset-x-0 h-px bg-gray-100"
                  style={{ bottom: `${(marke / skala.obergrenze) * 100}%` }}
                />
              ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {tage.map((t, i) => (
                <div
                  key={t.tag}
                  className="flex h-full flex-1 items-end"
                  title={`${langesDatum(t.tag)}: ${t.besucher} Besucher, ${t.aufrufe} Seitenaufrufe${i === tage.length - 1 ? ' (Tag läuft noch)' : ''}`}
                >
                  <div
                    className={`w-full rounded-t-sm ${i === tage.length - 1 ? 'bg-gold/50' : 'bg-gold'}`}
                    style={{ height: `${(t.besucher / skala.obergrenze) * 100}%`, minHeight: t.besucher > 0 ? '2px' : 0 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <figcaption className="ml-10 mt-1 flex justify-between text-[10px] text-gray-400" aria-hidden="true">
          <span>{kurzesDatum(erster.tag)}</span>
          <span>heute, {kurzesDatum(letzter.tag)} (Tag läuft noch)</span>
        </figcaption>
      </figure>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-800">Zahlen als Tabelle anzeigen</summary>
        <div className="mt-2 max-h-72 overflow-auto rounded border border-gray-200">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-1.5">Tag</th>
                <th className="whitespace-nowrap px-3 py-1.5 text-right">Besucher</th>
                <th className="whitespace-nowrap px-3 py-1.5 text-right">Seitenaufrufe</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[...tage].reverse().map((t) => (
                <tr key={t.tag} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-1.5 text-gray-600">{langesDatum(t.tag)}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">{zahl(t.besucher, 0)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">{zahl(t.aufrufe, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default async function AdminBesucherPage() {
  // Eigene Prüfung wie bei allen Admin-Seiten (siehe app/admin/page.tsx).
  if (!(await istAdmin())) return null;
  const s = await ladeBesuchsstatistik();
  const basis = kanonischeBasisUrl();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Besucher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Wie viele Menschen die öffentliche Website aufrufen – gezählt ohne Cookies und ohne gespeicherte
          IP-Adressen. Roboter, Sie selbst (solange Sie hier angemeldet sind) und Besucher mit „Do Not Track“ zählen
          nicht mit.
        </p>
      </div>

      {s === null ? (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Die Besucherzahlen konnten nicht geladen werden.</p>
          <p className="mt-1">
            Wahrscheinlichste Ursache: Die Datenbank-Migration <code>0037_besuchszaehler.sql</code> ist noch nicht
            eingespielt. Sonst ist die Datenbank gerade nicht erreichbar – Näheres steht im Server-Protokoll.
            Anleitung: <code>docs/besucherzaehler.md</code>.
          </p>
        </div>
      ) : (
        <>
          {s.ersterTagMitDaten === null && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Noch keine Besuche gezählt.</p>
              <p className="mt-1">
                Die Zählung beginnt mit dem Tag, an dem diese Version online geht – für davor gibt es keine Zahlen.
                Aufrufe aus der Entwicklung und von Vorschau-Adressen (<code>*.vercel.app</code>) werden bewusst nicht
                gezählt, damit die Zahlen nur echte Besucher zeigen.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kennzahl label="Heute" wert={zahl(s.heute.besucher, 0)} unterzeile={`${zahl(s.heute.aufrufe, 0)} Seitenaufrufe · Tag läuft noch`} />
            <Kennzahl label="Gestern" wert={zahl(s.gestern.besucher, 0)} unterzeile={`${zahl(s.gestern.aufrufe, 0)} Seitenaufrufe`} />
            <Kennzahl label="Letzte 7 Tage" wert={zahl(s.letzte7.besucher, 0)} unterzeile={`${zahl(s.letzte7.aufrufe, 0)} Seitenaufrufe`} />
            <Kennzahl
              label="Letzte 30 Tage"
              wert={zahl(s.letzte30.besucher, 0)}
              unterzeile={`${zahl(s.letzte30.aufrufe, 0)} Seitenaufrufe${
                s.seitenProBesuch === null ? '' : ` · Ø ${zahl(s.seitenProBesuch, 1)} je Besuch`
              }`}
            />
          </div>
          <p className="-mt-3 text-xs text-gray-500">
            Besucher = verschiedene Geräte pro Tag. Wer an zwei Tagen kommt, zählt zweimal – die Werte für 7 und 30 Tage
            sind deshalb Summen der Tageswerte, keine verschiedenen Personen.
          </p>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Besucher pro Tag (letzte {s.tage.length} Tage)</h2>
            <Verlauf tage={s.tage} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Meistbesuchte Seiten (30 Tage)</h2>
              {s.seiten.length === 0 ? (
                <p className="text-sm text-gray-500">Noch keine Seitenaufrufe.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="py-1.5 pr-3">Seite</th>
                        <th className="whitespace-nowrap px-3 py-1.5 text-right">Aufrufe</th>
                        <th className="py-1.5 pl-3 text-right">Anteil</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {s.seiten.map((seite) => (
                        <tr key={seite.pfad} className="border-b border-gray-100 last:border-0">
                          <td className="break-words py-1.5 pr-3 text-gray-700">{seitenName(seite.pfad)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right">{zahl(seite.aufrufe, 0)}</td>
                          <td className="whitespace-nowrap py-1.5 pl-3 text-right text-gray-500">{anteilText(seite.aufrufe, s.letzte30.aufrufe)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Woher kommen die Besucher? (30 Tage)</h2>
              {s.quellen.length === 0 ? (
                <p className="text-sm text-gray-500">Noch keine Besucher.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="py-1.5 pr-3">Quelle</th>
                        <th className="whitespace-nowrap px-3 py-1.5 text-right">Besucher</th>
                        <th className="py-1.5 pl-3 text-right">Anteil</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {s.quellen.map((q) => (
                        <tr key={q.quelle} className="border-b border-gray-100 last:border-0">
                          <td className="py-1.5 pr-3 text-gray-700">{quellenName(q.quelle)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right">{zahl(q.besucher, 0)}</td>
                          <td className="whitespace-nowrap py-1.5 pl-3 text-right text-gray-500">{anteilText(q.besucher, s.letzte30.besucher)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Die Herkunft ist nur bei <strong>gekennzeichneten Links</strong> bekannt (siehe unten). „Ohne
                Kennzeichnung“ sind Suchmaschinen, direkt eingegebene Adressen, Lesezeichen und Verweise anderer Seiten.
                Wie viele über Google kommen und mit welchen Suchbegriffen, zeigt die Google Search Console unter
                „Leistung“.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Links kennzeichnen – dann sehen Sie, was wirkt</h2>
        <p className="mt-1 text-sm text-gray-600">
          Hängen Sie <code>?utm_source=</code> und einen Kanalnamen an jeden Link, den Sie verteilen. Jeder, der darüber
          kommt, erscheint oben unter diesem Kanal. Zum Kopieren (ein Klick markiert den ganzen Link):
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {LINK_BEISPIELE.map((quelle) => (
            <li key={quelle} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-56 flex-shrink-0 text-gray-500">{quellenName(quelle)}</span>
              <code className="select-all break-all rounded bg-gray-50 px-2 py-1 text-xs text-gray-800">
                {basis}/?utm_source={quelle}
              </code>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Das gilt für jede Seite der Website, z. B. <code>{basis}/produkt?utm_source=instagram</code>. Erlaubte
          Kanalnamen: {BESUCH_QUELLEN.join(', ')}. Alles andere wird als „Sonstige Kennzeichnung“ gezählt.
        </p>
      </div>

      <details className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <summary className="cursor-pointer font-semibold text-gray-800">So wird gezählt – und was die Zahlen nicht können</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Ein <strong>Besucher</strong> ist eine Kombination aus Netzwerkadresse und Browser pro Tag. Mehrere
            Seitenaufrufe am selben Tag sind ein Besucher, aber mehrere Seitenaufrufe.
          </li>
          <li>
            Es gibt <strong>keine Wiedererkennung über Tage</strong> – das ist Absicht (Datenschutz). Darum sind die
            Zahlen für 7 und 30 Tage Summen von Tageswerten.
          </li>
          <li>
            <strong>Ø je Besuch</strong> (bei „Letzte 30 Tage“) sind die Seitenaufrufe geteilt durch die Besucher. Ein
            Wert über 1 heißt: Besucher schauen sich weitere Seiten an; bei 1 verlassen die meisten die Seite sofort.
          </li>
          <li>
            Zwei Personen hinter derselben Netzwerkadresse (Büro, Mobilfunk) mit gleichem Browser können als einer
            zählen; eine Person mit Handy <em>und</em> Computer zählt zweimal. Die Zahl ist eine gute Größenordnung,
            keine exakte Personenzahl.
          </li>
          <li>
            <strong>Nicht gezählt</strong> werden Roboter und Suchmaschinen-Abrufe, Besucher mit „Do Not Track“ oder
            „Global Privacy Control“, Vorab-Laden durch den Browser, Sie selbst (solange Ihr Browser die
            Admin-Anmeldung trägt) und alles außerhalb der echten Domain (Entwicklung, Vorschau-Adressen).
          </li>
          <li>
            Gespeichert werden nur <strong>Zahlen</strong>. Die Tageskennung, die zum Unterscheiden der Besucher dient,
            ist ein Hashwert ohne IP-Adresse und wird nach Tagesende gelöscht.
          </li>
          <li>
            Die Seite nutzt keine Cookies und keinen lokalen Speicher für die Zählung. Ein Browser mit
            Blockierliste kann die Meldung dennoch unterdrücken – die Zahlen sind eher zu niedrig als zu hoch.
          </li>
        </ul>
      </details>
    </section>
  );
}
