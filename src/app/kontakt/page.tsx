import { Phone, Mail, MapPin } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { KontaktKopf, KontaktHelfer, KontaktDirektUeberschrift, KontaktFusszeile } from '@/components/contact/KontaktInhalt';
import { COMPANY } from '@/config/company';

export const metadata = {
  alternates: { canonical: '/kontakt' },
  title: 'Kontakt',
  description:
    'Fragen zu Firmenbekleidung, Mengenrabatten oder einem individuellen Projekt? Schreiben Sie Embroidery Republic Germany in Köln – Antwort meist innerhalb eines Werktags.',
  openGraph: {
    title: 'Kontakt',
    description:
      'Fragen zu Firmenbekleidung, Mengenrabatten oder einem individuellen Projekt? Wir melden uns persönlich zurück.',
  },
};

export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <KontaktKopf />

      <ContactForm />

      <KontaktHelfer />

      <div className="mt-8 rounded-xl border border-gold/20 bg-white p-5 shadow-elegant">
        <KontaktDirektUeberschrift />
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

      <KontaktFusszeile />
    </main>
  );
}
