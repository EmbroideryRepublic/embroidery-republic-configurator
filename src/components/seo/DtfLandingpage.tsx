/**
 * DTF-Landingpage einer Marke (z.B. /gildan-bedrucken) oder einer weiteren Produktart
 * (z.B. /longsleeves-bedrucken). Aufbau wie die Kategorieseiten (app/[kategorie]),
 * aber nur DTF-Transferdruck – die Stickerei ist vorübergehend abgeschaltet (siehe
 * config/seo/dtfSeiten.ts).
 *
 * Texte: config/seo/dtfSeiten.ts (Kundentext, nur nach Freigabe ändern).
 * Zahlen: nie von Hand, sondern aus Katalog und Preis-Engine (lib/seo/dtfSeite.ts).
 * Statisch erzeugt – ändern sich Katalog oder Preise, genügt ein neuer Deploy.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Check, Shirt } from 'lucide-react';
import { Produktkachel } from '@/components/shop/Produktkachel';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { JsonLd } from '@/components/seo/JsonLd';
import { DTF_ABLAUF_SCHRITTE, type DtfSeite } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { PRODUCT_TYPE_ORDER, produktTypLabelPlural } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld } from '@/lib/format';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { berechneBeispiele } from '@/lib/seo/kategorieSeite';
import { dtfBeispiele, dtfFakten, fuelleDtf } from '@/lib/seo/dtfSeite';
import { alleMarkenSeiten, dtfArtSeiteVon } from '@/lib/seo/dtfAdresse';
import { LEERE_KRITERIEN, schreibeKriterien, slug as filterSlug } from '@/lib/catalog/kriterien';
import { faqSchema, kategorieBrotkrumenSchema, kategorieSchema } from '@/lib/seo/strukturierteDaten';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';
import type { ProductType } from '@/types';

/** Bei Produktart-Seiten so viele Kacheln; alle weiteren stehen in der Filteransicht. */
const KACHELN_ART_SEITE = 12;

export function dtfMetadata(seite: DtfSeite): Metadata {
  const fakten = dtfFakten(seite);
  const titel = fuelleDtf(seite.titel, seite, fakten);
  const beschreibung = fuelleDtf(seite.beschreibung, seite, fakten);
  return {
    // `absolute`: der Titel trägt die Suchbegriffe, der Marken-Suffix des Root-Layouts
    // würde das 60-Zeichen-Budget sprengen (wie bei den Kategorieseiten).
    title: { absolute: titel },
    description: beschreibung,
    alternates: { canonical: `/${seite.slug}` },
    openGraph: { title: titel, description: beschreibung, type: 'website', images: [STANDARD_VORSCHAUBILD] },
  };
}

/** Adresse der Filteransicht mit den Modellen dieser Seite. */
function alleAnsehenLink(seite: DtfSeite): string {
  const kriterien = seite.marke
    ? { ...LEERE_KRITERIEN, marke: [filterSlug(seite.marke)] }
    : { ...LEERE_KRITERIEN, kategorie: [seite.art as ProductType] };
  return `/produkt?${schreibeKriterien(kriterien)}`;
}

