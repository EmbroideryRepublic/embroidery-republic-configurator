'use client';

/**
 * Doppelter Schieberegler für eine Zahlenspanne (Preis, Stoffgewicht).
 *
 * Zwei übereinanderliegende Bereichsfelder: Ein einzelnes kann keine Spanne
 * abbilden, und eine Fremdbibliothek dafür wäre eine Abhängigkeit für ein
 * paar Zeilen. Übernommen wird beim Loslassen – sonst löste jede
 * Zwischenposition eine Serverrunde aus.
 */
import { useEffect, useState } from 'react';

const REGLER =
  'pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 ' +
  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 ' +
  '[&::-moz-range-thumb]:border-gold [&::-moz-range-thumb]:bg-white';

export function Spannenregler({
  von, bis, min, max, einheit, onAendern,
}: {
  von?: number; bis?: number; min: number; max: number; einheit: string;
  onAendern: (von?: number, bis?: number) => void;
}) {
  const [a, setA] = useState(von ?? min);
  const [b, setB] = useState(bis ?? max);

  // Nach einer Fortschreibung der Adresse (z.B. „Alle Filter löschen")
  // müssen die Regler den neuen Stand übernehmen.
  useEffect(() => { setA(von ?? min); setB(bis ?? max); }, [von, bis, min, max]);

  // Am Rand liegende Werte sind KEIN Filter – sonst stünde dauerhaft ein
  // Chip „Preis 5–75 €" in der Leiste, obwohl nichts eingegrenzt ist.
  const uebernehmen = (neuA: number, neuB: number) =>
    onAendern(neuA <= min ? undefined : neuA, neuB >= max ? undefined : neuB);

  const anteil = (w: number) => ((w - min) / (max - min)) * 100;

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-2.5 h-1 rounded-full bg-brand/10" />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-gold"
          style={{ left: `${anteil(a)}%`, right: `${100 - anteil(b)}%` }}
        />
        <input
          type="range" min={min} max={max} value={a} aria-label={`Minimum ${einheit}`}
          onChange={(e) => setA(Math.min(Number(e.target.value), b))}
          onPointerUp={() => uebernehmen(a, b)} onKeyUp={() => uebernehmen(a, b)}
          className={REGLER}
        />
        <input
          type="range" min={min} max={max} value={b} aria-label={`Maximum ${einheit}`}
          onChange={(e) => setB(Math.max(Number(e.target.value), a))}
          onPointerUp={() => uebernehmen(a, b)} onKeyUp={() => uebernehmen(a, b)}
          className={REGLER}
        />
      </div>

      {/* Werte als EINE ruhige Zeile statt zweier Eingabefelder: Felder
          machen aus der Seitenleiste ein Formular, und die Spanne stand
          vorher doppelt da (Felder + Skala darunter). */}
      <div className="mt-3 flex items-baseline justify-between text-[13px]">
        <span className="tabular-nums text-brand">{a} {einheit}</span>
        <span className="text-brand/30">–</span>
        <span className="tabular-nums text-brand">{b} {einheit}</span>
      </div>
    </div>
  );
}
