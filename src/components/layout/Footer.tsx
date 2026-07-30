import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import {
  COMPANY,
  COMPANY_ADDRESS_LINE,
  PAYMENT_TERM_DAYS,
  PRODUKTIONSZEIT_TEXT,
} from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld } from '@/lib/format';

/** Fakten, die bereits an anderer Stelle der Seite ausgewiesen sind – hier
 *  nur gebündelt wiederholt (keine neuen Zusagen). Alle aus einer Quelle. */
const FACTS = [
  'Ab 1 Stück – ohne Mindestmenge',
  `Produktion ${PRODUKTIONSZEIT_TEXT}`,
  `Versandkostenfrei ab ${formatiereGeld(SHIPPING_RATES.DE.freeFrom)}`,
  `Kauf auf Rechnung – ${PAYMENT_TERM_DAYS} Tage`,
];

// Spiegelt die Kopfzeile (SiteHeader) plus Startseite – damit Haupt- und
// Fußnavigation nicht auseinanderlaufen. Der Konfigurator liegt unter
// /konfigurator (früher zeigte dieser Link fälschlich auf die Startseite /).
const NAV = [
  { href: '/', label: 'Startseite' },
  { href: '/konfigurator', label: 'Konfigurator' },
  { href: '/produkt', label: 'Produkte' },
  { href: '/ueber-uns', label: 'Über uns' },
  { href: '/faq', label: 'Häufige Fragen' },
  { href: '/kontakt', label: 'Kontakt' },
];

const LEGAL = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gold/15 bg-white px-4 py-12 text-sm">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-base font-semibold text-brand">Embroidery Republic</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-dark">Germany</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-brand/50">
            Firmen- und Teambekleidung veredelt per DTF-Transferdruck und Stickerei – live
            konfigurierbar, ab kleiner Menge.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            <a
              href={COMPANY.phoneHref}
              className="inline-flex items-center gap-2 text-xs text-brand/60 transition-colors hover:text-gold-dark"
            >
              <Phone className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
              {COMPANY.phone}
            </a>
            <a
              href={COMPANY.emailHref}
              className="inline-flex items-center gap-2 text-xs text-brand/60 transition-colors hover:text-gold-dark"
            >
              <Mail className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
              {COMPANY.email}
            </a>
            <p className="mt-1 text-xs text-brand/40">{COMPANY_ADDRESS_LINE}</p>
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand/40">Navigation</p>
          <nav className="flex flex-col gap-1.5">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-brand/60 transition-colors hover:text-gold-dark">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand/40">Rechtliches</p>
          <nav className="flex flex-col gap-1.5">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-brand/60 transition-colors hover:text-gold-dark">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand/40">Gut zu wissen</p>
          <ul className="flex flex-col gap-1.5">
            {FACTS.map((f) => (
              <li key={f} className="text-xs text-brand/60">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-2 border-t border-gold/10 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs text-brand/40">
          © {new Date().getFullYear()} {COMPANY.tradeName}
        </p>
        <p className="text-xs text-brand/40">DTF-Transferdruck &amp; Stickerei · Made to order in {COMPANY.city}</p>
      </div>
    </footer>
  );
}
