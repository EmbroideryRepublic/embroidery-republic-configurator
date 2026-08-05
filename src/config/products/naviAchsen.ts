/**
 * ═══════════════════════════════════════════════════════════════════════
 * NAVIGATIONSACHSEN-REGISTRY (NAVI_ACHSEN)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Produktbrowser gliedert den Katalog in Hauptgruppen (oberste Ebene des
 * Baums). WELCHE Gruppen das sind und WIE ein Produkt ihnen zugeordnet wird,
 * steht ausschließlich HIER – nicht mehr fest verdrahtet als Herren/Damen/Unisex.
 *
 * ── Warum eine Registry statt einer festen Achse ──────────────────────
 * Kleidung gliedert man nach Geschlecht; eine Tasche nach Einsatzgebiet, ein
 * Werbeartikel nach Anlass, Zubehör nach Kategorie, Saisonware nach Saison …
 * Jede Produktart nennt im PRODUCT_TYPES-Register ihre `naviAchse`; hier liegt
 * die zugehörige Strategie: die Gruppen der Achse und die Zuordnung eines
 * Produkts zu (mehreren) Gruppen. So entsteht eine neue Achse rein additiv –
 * ohne Eingriff in `baueBaum` oder die Oberfläche. KEINE Achse ist privilegiert;
 * „Geschlecht" ist nur die erste registrierte, nicht die eingebaute.
 *
 * ── Überschneidung ist erlaubt ────────────────────────────────────────
 * `gruppenVon` darf mehrere Gruppen liefern (Unisexware zählt in Herren, Damen
 * UND Unisex). Die Summe der Gruppenzähler ist dann größer als der Bestand –
 * das ist gewollt und eine Eigenschaft der jeweiligen Achse, keine der Kernlogik.
 *
 * ── Absicherung ───────────────────────────────────────────────────────
 * Wächter-Tests (config/products/__tests__/naviAchsen.test.ts) erzwingen: jede
 * von einer Produktart genannte Achse ist hier registriert, und JEDES Produkt
 * fällt in mindestens eine Navigationsgruppe (sonst verschwände es still aus dem
 * Browser – der frühere Bruch H1). Siehe ADR 0002 §1 / docs/haertung-analyse.md.
 */
import type { ProductConfig } from './types';
import { PRODUCT_TYPES, PRODUCT_TYPE_ORDER } from './productTypes';
import { geschlechterVon } from './facetten';

/** Eine Hauptgruppe einer Achse (oberste Baumebene). */
export interface NaviGruppe {
  id: string;
  label: string;
}

export interface NaviAchsenDef {
  /** Achsen-ID, referenziert von ProductTypeDef.naviAchse. */
  id: string;
  /** Anzeigename der Achse (für spätere Achsen-Umschaltung/Gruppierung). */
  label: string;
  /** Geordnete Hauptgruppen dieser Achse. */
  gruppen: readonly NaviGruppe[];
  /**
   * IDs der Gruppen, in denen dieses Produkt erscheint. Mehrere = Überschneidung.
   * Leer ⇒ das Produkt fällt auf dieser Achse in KEINE Gruppe (ein Wächter-Test
   * verhindert das für den Bestand).
   */
  gruppenVon(p: ProductConfig): string[];
}

/**
 * Alle bekannten Navigationsachsen. Offen erweiterbar – eine neue Achse ist ein
 * Eintrag hier plus ein `naviAchse`-Verweis in PRODUCT_TYPES.
 */
export const NAVI_ACHSEN: Record<string, NaviAchsenDef> = {
  geschlecht: {
    id: 'geschlecht',
    label: 'Geschlecht',
    gruppen: [
      { id: 'herren', label: 'Herren' },
      { id: 'damen', label: 'Damen' },
      { id: 'unisex', label: 'Unisex' },
    ],
    gruppenVon(p) {
      // Unisexware erscheint ZUSÄTZLICH unter Herren und Damen, damit kein
      // Artikel hinter der Geschlechts-Klassifizierung verschwindet; reine
      // Herren-/Damenware bleibt bei ihrer Gruppe.
      const eigen = geschlechterVon(p);
      const istUnisex = eigen.includes('unisex');
      const gruppen: string[] = [];
      if (istUnisex || eigen.includes('herren')) gruppen.push('herren');
      if (istUnisex || eigen.includes('damen')) gruppen.push('damen');
      if (istUnisex) gruppen.push('unisex');
      return gruppen;
    },
  },
};

/** Die Navigationsachse einer Produktart (aus dem Register), oder undefined. */
export function produktAchsenId(p: ProductConfig): string | undefined {
  return PRODUCT_TYPES[p.productType]?.naviAchse;
}

/**
 * Alle Gruppen, in denen ein Produkt im Browser erscheint (über die Achse seiner
 * Produktart). Leere Liste ⇒ das Produkt hätte keinen Platz im Baum – der
 * Wächter-Test macht das zum Testfehler statt zum stillen Datenverlust.
 */
export function naviGruppenVon(p: ProductConfig): string[] {
  const achseId = produktAchsenId(p);
  const def = achseId ? NAVI_ACHSEN[achseId] : undefined;
  return def?.gruppenVon(p) ?? [];
}

/**
 * Die im Katalog aktiven Achsen, in der Reihenfolge des ersten Auftretens ihrer
 * Produktarten (PRODUCT_TYPE_ORDER). Einmal je Prozess aus dem Register
 * abgeleitet – unabhängig von Filtern, damit die Hauptgruppen beim Suchen nicht
 * springen. Eine von einer Art genannte, aber nicht registrierte Achse wird hier
 * übersprungen; der Wächter-Test verhindert diesen Fall.
 */
export const AKTIVE_ACHSEN: readonly NaviAchsenDef[] = (() => {
  const gesehen = new Set<string>();
  const result: NaviAchsenDef[] = [];
  for (const t of PRODUCT_TYPE_ORDER) {
    const achseId = PRODUCT_TYPES[t]?.naviAchse;
    if (!achseId || gesehen.has(achseId)) continue;
    gesehen.add(achseId);
    const def = NAVI_ACHSEN[achseId];
    if (def) result.push(def);
  }
  return result;
})();
