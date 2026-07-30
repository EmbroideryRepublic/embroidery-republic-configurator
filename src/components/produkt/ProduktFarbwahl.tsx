'use client';

/**
 * Bildbereich der Produktseite: Farbwahl und Ansichtswechsel.
 *
 * Bewusst der EINZIGE Client-Teil der Produktseite. Alles andere ist
 * serverseitig gerendert und damit sofort sichtbar und indexierbar; nur die
 * Bildumschaltung braucht Interaktivität.
 *
 * Zeigt dieselben vier Ansichten wie der Konfigurator, damit der Kunde vor
 * dem Konfigurieren sieht, was ihn erwartet.
 */
import { useState } from 'react';
import Image from 'next/image';
import type { PrintView } from '@/types';
import type { ProductConfig } from '@/config/products/types';

const ANSICHTEN: { key: PrintView; label: string }[] = [
  { key: 'front', label: 'Vorne' },
  { key: 'back', label: 'Hinten' },
  { key: 'sleeve_left', label: 'Ärmel links' },
  { key: 'sleeve_right', label: 'Ärmel rechts' },
];

export function ProduktFarbwahl({ produkt }: { produkt: ProductConfig }) {
  const [farbIndex, setFarbIndex] = useState(0);
  const [ansicht, setAnsicht] = useState<PrintView>('front');

  const farbe = produkt.colors[farbIndex] ?? produkt.colors[0];
  if (!farbe) return null;

  const ansichten = ANSICHTEN.filter(
    (a) => produkt.hasSleeves !== false || (a.key !== 'sleeve_left' && a.key !== 'sleeve_right')
  );

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand/[0.08] bg-white">
        <Image
          src={farbe.images[ansicht]}
          alt={`${produkt.name} in ${farbe.name}, ${ANSICHTEN.find((a) => a.key === ansicht)?.label}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6"
          priority
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ansichten.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAnsicht(a.key)}
            aria-pressed={ansicht === a.key}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              ansicht === a.key
                ? 'border-brand bg-brand text-white'
                : 'border-brand/15 bg-white text-brand/60 hover:border-gold/50 hover:text-brand'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-brand">
          Farbe: <span className="font-normal text-brand/70">{farbe.name}</span>
        </p>
        <p className="mt-0.5 text-xs text-brand/50">{produkt.colors.length} Farben verfügbar</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {produkt.colors.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFarbIndex(i)}
              title={c.name}
              aria-label={`Farbe ${c.name}`}
              aria-pressed={i === farbIndex}
              style={{ backgroundColor: c.hex }}
              className={`h-7 w-7 rounded-full border transition ${
                i === farbIndex
                  ? 'border-white ring-2 ring-gold ring-offset-1'
                  : 'border-black/10 hover:ring-2 hover:ring-gold/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
