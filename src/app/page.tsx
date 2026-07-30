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
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, Package, Receipt, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PRODUCTS } from '@/config/products';
import { FARBGRUPPEN } from '@/config/products/facetten';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { PRODUKTIONSTAGE, PAYMENT_TERM_DAYS } from '@/config/company';
import { formatiereGeld } from '@/lib/format';
import { JsonLd } from '@/components/seo/JsonLd';
import { Veredelungsverfahren } from '@/components/shop/Veredelungsverfahren';
import { basisUrl } from '@/lib/seo/basisUrl';
import { organisationSchema } from '@/lib/seo/strukturierteDaten';
import type { ProductType } from '@/types';

export const metadata: Metadata = {
  title: 'Textilveredelung mit Stickerei & DTF-Druck',
  description:
    'Hochwertige Stickerei und DTF-Transferdruck für Unternehmen, Vereine und Marken. Selbst gestalten im Konfigurator – ab 1 Stück, ohne Mindestbestellmenge.',
};

/** Reihenfolge der Kacheln: von der häufigsten Anfrage abwärts. */
const REIHENFOLGE: ProductType[] = [
  'tshirt', 'polo', 'hoodie', 'zip-hoodie', 'sweater', 'longsleeve', 'jacket', 'vest',
];

/**
 * Wunschfarbe je Kachel.
 *
 * Ohne diese Vorgabe zeigt jede Kachel `colors[0]` – und weil die Kataloge
 * fast überall mit Schwarz beginnen, stand hier eine Reihe aus sieben nahezu
 * gleichen dunklen Umrissen. Gesucht wird deshalb pro Kachel eine andere
 * Farbfamilie; gezeigt wird nur, was der Katalog auch führt (findeBild fällt
 * sonst auf die erste Farbe zurück – es wird nichts eingefärbt).
 */
const KACHELFARBE: Partial<Record<ProductType, string[]>> = {
  tshirt: ['rot'], polo: ['blau'], hoodie: ['grau'], 'zip-hoodie': ['schwarz'],
  sweater: ['gruen'], longsleeve: ['weiss'], jacket: ['blau'], vest: ['rot'],
};

/** Erstes echtes Katalogbild in einer der Wunschfarbfamilien. */
function findeBild(treffer: typeof PRODUCTS, art: ProductType): string | undefined {
  for (const wunsch of KACHELFARBE[art] ?? []) {
    for (const p of treffer) {
      const farbe = p.colors.find((c) => FARBGRUPPEN[c.name] === wunsch);
      if (farbe) return farbe.images.front;
    }
  }
  return treffer[0]?.colors[0]?.images.front;
}

/** Farbfamilien in der Reihenfolge des Spektrums – das Band soll fließen. */
const FAMILIENFOLGE = [
  'weiss', 'beige', 'gelb', 'orange', 'rot', 'rosa', 'lila',
  'blau', 'tuerkis', 'gruen', 'braun', 'grau', 'schwarz',
];

