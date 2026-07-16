'use client';

import clsx from 'clsx';
import { Shirt, Scissors } from 'lucide-react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { PrintMethod } from '@/types';

export function MethodSwitcher() {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const setPrintMethod = useConfiguratorStore((s) => s.setPrintMethod);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const methods: { id: PrintMethod; icon: typeof Shirt; title: string; description: string }[] = [
    { id: 'dtf', icon: Shirt, title: t('method_dtf'), description: t('method_dtf_desc') },
    { id: 'embroidery', icon: Scissors, title: t('method_embroidery'), description: t('method_embroidery_desc') },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {methods.map((method) => {
        const Icon = method.icon;
        const isActive = printMethod === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => setPrintMethod(method.id)}
            className={clsx(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              isActive
                ? 'border-gold bg-gradient-to-r from-gold-light/70 to-white shadow-elegant'
                : 'border-gray-200 bg-white hover:border-gold/40'
            )}
          >
            <span
              className={clsx(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                isActive ? 'bg-gold text-white' : 'bg-cream text-brand/50'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand">{method.title}</span>
              <span className="block text-xs text-brand/50">{method.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
