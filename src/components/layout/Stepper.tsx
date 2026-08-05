'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useLanguageStore, translate } from '@/stores/languageStore';

interface StepperProps {
  activeStep: number; // 0-basiert
}

/**
 * Schrittanzeige als schmale Leiste direkt unter der Hauptnavigation.
 *
 * Bewusst `sticky` und niedrig gehalten: Der Kunde soll jederzeit sehen, wo
 * er steht, ohne dass die Anzeige Platz kostet, der dem Konfigurator fehlt.
 * Die frühere Fassung war eine eigenständige Zeile im Seitenfluss – sie
 * verschwand beim Scrollen, also genau dann, wenn die Orientierung gebraucht
 * wird.
 *
 * Unterhalb von `sm` blenden sich die Beschriftungen aus, die Nummern
 * bleiben. Ein Schritt ohne Beschriftung orientiert immer noch; eine
 * umbrechende Leiste täte das nicht.
 */
export function Stepper({ activeStep }: StepperProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) =>
    translate(key, language, vars);
  const steps = [t('step_product'), t('step_element'), t('step_position'), t('step_ready')];

  return (
    // top-[57px]: exakt unter der Kopfzeile (py-2.5 + 44px Logo + Rahmen).
    //
    // KEINE negativen Ränder: Die Leiste wird in ConfiguratorPrototype
    // AUSSERHALB des gepolsterten Seitencontainers gerendert und trägt damit
    // ohnehin über die volle Breite. Das frühere `-mx-4 lg:-mx-6` hob deshalb
    // keine Polsterung mehr auf, sondern machte die Leiste 48 px breiter als
    // den Sichtbereich – gemessen ein waagerechter Seitenscrollbalken bei
    // jeder Desktopbreite (1366/1440/1600/1920 px). Die Innenpolsterung
    // besorgt das <ol> selbst.
    <div className="sticky top-[57px] z-30 border-b border-gold/15 bg-cream/95 backdrop-blur">
      <ol className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 lg:px-6">
        {steps.map((label, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;
          return (
            <li key={label} className="flex flex-shrink-0 items-center gap-1.5">
              <span
                className={clsx(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                  isDone
                    ? 'bg-gold text-white'
                    : isActive
                      ? 'bg-brand text-white'
                      : 'bg-brand/10 text-brand/35'
                )}
              >
                {isDone ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={clsx(
                  'whitespace-nowrap text-xs',
                  // Der AKTIVE Schritt trägt seine Beschriftung immer – auch auf
                  // dem Telefon. So weiß der Nutzer jederzeit, wo er steht,
                  // ohne dass die ganze Leiste umbricht. Die übrigen Labels
                  // erscheinen erst ab sm.
                  isActive ? 'inline' : 'hidden sm:inline',
                  isActive ? 'font-medium text-brand' : isDone ? 'text-brand/55' : 'text-brand/35'
                )}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'mx-1 h-px w-5 flex-shrink-0 sm:w-10',
                    isDone ? 'bg-gold/40' : 'bg-gold/15'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
