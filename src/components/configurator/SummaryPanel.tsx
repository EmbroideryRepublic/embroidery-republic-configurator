'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, TrendingDown } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { QUANTITY_TIERS, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import { getProduct } from '@/config/products';
import { SizeQuantityTable } from './SizeQuantityTable';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { CartItem, PrintView } from '@/types';
import { DECORATION_POSITION_ORDER, positionTranslationKey } from '@/config/decorationPositions';
import { sumSizeQuantities } from '@/lib/pricing/quantity';


interface SummaryPanelProps {
  productName: string;
  breakdown: PriceCalculationResult['breakdown'] | null;
  /** true = mindestens ein Preisbaustein konnte nicht verarbeitet werden.
   *  Der Preis ist dann ungültig und darf nicht bestellt werden. */
  priceHasErrors?: boolean;
}

export function SummaryPanel({ productName, breakdown, priceHasErrors = false }: SummaryPanelProps) {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const unitPrice = useConfiguratorStore((s) => s.unitPrice);
  const totalPrice = useConfiguratorStore((s) => s.totalPrice);
  const elements = useConfiguratorStore((s) => s.elements);
  const resetDesign = useConfiguratorStore((s) => s.resetDesign);

  const quantity = sumSizeQuantities(sizeQuantities);
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

  // Einzelstücke sind ausdrücklich erlaubt – es gibt keine Mindestmenge mehr.
  // Bedingung ist nur noch, dass überhaupt etwas ausgewählt wurde UND der
  // Preis gültig zustande kam: Ein Preis mit nicht verarbeiteten Bausteinen
  // darf niemals in eine Bestellung übernommen werden.
  const canAddToCart = productId !== null && colorId !== null && quantity > 0 && !priceHasErrors;

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
      setupTotal: breakdown?.setupTotal ?? 0,
      addedAt: Date.now(),
    };
    addCartItem(item);
    resetDesign();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div className="space-y-2 rounded-xl border border-gold/20 bg-white p-3 shadow-elegant">
      {/* Veredelung, Elemente und Position stehen jetzt in der Live-Übersicht
          (KonfigUebersicht) oben in der Spalte – hier bleibt der eigentliche
          Preis- und Bestellbereich, um Doppelungen zu vermeiden. */}
      {product && <SizeQuantityTable product={product} />}

      {/* Harte Warnung statt still falscher Preis. Tritt nur auf, wenn eine
          Preisregel im laufenden Betrieb nicht verarbeitet werden konnte –
          in Entwicklung und Tests bricht die Engine vorher ab. */}
      {priceHasErrors && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {t('summary_price_invalid')}
        </p>
      )}

      {/* Keine Mindestmenge mehr – stattdessen die einmaligen Rüstkosten
          ausweisen. Der Kunde soll verstehen, WARUM ein Einzelstück
          verhältnismäßig teurer ist und dass sich Menge lohnt. */}
      {breakdown && breakdown.setupTotal > 0 && (
        <p className="text-xs text-brand/55">
          {t('summary_setup_fee')}: {formatPrice(breakdown.setupTotal)}{' '}
          <span className="text-brand/45">
            ({formatPrice(breakdown.setupPerUnit)} {t('summary_setup_per_unit')})
          </span>
        </p>
      )}

      {/* Mengenrabatt als schmale Chip-Leiste.
          Vorher ein eigener Block mit Überschrift, Erklärtext, Fortschritts-
          und Ersparnishinweis – zusammen rund 120 px, die dem Preis und dem
          Bestellknopf fehlten. Die Staffel selbst ist die Information; alles
          Weitere steht im Tooltip oder ergibt sich aus dem Preis. */}
      <div className="flex items-center gap-1">
        <TrendingDown className="h-3.5 w-3.5 flex-shrink-0 text-gold-dark" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 gap-0.5">
          {QUANTITY_TIERS.map((tier) => (
            <div
              key={tier.minQuantity}
              className={clsx(
                'min-w-0 flex-1 truncate rounded-md py-0.5 text-center text-[10px] font-medium',
                quantity >= tier.minQuantity ? 'bg-gold text-white' : 'bg-cream text-brand/40'
              )}
              title={`ab ${tier.minQuantity} Stück: -${tier.veredelungDiscountPercent}% auf Veredelung, -${tier.baseDiscountPercent}% auf Grundpreis`}
            >
              {tier.veredelungDiscountPercent > 0 ? `-${tier.veredelungDiscountPercent}%` : `${tier.minQuantity}+`}
            </div>
          ))}
        </div>
      </div>

      {/* Nur der NÄCHSTE Schritt bzw. die erreichte Ersparnis – eine Zeile,
          und nur wenn sie etwas aussagt. */}
      {breakdown?.nextTier ? (
        <p className="text-[11px] text-brand/50">
          Noch {breakdown.nextTier.minQuantity - quantity} Stück bis {breakdown.nextTier.veredelungDiscountPercent}% Rabatt.
        </p>
      ) : breakdown && breakdown.savingsAmount > 0 ? (
        <p className="text-[11px] font-medium text-green-700">
          Sie sparen {formatPrice(breakdown.savingsAmount)}.
        </p>
      ) : null}

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
              {DECORATION_POSITION_ORDER
                .filter((view) => breakdown.areaPriceByView[view] > 0)
                .map((view, i) => (
                  <div key={view} className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {breakdown.isStitchBased ? 'Stichpreis' : t('summary_area_price')} {t(positionTranslationKey(view))}
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

      {/* Gesamtpreis, sobald überhaupt eine Menge gewählt ist – auch bei
          einem einzigen Stück. Vorher erschien er erst ab 5 Stück. */}
      {quantity > 0 ? (
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
          <p className="mt-1 text-xs text-amber-700">{t('summary_select_size_first')}</p>
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
          {t('summary_select_size_first')}
        </p>
      )}
    </div>
  );
}
