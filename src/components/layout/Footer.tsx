import Link from 'next/link';
import { PRODUKTIONSZEIT_TEXT } from '@/config/company';

/** Fakten, die bereits an anderer Stelle der Seite ausgewiesen sind – hier
 *  nur gebündelt wiederholt (keine neuen Zusagen). */
// „Ab 5 Stück" stand hier fälschlich: Die Mindestbestellmenge ist abgeschafft,
// die Staffel beginnt bei 1 Stück (calculatePrice.ts). Ab 5 gibt es Rabatt.
const FACTS = ['Ab 1 Stück – ohne Mindestmenge', `Produktion ${PRODUKTIONSZEIT_TEXT}`, 'Kauf auf Rechnung – 14 Tage'];

const NAV = [
  { href: '/', label: 'Konfigurator' },
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
    <footer className="mt-12 border-t border-gold/15 bg-white px-4 py-10 text-sm">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        <div>
          <p className="font-serif text-base font-semibold text-brand">Embroidery Republic</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-dark">Germany</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-brand/50">
            Firmen- und Teambekleidung veredelt per DTF-Transferdruck und Stickerei – live
            konfigurierbar, ab kleiner Menge.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/40">Navigation</p>
          <nav className="flex flex-col gap-1.5">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-brand/60 transition-colors hover:text-gold-dark">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/40">Gut zu wissen</p>
          <ul className="flex flex-col gap-1.5">
            {FACTS.map((f) => (
              <li key={f} className="text-xs text-brand/60">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-2 border-t border-gold/10 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs text-brand/40">
          © {new Date().getFullYear()} Embroidery Republic Germany
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className="text-xs text-brand/40 transition-colors hover:text-gold-dark">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
