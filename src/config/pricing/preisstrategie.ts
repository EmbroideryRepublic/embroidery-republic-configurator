/**
 * ═══════════════════════════════════════════════════════════════════════
 * PREISSTRATEGIE – was wir verlangen, getrennt von dem, was es kostet
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── Warum diese Datei existiert ───────────────────────────────────────
 * Die Selbstkostenrechnung beantwortet eine Frage: Was kostet uns dieser
 * Auftrag? Sie beantwortet ausdrücklich NICHT die zweite: Was verlangen wir
 * dafür? Diese Trennung ist am 2026-07-22 vom Betreiber gefordert worden,
 * und zwar aus einem konkreten Anlass.
 *
 * In der Anfangsphase wird je Kundenbestellung beim Großhändler bestellt.
 * Ein Einzelstück trägt dadurch 4,90 € Lieferantenversand allein und käme
 * bei starrer Kostenweitergabe auf 38,90 € – weit über Marktniveau. Der
 * Fehler läge dann nicht in der Rechnung, sondern in der Annahme, dass jeder
 * Preis den teuersten denkbaren Beschaffungsweg abbilden muss.
 *
 * ── Die zwei Größen, die nie verwechselt werden dürfen ────────────────
 *
 *   Istkosten       Was der Auftrag uns bei der HEUTE gelebten Beschaffung
 *                   kostet. Wahrheit über unsere Lage. Nie beschönigt.
 *
 *   Preisbasis      Der Beschaffungsweg, auf dem wir den PREIS aufbauen.
 *                   Darf günstiger sein als die Istkosten – dann verdienen
 *                   wir am Einzelstück weniger und nehmen das bewusst hin.
 *
 * Der Deckungsbeitrag wird IMMER gegen die Istkosten geprüft, nie gegen die
 * Preisbasis. Sonst rechnete sich eine strategische Entscheidung selbst
 * schön, und ein Verlustgeschäft sähe im Bericht profitabel aus.
 *
 * ── Was hier NICHT entschieden wird ───────────────────────────────────
 * Die Standardstrategie bildet den heutigen Zustand ab: Preisbasis gleich
 * Istbeschaffung, einheitlicher Gewinnsatz. Es ändert sich also zunächst
 * kein einziger Preis. Diese Datei stellt die Wahlmöglichkeit bereit,
 * trifft aber keine Wahl – das ist eine Geschäftsentscheidung.
 */

import { BESCHAFFUNG, type Beschaffungsart } from './beschaffung';
import { gemeinkostenblock } from './gemeinkosten';

/**
 * Gewinnsatz ab einer Stückzahl.
 *
 * Erlaubt, bei Einzelstücken bewusst weniger zu verdienen, um im Markt
 * anschlussfähig zu bleiben, und bei Firmenmengen den vollen Satz zu nehmen.
 */
export interface Margenstufe {
  /** Ab dieser Stückzahl gilt der Satz (einschließlich). */
  abMenge: number;
  /** Gewinn in Prozent des Nettoverkaufspreises. */
  gewinnProzent: number;
  /** Warum diese Stufe so gewählt ist. */
  begruendung: string;
}

/**
 * Wie der fertige Bruttopreis gerundet wird.
 *
 * Als Datenstruktur und nicht als Funktion im Code, damit sich die Regel
 * ändern lässt, ohne Berechnungslogik anzufassen – ausdrückliche Forderung
 * des Betreibers vom 2026-07-22.
 */
export type Rundungsregel =
  /** Auf einen festen Nachkommabetrag, z.B. 0,90 → 19,90 / 24,90. */
  | { art: 'endet_auf'; nachkomma: number }
  /** Auf ein Vielfaches, z.B. 0,50 → 19,50 / 20,00. */
  | { art: 'vielfaches'; schritt: number }
  /** Gar nicht runden – nur auf Cent genau. */
  | { art: 'keine' };

/**
 * Rundet einen Betrag nach der angegebenen Regel.
 *
 * IMMER nach oben. Runden darf die Marge nie unter das Ziel drücken: 19,73 €
 * wird zu 19,90 €, nicht zu 18,90 €.
 */
export function rundeNachRegel(betrag: number, regel: Rundungsregel): number {
  if (!Number.isFinite(betrag) || betrag <= 0) return 0;

  switch (regel.art) {
    case 'keine':
      return Number(betrag.toFixed(2));
    case 'endet_auf': {
      const kandidat = Math.floor(betrag) + regel.nachkomma;
      const gerundet = kandidat >= betrag - 0.0001 ? kandidat : Math.floor(betrag) + 1 + regel.nachkomma;
      return Number(gerundet.toFixed(2));
    }
    case 'vielfaches': {
      if (regel.schritt <= 0) return Number(betrag.toFixed(2));
      return Number((Math.ceil((betrag - 0.0001) / regel.schritt) * regel.schritt).toFixed(2));
    }
  }
}

