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
 */
import { notFound } from 'next/navigation';
import { BadgeCheck, PackageCheck, Truck } from 'lucide-react';
import { steuersatzFuer } from '@/config/pricing/steuer';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { alleProduktSlugs, ladeProduktseite } from '@/lib/products/productPage';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import { ProduktFarbwahl } from '@/components/produkt/ProduktFarbwahl';
import { cm, formatiereGeld } from '@/lib/format';
import { SHIPPING_RATES } from '@/config/shipping';
import { PRODUKTIONSZEIT_TEXT } from '@/config/company';
import { JsonLd } from '@/components/seo/JsonLd';
import { basisUrl } from '@/lib/seo/basisUrl';
import { brotkrumenSchema, produktSchema } from '@/lib/seo/strukturierteDaten';

export function generateStaticParams() {
  return alleProduktSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const daten = ladeProduktseite(params.slug);
  if (!daten) return { title: 'Produkt nicht gefunden' };

  const { produkt, artLabel } = daten;
  const beschreibung =
    `${produkt.name} von ${produkt.brand} – ${produkt.material}, ${produkt.weightGsm} g/m², ` +
    `${produkt.colors.length} Farben, Größen ${produkt.sizes[0]}–${produkt.sizes[produkt.sizes.length - 1]}. ` +
    `Mit DTF-Transferdruck oder Stickerei veredeln, ab 1 Stück.`;

  return {
    title: `${produkt.name} bedrucken & besticken | ${produkt.brand}`,
    description: beschreibung,
    openGraph: {
      title: `${produkt.name} – ${artLabel} von ${produkt.brand}`,
      description: beschreibung,
      images: produkt.colors[0] ? [produkt.colors[0].images.front] : [],
      type: 'website',
    },
  };
}

function Datenzeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{wert}</dd>
    </div>
  );
}

