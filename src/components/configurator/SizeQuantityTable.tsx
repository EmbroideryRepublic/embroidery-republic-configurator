'use client';

import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { ProductConfig } from '@/config/products';

interface SizeQuantityTableProps {
  product: ProductConfig;
}

/**
 * Ersetzt die vorherige Einzel-Größenauswahl: der Kunde kann für JEDE
 * Größe direkt eine eigene Stückzahl eintragen (z.B. 10× S, 50× M, 20× L)
 * – ein Design, mehrere Größen, in einem Schritt zum Warenkorb. Behebt
 * gleichzeitig den Bug, dass beim Wechseln der Größe das Design verloren
 * ging (das passierte, weil jede Größe einzeln zum Warenkorb hinzugefügt
 * werden musste).
 */
export function SizeQuantityTable({ product }: SizeQuantityTableProps) {
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const setSizeQuantity = useConfiguratorStore((s) => s.setSizeQuantity);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  const total = Object.values(sizeQuantities).reduce((sum, n) => sum + n, 0);

  return (
    <div className="rounded-lg border border-gold/20 bg-white p-3 shadow-elegant">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-brand">{t('size_table_title')}</p>
        {total > 0 && (
          <p className="text-[11px] text-brand/50">
            {total} {t('size_table_total')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {product.sizes.map((size) => (
          <div
            key={size}
            className="flex items-center justify-between gap-1.5 rounded border border-gray-200 pl-2 pr-1 py-1"
          >
            <span className="text-xs font-medium text-brand/70">{size}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={sizeQuantities[size] ?? ''}
              placeholder="0"
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Math.max(0, Math.floor(Number(e.target.value)));
                if (!Number.isNaN(value)) setSizeQuantity(size, value);
              }}
              className="h-7 w-14 rounded border border-gray-300 px-1.5 text-right text-xs focus:border-gold focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
