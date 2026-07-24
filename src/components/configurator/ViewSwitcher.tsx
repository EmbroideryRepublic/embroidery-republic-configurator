'use client';

import clsx from 'clsx';
import type { PrintView } from '@/types';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { TranslationKey } from '@/lib/i18n/translations';
import { positionTranslationKey } from '@/config/decorationPositions';


const VIEW_ORDER: PrintView[] = ['front', 'back', 'sleeve_left', 'sleeve_right'];

interface ViewSwitcherProps {
  imageUrls: Record<PrintView, string>;
  hasSleeves?: boolean;
}

/**
 * Vertikale Miniaturansichten-Leiste statt einfacher Text-Tabs – zeigt die
 * tatsächliche Ansicht als kleines Vorschaubild, die aktive Ansicht wird
 * über Rahmen, Schatten und Skalierung hervorgehoben.
 */
export function ViewSwitcher({ imageUrls, hasSleeves = true }: ViewSwitcherProps) {
  const activeView = useConfiguratorStore((s) => s.activeView);
  const setActiveView = useConfiguratorStore((s) => s.setActiveView);
  const elements = useConfiguratorStore((s) => s.elements);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const views = hasSleeves ? VIEW_ORDER : VIEW_ORDER.filter((v) => v !== 'sleeve_left' && v !== 'sleeve_right');

  return (
    <div className="flex flex-row gap-2 lg:flex-col">
      {views.map((view) => {
        const count = elements.filter((el) => el.view === view).length;
        const isActive = activeView === view;
        const label = t(positionTranslationKey(view));
        return (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            title={label}
            className={clsx(
              'group relative flex-shrink-0 rounded-lg border-2 bg-white p-1 transition-all duration-200',
              isActive
                ? 'scale-105 border-gold shadow-elegant'
                : 'border-transparent shadow-sm hover:scale-[1.02] hover:border-gold/30'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[view]}
              alt={label}
              className="h-14 w-14 object-contain"
            />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
            {/* Umbruch statt Kürzung: „Ärmel rechts" passt bei 10 px Schrift
                nicht in 56 px und erschien als „Ärmel rec…". Eine der vier
                Hauptnavigationen der Ansicht darf nicht unlesbar sein. Die
                feste Mindesthöhe von zwei Zeilen hält alle vier Kacheln
                gleich hoch, obwohl „Vorderseite" einzeilig bleibt. */}
            <span
              className={clsx(
                'mt-1 flex min-h-[1.7rem] w-[56px] items-start justify-center text-center text-[10px] font-medium leading-tight',
                isActive ? 'text-gold-dark' : 'text-brand/40 group-hover:text-brand/60'
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
