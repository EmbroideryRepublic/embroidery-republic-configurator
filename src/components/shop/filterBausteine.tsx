'use client';

/**
 * Gemeinsame Bausteine der Filterung: Beschriftungen, Werteliste, Chip.
 *
 * Liegt bewusst getrennt von den einzelnen Leisten, damit Kopfleiste,
 * Seitenleiste und Mobil-Panel dieselben Bausteine benutzen, ohne einander
 * zu importieren (das ergäbe sonst gegenseitige Abhängigkeiten).
 */
import { Check, X } from 'lucide-react';
import { QUALITY_TIER_LABELS } from '@/config/qualityTiers';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import {
  FARBGRUPPE_HEX, FARBGRUPPE_LABELS, GESCHLECHT_LABELS, MATERIAL_LABELS, PASSFORM_LABELS,
} from '@/config/products/facetten';
import { MENGEN_DIMENSIONEN, type FilterKriterien, type MengenDimension } from '@/lib/catalog/kriterien';

export const DIMENSION_LABELS: Record<MengenDimension, string> = {
  kategorie: 'Kategorie', marke: 'Marke', qualitaet: 'Qualität', material: 'Material',
  passform: 'Passform', groesse: 'Größe', farbe: 'Farbe', geschlecht: 'Geschlecht',
};

/** Ausgeschriebene Mehrzahl – deutsche Plurale folgen keiner Anhängeregel
 *  („Materialien", nicht „Materialn"). */
export const DIMENSION_PLURAL: Record<MengenDimension, string> = {
  kategorie: 'Kategorien', marke: 'Marken', qualitaet: 'Qualitäten', material: 'Materialien',
  passform: 'Passformen', groesse: 'Größen', farbe: 'Farben', geschlecht: 'Geschlechter',
};

export function beschrifteWert(
  dim: MengenDimension,
  wert: string,
  bezeichnungen: Record<string, string>
): string {
  switch (dim) {
    case 'kategorie': return PRODUCT_TYPE_LABELS[wert as keyof typeof PRODUCT_TYPE_LABELS] ?? wert;
    case 'qualitaet': return QUALITY_TIER_LABELS[wert as keyof typeof QUALITY_TIER_LABELS] ?? wert;
    case 'material': return MATERIAL_LABELS[wert as keyof typeof MATERIAL_LABELS] ?? wert;
    case 'passform': return PASSFORM_LABELS[wert as keyof typeof PASSFORM_LABELS] ?? wert;
    case 'geschlecht': return GESCHLECHT_LABELS[wert as keyof typeof GESCHLECHT_LABELS] ?? wert;
    case 'farbe': return FARBGRUPPE_LABELS[wert as keyof typeof FARBGRUPPE_LABELS] ?? wert;
    default: return bezeichnungen[wert] ?? wert;
  }
}

export function WerteListe({
  dim, werte, gewaehlt, bezeichnungen, onToggle,
}: {
  dim: MengenDimension;
  werte: { wert: string; anzahl: number }[];
  gewaehlt: string[];
  bezeichnungen: Record<string, string>;
  onToggle: (wert: string) => void;
}) {
  if (werte.length === 0) return <p className="px-3 py-4 text-sm text-brand/50">Keine Werte vorhanden.</p>;

  return (
    <ul className="max-h-80 space-y-0.5 overflow-y-auto">
      {werte.map(({ wert, anzahl }) => {
        const an = gewaehlt.includes(wert);
        // Werte ohne Treffer bleiben stehen (die Leiste soll nicht springen),
        // werden aber ausgegraut und sind nicht wählbar.
        const leer = anzahl === 0 && !an;
        return (
          <li key={wert}>
            <label className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors duration-200 ${
              leer ? 'cursor-not-allowed text-brand/30' : 'cursor-pointer text-brand/60 hover:bg-cream/60 hover:text-brand'
            }`}>
              <Kaestchen an={an} leer={leer} onToggle={() => onToggle(wert)} />
              {dim === 'farbe' && (
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                  style={{ backgroundColor: FARBGRUPPE_HEX[wert as keyof typeof FARBGRUPPE_HEX] }}
                  aria-hidden
                />
              )}
              <span className={`flex-1 ${an ? 'font-medium text-brand' : ''}`}>
                {beschrifteWert(dim, wert, bezeichnungen)}
              </span>
              <span className="text-[11px] tabular-nums text-brand/30">{anzahl}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Eigenes Kontrollkästchen – überall gleich (Menüs, Seitenleiste, Panel).
 *
 * Das Standard-Formularelement bringt die Optik des Betriebssystems mit und
 * sieht auf jedem Rechner anders aus; in einem Modeshop wirkt das wie ein
 * Antragsformular. Das echte `input` bleibt für Tastatur und Vorlesehilfen
 * erhalten, nur unsichtbar.
 */
export function Kaestchen({
  an, leer, onToggle,
}: { an: boolean; leer: boolean; onToggle: () => void }) {
  return (
    // Das echte Eingabefeld liegt OBEN und unsichtbar über dem gezeichneten
    // Kästchen – so trifft jeder Klick es direkt. Läge es darunter, finge das
    // Kästchen die Klicks ab und nur der Umweg über die Beschriftung wirkte.
    <span className="relative flex h-[17px] w-[17px] shrink-0 items-center justify-center">
      <input
        type="checkbox" checked={an} disabled={leer} onChange={onToggle}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className={`pointer-events-none flex h-full w-full items-center justify-center rounded-[5px] border transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 ${
          an ? 'border-brand bg-brand text-white' : 'border-brand/20 bg-white group-hover:border-brand/30'
        }`}
      >
        {an && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </span>
  );
}

export function Chip({
  text, farbe, ariaLabel, onEntfernen,
}: { text: string; farbe?: string; ariaLabel: string; onEntfernen: () => void }) {
  return (
    <button
      type="button" onClick={onEntfernen} aria-label={ariaLabel}
      className="inline-flex items-center gap-2 rounded-full border border-brand/[0.09] bg-white/70 py-1.5 pl-3.5 pr-2.5 text-[12px] text-brand/70 transition-all duration-300 ease-out hover:border-brand/20 hover:bg-white hover:text-brand"
    >
      {farbe && <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: farbe }} aria-hidden />}
      {text}
      <X className="h-3.5 w-3.5 text-brand/40" aria-hidden />
    </button>
  );
}

export function anzahlAktiv(k: FilterKriterien): number {
  let n = MENGEN_DIMENSIONEN.reduce((s, d) => s + (k[d] as string[]).length, 0);
  if (k.preisVon !== undefined || k.preisBis !== undefined) n++;
  if (k.gewichtVon !== undefined || k.gewichtBis !== undefined) n++;
  if (k.auchNichtLieferbare) n++;
  return n;
}
