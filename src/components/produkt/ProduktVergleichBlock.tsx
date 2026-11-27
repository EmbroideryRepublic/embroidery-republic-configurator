/**
 * „Im Vergleich“ und „Druckfläche je Größe“ auf der Produktseite (Server-Komponente, keine Interaktion).
 *
 * Alle Inhalte kommen aus lib/seo/produktVergleich.ts (Katalogdaten); hier wird nur dargestellt. Warum es den Block gibt und für welche
 * Seiten er gilt: config/seo/produktPilot.ts.
 */
import Link from 'next/link';
import type { ProductConfig } from '@/config/products/types';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { cm } from '@/lib/format';
import type { ProduktVergleich } from '@/lib/seo/produktVergleich';

interface Props {
  produkt: ProductConfig;
  vergleich: ProduktVergleich;
  /** Plural der Produktart, z. B. „Poloshirts“. */
  artPlural: string;
  /** Adresse der Kategorieseite der Art (indexierbar). */
  kategorieHref: string;
  /** Marken-Landingpage, falls es eine gibt. */
  markenHref?: string;
}

export function ProduktVergleichBlock({ produkt, vergleich, artPlural, kategorieHref, markenHref }: Props) {
  const { modelle, aussagen, druckflaechen } = vergleich;
  const erste = druckflaechen[0];
  const letzte = druckflaechen[druckflaechen.length - 1];

  return (
    <>
      <section className="mt-14 max-w-3xl" aria-labelledby="im-vergleich">
        <h2 id="im-vergleich" className="font-serif text-xl font-normal text-brand">
          {produkt.name} im Vergleich zu ähnlichen Modellen
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand/70">
          Die nächsten {artPlural} aus dem Sortiment, geordnet nach Stoffgewicht. Die Preise sind Textilpreise ab, ohne Veredelung – dieselben Werte wie auf den jeweiligen
          Produktseiten.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-brand/[0.08] bg-white">
          <table className="w-full min-w-[19rem] text-sm sm:min-w-[40rem]">
            <thead>
              <tr className="border-b border-brand/10 text-left text-xs uppercase tracking-wide text-brand/70">
                <th scope="col" className="px-3 py-3 font-medium sm:px-4">Modell</th>
                <th scope="col" className="px-2 py-3 font-medium sm:px-3">g/m²</th>
                <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Material</th>
                <th scope="col" className="px-2 py-3 font-medium sm:px-3">Farben</th>
                <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Größen</th>
                <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Zertifikate</th>
                <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">Ab</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {modelle.map((m, i) => (
                <tr key={m.id} className={`border-b border-brand/[0.06] last:border-0 ${i === 0 ? 'bg-gold-light/30' : ''}`}>
                  <th scope="row" className="px-3 py-3 text-left font-medium text-brand sm:px-4">
                    {i === 0 ? (
                      <>
                        {m.name}
                        <span className="block text-xs font-normal text-brand/70">{m.marke} · dieses Modell</span>
                      </>
                    ) : (
                      <Link href={`/produkt/${m.id}`} className="transition-colors hover:text-gold-dark">
                        {m.name}
                        <span className="block text-xs font-normal text-brand/70">{m.marke}</span>
                      </Link>
                    )}
                  </th>
                  <td className="px-2 py-3 text-brand/70 sm:px-3">{m.gewichtGsm ?? '–'}</td>
                  <td className="hidden px-3 py-3 text-brand/70 sm:table-cell">{m.material}</td>
                  <td className="px-2 py-3 text-brand/70 sm:px-3">{m.farben}</td>
                  <td className="hidden px-3 py-3 text-brand/70 sm:table-cell">{m.groessen}</td>
                  <td className="hidden px-3 py-3 text-brand/70 sm:table-cell">{m.zertifikate.length > 0 ? m.zertifikate.join(', ') : 'keine Angabe'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-brand/70 sm:px-4">
                    <WaehrungsPreis betragInEur={m.abPreis} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-brand/70 sm:hidden">
          Material, Größen und Zertifikate stehen auf größeren Bildschirmen in der Tabelle und für jedes Modell auf seiner Produktseite.
        </p>

        {aussagen.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand/70">
            {aussagen.map((a) => (
              <li key={a.id}>
                <Link href={`/produkt/${a.id}`} className="font-medium text-brand transition-colors hover:text-gold-dark">
                  {a.name}
                </Link>{' '}
                ({a.marke}): {a.satz}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href={kategorieHref} className="text-gold-dark underline-offset-2 hover:underline">
            Alle {artPlural} ansehen
          </Link>
          {markenHref && (
            <Link href={markenHref} className="text-gold-dark underline-offset-2 hover:underline">
              Alle Modelle von {produkt.brand}
            </Link>
          )}
        </p>
      </section>

      {druckflaechen.length > 0 && erste && letzte && (
        <section className="mt-14 max-w-3xl" aria-labelledby="druckflaeche-je-groesse">
          <h2 id="druckflaeche-je-groesse" className="font-serif text-xl font-normal text-brand">
            Druckfläche je Größe: {produkt.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand/70">
            Die größte DTF-Fläche wächst mit der Größe.
            {erste.vorne && letzte.vorne && erste.groesse !== letzte.groesse
              ? ` Vorne reicht sie von ${cm(erste.vorne.breiteCm)} Breite bei ${erste.groesse} bis ${cm(letzte.vorne.breiteCm)} bei ${letzte.groesse}.`
              : ''}{' '}
            Ein kleines Brustlogo passt auf jede Größe; bei großen Motiven lohnt der Blick auf die Größe, weil die Fläche bei kleineren Größen schmaler ist.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-brand/[0.08] bg-white">
            <table className="w-full min-w-[19rem] text-xs sm:min-w-[30rem] sm:text-sm">
              <thead>
                <tr className="border-b border-brand/10 text-left text-xs uppercase tracking-wide text-brand/70">
                  <th scope="col" className="px-3 py-3 font-medium sm:px-4">Größe</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Breite des Teils</th>
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">Vorne, max.</th>
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">Hinten, max.</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">Anteil vorne</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {druckflaechen.map((z) => (
                  <tr key={z.groesse} className="border-b border-brand/[0.06] last:border-0">
                    <th scope="row" className="px-3 py-3 text-left font-medium text-brand sm:px-4">{z.groesse}</th>
                    <td className="hidden px-3 py-3 text-brand/70 sm:table-cell">{z.kleidungBreiteCm ? cm(z.kleidungBreiteCm) : '–'}</td>
                    <td className="px-2 py-3 text-brand/70 sm:whitespace-nowrap sm:px-3">{z.vorne ? `${cm(z.vorne.breiteCm)} × ${cm(z.vorne.hoeheCm)}` : '–'}</td>
                    <td className="px-2 py-3 text-brand/70 sm:whitespace-nowrap sm:px-3">{z.hinten ? `${cm(z.hinten.breiteCm)} × ${cm(z.hinten.hoeheCm)}` : '–'}</td>
                    <td className="px-3 py-3 text-right text-brand/70 sm:px-4">{z.anteilBreiteProzent ? `${z.anteilBreiteProzent} %` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-brand/70">
            Breite × Höhe in Zentimetern; Nähte, Kragen und Saum sind abgezogen. „Anteil vorne“ ist die größte Breite der Frontfläche im Verhältnis zur flach gemessenen
            Breite des Kleidungsstücks. Welche Fläche du nutzt, legst du im Konfigurator fest.
          </p>
        </section>
      )}
    </>
  );
}
