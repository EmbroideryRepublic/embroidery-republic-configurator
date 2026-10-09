/**
 * Kategorie-Landingpage (z.B. /hoodies-bedrucken-besticken).
 *
 * Eine indexierbare Seite je Produktart mit eigenem Titel, eigener
 * Beschreibung, Veredelungsberatung, Preisbeispielen und FAQ – gedacht für
 * Suchanfragen wie „Hoodies bedrucken lassen". Die Filteransicht
 * `/produkt?kategorie=…` bleibt für das Stöbern, ist aber `noindex`.
 *
 * Texte: config/seo/kategorieSeiten.ts (Kundentext, nur nach Freigabe ändern).
 * Zahlen: nie von Hand, sondern aus Katalog und Preis-Engine (siehe
 * lib/seo/kategorieSeite.ts). Statisch erzeugt – ändern sich Katalog oder
 * Preise, genügt ein neuer Deploy.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, Check, Scissors, Shirt } from 'lucide-react';
import { Produktkachel } from '@/components/shop/Produktkachel';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { JsonLd } from '@/components/seo/JsonLd';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { produktTypLabelPlural } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld, zahl } from '@/lib/format';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import {
  ablaufSchritte,
  alleKategorieSlugs,
  berechneBeispiele,
  fuelleVorlage,
  kategorieFakten,
  kategorieSeiteVon,
  topProdukte,
} from '@/lib/seo/kategorieSeite';
import { faqSchema, kategorieBrotkrumenSchema, kategorieSchema } from '@/lib/seo/strukturierteDaten';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';

/** So viele Produkte zeigt die Seite; alle weiteren stehen in der Filteransicht. */
const PRODUKTE_AUF_SEITE = 8;

// Unbekannte Adressen unter der Wurzel sind ein ECHTES 404 (kein Soft-404):
// nur die Slugs aus dem Register werden erzeugt.
export const dynamicParams = false;

export function generateStaticParams() {
  return alleKategorieSlugs().map((kategorie) => ({ kategorie }));
}

export function generateMetadata({ params }: { params: { kategorie: string } }): Metadata {
  const seite = kategorieSeiteVon(params.kategorie);
  if (!seite) return { title: 'Seite nicht gefunden' };
  const beschreibung = fuelleVorlage(seite.beschreibung, kategorieFakten(seite.art));
  return {
    // `absolute`: der Titel trägt die Suchbegriffe, der Marken-Suffix des Root-
    // Layouts würde das 60-Zeichen-Budget sprengen. Der Seitenname erscheint in
    // Google ohnehin separat (WebSite-Daten).
    title: { absolute: seite.titel },
    description: beschreibung,
    alternates: { canonical: `/${seite.slug}` },
    openGraph: { title: seite.titel, description: beschreibung, type: 'website', images: [STANDARD_VORSCHAUBILD] },
  };
}

function VerfahrenKarte({ art, text }: { art: 'dtf' | 'embroidery'; text: string }) {
  const Icon = art === 'dtf' ? Shirt : Scissors;
  return (
    <div className="rounded-[24px] border border-brand/[0.08] bg-white p-8 sm:p-10">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-5 font-serif text-[24px] font-normal text-brand">
        {art === 'dtf' ? 'DTF-Transferdruck' : 'Stickerei'}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-brand/70">{text}</p>
    </div>
  );
}

