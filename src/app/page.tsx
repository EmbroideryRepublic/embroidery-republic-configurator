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
 * Wirkung kommt aus Größe, Weißraum, Kontrast, Typografie und einer
 * bewusst asymmetrischen Komposition. Sobald echte Fotos vorliegen, treten
 * sie an die Stelle von Bühne und Farbband.
 *
 * ── Nur belegte Aussagen ──────────────────────────────────────────────
 * Jede Zahl stammt aus dem Code, nicht aus einem Entwurf: die Versandschwelle
 * aus `config/shipping.ts`, die Produktionszeit aus AGB und FAQ, die
 * Produkt-, Farb- und Materialzahlen aus dem Katalog, „Beliebte Produkte"
 * aus echten Verkaufszahlen der letzten 90 Tage (ladeBeliebtheit). Ohne
 * Verkaufsdaten (z.B. kurz nach Go-Live) greift ein nachvollziehbarer Ersatz
 * (Qualitätsstufe, dann Preis) – siehe lib/catalog/filter.ts::sortiere. Es
 * gibt bewusst KEINE Kundenzahl- oder Sternebewertungs-Behauptung: Die
 * Kundenstimmen-Sektion erscheint automatisch, sobald echte, freigegebene
 * Referenzen in config/referenzen.ts stehen – nicht vorher.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowRight, Boxes, Building2, Scissors, Timer, Truck, UserRound, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PRODUCTS } from '@/config/products';
import { repraesentativBildVon, produktBild } from '@/lib/assets';
import { waehlbareFarben } from '@/lib/products/farben';
import { FARBGRUPPEN } from '@/config/products/facetten';
import { produktTypLabel, PRODUCT_TYPE_ORDER, PRODUCT_TYPES } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { PRODUKTIONSTAGE } from '@/config/company';
import { sortiere } from '@/lib/catalog/filter';
import { ladeBeliebtheit } from '@/lib/catalog/beliebtheit';
import { ermittleVerfuegbarkeit } from '@/lib/catalog/verfuegbarkeit';
import { JsonLd } from '@/components/seo/JsonLd';
import { Veredelungsverfahren } from '@/components/shop/Veredelungsverfahren';
import { Kundenstimmen } from '@/components/shop/Kundenstimmen';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { Produktkachel } from '@/components/shop/Produktkachel';
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

/** So viele Beliebte-Produkte-Kacheln zeigt die Startseite. */
const BELIEBTE_ANZAHL = 4;
/** So viele Produkte tragen die Auszeichnung „Bestseller" – dasselbe Maß
 *  wie auf der Katalogseite (produkt/page.tsx), damit die Auszeichnung
 *  seitenübergreifend konsistent bleibt. */
const BESTSELLER_ANZAHL = 3;

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

