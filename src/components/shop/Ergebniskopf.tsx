'use client';

/**
 * Über der Trefferliste: aktive Filter als Chips, Trefferzahl, Sortierung
 * und Umschalter zwischen Raster und Liste.
 *
 * Steht bewusst NICHT in der angehefteten Leiste oben: Diese Zeile gehört zum
 * Ergebnis und soll mitscrollen. Oben bleibt nur, was zum Filtern gebraucht
 * wird.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, LayoutGrid, List } from 'lucide-react';
import {
  MENGEN_DIMENSIONEN, SORTIER_LABELS, hatAktiveFilter, schalteWert, setzeZurueck,
  type Ansicht, type FilterKriterien, type Sortierung,
} from '@/lib/catalog/kriterien';
import { FARBGRUPPE_HEX } from '@/config/products/facetten';
import { Chip, DIMENSION_LABELS, beschrifteWert } from './filterBausteine';
import { useFilterNavigation } from './filterNavigation';

export function Ergebniskopf({
  kriterien, bezeichnungen, gesamt,
}: { kriterien: FilterKriterien; bezeichnungen: Record<string, string>; gesamt: number }) {
  const { anwenden, wartet } = useFilterNavigation();
  const aktiv = hatAktiveFilter(kriterien);

  return (
    <div>
      {aktiv && (
        <div className="mb-7 flex flex-wrap items-center gap-2">
          {MENGEN_DIMENSIONEN.flatMap((dim) =>
            (kriterien[dim] as string[]).map((wert) => (
              <Chip
                key={`${dim}-${wert}`}
                text={beschrifteWert(dim, wert, bezeichnungen)}
                farbe={dim === 'farbe' ? FARBGRUPPE_HEX[wert as keyof typeof FARBGRUPPE_HEX] : undefined}
                ariaLabel={`Filter ${DIMENSION_LABELS[dim]}: ${beschrifteWert(dim, wert, bezeichnungen)} entfernen`}
                onEntfernen={() => anwenden(schalteWert(kriterien, dim, wert))}
              />
            ))
          )}
          {(kriterien.preisVon !== undefined || kriterien.preisBis !== undefined) && (
            <Chip
              text={`Preis ${kriterien.preisVon ?? ''}–${kriterien.preisBis ?? ''} €`}
              ariaLabel="Preisfilter entfernen"
              onEntfernen={() => anwenden({ ...kriterien, preisVon: undefined, preisBis: undefined, seite: 1 })}
            />
          )}
          {(kriterien.gewichtVon !== undefined || kriterien.gewichtBis !== undefined) && (
            <Chip
              text={`${kriterien.gewichtVon ?? ''}–${kriterien.gewichtBis ?? ''} g/m²`}
              ariaLabel="Gewichtsfilter entfernen"
              onEntfernen={() => anwenden({ ...kriterien, gewichtVon: undefined, gewichtBis: undefined, seite: 1 })}
            />
          )}
          {kriterien.auchNichtLieferbare && (
            <Chip
              text="inkl. nicht lieferbarer"
              ariaLabel="Verfügbarkeitsfilter entfernen"
              onEntfernen={() => anwenden({ ...kriterien, auchNichtLieferbare: false, seite: 1 })}
            />
          )}
          <button
            type="button"
            onClick={() => anwenden(setzeZurueck(kriterien))}
            className="ml-2 text-[12px] text-gray-400 underline-offset-4 transition-colors duration-200 hover:text-brand hover:underline"
          >
            Alle Filter löschen
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-b border-gray-900/[0.07] pb-5">
        <p className={`text-sm transition ${wartet ? 'text-gray-400' : 'text-gray-600'}`} aria-live="polite">
          <strong className="text-[22px] font-light tracking-tight text-gray-900">{gesamt}</strong>{' '}
          {gesamt === 1 ? 'Produkt' : 'Produkte'}
        </p>

        <div className="flex items-center gap-3">
          <Sortierwahl
            wert={kriterien.sortierung}
            onWahl={(s) => anwenden({ ...kriterien, sortierung: s, seite: 1 })}
          />

          {/* Ansichtsumschalter bewusst ohne gefüllten Block: Ein dunkles
              Rechteck wäre das schwerste Element der Seite – hier genügt,
              dass das aktive Symbol kräftiger steht. */}
          <div className="hidden items-center gap-1 sm:flex">
            {(['raster', 'liste'] as Ansicht[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => anwenden({ ...kriterien, ansicht: a })}
                aria-pressed={kriterien.ansicht === a}
                aria-label={a === 'raster' ? 'Rasteransicht' : 'Listenansicht'}
                className={`rounded-full p-2 transition-colors duration-300 ease-out ${
                  kriterien.ansicht === a ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'
                }`}
              >
                {a === 'raster' ? <LayoutGrid className="h-[18px] w-[18px]" /> : <List className="h-[18px] w-[18px]" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Eigenes Klappmenü für die Sortierung.
 *
 * Ein natives `<select>` bringt die Optik des Betriebssystems mit (eigener
 * Pfeil, eigene Liste, eigene Schrift) und war das technischste Element der
 * Seite. Hier steht dieselbe Bedienung in der Formensprache des Shops.
 */
function Sortierwahl({ wert, onWahl }: { wert: Sortierung; onWahl: (s: Sortierung) => void }) {
  const [offen, setOffen] = useState(false);
  const bereich = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent) => {
      if (bereich.current && !bereich.current.contains(e.target as Node)) setOffen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('mousedown', zu);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', zu); document.removeEventListener('keydown', esc); };
  }, [offen]);

  return (
    <div ref={bereich} className="relative">
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        aria-expanded={offen}
        aria-label="Sortieren nach"
        className="inline-flex items-center gap-2 rounded-full border border-gray-900/[0.09] bg-white/70 px-4 py-2 text-[13px] text-gray-700 transition-all duration-300 ease-out hover:border-gray-900/20 hover:bg-white hover:text-gray-900"
      >
        <span className="hidden text-gray-400 sm:inline">Sortieren</span>
        <span className="font-medium">{SORTIER_LABELS[wert]}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ease-out ${offen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {offen && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-900/[0.07] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.3)]"
        >
          {(Object.entries(SORTIER_LABELS) as [Sortierung, string][]).map(([k, label]) => (
            <li key={k}>
              <button
                type="button"
                role="option"
                aria-selected={k === wert}
                onClick={() => { onWahl(k); setOffen(false); }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors duration-200 ${
                  k === wert ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {label}
                {k === wert && <Check className="h-3.5 w-3.5 text-brand" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