/** „Russell Classic T“ statt „Russell Russell Classic T“: manche Produktnamen tragen die Marke schon. */
function markeUndName(p: { brand: string; name: string }): string {
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`;
}

const CHIP_KLASSE =
  'inline-flex items-center gap-2 rounded-full border border-brand/[0.12] bg-white/70 px-5 py-2.5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand';

export async function DtfLandingpage({ seite }: { seite: DtfSeite }) {
  const fakten = dtfFakten(seite);
  const fuelle = (t: string) => fuelleDtf(t, seite, fakten);
  const basis = kanonischeBasisUrl();

  const name = seite.marke ?? produktTypLabelPlural(seite.art as ProductType);
  const h1 = fuelle(seite.h1);
  const beschreibung = fuelle(seite.beschreibung);
  const fragen = seite.fragen.map((f) => ({ q: fuelle(f.q), a: fuelle(f.a) }));
  const ablauf = DTF_ABLAUF_SCHRITTE.map(fuelle);

  const { produkt: beispielProdukt, beispiele: beispielDefs } = dtfBeispiele(seite, fakten);
  const beispiele = await berechneBeispiele({ slug: seite.slug, beispiele: beispielDefs });
  const freiAb = formatiereGeld(SHIPPING_RATES.DE.freeFrom);

  // Marken-Seiten zeigen ALLE Modelle, nach Art gruppiert; Art-Seiten die ersten Treffer.
  const sichtbar = seite.marke ? fakten.produkte : fakten.produkte.slice(0, KACHELN_ART_SEITE);
  const gruppen = seite.marke
    ? PRODUCT_TYPE_ORDER.map((art) => ({ art, produkte: sichtbar.filter((p) => p.productType === art) })).filter(
        (g) => g.produkte.length > 0
      )
    : [{ art: seite.art as ProductType, produkte: sichtbar }];

  const weitereMarken = alleMarkenSeiten().filter((s) => s.slug !== seite.slug);
  const weitereArten = [
    ...KATEGORIE_SEITEN.map((s) => ({ slug: s.slug, art: s.art })),
    ...(['longsleeve', 'jacket', 'zip-hoodie'] as ProductType[])
      .map((a) => dtfArtSeiteVon(a))
      .filter((s): s is DtfSeite => !!s)
      .map((s) => ({ slug: s.slug, art: s.art as ProductType })),
  ].filter((s) => s.slug !== seite.slug);

  let kachelIndex = 0;

  return (
    <main className="min-h-screen bg-brand-light">
      <JsonLd
        daten={kategorieSchema(
          basis,
          { slug: seite.slug, name: h1, beschreibung },
          sichtbar.map((p) => ({ name: markeUndName(p), id: p.id }))
        )}
      />
      <JsonLd daten={kategorieBrotkrumenSchema(basis, { slug: seite.slug, name })} />
      <JsonLd daten={faqSchema(fragen)} />

      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-10 sm:px-8">
        <nav aria-label="Brotkrumen" className="text-xs text-brand/70">
          <Link href="/" className="transition-colors hover:text-gold-dark">
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand">{name}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">DTF-Transferdruck</p>
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
            <Link
              href={alleAnsehenLink(seite)}
              className="inline-flex items-center border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Alle {fakten.anzahl} Modelle ansehen
            </Link>
          </div>
        </header>

        <section aria-labelledby="ueberblick" className="mt-20">
          <h2 id="ueberblick" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            {name} im Überblick
          </h2>
          {gruppen.map((g) => (
            <div key={g.art} className="mt-10">
              {seite.marke && (
                <h3 className="font-serif text-[22px] font-normal text-brand">
                  {produktTypLabelPlural(g.art)} <span className="text-[15px] text-brand/70">({g.produkte.length})</span>
                </h3>
              )}
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-4">
                {g.produkte.map((p) => (
                  <Produktkachel key={p.id} produkt={p} bestseller={false} ansicht="raster" index={kachelIndex++} />
                ))}
              </div>
            </div>
          ))}
          {!seite.marke && fakten.anzahl > sichtbar.length && (
            <p className="mt-12 text-center">
              <Link
                href={alleAnsehenLink(seite)}
                className="inline-flex items-center gap-2 border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                Alle {fakten.anzahl} {name} ansehen und filtern
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="preise" className="mt-24 max-w-4xl">
          <h2 id="preise" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
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
            Beispielrechnungen mit {markeUndName(beispielProdukt)} (Textil ab{' '}
            <WaehrungsPreis betragInEur={beispielProdukt.basePrice} />
            ). Preise pro Stück zzgl. Versand – versandkostenfrei ab {freiAb}. Kein Steuerausweis (§ 19 UStG). Ihr Preis
            hängt von Motiv, Größe, Position und Menge ab und wird im Konfigurator live berechnet.
          </p>
        </section>

        <section aria-labelledby="ablauf" className="mt-24 max-w-3xl">
          <h2 id="ablauf" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
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

        <section aria-labelledby="fragen" className="mt-24 max-w-3xl">
          <h2 id="fragen" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            Häufige Fragen zu {name}
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

        <section aria-labelledby="weitere" className="mt-24 border-t border-brand/[0.08] pt-12">
          {weitereMarken.length > 0 && (
            <>
              <h2 id="weitere" className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-tight text-brand">
                Weitere Marken
              </h2>
              <ul className="mt-6 flex flex-wrap gap-3">
                {weitereMarken.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className={CHIP_KLASSE}>
                      <Shirt className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                      {s.marke}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2
            id={weitereMarken.length > 0 ? undefined : 'weitere'}
            className="mt-12 font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-tight text-brand"
          >
            Weitere Produkte bedrucken lassen
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {weitereArten.map((s) => (
              <li key={s.slug}>
                <Link href={`/${s.slug}`} className={CHIP_KLASSE}>
                  <Check className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {produktTypLabelPlural(s.art)}
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
