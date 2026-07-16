'use client';

import { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { PRODUCTS, type ProductConfig } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';

interface CompareModalProps {
  onClose: () => void;
}

export function CompareModal({ onClose }: CompareModalProps) {
  const [leftId, setLeftId] = useState<string>(PRODUCTS[0].id);
  const [rightId, setRightId] = useState<string>(PRODUCTS[1]?.id ?? PRODUCTS[0].id);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);

  const left = PRODUCTS.find((p) => p.id === leftId);
  const right = PRODUCTS.find((p) => p.id === rightId);

  const rows: { label: string; get: (p: ProductConfig | undefined) => string }[] = [
    { label: 'Marke', get: (p) => p?.brand ?? '–' },
    { label: 'Preis', get: (p) => (p ? `${t('product_from')} ${formatPrice(p.basePrice)}` : '–') },
    { label: 'Material', get: (p) => p?.material ?? '–' },
    { label: 'Grammatur', get: (p) => (p ? `${p.weightGsm} g/m²` : '–') },
    { label: 'Passform', get: (p) => p?.fit ?? '–' },
    { label: 'Größen', get: (p) => p?.sizes.join(', ') ?? '–' },
    { label: 'Farben', get: (p) => p?.colors.map((c) => c.name).join(', ') ?? '–' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-brand">
            <Scale className="h-5 w-5 text-gold-dark" />
            {t('compare_title')}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {[left, right].map((p, i) => (
            <div key={i} className="flex flex-col items-center rounded-lg bg-cream/60 p-3">
              {p && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.colors[0].images.front}
                  alt={p.name}
                  loading="lazy"
                  className="h-32 w-full object-contain"
                />
              )}
              <p className="mt-1 text-sm font-medium text-brand">{p?.name}</p>
            </div>
          ))}
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="w-1/3 py-2 text-xs font-medium uppercase tracking-wide text-brand/40">
                  {row.label}
                </td>
                <td className="w-1/3 py-2 text-brand/80">{row.get(left)}</td>
                <td className="w-1/3 py-2 text-brand/80">{row.get(right)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