export default function Produktseite({ params }: { params: { slug: string } }) {
  const daten = ladeProduktseite(params.slug);
  if (!daten) notFound();

  const { produkt, artLabel, stufeLabel, veredelungsflaechen, aehnliche } = daten;
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
        <nav aria-label="Brotkrumen" className="mb-6 text-xs text-gray-500">
          <Link href="/" className="transition-colors hover:text-gray-800">
            Start
          </Link>
          <span className="mx-2">/</span>
          <Link href="/produkt" className="transition-colors hover:text-gray-800">
            Produkte
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/produkt?kategorie=${produkt.productType}`}
            className="transition-colors hover:text-gray-800"
          >
            {artLabel}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{produkt.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Bild + Farbwahl – der einzige interaktive Teil der Seite. */}
          <ProduktFarbwahl produkt={produkt} />

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{produkt.brand}</p>
            <h1 className="mt-1 text-2xl font-semibold text-brand">{produkt.name}</h1>
            <p className="mt-2 text-sm text-gray-600">{produkt.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-gold-light/50 px-3 py-1 text-xs font-medium text-brand">
                {stufeLabel}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{artLabel}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {produkt.weightGsm} g/m²
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-gray-700">{produkt.description}</p>

            <div className="mt-6 rounded-lg border border-gold/40 bg-white p-4">
              <p className="text-sm text-gray-600">Ab</p>
              <p className="text-2xl font-semibold text-brand">
                {formatiereGeld(produkt.basePrice)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                inkl. {steuersatzFuer().satz} % MwSt. · pro Stück zzgl. Veredelung · ohne Mindestmenge ·
                Staffelpreise ab 5 Stück
              </p>
              <Link
                href={`/konfigurator?produkt=${produkt.id}`}
                className="mt-4 block rounded-lg bg-brand px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand/90"
              >
                Jetzt konfigurieren
              </Link>

              {/* Lieferinformationen gehören neben den Preis, nicht ins
                  Kleingedruckte: „Wann habe ich es?" ist die zweite Frage nach
                  dem Preis. Alle Werte sind belegt (config/shipping.ts, AGB). */}
              <ul className="mt-4 space-y-1.5 border-t border-gold/20 pt-3 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <PackageCheck className="h-3.5 w-3.5 flex-shrink-0 text-gold-dark" aria-hidden />
                  Produktion {PRODUKTIONSZEIT_TEXT}
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-gold-dark" aria-hidden />
                  Versandkostenfrei ab {formatiereGeld(SHIPPING_RATES.DE.freeFrom)} (DE)
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-gold-dark" aria-hidden />
                  Kostenlose Designprüfung vor der Produktion
                </li>
              </ul>
            </div>

            {/* Größen als Text, nicht als Auswahl – die Auswahl gehört in
                den Konfigurator, hier geht es um die Information. */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900">Verfügbare Größen</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {produkt.sizes.map((s) => (
                  <span key={s} className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Technische Daten ─────────────────────────────────────── */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-brand">Technische Daten</h2>
            <dl className="mt-3">
              <Datenzeile label="Marke" wert={produkt.brand} />
              <Datenzeile label="Produktart" wert={artLabel} />
              <Datenzeile label="Material" wert={produkt.material} />
              <Datenzeile label="Flächengewicht" wert={`${produkt.weightGsm} g/m²`} />
              <Datenzeile label="Passform" wert={produkt.fit} />
              {d?.gender && <Datenzeile label="Schnitt" wert={d.gender} />}
              {d?.countryOfOrigin && <Datenzeile label="Herkunft" wert={d.countryOfOrigin} />}
              {produkt.supplier?.articleNumber && (
                <Datenzeile label="Artikelnummer" wert={produkt.supplier.articleNumber} />
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-brand">Veredelungsflächen</h2>
            <p className="mt-1 text-xs text-gray-500">
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
            <p className="mt-3 text-xs text-gray-500">
              Veredelung per DTF-Transferdruck oder Stickerei. Beide Verfahren nutzen dieselbe Fläche.
            </p>
          </div>
        </section>

        {/* ── Eigenschaften + Pflege ───────────────────────────────── */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {d?.bulletPoints && d.bulletPoints.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-brand">Eigenschaften</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                {d.bulletPoints.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden="true" className="text-gold">
                      ·
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-brand">Pflegehinweise</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">{produkt.careInstructions}</p>

            {produkt.certifications.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-gray-900">Zertifizierungen</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {produkt.certifications.map((c) => (
                    <span key={c} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}

            {d?.sustainability && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-gray-900">Nachhaltigkeit</h3>
                <p className="mt-1 text-sm text-gray-700">{d.sustainability}</p>
              </>
            )}
          </div>
        </section>

        {/* ── Größentabelle ────────────────────────────────────────── */}
        {produkt.sizeGuide && produkt.sizeGuide.measurements.length > 0 && (
          <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-brand">Größentabelle</h2>
            <p className="mt-1 text-xs text-gray-500">
              Maße des Kleidungsstücks, flach gemessen. Breite quer über das Teil 2 cm unterhalb der
              Armausschnitte, Länge von der höchsten Schulterstelle bis zur Unterkante. Toleranz ± 2,5 cm.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-80 text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
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
                    <tr key={m.size} className="border-b border-gray-100 last:border-0">
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-gray-900">
                        {m.size}
                      </th>
                      <td className="py-2 pr-4 text-gray-700">{cm(m.breiteCm)}</td>
                      <td className="py-2 text-gray-700">{cm(m.hoeheCm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Ähnliche Produkte ────────────────────────────────────── */}
        {aehnliche.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-semibold text-brand">
              Weitere {PRODUCT_TYPE_LABELS[produkt.productType]}s
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
              {aehnliche.map((a) => (
                <Link
                  key={a.id}
                  href={`/produkt/${a.id}`}
                  className="group rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gold"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-gray-50">
                    {a.colors[0] && (
                      <Image
                        src={a.colors[0].images.front}
                        alt={a.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{a.brand}</p>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand">{a.name}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    ab {formatiereGeld(a.basePrice)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
