/**
 * Berechnete Tabellen der Ratgeberseiten „Größentabelle“ und „Stoffgewicht“ (lib/seo/katalogAuswertung.ts):
 * Herstellermaße und Gewichtsklassen kommen aus dem Katalog, nicht aus dem Text.
 */
import Link from 'next/link';
import { zahl } from '@/lib/format';
import { gewichtsUebersicht, groessenTabelle, markeUndName, type TabellenArt } from '@/lib/seo/katalogAuswertung';
import { produktTypLabelPlural } from '@/config/products/types';

const TABELLE = 'mt-8 overflow-x-auto rounded-[24px] border border-brand/[0.08] bg-white';
const TH = 'px-4 py-4 text-left text-[13px] font-medium text-brand/70 sm:px-6';
const ZEILE = 'divide-y divide-brand/[0.06]';

export function GroessenTabelleBlock({ art }: { art: TabellenArt }) {
  const t = groessenTabelle(art);
  return (
    <>
      <div className={TABELLE}>
        <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
          <caption className="sr-only">
            Größentabelle {produktTypLabelPlural(art)}: Brustbreite × Länge in Zentimetern je Größe und Beispielmodell
          </caption>
          <thead>
            <tr className="border-b border-brand/[0.08]">
              <th scope="col" className={TH}>
                Größe
              </th>
              {t.modelle.map((m) => (
                <th key={m.id} scope="col" className={TH}>
                  <Link href={`/produkt/${m.id}`} className="text-gold-dark underline underline-offset-2 hover:text-gold">
                    {markeUndName(m)}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={ZEILE}>
            {t.groessen.map((g) => (
              <tr key={g}>
                <th scope="row" className="px-4 py-4 font-medium text-brand sm:px-6">
                  {g}
                </th>
                {t.modelle.map((m) => (
                  <td key={m.id} className="px-4 py-4 tabular-nums text-brand/80 sm:px-6">
                    {zahl(m.masse[g]!.breiteCm)} × {zahl(m.masse[g]!.laengeCm)} cm
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-brand/70">
        Brustbreite × Länge in Zentimetern, Herstellerangaben. Passform: {t.modelle.map((m) => `${markeUndName(m)} – ${m.passform}`).join(' · ')}.
      </p>
    </>
  );
}

export function GewichtsKlassenBlock({ art }: { art: TabellenArt }) {
  const u = gewichtsUebersicht(art);
  return (
    <>
      <p className="mt-5 text-[16px] leading-relaxed text-brand/70">
        {u.gesamt} {produktTypLabelPlural(art)} mit Gewichtsangabe, von {zahl(u.min, 0)} bis {zahl(u.max, 0)} g/m².
      </p>
      <div className={TABELLE}>
        <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
          <caption className="sr-only">Gewichtsklassen der {produktTypLabelPlural(art)} mit Beispielmodellen</caption>
          <thead>
            <tr className="border-b border-brand/[0.08]">
              <th scope="col" className={TH}>
                Stoffgewicht
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Modelle
              </th>
              <th scope="col" className={TH}>
                Beispiele
              </th>
            </tr>
          </thead>
          <tbody className={ZEILE}>
            {u.klassen
              .filter((k) => k.anzahl > 0)
              .map((k) => (
              <tr key={k.band.label}>
                <th scope="row" className="px-4 py-4 font-medium text-brand sm:px-6">
                  {k.band.label}
                </th>
                <td className="px-4 py-4 text-right tabular-nums text-brand/80 sm:px-6">{k.anzahl}</td>
                <td className="px-4 py-4 text-brand/80 sm:px-6">
                  {k.beispiele.length === 0 ? (
                    '–'
                  ) : (
                    <ul className="space-y-1">
                      {k.beispiele.map((b) => (
                        <li key={b.id}>
                          <Link href={`/produkt/${b.id}`} className="text-gold-dark underline underline-offset-2 hover:text-gold">
                            {markeUndName(b)}
                          </Link>{' '}
                          <span className="tabular-nums text-brand/70">({b.gewicht} g/m²)</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
