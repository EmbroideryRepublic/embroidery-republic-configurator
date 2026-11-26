'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { ProductConfig } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { waehlbareFarben, formatiereFarbname } from '@/lib/products/farben';
import { einzeiligeFarben, ersteZeileAnzahl, farbreiheKnopfText } from './farbreihe';

interface ColorSizeSelectorProps {
  product: ProductConfig;
}

// Auf dem Server gibt es kein Layout zu messen; dort läuft der Effekt wie ein gewöhnlicher.
const useMessEffekt = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Höhe einer Zeile: Farbpunkt 44 px + 6 px Luft oben und unten, damit die vergrößerte gewählte Farbe samt Ring nicht abgeschnitten wird. */
const EINE_ZEILE = '3.5rem';

export function ColorSizeSelector({ product }: ColorSizeSelectorProps) {
  const colorId = useConfiguratorStore((s) => s.colorId);
  const setColor = useConfiguratorStore((s) => s.setColor);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0]) => translate(key, language);

  // Nur Farben mit echtem Herstellerfoto zur Auswahl stellen: Ein Klick auf eine
  // Farbe ohne Bild ersetzte die Produktansicht durch die Platzhalter-Silhouette.
  const farben = waehlbareFarben(product.id, product.colors);
  const aktiveFarbe = farben.find((c) => c.id === colorId) ?? farben[0];

  // Einzeilige Leiste: Bei vielen Farben zeigt sie zunächst nur eine Zeile, damit die Vorschau nicht nach unten rutscht.
  // Der Kunde kann alle Farben aufklappen (und wieder zuklappen).
  const [offen, setOffen] = useState(false);
  const [sichtbar, setSichtbar] = useState<number | null>(null);
  const reiheRef = useRef<HTMLDivElement>(null);
  const reiheId = useId();

  useMessEffekt(() => {
    const reihe = reiheRef.current;
    if (!reihe) return;
    const messen = () => {
      const oben = Array.from(reihe.children).map((k) => (k as HTMLElement).offsetTop);
      setSichtbar(ersteZeileAnzahl(oben));
    };
    messen();
    const beobachter = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(messen) : null;
    beobachter?.observe(reihe);
    return () => beobachter?.disconnect();
  }, [farben.length, product.id]);

  // Ein anderes Produkt startet wieder einzeilig.
  useEffect(() => {
    setOffen(false);
  }, [product.id]);

  const { liste, versteckt } = einzeiligeFarben(farben, aktiveFarbe?.id, sichtbar, offen);
  const knopfText = farbreiheKnopfText(versteckt, offen, t('color_more'), t('color_less'));

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/20 bg-white px-4 py-3 shadow-elegant">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand/70">{product.brand}</p>
        <p className="font-serif text-base font-semibold text-brand">{product.name}</p>
        <p className="text-xs text-brand/70">{product.tagline}</p>
      </div>

      <div className="flex w-full min-w-0 flex-col items-end gap-1.5 sm:w-auto sm:flex-1 sm:min-w-[16rem]">
        {/* Farbname statt reiner Beschriftung: Der Kunde soll benennen
            können, was er gewählt hat – die Farbfläche allein reicht dafür
            nicht (Navy und Schwarz sind auf kleinen Punkten kaum trennbar). */}
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span className="text-xs text-brand/70">
            {t('color_label')}{' '}
            <span className="font-medium text-brand">
              {aktiveFarbe ? formatiereFarbname(aktiveFarbe.name) : undefined}
            </span>
          </span>
          {versteckt > 0 && (
            <button
              type="button"
              data-farbreihe-knopf
              aria-expanded={offen}
              aria-controls={reiheId}
              onClick={() => setOffen((o) => !o)}
              className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs font-medium text-brand transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {knopfText}
            </button>
          )}
        </div>
        <div
          ref={reiheRef}
          id={reiheId}
          className="flex w-full flex-wrap justify-end gap-1.5 px-1.5 py-1.5"
          style={offen || versteckt === 0 ? undefined : { maxHeight: EINE_ZEILE, overflow: 'hidden' }}
        >
          {liste.map((color) => (
            <button
              key={color.id}
              type="button"
              data-farbe={color.id}
              title={formatiereFarbname(color.name)}
              onClick={() => setColor(color.id)}
              className={clsx(
                'h-11 w-11 rounded-full border-2 transition-transform',
                colorId === color.id
                  ? 'scale-110 border-gold ring-2 ring-gold/30'
                  : 'border-gray-200 hover:scale-105'
              )}
              style={{ backgroundColor: color.hex }}
            >
              <span className="sr-only">{formatiereFarbname(color.name)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
