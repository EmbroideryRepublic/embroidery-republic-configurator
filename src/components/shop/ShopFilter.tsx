'use client';

/**
 * Rahmen der Shop-Ansicht.
 *
 * ── Sichtbare Hierarchie in drei Bändern ──────────────────────────────
 *   1. Kategorie-Navigation   – wohin will die Kundin?
 *   2. Filterleiste           – wie grenzt sie ein?
 *   3. Ergebniszeile          – was ist dabei herausgekommen?
 *   …danach erst die Ware.
 *
 * Band 1 und 2 bleiben beim Scrollen oben stehen, damit sich jederzeit
 * filtern lässt. Band 3 gehört zum Ergebnis und scrollt mit – stünde es
 * ebenfalls fest, wäre der angeheftete Bereich halb so hoch wie das Fenster.
 *
 * Die Trefferliste kommt als `children` vom Server; diese Komponente hält
 * allein den Zustand „Panel offen". Alles Übrige steht in der Adresse.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { FilterKriterien } from '@/lib/catalog/kriterien';
import type { Facetten, Merkmale, Spannen } from '@/lib/catalog/filter';
import { KategorieReiter } from './KategorieReiter';
import { FilterMenues } from './FilterMenues';
import { FilterSeitenleiste } from './FilterSeitenleiste';
import { Ergebniskopf } from './Ergebniskopf';
import { FilterPanel } from './FilterPanel';

export function ShopFilter({
  kriterien, facetten, spannen, bezeichnungen, gesamt, merkmale, children,
}: {
  kriterien: FilterKriterien;
  facetten: Facetten;
  spannen: Spannen;
  bezeichnungen: Record<string, string>;
  gesamt: number;
  merkmale: Merkmale[];
  children: ReactNode;
}) {
  const [panelOffen, setPanelOffen] = useState(false);

  return (
    <>
      {/* ══ Band 1 + 2: angeheftet ═══════════════════════════════════ */}
      <div className="sticky top-0 z-40 -mx-4 border-b border-gray-900/[0.06] bg-brand-light/80 px-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        {/* Band 1 – Shop-Navigation. Volle Breite: neun große Reiter und
            sieben Filterknöpfe passen nicht nebeneinander, die Reiter würden
            abgeschnitten. */}
        <KategorieReiter kriterien={kriterien} werte={facetten.kategorie} />

        {/* Band 2 – die eigentlichen Filter, durch eine feine Linie getrennt. */}
        <div className="border-t border-gray-900/[0.06] py-4">
          <FilterMenues
            kriterien={kriterien} facetten={facetten} spannen={spannen}
            bezeichnungen={bezeichnungen} onPanelOeffnen={() => setPanelOffen(true)}
          />
        </div>
      </div>

      {/* ══ Seitenleiste + Ergebnis ══════════════════════════════════ */}
      <div className="flex gap-14 pt-10">
        <FilterSeitenleiste
          kriterien={kriterien} facetten={facetten} spannen={spannen}
          bezeichnungen={bezeichnungen}
        />

        <div className="min-w-0 flex-1">
          {/* Band 3 */}
          <Ergebniskopf kriterien={kriterien} bezeichnungen={bezeichnungen} gesamt={gesamt} />
          <div className="mt-10">{children}</div>
        </div>
      </div>

      <FilterPanel
        offen={panelOffen} onSchliessen={() => setPanelOffen(false)}
        kriterien={kriterien} facetten={facetten} spannen={spannen}
        bezeichnungen={bezeichnungen} merkmale={merkmale}
      />
    </>
  );
}
