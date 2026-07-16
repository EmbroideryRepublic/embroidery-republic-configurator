'use client';

import { Package, Clock, Headphones, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

export function TrustBar() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const items = [
    { icon: ShieldCheck, text: t('trust_germany') },
    { icon: Headphones, text: t('trust_support') },
    { icon: Sparkles, text: t('trust_check') },
    { icon: Package, text: t('trust_moq') },
    { icon: Clock, text: t('trust_express') },
    { icon: Truck, text: t('trust_shipping') },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-gold/20 bg-white px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-light text-gold-dark">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs leading-tight text-brand/70">{text}</span>
        </div>
      ))}
    </div>
  );
}
