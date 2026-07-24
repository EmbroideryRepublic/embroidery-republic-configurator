/**
 * ═══════════════════════════════════════════════════════════════════════
 * VERFÜGBARKEIT – heute manuell, später aus Lieferantendaten
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Es gibt keine Lagerhaltung: Bestellt wird je Kundenbestellung beim
 * Lieferanten. „Verfügbarkeit" heißt deshalb LIEFERBARKEIT und wird vorerst
 * von Hand gepflegt – am Produkt, über `ProductConfig.verfuegbarkeit`.
 *
 * ── Warum ein Port und nicht einfach das Feld ─────────────────────────
 * Sobald die Lieferantenautomatisierung wieder aufgenommen wird, soll sie
 * den Status liefern können, OHNE dass Filter, Oberfläche oder Aufrufer sich
 * ändern. Deshalb steht hier eine Auflösung mit fester Vorrangregel und eine
 * austauschbare Quelle – dasselbe Muster wie bei den Zahlungsanbietern.
 *
 * ── Die Vorrangregel ──────────────────────────────────────────────────
 *   1. `ausgelaufen` (manuell) gewinnt IMMER. Ein ausgelistetes Produkt darf
 *      keine Lieferantenmeldung zurückholen – das ist eine Sortiments-
 *      entscheidung, keine Bestandsfrage.
 *   2. Sonst gewinnt die Lieferantenmeldung, sofern vorhanden (aktueller).
 *   3. Sonst der manuelle Status.
 *   4. Ohne jede Angabe: `lieferbar`.
 */
import type { ProductConfig, Verfuegbarkeit } from '@/config/products/types';

export const VERFUEGBARKEIT_LABELS: Record<Verfuegbarkeit, string> = {
  lieferbar: 'Lieferbar',
  voruebergehend_nicht_lieferbar: 'Vorübergehend nicht lieferbar',
  ausgelaufen: 'Nicht mehr im Sortiment',
};

/**
 * Quelle für Lieferantenmeldungen. Heute gibt es keine – die Funktion ist der
 * vorgesehene Einhängepunkt. Später liefert sie je Produkt-ID einen Status.
 */
export interface LieferantenStand {
  lies(produktId: string): Verfuegbarkeit | undefined;
}

/** Solange die Lieferantenautomatisierung ruht: keine Meldungen. */
export const ohneLieferantenStand: LieferantenStand = {
  lies: () => undefined,
};

let quelle: LieferantenStand = ohneLieferantenStand;

/** Einhängepunkt für die spätere Automatisierung. */
export function setzeLieferantenStand(neu: LieferantenStand): void {
  quelle = neu;
}

/** Reine Auflösung – für Tests direkt mit einem Stand aufrufbar. */
export function loeseAuf(
  manuell: Verfuegbarkeit | undefined,
  vomLieferanten: Verfuegbarkeit | undefined
): Verfuegbarkeit {
  if (manuell === 'ausgelaufen') return 'ausgelaufen';
  return vomLieferanten ?? manuell ?? 'lieferbar';
}

export function ermittleVerfuegbarkeit(p: ProductConfig): Verfuegbarkeit {
  return loeseAuf(p.verfuegbarkeit, quelle.lies(p.id));
}

export function istLieferbar(p: ProductConfig): boolean {
  return ermittleVerfuegbarkeit(p) === 'lieferbar';
}
