/**
 * ═══════════════════════════════════════════════════════════════════════
 * SELBSTKOSTEN UND VERKAUFSPREIS – die Kalkulationskette
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Hier wird aus Einkaufspreis, Veredelung, Verpackung, Versand,
 * Zahlungsgebühren, Ausschuss und Gemeinkosten ein Verkaufspreis abgeleitet.
 * Reine Rechnung, keine Datenzugriffe, keine Nebenwirkungen – prüfbar mit
 * einem einzigen Funktionsaufruf.
 *
 * ── Abgrenzung ────────────────────────────────────────────────────────
 *   lib/pricing/   – was die Kundschaft ZAHLT, Posten für Posten auf der
 *                    Rechnung. Läuft im Bestellvorgang.
 *   hier           – wie wir zu diesem Preis KOMMEN. Läuft NICHT im
 *                    Bestellvorgang, sondern beim Festlegen von Preisen.
 *
 * Kein Betrag aus dieser Datei erscheint je auf einer Kundenrechnung.
 *
 * ── Der Denkfehler, den diese Datei vermeidet ─────────────────────────
 * Zahlungsgebühr und Gewinn sind Anteile am VERKAUFSPREIS, nicht an den
 * Kosten. Wer 25 % auf die Kosten aufschlägt, erhält keine 25 % Marge,
 * sondern 20 %. Deshalb wird der Verkaufspreis rückwärts aus den Kosten
 * gelöst und nicht vorwärts aufgeschlagen:
 *
 *     VK = Kosten / (1 − Anteile)
 *
 * Bei 25 % Gewinn und 2,5 % Zahlungsgebühr also VK = Kosten / 0,725.
 *
 * ── Warum der ganze Auftrag gerechnet wird ────────────────────────────
 * Verpackung, Versand und der Festbetrag der Zahlungsgebühr fallen JE
 * BESTELLUNG an, nicht je Stück. Bei einem Einzelstück tragen sie ein
 * Stück, bei 50 Stück verteilen sie sich. Dasselbe gilt für die DTF-Bögen.
 * Eine Kalkulation je Stück ohne Mengenbezug wäre bei Einzelstücken zu
 * günstig und bei Firmenaufträgen zu teuer.
 */

import type { QualityTier } from '@/types';
import { GEMEINKOSTEN_BLOECKE, gemeinkostenblock } from './gemeinkosten';
import { guenstigsteBelegung, type DtfMotiv } from './dtfKosten';
import { SHIPPING_RATES } from '../shipping';
import { formatiereGeld } from '@/lib/format';
import { bruttoZuNetto, nettoZuBrutto, steueranteil } from './steuer';
import { BESCHAFFUNG, lieferantenversandAnteil } from './beschaffung';
import { PREISSTRATEGIE, gewinnsatzFuerMenge, rundeNachRegel, type Preisstrategie } from './preisstrategie';

