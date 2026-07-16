'use client';

import { memo, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Search, Star, X } from 'lucide-react';
import { PRODUCTS } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';

type FilterMode = 'all' | 'favorites';

/**
 * React.memo: diese Liste hängt nur von Produktauswahl, Suche/Filter und
 * Favoriten ab – nicht vom Canvas-, Werkzeug- oder Preis-State. Ohne memo
 * würde sie bei jeder Preisänderung oder jedem Logo-Update unnötig neu
 * rendern (genau die Art von "flackerndem" Verhalten, die vermieden
 * werden soll).
 */
export const ProductList = memo(function ProductList() {
  const productId = useConfiguratorStore((s) => s.productId);
  const setProduct = useConfiguratorStore((s) => s.setProduct);
  const setColor = useConfiguratorStore((s) => s.setColor);
  const resetSizeQuantities = useConfiguratorStore((s) => s.resetSizeQuantities);

  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(100);

  const brands = useMemo(() => Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort(), []);

  function handleSelectProduct(id: string) {
    const next = PRODUCTS.find((p) => p.id === id);
    if (!next) return;
    setProduct(next.id);
    setColor(next.colors[0].id);
    resetSizeQuantities();
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (filterMode === 'favorites' && !favoriteIds.includes(p.id)) return false;
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
      if (p.basePrice > maxPrice) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query)
      );
    });
  }, [search, filterMode, favoriteIds, brandFilter, maxPrice]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gold/20 bg-white shadow-elegant">
      <div className="border-b border-gold/10 p-2.5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/60">
          Produkt wählen
        </h2>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen (Name, Marke, Material) …"
            className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-6 text-xs focus:border-gold/50 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-brand/30 hover:text-brand/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1">
          <FilterChip active={filterMode === 'all'} onClick={() => setFilterMode('all')}>
            Alle ({PRODUCTS.length})
          </FilterChip>
          <FilterChip active={filterMode === 'favorites'} onClick={() => setFilterMode('favorites')}>
            <Star className="h-3 w-3" /> Favoriten ({favoriteIds.length})
          </FilterChip>
        </div>

        <div className="mt-2 space-y-1.5">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-gold/50 focus:outline-none"
          >
            <option value="all">Alle Marken</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-[11px] text-brand/50">
            <span className="whitespace-nowrap">bis {maxPrice} €</span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      </div>

      {/* Eigener Scroll-Container: Scrollen in der Liste bewegt NICHT die
          gesamte Seite, sondern nur diesen Bereich (max-h + overflow-y-auto). */}
      <div className="max-h-[480px] flex-1 space-y-1.5 overflow-y-auto p-2">
        {filteredProducts.length === 0 ? (
          <p className="p-3 text-center text-xs text-brand/40">Keine Produkte gefunden.</p>
        ) : (
          filteredProducts.map((p) => {
            const isActive = p.id === productId;
            const isFav = favoriteIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p.id)}
                role="button"
                tabIndex={0}
                className={clsx(
                  'group relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-left transition-all duration-200',
                  isActive
                    ? 'scale-[1.02] border-gold bg-gold-light/60 shadow-elegant'
                    : 'border-transparent bg-cream/60 hover:-translate-y-0.5 hover:bg-cream hover:shadow-sm'
                )}
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.colors[0].images.front} alt={p.name} loading="lazy" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-brand">{p.name}</span>
                  <span className="block truncate text-[11px] text-brand/50">{p.brand}</span>
                  <span className="block truncate text-[10px] text-brand/40">
                    {p.material} · {p.weightGsm} g/m²
                  </span>
                  <span className="block text-xs font-medium text-gold-dark">
                    ab {formatPrice(p.basePrice)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p.id);
                  }}
                  title={isFav ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                  className="flex-shrink-0 rounded p-1 text-brand/25 opacity-0 transition-opacity hover:text-gold-dark group-hover:opacity-100"
                  style={isFav ? { opacity: 1 } : undefined}
                >
                  <Star className={clsx('h-4 w-4', isFav && 'fill-gold-dark text-gold-dark')} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors',
        active ? 'bg-gold text-white' : 'bg-cream text-brand/50 hover:bg-cream/70'
      )}
    >
      {children}
    </button>
  );
}