export interface Preisstrategie {
  name: string;
  /** Wie der Bruttopreis gerundet wird. Ohne Angabe gilt x,90. */
  rundung?: Rundungsregel;
  /**
   * Beschaffungsweg, auf dem die PREISBILDUNG beruht.
   *
   * Weicht er von `BESCHAFFUNG` ab, ist das eine bewusste Entscheidung:
   * Wir preisen so, als würden wir bereits günstiger beschaffen, und tragen
   * die Differenz bis dahin selbst.
   */
  preisbasis: Beschaffungsart;
  /** Gewinnsätze nach Stückzahl, aufsteigend. */
  margen: Margenstufe[];
  beschreibung: string;
}

/** Der Gewinnsatz aus dem Kostenblock – die heutige einheitliche Vorgabe. */
function grundGewinnsatz(): number {
  const block = gemeinkostenblock('gewinn');
  return block?.aktiv ? block.wert : 0;
}

/**
 * Die derzeit geltende Strategie.
 *
 * BEWUSST NEUTRAL: Preisbasis = Istbeschaffung, ein einziger Gewinnsatz für
 * alle Mengen. Damit verhält sich die Kalkulation exakt wie zuvor – diese
 * Datei ändert vorerst keinen Preis.
 *
 * Sie macht die Alternativen nur benennbar und vergleichbar. Welche davon
 * gewählt wird, entscheidet der Betreiber; `npm run preis:strategien` stellt
 * die Auswirkungen gegenüber.
 */
export const PREISSTRATEGIE: Preisstrategie = {
  name: 'Istkosten weitergeben',
  preisbasis: BESCHAFFUNG,
  rundung: { art: 'endet_auf', nachkomma: 0.9 },
  margen: [
    {
      abMenge: 1,
      gewinnProzent: grundGewinnsatz(),
      begruendung: 'Einheitlicher Satz aus dem Kostenblock „gewinn" – noch keine mengenabhängige Staffelung.',
    },
  ],
  beschreibung:
    'Neutraler Ausgangszustand: Der Preis trägt die tatsächlichen Kosten der heutigen Beschaffung. ' +
    'Bei Einzelbestellungen führt das zu Preisen über Marktniveau – siehe die Alternativen unten.',
};

/**
 * Vorgeschlagene Alternativen – NICHT aktiv, nur zum Vergleichen.
 *
 * Jede beantwortet die Frage „Wie werden Einzelbestellungen bezahlbar?"
 * anders. Keine ist von sich aus richtig; sie unterscheiden sich darin, wer
 * die Differenz trägt und welches Risiko eingegangen wird.
 */
export const STRATEGIE_ALTERNATIVEN: Preisstrategie[] = [
  {
    name: 'Bündelung unterstellen',
    preisbasis: { modell: 'sammelbestellung', auftraegeJeLieferantenbestellung: 5 },
    margen: [
      {
        abMenge: 1,
        gewinnProzent: grundGewinnsatz(),
        begruendung: 'Voller Gewinnsatz – der Preisvorteil kommt aus der Beschaffung, nicht aus der Marge.',
      },
    ],
    beschreibung:
      'Preise werden so gebildet, als würden fünf Kundenaufträge zu einer Lieferantenbestellung gebündelt. ' +
      'Solange das nicht geschieht, tragen wir die Differenz. RISIKO: Bei anhaltend wenigen Bestellungen ' +
      'entsteht je Einzelauftrag ein Verlust, der erst im Deckungsbeitrag sichtbar wird.',
  },
  {
    name: 'Einzelstücke mit kleinerer Marge',
    preisbasis: BESCHAFFUNG,
    margen: [
      {
        abMenge: 1,
        gewinnProzent: 10,
        begruendung: 'Einzelbestellungen sind Kundengewinnung. Kostendeckung ja, voller Gewinn nein.',
      },
      {
        abMenge: 15,
        gewinnProzent: grundGewinnsatz(),
        begruendung: 'Ab der Firmenkundenmenge der volle Satz – hier wird verdient.',
      },
    ],
    beschreibung:
      'Die Kosten werden ehrlich getragen, aber am Einzelstück wird bewusst weniger verdient. ' +
      'Kein Verlust, nur weniger Gewinn – die Preise bleiben trotzdem über denen einer Bündelung.',
  },
  {
    name: 'Lagerware unterstellen',
    preisbasis: { modell: 'lager', auftraegeJeLieferantenbestellung: 1 },
    margen: [
      {
        abMenge: 1,
        gewinnProzent: grundGewinnsatz(),
        begruendung: 'Voller Gewinnsatz auf Basis der Lagerbeschaffung.',
      },
    ],
    beschreibung:
      'Preise auf Basis vorhandener Lagerware. Der günstigste Fall – setzt aber Kapitalbindung und ' +
      'Absatzrisiko voraus. Als Preisbasis erst sinnvoll, wenn tatsächlich Lager aufgebaut ist.',
  },
];

/**
 * Der Gewinnsatz, der bei dieser Stückzahl gilt.
 *
 * Genommen wird die höchste Stufe, deren `abMenge` erreicht ist.
 */
export function gewinnsatzFuerMenge(menge: number, strategie: Preisstrategie = PREISSTRATEGIE): number {
  const passend = [...strategie.margen]
    .filter((m) => menge >= m.abMenge)
    .sort((a, b) => b.abMenge - a.abMenge)[0];
  return passend ? passend.gewinnProzent : grundGewinnsatz();
}
