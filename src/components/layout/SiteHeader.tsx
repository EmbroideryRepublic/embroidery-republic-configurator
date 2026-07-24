'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Scale, Menu, X } from 'lucide-react';
import { useCartStore, getCartItemCount } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, type Currency } from '@/stores/currencyStore';
import type { Language } from '@/lib/i18n/translations';

interface SiteHeaderProps {
  /** Öffnet die Warenkorb-Schublade. Nur der Konfigurator hat sie – auf allen
   *  anderen Seiten wird der Warenkorb stattdessen zum Link dorthin. */
  onCartClick?: () => void;
  onCompareClick?: () => void;
}

export function SiteHeader({ onCartClick, onCompareClick }: SiteHeaderProps) {
  // Unter md gibt es keine Platz für die Navigationsleiste; ohne dieses Menü
  // war auf dem Telefon KEINE Seite erreichbar.
  const [menueOffen, setMenueOffen] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = getCartItemCount(items);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  const navLinks: { href: string; label: string }[] = [
    { href: '/konfigurator', label: t('nav_configurator') },
    // Katalogübersicht: bewusst direkt hinter dem Konfigurator. Kunden, die
    // noch kein Produkt im Kopf haben, kommen hier zuerst hin.
    { href: '/produkt', label: 'Produkte' },
    { href: '/ueber-uns', label: t('nav_about') },
    { href: '/faq', label: t('nav_faq') },
    { href: '/kontakt', label: t('nav_contact') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.jpg"
            alt="Embroidery Republic Germany"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/40"
          />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-serif text-base font-semibold tracking-wide text-brand">
              Embroidery Republic
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-dark">
              Germany
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-brand/70 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-gold-dark">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sprachumschalter */}
          <div className="hidden items-center rounded-full border border-gold/30 text-xs sm:flex">
            {(['de', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-2 py-1 font-medium uppercase transition-colors ${
                  language === lang ? 'bg-gold text-white' : 'text-brand/50 hover:text-brand'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Währungsumschalter */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="hidden rounded-full border border-gold/30 bg-transparent px-2 py-1 text-xs text-brand/60 sm:block"
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

          {/* Kein Kundenkonto: Embroidery Republic bestellt bewusst ohne
              Registrierung (B2B, Rechnung/Anfrage). Ein toter „Mein Konto"-
              Button hätte Kund:innen ein nicht existierendes Login-System
              suggeriert – daher bewusst entfernt. */}

          <button
            type="button"
            onClick={() => setMenueOffen(!menueOffen)}
            aria-expanded={menueOffen}
            aria-label="Menü"
            className="flex items-center rounded-full border border-gold/40 bg-white p-2 text-brand transition-colors hover:border-gold lg:hidden"
          >
            {menueOffen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {onCartClick ? (
            <button
              type="button"
              onClick={onCartClick}
              className={WARENKORB_KLASSE}
            >
              <Warenkorbinhalt count={count} label={t('nav_cart')} />
            </button>
          ) : (
            /* Ohne Schublade (alle Seiten außer dem Konfigurator) führt der
               Warenkorb dorthin, wo er sich öffnen lässt. */
            <Link href="/konfigurator" className={WARENKORB_KLASSE}>
              <Warenkorbinhalt count={count} label={t('nav_cart')} />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation – erscheint unter der Kopfzeile. */}
      {menueOffen && (
        <nav className="border-t border-gold/20 bg-cream px-4 pb-3 lg:hidden" aria-label="Hauptnavigation">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenueOffen(false)}
                  className="block border-b border-gold/10 py-3 text-sm font-medium text-brand/80 transition-colors hover:text-gold-dark"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}


const WARENKORB_KLASSE =
  'relative flex items-center gap-2 rounded-full border border-gold/40 bg-white px-3 py-1.5 text-sm text-brand transition-colors hover:border-gold';

function Warenkorbinhalt({ count, label }: { count: number; label: string }) {
  return (
    <>
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </>
  );
}
