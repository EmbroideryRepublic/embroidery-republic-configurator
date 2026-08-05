'use client';

/**
 * Hauptnavigation nach Produktart.
 *
 * Bewusst KEINE Filterchips: Die Produktart ist die Frage, mit der Kundschaft
 * ankommt („ich brauche Polos"). Sie steht deshalb als große, ruhige
 * Reiterreihe oben und trägt keine Trefferzähler – Zähler ließen sie wie
 * einen weiteren technischen Filter wirken. Aus demselben Grund taucht die
 * Kategorie in den Filtermenüs rechts NICHT noch einmal auf.
 *
 * Bewusst OHNE Symbole: Es gibt kein Symbol, das ein Polo von einem T-Shirt
 * unterscheidet, ohne albern zu wirken – ein für alle Arten gleiches Symbol
 * trägt keine Information und erzeugt nur Unruhe. Große Shops lösen die
 * Kategoriezeile deshalb rein typografisch.
 *
 * Gewählt wird eine Art nach der anderen (wie in einer Navigation); ein
 * erneuter Klick auf den aktiven Reiter führt zurück zu „Alle Produkte".
 */
import { produktTypLabel, PRODUCT_TYPE_ORDER } from '@/config/products/types';
import type { ProductType } from '@/types';
import type { FilterKriterien } from '@/lib/catalog/kriterien';
import type { FacettenWert } from '@/lib/catalog/filter';
import { useFilterNavigation } from './filterNavigation';

/** Fachliche Reihenfolge: häufigste Anfrage zuerst – zentral in
 *  PRODUCT_TYPE_ORDER (config/products/types). */
const REIHENFOLGE = PRODUCT_TYPE_ORDER;

export function KategorieReiter({
  kriterien, werte,
}: { kriterien: FilterKriterien; werte: FacettenWert[] }) {
  const { anwenden } = useFilterNavigation();
  // Nur Arten anbieten, die es im Bestand gibt – die Liste kommt aus den
  // Facetten, nicht aus einer festen Aufzählung.
  const vorhanden = new Set(werte.map((w) => w.wert));
  const arten = REIHENFOLGE.filter((a) => vorhanden.has(a));
  const alle = kriterien.kategorie.length === 0;

  const waehle = (art?: ProductType) =>
    anwenden({ ...kriterien, kategorie: art ? [art] : [], seite: 1 });

  return (
    <nav
      aria-label="Produktarten"
      className="-mx-2 flex items-stretch gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Reiter aktiv={alle} onClick={() => waehle()} label="Alle Produkte" />
      {arten.map((art) => {
        const aktiv = kriterien.kategorie.includes(art);
        return (
          <Reiter
            key={art}
            aktiv={aktiv}
            onClick={() => waehle(aktiv ? undefined : art)}
            label={produktTypLabel(art)}
          />
        );
      })}
    </nav>
  );
}

function Reiter({ aktiv, onClick, label }: { aktiv: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={aktiv ? 'page' : undefined}
      className={`group relative shrink-0 whitespace-nowrap px-5 pb-4 pt-5 transition-colors duration-300 ease-out xl:px-7 ${
        aktiv ? 'text-brand' : 'text-brand/50 hover:text-brand'
      }`}
    >
      <span className={`text-[15px] tracking-tight transition-all duration-300 ${aktiv ? 'font-medium' : 'font-normal'}`}>
        {label}
      </span>
      {/* Aktiver Zustand als Unterstrich – ruhiger als ein gefüllter Knopf
          und die vertraute Formensprache einer Shop-Navigation. */}
      <span
        className={`absolute inset-x-3 bottom-0 h-[2px] origin-center rounded-full bg-brand transition-transform duration-300 ease-out ${
          aktiv ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 group-hover:bg-brand/20'
        }`}
        aria-hidden
      />
    </button>
  );
}
