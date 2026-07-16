'use client';

import { CheckCircle2 } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1772351720165-d9218e428cf0?auto=format&fit=crop&w=1600&q=60';

export function Hero() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const highlights = [t('hero_highlight_1'), t('hero_highlight_2'), t('hero_highlight_3')];

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-cover bg-center shadow-elegant"
      style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
    >
      <div
        className="px-6 py-10 sm:px-12 sm:py-14"
        style={{
          background:
            'linear-gradient(110deg, rgba(35,27,18,0.88) 0%, rgba(60,42,20,0.72) 45%, rgba(139,94,52,0.45) 100%)',
        }}
      >
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
