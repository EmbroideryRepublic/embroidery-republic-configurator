'use client';

import clsx from 'clsx';
import type { ProductConfig } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';

interface ColorSizeSelectorProps {
  product: ProductConfig;
}

export function ColorSizeSelector({ product }: ColorSizeSelectorProps) {
  const colorId = useConfiguratorStore((s) => s.colorId);
  const setColor = useConfiguratorStore((s) => s.setColor);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/20 bg-white px-4 py-3 shadow-elegant">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand/40">{product.brand}</p>
        <p className="font-serif text-base font-semibold text-brand">{product.name}</p>
        <p className="text-xs text-brand/50">{product.tagline}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-brand/40">Farbe</span>
        <div className="flex gap-1.5">
          {product.colors.map((color) => (
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
