/**
 * ═══════════════════════════════════════════════════════════════════════
 * BESCHAFFUNG – wie wir die Textilien einkaufen
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Lieferantenversand hängt nicht am Produkt, sondern daran, WIE bestellt
 * wird. Dasselbe T-Shirt trägt in der Anfangsphase den vollen Versandanteil
 * und später, aus dem Lager verkauft, gar keinen.
 *
 * Deshalb steht das Beschaffungsmodell hier als eigener Parameter und nicht
 * als fester Zuschlag im Produktpreis. Der spätere Umstieg ist dann eine
 * geänderte Zeile, kein Umbau der Kalkulation.
 *
 * ── Festlegung des Betreibers, 2026-07-22 ─────────────────────────────
 * Anfangsphase: Es wird überwiegend erst nach Kundeneingang beim Großhändler
 * bestellt. Der Lieferantenversand fällt also je Kundenbestellung an und wird
 * berücksichtigt.
 *
 * Langfristig: Lagerhaltung oder Sammelbestellungen. Dann verteilt sich ein
 * Lieferantenversand über mehrere Kundenaufträge – oder entfällt, weil die
 * Ware bereits im Regal liegt.
 */

export type Beschaffungsmodell =
  /**
   * Je Kundenbestellung wird beim Großhändler bestellt. Der Versand trifft
   * genau diese eine Bestellung. **Aktueller Stand.**
   */
  | 'je_bestellung'
  /**
   * Mehrere Kundenaufträge werden zu einer Lieferantenbestellung
   * zusammengefasst. Der Versand teilt sich, und die Freigrenze wird
   * häufiger erreicht.
   */
  | 'sammelbestellung'
  /**
   * Die Ware liegt im Lager. Für die einzelne Kundenbestellung fällt kein
   * Lieferantenversand an – er steckt bereits im Einkaufspreis der
   * Lagerbestellung.
   */
  | 'lager';

export interface Beschaffungsart {
  modell: Beschaffungsmodell;
  /**
   * Wie viele Kundenaufträge sich eine Lieferantenbestellung teilen.
   *
   * Nur bei `sammelbestellung` von Bedeutung. Bei `je_bestellung` immer 1,
   * bei `lager` ohne Wirkung.
   */
  auftraegeJeLieferantenbestellung: number;
}

/**
 * Wie derzeit beschafft wird.
 *
 * **Diese eine Konstante umzustellen genügt**, um von der Anfangsphase auf
 * Sammelbestellung oder Lagerhaltung zu wechseln. Kein Produktpreis und
 * keine Kalkulationsformel ändert sich dadurch.
 */
export const BESCHAFFUNG: Beschaffungsart = {
  modell: 'je_bestellung',
  auftraegeJeLieferantenbestellung: 1,
};

/** Konditionen des Textil-Großhändlers. */
export const LIEFERANTENVERSAND = {
  /**
   * Was der Versand kostet, solange die Freigrenze nicht erreicht ist.
   *
   * ANGABE DES BETREIBERS vom 2026-07-21 („Lieferantenversand 4,90 €").
   * Auf der Produktseite selbst ist nur die Freigrenze ausgewiesen, nicht
   * der Betrag – die beiden Angaben stammen also aus verschiedenen Quellen.
   */
  kosten: 4.9,
  /**
   * Ab diesem Warenwert liefert der Großhändler kostenfrei.
   *
   * BELEGT: „Gratis Lieferung ab 150€ (DE)" auf den Produktseiten von
   * textil-grosshandel.eu, gesehen am 2026-07-22. Der Betreiber hatte am
   * 21.07. 75 € genannt – das dürfte den DTF-Dienstleister betreffen, der
   * eine eigene Schwelle hat (siehe dtfKosten.ts).
   */
  freiAbWarenwert: 150,
} as const;

/**
 * Lieferantenversand für eine Kundenbestellung mit diesem Warenwert.
 *
 * `warenwertNetto` ist der reine TEXTIL-Einkaufswert – nicht die
 * Produktkosten insgesamt. Transfers kommen von einem anderen Lieferanten
 * und haben ihre eigene Versandregel.
 */
export function lieferantenversandAnteil(warenwertNetto: number, art: Beschaffungsart = BESCHAFFUNG): number {
  if (art.modell === 'lager') return 0;

  const auftraege =
    art.modell === 'sammelbestellung' ? Math.max(1, Math.floor(art.auftraegeJeLieferantenbestellung)) : 1;

  // Bei einer Sammelbestellung zählt der Warenwert ALLER zusammengefassten
  // Aufträge für die Freigrenze – genau darin liegt ihr Vorteil.
  const warenwertDerLieferantenbestellung = warenwertNetto * auftraege;
  if (warenwertDerLieferantenbestellung >= LIEFERANTENVERSAND.freiAbWarenwert) return 0;

  return runde(LIEFERANTENVERSAND.kosten / auftraege);
}

function runde(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}
