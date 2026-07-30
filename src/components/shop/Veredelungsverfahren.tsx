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
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {VERFAHREN.map((v) => {
        const Icon = v.icon;
        return (
          <div
            key={v.titel}
            className="rounded-[24px] border border-brand/[0.08] bg-white p-8 transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(43,36,28,0.35)] sm:p-10"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-6 font-serif text-[24px] font-normal text-brand">{v.titel}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-brand/55">{v.claim}</p>
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
  );
}
