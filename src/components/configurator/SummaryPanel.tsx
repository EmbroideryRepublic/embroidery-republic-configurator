'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, TrendingDown } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { MINIMUM_QUANTITY, QUANTITY_TIERS, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import { getProduct } from '@/config/products';
import { SizeQuantityTable } from './SizeQuantityTable';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { CartItem, PrintView } from '@/types';

const VIEW_LABEL_KEYS: Record<PrintView, TranslationKey> = {
  front: 'view_front',
  back: 'view_back',
  sleeve_left: 'view_sleeve_left',
  sleeve_right: 'view_sleeve_right',
};

interface SummaryPanelProps {
  productName: string;
  breakdown: PriceCalculationResult['breakdown'] | null;
}

export function SummaryPanel({ productName, breakdown }: SummaryPanelProps) {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const unitPrice = useConfiguratorStore((s) => s.unitPrice);
  const totalPrice = useConfiguratorStore((s) => s.totalPrice);
  const elements = useConfiguratorStore((s) => s.elements);
  const resetDesign = useConfiguratorStore((s) => s.resetDesign);

  const quantity = Object.values(sizeQuantities).reduce((sum, n) => sum + n, 0);
  const product = productId ? getProduct(productId) : null;

  const addCartItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);

  const [isPriceChanged, setIsPriceChanged] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const previousTotal = useRef(totalPrice);
  useEffect(() => {
    if (previousTotal.current !== totalPrice) {
      setIsPriceChanged(true);
      previousTotal.current = totalPrice;
      const timeout = setTimeout(() => setIsPriceChanged(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [totalPrice]);

  const canAddToCart = productId !== null && colorId !== null && quantity >= MINIMUM_QUANTITY;

  function handleAddToCart() {
    if (!canAddToCart || !productId || !colorId) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      printMethod,
      productId,
      colorId,
      sizeQuantities,
      quantity,
      elements,
      unitPrice,
      totalPrice,
      addedAt: Date.now(),
    };
    addCartItem(item);
    resetDesign();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div className="space-y-3 rounded-xl border border-gold/20 bg-white p-4 shadow-elegant">
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand/50">{t('summary_method')}</span>
        <span className="font-medium text-brand">
          {printMethod === 'embroidery' ? t('method_embroidery') : t('method_dtf')}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand/50">{t('summary_elements')}</span>
        <span className="font-medium text-brand">{elements.length}</span>
      </div>

      {product && <SizeQuantityTable product={product} />}

      <p className="text-xs text-brand/40">
        {t('summary_min_quantity')}: {MINIMUM_QUANTITY} Stück{' '}
        {quantity > 0 && quantity < MINIMUM_QUANTITY && (
          <span className="text-red-500">– noch {MINIMUM_QUANTITY - quantity} Stück bis zur Mindestmenge.</span>
        )}
      </p>

      {/* Mengenrabatt-Staffel: visualisiert, wo der Kunde aktuell steht und
          was der nächste Rabattschritt wäre, inkl. Preis pro Stück bei der
          aktuellen Menge (das ersetzt die vorherige separate
          "Einzelpreis"-Zeile weiter unten – hier ist der Pro-Stück-Preis
          im Kontext des Rabatts direkt sichtbar). */}
      <div className="rounded-lg bg-cream/70 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand/70">
            <TrendingDown className="h-3.5 w-3.5 text-gold-dark" />
            Mengenrabatt
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-brand">{formatPrice(unitPrice)}</span>
            <span className="ml-1 text-[11px] text-brand/40">/ Stück</span>
          </div>
        </div>
        <div className="flex gap-1">
          {QUANTITY_TIERS.map((tier) => (
            <div
              key={tier.minQuantity}
              className={clsx(
                'min-w-0 flex-1 truncate rounded py-1 text-center text-[10px] font-medium',
                quantity >= tier.minQuantity ? 'bg-gold text-white' : 'bg-white text-brand/40'
              )}
              title={`ab ${tier.minQuantity} Stück: -${tier.veredelungDiscountPercent}% auf Veredelung, -${tier.baseDiscountPercent}% auf Grundpreis`}
            >
              {tier.veredelungDiscountPercent > 0 ? `-${tier.veredelungDiscountPercent}%` : `${tier.minQuantity}+`}
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-brand/40">Rabatt auf Veredelung (Grundpreis-Rabatt separat, kleiner)</p>
        {breakdown && breakdown.nextTier && (
          <p className="mt-1.5 text-[11px] text-brand/50">
            Noch {breakdown.nextTier.minQuantity - quantity} Stück bis {breakdown.nextTier.veredelungDiscountPercent}% Rabatt auf die Veredelung.
          </p>
        )}
        {breakdown && breakdown.savingsAmount > 0 && (
          <p className="mt-1 text-[11px] font-medium text-green-700">
            Du sparst {formatPrice(breakdown.savingsAmount)} durch den Mengenrabatt.
          </p>
        )}
      </div>

      {breakdown && (
        <div className="rounded-lg bg-cream/70 text-xs text-brand/70">
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 text-brand/50"
          >
            <span>Preisdetails</span>
            <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', showBreakdown && 'rotate-180')} />
          </button>
          {showBreakdown && (
            <div className="space-y-1 px-2.5 pb-2.5">
              <div className="flex items-center justify-between">
                <span>{productName}-Grundpreis</span>
                <span>{formatPrice(breakdown.basePrice)}</span>
              </div>
              {breakdown.positionFeeTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Positions-Aufschlag
                    <InfoTooltip text="Rücken- und Ärmel-Motive kosten wegen des höheren Aufwands beim Wechseln/Einspannen etwas mehr als ein Brust-Motiv." />
                  </span>
                  <span>{formatPrice(breakdown.positionFeeTotal)}</span>
                </div>
              )}
              {(Object.keys(VIEW_LABEL_KEYS) as PrintView[])
                .filter((view) => breakdown.areaPriceByView[view] > 0)
                .map((view, i) => (
                  <div key={view} className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {breakdown.isStitchBased ? 'Stichpreis' : t('summary_area_price')} {t(VIEW_LABEL_KEYS[view])}
                      {i === 0 && (
                        <InfoTooltip
                          text={
                            breakdown.isStitchBased
                              ? `Berechnet nach geschätzter Stichzahl (≈ ${breakdown.totalEstimatedStitches.toLocaleString('de-DE')} Stiche insgesamt) × ${formatPrice(breakdown.pricePer1000Stitches)} pro 1.000 Stiche. Nur eine Näherung – für die verbindliche Zahl zählt die Digitalisierung (z.B. Chroma Inspire).`
                              : `Je größer ein Logo oder Text, desto mehr Material wird verbraucht – automatisch berechnet mit ${formatPrice(breakdown.areaPricePerCm2)} pro cm².`
                          }
                        />
                      )}
                    </span>
                    <span>{formatPrice(breakdown.areaPriceByView[view])}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {quantity >= MINIMUM_QUANTITY ? (
        <div
          className={clsx(
            'flex items-center justify-between rounded-lg bg-gradient-to-r from-gold-light/80 to-cream px-3 py-2.5 transition-transform duration-200',
            isPriceChanged && 'scale-[1.03]'
          )}
        >
          <span className="text-sm font-medium text-brand">{t('summary_total_price')}</span>
          <span className="font-serif text-xl font-bold text-gold-dark">{formatPrice(totalPrice)}</span>
        </div>
      ) : (
        <div className="rounded-lg bg-cream/70 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand/70">{t('summary_unit_price')}</span>
            <span className="font-serif text-lg font-semibold text-brand">{formatPrice(unitPrice)}</span>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            {t('summary_add_at_least', { min: MINIMUM_QUANTITY })}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white shadow-elegant transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          justAdded ? 'bg-green-600' : 'bg-gold hover:bg-gold-dark'
        )}
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" />
            {t('summary_added')}
          </>
        ) : (
          t('summary_add_to_cart')
        )}
      </button>
      {!canAddToCart && (
        <p className="text-center text-xs text-amber-600">
          {t('summary_select_size_first', { min: MINIMUM_QUANTITY })}
        </p>
      )}
    </div>
  );
}
