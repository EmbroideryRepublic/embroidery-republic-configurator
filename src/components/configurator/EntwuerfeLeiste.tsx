'use client';

/**
 * „Zuletzt bearbeitet": die Entwürfe, die man beim Produktwechsel hinter sich
 * gelassen hat, als Karten mit einem Klick zurück in den Editor.
 *
 * Ohne diese Leiste war der Stand nach einem Wechsel (z. B. von Hoodie A zu
 * Hoodie B) nirgends mehr zu sehen. Die Leiste erscheint erst, wenn es einen
 * Entwurf gibt – sie kostet dem Konfigurator keine Höhe, solange nichts zu
 * zeigen ist.
 *
 * Regeln zum Entstehen und Begrenzen der Entwürfe: lib/configurator/entwuerfe.ts.
 * Der Tausch beim Laden (der gerade bearbeitete Stand wird selbst zum Entwurf)
 * steckt in configuratorStore.resumeDraft.
 */
import Image from 'next/image';
import { X } from 'lucide-react';
import { useEntwuerfeStore } from '@/stores/entwuerfeStore';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { getProduct } from '@/config/products';
import { bildFuerAnsicht, repraesentativBildVon, repraesentativeFarbe } from '@/lib/assets';
import { formatiereFarbname } from '@/lib/products/farben';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import type { Entwurf } from '@/lib/configurator/entwuerfe';

type Uebersetze = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => string;

function EntwurfKarte({ entwurf, t }: { entwurf: Entwurf; t: Uebersetze }) {
  const entferne = useEntwuerfeStore((s) => s.entferne);
  const resumeDraft = useConfiguratorStore((s) => s.resumeDraft);
  const currency = useCurrencyStore((s) => s.currency);

  const produkt = getProduct(entwurf.productId);
  // Das Produkt kann seit dem Speichern aus dem Katalog genommen worden sein – dann gibt es nichts zu laden.
  if (!produkt) return null;

  const farbe = produkt.colors.find((c) => c.id === entwurf.colorId) ?? repraesentativeFarbe(produkt.id, produkt.colors);
  const bild = farbe ? (bildFuerAnsicht(produkt.id, farbe.id, 'front') ?? repraesentativBildVon(produkt.id, farbe.id)) : undefined;
  const stueck = sumSizeQuantities(entwurf.sizeQuantities);
  const motive = entwurf.elements.length;

  const motivText = motive === 0 ? t('entwuerfe_ohne_motiv') : motive === 1 ? t('entwuerfe_motive_eins') : t('entwuerfe_motive_mehr', { n: motive });
  const zeile = [farbe ? formatiereFarbname(farbe.name) : null, motivText, stueck > 0 ? t('entwuerfe_stueck', { n: stueck }) : null]
    .filter(Boolean)
    .join(' · ');
  const preis = stueck > 0 && entwurf.totalPrice > 0 ? formatPriceWithCurrency(entwurf.totalPrice, currency) : null;

  return (
    <li className="relative w-[min(100%,280px)] flex-shrink-0" data-entwurf={entwurf.productId}>
      <button
        type="button"
        onClick={() => resumeDraft(entwurf.id)}
        title={`${t('entwuerfe_weiter')} – ${t('entwuerfe_hinweis')}`}
        className="flex w-full items-center gap-2 rounded-xl border border-gold/25 bg-white py-1.5 pl-1.5 pr-8 text-left transition-colors hover:border-gold-dark/60 hover:bg-brand-light/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dark"
      >
        <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-brand-light">
          {bild && <Image src={bild} alt="" fill sizes="40px" className="object-contain p-0.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-brand">{produkt.name}</span>
          <span className="block truncate text-xs text-brand/70">{zeile}</span>
          <span className="flex items-baseline justify-between gap-2 whitespace-nowrap">
            <span className="truncate text-xs font-medium text-gold-dark">{t('entwuerfe_weiter')}</span>
            {preis && <span className="flex-shrink-0 text-xs font-medium text-brand">{preis}</span>}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => entferne(entwurf.id)}
        aria-label={`${t('entwuerfe_entfernen')}: ${produkt.name}`}
        title={t('entwuerfe_entfernen')}
        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-brand/70 transition-colors hover:bg-brand-light hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dark"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

export function EntwuerfeLeiste() {
  const entwuerfe = useEntwuerfeStore((s) => s.entwuerfe);
  const language = useLanguageStore((s) => s.language);
  const t: Uebersetze = (key, vars) => translate(key, language, vars);

  if (entwuerfe.length === 0) return null;

  return (
    <section aria-label={t('entwuerfe_titel')} data-entwuerfe-leiste className="w-full">
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand/70">{t('entwuerfe_titel')}</h2>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {entwuerfe.map((e) => (
          <EntwurfKarte key={e.id} entwurf={e} t={t} />
        ))}
      </ul>
    </section>
  );
}
