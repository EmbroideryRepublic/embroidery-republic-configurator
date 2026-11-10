'use client';

/**
 * Live-Übersicht der aktuellen Konfiguration – rechts im Informationsbereich.
 *
 * Zweck ist der geführte Einkauf: Der Kunde sieht auf einen Blick, was er
 * gerade konfiguriert hat (Produkt, Farbe, Größe × Menge, Veredelung,
 * Position, Preis), erkennt an einem Häkchen, was erledigt ist, und bekommt
 * dezent den nächsten sinnvollen Schritt vorgeschlagen – ohne bevormundet zu
 * werden. Die Beurteilung selbst kommt aus `lib/configurator/kauffortschritt`;
 * hier steht nur die Darstellung.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getProduct } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { formatPriceWithCurrency, useCurrencyStore } from '@/stores/currencyStore';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { positionTranslationKey } from '@/config/decorationPositions';
import { belegteAnsichten, groessenText, naechsterSchritt, type SchrittId } from '@/lib/configurator/kauffortschritt';

/** Der Hinweistext zum nächsten Schritt, je Schritt ein Übersetzungsschlüssel. */
const HINWEIS: Record<SchrittId, Parameters<typeof translate>[0]> = {
  groesse: 'next_size',
  motiv: 'next_motif',
  position: 'next_position',
  bestellen: 'next_ready',
};

export function KonfigUebersicht({ priceHasErrors = false }: { priceHasErrors?: boolean }) {
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const elements = useConfiguratorStore((s) => s.elements);
  const unitPrice = useConfiguratorStore((s) => s.unitPrice);
  const totalPrice = useConfiguratorStore((s) => s.totalPrice);

  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const preis = (betrag: number) => formatPriceWithCurrency(betrag, currency);

  const product = productId ? getProduct(productId) : null;
  const farbe = product?.colors.find((c) => c.id === colorId) ?? product?.colors[0];
  const menge = sumSizeQuantities(sizeQuantities);
  const groessen = groessenText(sizeQuantities);
  const ansichten = belegteAnsichten(elements);
  const hatMotiv = elements.length > 0;
  const motivImRahmen = hatMotiv && elements.every((el) => !el.isOutOfBounds);

  const naechster = naechsterSchritt({
    hatGroesse: menge > 0,
    hatMotiv,
    motivImRahmen,
    preisGueltig: !priceHasErrors,
  });

  // Standardmäßig eingeklappt: Die Übersicht ist Orientierung, kein Arbeitsbereich – der Platz gehört den Werkzeugen
  // (Wunsch des Betreibers 2026-11-10). Die volle Liste klappt mit einem Klick auf.
  const [offen, setOffen] = useState(false);

  const zeilen: { label: string; wert: string; erledigt: boolean; farbe?: string }[] = [
    { label: t('konfig_product'), wert: product?.name ?? t('konfig_none'), erledigt: !!product },
    { label: t('konfig_color'), wert: farbe?.name ?? t('konfig_none'), erledigt: !!farbe, farbe: farbe?.hex },
    { label: t('konfig_size'), wert: groessen || t('konfig_none'), erledigt: menge > 0 },
    {
      label: t('konfig_method'),
      wert: printMethod === 'embroidery' ? t('method_embroidery') : t('method_dtf'),
      erledigt: true,
    },
    {
      label: t('konfig_position'),
      wert: ansichten.length > 0 ? ansichten.map((v) => t(positionTranslationKey(v))).join(', ') : t('konfig_none'),
      erledigt: hatMotiv,
    },
    { label: t('konfig_price'), wert: preis(menge > 0 ? totalPrice : unitPrice), erledigt: menge > 0 },
  ];

  // Kurzfassung für die schmale Zeile: Produkt, Farbe, Größe, Veredelung (Preis und Position stehen weiter unten bzw. in den Ebenen).
  const kurzProdukt = zeilen[0];
  const kurzFarbe = zeilen[1];
  const kurzGroesse = zeilen[2];
  const kurzMethode = zeilen[3];
  const erledigtAnzahl = zeilen.filter((z) => z.erledigt).length;

  return (
    <div className="rounded-xl border border-gold/20 bg-white px-3 py-2.5 shadow-elegant">
      <button
        type="button"
        onClick={() => setOffen((an) => !an)}
        aria-expanded={offen}
        aria-controls="konfig-details"
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand/70">{t('konfig_title')}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-0.5" aria-hidden>
            {zeilen.map((z) => (
              <span key={z.label} className={clsx('h-1.5 w-1.5 rounded-full', z.erledigt ? 'bg-gold-btn' : 'bg-brand/20')} />
            ))}
          </span>
          <span className="sr-only">
            {erledigtAnzahl}/{zeilen.length}
          </span>
          <ChevronDown className={clsx('h-4 w-4 text-brand/70 transition-transform', offen && 'rotate-180')} aria-hidden />
          <span className="sr-only">{offen ? t('konfig_details_hide') : t('konfig_details_show')}</span>
        </span>
      </button>

      {!offen && kurzProdukt && kurzFarbe && kurzGroesse && kurzMethode && (
        <p className="mt-1 truncate text-[13px] font-medium text-brand">
          {kurzProdukt.wert}
          <span className="text-brand/70"> · </span>
          {kurzFarbe.farbe && (
            <span
              className="mr-1 inline-block h-3 w-3 rounded-full align-[-1px] ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: kurzFarbe.farbe }}
              aria-hidden
            />
          )}
          {kurzFarbe.wert}
          {/* Ohne gewählte Größe entfällt das Stück, statt ein "—" in der Zeile zu zeigen. */}
          {kurzGroesse.erledigt && (
            <>
              <span className="text-brand/70"> · </span>
              {kurzGroesse.wert}
            </>
          )}
          <span className="text-brand/70"> · </span>
          {kurzMethode.wert}
        </p>
      )}

      {offen && (
      <dl id="konfig-details" className="mt-2 space-y-1">
        {zeilen.map((z) => (
          <div key={z.label} className="flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className={clsx(
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                z.erledigt ? 'bg-gold-btn text-white' : 'border border-dashed border-brand/25 bg-transparent'
              )}
            >
              {z.erledigt && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <dt className="w-[4.5rem] flex-shrink-0 text-brand/70">{z.label}</dt>
            <dd className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right font-medium text-brand">
              {z.farbe && (
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: z.farbe }}
                  aria-hidden
                />
              )}
              <span className="truncate">{z.wert}</span>
            </dd>
          </div>
        ))}
      </dl>
      )}

      {/* Dezenter Hinweis auf den nächsten Schritt – führt, ohne zu drängen. */}
      {naechster && (
        <div
          className={clsx(
            'mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium',
            naechster === 'bestellen'
              ? 'bg-green-50 text-green-700'
              : 'bg-gold-light/40 text-gold-dark'
          )}
        >
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          <span>{t(HINWEIS[naechster])}</span>
        </div>
      )}
    </div>
  );
}
