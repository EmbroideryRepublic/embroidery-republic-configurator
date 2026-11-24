'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBag, Scale, Menu, X, User, ChevronDown, ArrowRight } from 'lucide-react';
import { useCartStore, getCartItemCount } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { SPRACHUMSCHALTER_AKTIV } from '@/config/sprache';
import { useCurrencyStore, type Currency } from '@/stores/currencyStore';
import { useUiStore } from '@/stores/uiStore';
import { ladeWarenkorbSchublade } from './CartDrawerHost';
import type { Language } from '@/lib/i18n/translations';

interface SiteHeaderProps {
  /** Öffnet die Warenkorb-Schublade. Nur der Konfigurator hat sie – auf allen
   *  anderen Seiten wird der Warenkorb stattdessen zum Link dorthin. */
  onCartClick?: () => void;
  onCompareClick?: () => void;
}

/**
 * Kopfzeile (Redesign 2026-11, nach der Designreferenz): Wortmarke links, Hauptnavigation mittig, rechts Konfigurator-Knopf,
 * Konto und Warenkorb mit Zähler. Alle bisherigen Ziele bleiben erreichbar: Konfigurator, Produkte, Über uns, FAQ, Kontakt und
 * Konto stehen im „Shop“-Menü bzw. im Mobilmenü; Über uns, FAQ und Kontakt zusätzlich in der Fußzeile.
 * Funktion unverändert: Der Warenkorb-Knopf öffnet im Konfigurator dessen eigene Schublade (onCartClick), sonst die globale.
 */

/** Kategorien und Auswahl im „Shop“-Menü (Ziele sind die bestehenden Kategorie-/Anlassseiten). */
const SHOP_LINKS: { href: string; label: string }[] = [
  { href: '/produkt', label: 'Alle Produkte' },
  { href: '/t-shirts-bedrucken-besticken', label: 'T-Shirts' },
  { href: '/hoodies-bedrucken-besticken', label: 'Hoodies' },
  { href: '/poloshirts-besticken-bedrucken', label: 'Poloshirts' },
  { href: '/jacken-bedrucken', label: 'Jacken' },
  { href: '/kinderbekleidung-bedrucken', label: 'Kinderbekleidung' },
  { href: '/sportbekleidung-bedrucken', label: 'Sportbekleidung' },
];

/** Direkte Verweise der Hauptnavigation (Reihenfolge wie in der Referenz). */
const HAUPT_LINKS: { href: string; label: string }[] = [
  { href: '/t-shirts-bedrucken-besticken', label: 'T-Shirts' },
  { href: '/hoodies-bedrucken-besticken', label: 'Hoodies' },
  { href: '/poloshirts-besticken-bedrucken', label: 'Polos' },
  { href: '/firmenkleidung-bedrucken', label: 'Firmenkleidung' },
  { href: '/#so-funktionierts', label: 'So funktioniert’s' },
];

const NAV_KLASSE =
  'rounded-md px-1 py-2 text-[14px] font-semibold text-brand transition-colors hover:text-gold-dark focus-visible:text-gold-dark';

