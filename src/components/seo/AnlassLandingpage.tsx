/**
 * Anlass- und Ratgeberseite (z. B. /vereinskleidung-bedrucken, /textildruck-preise). Aufbau wie die DTF-Landingpages,
 * aber mit freien Abschnitten statt der festen Marken-/Artengliederung – siehe config/seo/anlassSeiten.ts.
 *
 * Texte: config/seo/anlassSeiten.ts (Kundentext, nur nach Freigabe ändern).
 * Zahlen: nie von Hand, sondern aus Katalog, Konfiguration und Preis-Engine (lib/seo/anlassSeite.ts).
 * Statisch erzeugt – ändern sich Katalog oder Preise, genügt ein neuer Deploy.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Check } from 'lucide-react';
import { Produktkachel } from '@/components/shop/Produktkachel';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { JsonLd } from '@/components/seo/JsonLd';
import { DTF_ABLAUF_SCHRITTE } from '@/config/seo/dtfSeiten';
import { dtfSeiteVon } from '@/lib/seo/dtfAdresse';
import type { AnlassSeite } from '@/config/seo/anlassSeiten';
import { produktTypLabelPlural } from '@/config/products/types';
import { kategorieSeiteVon } from '@/lib/seo/kategorieAdresse';
import { SHIPPING_RATES } from '@/config/shipping';
import { MIN_DPI, OK_DPI } from '@/lib/canvas/logoQualitaet';
import { formatiereGeld } from '@/lib/format';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { berechneBeispiele } from '@/lib/seo/kategorieSeite';
import {
  alsKategorieBeispiele,
  anlassFakten,
  AUFLOESUNG_BREITEN_CM,
  fuelleAnlass,
  mindestPixel,
} from '@/lib/seo/anlassSeite';
import { anlassSeiteVon } from '@/lib/seo/anlassAdresse';
import { faqSchema, kategorieBrotkrumenSchema, kategorieSchema } from '@/lib/seo/strukturierteDaten';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';

export function anlassMetadata(seite: AnlassSeite): Metadata {
  const fakten = anlassFakten(seite);
  const titel = fuelleAnlass(seite.titel, seite, fakten);
  const beschreibung = fuelleAnlass(seite.beschreibung, seite, fakten);
  return {
    // `absolute`: der Titel trägt die Suchbegriffe, der Marken-Suffix des Root-Layouts würde das 60-Zeichen-Budget sprengen.
    title: { absolute: titel },
    description: beschreibung,
    alternates: { canonical: `/${seite.slug}` },
    openGraph: { title: titel, description: beschreibung, type: 'website', images: [STANDARD_VORSCHAUBILD] },
    twitter: { card: 'summary_large_image', title: titel, description: beschreibung, images: [STANDARD_VORSCHAUBILD] },
  };
}

/** Beschriftung und Ziel eines Links zu einer anderen Seite (Kategorie-, DTF- oder Anlassseite). */
function verwandterLink(slug: string): { slug: string; label: string } {
  const anlass = anlassSeiteVon(slug);
  if (anlass) return { slug, label: anlass.kurzname };
  const dtf = dtfSeiteVon(slug);
  if (dtf) return { slug, label: dtf.marke ?? produktTypLabelPlural(dtf.art!) };
  const kategorie = kategorieSeiteVon(slug);
  if (kategorie) return { slug, label: produktTypLabelPlural(kategorie.art) };
  throw new Error(`Verwandte Seite "/${slug}" gibt es nicht.`);
}

const CHIP_KLASSE =
  'inline-flex items-center gap-2 rounded-full border border-brand/[0.12] bg-white/70 px-5 py-2.5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand';
const H2_KLASSE = 'font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand';

