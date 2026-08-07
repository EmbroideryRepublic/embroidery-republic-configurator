import Link from 'next/link';
import { Clock, ListChecks, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { COMPANY } from '@/config/company';

export const metadata = {
  alternates: { canonical: '/kontakt' },
  title: 'Kontakt',
  description:
    'Fragen zu Firmenbekleidung, Mengenrabatten oder einem individuellen Projekt? Schreiben Sie Embroidery Republic Germany – Antwort meist innerhalb eines Werktags.',
  openGraph: {
    title: 'Kontakt',
    description:
      'Fragen zu Firmenbekleidung, Mengenrabatten oder einem individuellen Projekt? Wir melden uns persönlich zurück.',
  },
};

const HELPERS = [
  {
    icon: ListChecks,
    title: 'Das hilft uns weiter',
    text: 'Ungefähre Stückzahl, gewünschtes Produkt, Veredelungsart (Druck oder Stickerei) und ob es einen Wunschtermin gibt.',
  },
  {
    icon: Clock,
    title: 'Antwortzeit',
    text: 'Wir melden uns persönlich zurück – in der Regel innerhalb eines Werktags, bei terminkritischen Anfragen schneller.',
  },
  {
    icon: ShieldCheck,
    title: 'Unverbindlich',
    text: 'Eine Anfrage ist keine Bestellung: Es entstehen keine Kosten und keine Verpflichtung. Zahlungsdaten brauchen wir dafür nicht.',
  },
];

export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-gold-dark transition-colors hover:text-gold">
        ← Zurück zur Startseite
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold">Persönliche Beratung</p>
      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
        Kontakt
      </h1>
      <p className="mt-6 mb-8 max-w-xl text-[17px] leading-relaxed text-brand/60">
        Fragen zu Ihrer Konfiguration, zu Mengenrabatten oder ein individuelles Projekt? Schreiben Sie
        uns – wir melden uns persönlich zurück, meist innerhalb eines Werktags.
      </p>

      <ContactForm />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {HELPERS.map((h) => (
          <div key={h.title} className="rounded-xl border border-gold/20 bg-white p-4 shadow-elegant">
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <h.icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-brand">{h.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-brand/60">{h.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand/50">
          Direkter Kontakt
        </h2>
        <div className="space-y-3 text-sm text-brand/80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <Phone className="h-4 w-4" />
            </span>
            <a href={COMPANY.phoneHref} className="hover:text-gold-dark">
              {COMPANY.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <Mail className="h-4 w-4" />
            </span>
            <a href={COMPANY.emailHref} className="hover:text-gold-dark">
              {COMPANY.email}
            </a>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <MapPin className="h-4 w-4" />
            </span>
            <span>
              Embroidery Republic Germany
              <br />
              Ihsan Uzun &amp; Enes Malkoc GbR
              <br />
              Ingendorferweg 81, 50829 Köln
            </span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-brand/50">
        Sie möchten lieber direkt loslegen?{' '}
        <Link href="/" className="font-medium text-gold-dark hover:underline">
          Zum Konfigurator
        </Link>{' '}
        · Antworten auf häufige Fragen finden Sie in den{' '}
        <Link href="/faq" className="font-medium text-gold-dark hover:underline">
          FAQ
        </Link>
        .
      </p>
    </main>
  );
}
