'use client';

import clsx from 'clsx';
import type { ProductConfig } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { waehlbareFarben } from '@/lib/products/farben';

interface ColorSizeSelectorProps {
  product: ProductConfig;
}

export function ColorSizeSelector({ product }: ColorSizeSelectorProps) {
  const colorId = useConfiguratorStore((s) => s.colorId);
  const setColor = useConfiguratorStore((s) => s.setColor);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  // Nur Farben mit echtem Herstellerfoto zur Auswahl stellen: Ein Klick auf eine
  // Farbe ohne Bild ersetzte die Produktansicht durch die Platzhalter-Silhouette.
  const farben = waehlbareFarben(product.id, product.colors);
  const aktiveFarbe = farben.find((c) => c.id === colorId) ?? farben[0];

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/20 bg-white px-4 py-3 shadow-elegant">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand/40">{product.brand}</p>
        <p className="font-serif text-base font-semibold text-brand">{product.name}</p>
        <p className="text-xs text-brand/50">{product.tagline}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {/* Farbname statt reiner Beschriftung: Der Kunde soll benennen
            können, was er gewählt hat – die Farbfläche allein reicht dafür
            nicht (Navy und Schwarz sind auf kleinen Punkten kaum trennbar). */}
        <span className="text-xs text-brand/50">
          {t('color_label')} <span className="font-medium text-brand">{aktiveFarbe?.name}</span>
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {farben.map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.name}
              onClick={() => setColor(color.id)}
              className={clsx(
                'h-7 w-7 rounded-full border-2 transition-transform',
                colorId === color.id
                  ? 'scale-110 border-gold ring-2 ring-gold/30'
                  : 'border-gray-200 hover:scale-105'
              )}
              style={{ backgroundColor: color.hex }}
            >
              <span className="sr-only">{color.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
