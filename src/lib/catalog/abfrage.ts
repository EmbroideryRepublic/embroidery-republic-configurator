/**
 * ═══════════════════════════════════════════════════════════════════════
 * PRODUKTABFRAGE – ein Port, austauschbare Umsetzung
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die Oberfläche fragt „welche Produkte passen?" und bekommt Treffer,
 * Gesamtzahl, Facetten und Spannen. WIE gesucht wird, geht sie nichts an.
 *
 * Heute: im Speicher über den Code-Katalog (43 Produkte – jede Messung wäre
 * Zierde). Die Merkmale werden EINMAL beim Laden des Moduls berechnet, nicht
 * bei jeder Anfrage.
 *
 * Später (ab etwa 2.000 Produkten oder wenn `finde` im Mittel über 50 ms
 * liegt): eine zweite Umsetzung gegen die Datenbank mit Indizes auf den
 * Facettenspalten. Die Oberfläche bleibt unverändert – das ist der Zweck
 * dieses Ports.
 */
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import {
  berechneFacetten, merkmaleVon, passt, sortiere, spannen,
  type Beliebtheit, type Facetten, type Merkmale, type Spannen,
} from './filter';
import { PRO_SEITE, slug, type FilterKriterien } from './kriterien';

export interface AbfrageErgebnis {
  /** Treffer der aktuellen Seite. */
  produkte: ProductConfig[];
  /** Gesamttreffer über alle Seiten – die Zahl in der Filterleiste. */
  gesamt: number;
  seite: number;
  seiten: number;
  facetten: Facetten;
  spannen: Spannen;
  /** Slug → Anzeigename, für Chips und Filterlisten (Marken, Größen). */
  bezeichnungen: Record<string, string>;
}

export interface ProduktAbfrage {
  finde(k: FilterKriterien, beliebtheit?: Beliebtheit): AbfrageErgebnis;
}

// ── Vorberechnung (einmal je Prozess) ──────────────────────────────────

interface Eintrag {
  produkt: ProductConfig;
  merkmale: Merkmale;
}

const EINTRAEGE: Eintrag[] = PRODUCTS.map((produkt) => ({ produkt, merkmale: merkmaleVon(produkt) }));
const ALLE_MERKMALE: Merkmale[] = EINTRAEGE.map((e) => e.merkmale);
const SPANNEN = spannen(ALLE_MERKMALE);

/** Marken- und Größennamen zu ihren Slugs – die Oberfläche zeigt Klartext. */
const BEZEICHNUNGEN: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const { produkt } of EINTRAEGE) {
    map[slug(produkt.brand)] = produkt.brand;
    for (const g of produkt.sizes) map[g] = g;
  }
  return map;
})();

export const speicherAbfrage: ProduktAbfrage = {
  finde(k, beliebtheit = {}) {
    const treffer = EINTRAEGE.filter((e) => passt(e.merkmale, k)).map((e) => e.produkt);
    const sortiert = sortiere(treffer, k.sortierung, beliebtheit);

    const seiten = Math.max(1, Math.ceil(sortiert.length / PRO_SEITE));
    const seite = Math.min(Math.max(1, k.seite), seiten);
    const von = (seite - 1) * PRO_SEITE;

    return {
      produkte: sortiert.slice(von, von + PRO_SEITE),
      gesamt: sortiert.length,
      seite,
      seiten,
      facetten: berechneFacetten(ALLE_MERKMALE, k),
      spannen: SPANNEN,
      bezeichnungen: BEZEICHNUNGEN,
    };
  },
};

/** Aktuell genutzte Umsetzung. Der Tausch gegen eine DB-Variante passiert hier. */
export function produktAbfrage(): ProduktAbfrage {
  return speicherAbfrage;
}
