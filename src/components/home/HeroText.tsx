'use client';

/**
 * Sprachabhängiger Teil der Bühne (Startseite). Die Seite selbst ist eine Server Component und kann `useLanguageStore` nicht
 * lesen – dieser kleine Client-Baustein übernimmt nur die Textstellen, die je nach Sprache wechseln (dreizeilige
 * Überschrift, Unterzeile); Layout und Bühnenbild bleiben in page.tsx.
 *
 * `hero_title` trägt die Zeilen getrennt durch „\n“ (Redesign 2026-11: drei Zeilen in Großbuchstaben; die letzte Zeile
 * trägt die orange Unterstreichung der Referenz). Der kurze Kicker über der Überschrift entfiel – die Referenz hat keinen.
 */
import { useLanguageStore, translate } from '@/stores/languageStore';

export function HeroText() {
  const language = useLanguageStore((s) => s.language);
  const titel = translate('hero_title', language);
  const zeilen = titel.split('\n');
  const letzte = zeilen.length - 1;

  return (
    <>
      <h1
        aria-label={titel.replace(/\n/g, ' ')}
        className="font-serif text-[clamp(2.5rem,5.4vw,5.25rem)] font-black uppercase leading-[1.02] tracking-[-0.03em] text-brand"
      >
        {zeilen.map((zeile, i) => (
          <span key={i} className="block">
            {i === letzte ? <span className="unterstrich-orange">{zeile}</span> : zeile}
          </span>
        ))}
      </h1>
      <p className="mt-7 max-w-[28rem] text-[17px] leading-relaxed text-brand/75">
        {translate('hero_subtitle', language)}
      </p>
    </>
  );
}