/** „Russell Classic T“ statt „Russell Russell Classic T“: manche Produktnamen tragen die Marke schon. */
function markeUndName(p: { brand: string; name: string }): string {
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`;
}

export async function AnlassLandingpage({ seite }: { seite: AnlassSeite }) {
  const fakten = anlassFakten(seite);
  const fuelle = (t: string) => fuelleAnlass(t, seite, fakten);
  const basis = kanonischeBasisUrl();

  const h1 = fuelle(seite.h1);
  const beschreibung = fuelle(seite.beschreibung);
  const fragen = seite.fragen.map((f) => ({ q: fuelle(f.q), a: fuelle(f.a) }));
  const ablauf = DTF_ABLAUF_SCHRITTE.map(fuelle);
  const verwandt = seite.verwandt.map(verwandterLink);
  const freiAb = formatiereGeld(SHIPPING_RATES.DE.freeFrom);

  const beispiele = seite.beispiele.length > 0 ? await berechneBeispiele({ slug: seite.slug, beispiele: alsKategorieBeispiele(seite.beispiele) }) : [];
  const beispielProdukte = [...new Set(beispiele.map((b) => b.produktName))];

  return (
    <main className="min-h-screen bg-brand-light">
      {fakten.kacheln.length > 0 ? (
        <JsonLd
          daten={kategorieSchema(
            basis,
            { slug: seite.slug, name: h1, beschreibung },
            fakten.kacheln.map((p) => ({ name: markeUndName(p), id: p.id }))
          )}
        />
      ) : null}
      <JsonLd daten={kategorieBrotkrumenSchema(basis, { slug: seite.slug, name: seite.kurzname })} />
      <JsonLd daten={faqSchema(fragen)} />

      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-10 sm:px-8">
        <nav aria-label="Brotkrumen" className="text-xs text-brand/70">
          <Link href="/" className="transition-colors hover:text-gold-dark">
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand">{seite.kurzname}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">{seite.eyebrow}</p>
          <h1 className="mt-5 font-serif text-[clamp(2.25rem,4.6vw,3.75rem)] font-normal leading-[1.04] tracking-[-0.02em] text-brand">
            {h1}
          </h1>
          {seite.einleitung.map((absatz) => (
            <p key={absatz} className="mt-6 text-[17px] leading-relaxed text-brand/70">
              {fuelle(absatz)}
            </p>
          ))}
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/konfigurator"
              className="group inline-flex items-center gap-3 rounded-full bg-brand px-8 py-3.5 text-[15px] font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 active:scale-[0.98]"
            >
              Jetzt gestalten
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
            {fakten.kacheln.length > 0 && (
              <Link
                href="/produkt"
                className="inline-flex items-center border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                Alle Produkte ansehen
              </Link>
            )}
          </div>
        </header>

        {fakten.kacheln.length > 0 && (
          <section aria-labelledby="modelle" className="mt-20">
            <h2 id="modelle" className={H2_KLASSE}>
              Passende Modelle
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-4">
              {fakten.kacheln.map((p, i) => (
                <Produktkachel key={p.id} produkt={p} bestseller={false} ansicht="raster" index={i} />
              ))}
            </div>
          </section>
        )}

        {seite.abschnitte.map((a) => (
          <section key={a.ueberschrift} className="mt-24 max-w-3xl">
            <h2 className={H2_KLASSE}>{fuelle(a.ueberschrift)}</h2>
            {a.punkte && (
              <ul className="mt-8 space-y-4">
                {a.punkte.map((punkt) => (
                  <li key={punkt} className="flex gap-4 text-[16px] leading-relaxed text-brand/70">
                    <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-btn text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span>{fuelle(punkt)}</span>
                  </li>
                ))}
              </ul>
            )}
            {a.absaetze?.map((absatz) => (
              <p key={absatz} className="mt-5 text-[16px] leading-relaxed text-brand/70">
                {fuelle(absatz)}
              </p>
            ))}
            {a.tabelle === 'aufloesung' && (
              <div className="mt-8 overflow-x-auto rounded-[24px] border border-brand/[0.08] bg-white">
                <table className="w-full border-collapse text-left text-[15px]">
                  <caption className="sr-only">Mindestbreite des Bildes in Pixeln je Druckbreite</caption>
                  <thead>
                    <tr className="border-b border-brand/[0.08] text-[13px] text-brand/70">
                      <th scope="col" className="px-4 py-4 font-medium sm:px-6">
                        Druckbreite
                      </th>
                      <th scope="col" className="px-4 py-4 text-right font-medium sm:px-6">
                        mindestens
                        <span className="block text-[12px] font-normal">{MIN_DPI} dpi</span>
                      </th>
                      <th scope="col" className="px-4 py-4 text-right font-medium sm:px-6">
                        optimal
                        <span className="block text-[12px] font-normal">{OK_DPI} dpi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand/[0.06]">
                    {AUFLOESUNG_BREITEN_CM.map((cm) => (
                      <tr key={cm}>
                        <th scope="row" className="px-4 py-4 font-normal text-brand sm:px-6">
                          {cm} cm
                        </th>
                        <td className="px-4 py-4 text-right tabular-nums text-brand/80 sm:px-6">{mindestPixel(cm, MIN_DPI)} px</td>
                        <td className="px-4 py-4 text-right tabular-nums text-brand/80 sm:px-6">{mindestPixel(cm, OK_DPI)} px</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {beispiele.length > 0 && (
          <section aria-labelledby="preise" className="mt-24 max-w-4xl">
            <h2 id="preise" className={H2_KLASSE}>
              Preisbeispiele
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-brand/70">
              Mit steigender Menge sinkt der Stückpreis – Staffelpreise gelten ab 5 Stück.
            </p>
            <ul className="mt-8 divide-y divide-brand/[0.08] rounded-[24px] border border-brand/[0.08] bg-white">
              {beispiele.map((b) => (
                <li
                  key={b.beschriftung}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-6 py-5 sm:px-8"
                >
                  <p className="max-w-xl text-[15px] leading-snug text-brand">{b.beschriftung}</p>
                  <p className="text-right">
                    <span className="font-serif text-[26px] tabular-nums text-brand">
                      <WaehrungsPreis betragInEur={b.stueckpreis} />
                    </span>
                    <span className="ml-1.5 text-[13px] text-brand/70">pro Stück</span>
                    <span className="block text-[13px] text-brand/70">
                      {b.menge > 1 ? (
                        <>
                          Gesamt <WaehrungsPreis betragInEur={b.gesamt} />
                        </>
                      ) : (
                        'Einzelstück'
                      )}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] leading-relaxed text-brand/70">
              Beispielrechnungen mit {beispielProdukte.join(', ')}. Preise pro Stück zzgl. Versand – versandkostenfrei ab{' '}
              {freiAb}. Kein Steuerausweis (§ 19 UStG). Ihr Preis hängt von Motiv, Größe, Position und Menge ab und wird im
              Konfigurator live berechnet.
            </p>
          </section>
        )}

        {!seite.ohneAblauf && (
          <section aria-labelledby="ablauf" className="mt-24 max-w-3xl">
            <h2 id="ablauf" className={H2_KLASSE}>
              So läuft Ihre Bestellung ab
            </h2>
            <ol className="mt-8 space-y-4">
              {ablauf.map((schritt, i) => (
                <li key={schritt} className="flex gap-4 text-[16px] leading-relaxed text-brand/70">
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-btn text-[13px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>{schritt}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="fragen" className="mt-24 max-w-3xl">
          <h2 id="fragen" className={H2_KLASSE}>
            Häufige Fragen
          </h2>
          <div className="mt-8 space-y-3">
            {fragen.map((f) => (
              <div key={f.q} className="rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
                <h3 className="mb-1.5 font-medium text-brand">{f.q}</h3>
                <p className="text-sm leading-relaxed text-brand/70">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-brand/70">
            Weitere Antworten finden Sie in den{' '}
            <Link href="/faq" className="text-gold-dark underline underline-offset-2 hover:text-gold">
              häufigen Fragen
            </Link>{' '}
            – oder{' '}
            <Link href="/kontakt" className="text-gold-dark underline underline-offset-2 hover:text-gold">
              schreiben Sie uns
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="weiterlesen" className="mt-24 border-t border-brand/[0.08] pt-12">
          <h2 id="weiterlesen" className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-tight text-brand">
            Das könnte Sie auch interessieren
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {verwandt.map((v) => (
              <li key={v.slug}>
                <Link href={`/${v.slug}`} className={CHIP_KLASSE}>
                  <Check className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {v.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/produkt" className={CHIP_KLASSE}>
                Alle Produkte
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
