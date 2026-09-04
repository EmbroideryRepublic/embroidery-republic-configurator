'use client';

import clsx from 'clsx';
import { Shirt, Scissors } from 'lucide-react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import type { PrintMethod } from '@/types';

interface MethodSwitcherProps {
  /** Aktueller Stückpreis (der bereits gewählten Veredelungsart). */
  currentUnitPrice: number;
  /** Stückpreis, den dieselbe Konfiguration bei der JEWEILS ANDEREN
   *  Veredelungsart hätte – null, solange die Vergleichs-Preisregeln noch
   *  laden. Ausbauplan (quickwins): macht den Preisunterschied vor dem
   *  Umschalten sichtbar, statt ihn erst danach zu zeigen. */
  otherMethodUnitPrice: number | null;
}

export function MethodSwitcher({ currentUnitPrice, otherMethodUnitPrice }: MethodSwitcherProps) {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const setPrintMethod = useConfiguratorStore((s) => s.setPrintMethod);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);

  const methods: { id: PrintMethod; icon: typeof Shirt; title: string; description: string }[] = [
    { id: 'dtf', icon: Shirt, title: t('method_dtf'), description: t('method_dtf_desc') },
    { id: 'embroidery', icon: Scissors, title: t('method_embroidery'), description: t('method_embroidery_desc') },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {methods.map((method) => {
        const Icon = method.icon;
        const isActive = printMethod === method.id;
        // Ausbauplan (quickwins): der Preisunterschied wird nur auf der
        // NICHT aktiven Kachel gezeigt, relativ zum aktuell gewählten
        // Stückpreis – "+7,50 €/Stk." bzw. "−7,50 €/Stk." bei Wechsel.
        // Reine Anzeige (useMemo in ConfiguratorPrototype.tsx), verändert
        // nie das Preismodell selbst.
        const delta = !isActive && otherMethodUnitPrice !== null ? otherMethodUnitPrice - currentUnitPrice : null;
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
              {delta !== null && Math.abs(delta) >= 0.01 && (
                <span className={clsx('mt-0.5 block text-[11px] font-medium', delta > 0 ? 'text-brand/60' : 'text-green-700')}>
                  {t('method_price_delta', {
                    amount: `${delta > 0 ? '+' : '−'}${formatPrice(Math.abs(delta))}`,
                  })}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
