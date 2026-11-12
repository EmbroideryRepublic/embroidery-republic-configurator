/**
 * Linkblock der Fußzeile: Sortiment, Anlässe & Ratgeber und Marken – auf JEDER Seite.
 *
 * Warum: Die Kategorie-, Marken-, Anlass- und Ratgeberseiten (config/seo/*) sind die indexierbaren Einstiege für Suchanfragen.
 * Bisher führte nur die Startseite zu ihnen; die Fußzeile verlinkt sie jetzt von jeder Seite aus (Search Console 2026-11-12:
 * 139 von 166 Seiten „gefunden, aber nicht indexiert“ – interne Verlinkung ist der Hebel, den wir selbst in der Hand haben).
 * Die Linktexte benennen, wohin sie führen, wie die Seitentitel.
 *
 * Reine Server-Komponente, die Listen kommen aus den Registern: Eine neue Seite erscheint hier von selbst.
 */
import Link from 'next/link';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { produktTypLabelPlural } from '@/config/products/types';

const UEBERSCHRIFT_KLASSE = 'mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand/70';
const LINK_KLASSE = 'inline-block py-2 text-xs text-brand/70 transition-colors hover:text-gold-dark lg:py-0.5';

interface Eintrag {
  slug: string;
  label: string;
}

export function FooterSeoLinks() {
  const sortiment: Eintrag[] = [
    ...KATEGORIE_SEITEN.map((s) => ({ slug: s.slug, label: produktTypLabelPlural(s.art) })),
    ...DTF_SEITEN.filter((s) => s.art).map((s) => ({ slug: s.slug, label: produktTypLabelPlural(s.art!) })),
  ];
  const anlaesse: Eintrag[] = ANLASS_SEITEN.map((s) => ({ slug: s.slug, label: s.kurzname }));
  const marken: Eintrag[] = DTF_SEITEN.filter((s) => s.marke).map((s) => ({ slug: s.slug, label: s.marke! }));

  const spalten: { ueberschrift: string; eintraege: Eintrag[] }[] = [
    { ueberschrift: 'Sortiment', eintraege: sortiment },
    { ueberschrift: 'Anlässe & Ratgeber', eintraege: anlaesse },
    { ueberschrift: 'Marken', eintraege: marken },
  ];

  return (
    <nav
      aria-label="Sortiment, Anlässe und Marken"
      className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 border-t border-gold/10 pt-8 sm:grid-cols-3"
    >
      {spalten.map((s) => (
        <div key={s.ueberschrift}>
          <p className={UEBERSCHRIFT_KLASSE}>{s.ueberschrift}</p>
          <ul className="flex flex-col">
            {s.eintraege.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className={LINK_KLASSE}>
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