export default async function Kategorieseite({ params }: { params: { kategorie: string } }) {
  const seite = kategorieSeiteVon(params.kategorie);
  if (!seite) notFound();

  const fakten = kategorieFakten(seite.art);
  const plural = produktTypLabelPlural(seite.art);
  const { produkte, gesamt } = topProdukte(seite.art, PRODUKTE_AUF_SEITE);
  const beispiele = await berechneBeispiele(seite);
  const basis = kanonischeBasisUrl();

  const fuelle = (t: string) => fuelleVorlage(t, fakten);
  const fragen = seite.fragen.map((f) => ({ q: fuelle(f.q), a: fuelle(f.a) }));
  const beschreibung = fuelle(seite.beschreibung);
  const weitere = KATEGORIE_SEITEN.filter((s) => s.art !== seite.art);

  // Preis-Fußnote: nur Aussagen, die für DIESE Beispiele zutreffen.
  const beispielProdukte = [...new Map(beispiele.map((b) => [b.produktName, b.textilAb])).entries()];
  const stiche = seite.beispiele.flatMap((b) => b.flaechen).find((f) => f.stiche)?.stiche;
  const freiAb = formatiereGeld(SHIPPING_RATES.DE.freeFrom);

  const verfahrenKarten = (
    [
      { art: 'dtf' as const, text: seite.verfahren.dtf },
      { art: 'embroidery' as const, text: seite.verfahren.stickerei },
    ] satisfies { art: 'dtf' | 'embroidery'; text: string }[]
  ).sort((a, b) => (a.art === seite.verfahren.zuerst ? -1 : b.art === seite.verfahren.zuerst ? 1 : 0));

  return (
    <main className="min-h-screen bg-brand-light">
      <JsonLd
        daten={kategorieSchema(
          basis,
          { slug: seite.slug, name: seite.h1, beschreibung },
          produkte.map((p) => ({ name: `${p.brand} ${p.name}`, id: p.id }))
        )}
      />
      <JsonLd daten={kategorieBrotkrumenSchema(basis, { slug: seite.slug, name: plural })} />
      <JsonLd daten={faqSchema(fragen)} />

      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-10 sm:px-8">
        <nav aria-label="Brotkrumen" className="text-xs text-brand/70">
          <Link href="/" className="transition-colors hover:text-gold-dark">
            Start
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand">{plural}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">Stickerei &amp; DTF-Transferdruck</p>
          <h1 className="mt-5 font-serif text-[clamp(2.25rem,4.6vw,3.75rem)] font-normal leading-[1.04] tracking-[-0.02em] text-brand">
            {seite.h1}
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
              href={`/produkt?kategorie=${seite.art}`}
              className="inline-flex items-center border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Alle {gesamt} {plural} ansehen
            </Link>
          </div>
        </header>

        <section aria-labelledby="beliebt" className="mt-20">
          {/* Bewusst „im Überblick" statt „Beliebte …": Die Reihenfolge ist
              Qualitätsstufe, dann Preis (solange es keine Verkaufszahlen gibt) –
              eine Beliebtheit, die es noch nicht gibt, wird nicht behauptet. */}
          <h2 id="beliebt" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            {plural} im Überblick
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-4">
            {produkte.map((p, i) => (
              <Produktkachel key={p.id} produkt={p} bestseller={false} ansicht="raster" index={i} />
            ))}
          </div>
          {gesamt > produkte.length && (
            <p className="mt-12 text-center">
              <Link
                href={`/produkt?kategorie=${seite.art}`}
                className="inline-flex items-center gap-2 border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                Alle {gesamt} {plural} ansehen und filtern
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="verfahren" className="mt-24">
          <h2 id="verfahren" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            DTF-Transferdruck oder Stickerei?
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {verfahrenKarten.map((k) => (
              <VerfahrenKarte key={k.art} art={k.art} text={k.text} />
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-brand/70">{seite.verfahren.hinweis}</p>
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
            Beispielrechnungen mit{' '}
            {beispielProdukte.map(([name, ab], i) => (
              <span key={name}>
                {i > 0 && ' bzw. '}
                {name} (Textil ab <WaehrungsPreis betragInEur={ab} />)
              </span>
            ))}
            . Preise pro Stück zzgl. Versand – versandkostenfrei ab {freiAb}. Kein Steuerausweis (§ 19 UStG).
            {stiche !== undefined && ` Die Stickerei-Beispiele gehen von einem Logo mit rund ${zahl(stiche, 0)} Stichen aus.`}{' '}
            Ihr Preis hängt von Motiv, Größe, Position und Menge ab und wird im Konfigurator live berechnet.
          </p>
        </section>

        <section aria-labelledby="ablauf" className="mt-24 max-w-3xl">
          <h2 id="ablauf" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            So läuft Ihre Bestellung ab
          </h2>
          <ol className="mt-8 space-y-4">
            {ablaufSchritte(fakten).map((schritt, i) => (
              <li key={schritt} className="flex gap-4 text-[16px] leading-relaxed text-brand/70">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold text-[13px] font-semibold text-white">
                  {i + 1}
                </span>
                <span>{schritt}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="fragen" className="mt-24 max-w-3xl">
          <h2 id="fragen" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
            Häufige Fragen zu {plural}
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
          <h2 id="weitere" className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-tight text-brand">
            Weitere Produkte veredeln lassen
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {weitere.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-brand/[0.12] bg-white/70 px-5 py-2.5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand"
                >
                  <Check className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {produktTypLabelPlural(s.art)} ({kategorieFakten(s.art).anzahl})
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/produkt"
                className="inline-flex items-center gap-2 rounded-full border border-brand/[0.12] bg-white/70 px-5 py-2.5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand"
              >
                Alle Produkte
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
