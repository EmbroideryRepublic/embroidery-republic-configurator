'use client';

/**
 * Anzeige des automatisch angewendeten Aktionsrabatts im Warenkorb und an der Kasse (config/aktion.ts, aktuell Code „BLACK10“).
 *
 * Reine Anzeige: Der Rabatt steckt bereits in den Positionspreisen (calculatePrice, `aktion`) und wird vom Server beim Bestellen
 * neu berechnet. Hier steht nur, WAS gespart wird und dass nichts einzugeben ist – es gibt kein Eingabefeld und keinen Knopf „Code einlösen“.
 * Die Ersparnis stammt aus `CartItem.aktionErsparnis`; ohne Ersparnis (leerer Warenkorb, Aktion vorbei) erscheint nichts.
 */
import { Check, Tag } from 'lucide-react';
import type { CartItem } from '@/types';
import { useAktuelleAktion } from './useAktion';

/** Summe der Aktions-Ersparnis über alle Positionen, auf Cent gerundet. */
export function aktionsErsparnis(items: CartItem[]): number {
  return Math.round(items.reduce((s, i) => s + (i.aktionErsparnis ?? 0), 0) * 100) / 100;
}

interface BoxProps {
  items: CartItem[];
  formatPrice: (betrag: number) => string;
}

/** Kasten über der Summe im Warenkorb: „BLACK10 angewendet – du sparst X €“. */
export function WarenkorbAktionBox({ items, formatPrice }: BoxProps) {
  const aktion = useAktuelleAktion();
  const ersparnis = aktionsErsparnis(items);
  if (!aktion || !(ersparnis > 0)) return null;

  return (
    <div
      data-testid="aktion-box"
      className="mb-3 overflow-hidden rounded-xl border border-brand bg-brand text-white"
      role="status"
    >
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold text-brand">
            <Tag className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-semibold leading-tight">
              <span className="font-mono text-[14px] font-black tracking-[0.08em]">{aktion.code}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                angewendet
              </span>
            </p>
            <p className="mt-1 text-[12px] leading-snug text-white/80">
              {aktion.name}: {aktion.prozent} % auf alle Positionen – automatisch, nichts einzugeben. Gilt bis {aktion.letzterTag}.
            </p>
          </div>
        </div>
        <p className="flex-shrink-0 text-right">
          <span className="block text-[11px] uppercase tracking-wide text-white/70">Du sparst</span>
          <span className="block text-[17px] font-extrabold tabular-nums text-gold" data-testid="aktion-ersparnis">
            {formatPrice(ersparnis)}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Kleine Zeile unter der Zwischensumme („Darin: Black Week (BLACK10) −10 %: X € gespart“) für die Kasse – die Summe enthält den Rabatt schon, deshalb kein Minusbetrag. */
export function AktionsZeile({ items, formatPrice }: BoxProps) {
  const aktion = useAktuelleAktion();
  const ersparnis = aktionsErsparnis(items);
  if (!aktion || !(ersparnis > 0)) return null;
  return (
    <div className="mt-1 flex items-center justify-between text-xs font-medium text-gold-dark" data-testid="aktion-zeile">
      <span>
        Darin: {aktion.name} ({aktion.code}) −{aktion.prozent} %
      </span>
      <span className="tabular-nums">{formatPrice(ersparnis)} gespart</span>
    </div>
  );
}

/** Kurzes Etikett an einer Position im Warenkorb: „−12,34 € Black Week“. */
export function PositionsAktion({ item, formatPrice }: { item: CartItem; formatPrice: (betrag: number) => string }) {
  const aktion = useAktuelleAktion();
  const ersparnis = item.aktionErsparnis ?? 0;
  if (!aktion || !(ersparnis > 0)) return null;
  return (
    <p className="mt-0.5 text-right text-[11px] font-semibold text-gold-dark" data-testid="aktion-position">
      {aktion.name} −{aktion.prozent} %: −{formatPrice(ersparnis)} gespart
    </p>
  );
}
