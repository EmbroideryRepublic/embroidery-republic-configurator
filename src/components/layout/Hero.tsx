'use client';

import { CheckCircle2 } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

/**
 * Hintergrund bewusst als reiner Markenverlauf statt eines externen
 * Stockfotos: das frühere Unsplash-Bild lag ohnehin unter einer zu ~88 %
 * deckenden Überlagerung (optisch kaum sichtbar), kostete aber eine externe
 * Anfrage und wirkte als generisches Stockmotiv. Der geschichtete Verlauf
 * lädt sofort, ist markentypisch und kommt ohne Fremd-Domain aus.
 */
const HERO_BACKGROUND =
  // weicher Lichtakzent oben rechts + diagonaler Marken-Verlauf
  'radial-gradient(120% 140% at 85% 0%, rgba(201,162,96,0.38) 0%, rgba(201,162,96,0) 55%), ' +
  'linear-gradient(110deg, #23211d 0%, #33291c 42%, #6b4a26 78%, #8b5e34 100%)';

export function Hero() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const highlights = [t('hero_highlight_1'), t('hero_highlight_2'), t('hero_highlight_3')];

  return (
    <div className="relative overflow-hidden rounded-xl shadow-elegant">
      <div className="px-6 py-10 sm:px-12 sm:py-14" style={{ background: HERO_BACKGROUND }}>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-light/90">{t('hero_tagline')}</p>
        <h1 className="mt-2 max-w-xl font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {t('hero_title')}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">{t('hero_subtitle')}</p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {highlights.map((text) => (
            <span key={text} className="flex items-center gap-1.5 text-sm text-white/90">
              <CheckCircle2 className="h-4 w-4 text-gold-light" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
