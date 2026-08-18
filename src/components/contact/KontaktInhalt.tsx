'use client';

/**
 * Sprachabhängiger Teil der Kontaktseite. page.tsx ist eine Server Component
 * (wegen `export const metadata`) und kann `useLanguageStore` nicht lesen –
 * dieser Client-Baustein übernimmt Überschrift, Einleitung, die drei
 * Hilfe-Kacheln und die Fußzeile, exakt nach dem Muster von
 * `components/home/HeroText.tsx`. Adresse/Kontaktdaten (COMPANY) bleiben
 * bewusst unübersetzt – das sind Eigennamen und eine Anschrift, keine UI-Texte.
 */
import Link from 'next/link';
import { Clock, ListChecks, ShieldCheck } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

const HELPER_ICONS = [ListChecks, Clock, ShieldCheck] as const;
const HELPER_KEYS = [
  { title: 'kontakt_helper_1_title', text: 'kontakt_helper_1_text' },
  { title: 'kontakt_helper_2_title', text: 'kontakt_helper_2_text' },
  { title: 'kontakt_helper_3_title', text: 'kontakt_helper_3_text' },
] as const;

export function KontaktKopf() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  return (
    <>
      <Link href="/" className="text-xs text-gold-dark transition-colors hover:text-gold">
        {t('kontakt_back_link')}
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold">{t('kontakt_eyebrow')}</p>
      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
        {t('kontakt_heading')}
      </h1>
      <p className="mt-6 mb-8 max-w-xl text-[17px] leading-relaxed text-brand/60">{t('kontakt_intro')}</p>
    </>
  );
}

export function KontaktHelfer() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {HELPER_KEYS.map(({ title, text }, i) => {
        const Icon = HELPER_ICONS[i]!;
        return (
          <div key={title} className="rounded-xl border border-gold/20 bg-white p-4 shadow-elegant">
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold-light text-gold-dark">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-brand">{t(title)}</p>
            <p className="mt-1 text-xs leading-relaxed text-brand/60">{t(text)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function KontaktDirektUeberschrift() {
  const language = useLanguageStore((s) => s.language);
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand/50">
      {translate('kontakt_direct_heading', language)}
    </h2>
  );
}

export function KontaktFusszeile() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  return (
    <p className="mt-8 text-center text-xs text-brand/50">
      {t('kontakt_footer_cta_prefix')}{' '}
      <Link href="/" className="font-medium text-gold-dark hover:underline">
        {t('kontakt_footer_configurator_link')}
      </Link>{' '}
      · {t('kontakt_footer_faq_prefix')}{' '}
      <Link href="/faq" className="font-medium text-gold-dark hover:underline">
        {t('kontakt_footer_faq_link')}
      </Link>
      .
    </p>
  );
}
