'use client';

/**
 * Sprachabhängiger Teil des Footers. Footer.tsx bleibt eine Server Component
 * (Layout, Kontaktdaten, Copyright, Versand-Fakt – nichts davon braucht den
 * Sprachumschalter); dieser Baustein übernimmt die Textstellen, die je nach
 * Sprache wechseln: Navigation, Rechtliches, Beschreibungs-/Kontakt-Überschrift,
 * die drei textlichen Fakten (Mindestmenge/Produktionszeit/Zahlungsziel) sowie
 * den Fußzeilentext. Gleiches Muster wie HeroText.tsx: useLanguageStore lesen,
 * translate() aufrufen.
 *
 * Der Versand-Fakt bleibt bewusst außen vor: Er enthält einen Geldbetrag und
 * wird in Footer.tsx bereits währungsbewusst über `WaehrungsPreis` gerendert
 * (gehört zu einem anderen Fund) – hier nur als `children` in die Liste
 * eingereiht, an der richtigen Position.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { PAYMENT_TERM_DAYS, PRODUKTIONSTAGE } from '@/config/company';
import type { TranslationKey } from '@/lib/i18n/translations';

// Spiegelt die Kopfzeile (SiteHeader) plus Startseite – damit Haupt- und
// Fußnavigation nicht auseinanderlaufen. Wo die Kopfzeile bereits einen
// Übersetzungsschlüssel hat (nav_configurator, nav_about, nav_faq,
// nav_contact), wird er hier wiederverwendet statt dupliziert.
const NAV: { href: string; key: TranslationKey }[] = [
  { href: '/', key: 'footer_nav_home' },
  { href: '/konfigurator', key: 'nav_configurator' },
  { href: '/produkt', key: 'nav_products' },
  { href: '/ueber-uns', key: 'nav_about' },
  { href: '/faq', key: 'nav_faq' },
  { href: '/kontakt', key: 'nav_contact' },
];

// Nur das Link-Label wird übersetzt – Impressum/Datenschutz/AGB selbst
// bleiben (wie im Dateikopf von translations.ts dokumentiert) auf Deutsch.
const LEGAL: { href: string; key: TranslationKey }[] = [
  { href: '/impressum', key: 'footer_legal_impressum' },
  { href: '/datenschutz', key: 'footer_legal_datenschutz' },
  { href: '/agb', key: 'footer_legal_agb' },
];

const UEBERSCHRIFT_KLASSE = 'mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand/70';
const LINK_KLASSE = 'text-xs text-brand/70 transition-colors hover:text-gold-dark';

export function FooterDescription() {
  const language = useLanguageStore((s) => s.language);
  return (
    <p className="mt-3 max-w-xs text-xs leading-relaxed text-brand/70">
      {translate('footer_description', language)}
    </p>
  );
}

export function FooterContactHeading() {
  const language = useLanguageStore((s) => s.language);
  return (
    <p className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand/70">
      {translate('footer_contact_heading', language)}
    </p>
  );
}

export function FooterNavColumn() {
  const language = useLanguageStore((s) => s.language);
  return (
    <div>
      <p className={UEBERSCHRIFT_KLASSE}>{translate('footer_nav_heading', language)}</p>
      <nav className="flex flex-col gap-1.5">
        {NAV.map((l) => (
          <Link key={l.href} href={l.href} className={LINK_KLASSE}>
            {translate(l.key, language)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function FooterLegalColumn() {
  const language = useLanguageStore((s) => s.language);
  return (
    <div>
      <p className={UEBERSCHRIFT_KLASSE}>{translate('footer_legal_heading', language)}</p>
      <nav className="flex flex-col gap-1.5">
        {LEGAL.map((l) => (
          <Link key={l.href} href={l.href} className={LINK_KLASSE}>
            {translate(l.key, language)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** `children`: der fertige Versand-Fakt (<li>) aus Footer.tsx, unverändert an
 *  seiner ursprünglichen Position zwischen Produktionszeit und Zahlungsziel. */
export function FooterInfoColumn({ children }: { children: ReactNode }) {
  const language = useLanguageStore((s) => s.language);
  return (
    <div>
      <p className={UEBERSCHRIFT_KLASSE}>{translate('footer_info_heading', language)}</p>
      <ul className="flex flex-col gap-1.5">
        <li className="text-xs text-brand/70">{translate('footer_fact_moq', language)}</li>
        <li className="text-xs text-brand/70">
          {translate('footer_fact_production', language, { von: PRODUKTIONSTAGE.von, bis: PRODUKTIONSTAGE.bis })}
        </li>
        {children}
        <li className="text-xs text-brand/70">
          {translate('footer_fact_invoice', language, { days: PAYMENT_TERM_DAYS })}
        </li>
      </ul>
    </div>
  );
}

/** Übersetztes Label vor dem währungsbewussten Betrag in Footer.tsx (dort
 *  bleibt der Betrag selbst über `WaehrungsPreis`, siehe Kommentar dort). */
export function FooterFreeShippingLabel() {
  const language = useLanguageStore((s) => s.language);
  return <>{translate('footer_fact_free_shipping', language)}</>;
}

export function FooterBottomTagline({ city }: { city: string }) {
  const language = useLanguageStore((s) => s.language);
  return <p className="text-xs text-brand/70">{translate('footer_bottom_tagline', language, { city })}</p>;
}
