'use client';

/**
 * Sprachabhängiger Teil der Bühne (Startseite). Die Seite selbst ist eine
 * Server Component und kann `useLanguageStore` nicht lesen – dieser kleine
 * Client-Baustein übernimmt nur die drei Textstellen, die je nach Sprache
 * wechseln (Kicker, zweizeilige Überschrift, Unterzeile), Layout und
 * Bühnenbild bleiben in page.tsx.
 *
 * `hero_title` trägt beide Zeilen getrennt durch „\n" (Zeile 2 erscheint
 * golden abgesetzt) – dieselbe Aufteilung wie im bisherigen, fest verdrahteten
 * Markup.
 */
import { useLanguageStore, translate } from '@/stores/languageStore';

export function HeroText() {
  const language = useLanguageStore((s) => s.language);
  const titel = translate('hero_title', language);
  const [zeile1, zeile2] = titel.split('\n');

  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{translate('hero_tagline', language)}</p>
      <h1
        aria-label={titel.replace('\n', ' ')}
        className="mt-7 font-serif text-[clamp(3.5rem,7.6vw,7.5rem)] font-normal leading-[0.9] tracking-[-0.025em] text-brand"
      >
        {zeile1}
        {zeile2 && <span className="mt-1 block text-gold">{zeile2}</span>}
      </h1>
      <p className="mt-9 max-w-[19rem] text-[17px] leading-relaxed text-brand/70">
        {translate('hero_subtitle', language)}
      </p>
    </>
  );
}
