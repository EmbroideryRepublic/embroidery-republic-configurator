/**
 * ═══════════════════════════════════════════════════════════════════════
 * DTF-TRANSFERS – EINKAUFSKOSTEN NACH FOLIENBELEGUNG
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Was wir dem Druckdienstleister ZAHLEN. Nicht zu verwechseln mit
 * `config/pricingRules.ts` – dort stehen die Beträge, die die Kundschaft
 * zahlt.
 *
 * ── Der entscheidende Punkt: wir kaufen Folien, keine Motive ──────────
 * Bestätigt am 2026-07-21. Der Dienstleister berechnet einen Bogen, nicht
 * ein Motiv. Auf einen Bogen passen mehrere Motive – wie viele, hängt von
 * ihrer Größe ab. Daraus folgt unmittelbar:
 *
 *   Ein Motiv hat KEINEN Preis. Nur ein Auftrag hat einen Preis.
 *
 * Ein 10 × 10 cm Motiv kostet bei einem Einzelstück den ganzen A3-Bogen
 * (9,69 €), bei zwölf Stück ein Zwölftel davon. Eine Tabelle „Motivgröße →
 * Preis" kann das nicht abbilden – deshalb rechnet diese Datei die
 * Belegung tatsächlich aus.
 *
 * ── Bestätigung durch den Betreiber (2026-07-22) ──────────────────────
 * „Bei Einzelstücken kostet allein die Transferfolie inklusive Versand
 * ungefähr 14 €." Nachgerechnet: A3-Bogen 9,69 € + 4,90 € Lieferanten-
 * versand = 14,59 €. Die Angabe bestätigt das Belegungsmodell, statt ihm
 * zu widersprechen.
 *
 * ── Was hier NICHT passiert ───────────────────────────────────────────
 * Es wird nicht über Aufträge hinweg optimiert. Zwei Kundenaufträge teilen
 * sich nie einen Bogen, auch wenn das technisch ginge – wir wissen beim
 * Kalkulieren nicht, ob der zweite Auftrag je eintrifft. Ausdrückliche
 * Festlegung des Betreibers.
 */

/** Abstand zwischen zwei Motiven und zum Bogenrand, in Millimetern. */
export const SICHERHEITSABSTAND_MM = 8;

export interface DtfBogen {
  /** Stabile Kennung. */
  id: string;
  /** Wie der Dienstleister den Bogen nennt. */
  bezeichnung: string;
  breiteMm: number;
  hoeheMm: number;
  /** Was wir je Bogen zahlen (netto). */
  einkaufspreis: number;
  quelle?: string;
  stand?: string;
}

/**
 * Die tatsächlich bestellbaren Bogengrößen.
 *
 * Reihenfolge ist gleichgültig – `guenstigsteBelegung()` prüft alle.
 */
export const DTF_BOEGEN: DtfBogen[] = [
  {
    id: 'a4',
    bezeichnung: 'A4 (210 × 297 mm)',
    breiteMm: 210,
    hoeheMm: 297,
    einkaufspreis: 6.29,
    quelle: 'Angabe Betreiber',
    stand: '2026-07-21',
  },
  {
    id: 'a3',
    bezeichnung: 'A3 (297 × 420 mm)',
    breiteMm: 297,
    hoeheMm: 420,
    einkaufspreis: 9.69,
    quelle: 'Angabe Betreiber',
    stand: '2026-07-21',
  },
  {
    id: 'bogen-550x500',
    bezeichnung: '550 × 500 mm',
    breiteMm: 550,
    hoeheMm: 500,
    einkaufspreis: 13.99,
    quelle: 'Angabe Betreiber',
    stand: '2026-07-21',
  },
  {
    id: 'bogen-550x1000',
    bezeichnung: '550 × 1000 mm',
    breiteMm: 550,
    hoeheMm: 1000,
    einkaufspreis: 18.99,
    quelle: 'Angabe Betreiber',
    stand: '2026-07-21',
  },
];

