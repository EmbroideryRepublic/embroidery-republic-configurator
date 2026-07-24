'use client';

/**
 * Filter-Panel – auf dem Mobilgerät von rechts einfahrend, auf dem Desktop
 * als „Mehr Filter".
 *
 * ── Zeilenliste statt aufgeklappter Listen ────────────────────────────
 * Die erste Ebene zeigt je Dimension nur den aktuellen Stand („T-Shirts",
 * „Alle Größen"). Erst ein Tippen öffnet die Werte. Acht gleichzeitig
 * aufgeklappte Listen wären auf einem Telefon nicht bedienbar.
 *
 * ── Sammeln, dann übernehmen ──────────────────────────────────────────
 * Änderungen laufen in einen Entwurf und werden erst mit dem Abschlussknopf
 * übernommen – auf Mobilfunk wäre eine Serverrunde je Häkchen ärgerlich.
 * Der Knopf trägt die Trefferzahl des ENTWURFS, damit vor dem Übernehmen
 * sichtbar ist, was herauskommt.
 */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  MENGEN_DIMENSIONEN, hatAktiveFilter, schalteWert, setzeZurueck,
  type FilterKriterien, type MengenDimension,
} from '@/lib/catalog/kriterien';
import { passt, type Facetten, type Merkmale, type Spannen } from '@/lib/catalog/filter';
import { DIMENSION_LABELS, DIMENSION_PLURAL, WerteListe, beschrifteWert } from './filterBausteine';
import { useFilterNavigation } from './filterNavigation';

interface Props {
  offen: boolean;
  onSchliessen: () => void;
  kriterien: FilterKriterien;
  facetten: Facetten;
  spannen: Spannen;
  bezeichnungen: Record<string, string>;
  /** Merkmale aller Produkte – für die Vorschau der Trefferzahl im Entwurf. */
  merkmale: Merkmale[];
}

export function FilterPanel({
  offen, onSchliessen, kriterien, facetten, spannen, bezeichnungen, merkmale,
}: Props) {
  const { anwenden } = useFilterNavigation();
  const [entwurf, setEntwurf] = useState(kriterien);
  const [ebene, setEbene] = useState<MengenDimension | null>(null);

  // Beim Öffnen den aktuellen Stand übernehmen.
  useEffect(() => { if (offen) { setEntwurf(kriterien); setEbene(null); } }, [offen, kriterien]);

  if (!offen) return null;

  const vorschau = merkmale.filter((m) => passt(m, entwurf)).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Filter">
      <button type="button" className="flex-1" aria-label="Schließen" onClick={onSchliessen} />

      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Kopf */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          {ebene ? (
            <button type="button" onClick={() => setEbene(null)} className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {DIMENSION_LABELS[ebene]}
            </button>
          ) : (
            <h2 className="text-base font-semibold text-brand">Filter</h2>
          )}
          <div className="flex items-center gap-2">
            {hatAktiveFilter(entwurf) && (
              <button
                type="button"
                onClick={() => setEntwurf(setzeZurueck(entwurf))}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600"
              >
                Alle Filter löschen
              </button>
            )}
            <button type="button" onClick={onSchliessen} aria-label="Schließen">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Rumpf */}
        <div className="flex-1 overflow-y-auto">
          {ebene === null ? (
            <ul>
              {MENGEN_DIMENSIONEN.map((dim) => {
                const gewaehlt = entwurf[dim] as string[];
                return (
                  <li key={dim}>
                    <button
                      type="button"
                      onClick={() => setEbene(dim)}
                      className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-left"
                    >
                      <span className="text-sm font-medium text-gray-800">{DIMENSION_LABELS[dim]}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="max-w-[10rem] truncate text-sm text-gray-500">
                          {gewaehlt.length === 0
                            ? `Alle ${DIMENSION_PLURAL[dim]}`
                            : gewaehlt.map((w) => beschrifteWert(dim, w, bezeichnungen)).join(', ')}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      </span>
                    </button>
                  </li>
                );
              })}

              <li className="border-b border-gray-100 px-4 py-3.5">
                <p className="mb-2 text-sm font-medium text-gray-800">Preis (€)</p>
                <ZweiFelder
                  von={entwurf.preisVon} bis={entwurf.preisBis} min={spannen.preisMin} max={spannen.preisMax}
                  onAendern={(von, bis) => setEntwurf({ ...entwurf, preisVon: von, preisBis: bis, seite: 1 })}
                />
              </li>
              <li className="border-b border-gray-100 px-4 py-3.5">
                <p className="mb-2 text-sm font-medium text-gray-800">Stoffgewicht (g/m²)</p>
                <ZweiFelder
                  von={entwurf.gewichtVon} bis={entwurf.gewichtBis} min={spannen.gewichtMin} max={spannen.gewichtMax}
                  onAendern={(von, bis) => setEntwurf({ ...entwurf, gewichtVon: von, gewichtBis: bis, seite: 1 })}
                />
              </li>
              <li className="px-4 py-3.5">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox" checked={entwurf.auchNichtLieferbare}
                    onChange={(e) => setEntwurf({ ...entwurf, auchNichtLieferbare: e.target.checked, seite: 1 })}
                    className="h-4 w-4 rounded-md border-gray-300"
                  />
                  Auch nicht lieferbare Produkte anzeigen
                </label>
              </li>
            </ul>
          ) : (
            <div className="p-2">
              <WerteListe
                dim={ebene} werte={facetten[ebene]} gewaehlt={entwurf[ebene] as string[]}
                bezeichnungen={bezeichnungen}
                onToggle={(w) => setEntwurf(schalteWert(entwurf, ebene, w))}
              />
            </div>
          )}
        </div>

        {/* Fuß – eigenständig, NICHT im Scrollbereich (sonst verdeckt er Einträge). */}
        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={() => { anwenden(entwurf); onSchliessen(); }}
            className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-brand transition hover:brightness-95"
          >
            {vorschau} {vorschau === 1 ? 'Produkt' : 'Produkte'} anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}

function ZweiFelder({
  von, bis, min, max, onAendern,
}: { von?: number; bis?: number; min: number; max: number; onAendern: (von?: number, bis?: number) => void }) {
  const lies = (roh: string) => (roh === '' ? undefined : Number(roh));
  return (
    <div className="flex items-center gap-2">
      <input
        type="number" inputMode="numeric" min={min} max={max} placeholder={String(min)}
        defaultValue={von ?? ''} onBlur={(e) => onAendern(lies(e.target.value), bis)}
        aria-label="von" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <span className="text-xs text-gray-400">bis</span>
      <input
        type="number" inputMode="numeric" min={min} max={max} placeholder={String(max)}
        defaultValue={bis ?? ''} onBlur={(e) => onAendern(von, lies(e.target.value))}
        aria-label="bis" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