export default function Startseite() {
  const guenstigster = Math.min(...PRODUCTS.map((p) => p.basePrice));
  const marken = new Set(PRODUCTS.map((p) => p.brand)).size;
  const materialien = new Set(PRODUCTS.map((p) => p.material)).size;

  const kategorien = REIHENFOLGE.map((art) => {
    const treffer = PRODUCTS.filter((p) => p.productType === art);
    return { art, anzahl: treffer.length, bild: findeBild(treffer, art) };
  }).filter((k) => k.anzahl > 0);

  // Jeder Punkt im Farbband ist ein echter Farbwert aus den Produktdaten,
  // kein Entwurfsraster. Gleiche Farbnamen erscheinen nur einmal.
  const toene = new Map<string, { hex: string; gruppe: string }>();
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      const gruppe = FARBGRUPPEN[c.name];
      if (c.hex && gruppe && !toene.has(c.name)) toene.set(c.name, { hex: c.hex, gruppe });
    }
  }
  const farben = [...toene.entries()]
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => FAMILIENFOLGE.indexOf(a.gruppe) - FAMILIENFOLGE.indexOf(b.gruppe));

  // Die Bühne zeigt den Hoodie: größte Fläche, stärkster Auftritt bei der
  // Auflösung, die die Lieferantenfotos hergeben.
  const buehne = kategorien.find((k) => k.art === 'hoodie') ?? kategorien[0];

  return (
    <main className="bg-brand-light">
      <JsonLd daten={organisationSchema(basisUrl())} />
      {/* ══ Bühne ═══════════════════════════════════════════════════════
          Keine Vorteilsleiste, keine Bedienelemente über dem Aufmacher –
          zuerst kommt die Ware. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1500px] items-center gap-4 px-4 pb-14 pt-6 sm:px-8 lg:min-h-[86vh] lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-0">
          <div className="relative z-10 order-2 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
              Stickerei &amp; DTF-Druck
            </p>
            <h1 className="mt-7 font-serif text-[clamp(3.5rem,7.6vw,7.5rem)] font-normal leading-[0.9] tracking-[-0.025em] text-brand">
              Dein Design.
              <span className="mt-1 block text-gold">Unsere Qualität.</span>
            </h1>
            <p className="mt-9 max-w-[19rem] text-[17px] leading-relaxed text-brand/55">
              Veredelte Textilien für alle, die nicht von der Stange tragen.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/konfigurator"
                className="group inline-flex items-center gap-3 rounded-full bg-brand px-9 py-4 text-[15px] font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 hover:shadow-[0_16px_36px_-12px_rgba(43,36,28,0.5)]"
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
            {buehne && (
              <Image
                src="/buehne/hoodie.png"
                alt="Hoodie aus dem Sortiment, bereit zur Veredelung"
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

      {/* ══ Serviceversprechen ══════════════════════════════════════════
          Vertrauensanker direkt unter der Bühne: was der Kunde bekommt,
          bevor er stöbert. Ausschließlich belegte Zusagen aus config/*. */}
      <section className="border-y border-brand/[0.08] bg-white/60">
        <ul className="mx-auto grid max-w-[1500px] sm:grid-cols-2 lg:grid-cols-4">
          <Versprechen
            icon={ShieldCheck}
            titel="Kostenlose Designprüfung"
            text="Wir prüfen jedes Motiv vor der Produktion – auf unsere Kosten."
          />
          <Versprechen
            icon={Package}
            titel="Ab 1 Stück"
            text="Keine Mindestmenge. Staffelpreise beginnen ab fünf Stück."
          />
          <Versprechen
            icon={Sparkles}
            titel="Druck & Stickerei"
            text="DTF für Farbverläufe, Stickerei für edle Firmenlogos."
          />
          <Versprechen
            icon={Receipt}
            titel="Kauf auf Rechnung"
            text={`Zahlungsziel ${PAYMENT_TERM_DAYS} Tage – keine Vorkasse nötig.`}
          />
        </ul>
      </section>

      {/* ══ Sortiment ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1500px] px-4 pb-24 pt-24 sm:px-8">
        <div className="flex items-end justify-between gap-8">
          <h2 className="font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
            Für jeden Look
            <span className="block text-gold">das Richtige.</span>
          </h2>
          <Link
            href="/produkt"
            className="group hidden shrink-0 items-center gap-2 border-b border-brand/20 pb-1 text-[14px] text-brand/60 transition-colors duration-300 hover:border-brand hover:text-brand sm:inline-flex"
          >
            Alle {PRODUCTS.length} Artikel
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
          {kategorien.map(({ art, anzahl, bild }) => (
            <Link key={art} href={`/produkt?kategorie=${art}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-white">
                {bild && (
                  <Image
                    src={bild}
                    alt={PRODUCT_TYPE_LABELS[art]}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw"
                    className="object-contain p-8 transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
                  />
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-3">
                <p className="font-serif text-[19px] text-brand transition-colors duration-300 group-hover:text-gold-dark">
                  {PRODUCT_TYPE_LABELS[art]}
                </p>
                <p className="text-[12px] tabular-nums text-brand/35">{anzahl}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ Farbe ═══════════════════════════════════════════════════════ */}
      <section className="border-y border-brand/[0.08] bg-white/50">
        <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-4 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Farbe</p>
            <h2 className="mt-6 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
              {farben.length} Farbtöne.
              <span className="block text-gold">Einer ist deiner.</span>
            </h2>
            <p className="mt-7 max-w-sm text-[16px] leading-relaxed text-brand/55">
              Von Naturweiß bis Tiefschwarz – gewachsen aus {marken} Marken und{' '}
              {materialien} Materialien.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2.5">
            {farben.map(({ name, hex, gruppe }) => (
              <li key={name}>
                <Link
                  href={`/produkt?farbe=${gruppe}`}
                  title={name}
                  className="block h-11 w-11 rounded-full ring-1 ring-inset ring-black/[0.09] transition-transform duration-300 ease-out hover:scale-110 hover:ring-black/25"
                  style={{ backgroundColor: hex }}
                >
                  <span className="sr-only">{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ Veredelung ══════════════════════════════════════════════════
          Zwei Verfahren, klar erklärt – Verständnis schafft Vertrauen und
          bereitet die Entscheidung im Konfigurator vor. Die Kurzbeschreibung
          ist deckungsgleich mit dem Methodenwähler (i18n), die Merkmale sind
          allgemeingültige Eigenschaften der Verfahren, keine Werbeversprechen. */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Veredelung</p>
        <h2 className="mt-6 max-w-2xl font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
          Zwei Wege zu deinem Motiv.
          <span className="block text-gold">Beide von Hand geprüft.</span>
        </h2>

        <div className="mt-14">
          <Veredelungsverfahren />
        </div>
      </section>

      {/* ══ Konfigurator ════════════════════════════════════════════════
          Der eine dunkle Bruch im hellen Seitenfluss: der wichtigste Weg
          der Seite ist auch optisch der lauteste. */}
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-28 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Selbst gestalten</p>
          <div className="mt-7 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.025em]">
              Dein Design.
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
                className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-[15px] font-medium text-brand transition-all duration-300 ease-out hover:bg-gold hover:text-white"
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
          <Zahl wert={`ab ${formatiereGeld(guenstigster)}`} label="pro Stück, ohne Mindestmenge" />
          <Zahl wert={`${PRODUKTIONSTAGE.von}–${PRODUKTIONSTAGE.bis}`} label="Werktage Produktionszeit" />
          <Zahl wert={formatiereGeld(SHIPPING_RATES.DE.freeFrom)} label="versandkostenfrei ab" />
        </dl>
      </section>
    </main>
  );
}

function Versprechen({ icon: Icon, titel, text }: { icon: LucideIcon; titel: string; text: string }) {
  return (
    <li className="flex items-start gap-4 px-6 py-8 sm:px-8 lg:[&:not(:first-child)]:border-l lg:border-brand/[0.06]">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gold-light/60 text-gold-dark">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block font-serif text-[17px] leading-tight text-brand">{titel}</span>
        <span className="mt-1.5 block text-[13px] leading-relaxed text-brand/50">{text}</span>
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

function Zahl({ wert, label }: { wert: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <p className="font-serif text-[clamp(2.25rem,3.6vw,3.25rem)] font-normal leading-none tracking-[-0.02em] text-brand">
          {wert}
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-brand/45">{label}</p>
      </dd>
    </div>
  );
}