/**
 * Materialkosten der Stickerei je 1.000 Stiche.
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ ENTSCHEIDUNG 2026-08-06: 0,76 € (externer Stickpartner).          ║
 * ║                                                                   ║
 * ║ Drei Sätze standen im Raum: 1,40 € (interne Verrechnung, 21.07.), ║
 * ║ 0,76 € (externer Stickpartner, 21.07.) und 0,10 € (22.07., bis    ║
 * ║ hierhin aktiv). Begründung der Wahl:                              ║
 * ║                                                                   ║
 * ║ 1. Gestickt wird extern, nicht auf eigenen Maschinen – wie bei    ║
 * ║    DTF (dtfKosten.ts) ist damit der reale, an einen Dienstleister ║
 * ║    gezahlte Preis die richtige Bemessungsgrundlage, nicht ein     ║
 * ║    theoretischer Materialwert.                                   ║
 * ║ 2. 1,40 € ist ausdrücklich als „interne Verrechnung" benannt –    ║
 * ║    kein tatsächlich gezahlter Betrag, und Verrechnungssätze       ║
 * ║    schließen erfahrungsgemäß Arbeitszeit ein. Das widerspräche    ║
 * ║    dem eigenen Grundsatz, Arbeitszeit bewusst nicht einzurechnen  ║
 * ║    (gemeinkosten.ts) – der Satz wäre doppelt zu niedrig ODER die  ║
 * ║    Arbeitszeit stiege versteckt wieder ein.                       ║
 * ║ 3. 0,10 € führte zu einem wirtschaftlich unplausiblen Ergebnis:   ║
 * ║    ein besticktes Shirt für 6,90 € gegenüber einem bedruckten für ║
 * ║    24,90 € – Stickerei wäre die mit Abstand billigste Veredelung, ║
 * ║    was der Marktlage widerspricht (Stickerei ist üblicherweise    ║
 * ║    vergleichbar teuer oder teurer als DTF für ähnlich große       ║
 * ║    Motive).                                                       ║
 * ║ 4. Bei 0,76 € kostet ein Logo mit 12.000 Stichen rund 9,12 € –    ║
 * ║    derselben Größenordnung wie ein DTF-A3-Bogen samt Versand      ║
 * ║    (14,59 €, siehe unten). Das ist die plausible Relation.        ║
 * ║                                                                   ║
 * ║ Bewusst zurückgestellt: Diesen Satz auf die tatsächliche erste    ║
 * ║ Rechnung des Stickpartners abgleichen, sobald der Betrieb läuft.  ║
 * ║ Bis dahin ist dies die belastbarste verfügbare Schätzung, keine   ║
 * ║ endgültig verifizierte Zahl.                                      ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */
export const STICKKOSTEN_JE_1000_STICHE = 0.76;

/** Womit ein Stück veredelt wird. Bestimmt auch die Ausschussquote. */
export type Veredelungsart = 'dtf' | 'stick';

export interface KalkulationsEingabe {
  /** Was uns das unbedruckte Textil kostet (netto, je Stück). */
  einkaufspreis: number;
  /** Wie viele Stück dieser Auftrag umfasst. */
  menge: number;
  /** Womit veredelt wird. */
  veredelung: Veredelungsart;
  /** Bei DTF: die Motive je Stück, mit ihren Maßen in Millimetern. */
  dtfMotive?: { breiteMm: number; hoeheMm: number }[];
  /** Bei Stickerei: geschätzte Stichzahl je Stück, über alle Positionen. */
  stiche?: number;
}

export interface Kalkulation {
  /** Textilkosten für den gesamten Auftrag. */
  textil: number;
  /** Veredelungskosten für den gesamten Auftrag. */
  veredelung: number;
  /** Aufschlag für Ausschuss – Ware, die wir fertigen und nicht verkaufen. */
  ausschuss: number;
  /** Verpackung + Versand, abzüglich dessen, was die Kundschaft trägt. */
  logistik: number;
  /** Zahlungsgebühren (Prozentsatz + Festbetrag). */
  zahlung: number;
  /** Umgelegte monatliche Fixkosten. 0, solange keine Bezugsgröße vorliegt. */
  fixkosten: number;
  /** Summe aller Kosten für den Auftrag. */
  selbstkosten: number;
  /** Selbstkosten je Stück. */
  selbstkostenJeStueck: number;
  /** Der rechnerische Netto-Verkaufspreis je Stück, vor Rundung. */
  verkaufspreisRoh: number;
  /**
   * Was die Kundschaft je Stück zahlt: BRUTTO, auf x,90 gerundet.
   *
   * Gerundet wird brutto, weil der psychologische Preis dort wirkt, wo er
   * gelesen wird. Siehe steuer.ts.
   */
  verkaufspreis: number;
  /** Derselbe Preis ohne Umsatzsteuer – die Grundlage jeder Margenrechnung. */
  verkaufspreisNetto: number;
  /** Der Umsatzsteueranteil je Stück. */
  steuer: number;
  /** Tatsächliche Marge nach Rundung, in Prozent des NETTO-Verkaufspreises. */
  margeProzent: number;
  /** Hinweise auf fehlende oder unsichere Grundlagen. */
  hinweise: string[];
}