/** Versandkosten des DTF-Lieferanten und die Schwelle, ab der sie entfallen. */
export const DTF_LIEFERANTENVERSAND = { kosten: 4.9, freiAbWarenwert: 75 } as const;

export class DtfKostenUnbekannt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'DtfKostenUnbekannt';
  }
}

/** Ein Motiv, so wie es auf den Bogen gelegt werden muss. */
export interface DtfMotiv {
  breiteMm: number;
  hoeheMm: number;
  /** Wie oft dieses Motiv gedruckt wird. */
  anzahl: number;
}

/**
 * Wie viele Motive der Größe b × h auf einen Bogen passen.
 *
 * Rasteranordnung in Reihen und Spalten, nicht optimales Packen. Das ist
 * bewusst: Der Dienstleister ordnet ebenfalls im Raster an, und eine
 * Packoptimierung würde eine Genauigkeit vortäuschen, die die Fertigung
 * nicht einhält. Die Rasterrechnung liegt eher zu niedrig – sie kalkuliert
 * also nie zu knapp.
 *
 * Beide Ausrichtungen werden geprüft; ein quer gelegtes Motiv nutzt den
 * Bogen häufig deutlich besser.
 */
export function motiveJeBogen(bogen: DtfBogen, breiteMm: number, hoeheMm: number): number {
  const passt = (mb: number, mh: number): number => {
    // n Motive nebeneinander brauchen n·Breite + (n−1)·Abstand, dazu beidseitig
    // der Randabstand. Aufgelöst nach n.
    const spalten = Math.floor(
      (bogen.breiteMm - 2 * SICHERHEITSABSTAND_MM + SICHERHEITSABSTAND_MM) / (mb + SICHERHEITSABSTAND_MM)
    );
    const reihen = Math.floor(
      (bogen.hoeheMm - 2 * SICHERHEITSABSTAND_MM + SICHERHEITSABSTAND_MM) / (mh + SICHERHEITSABSTAND_MM)
    );
    return spalten > 0 && reihen > 0 ? spalten * reihen : 0;
  };
  return Math.max(passt(breiteMm, hoeheMm), passt(hoeheMm, breiteMm));
}

export interface BelegungsErgebnis {
  /** Welche Bögen in welcher Zahl gekauft werden. */
  boegen: { bogen: DtfBogen; anzahl: number }[];
  /** Reine Bogenkosten ohne Lieferantenversand. */
  bogenkosten: number;
  /** Anteiliger oder voller Lieferantenversand. */
  versand: number;
  /** Bogenkosten + Versand. */
  gesamt: number;
  /** Gesamtkosten geteilt durch die Zahl der Motive – rein informativ. */
  jeMotiv: number;
  /** Anteil der bezahlten Bogenfläche, der tatsächlich bedruckt wird. */
  ausnutzung: number;
}

/**
 * Günstigste Bogenkombination für einen kompletten Auftrag.
 *
 * Vorgehen: Für jede Bogensorte die Stückkosten je Motiv bestimmen, mit der
 * günstigsten Sorte auffüllen, für den Rest den billigsten Bogen wählen, der
 * ihn noch fasst. Kein vollständiges Optimum, aber nachvollziehbar und in der
 * Praxis nah dran – und es unterschätzt die Kosten nie.
 *
 * Wirft bei Motiven, die auf keinen Bogen passen. Kein Ausweichwert: eine
 * Kalkulation mit geratenen Kosten sieht belastbar aus und ist es nicht.
 */
