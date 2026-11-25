import Link from 'next/link';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import { Scissors, Shirt, Clock, ShieldCheck, Palette, Users } from 'lucide-react';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';
import { veredelungVerfuegbar } from '@/config/bestellweg';

/**
 * Betreiberschalter (config/bestellweg.ts): Solange die Stickerei pausiert ist, nennt die Seite sie nicht als Leistung.
 * Der bisherige Wortlaut bleibt erhalten und kehrt zurück, sobald der Schalter geleert wird.
 */
const STICKEREI_AN = veredelungVerfuegbar('embroidery');

export const metadata = {
  alternates: { canonical: '/ueber-uns' },
  title: 'Über uns',
  description: STICKEREI_AN
    ? 'Embroidery Republic Germany veredelt in Köln Firmen- und Teambekleidung per DTF-Transferdruck und Stickerei – mit Live-Konfigurator, Markentextilien und persönlicher Betreuung.'
    : 'Embroidery Republic Germany veredelt in Köln Firmen- und Teambekleidung per DTF-Transferdruck – mit Live-Konfigurator, Markentextilien und persönlicher Betreuung.',
  openGraph: {
    title: 'Über Embroidery Republic Germany',
    description: STICKEREI_AN
      ? 'DTF-Transferdruck und Stickerei für Firmen- und Teambekleidung – mit Live-Konfigurator, Markentextilien und persönlicher Betreuung.'
      : 'DTF-Transferdruck für Firmen- und Teambekleidung – mit Live-Konfigurator, Markentextilien und persönlicher Betreuung.',
    images: [STANDARD_VORSCHAUBILD],
  },
};

const CAPABILITIES = [
  {
    icon: Shirt,
    title: STICKEREI_AN ? 'Zwei Veredelungsarten' : 'DTF-Transferdruck',
    text: STICKEREI_AN
      ? 'DTF-Transferdruck für vollfarbige Motive und Stickerei für langlebige, hochwertige Firmenlogos – aus einer Hand.'
      : 'Vollfarbige, auch fotorealistische Motive und große Flächen – direkt im Konfigurator bestellbar.',
  },
  {
    icon: Palette,
    title: 'Live-Konfigurator',
    text: 'Motiv platzieren, Farbe und Größen wählen, Preis in Echtzeit sehen – inklusive Mengenrabatt und Druckflächen-Prüfung.',
  },
  {
    icon: ShieldCheck,
    title: 'Kostenlose Designprüfung',
    text: 'Wir prüfen jede Datei vor der Produktion auf Auflösung, Platzierung und Umsetzbarkeit – und melden uns, bevor etwas schiefgeht.',
  },
  {
    icon: Clock,
    title: 'Planbare Produktion',
    text: `Produktion in ${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktagen ab Bestellfreigabe, Versand innerhalb von ${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktagen. Bei großen Mengen informieren wir dich vorab.`,
  },
  {
    icon: Users,
    title: 'Ab 1 Stück',
    text: 'Vom Einzelstück bis zur Großbestellung: Es gibt keine Mindestbestellmenge. Größen frei kombinierbar, Staffelpreise ab 5 Stück.',
  },
  {
    icon: Scissors,
    title: 'Markentextilien',
    text: 'Wir arbeiten mit etablierten Herstellern wie Fruit of the Loom, Gildan, Russell, B&C, Neutral, SOL’S, Stedman und Just Hoods.',
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-gold-dark transition-colors hover:text-gold">
        ← Zurück zur Startseite
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold-dark">{STICKEREI_AN ? 'Stickerei & DTF-Druck' : 'DTF-Transferdruck'}</p>
      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
        Über Embroidery Republic Germany
      </h1>
      <p className="mt-6 mb-12 max-w-xl text-[17px] leading-relaxed text-brand/70">
        {STICKEREI_AN
          ? 'Wir veredeln Firmen- und Teambekleidung – per DTF-Transferdruck für vollfarbige Motive und per Stickerei für langlebige Firmenlogos.'
          : 'Wir veredeln Firmen- und Teambekleidung per DTF-Transferdruck für vollfarbige Motive.'}{' '}
        Statt langer Angebotsschleifen gestaltest du deine
        Bekleidung direkt im Konfigurator: Motiv hochladen, platzieren, Farbe und Größen wählen – der
        Preis ist dabei jederzeit sichtbar.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <c.icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-brand">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-brand/70">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-cream/70 p-6 sm:p-8">
        <h2 className="font-serif text-xl font-normal text-brand">So läuft ein Auftrag ab</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-brand/70">
          {[
            'Produkt, Farbe und Größen im Konfigurator wählen.',
            'Logo hochladen oder Text gestalten und positionieren.',
            STICKEREI_AN
              ? 'DTF-Druck bestellst du direkt, Stickerei gibt es nur auf Anfrage – wir melden uns mit einem verbindlichen Angebot.'
              : 'DTF-Druck bestellst du direkt im Konfigurator.',
            'Wir prüfen das Design und melden uns mit der finalen Freigabe.',
            'Produktion und Versand – bei Kauf auf Rechnung erhältst du die Rechnung mit der Auftragsbearbeitung, bei Kreditkarte/PayPal hast du bereits im Checkout bezahlt.',
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-btn text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-gold-btn px-5 py-2.5 text-sm font-medium text-white shadow-elegant transition-all duration-300 ease-out hover:bg-gold-dark active:scale-[0.98]"
        >
          Jetzt konfigurieren
        </Link>
        <Link
          href="/kontakt"
          className="rounded-full border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold-dark transition-all duration-300 ease-out hover:bg-gold-light/40 active:scale-[0.98]"
        >
          Persönlich beraten lassen
        </Link>
      </div>
    </main>
  );
}
