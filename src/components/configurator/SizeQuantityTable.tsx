'use client';

import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { ProductConfig } from '@/config/products';
import { sumSizeQuantities } from '@/lib/pricing/quantity';

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
  const setPreviewSize = useConfiguratorStore((s) => s.setPreviewSize);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  const total = sumSizeQuantities(sizeQuantities);
  // Kurze Größenbezeichnungen (S, XXL, 4XL …) passen zu dritt in eine Zeile:
  // bei 9–10 Größen sind das 3–4 statt 5 Zeilen und damit rund 100 px weniger Höhe in der
  // schmalen Spalte. Längere Bezeichnungen bleiben zweispaltig, damit nichts überläuft.
  const dreispaltig = product.sizes.every((size) => size.length <= 4);

  return (
    // Kein eigener Kasten: Die Größentabelle sitzt im Kasten der Preis-Zusammenfassung.
    // Ein zweiter Rahmen mit Schatten im Rahmen kostete Höhe und wirkte doppelt gemoppelt.
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-brand">{t('size_table_title')}</p>
        {total > 0 && (
          <p className="text-[11px] text-brand/70">
            {total} {t('size_table_total')}
          </p>
        )}
      </div>

      <div className={dreispaltig ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-2 gap-1.5'}>
        {product.sizes.map((size) => (
          <div
            key={size}
            onMouseEnter={() => setPreviewSize(size)}
            onMouseLeave={() => setPreviewSize(null)}
            // Das Überfahren blendet die Größe auf dem Leinwand-Lineal ein –
            // eine dezente Hover-Färbung signalisiert, dass die Zeile reagiert.
            className="flex min-w-0 items-center justify-between gap-1 rounded-md border border-gray-200 pl-2 pr-1 py-1 transition-colors hover:border-gold/40 hover:bg-cream/50"
          >
            <span className="text-xs font-medium text-brand/70">{size}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              aria-label={`${t('size_table_qty_label')} ${size}`}
              value={sizeQuantities[size] ?? ''}
              placeholder="0"
              onFocus={() => setPreviewSize(size)}
              onBlur={() => setPreviewSize(null)}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Math.max(0, Math.floor(Number(e.target.value)));
                if (!Number.isNaN(value)) setSizeQuantity(size, value);
              }}
              className="h-11 w-12 min-w-0 rounded-md border border-gray-300 px-1.5 text-right text-xs focus:border-gold focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
