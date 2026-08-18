'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Scale, Menu, X, User } from 'lucide-react';
import { useCartStore, getCartItemCount } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, type Currency } from '@/stores/currencyStore';
import { useUiStore } from '@/stores/uiStore';
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
  // Ohne eigenes onCartClick (alle Seiten außer Konfigurator) öffnet das Symbol
  // die globale Warenkorb-Schublade.
  const oeffneWarenkorb = useUiStore((s) => s.oeffneWarenkorb);
  const warenkorbOeffnen = onCartClick ?? oeffneWarenkorb;

  const navLinks: { href: string; label: string }[] = [
    { href: '/konfigurator', label: t('nav_configurator') },
    // Katalogübersicht: bewusst direkt hinter dem Konfigurator. Kunden, die
    // noch kein Produkt im Kopf haben, kommen hier zuerst hin.
    { href: '/produkt', label: t('nav_products') },
    { href: '/ueber-uns', label: t('nav_about') },
    { href: '/faq', label: t('nav_faq') },
    { href: '/kontakt', label: t('nav_contact') },
    { href: '/konto', label: t('nav_account') },
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
                  language === lang ? 'bg-gold-dark text-white' : 'text-brand/70 hover:text-brand'
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
            className="hidden rounded-full border border-gold/30 bg-transparent px-2 py-1 text-xs text-brand/70 sm:block"
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

          {/* Additiv seit dem Kundenkonto (supabase/migrations/0023): Der
              Gastkauf bleibt der Standardweg (Rechnung/Anfrage, kein Zwang
              zur Anmeldung) – "Mein Konto" ist jetzt ein echtes, zusätzliches
              Angebot (Text-Link oben in navLinks, hier nur das Icon für
              Bildschirme zwischen "mobil" und "volle Desktop-Navigation"). */}
          <Link
            href="/konto"
            title={t('nav_account')}
            aria-label={t('nav_account')}
            className="hidden items-center gap-1.5 text-sm text-brand/70 hover:text-gold-dark sm:flex lg:hidden"
          >
            <User className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => setMenueOffen(!menueOffen)}
            aria-expanded={menueOffen}
            aria-label="Menü"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-gold/40 bg-white p-2 text-brand transition-colors hover:border-gold lg:hidden"
          >
            {menueOffen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {/* Öffnet überall dieselbe Schublade: im Konfigurator dessen eigene
              (onCartClick), sonst die globale (CartDrawerHost via UI-Store). */}
          <button type="button" onClick={warenkorbOeffnen} aria-label={t('nav_cart')} className={WARENKORB_KLASSE}>
            <Warenkorbinhalt count={count} label={t('nav_cart')} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation – erscheint unter der Kopfzeile. */}
      {menueOffen && (
        <nav className="border-t border-gold/20 bg-cream px-4 pb-3 lg:hidden" aria-label="Hauptnavigation">
          {/* Unter 640px sind Sprach- und Währungsumschalter sonst nirgends
              erreichbar (die Fassung oben blendet sich dort per sm:flex/
              sm:block komplett aus) – hier dieselben Umschalter, nur
              sichtbar solange die obigen es nicht sind. */}
          <div className="flex items-center gap-3 border-b border-gold/10 py-3 sm:hidden">
            <div className="flex items-center rounded-full border border-gold/30 text-xs">
              {(['de', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full px-2 py-1 font-medium uppercase transition-colors ${
                    language === lang ? 'bg-gold-dark text-white' : 'text-brand/70 hover:text-brand'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="rounded-full border border-gold/30 bg-transparent px-2 py-1 text-xs text-brand/70"
              title="Währung (Näherungswert, kein Live-Kurs)"
              aria-label="Währung"
            >
              <option value="EUR">EUR</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
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
  'relative flex min-h-11 min-w-11 items-center gap-2 rounded-full border border-gold/40 bg-white px-3 py-2.5 text-sm text-brand transition-colors hover:border-gold';

function Warenkorbinhalt({ count, label }: { count: number; label: string }) {
  return (
    <>
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-dark px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </>
  );
}
