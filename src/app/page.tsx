/**
 * Startseite.
 *
 * Bis 2026-07-23 lag hier der Konfigurator; der hat jetzt eine eigene
 * Adresse (`/konfigurator`). Diese Seite soll Lust auf die Ware machen und
 * dann in genau zwei Richtungen führen: stöbern oder gestalten.
 *
 * ── Warum ohne Fotografie ─────────────────────────────────────────────
 * Der gesamte Bildbestand besteht aus 2541 freigestellten Lieferantenfotos
 * (vorne/hinten/Ärmel) in rund 620×720 Pixeln. Es gibt kein einziges
 * Lifestyle-, Detail- oder Produktionsfoto, und die Auflösung trägt weder
 * eine formatfüllende Bühne noch Makroausschnitte. Statt Bilder zu erfinden
 * arbeitet diese Seite mit dem, was wirklich vorhanden ist: Freisteller mit
 * Alphakanal, 50 echte Farbwerte, 27 Materialien und ein Display-Serif. Die
 * Wirkung kommt aus Größe, Weißraum, Kontrast und Typografie. Sobald echte
 * Fotos vorliegen, treten sie an die Stelle von Bühne und Farbband.
 *
 * ── Nur belegte Aussagen ──────────────────────────────────────────────
 * Jede Zahl stammt aus dem Code, nicht aus einem Entwurf: die Versandschwelle
 * aus `config/shipping.ts`, die Produktionszeit aus AGB und FAQ, die
 * Produkt-, Farb- und Materialzahlen aus dem Katalog. Insbesondere gilt
 * „ab 1 Stück" – eine Mindestbestellmenge gibt es nicht, die Staffelpreise
 * beginnen bei 5 (calculatePrice.ts).
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, Package, Palette, Scissors, Shirt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PRODUCTS } from '@/config/products';
import { repraesentativBildVon, produktBild } from '@/lib/assets';
import { waehlbareFarben } from '@/lib/products/farben';
import { FARBGRUPPEN } from '@/config/products/facetten';
import { produktTypLabel, PRODUCT_TYPE_ORDER, PRODUCT_TYPES } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { PRODUKTIONSTAGE } from '@/config/company';
import { JsonLd } from '@/components/seo/JsonLd';
import { Veredelungsverfahren } from '@/components/shop/Veredelungsverfahren';
import { Kundenstimmen } from '@/components/shop/Kundenstimmen';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { HeroText } from '@/components/home/HeroText';
import { basisUrl } from '@/lib/seo/basisUrl';
import { organisationSchema } from '@/lib/seo/strukturierteDaten';
import type { ProductType } from '@/types';

export const metadata: Metadata = {
  // `title.template` aus dem Root-Layout greift nur bei vererbten Titeln
  // aus verschachtelten Segmenten – die app/page.tsx im selben Segment wie
  // das Root-Layout bekommt den Marken-Suffix sonst NICHT automatisch, im
  // Unterschied zu jeder anderen Seite des Projekts. Deshalb hier `absolute`
  // statt eines einfachen Strings.
  title: { absolute: 'Textilveredelung mit Stickerei & DTF-Druck | Embroidery Republic Germany' },
  description:
    'Hochwertige Stickerei und DTF-Transferdruck für Unternehmen, Vereine und Marken. Selbst gestalten im Konfigurator – ab 1 Stück, ohne Mindestbestellmenge.',
  alternates: { canonical: '/' },
};

/** Reihenfolge der Kacheln: häufigste Anfrage zuerst – zentral in
 *  PRODUCT_TYPE_ORDER (config/products/types). */
const REIHENFOLGE = PRODUCT_TYPE_ORDER;

/** Erstes echtes Katalogbild in einer der Wunsch-Farbfamilien der Kachel.
 *  Die Wunschfarben stehen zentral im PRODUCT_TYPES-Register (`kachelFarbe`):
 *  ohne Vorgabe zeigte jede Kachel `colors[0]` und – weil die Kataloge fast
 *  überall mit Schwarz beginnen – eine Reihe nahezu gleicher dunkler Umrisse.
 *  Fällt keine Wunschfarbe, greift die erste Katalogfarbe (nichts wird eingefärbt). */