/**
 * Rundet auf einen Ladenpreis: ganze Euro minus 10 Cent.
 *
 * 19,90 statt 19,73 – und immer NACH OBEN, damit die Rundung die Marge nie
 * unter das Ziel drückt. 19,73 wird zu 19,90, nicht zu 18,90.
 */
export function rundeAufLadenpreis(betrag: number): number {
  if (!Number.isFinite(betrag) || betrag <= 0) return 0;
  const kandidat = Math.floor(betrag) + 0.9;
  return Number((kandidat >= betrag ? kandidat : Math.floor(betrag) + 1.9).toFixed(2));
}

function anteilVomVerkaufspreis(id: string): number {
  const block = gemeinkostenblock(id);
  return block?.aktiv ? block.wert / 100 : 0;
}

function betragJeBestellung(id: string): number {
  const block = gemeinkostenblock(id);
  return block?.aktiv ? block.wert : 0;
}

function risikoQuote(id: string): number {
  const block = gemeinkostenblock(id);
  return block?.aktiv ? block.wert / 100 : 0;
}

/**
 * Die vollständige Kalkulation für einen Auftrag.
 *
 * Wirft nicht: Fehlende Grundlagen erscheinen als `hinweise`, damit eine
 * unvollständige Kalkulation sichtbar unvollständig ist, statt gar keine zu
 * liefern. Was fehlt, steht im Ergebnis – nicht in einem Logeintrag.
 */
export function kalkuliere(eingabe: KalkulationsEingabe): Kalkulation {
  const hinweise: string[] = [];
  const menge = Math.max(1, Math.floor(eingabe.menge));

  // ── Produktbezogene Kosten ────────────────────────────────────────
  // Textil, Veredelung und Ausschuss stammen aus DEM einen Baustein, den
  // auch die Bestellrechnung verwendet – keine zweite Rechenlogik.
  const textil = eingabe.einkaufspreis * menge;
  const { kosten: produktkostenGesamt, hinweise: produktHinweise } = produktkosten(eingabe);
  hinweise.push(...produktHinweise);

  // Für die Ausweisung getrennt: was über die reinen Textilkosten hinausgeht,
  // ist Veredelung samt Ausschussanteil.
  const quote = risikoQuote(eingabe.veredelung === 'stick' ? 'ausschuss_stick' : 'ausschuss_dtf');
  const ohneAusschuss = quote > 0 && quote < 1 ? produktkostenGesamt * (1 - quote) : produktkostenGesamt;
  const veredelung = ohneAusschuss - textil;
  const ausschuss = produktkostenGesamt - ohneAusschuss;
  if (quote >= 1) {
    hinweise.push('Ausschussquote von 100 % oder mehr ist nicht rechenbar – Ausschuss ignoriert.');
  }

  // ── Bestellbezogene Kosten und Preis ──────────────────────────────
  // Delegiert an die Bestellrechnung. Diese Funktion ist eine ANSICHT auf
  // den Einzelfall, keine eigene Rechnung – sonst würden Logistik,
  // Lieferantenversand und Zahlungsgebühr an zwei Orten gepflegt und
  // driften unweigerlich auseinander.
  const bestellung = kalkuliereBestellung([eingabe]);
  const position = bestellung.positionen[0]!;

  if (!gemeinkostenblock('gewinn')?.aktiv) {
    hinweise.push('Kein Gewinnaufschlag aktiv – der Preis deckt nur die Kosten.');
  }
  for (const h of bestellung.hinweise) {
    if (!hinweise.includes(h)) hinweise.push(h);
  }

  // Die bestellbezogenen Kosten für die Ausweisung aufteilen: Der
  // wertabhängige Teil ist die Zahlungsgebühr, der Rest Logistik.
  const zahlung = betragJeBestellung('zahlungsgebuehr_fix') + bestellung.erloesNetto * anteilVomVerkaufspreis('zahlungsgebuehr');
  const logistik = bestellung.bestellkosten - zahlung;

  return {
    textil: runde(textil),
    veredelung: runde(veredelung),
    ausschuss: runde(ausschuss),
    logistik: runde(logistik),
    zahlung: runde(zahlung),
    fixkosten: 0,
    selbstkosten: runde(bestellung.selbstkosten),
    selbstkostenJeStueck: runde(bestellung.selbstkosten / menge),
    verkaufspreisRoh: runde(position.verkaufspreisNetto),
    verkaufspreis: position.verkaufspreis,
    verkaufspreisNetto: position.verkaufspreisNetto,
    steuer: steueranteil(position.verkaufspreis),
    margeProzent: bestellung.margeProzent,
    hinweise,
  };
}

