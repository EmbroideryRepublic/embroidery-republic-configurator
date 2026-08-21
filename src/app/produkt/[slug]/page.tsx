/**
 * Öffentliche Produktseite.
 *
 * Zweck ist doppelt: Sie beantwortet die Fragen, die vor einer Anfrage
 * kommen (Material, Passform, Farben, Größen, Veredelungsflächen), und sie
 * macht den Katalog überhaupt auffindbar — der Konfigurator allein ist für
 * Suchmaschinen eine einzige Seite.
 *
 * Vollständig aus den Katalogdaten erzeugt. Ein neu registriertes Produkt
 * bekommt seine Seite ohne zusätzliche Pflege.
 *
 * Gestaltung bewusst in derselben warmen Sprache wie Startseite und
 * Konfigurator (brand/gold/cream, Serif-Überschriften, weiche Radien) – nicht
 * im neutralen Tailwind-Grau, damit die Seite nicht wie ein Fremdkörper wirkt.
 */
import { notFound } from 'next/navigation';
import { BadgeCheck, PackageCheck, Truck } from 'lucide-react';
import { steuersatzFuer } from '@/config/pricing/steuer';
import { IST_KLEINUNTERNEHMER } from '@/config/company';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { alleProduktSlugs, ladeProduktseite } from '@/lib/products/productPage';
import { produktTypLabelPlural } from '@/config/products/types';
import { produktBild, PLATZHALTER_BILD } from '@/lib/assets';
import { supplierRefVon } from '@/lib/suppliers/supplierRefs';
import { ProduktFarbwahl } from '@/components/produkt/ProduktFarbwahl';
import { ProduktFarbeProvider } from '@/components/produkt/ProduktFarbeContext';
import { KonfiguratorCta } from '@/components/produkt/KonfiguratorCta';
import { Veredelungsverfahren } from '@/components/shop/Veredelungsverfahren';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { cm } from '@/lib/format';
import { SHIPPING_RATES } from '@/config/shipping';
import { PRODUKTIONSZEIT_TEXT } from '@/config/company';
import { JsonLd } from '@/components/seo/JsonLd';
import { basisUrl } from '@/lib/seo/basisUrl';
import { brotkrumenSchema, produktSchema } from '@/lib/seo/strukturierteDaten';
import type { ProductConfig } from '@/config/products/types';

export function generateStaticParams() {
  return alleProduktSlugs().map((slug) => ({ slug }));
}

// Der Katalog ist Code (src/config/products/*), kein Laufzeit-Datenbestand –
// ein neues Produkt kommt nur per Deploy dazu, und generateStaticParams()
// erfasst es dann automatisch. `false` lässt Next.js unbekannte Slugs schon
// im Routing mit echtem 404 und dessen eigenem (kurzem) Cache-Control
// beantworten, statt sie wie eine echte Produktseite dynamisch zu rendern
// und mit demselben einjährigen s-maxage zu cachen (Soft-404-Risiko).
export const dynamicParams = false;

// Google zeigt den <title>-Tag ab ca. 60 Zeichen abgeschnitten an – und das
// Root-Layout hängt an JEDEN Titel automatisch den Marken-Suffix aus seinem
// Template an (src/app/layout.tsx: `%s | Embroidery Republic Germany`). Der
// Suffix zählt für die Darstellung mit, also bleibt für den hier erzeugten
// Titel nur der Rest des Budgets übrig.
const ROOT_TITEL_SUFFIX_LAENGE = ' | Embroidery Republic Germany'.length;
const GOOGLE_TITEL_ZIELLAENGE = 60;
const PRODUKT_TITEL_BUDGET = GOOGLE_TITEL_ZIELLAENGE - ROOT_TITEL_SUFFIX_LAENGE;

// Richtwert für Meta-Descriptions in der Google-Trefferliste; etwas Puffer
// unter den üblichen 160 Zeichen, damit das „…"-Kürzen selten zuschlägt.
const GOOGLE_DESCRIPTION_ZIELLAENGE = 155;