export default async function Startseite() {
  const guenstigster = Math.min(...PRODUCTS.map((p) => p.basePrice));

  const kategorien = REIHENFOLGE.map((art) => {
    const treffer = PRODUCTS.filter((p) => p.productType === art);
    return { art, anzahl: treffer.length, bild: findeBild(treffer, art) };
  }).filter((k) => k.anzahl > 0);

  // Die Bühne zeigt die als `hero` markierte Art (Register) – aktuell der
  // Hoodie: größte Fläche, stärkster Auftritt bei der Auflösung, die die
  // Lieferantenfotos hergeben. Fällt keine hero-Art in den Bestand, greift die
  // erste Kategorie. Dieselbe Art führt unten die Kategorie-Komposition an,
  // ABER mit ihrem gewöhnlichen Katalogbild (nicht dem Bühnenbild) – sonst
  // erschiene dasselbe Freistellerfoto zweimal auf derselben Seite.
  const buehne = kategorien.find((k) => PRODUCT_TYPES[k.art]?.hero) ?? kategorien[0];
  const buehneDef = buehne ? PRODUCT_TYPES[buehne.art] : undefined;

  const featured = kategorien.find((k) => k.art === buehne?.art) ?? kategorien[0];
  const kleinereKategorien = kategorien.filter((k) => k.art !== featured?.art);

  // Bild für den Marken-Akzent in der „Für deine Marke"-Karte – ein echtes,
  // freigestelltes Katalogfoto (Jacke: passt thematisch zu Team-/Firmenwear),
  // kein fabriziertes Bild.
  const markenProdukt = PRODUCTS.find((p) => p.productType === 'jacket');
  const markenBild = markenProdukt?.colors.length
    ? produktBild(markenProdukt.id, markenProdukt.colors)
    : undefined;

  // „Beliebte Produkte" – echte Verkaufszahlen der letzten 90 Tage
  // (ladeBeliebtheit, DB-gestützt, fehlertolerant). Ohne Verkaufsdaten greift
  // derselbe nachvollziehbare Ersatz wie im Katalog (Qualitätsstufe, dann
  // Preis) – niemals eine zufällige oder erfundene Reihenfolge.
  const beliebtheit = await ladeBeliebtheit();
  const beliebteProdukte = sortiere(
    PRODUCTS.filter((p) => ermittleVerfuegbarkeit(p) === 'lieferbar'),
    'beliebtheit',
    beliebtheit
  ).slice(0, BELIEBTE_ANZAHL);
  const bestsellerIds = new Set(
    Object.entries(beliebtheit)
      .sort((a, b) => b[1] - a[1])
      .slice(0, BESTSELLER_ANZAHL)
      .map(([id]) => id)
  );

  return (
    <main className="bg-brand-light">
      <JsonLd daten={organisationSchema(basisUrl())} />

      {/* ══ Vertrauensleiste ════════════════════════════════════════════
          Direkt unter der Navigation, vor der Bühne. Vier belegte Fakten,
          keine Behauptung – bewusst keine Kunden-/Sternezahl, da echte
          Kundenstimmen aktuell nicht vorliegen (siehe Kopfkommentar). */}
      <div className="border-b border-gold/15 bg-cream/60">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 items-center gap-x-6 gap-y-2.5 px-4 py-3 text-[12.5px] text-brand/70 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:text-[13px] lg:justify-start sm:px-8">
          <Vertrauenspunkt icon={Boxes} text="Ab 1 Stück, ohne Mindestmenge" />
          <Vertrauenspunkt icon={Timer} text={`${PRODUKTIONSTAGE.von}–${PRODUKTIONSTAGE.bis} Werktage Produktion`} />
          <Vertrauenspunkt icon={Scissors} text="Stickerei & DTF-Transferdruck" />
          <Vertrauenspunkt icon={Truck}>
            Versandkostenfrei ab <WaehrungsPreis betragInEur={SHIPPING_RATES.DE.freeFrom} />
          </Vertrauenspunkt>
        </div>
      </div>

      {/* ══ Bühne ═══════════════════════════════════════════════════════
          Keine Bedienelemente über dem Aufmacher – zuerst kommt die Ware. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1500px] items-center gap-4 px-4 pb-16 pt-10 sm:px-8 lg:min-h-[84vh] lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pb-24 lg:pt-6">
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
                Produkte entdecken
              </Link>
            </div>
          </div>

          {/* Freisteller vor einer geschichteten Bühne. Das Bild stammt aus
              `public/buehne/` – dasselbe Lieferantenfoto, nur ohne den
              weißen Studiohintergrund (scripts/buehneFreistellen.mts). Die
              Katalogdatei selbst bleibt unangetastet, der Konfigurator
              rechnet mit ihr. Originalauflösung, nichts hochskaliert. */}
          <div className="relative order-1 flex items-center justify-center py-6 lg:order-2 lg:py-0">
            <div
              aria-hidden
              className="absolute h-[min(88vw,640px)] w-[min(88vw,640px)] rounded-full bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f6efe2_55%,rgba(246,239,226,0)_72%)]"
            />
            <div
              aria-hidden
              className="absolute h-[min(74vw,540px)] w-[min(74vw,540px)] rounded-full border border-gold/20 blur-[1px]"
            />

            {/* Bild und schwebende Karte teilen sich EINEN Wrapper in der
                tatsächlichen Bildbreite – sonst positioniert sich die Karte
                gegen die volle (breitere) Grid-Spalte statt gegen die
                Bildkante und schwebt sichtbar daneben statt darauf. */}
            <div className="relative w-[min(76vw,540px)]">
              {buehneDef?.heroBild && (
                <Image
                  src={buehneDef.heroBild}
                  alt={buehneDef.heroAlt ?? ''}
                  width={620}
                  height={720}
                  priority
                  sizes="(max-width: 1024px) 76vw, 540px"
                  className="relative h-auto w-full drop-shadow-[0_46px_60px_rgba(43,36,28,0.16)]"
                />
              )}

              {/* Schwebende Kennzahl-Karte – belegte Zahl statt Behauptung. */}
              <div className="absolute bottom-[6%] left-0 flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3.5 shadow-elegant ring-1 ring-brand/[0.06] backdrop-blur-sm">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-light/70 text-gold-dark">
                  <Timer className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-brand">
                    {PRODUKTIONSTAGE.von}–{PRODUKTIONSTAGE.bis} Werktage
                  </span>
                  <span className="block text-[12px] text-brand/70">von Bestellung bis Versand</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Kategorien ══════════════════════════════════════════════════
          Eine große, führende Kategorie neben einem kompakteren Feld der
          übrigen – asymmetrisch statt eines gleichförmigen Rasters. */}
      <section className="mx-auto max-w-[1500px] px-4 pb-24 pt-6 sm:px-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">Kategorien entdecken</p>
          <h2 className="mt-6 font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] font-normal leading-[1.02] tracking-[-0.025em] text-brand">
            Ihre Lieblingsstücke.
            <span className="block">Ihre Marke.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-brand/70">
            Wähle dein Textil und gestalte es mit deinem Logo, Motiv oder Schriftzug.
            Basics mit Substanz, perfekt veredelt – für Einzelpersonen, Teams und Marken.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_1.55fr] lg:gap-8">
          {featured?.bild && (
            <Link href={`/produkt?kategorie=${featured.art}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white ring-1 ring-brand/[0.05] transition-shadow duration-300 group-hover:shadow-[0_28px_60px_-28px_rgba(43,36,28,0.3)] lg:aspect-auto lg:h-full lg:min-h-[420px]">
                <Image
                  src={featured.bild}
                  alt={produktTypLabel(featured.art)}
                  fill
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  priority
                  className="object-contain p-10 transition-transform duration-[700ms] ease-out group-hover:scale-[1.04] sm:p-14"
                />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-[26px] leading-snug text-brand transition-colors duration-300 group-hover:text-gold-dark">
                    {produktTypLabel(featured.art)}
                  </p>
                  <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-brand/70">
                    {PRODUCT_TYPES[featured.art]?.kachelText}
                  </p>
                </div>
                <span className="mt-1 inline-flex h-7 min-w-[1.75rem] flex-shrink-0 items-center justify-center rounded-full bg-gold-light/60 px-2.5 text-[13px] tabular-nums text-gold-dark">
                  {featured.anzahl}
                </span>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
            {kleinereKategorien.map(({ art, anzahl, bild }) => (
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
          </div>
        </div>
      </section>

      {/* ══ Beliebte Produkte ═══════════════════════════════════════════
          Echte Verkaufszahlen statt einer redaktionellen Auswahl – siehe
          Kopfkommentar. Ohne Verkaufsdaten ein nachvollziehbarer Ersatz,
          niemals eine erfundene Reihenfolge. */}
      {beliebteProdukte.length > 0 && (
        <section className="border-t border-brand/[0.06] bg-sand/25">
          <div className="mx-auto max-w-[1500px] px-4 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">Beliebte Produkte</p>
                <h2 className="mt-6 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
                  Häufig gewählt.
                  <span className="block text-gold-dark">Immer mit Substanz.</span>
                </h2>
              </div>
              <Link
                href="/produkt"
                className="group inline-flex items-center gap-2 border-b border-brand/25 pb-1 text-[15px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                Alle Produkte ansehen
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 md:grid-cols-4">
              {beliebteProdukte.map((p, index) => (
                <Produktkachel
                  key={p.id}
                  produkt={p}
                  bestseller={bestsellerIds.has(p.id)}
                  ansicht="raster"
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ Veredelung ══════════════════════════════════════════════════
          Zwei Verfahren, klar erklärt – Verständnis schafft Vertrauen und
          bereitet die Entscheidung im Konfigurator vor. Getönter Hintergrund
          setzt den Abschnitt bewusst gegen die weißen Nachbarflächen ab. Die
          Kurzbeschreibung ist deckungsgleich mit dem Methodenwähler (i18n),
          die Merkmale sind allgemeingültige Eigenschaften der Verfahren,
          keine Werbeversprechen. */}
      <section className="border-y border-brand/[0.06] bg-cream-dark/70">
        <div className="mx-auto max-w-[1500px] px-4 py-24 sm:px-8">
          {/* Bewusst kleiner und ohne Kicker/Goldzeile als die Sektionen
              davor und danach: Veredelung erklärt, verkauft aber nichts
              Eigenes – die ruhigere, zweispaltige Form markiert sie als
              Zwischenschritt, nicht als dritten Verkaufsblock in Folge. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-md font-serif text-[clamp(1.75rem,2.8vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] text-brand">
              Zwei Wege zu deinem Motiv.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-brand/70 lg:text-right">
              Je nach Material und Motiv fällt die Wahl unterschiedlich aus – DTF-Transferdruck für
              Farbverläufe und große Flächen, Stickerei für Logos, die lange halten sollen.
            </p>
          </div>

          <div className="mt-14">
            <Veredelungsverfahren />
          </div>
        </div>
      </section>

      {/* ══ Für dich. Für dein Team. Für deine Marke. ══════════════════
          Beantwortet direkt, wer hier einkauft – Einzelpersonen genauso wie
          Teams, Vereine und aufstrebende Marken. Jede Aussage ist eine
          bestehende, funktionierende Eigenschaft des Shops (Staffelpreise,
          keine Mindestmenge, Kontaktformular), keine erfundene Fallstudie. */}
      <section className="mx-auto max-w-[1500px] px-4 py-28 sm:px-8">
        <h2 className="max-w-2xl font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
          Für dich. Für dein Team.
          <span className="block text-gold-dark">Für deine Marke.</span>
        </h2>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <Zielgruppe
            icon={UserRound}
            titel="Für dich"
            text="Gestalte dein eigenes Unikat – Logo, Text oder Motiv auf deinem Lieblingsteil. Auch als Einzelstück."
            linkHref="/konfigurator"
            linkLabel="Jetzt gestalten"
          />
          <Zielgruppe
            icon={Users}
            titel="Für dein Team"
            text="Einheitliche Kleidung für Verein, Firma oder Event – mit Staffelpreisen und eurem Logo auf jedem Teil."
            linkHref="/konfigurator"
            linkLabel="Team ausstatten"
          />
          <Zielgruppe
            icon={Building2}
            titel="Für deine Marke"
            text="Baue dein eigenes Label auf: dein Logo, gestickt oder gedruckt, auf Teilen, die auch ohne Logo überzeugen."
            linkHref="/kontakt"
            linkLabel="Anfrage stellen"
            bild={markenBild}
            bildAlt={markenProdukt?.name}
          />
        </div>
      </section>

      {/* ══ Vertrauen / Social Proof ════════════════════════════════════
          Erscheint automatisch, sobald echte Kundenstimmen/Referenzen in
          config/referenzen.ts stehen – bis dahin rendert die Komponente
          nichts (keine Platzhalter). */}
      <Kundenstimmen />

      {/* ══ Konfigurator ════════════════════════════════════════════════
          Der eine dunkle Bruch im hellen Seitenfluss: der wichtigste Weg
          der Seite ist auch optisch der lauteste. Vier Schritte erklären
          zugleich, wie der Konfigurator funktioniert, und münden im
          stärksten Aufruf der Seite. */}
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
            <Schritt nr="04" titel="Kein Minimum" text="Ein Stück reicht – ab fünf zahlst du den Staffelpreis." />
          </ul>
        </div>
      </section>
    </main>
  );
}

function Vertrauenspunkt({ icon: Icon, text, children }: { icon: LucideIcon; text?: string; children?: ReactNode }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
      <Icon className="h-[15px] w-[15px] flex-shrink-0 text-gold-dark" strokeWidth={1.75} aria-hidden />
      {text ?? children}
    </span>
  );
}

function Zielgruppe({
  icon: Icon, titel, text, linkHref, linkLabel, bild, bildAlt,
}: {
  icon: LucideIcon;
  titel: string;
  text: string;
  linkHref: string;
  linkLabel: string;
  bild?: string;
  bildAlt?: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-cream p-8 transition-colors duration-300 hover:bg-sand/40 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        {bild && (
          <span className="relative hidden h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-brand/[0.06] sm:block">
            <Image src={bild} alt={bildAlt ?? ''} fill sizes="64px" className="object-contain p-2" />
          </span>
        )}
      </div>
      <h3 className="mt-6 font-serif text-[22px] font-normal text-brand">{titel}</h3>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-brand/70">{text}</p>
      <Link
        href={linkHref}
        className="group mt-7 inline-flex items-center gap-2 self-start text-[14px] font-medium text-gold-dark transition-colors duration-300 hover:text-brand"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
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