function runde(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

/* ═══════════════════════════════════════════════════════════════════════
 * BESTELLUNG MIT MEHREREN POSITIONEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Festlegung des Betreibers vom 2026-07-22: produktbezogene und
 * bestellbezogene Kosten werden getrennt geführt.
 *
 *   produktbezogen   Einkauf, DTF-Bögen, Stickgarn, Ausschuss.
 *                    Wächst mit der Menge.
 *   bestellbezogen   Kundenversand, Verpackung, Zahlungsgebühren, später
 *                    Lieferantenversand. Fällt EINMAL an.
 *
 * Der Grund ist wirtschaftlich, nicht technisch: Wer ein T-Shirt und einen
 * Hoodie bestellt, zahlt einen Versand. Würde man ihn beiden Positionen voll
 * zurechnen, wären beide künstlich verteuert – und eine Sammelbestellung
 * sähe teurer aus als zwei Einzelbestellungen.
 *
 * Der Einzelprodukt-Fall `kalkuliere()` oben ist der Sonderfall mit genau
 * einer Position; die Bestellrechnung ist der allgemeine Fall.
 */

/** Eine Position der Bestellung – ein Produkt in einer Menge. */
export type BestellPosition = KalkulationsEingabe;

export interface PositionsErgebnis {
  /** Nur produktbezogen: Textil, Veredelung, Ausschuss. */
  produktkosten: number;
  /** Anteil an den bestellbezogenen Kosten, nach Verteilungsschlüssel. */
  anteilBestellkosten: number;
  selbstkosten: number;
  selbstkostenJeStueck: number;
  /** Bruttopreis je Stück, auf x,90 gerundet. */
  verkaufspreis: number;
  verkaufspreisNetto: number;
  menge: number;
  hinweise: string[];
}

export interface Bestellkalkulation {
  positionen: PositionsErgebnis[];
  /** Summe aller produktbezogenen Kosten. */
  produktkosten: number;
  /** Alle bestellbezogenen Kosten, nach Abzug des Versanderlöses. */
  bestellkosten: number;
  /**
   * Was der Auftrag bei der HEUTE gelebten Beschaffung kostet.
   *
   * Maßgeblich für jede Aussage über Wirtschaftlichkeit. Weicht die
   * Preisstrategie davon ab, bleibt dieser Wert unberührt – er ist die
   * Wahrheit über unsere Lage, nicht über unsere Absicht.
   */
  selbstkosten: number;
  /**
   * Kosten der Beschaffung, auf der die PREISBILDUNG beruht.
   *
   * Gleich `selbstkosten`, solange die Strategie neutral ist. Liegt er
   * darunter, preisen wir günstiger als es uns kostet – bewusst.
   */
  preisbasisKosten: number;
  erloes: number;
  erloesNetto: number;
  /** Marge gegen die ECHTEN Kosten, nicht gegen die Preisbasis. */
  margeProzent: number;
  /** Nettoerlös minus Istkosten. Negativ = dieser Auftrag trägt sich nicht. */
  deckungsbeitrag: number;
  /** Deckt der Preis die tatsächlichen Kosten? */
  decktIstkosten: boolean;
  hinweise: string[];
}

/**
 * Produktbezogene Kosten einer Position – ohne jeden Bestellanteil.
 *
 * Diese Funktion ist der einzige Ort, an dem Textil-, Veredelungs- und
 * Ausschusskosten entstehen. `kalkuliere()` und `kalkuliereBestellung()`
 * greifen beide darauf zu, damit es keine zweite Rechenlogik gibt.
 */
export function produktkosten(position: BestellPosition): {
  kosten: number;
  /** Nur der Textil-Einkaufswert – Bezugsgröße für den Lieferantenversand. */
  textil: number;
  hinweise: string[];
} {
  const hinweise: string[] = [];
  const menge = Math.max(1, Math.floor(position.menge));

  const textil = position.einkaufspreis * menge;
  if (position.einkaufspreis <= 0) {
    hinweise.push('Kein Einkaufspreis hinterlegt – die Kalkulation ist ohne Textilkosten gerechnet.');
  }

  let veredelung = 0;
  if (position.veredelung === 'dtf') {
    const motive = position.dtfMotive ?? [];
    if (motive.length === 0) {
      hinweise.push('Keine DTF-Motive angegeben – Veredelungskosten sind mit 0 gerechnet.');
    } else {
      veredelung = guenstigsteBelegung(
        motive.map((m): DtfMotiv => ({ breiteMm: m.breiteMm, hoeheMm: m.hoeheMm, anzahl: menge }))
      ).gesamt;
    }
  } else {
    const stiche = position.stiche ?? 0;
    if (stiche <= 0) {
      hinweise.push('Keine Stichzahl angegeben – Veredelungskosten sind mit 0 gerechnet.');
    }
    veredelung = (stiche / 1000) * STICKKOSTEN_JE_1000_STICHE * menge;
    hinweise.push(
      `Stickkosten mit ${formatiereGeld(STICKKOSTEN_JE_1000_STICHE)} je 1.000 Stichen gerechnet (Entscheidung ` +
        '2026-08-06, externer Stickpartner-Satz) – gegen die erste tatsächliche Partnerrechnung abzugleichen ' +
        '(siehe STICKKOSTEN_JE_1000_STICHE).'
    );
  }

  const quote = risikoQuote(position.veredelung === 'stick' ? 'ausschuss_stick' : 'ausschuss_dtf');
  const ausschuss = quote > 0 && quote < 1 ? (textil + veredelung) * (1 / (1 - quote) - 1) : 0;

  return { kosten: textil + veredelung + ausschuss, textil, hinweise };
}

/**
 * Kalkulation einer kompletten Bestellung mit beliebig vielen Positionen.
 *
 * Bestellbezogene Kosten fallen einmal an und werden anschließend nach dem
 * Schlüssel des jeweiligen Kostenblocks verteilt – Versand nach Menge,
 * Zahlungsgebühr nach Wert. Kein Produkt trägt mehr, als es verursacht.
 */
export function kalkuliereBestellung(
  positionen: BestellPosition[],
  strategie: Preisstrategie = PREISSTRATEGIE
): Bestellkalkulation {
  if (positionen.length === 0) {
    return {
      positionen: [],
      produktkosten: 0,
      bestellkosten: 0,
      selbstkosten: 0,
      preisbasisKosten: 0,
      erloes: 0,
      erloesNetto: 0,
      margeProzent: 0,
      deckungsbeitrag: 0,
      decktIstkosten: true,
      hinweise: ['Bestellung ohne Positionen – nichts zu kalkulieren.'],
    };
  }

  const hinweise: string[] = [];
  const je = positionen.map((p) => ({
    menge: Math.max(1, Math.floor(p.menge)),
    ...produktkosten(p),
  }));

  const produktkostenGesamt = je.reduce((s, p) => s + p.kosten, 0);
  const textilwert = je.reduce((s, p) => s + p.textil, 0);
  const gesamtmenge = je.reduce((s, p) => s + p.menge, 0);

  // ── Bestellbezogen: einmal für die ganze Bestellung ───────────────
  const tarif = SHIPPING_RATES.DE;

  // Die Freigrenze ist ein BRUTTO-Betrag: Die Kundschaft sieht ausschließlich
  // Bruttopreise, also bezieht sich auch die Schwelle darauf (Festlegung
  // 2026-07-22). Hier liegen nur Nettokosten vor – der Verkaufspreis entsteht
  // erst weiter unten –, deshalb wird der Bruttowarenwert abgeschätzt.
  //
  // Die Näherung liegt bewusst zu niedrig (sie unterstellt keinen Gewinn) und
  // erreicht die Freigrenze eher zu spät. Wir kalkulieren damit eher mit
  // Versandkosten, die am Ende gar nicht anfallen – die sichere Richtung.
  // Verbindlich rechnet die Preispipeline mit dem echten Bruttowarenwert.
  const geschaetzterBruttowarenwert = nettoZuBrutto(produktkostenGesamt);
  const versandErloes = geschaetzterBruttowarenwert >= tarif.freeFrom ? 0 : bruttoZuNetto(tarif.cost);

  // Lieferantenversand: hängt am TEXTIL-Warenwert und am Beschaffungsmodell,
  // nicht am Produkt. Zwei Werte, bewusst getrennt:
  //   ist       – was die heutige Beschaffung kostet
  //   fuerPreis – worauf die Preisbildung aufsetzt (Strategie)
  const blockAktiv = gemeinkostenblock('lieferantenversand')?.aktiv ?? false;
  const lieferantenversandIst = blockAktiv ? lieferantenversandAnteil(textilwert) : 0;
  const lieferantenversandFuerPreis = blockAktiv
    ? lieferantenversandAnteil(textilwert, strategie.preisbasis)
    : 0;

  if (lieferantenversandIst > 0 && BESCHAFFUNG.modell === 'je_bestellung') {
    hinweise.push(
      `Lieferantenversand ${formatiereGeld(lieferantenversandIst)} fällt tatsächlich an – es wird je ` +
        'Kundenbestellung beim Großhändler bestellt.'
    );
  }
  if (lieferantenversandFuerPreis < lieferantenversandIst) {
    hinweise.push(
      `Der Preis beruht auf der Strategie „${strategie.name}" und trägt davon nur ` +
        `${formatiereGeld(lieferantenversandFuerPreis)}. Die Differenz tragen wir bewusst selbst.`
    );
  }

  const logistikOhneLieferant = betragJeBestellung('verpackung') + betragJeBestellung('versandkosten') - versandErloes;
  const nachMengeIst = logistikOhneLieferant + lieferantenversandIst;
  const nachMenge = logistikOhneLieferant + lieferantenversandFuerPreis;
  const zahlungFix = betragJeBestellung('zahlungsgebuehr_fix');

  const monatlich = GEMEINKOSTEN_BLOECKE.filter((b) => b.aktiv && b.art === 'fix_monatlich').reduce(
    (s, b) => s + b.wert,
    0
  );
  if (monatlich > 0) {
    hinweise.push('Monatliche Fixkosten sind hinterlegt, aber ohne Bezugsgröße nicht umlegbar.');
  }

  // Der Gewinnsatz kommt aus der Strategie und darf je Stückzahl abweichen –
  // so lassen sich Einzelbestellungen bewusst mit kleinerer Marge anbieten.
  const gewinnAnteil = gewinnsatzFuerMenge(gesamtmenge, strategie) / 100;
  const zahlungAnteil = anteilVomVerkaufspreis('zahlungsgebuehr');
  const anteile = gewinnAnteil + zahlungAnteil;
  if (anteile >= 1) {
    hinweise.push('Gewinn und Zahlungsgebühr ergeben zusammen 100 % oder mehr – kein Preis berechenbar.');
  }

  const kostenOhneProzent = produktkostenGesamt + nachMenge + zahlungFix;
  const nettoGesamt = anteile < 1 ? kostenOhneProzent / (1 - anteile) : kostenOhneProzent;
  const zahlungProzentual = nettoGesamt * zahlungAnteil;
  const nachWert = zahlungFix + zahlungProzentual;

  // ── Verteilung ───────────────────────────────────────────────────
  const ergebnisse: PositionsErgebnis[] = je.map((p) => {
    const mengenAnteil = gesamtmenge > 0 ? p.menge / gesamtmenge : 0;
    const wertAnteil = produktkostenGesamt > 0 ? p.kosten / produktkostenGesamt : 0;
    const anteilBestellkosten = nachMenge * mengenAnteil + nachWert * wertAnteil;
    const selbstkosten = p.kosten + anteilBestellkosten;

    // Die Position trägt ihre Produktkosten plus ihren Mengenanteil an der
    // Logistik; der wertabhängige Teil (Zahlungsgebühr) steckt bereits im
    // prozentualen Aufschlag und darf nicht doppelt zugerechnet werden.
    const nettoPosition = anteile < 1 ? (p.kosten + nachMenge * mengenAnteil) / (1 - anteile) : selbstkosten;
    const verkaufspreis = rundeNachRegel(
      nettoZuBrutto(nettoPosition / p.menge),
      strategie.rundung ?? { art: 'endet_auf', nachkomma: 0.9 }
    );
    return {
      produktkosten: runde(p.kosten),
      anteilBestellkosten: runde(anteilBestellkosten),
      selbstkosten: runde(selbstkosten),
      selbstkostenJeStueck: runde(selbstkosten / p.menge),
      verkaufspreis,
      verkaufspreisNetto: bruttoZuNetto(verkaufspreis),
      menge: p.menge,
      hinweise: p.hinweise,
    };
  });

  const bestellkosten = nachMengeIst + nachWert;
  // Istkosten: mit dem Lieferantenversand, der TATSÄCHLICH anfällt.
  const selbstkosten = produktkostenGesamt + bestellkosten;
  // Preisbasis: mit dem, worauf die Strategie den Preis stellt.
  const preisbasisKosten = produktkostenGesamt + nachMenge + nachWert;

  const erloes = ergebnisse.reduce((s, e) => s + e.verkaufspreis * e.menge, 0);
  const erloesNetto = ergebnisse.reduce((s, e) => s + e.verkaufspreisNetto * e.menge, 0);
  const deckungsbeitrag = erloesNetto - selbstkosten;

  if (deckungsbeitrag < 0) {
    hinweise.push(
      `Dieser Auftrag trägt sich nicht: ${formatiereGeld(Math.abs(deckungsbeitrag))} fehlen zur Kostendeckung.`
    );
  }

  return {
    positionen: ergebnisse,
    produktkosten: runde(produktkostenGesamt),
    bestellkosten: runde(bestellkosten),
    selbstkosten: runde(selbstkosten),
    preisbasisKosten: runde(preisbasisKosten),
    erloes: runde(erloes),
    erloesNetto: runde(erloesNetto),
    // Marge IMMER gegen die Istkosten – sonst rechnet sich eine strategische
    // Entscheidung selbst schön.
    margeProzent: erloesNetto > 0 ? Math.round(((erloesNetto - selbstkosten) / erloesNetto) * 1000) / 10 : 0,
    deckungsbeitrag: runde(deckungsbeitrag),
    decktIstkosten: deckungsbeitrag >= -0.005,
    hinweise: [...hinweise, ...ergebnisse.flatMap((e) => e.hinweise)],
  };
}

/** Für Diagnosezwecke: welche Qualitätsstufe welche Zielmarge trägt. */
export type { QualityTier };
