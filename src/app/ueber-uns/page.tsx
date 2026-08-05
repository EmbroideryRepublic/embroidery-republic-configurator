import Link from 'next/link';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import { Scissors, Shirt, Clock, ShieldCheck, Palette, Users } from 'lucide-react';

export const metadata = {
  alternates: { canonical: '/ueber-uns' },
  title: 'Über uns',
  description:
    'Embroidery Republic Germany veredelt Firmen- und Teambekleidung per DTF-Transferdruck und Stickerei – mit Live-Konfigurator, Markentextilien und persönlicher Betreuung.',
};

const CAPABILITIES = [
  {
    icon: Shirt,
    title: 'Zwei Veredelungsarten',
    text: 'DTF-Transferdruck für vollfarbige Motive und Stickerei für langlebige, hochwertige Firmenlogos – aus einer Hand.',
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
    text: `Produktion in ${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktagen ab Bestellfreigabe, Versand innerhalb von ${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktagen. Bei großen Mengen informieren wir Sie vorab.`,
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

      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold">Stickerei &amp; DTF-Druck</p>
      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
        Über Embroidery Republic Germany
      </h1>
      <p className="mt-6 mb-12 max-w-xl text-[17px] leading-relaxed text-brand/60">
        Wir veredeln Firmen- und Teambekleidung – per DTF-Transferdruck für vollfarbige Motive und
        per Stickerei für langlebige Firmenlogos. Statt langer Angebotsschleifen gestalten Sie Ihre
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
            <p className="mt-1 text-xs leading-relaxed text-brand/60">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-cream/70 p-6 sm:p-8">
        <h2 className="font-serif text-xl font-normal text-brand">So läuft ein Auftrag ab</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-brand/70">
          {[
            'Produkt, Farbe und Größen im Konfigurator wählen.',
            'Logo hochladen oder Text gestalten und positionieren.',
            'Bestellen oder unverbindlich anfragen – ganz wie Sie möchten.',
            'Wir prüfen das Design und melden uns mit der finalen Freigabe.',
            'Produktion und Versand – die Rechnung folgt mit der Auftragsbearbeitung.',
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-white">
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
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white shadow-elegant transition-all duration-300 ease-out hover:bg-gold-dark active:scale-[0.98]"
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