function findeBild(treffer: typeof PRODUCTS, art: ProductType): string | undefined {
  for (const wunsch of PRODUCT_TYPES[art]?.kachelFarbe ?? []) {
    for (const p of treffer) {
      // Nur wählbare Farben: sonst zeigt die Kachel einen Ton, den es beim
      // Öffnen des Produkts gar nicht zur Auswahl gibt.
      const farbe = waehlbareFarben(p.id, p.colors).find((c) => FARBGRUPPEN[c.name] === wunsch);
      if (farbe) return repraesentativBildVon(p.id, farbe.id);
    }
  }
  const ersteProdukt = treffer[0];
  return ersteProdukt?.colors.length ? produktBild(ersteProdukt.id, ersteProdukt.colors) : undefined;
}

export default function Startseite() {
  const guenstigster = Math.min(...PRODUCTS.map((p) => p.basePrice));

  const kategorien = REIHENFOLGE.map((art) => {
    const treffer = PRODUCTS.filter((p) => p.productType === art);
    return { art, anzahl: treffer.length, bild: findeBild(treffer, art) };
  }).filter((k) => k.anzahl > 0);

  // Die Bühne zeigt die als `hero` markierte Art (Register) – aktuell der
  // Hoodie: größte Fläche, stärkster Auftritt bei der Auflösung, die die
  // Lieferantenfotos hergeben. Fällt keine hero-Art in den Bestand, greift die
  // erste Kategorie.
  const buehne = kategorien.find((k) => PRODUCT_TYPES[k.art]?.hero) ?? kategorien[0];
  const buehneDef = buehne ? PRODUCT_TYPES[buehne.art] : undefined;

  // Bild für den Markenbereich – ein echtes, freigestelltes Katalogfoto statt
  // eines reinen Farbverlaufs. Bewusst eine Jacke, nicht der Hoodie der
  // Bühne: die Seite soll nicht zweimal dasselbe Kleidungsstück zeigen.
  // Sobald echte Marken- oder Lifestyle-Fotografie vorliegt, ersetzt sie
  // dieses Katalogfoto im selben Container, ohne Layoutänderung.
  const markenProdukt = PRODUCTS.find((p) => p.productType === 'jacket');
  const markenBild = markenProdukt?.colors.length
    ? produktBild(markenProdukt.id, markenProdukt.colors)
    : undefined;

  return (
    <main className="bg-brand-light">
      <JsonLd daten={organisationSchema(basisUrl())} />
      {/* ══ Bühne ═══════════════════════════════════════════════════════
          Keine Vorteilsleiste, keine Bedienelemente über dem Aufmacher –
          zuerst kommt die Ware. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1500px] items-center gap-4 px-4 pb-14 pt-6 sm:px-8 lg:min-h-[86vh] lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-0">
          <div className="relative z-10 order-2 lg:order-1">
            <HeroText />

            <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/konfigurator"
                className="group inline-flex items-center gap-3 rounded-full bg-brand px-9 py-4 text-[15px] font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 hover:shadow-[0_16px_36px_-12px_rgba(43,36,28,0.5)] active:scale-[0.98]"
              >
                Jetzt gestalten
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/produkt"
                className="inline-flex items-center border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                Sortiment ansehen
              </Link>
            </div>
          </div>

          {/* Freisteller vor einem warmen Lichtkreis. Das Bild stammt aus
              `public/buehne/` – dasselbe Lieferantenfoto, nur ohne den
              weißen Studiohintergrund (scripts/buehneFreistellen.mts). Die
              Katalogdatei selbst bleibt unangetastet, der Konfigurator
              rechnet mit ihr. Originalauflösung, nichts hochskaliert. */}
          <div className="relative order-1 flex items-center justify-center lg:order-2">
            <div
              aria-hidden
              className="absolute h-[min(86vw,620px)] w-[min(86vw,620px)] rounded-full bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f6efe2_55%,rgba(246,239,226,0)_72%)]"
            />
            {buehneDef?.heroBild && (
              <Image
                src={buehneDef.heroBild}
                alt={buehneDef.heroAlt ?? ''}
                width={620}
                height={720}
                priority
                sizes="(max-width: 1024px) 86vw, 46vw"
                className="relative h-auto w-[min(76vw,540px)] drop-shadow-[0_46px_60px_rgba(43,36,28,0.16)]"
              />
            )}
          </div>
        </div>
      </section>

      {/* ══ Kategorien ══════════════════════════════════════════════════
          Ein Abschnitt vereint Einstieg, Vorteile und Kategorie-Auswahl.
          ── Rechter Markenbereich ──────────────────────────────────────
          Reines Verlaufs-Panel (warmer Farbverlauf + Innenschatten), KEIN
          fabriziertes Foto, kein Platzhalterbild. Maße/Seitenverhältnis sind
          final: sobald echte Marken- oder Lifestyle-Fotografie vorliegt,
          ersetzt ein `<Image fill className="object-cover" />` im selben
          Container die Gestaltung, ohne dass das Layout angepasst werden
          muss. */}
      <section className="mx-auto max-w-[1500px] px-4 pb-24 pt-20 sm:px-8 lg:pt-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">Kategorien entdecken</p>
            <h2 className="mt-6 font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] font-normal leading-[1.02] tracking-[-0.025em] text-brand">
              Ihre Lieblingsstücke.
              <span className="block">Ihre Marke.</span>
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-brand/70">
              Wählen Sie Ihr Textil und gestalten Sie es mit Ihrem Logo, Motiv oder Schriftzug.
              Hochwertige Basics, perfekt veredelt – für Unternehmen, Teams und Marken.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Vorteil icon={Scissors} titel="Hochwertige Veredelung" text="Stick & DTF-Transferdruck" />
              <Vorteil icon={Palette} titel="Große Auswahl" text="Farben, Größen & Marken" />
              <Vorteil
                icon={Package}
                titel="Schnelle Produktion"
                text={`In ${PRODUKTIONSTAGE.von}–${PRODUKTIONSTAGE.bis} Werktagen bei Ihnen`}
              />
            </ul>
          </div>

          {/* Markenbereich – Katalogfoto vor Farbverlauf, siehe Kommentar bei
              markenBild oben. Container-Maße unverändert (aspect-[4/3]). */}
          <div
            className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-brand/[0.06] lg:block"
            style={{ background: 'radial-gradient(120% 100% at 25% 20%, #fdfaf3 0%, #f1e8d6 55%, #e6dac2 100%)' }}
          >
            {/* Feiner Innenschatten für die eingerahmte, hochwertige Anmutung. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -60px 90px -60px rgba(43,36,28,0.18)' }}
            />
            {markenBild && (
              <Image
                src={markenBild}
                alt={markenProdukt?.name ?? ''}
                fill
                sizes="(max-width: 1024px) 0px, 40vw"
                className="object-contain p-10"
              />
            )}
          </div>
        </div>

        {/* Kategorie-Karten – die letzte Kachel führt in den vollen Katalog. */}
        <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
          {kategorien.map(({ art, anzahl, bild }) => (
            <Link key={art} href={`/produkt?kategorie=${art}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white ring-1 ring-brand/[0.05] transition-shadow duration-300 group-hover:shadow-[0_22px_44px_-24px_rgba(43,36,28,0.28)]">
                {bild && (
                  <Image
                    src={bild}
                    alt={produktTypLabel(art)}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw"
                    className="object-contain p-8 transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
                  />
                )}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-[19px] text-brand transition-colors duration-300 group-hover:text-gold-dark">
                    {produktTypLabel(art)}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-brand/70">{PRODUCT_TYPES[art]?.kachelText}</p>
                </div>
                <span className="mt-0.5 inline-flex h-6 min-w-[1.5rem] flex-shrink-0 items-center justify-center rounded-full bg-gold-light/60 px-2 text-[12px] tabular-nums text-gold-dark">
                  {anzahl}
                </span>
              </div>
            </Link>
          ))}

          <div className="flex flex-col justify-center rounded-2xl bg-gold-light/35 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-gold-dark">
              <Shirt className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-5 font-serif text-[19px] text-brand">Nicht das Richtige?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-brand/70">
              Noch mehr Produkte, Farben und Marken entdecken.
            </p>
            <Link
              href="/produkt"
              className="group mt-5 inline-flex items-center gap-2 self-start rounded-full bg-gold-dark px-5 py-2.5 text-[14px] font-medium text-white shadow-elegant transition-all duration-300 ease-out hover:bg-brand active:scale-[0.98]"
            >
              Alle Produkte ansehen
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Veredelung ══════════════════════════════════════════════════
          Zwei Verfahren, klar erklärt – Verständnis schafft Vertrauen und
          bereitet die Entscheidung im Konfigurator vor. Die Kurzbeschreibung
          ist deckungsgleich mit dem Methodenwähler (i18n), die Merkmale sind
          allgemeingültige Eigenschaften der Verfahren, keine Werbeversprechen. */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">Veredelung</p>
        <h2 className="mt-6 max-w-2xl font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
          Zwei Wege zu deinem Motiv.
          <span className="block text-gold-dark">Beide von Hand geprüft.</span>
        </h2>

        <div className="mt-14">
          <Veredelungsverfahren />
        </div>
      </section>

      {/* ══ Vertrauen / Social Proof ════════════════════════════════════
          Erscheint automatisch, sobald echte Kundenstimmen/Referenzen in
          config/referenzen.ts stehen – bis dahin rendert die Komponente
          nichts (keine Platzhalter). */}
      <Kundenstimmen />

      {/* ══ Konfigurator ════════════════════════════════════════════════
          Der eine dunkle Bruch im hellen Seitenfluss: der wichtigste Weg
          der Seite ist auch optisch der lauteste. */}
      <section className="fokus-hell bg-brand text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-28 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Selbst gestalten</p>
          <div className="mt-7 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.025em]">
              Deine Idee.
              <span className="block text-gold">Dein Statement.</span>
            </h2>
            <div>
              <p className="max-w-md text-[16px] leading-relaxed text-white/60">
                Logo hochladen oder Text setzen, auf Vorderseite, Rückseite und beiden
                Ärmeln platzieren. Die Vorschau zeigt jede Änderung sofort – samt Maßen
                in Zentimetern und aktuellem Preis.
              </p>
              <Link
                href="/konfigurator"
                className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-[15px] font-medium text-brand transition-all duration-300 ease-out hover:bg-gold hover:text-white active:scale-[0.98]"
              >
                Konfigurator öffnen
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>

          <ul className="mt-20 grid gap-x-10 gap-y-12 border-t border-white/10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
            <Schritt nr="01" titel="Vier Ansichten" text="Vorne, hinten und beide Ärmel – jede Fläche einzeln gestaltbar." />
            <Schritt nr="02" titel="Echte Maße" text="Jedes Motiv erscheint in Zentimetern, nicht in Pixeln." />
            <Schritt nr="03" titel="Preis in Echtzeit" text="Stück- und Gesamtpreis ändern sich mit jeder Anpassung." />
            <Schritt nr="04" titel="Ohne Mindestmenge" text="Ab einem Stück – Staffelpreise ab fünf." />
          </ul>
        </div>
      </section>

      {/* ══ Zahlen zum Haus ═════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-8">
        <dl className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          <Zahl wert={`${PRODUCTS.length}`} label="Artikel im Sortiment" />
          <Zahl wert={<>ab <WaehrungsPreis betragInEur={guenstigster} /></>} label="pro Stück, ohne Mindestmenge" />
          <Zahl wert={`${PRODUKTIONSTAGE.von}–${PRODUKTIONSTAGE.bis}`} label="Werktage Produktionszeit" />
          <Zahl wert={<WaehrungsPreis betragInEur={SHIPPING_RATES.DE.freeFrom} />} label="versandkostenfrei ab" />
        </dl>
      </section>
    </main>
  );
}

function Vorteil({ icon: Icon, titel, text }: { icon: LucideIcon; titel: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-light/80 to-gold-light/25 text-gold-dark ring-1 ring-gold/15 shadow-[0_1px_2px_rgba(43,36,28,0.06)]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-brand">{titel}</span>
        <span className="block text-[12px] leading-relaxed text-brand/70">{text}</span>
      </span>
    </li>
  );
}

function Schritt({ nr, titel, text }: { nr: string; titel: string; text: string }) {
  return (
    <li>
      <p className="font-serif text-[15px] text-gold">{nr}</p>
      <p className="mt-4 text-[16px] font-medium">{titel}</p>
      <p className="mt-2.5 text-[14px] leading-relaxed text-white/50">{text}</p>
    </li>
  );
}

function Zahl({ wert, label }: { wert: ReactNode; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <p className="font-serif text-[clamp(2.25rem,3.6vw,3.25rem)] font-normal leading-none tracking-[-0.02em] text-brand">
          {wert}
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-brand/70">{label}</p>
      </dd>
    </div>
  );
}
