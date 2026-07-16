'use client';

import { useState } from 'react';
import { ChevronDown, BadgeCheck, Ruler, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { SizeGuideModal } from './SizeGuideModal';
import type { ProductConfig } from '@/config/products';

interface ProductDetailsProps {
  product: ProductConfig;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const dd = product.detailedDescription;

  return (
    <div className="w-full rounded-xl border border-gold/20 bg-white shadow-elegant">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-brand/50">
          {t('product_details_title')}
        </span>
        <ChevronDown className={clsx('h-4 w-4 text-brand/40 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="animate-fade-in space-y-3 border-t border-gold/10 px-4 py-3 text-sm text-brand/70">
          <p>{product.description}</p>

          {product.sizeGuide && (
            <button
              type="button"
              onClick={() => setShowSizeGuide(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gold/25 bg-gold-light/20 px-3 py-1.5 text-xs font-medium text-gold-dark hover:bg-gold-light/40"
            >
              <Ruler className="h-3.5 w-3.5" />
              Größenleitfaden ansehen
            </button>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-brand/40">{t('product_details_material')}</dt>
              <dd className="text-brand/80">{product.material}</dd>
            </div>
            <div>
              <dt className="text-brand/40">{t('product_details_weight')}</dt>
              <dd className="text-brand/80">{product.weightGsm} g/m²</dd>
            </div>
            <div>
              <dt className="text-brand/40">{t('product_details_fit')}</dt>
              <dd className="text-brand/80">{product.fit}</dd>
            </div>
            <div>
              <dt className="text-brand/40">{t('product_details_colors_available')}</dt>
              <dd className="text-brand/80">{product.colors.length}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {product.certifications.map((cert) => (
              <span
                key={cert}
                className="flex items-center gap-1 rounded-full bg-gold-light px-2 py-1 text-[11px] font-medium text-gold-dark"
              >
                <BadgeCheck className="h-3 w-3" />
                {cert}
              </span>
            ))}
          </div>

          <p className="text-xs text-brand/50">
            <span className="font-medium text-brand/70">{t('product_details_care')}: </span>
            {product.careInstructions}
          </p>

          {product.datasheetUrl && (
            <a
              href={product.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-gold-dark hover:underline"
            >
              {t('product_details_datasheet')} →
            </a>
          )}

          {/* Artikelbeschreibung vom Hersteller – so wie vom Lieferanten übergeben */}
          {dd && (
            <div className="border-t border-gold/10 pt-3">
              <button
                type="button"
                onClick={() => setShowFullDescription((v) => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-brand/50">
                  Artikelbeschreibung ({dd.supplierBrand})
                </span>
                <ChevronRight
                  className={clsx('h-3.5 w-3.5 text-brand/40 transition-transform', showFullDescription && 'rotate-90')}
                />
              </button>

              {showFullDescription && (
                <div className="mt-2.5 space-y-3">
                  <ul className="space-y-1 text-xs text-brand/70">
                    {dd.bulletPoints.map((point, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-gold-dark">·</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-cream/50 p-3 text-[11px]">
                    <div>
                      <dt className="text-brand/40">Produktart</dt>
                      <dd className="text-brand/80">{dd.productType}</dd>
                    </div>
                    <div>
                      <dt className="text-brand/40">Geschlecht</dt>
                      <dd className="text-brand/80">{dd.gender}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-brand/40">Nachhaltigkeit/Ethik</dt>
                      <dd className="text-brand/80">{dd.sustainability}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-brand/40">Material</dt>
                      <dd className="text-brand/80">{dd.materialDetail}</dd>
                    </div>
                    <div>
                      <dt className="text-brand/40">Herstellungsland</dt>
                      <dd className="text-brand/80">{dd.countryOfOrigin}</dd>
                    </div>
                    <div>
                      <dt className="text-brand/40">Grammatur</dt>
                      <dd className="text-brand/80">{product.weightGsm} g/m²</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showSizeGuide && product.sizeGuide && (
        <SizeGuideModal
          productName={product.name}
          sizeGuide={product.sizeGuide}
          onClose={() => setShowSizeGuide(false)}
        />
      )}
    </div>
  );
}
