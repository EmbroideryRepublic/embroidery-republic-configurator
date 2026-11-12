/**
 * Die zwei Veredelungsverfahren als Kartenpaar – geteilt von Startseite und
 * Produktseite, damit die Darstellung nicht auseinanderläuft.
 *
 * Die Kurzbeschreibung (`claim`) ist wortgleich mit dem Methodenwähler des
 * Konfigurators (i18n: method_dtf_desc / method_embroidery_desc). Die Merkmale
 * sind allgemeingültige Eigenschaften der Verfahren, keine Werbeversprechen.
 */
import { Check, Scissors, Shirt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import { HINWEIS_STICKEREI_PAUSIERT, KARTE_STICKEREI_PAUSIERT } from '@/config/seo/kategorieSeiten';

interface Verfahren {
  icon: LucideIcon;
  titel: string;
  claim: string;
  punkte: string[];
}

const VERFAHREN: Verfahren[] = [
  {
    icon: Shirt,
    titel: 'DTF-Transferdruck',
    claim: 'Vollfarbig, ideal für große Motive & Farbverläufe',
    punkte: [
      'Fotorealistische Motive und weiche Farbverläufe',
      'Auch für große Flächen geeignet',
      'Flexibler Griff, der sich mit dem Stoff bewegt',
    ],
  },
  {
    icon: Scissors,
    titel: 'Stickerei',
    claim: 'Hochwertig & langlebig, ideal für Firmenlogos',
    punkte: [
      'Edler, erhabener Auftritt aus echtem Garn',
      'Besonders langlebig und waschbeständig',
      'Ideal für Logos, Monogramme und Schriftzüge',
    ],
  },
];

export function Veredelungsverfahren() {
  // Betreiberschalter (config/bestellweg.ts): Ist die Stickerei pausiert, sagt die Karte das, statt zwei gleichwertige Verfahren
  // zu versprechen. Wird sie wieder angeboten, verschwindet der Hinweis beim nächsten Deploy von selbst.
  const stickereiVerfuegbar = veredelungVerfuegbar('embroidery');
  return (
    <>
      {!stickereiVerfuegbar && (
        <p
          role="note"
          className="mb-6 max-w-3xl rounded-2xl border border-gold/30 bg-white px-5 py-4 text-[15px] leading-relaxed text-brand"
        >
          <strong className="font-semibold">Hinweis:</strong> {HINWEIS_STICKEREI_PAUSIERT}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
      {VERFAHREN.map((v) => {
        const Icon = v.icon;
        const pausiert = v.icon === Scissors && !stickereiVerfuegbar;
        return (
          <div
            key={v.titel}
            className={`rounded-[24px] border border-brand/[0.08] bg-white p-8 transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(43,36,28,0.35)] sm:p-10 ${pausiert ? 'opacity-70' : ''}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-6 font-serif text-[24px] font-normal text-brand">{v.titel}</h3>
            {pausiert && (
              <p className="mt-2 inline-block rounded-full bg-brand/[0.06] px-3 py-1 text-[12px] font-medium text-brand/70">
                {KARTE_STICKEREI_PAUSIERT}
              </p>
            )}
            <p className="mt-2 text-[15px] leading-relaxed text-brand/70">{v.claim}</p>
            <ul className="mt-6 space-y-3 border-t border-brand/[0.06] pt-6">
              {v.punkte.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[14px] leading-relaxed text-brand/70">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-dark" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      </div>
    </>
  );
}