export function SiteHeader({ onCartClick, onCompareClick }: SiteHeaderProps) {
  // Unter lg gibt es keinen Platz für die Navigationsleiste; ohne dieses Menü war auf dem Telefon KEINE Seite erreichbar.
  const [menueOffen, setMenueOffen] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = getCartItemCount(items);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  // Ohne eigenes onCartClick (alle Seiten außer Konfigurator) öffnet das Symbol die globale Warenkorb-Schublade.
  const oeffneWarenkorb = useUiStore((s) => s.oeffneWarenkorb);
  const warenkorbOeffnen = onCartClick ?? oeffneWarenkorb;
  // Die globale Schublade wird erst bei Bedarf geladen (Ladezeit, siehe CartDrawerHost): Darüberfahren/Fokus/Antippen
  // stößt das Laden schon vor dem Klick an. Im Konfigurator (eigene Schublade) entfällt das.
  const warenkorbVorladen = onCartClick ? undefined : () => void ladeWarenkorbSchublade();

  // Mobilmenü: alles, was die Kopfzeile bisher bot, plus die Kategorien.
  const mobilLinks: { href: string; label: string }[] = [
    { href: '/konfigurator', label: t('nav_configurator') },
    { href: '/produkt', label: t('nav_products') },
    ...SHOP_LINKS.slice(1),
    { href: '/firmenkleidung-bedrucken', label: 'Firmenkleidung' },
    { href: '/#so-funktionierts', label: 'So funktioniert’s' },
    { href: '/ueber-uns', label: t('nav_about') },
    { href: '/faq', label: t('nav_faq') },
    { href: '/kontakt', label: t('nav_contact') },
    { href: '/konto', label: t('nav_account') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-brand/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
        <Link href="/" className="flex flex-shrink-0 flex-col leading-none" aria-label="Embroidery Republic Germany – Startseite">
          <span className="text-[17px] font-black uppercase leading-[0.95] tracking-[-0.01em] text-brand sm:text-[19px]">
            Embroidery
            <br />
            Republic
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-gold-dark">
            <span aria-hidden className="h-[2px] w-3 bg-gold" />
            Germany
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 border-l border-brand/10 pl-7 lg:flex">
          {/* Shop-Menü: öffnet bei Hover UND bei Tastaturfokus (focus-within); ohne JavaScript bedienbar. */}
          <div className="group relative">
            <Link href="/produkt" className={`${NAV_KLASSE} inline-flex items-center gap-1`}>
              Shop
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
            </Link>
            <ul className="invisible absolute left-0 top-full z-50 mt-1 min-w-[15rem] rounded-2xl border border-brand/10 bg-white p-2 opacity-0 shadow-elegant transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-brand transition-colors hover:bg-cream-dark hover:text-gold-dark">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {HAUPT_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={NAV_KLASSE}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sprachumschalter (derzeit ausgeblendet, siehe config/sprache.ts) */}
          {SPRACHUMSCHALTER_AKTIV && (
            <div className="hidden items-center rounded-full border border-brand/15 text-xs sm:flex">
              {(['de', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full px-2 py-1 font-medium uppercase transition-colors ${
                    language === lang ? 'bg-brand text-white' : 'text-brand/70 hover:text-brand'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* Währungsumschalter */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="hidden rounded-full border border-brand/15 bg-transparent px-2 py-1 text-xs text-brand/70 sm:block"
            title="Währung (Näherungswert, kein Live-Kurs)"
            aria-label="Währung"
          >
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>

          {onCompareClick && (
            <button
              type="button"
              onClick={onCompareClick}
              title={t('nav_compare')}
              aria-label={t('nav_compare')}
              className="hidden items-center gap-1.5 text-sm text-brand/70 hover:text-gold-dark sm:flex"
            >
              <Scale className="h-4 w-4" />
            </button>
          )}

          {/* Der Weg zum Gestalten bleibt von jeder Seite aus einen Klick entfernt. Im Konfigurator selbst ist er überflüssig. */}
          {!onCartClick && (
            <Link
              href="/konfigurator"
              className="hidden items-center gap-2 rounded-full bg-gold-btn px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-gold-dark md:inline-flex"
            >
              {t('nav_configurator')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}

          {/* Mein Konto (Gastkauf bleibt der Standardweg; das Konto ist ein zusätzliches Angebot). */}
          <Link
            href="/konto"
            title={t('nav_account')}
            aria-label={t('nav_account')}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-full text-brand transition-colors hover:bg-cream-dark sm:flex"
          >
            <User className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          {/* Öffnet überall dieselbe Schublade: im Konfigurator dessen eigene (onCartClick), sonst die globale
              (CartDrawerHost via UI-Store). */}
          <button
            type="button"
            onClick={warenkorbOeffnen}
            onPointerEnter={warenkorbVorladen}
            onFocus={warenkorbVorladen}
            onTouchStart={warenkorbVorladen}
            aria-label={t('nav_cart')}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand transition-colors hover:bg-cream-dark"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            <span className="sr-only">{t('nav_cart')}</span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-btn px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenueOffen(!menueOffen)}
            aria-expanded={menueOffen}
            aria-label="Menü"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand/15 bg-white p-2 text-brand transition-colors hover:border-brand lg:hidden"
          >
            {menueOffen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation – erscheint unter der Kopfzeile. */}
      {menueOffen && (
        <nav className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-brand/10 bg-cream px-4 pb-4 lg:hidden" aria-label="Hauptnavigation">
          {/* Unter 640px sind Sprach- und Währungsumschalter sonst nirgends erreichbar (die Fassung oben blendet sich dort
              per sm:flex/sm:block komplett aus) – hier dieselben Umschalter, nur sichtbar solange die obigen es nicht sind. */}
          <div className="flex items-center gap-3 border-b border-brand/10 py-3 sm:hidden">
            {SPRACHUMSCHALTER_AKTIV && (
              <div className="flex items-center rounded-full border border-brand/15 text-xs">
                {(['de', 'en'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-2 py-1 font-medium uppercase transition-colors ${
                      language === lang ? 'bg-brand text-white' : 'text-brand/70 hover:text-brand'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="rounded-full border border-brand/15 bg-transparent px-2 py-1 text-xs text-brand/70"
              title="Währung (Näherungswert, kein Live-Kurs)"
              aria-label="Währung"
            >
              <option value="EUR">EUR</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <ul>
            {mobilLinks.map((link, i) => (
              <li key={link.label + link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenueOffen(false)}
                  className={
                    i === 0
                      ? 'mt-3 flex items-center justify-between rounded-full bg-gold-btn px-5 py-3 text-[15px] font-semibold text-white'
                      : 'block border-b border-brand/10 py-3 text-[15px] font-semibold text-brand transition-colors hover:text-gold-dark'
                  }
                >
                  {link.label}
                  {i === 0 && <ArrowRight className="h-4 w-4" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
