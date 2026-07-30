/**
 * Katalogübersicht mit Filterung.
 *
 * ── Serverseitig gefiltert ────────────────────────────────────────────
 * Die Kriterien kommen aus der Adresszeile, gefiltert und sortiert wird auf
 * dem Server. Die Filterbausteine schreiben nur die Adresse fort – dadurch
 * sind geteilte Links, Lesezeichen und ein Neuladen ohne Zusatzaufwand
 * korrekt.
 *
 * ── Suchmaschinen ─────────────────────────────────────────────────────
 * Die ungefilterte Übersicht ist indexierbar. JEDE gefilterte Ansicht wird
 * auf `noindex, follow` gesetzt: Die Kombinationen aus acht Dimensionen
 * ergeben beliebig viele Adressen mit fast gleichem Inhalt – das gehört
 * nicht in den Index. Die Produktseiten bleiben die SEO-Träger.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { PRODUCTS } from '@/config/products';
import { ShopFilter } from '@/components/shop/ShopFilter';
import { Produktkachel } from '@/components/shop/Produktkachel';
import { produktAbfrage } from '@/lib/catalog/abfrage';
import { ladeBeliebtheit } from '@/lib/catalog/beliebtheit';
import { merkmaleVon } from '@/lib/catalog/filter';
import { hatAktiveFilter, leseKriterien, schreibeKriterien, type SuchParameter } from '@/lib/catalog/kriterien';

export const dynamic = 'force-dynamic';

const BESCHREIBUNG =
  'T-Shirts, Poloshirts, Hoodies, Sweatshirts und Longsleeves etablierter Marken – mit DTF-Transferdruck oder Stickerei veredelt, ab 1 Stück.';

/** So viele Produkte tragen die Auszeichnung „Bestseller". */
const BESTSELLER_ANZAHL = 3;

export function generateMetadata({ searchParams }: { searchParams: SuchParameter }): Metadata {
  const gefiltert = hatAktiveFilter(leseKriterien(searchParams));
  return {
    title: 'Alle Produkte',
    description: BESCHREIBUNG,
    robots: gefiltert ? { index: false, follow: true } : undefined,
    alternates: { canonical: '/produkt' },
  };
}

export default async function Produktuebersicht({ searchParams }: { searchParams: SuchParameter }) {
  const kriterien = leseKriterien(searchParams);
  const beliebtheit = await ladeBeliebtheit();
  const ergebnis = produktAbfrage().finde(kriterien, beliebtheit);

  // „Bestseller" aus echten Verkaufszahlen – keine gepflegte Auszeichnung.
  const bestseller = new Set(
    Object.entries(beliebtheit)
      .sort((a, b) => b[1] - a[1])
      .slice(0, BESTSELLER_ANZAHL)
      .map(([id]) => id)
  );

  const liste = kriterien.ansicht === 'liste';

  return (
    <main className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-12 sm:px-8">
        <h1 className="font-serif text-[clamp(2rem,3.6vw,2.75rem)] font-normal tracking-tight text-brand">
          Alle Produkte
        </h1>
        <p className="mt-2.5 text-[13px] text-brand/50">
          Veredelt per DTF-Transferdruck oder Stickerei · ohne Mindestbestellmenge
        </p>

        <div className="mt-10">
          <ShopFilter
            kriterien={kriterien}
            facetten={ergebnis.facetten}
            spannen={ergebnis.spannen}
            bezeichnungen={ergebnis.bezeichnungen}
            gesamt={ergebnis.gesamt}
            merkmale={PRODUCTS.map(merkmaleVon)}
          >
            {ergebnis.produkte.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-[17px] text-brand">Keine Produkte für diese Auswahl</p>
                <p className="mt-2 text-[13px] text-brand/45">
                  Entfernen Sie einzelne Filter – oder setzen Sie alle zurück.
                </p>
                <Link
                  href="/produkt"
                  className="mt-7 inline-block rounded-full border border-brand/[0.12] bg-white/70 px-6 py-2.5 text-[13px] text-brand/70 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand"
                >
                  Alle Produkte anzeigen
                </Link>
              </div>
            ) : (
              // Bewusst wenige Kacheln je Zeile: Kleidungsstück und Motiv
              // brauchen Fläche, um zu wirken.
              <div className={liste ? 'space-y-10' : 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3'}>
                {ergebnis.produkte.map((p) => (
                  <Produktkachel
                    key={p.id}
                    produkt={p}
                    bestseller={bestseller.has(p.id)}
                    ansicht={kriterien.ansicht}
                  />
                ))}
              </div>
            )}

            {ergebnis.seiten > 1 && (
              <nav className="mt-16 flex justify-center gap-2" aria-label="Seiten">
                {Array.from({ length: ergebnis.seiten }, (_, i) => i + 1).map((nr) => {
                  const abfrage = schreibeKriterien({ ...kriterien, seite: nr });
                  return (
                    <Link
                      key={nr}
                      href={abfrage ? `/produkt?${abfrage}` : '/produkt'}
                      scroll={false}
                      aria-current={nr === ergebnis.seite ? 'page' : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] tabular-nums transition-all duration-300 ease-out ${
                        nr === ergebnis.seite
                          ? 'bg-brand font-medium text-white'
                          : 'border border-brand/[0.12] bg-white/70 text-brand/60 hover:border-gold/40 hover:bg-white hover:text-brand'
                      }`}
                    >
                      {nr}
                    </Link>
                  );
                })}
              </nav>
            )}
          </ShopFilter>
        </div>
      </div>
    </main>
  );
}
