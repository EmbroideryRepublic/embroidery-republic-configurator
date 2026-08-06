'use client';

/**
 * Die eigentlichen Filter – rechts neben der Kategorie-Navigation.
 *
 * Die Kategorie fehlt hier bewusst: Sie wird über die Reiter links gewählt.
 * Ein zweiter Weg zur selben Auswahl wäre verwirrend und würde die Reiter
 * entwerten.
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  schalteWert, type FilterKriterien, type MengenDimension,
} from '@/lib/catalog/kriterien';
import type { Facetten, Spannen } from '@/lib/catalog/filter';
import { DIMENSION_LABELS, WerteListe, anzahlAktiv } from './filterBausteine';
import { Spannenregler } from './Spannenregler';
import { useFilterNavigation } from './filterNavigation';

/**
 * Reihenfolge der Filtermenüs – vom Häufigsten zum Speziellsten.
 *
 * `geschlecht` und `veredelung` fehlten hier, obwohl die Filterlogik sie längst
 * kennt: Sie waren nur über die Adresszeile erreichbar. `kategorie` bleibt
 * bewusst draußen, die gehört in die Reiter-Navigation darüber.
 *
 * Menüs ohne Unterscheidungskraft blendet die Leiste selbst aus (siehe unten) –
 * ein Filter, bei dem jede Option alles durchlässt, hilft niemandem.
 */
const MENUES: MengenDimension[] = [
  'marke', 'geschlecht', 'farbe', 'groesse',
  'material', 'passform', 'qualitaet', 'veredelung',
];

type Offen = MengenDimension | 'preis' | null;

export function FilterMenues({
  kriterien, facetten, spannen, bezeichnungen, onPanelOeffnen,
}: {
  kriterien: FilterKriterien;
  facetten: Facetten;
  spannen: Spannen;
  bezeichnungen: Record<string, string>;
  onPanelOeffnen: () => void;
}) {
  const { anwenden } = useFilterNavigation();
  const [offen, setOffen] = useState<Offen>(null);
  const bereich = useRef<HTMLDivElement>(null);

  // Klick daneben oder Escape schließt – sonst bleibt das Menü beim
  // Weiterarbeiten offen stehen.
  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent) => {
      if (bereich.current && !bereich.current.contains(e.target as Node)) setOffen(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(null); };
    document.addEventListener('mousedown', zu);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', zu); document.removeEventListener('keydown', esc); };
  }, [offen]);

  const preisAktiv = kriterien.preisVon !== undefined || kriterien.preisBis !== undefined;

  return (
    <div ref={bereich} className="flex items-center gap-2">
      {/* Mobil: alles in einem Panel. */}
      <button
        type="button"
        onClick={onPanelOeffnen}
        className="inline-flex items-center gap-2 rounded-full border border-brand/[0.09] bg-white/70 px-4 py-2 text-[13px] font-medium text-brand/70 transition-all duration-300 hover:bg-white lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filter
        {anzahlAktiv(kriterien) > 0 && (
          <span className="rounded-full bg-brand px-1.5 text-xs text-white">{anzahlAktiv(kriterien)}</span>
        )}
      </button>

      {MENUES.map((dim) => {
        const anzahl = (kriterien[dim] as string[]).length;
        // Ein Menü, dessen Werte ALLE Produkte treffen, filtert nichts – es
        // täuscht nur eine Unterscheidung vor. Heute betrifft das die
        // Veredelung: Jedes Produkt im Sortiment lässt Stickerei UND DTF zu.
        // Sobald ein Artikel ein Verfahren ausschließt (`supportedMethods`),
        // erscheint das Menü von selbst.
        const werte = facetten[dim] ?? [];
        const gesamt = Math.max(...werte.map((w) => w.anzahl), 0);
        const unterscheidet = werte.length > 1 && werte.some((w) => w.anzahl < gesamt);
        if (!unterscheidet && anzahl === 0) return null;
        return (
          <div key={dim} className="relative hidden lg:block">
            <Ausloeser
              label={DIMENSION_LABELS[dim]}
              anzahl={anzahl}
              geoeffnet={offen === dim}
              onClick={() => setOffen(offen === dim ? null : dim)}
            />
            {offen === dim && (
              <Menue label={DIMENSION_LABELS[dim]}>
                <WerteListe
                  dim={dim} werte={facetten[dim]} gewaehlt={kriterien[dim] as string[]}
                  bezeichnungen={bezeichnungen}
                  onToggle={(w) => anwenden(schalteWert(kriterien, dim, w))}
                />
              </Menue>
            )}
          </div>
        );
      })}

      {/* Preis als eigenes Menü – der meistgenutzte Filter gehört nach oben. */}
      <div className="relative hidden lg:block">
        <Ausloeser
          label="Preis"
          anzahl={preisAktiv ? 1 : 0}
          geoeffnet={offen === 'preis'}
          onClick={() => setOffen(offen === 'preis' ? null : 'preis')}
        />
        {offen === 'preis' && (
          <Menue label="Preis">
            <div className="px-2 py-1">
              <Spannenregler
                von={kriterien.preisVon} bis={kriterien.preisBis}
                min={spannen.preisMin} max={spannen.preisMax} einheit="€"
                onAendern={(v, b) => anwenden({ ...kriterien, preisVon: v, preisBis: b, seite: 1 })}
              />
            </div>
          </Menue>
        )}
      </div>

      <button
        type="button"
        onClick={onPanelOeffnen}
        className="hidden items-center gap-2 rounded-full border border-brand/[0.09] bg-white/70 px-4 py-2 text-[13px] text-brand/60 transition-all duration-300 ease-out hover:border-brand/20 hover:bg-white hover:text-brand lg:inline-flex"
      >
        <SlidersHorizontal className="h-4 w-4 text-brand/40" aria-hidden />
        Mehr Filter
      </button>
    </div>
  );
}

function Ausloeser({
  label, anzahl, geoeffnet, onClick,
}: { label: string; anzahl: number; geoeffnet: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={geoeffnet}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-all duration-300 ease-out ${
        anzahl > 0
          ? 'border-brand/30 bg-brand/[0.04] font-medium text-brand'
          : 'border-brand/[0.09] bg-white/70 text-brand/60 hover:border-brand/20 hover:bg-white hover:text-brand'
      }`}
    >
      {label}
      {anzahl > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] text-white">
          {anzahl}
        </span>
      )}
      <ChevronDown
        className={`h-3.5 w-3.5 text-brand/40 transition-transform duration-300 ease-out ${geoeffnet ? '' : 'rotate-180'}`}
        aria-hidden
      />
    </button>
  );
}

function Menue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="dialog" aria-label={label}
      className="absolute left-0 z-50 mt-3 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-brand/[0.07] bg-white p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.3)]"
    >
      {children}
    </div>
  );
}
