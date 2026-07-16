'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

interface StepperProps {
  activeStep: number; // 0-basiert
}

export function Stepper({ activeStep }: StepperProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const steps = [t('step_product'), t('step_element'), t('step_position'), t('step_ready')];

  return (
    <ol className="scrollbar-hide flex w-full items-center justify-center gap-2 overflow-x-auto text-xs sm:text-sm">
      {steps.map((label, index) => {
        const isDone = index < activeStep;
        const isActive = index === activeStep;
        return (
          <li key={label} className="flex flex-shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isDone && 'bg-gold text-white',
                  isActive && !isDone && 'bg-brand text-white',
                  !isDone && !isActive && 'bg-gray-100 text-brand/30'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={clsx(isActive ? 'font-medium text-brand' : 'text-brand/40')}>
                {label}
              </span>
            </div>
            {index < steps.length - 1 && <span className="h-px w-6 bg-gold/20 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