/**
 * Kürzt Text hart auf `maxLaenge`, bevorzugt an einer Wortgrenze, und hängt
 * bei tatsächlicher Kürzung ein „…" an. Einziger Ort für diese Regel, damit
 * Titel und Description dieselbe Kürzungslogik teilen.
 */
function kuerzenAufLaenge(text: string, maxLaenge: number): string {
  if (text.length <= maxLaenge) return text;
  const budget = maxLaenge - 1; // Platz für das „…"
  const abschnitt = text.slice(0, budget);
  const letzteLeerstelle = abschnitt.lastIndexOf(' ');
  // Nur an der Wortgrenze abschneiden, wenn dabei nicht zu viel verloren geht.
  const gekuerzt = letzteLeerstelle > budget * 0.6 ? abschnitt.slice(0, letzteLeerstelle) : abschnitt;
  return `${gekuerzt.trimEnd()}…`;
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const daten = ladeProduktseite(params.slug);
  if (!daten) return { title: 'Produkt nicht gefunden' };

  const { produkt, artLabel } = daten;
  // Größen-Text defensiv: Einheitsgrößen-Produkte (künftig z.B. Taschen,
  // Handtücher) führen eine oder keine Größe – dann keine „S–S"- oder
  // „undefined–undefined"-Spanne, sondern „Größe X" bzw. gar keine Angabe.
  const ersteGroesse = produkt.sizes[0];
  const letzteGroesse = produkt.sizes[produkt.sizes.length - 1];
  const groessenText = !ersteGroesse
    ? ''
    : ersteGroesse === letzteGroesse
      ? `, Größe ${ersteGroesse}`
      : `, Größen ${ersteGroesse}–${letzteGroesse}`;
  // Nur die häufigste/erste Materialzusammensetzung in die Description – bei
  // Produkten mit Farbgruppen-Ausnahmen (z.B. "80% Baumwolle / 20% Polyester
  // (Heather Grey: 92% Baumwolle / 8% Viskose)") steht die volle Aufschlüsselung
  // bereits sichtbar in der Datenzeile "Material" weiter unten auf der Seite.
  const materialKurz = (produkt.material.split('(')[0] ?? produkt.material).trim();
  const beschreibungRoh =
    `${produkt.name} von ${produkt.brand} – ${materialKurz}${produkt.weightGsm ? `, ${produkt.weightGsm} g/m²` : ''}, ` +
    `${produkt.colors.length} Farben${groessenText}. ` +
    `Mit DTF-Transferdruck oder Stickerei veredeln, ab 1 Stück.`;
  const beschreibung = kuerzenAufLaenge(beschreibungRoh, GOOGLE_DESCRIPTION_ZIELLAENGE);

  // Titel bevorzugt mit Marke ("{Name} | {Marke}"); passt das nicht ins
  // Budget, erst die Marke weglassen, erst als letzter Ausweg den Namen
  // selbst kürzen – "bedrucken & besticken" fällt komplett weg, das steht
  // schon sichtbar in H1/Beschreibung.
  const titelMitMarke = `${produkt.name} | ${produkt.brand}`;
  const titel =
    titelMitMarke.length <= PRODUKT_TITEL_BUDGET
      ? titelMitMarke
      : produkt.name.length <= PRODUKT_TITEL_BUDGET
        ? produkt.name
        : kuerzenAufLaenge(produkt.name, PRODUKT_TITEL_BUDGET);

  // Platzhalter (Bildimport noch offen) NIE als OpenGraph-Vorschaubild
  // ausliefern (ADR 0004): kein Platzhalter in externen Ausgaben.
  const ogBild = produkt.colors.length ? produktBild(produkt.id, produkt.colors) : undefined;
  return {
    title: titel,
    description: beschreibung,
    alternates: { canonical: `/produkt/${produkt.id}` },
    openGraph: {
      title: `${produkt.name} – ${artLabel} von ${produkt.brand}`,
      description: beschreibung,
      images: ogBild && ogBild !== PLATZHALTER_BILD ? [ogBild] : [],
      type: 'website',
    },
  };
}

function Datenzeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-brand/[0.06] py-2.5 text-sm last:border-0">
      <dt className="text-brand/50">{label}</dt>
      <dd className="text-right font-medium text-brand">{wert}</dd>
    </div>
  );
}

/** Kompakte Produktkarte für „Weitere …" und „Passt dazu". */
function MiniKarte({ produkt }: { produkt: ProductConfig }) {
  return (
    <Link
      href={`/produkt/${produkt.id}`}
      className="group rounded-2xl border border-brand/[0.08] bg-white p-3 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_18px_44px_-28px_rgba(43,36,28,0.4)]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-cream/40">
        {produkt.colors[0] && (
          <Image
            src={produktBild(produkt.id, produkt.colors)}
            alt={produkt.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-brand/40">{produkt.brand}</p>
      <p className="text-sm font-medium text-brand transition-colors group-hover:text-gold-dark">{produkt.name}</p>
      <p className="mt-1 text-xs text-brand/55">
        ab <WaehrungsPreis betragInEur={produkt.basePrice} />
      </p>
    </Link>
  );
}

export default function Produktseite({ params }: { params: { slug: string } }) {
  const daten = ladeProduktseite(params.slug);
  if (!daten) notFound();

  const { produkt, artLabel, stufeLabel, veredelungsflaechen, aehnliche, empfehlungen } = daten;
  const d = produkt.detailedDescription;

  const basis = basisUrl();

  return (
    <main className="min-h-screen bg-brand-light">
      {/* Strukturierte Daten: lassen Google Marke, Ab-Preis, Verfügbarkeit und
          Bild verstehen – Grundlage für ein angereichertes Suchergebnis. */}
      <JsonLd daten={produktSchema(produkt, basis)} />
      <JsonLd daten={brotkrumenSchema(produkt, artLabel, basis)} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Sichtbare Brotkrume und strukturierte Brotkrume müssen denselben Weg
            zeigen – vorher begann sie beim Konfigurator, die Auszeichnung aber
            bei Start/Produkte. Die Kategorie ist verlinkt: das hilft beim
            Zurückspringen und ist zugleich interne Verlinkung. */}
        <nav aria-label="Brotkrumen" className="mb-6 text-xs text-brand/45">
          <Link href="/" className="transition-colors hover:text-gold-dark">
            Start
          </Link>
          <span className="mx-2">/</span>
          <Link href="/produkt" className="transition-colors hover:text-gold-dark">
            Produkte
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/produkt?kategorie=${produkt.productType}`}
            className="transition-colors hover:text-gold-dark"
          >
            {artLabel}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand">{produkt.name}</span>
        </nav>

        {/* Bild, Farbwahl und der „Jetzt konfigurieren"-Link teilen sich die
            gewählte Farbe (ProduktFarbeContext) – nur so öffnet der
            Konfigurator zwingend auf der Variante, die der Kunde zuletzt
            gesehen hat, auch wenn er hier die Farbe gewechselt hat. */}
        <ProduktFarbeProvider produktId={produkt.id} colors={produkt.colors}>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Bild + Farbwahl – der einzige interaktive Teil der Seite. */}
          <ProduktFarbwahl produkt={produkt} />

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">{produkt.brand}</p>
            <h1 className="mt-1.5 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-tight text-brand">
              {produkt.name}
            </h1>
            <p className="mt-2 text-sm text-brand/55">{produkt.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-gold-light/60 px-3 py-1 text-xs font-medium text-gold-dark">
                {stufeLabel}
              </span>
              <span className="rounded-full bg-brand/[0.05] px-3 py-1 text-xs text-brand/70">{artLabel}</span>
              {produkt.weightGsm ? (
                <span className="rounded-full bg-brand/[0.05] px-3 py-1 text-xs text-brand/70">
                  {produkt.weightGsm} g/m²
                </span>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-brand/70">{produkt.description}</p>

            <div className="mt-6 rounded-2xl border border-gold/25 bg-white p-5 shadow-[0_16px_40px_-30px_rgba(43,36,28,0.4)]">
              <p className="text-sm text-brand/50">Ab</p>
              <p className="font-serif text-3xl font-normal text-brand">
                <WaehrungsPreis betragInEur={produkt.basePrice} />
              </p>
              <p className="mt-1 text-xs text-brand/50">
                {IST_KLEINUNTERNEHMER ? 'Kein Steuerausweis (§ 19 UStG)' : `inkl. ${steuersatzFuer().satz} % MwSt.`} ·
                pro Stück zzgl. Veredelung · ohne Mindestmenge · Staffelpreise ab 5 Stück
              </p>
              <KonfiguratorCta
                produktId={produkt.id}
                className="mt-4 block rounded-full bg-brand px-4 py-3 text-center text-sm font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 active:scale-[0.98]"
              >
                Jetzt konfigurieren
              </KonfiguratorCta>

              {/* Lieferinformationen gehören neben den Preis, nicht ins
                  Kleingedruckte: „Wann habe ich es?" ist die zweite Frage nach
                  dem Preis. Alle Werte sind belegt (config/shipping.ts, AGB). */}
              <ul className="mt-4 space-y-2 border-t border-gold/20 pt-3.5 text-xs text-brand/65">
                <li className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 flex-shrink-0 text-gold-dark" aria-hidden />
                  Produktion {PRODUKTIONSZEIT_TEXT}
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 flex-shrink-0 text-gold-dark" aria-hidden />
                  Versandkostenfrei ab <WaehrungsPreis betragInEur={SHIPPING_RATES.DE.freeFrom} /> (DE)
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 flex-shrink-0 text-gold-dark" aria-hidden />
                  Kostenlose Designprüfung vor der Produktion
                </li>
              </ul>
            </div>

            {/* Größen als Text, nicht als Auswahl – die Auswahl gehört in
                den Konfigurator, hier geht es um die Information. */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-brand">Verfügbare Größen</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {produkt.sizes.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-brand/15 bg-white px-2.5 py-1 text-xs text-brand/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        </ProduktFarbeProvider>

        {/* ── Veredelung ───────────────────────────────────────────────
            Überzeugende Darstellung der zwei Verfahren – gemeinsame
            Komponente mit der Startseite. */}
        <section className="mt-14">
          <h2 className="font-serif text-xl font-normal text-brand">
            So veredeln wir dein {artLabel}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-brand/55">
            Zwei Verfahren, dieselbe Fläche – du entscheidest im Konfigurator, was besser zu deinem
            Motiv passt.
          </p>
          <div className="mt-6">
            <Veredelungsverfahren />
          </div>
        </section>

        {/* ── Technische Daten ─────────────────────────────────────── */}
        <section className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-brand/[0.08] bg-white p-6">
            <h2 className="font-serif text-lg font-normal text-brand">Technische Daten</h2>
            <dl className="mt-3">
              <Datenzeile label="Marke" wert={produkt.brand} />
              <Datenzeile label="Produktart" wert={artLabel} />
              <Datenzeile label="Material" wert={produkt.material} />
              <Datenzeile label="Flächengewicht" wert={produkt.weightGsm ? `${produkt.weightGsm} g/m²` : '–'} />
              <Datenzeile label="Passform" wert={produkt.fit} />
              {d?.gender && <Datenzeile label="Schnitt" wert={d.gender} />}
              {d?.countryOfOrigin && <Datenzeile label="Herkunft" wert={d.countryOfOrigin} />}
              {supplierRefVon(produkt.id)?.articleNumber && (
                <Datenzeile label="Artikelnummer" wert={supplierRefVon(produkt.id)!.articleNumber} />
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-brand/[0.08] bg-white p-6">
            <h2 className="font-serif text-lg font-normal text-brand">Veredelungsflächen</h2>
            <p className="mt-1 text-xs text-brand/50">
              Maximal nutzbare Fläche je Ansicht – Nähte, Kragen und Saum sind bereits abgezogen.
            </p>
            <dl className="mt-3">
              {veredelungsflaechen.map((f) => (
                <Datenzeile
                  key={f.ansicht}
                  label={f.ansicht}
                  wert={`${cm(f.breiteCm)} × ${cm(f.hoeheCm)}`}
                />
              ))}
            </dl>
            <p className="mt-3 text-xs text-brand/50">
              Veredelung per DTF-Transferdruck oder Stickerei. Beide Verfahren nutzen dieselbe Fläche.
            </p>
          </div>
        </section>

        {/* ── Eigenschaften + Pflege ───────────────────────────────── */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {d?.bulletPoints && d.bulletPoints.length > 0 && (
            <div className="rounded-2xl border border-brand/[0.08] bg-white p-6">
              <h2 className="font-serif text-lg font-normal text-brand">Eigenschaften</h2>
              <ul className="mt-3 space-y-2 text-sm text-brand/70">
                {d.bulletPoints.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden="true" className="text-gold-dark">
                      ·
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-brand/[0.08] bg-white p-6">
            <h2 className="font-serif text-lg font-normal text-brand">Pflegehinweise</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand/70">{produkt.careInstructions}</p>

            {produkt.certifications.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-brand">Zertifizierungen</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {produkt.certifications.map((c) => (
                    <span key={c} className="rounded-md bg-brand/[0.05] px-2 py-1 text-xs text-brand/70">
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}

            {d?.sustainability && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-brand">Nachhaltigkeit</h3>
                <p className="mt-1 text-sm text-brand/70">{d.sustainability}</p>
              </>
            )}
          </div>
        </section>

        {/* ── Größentabelle ────────────────────────────────────────── */}
        {produkt.sizeGuide && produkt.sizeGuide.measurements.length > 0 && (
          <section className="mt-6 rounded-2xl border border-brand/[0.08] bg-white p-6">
            <h2 className="font-serif text-lg font-normal text-brand">Größentabelle</h2>
            <p className="mt-1 text-xs text-brand/50">
              Maße des Kleidungsstücks, flach gemessen. Breite quer über das Teil 2 cm unterhalb der
              Armausschnitte, Länge von der höchsten Schulterstelle bis zur Unterkante. Toleranz ± 2,5 cm.
            </p>
            <div className="mt-3 overflow-x-auto">
              {/* min-w-56 (224px) statt min-w-80 (320px): passt bei 320px
                  Viewport-Breite noch in die Karte (320 − 2×16px Seiten- −
                  2×24px Kartenpolster = 240px) – sonst fällt „Länge" ohne
                  jedes Scroll-Signal aus dem Sichtbereich. */}
              <table className="w-full min-w-56 text-sm">
                <thead>
                  <tr className="border-b border-brand/10 text-left text-xs uppercase tracking-wide text-brand/50">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Größe
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Breite
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Länge
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {produkt.sizeGuide.measurements.map((m) => (
                    <tr key={m.size} className="border-b border-brand/[0.06] last:border-0">
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-brand">
                        {m.size}
                      </th>
                      <td className="py-2 pr-4 text-brand/70">{cm(m.breiteCm)}</td>
                      <td className="py-2 text-brand/70">{cm(m.hoeheCm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Ähnliche Produkte (gleiche Art) ──────────────────────── */}
        {aehnliche.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-normal text-brand">
              Weitere {produktTypLabelPlural(produkt.productType)}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {aehnliche.map((a) => (
                <MiniKarte key={a.id} produkt={a} />
              ))}
            </div>
          </section>
        )}

        {/* ── Passt dazu (komplementäre Arten, Cross-Selling) ──────── */}
        {empfehlungen.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-xl font-normal text-brand">Passt dazu</h2>
            <p className="mt-1 text-sm text-brand/55">
              Dasselbe Motiv wirkt auf mehreren Teilen – ideal für Teams und Firmenausstattung.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {empfehlungen.map((e) => (
                <MiniKarte key={e.id} produkt={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
