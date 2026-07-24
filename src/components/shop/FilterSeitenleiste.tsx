'use client';

/**
 * Dauerhafte Seitenleiste (Desktop).
 *
 * ── Ruhig statt formularartig ─────────────────────────────────────────
 * Keine Rahmen, keine Kästen: Die Gliederung entsteht durch Abstand und
 * Typografie. Überschriften stehen klein und gesperrt, Werte in normaler
 * Laufweite, Zähler zurückgenommen. So liest sich die Spalte wie ein
 * Inhaltsverzeichnis und nicht wie ein auszufüllendes Formular.
 *
 * Sie ergänzt die Menüs oben, sie ersetzt sie nicht – beide schreiben
 * denselben Adressparameter, es gibt also keinen zweiten Zustand.
 * Die Kategorie fehlt bewusst: Sie gehört in die Reiter-Navigation.
 */
import { useState } from 'react';
import { FARBGRUPPE_HEX } from '@/config/products/facetten';
import { schalteWert, type FilterKriterien, type MengenDimension } from '@/lib/catalog/kriterien';
import type { Facetten, Spannen } from '@/lib/catalog/filter';
import { DIMENSION_LABELS, Kaestchen, beschrifteWert } from './filterBausteine';
import { Spannenregler } from './Spannenregler';
import { useFilterNavigation } from './filterNavigation';

/** So viele Einträge je Liste, bevor „Mehr anzeigen" erscheint. */
const ANFANGS = 5;

const LISTEN: MengenDimension[] = ['marke', 'farbe', 'groesse'];

export function FilterSeitenleiste({
  kriterien, facetten, spannen, bezeichnungen,
}: {
  kriterien: FilterKriterien;
  facetten: Facetten;
  spannen: Spannen;
  bezeichnungen: Record<string, string>;
}) {
  const { anwenden } = useFilterNavigation();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-40 space-y-9">
        <Abschnitt titel="Preis">
          <Spannenregler
            von={kriterien.preisVon} bis={kriterien.preisBis}
            min={spannen.preisMin} max={spannen.preisMax} einheit="€"
            onAendern={(v, b) => anwenden({ ...kriterien, preisVon: v, preisBis: b, seite: 1 })}
          />
        </Abschnitt>

        <Abschnitt titel="Stoffgewicht">
          <Spannenregler
            von={kriterien.gewichtVon} bis={kriterien.gewichtBis}
            min={spannen.gewichtMin} max={spannen.gewichtMax} einheit="g/m²"
            onAendern={(v, b) => anwenden({ ...kriterien, gewichtVon: v, gewichtBis: b, seite: 1 })}
          />
        </Abschnitt>

        {LISTEN.map((dim) => (
          <Werteabschnitt
            key={dim}
            dim={dim}
            werte={facetten[dim]}
            gewaehlt={kriterien[dim] as string[]}
            bezeichnungen={bezeichnungen}
            onToggle={(w) => anwenden(schalteWert(kriterien, dim, w))}
          />
        ))}
      </div>
    </aside>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      {/* h2, nicht h3: Auf der Shop-Seite folgt direkt die h1 der Seite –
          eine h3 dazwischen wäre ein Ebenensprung und bricht die
          Dokumentgliederung für Vorlesehilfen. */}
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
        {titel}
      </h2>
      {children}
    </section>
  );
}

function Werteabschnitt({
  dim, werte, gewaehlt, bezeichnungen, onToggle,
}: {
  dim: MengenDimension;
  werte: { wert: string; anzahl: number }[];
  gewaehlt: string[];
  bezeichnungen: Record<string, string>;
  onToggle: (wert: string) => void;
}) {
  const [alle, setAlle] = useState(false);
  const sichtbar = alle ? werte : werte.slice(0, ANFANGS);

  return (
    <Abschnitt titel={DIMENSION_LABELS[dim]}>
      <ul className="space-y-2.5">
        {sichtbar.map(({ wert, anzahl }) => {
          const an = gewaehlt.includes(wert);
          const leer = anzahl === 0 && !an;
          return (
            <li key={wert}>
              <label
                className={`group flex items-center gap-3 text-[13px] transition-colors duration-200 ${
                  leer ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer text-gray-600 hover:text-gray-900'
                }`}
              >
                <Kaestchen an={an} leer={leer} onToggle={() => onToggle(wert)} />
                {dim === 'farbe' && (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                    style={{ backgroundColor: FARBGRUPPE_HEX[wert as keyof typeof FARBGRUPPE_HEX] }}
                    aria-hidden
                  />
                )}
                <span className={`flex-1 truncate ${an ? 'font-medium text-gray-900' : ''}`}>
                  {beschrifteWert(dim, wert, bezeichnungen)}
                </span>
                <span className="text-[11px] tabular-nums text-gray-300">{anzahl}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {werte.length > ANFANGS && (
        <button
          type="button"
          onClick={() => setAlle(!alle)}
          className="mt-4 text-[12px] text-gray-400 underline-offset-4 transition-colors duration-200 hover:text-brand hover:underline"
        >
          {alle ? 'Weniger anzeigen' : `+ ${werte.length - ANFANGS} weitere`}
        </button>
      )}
    </Abschnitt>
  );
}
