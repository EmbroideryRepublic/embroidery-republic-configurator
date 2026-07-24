/**
 * ═══════════════════════════════════════════════════════════════════════
 * UMSATZSTEUER – die einzige Stelle, die Steuersätze kennt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Festlegung des Betreibers vom 2026-07-22:
 *
 *   1. Sämtliche KOSTEN werden netto kalkuliert.
 *   2. Erst auf den fertigen NETTO-Verkaufspreis kommt die Steuer.
 *   3. Es gibt im gesamten Projekt **eine** Stelle, die entscheidet,
 *      welcher Satz gilt: diese Datei.
 *
 * Alle anderen Bausteine verwenden `steuersatzFuer()` und kennen niemals
 * selbst einen Prozentsatz. Ein Wächter-Test (`__tests__/steuer.test.ts`)
 * durchsucht den Quelltext und schlägt an, sobald irgendwo ein zweiter
 * Steuersatz auftaucht.
 *
 * ── Warum eine Auflösung und keine Konstante ──────────────────────────
 * Heute wird nur nach Deutschland an Endkunden verkauft, der Satz ist immer
 * 19 %. Kämen später weitere Länder oder der ermäßigte Satz hinzu, wäre eine
 * Konstante an dutzenden Stellen zu ersetzen. Mit der Auflösung ist es ein
 * zusätzlicher Tabelleneintrag – kein Aufrufer ändert sich.
 *
 * ── Kein Ausweichwert ─────────────────────────────────────────────────
 * Für ein Land ohne hinterlegten Satz gibt es keine Vermutung, sondern einen
 * Fehler. Dasselbe Vorgehen wie bei `shipping.ts`: lieber kein Angebot als
 * ein geratener Betrag. Eine falsch berechnete Steuer ist ein Steuerdelikt,
 * kein Rundungsfehler.
 *
 * ── Warum brutto gerundet wird ────────────────────────────────────────
 * Ein psychologischer Preis wirkt dort, wo die Kundschaft ihn liest. 19,90 €
 * netto ergäben 23,68 € brutto – im Schaufenster stünde eine krumme Zahl.
 * Deshalb: netto rechnen, brutto runden. Der Nettopreis ist danach nicht
 * mehr glatt, und das ist richtig so.
 *
 * ── Preisangabenverordnung ────────────────────────────────────────────
 * Gegenüber Verbrauchern sind Endpreise anzugeben, also inklusive Steuer.
 * Der Shop richtet sich ausdrücklich auch an Privatkunden. Daraus folgt
 * ebenfalls: Schwellenwerte wie die Versandfreigrenze sind BRUTTO-Beträge,
 * weil die Kundschaft ausschließlich Bruttopreise sieht (Festlegung
 * 2026-07-22).
 */

/** Art des Steuersatzes. Weitere Arten sind ergänzbar, ohne Aufrufer zu ändern. */
export type Steuerart =
  /** Regelsteuersatz – Textilien und Veredelung fallen hierunter. */
  | 'regel'
  /** Ermäßigter Satz. Für unser Sortiment derzeit ohne Anwendungsfall. */
  | 'ermaessigt';

export interface Steuersatz {
  /** Prozentsatz, z.B. 19. */
  satz: number;
  /** Klartext für Anzeige und Rechnung. */
  bezeichnung: string;
  /** Seit wann dieser Satz gilt (ISO). Für die Nachvollziehbarkeit. */
  gueltigAb: string;
}

/**
 * Die hinterlegten Sätze je Land.
 *
 * Ein neues Land ist ein zusätzlicher Eintrag – sonst ändert sich nichts.
 */
const SAETZE: Record<string, Partial<Record<Steuerart, Steuersatz>>> = {
  DE: {
    regel: { satz: 19, bezeichnung: 'Umsatzsteuer 19 %', gueltigAb: '2007-01-01' },
    ermaessigt: { satz: 7, bezeichnung: 'Umsatzsteuer 7 %', gueltigAb: '1983-07-01' },
  },
};

/** Das Land, für das verkauft wird, solange keines angegeben ist. */
export const STANDARDLAND = 'DE';

export class SteuersatzUnbekannt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'SteuersatzUnbekannt';
  }
}

/**
 * Der geltende Steuersatz. **Einzige Stelle, die das entscheidet.**
 *
 * Wirft, wenn für Land und Art nichts hinterlegt ist – kein Ausweichwert.
 */
export function steuersatzFuer(land: string = STANDARDLAND, art: Steuerart = 'regel'): Steuersatz {
  const satz = SAETZE[land.toUpperCase()]?.[art];
  if (!satz) {
    throw new SteuersatzUnbekannt(
      `Für ${land} ist kein ${art === 'regel' ? 'Regelsteuersatz' : 'ermäßigter Steuersatz'} hinterlegt. ` +
        `Bekannt: ${Object.keys(SAETZE).join(', ')}. Ergänzen in config/pricing/steuer.ts.`
    );
  }
  return satz;
}

/** Gibt es für dieses Land einen Satz? Für Diagnose und Länderauswahl. */
export function steuersatzVorhanden(land: string, art: Steuerart = 'regel'): boolean {
  return Boolean(SAETZE[land.toUpperCase()]?.[art]);
}

/** Netto → brutto. */
export function nettoZuBrutto(netto: number, land: string = STANDARDLAND, art: Steuerart = 'regel'): number {
  return runde(netto * (1 + steuersatzFuer(land, art).satz / 100));
}

/** Brutto → netto. Für Beträge, die als Endpreis vorliegen (Versand, Katalogpreise). */
export function bruttoZuNetto(brutto: number, land: string = STANDARDLAND, art: Steuerart = 'regel'): number {
  return runde(brutto / (1 + steuersatzFuer(land, art).satz / 100));
}

/** Der Steueranteil eines Bruttobetrags. */
export function steueranteil(brutto: number, land: string = STANDARDLAND, art: Steuerart = 'regel'): number {
  return runde(brutto - bruttoZuNetto(brutto, land, art));
}

function runde(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}