export function guenstigsteBelegung(motive: DtfMotiv[]): BelegungsErgebnis {
  const gefiltert = motive.filter((m) => m.anzahl > 0);
  if (gefiltert.length === 0) {
    throw new DtfKostenUnbekannt('Kein Motiv angegeben – für einen leeren Auftrag gibt es keine DTF-Kosten.');
  }
  for (const m of gefiltert) {
    if (!Number.isFinite(m.breiteMm) || !Number.isFinite(m.hoeheMm) || m.breiteMm <= 0 || m.hoeheMm <= 0) {
      throw new DtfKostenUnbekannt(`Ungültige Motivgröße: ${m.breiteMm} × ${m.hoeheMm} mm.`);
    }
  }

  const gekauft = new Map<string, { bogen: DtfBogen; anzahl: number }>();
  const buche = (bogen: DtfBogen, anzahl: number): void => {
    const vorhanden = gekauft.get(bogen.id);
    if (vorhanden) vorhanden.anzahl += anzahl;
    else gekauft.set(bogen.id, { bogen, anzahl });
  };

  // Jede Motivgröße wird für sich belegt. Verschiedene Größen auf einem Bogen
  // zu mischen wäre optimaler, ist aber in der Fertigung nicht zugesagt.
  for (const motiv of gefiltert) {
    const moeglich = DTF_BOEGEN.map((bogen) => ({
      bogen,
      proBogen: motiveJeBogen(bogen, motiv.breiteMm, motiv.hoeheMm),
    })).filter((k) => k.proBogen > 0);

    if (moeglich.length === 0) {
      const groesster = [...DTF_BOEGEN].sort((a, b) => b.breiteMm * b.hoeheMm - a.breiteMm * a.hoeheMm)[0]!;
      throw new DtfKostenUnbekannt(
        `Ein Motiv von ${motiv.breiteMm} × ${motiv.hoeheMm} mm passt auf keinen Bogen. ` +
          `Größter Bogen: ${groesster.bezeichnung}, abzüglich ${SICHERHEITSABSTAND_MM} mm Rand.`
      );
    }

    // Günstigste Sorte je Motiv – die Sorte, mit der voll gefüllte Bögen am
    // wenigsten kosten.
    const beste = moeglich.reduce((a, b) =>
      b.bogen.einkaufspreis / b.proBogen < a.bogen.einkaufspreis / a.proBogen ? b : a
    );

    const volleBoegen = Math.floor(motiv.anzahl / beste.proBogen);
    if (volleBoegen > 0) buche(beste.bogen, volleBoegen);

    const rest = motiv.anzahl - volleBoegen * beste.proBogen;
    if (rest > 0) {
      // Für den Rest zählt nicht der Stückpreis, sondern der absolut
      // billigste Bogen, der ihn noch fasst.
      const fuerRest = moeglich
        .filter((k) => k.proBogen >= rest)
        .sort((a, b) => a.bogen.einkaufspreis - b.bogen.einkaufspreis)[0];
      buche(fuerRest ? fuerRest.bogen : beste.bogen, 1);
    }
  }

  const boegen = [...gekauft.values()];
  const bogenkosten = boegen.reduce((s, b) => s + b.bogen.einkaufspreis * b.anzahl, 0);
  const versand = bogenkosten >= DTF_LIEFERANTENVERSAND.freiAbWarenwert ? 0 : DTF_LIEFERANTENVERSAND.kosten;
  const gesamt = bogenkosten + versand;
  const motivzahl = gefiltert.reduce((s, m) => s + m.anzahl, 0);

  const bedruckteFlaeche = gefiltert.reduce((s, m) => s + m.breiteMm * m.hoeheMm * m.anzahl, 0);
  const bogenflaeche = boegen.reduce((s, b) => s + b.bogen.breiteMm * b.bogen.hoeheMm * b.anzahl, 0);

  return {
    boegen,
    bogenkosten: runde(bogenkosten),
    versand,
    gesamt: runde(gesamt),
    jeMotiv: runde(gesamt / motivzahl),
    ausnutzung: bogenflaeche > 0 ? bedruckteFlaeche / bogenflaeche : 0,
  };
}

function runde(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

/** Ist die Bogenliste einsatzbereit? Für Diagnose und Kalkulationsprüfung. */
export function dtfStaffelVorhanden(): boolean {
  return DTF_BOEGEN.length > 0;
}
