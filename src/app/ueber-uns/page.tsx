import Link from 'next/link';
import { Scissors, Shirt, Clock } from 'lucide-react';

export const metadata = { title: 'Über uns | Embroidery Republic Germany' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-brand-accent hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-4 mt-4 text-xl font-semibold text-brand">Über Embroidery Republic Germany</h1>

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Platzhalter-Text.</strong> Die folgenden Absätze sind bewusst allgemein gehalten – ich
        habe keine echten Firmendetails (Gründungsjahr, Teamgröße, Standort, Kundenzahl o.ä.) erfunden.
        Bitte durch eure tatsächliche Geschichte, Zahlen und Fotos ersetzen.
      </div>

      <div className="space-y-4 text-sm text-gray-700">
        <p>
          Embroidery Republic Germany ist auf die Veredelung von Firmen- und Teambekleidung
          spezialisiert – per DTF-Transferdruck für vollfarbige Motive und per Stickerei für
          langlebige, hochwertige Firmenlogos.
        </p>
        <p>
          [Hier steht später eure echte Unternehmensgeschichte: seit wann gibt es euch, was treibt
          euch an, was unterscheidet euch von anderen Anbietern.]
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureCard icon={Shirt} title="Zwei Veredelungsarten" text="DTF-Transferdruck und Stickerei aus einer Hand." />
        <FeatureCard icon={Clock} title="Schnelle Produktion" text="Ca. 5 Werktage ab Auftragsbestätigung." />
        <FeatureCard icon={Scissors} title="Persönlich betreut" text="Beratung für Unternehmen jeder Größe." />
      </div>

      <div className="mt-8 space-y-1 text-sm text-gray-700">
        <h2 className="font-medium text-brand">Kontakt</h2>
        <p>[E-Mail-Adresse, Telefonnummer – siehe Impressum]</p>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Shirt;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold-light text-gold-dark">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-brand">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{text}</p>
    </div>
  );
}
