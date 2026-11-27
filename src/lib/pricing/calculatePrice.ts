import type { ConfigElement, PricingRule, PrintView } from '@/types';
import { evaluateRules, isRuleApplicable, type PricingIssue } from './ruleEngine';
import { aufNaechsten99 } from './ladenpreis';
import { grossformatZuschlag } from '@/config/pricing/grossformat';

/**
 * Zentrale Preisberechnung des Konfigurators.
 *
 * WICHTIG: Diese Funktion ist die EINZIGE Stelle, an der der Preis berechnet wird.
 * UI-Komponenten dürfen niemals eigenständig Preise berechnen – sie rufen
 * ausschließlich diese Funktion auf.
 *
 * MENGENRABATT – mehrere getrennte Staffeln statt einer einzelnen:
 * - QUANTITY_TIERS.baseDiscountPercent: leichter Rabatt auf Grundpreis +
 *   Grundgebühren – für alles außer DTF (Stickerei u. a.).
 * - DTF_GRUNDPREIS_STAFFEL: dasselbe für DTF, mit festen Euro-Beträgen, damit der
 *   Stückpreis bei 5/10/20/50 Stück für jedes Modell sichtbar sinkt (siehe dortiger Kommentar).
 * - QUANTITY_TIERS.veredelungDiscountPercent: steiler Rabatt auf Fläche/
 *   Stichzahl-Kosten – gilt seit 2026-08-09 NUR NOCH für Stickerei
 *   (stichzahlbasiert).
 * - DTF_POSITION_TIERS: eigene, FESTE (nicht prozentual rabattierte)
 *   Preisstaffel je Position für DTF-Transferdruck (siehe dortiger
 *   Kommentar) – ersetzt seit 2026-08-09 die vorherige prozentuale
 *   Veredelungsrabattierung für DTF vollständig. Die Stickerei rechnet seit
 *   2026-11-26 mit der eigenen, unveränderten Tabelle STICKEREI_POSITION_TIERS.
 * - MENGENPREIS-DECKEL (nur DTF, calculatePrice() unten): Kurz vor einer Staffelgrenze
 *   gilt höchstens der Gesamtpreis der Grenzmenge – eine größere Bestellung kostet
 *   so nie weniger als eine kleinere.
 */

export interface PriceCalculationInput {
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
  /**
   * Ladenpreis-Rundung auf ,99 (lib/pricing/ladenpreis.ts). Standard: AN – so rechnen Konfigurator, Warenkorb und Server.
   * `false` liefert den ungerundeten Rechenwert; gedacht für Tests, die einzelne Preisbausteine exakt nachrechnen
   * (z.B. „Stickerei kostet genau den Stichaufpreis mehr als DTF“), nie für die Anzeige.
   */
  ladenpreisRundung?: boolean;
  /**
   * Mengenpreis-Deckel (siehe `staffelgrenzen` unten): Standard AN – so rechnen Konfigurator, Warenkorb und Server. `false` liefert die
   * reine Staffel ohne Deckel; gedacht für Tests und Auswertungen, die die regulären Stufenpreise (Stückpreis auf ,99) vergleichen, und
   * für die Suche nach der nächsten Stufe (mengenTipp.ts) – nie für die Anzeige.
   */
  mengenDeckel?: boolean;
  /**
   * ECHTE flache Motivmaße je Element, in der Reihenfolge von `elements` (config/echteMasse.ts) – nur für DTF auf Vorder-/Rückseite gesetzt. Das
   * Foto zeigt die Brust gewölbt, die gezeichnete Breite ist deshalb kleiner als die flache; für den Großformat-Zuschlag zählt die
   * echte Fläche. Ohne Eintrag gilt das gezeichnete Maß des Elements.
   */
  echteMasse?: ReadonlyArray<{ breiteCm: number; hoeheCm: number } | undefined>;
  /**
   * Zeitlich begrenzte Prozent-Aktion (config/aktion.ts, z. B. Black Week): `prozent` Rabatt auf den GESAMTPREIS der Position – Textil,
   * Veredelung und Einrichtung, nach Mengenstaffel und Mengenpreis-Deckel, ohne Versand. Standard: KEINE – wer die Aktion will, übergibt
   * `aktuelleAktion()` (Konfigurator, Warenkorb, Server). So bleiben Tests und statische Preisbeispiele unabhängig vom Datum.
   */
  aktion?: { prozent: number } | null;
}

export interface PriceCalculationResult {
  unitPrice: number;
  totalPrice: number;
  /**
   * TRUE = mindestens ein Preisbaustein konnte nicht verarbeitet werden.
   *
   * Der Preis ist dann NICHT verwendbar: Er darf weder angezeigt noch in ein
   * Angebot oder eine Rechnung übernommen werden. In Entwicklung und Tests
   * kommt es gar nicht so weit – dort wirft die Engine sofort (fail fast).
   * In Produktion ist das die letzte Sicherung gegen einen still falschen
   * Preis.
   */
  hasErrors: boolean;
  /** Details zu nicht verarbeitbaren Bausteinen (leer im Normalfall). */
  issues: PricingIssue[];
  breakdown: {
    basePrice: number;
    elementsPrice: number;
    perElement: { elementId: string; price: number }[];
    elementBaseFeeTotal: number;
    positionFeeTotal: number;
    /** Je Ansicht: die rabattierten Flächen-/Stichzahl-Kosten dieser Ansicht
     *  PLUS (bei aktiver Positionsstaffel) ihr Positionsanteil – siehe
     *  isPositionBased. Bei DTF ist nur der Positionsanteil ungleich 0, bei
     *  Stickerei (seit 2026-09-03) sind es beide Anteile zusammen. */
    areaPriceByView: Record<PrintView, number>;
    areaPricePerCm2: number;
    pricePer1000Stitches: number;
    isStitchBased: boolean;
    /** True, wenn first_position/additional_position aktiv sind (DTF und
     *  Stickerei) – areaPriceByView enthält dann je Ansicht den
     *  Positionsanteil. Die Anzeige nutzt firstPositionPrice/
     *  additionalPositionPrice/furtherPositionPrice und, wenn zugleich
     *  isStitchBased gilt, zusätzlich pricePer1000Stitches. */
    isPositionBased: boolean;
    /** Preis für die erste bedruckte Ansicht (nur informativ für die
     *  Anzeige, z.B. im Tooltip „9 € für die erste Position"). */
    firstPositionPrice: number;
    /** Preis für die zweite bedruckte Ansicht (nur informativ). */
    additionalPositionPrice: number;
    /** Preis für jede weitere Ansicht ab der dritten (nur informativ). */
    furtherPositionPrice: number;
    totalEstimatedStitches: number;
    /** Rabatt auf Grundpreis/Grundgebühren (leicht). */
    baseDiscountPercent: number;
    /** Rabatt auf Fläche/Stichzahl-Kosten (steil, wie am Markt üblich).
     *  Betrifft seit 2026-08-09 NUR NOCH Stickerei – DTF-Positionen nutzen
     *  die feste Staffel DTF_POSITION_TIERS und werden von diesem Wert
     *  nicht mehr rabattiert. */
    veredelungDiscountPercent: number;
    savingsAmount: number;
    nextTier: QuantityTier | null;
    /** Einmalige Rüstkosten des gesamten Auftrags (nicht je Stück). */
    setupTotal: number;
    /** Auf die Stückzahl verteilte Rüstkosten – im unitPrice enthalten. */
    setupPerUnit: number;
    /** Rundung auf den nächsten ,99-€-Betrag je Stück (positiv oder negativ, höchstens ± 0,50 €) – im unitPrice enthalten; nur Anzeige der Preisdetails. */
    rundungPerUnit: number;
    /** Zuschläge je Stück (Premiumgarn, Spezialfolie …). */
    surchargePerUnit: number;
    /** Großformat-Zuschlag je Stück (nur DTF, nach echter Motivfläche, config/pricing/grossformat.ts) – im unitPrice enthalten. */
    grossformatPerUnit: number;
    /** Nachlässe je Stück als POSITIVER Betrag (Rabatt, Gutschein). */
    discountPerUnit: number;
    /**
     * Mengenpreis-Deckel (nur DTF, siehe `staffelgrenzen`): Betrag des Gesamtpreises, um den die Bestellung günstiger ist als ihre reine
     * Staffelrechnung – NEGATIV oder 0. Er entsteht nur kurz VOR einer Staffelgrenze: Dort würde eine kleinere Menge sonst mehr kosten als die
     * Menge der Grenze (z. B. 49 Stück 1.224,51 €, 50 Stück 1.149,50 €); der Deckel setzt den Preis auf den der Grenzmenge.
     */
    mengenDeckelTotal: number;
    /** Dasselbe je Stück (NEGATIV oder 0) – im unitPrice enthalten, eigene Zeile in den Preisdetails; die Zeilen ergeben so wieder den Stückpreis. */
    mengenDeckelPerUnit: number;
    /** Die Menge, deren Preis gilt (Staffelgrenze), solange der Deckel wirkt; sonst null. Für den Mengen-Tipp („genauso viel für N Stück“). */
    mengenDeckelAufMenge: number | null;
    /** Satz der angewandten Aktion in Prozent (config/aktion.ts), sonst 0. */
    aktionProzent: number;
    /** Aktionsrabatt auf den Gesamtpreis der Position (NEGATIV oder 0) – im Gesamtpreis enthalten; in den Preisposten eine eigene Zeile. */
    aktionTotal: number;
    /** Dasselbe je Stück (NEGATIV oder 0) – im unitPrice enthalten, eigene Zeile in den Preisdetails; die Zeilen ergeben so wieder den Stückpreis. */
    aktionPerUnit: number;
  };
}

export interface QuantityTier {
  minQuantity: number;
  /** Rabatt auf Grundpreis/Grundgebühren bei dieser Stückzahl. */
  baseDiscountPercent: number;
  /**
   * Rabatt auf Fläche/Stichzahl-Kosten bei dieser Stückzahl – gilt seit
   * 2026-08-09 NUR NOCH für stichzahlbasierte Stickerei-Veredelung. Die
   * DTF-Positionsstaffel (siehe DTF_POSITION_TIERS weiter unten) hat eigene,
   * feste Preise je Stückzahlbereich und wird von diesem Feld nicht mehr
   * beeinflusst.
   */
  veredelungDiscountPercent: number;
}

/**
 * Grundpreis-Rabatt (alle Veredelungsarten) und Stickerei-Veredelungsrabatt
 * je Stückzahl. Kalibriert auf Vorgaben des Betreibers vom 2026-08-08
 * (Zielpreise 379 €/1.049 €/8.300 € für das 11,99-€-T-Shirt mit DTF – die
 * damalige Rechnung bezog dabei auch die DTF-Positionspreise mit ein, die
 * seither durch DTF_POSITION_TIERS ersetzt wurden; baseDiscountPercent
 * blieb unverändert, weil dieser Wert weiterhin für alle Veredelungsarten
 * gilt). Grundprinzip: der Grundpreis wird nur LEICHT rabattiert
 * (Großeinkauf bringt beim Blanko-Artikel wenig), Stickerei-Veredelung
 * deutlich steiler (Digitalisieren/Einrichten amortisiert sich schnell).
 */
export const QUANTITY_TIERS: QuantityTier[] = [
  { minQuantity: 1, baseDiscountPercent: 0, veredelungDiscountPercent: 0 },
  { minQuantity: 5, baseDiscountPercent: 1, veredelungDiscountPercent: 20 },
  { minQuantity: 10, baseDiscountPercent: 3, veredelungDiscountPercent: 35 },
  { minQuantity: 20, baseDiscountPercent: 5, veredelungDiscountPercent: 46 },
  { minQuantity: 25, baseDiscountPercent: 6, veredelungDiscountPercent: 48 },
  { minQuantity: 50, baseDiscountPercent: 8, veredelungDiscountPercent: 52 },
  { minQuantity: 100, baseDiscountPercent: 20, veredelungDiscountPercent: 90 },
  { minQuantity: 250, baseDiscountPercent: 23, veredelungDiscountPercent: 90 },
  { minQuantity: 500, baseDiscountPercent: 26, veredelungDiscountPercent: 90 },
  { minQuantity: 1000, baseDiscountPercent: 36, veredelungDiscountPercent: 93 },
];

export interface DtfGrundpreisStufe {
  minQuantity: number;
  /** Rabatt auf den festen Anteil (Grundpreis + Grundgebühren) in Prozent. */
  prozent: number;
  /** Mindestens so viele Euro je Stück gehen vom festen Anteil ab – größer von beiden gilt (Prozent ODER Euro). */
  mindestensEuro: number;
}

/**
 * Grundpreis-Rabatt für DTF-Transferdruck je Stückzahl (Festlegung 2026-11-18).
 *
 * ZIEL (Betreiber): Mit mehr Stück soll der Stückpreis auf JEDER Stufe sichtbar sinken und der Gewinn je Bestellung
 * (und die Marge) trotzdem mit der Menge steigen. Die ältere Tabelle QUANTITY_TIERS ließ den Preis zwischen 3 und 9 Stück
 * völlig flach (27,99 €), obwohl unsere Kosten je Stück dort von rund 21,6 € auf 14,6 € fallen (Versand und DTF-Bogen teilen
 * sich auf) – wer fünf statt drei bestellte, sah keinen Vorteil.
 *
 * WARUM FESTE EURO-BETRÄGE STATT NUR PROZENT: Unsere Ersparnis durch Menge (geteilter Versand, besser gefüllter DTF-Bogen,
 * Lieferantenstaffel) fällt in Euro an, nicht in Prozent vom Textilpreis. Ein reiner Prozentsatz (z. B. 4 % bei 5 Stück) ergäbe
 * bei einem 12-€-Shirt nur 0,48 € – und das verschwindet in der ,99-Rundung (Ladenpreis): Bei 5 Stück sank der Stückpreis dann
 * nur bei 150 von 182 Modellen, bei 20 Stück nur bei 121. Ein Euro-Betrag von mindestens 1 € Zuwachs je Stufe (zusammen mit der
 * DTF-Positionsstaffel) garantiert dagegen für JEDES Modell einen niedrigeren Stückpreis – das prüft dtfStaffel.test.ts.
 * Ab 50 Stück gilt weiter der größere Wert aus Prozent und Euro, damit teure Modelle (Hoodies) nicht schlechter wegkommen
 * als bisher.
 *
 * Ladenpreis je Stück (Warenwert, ohne Versand) für ein Modell um 28 € bei 3 Stück (Median des Katalogs, 1 Position 20×25 cm), Stand
 * 2026-11-18 (vor der Anpassung vom 2026-11-26: alle Stufen ab 3 Stück liegen seither 1 € höher, siehe DTF_POSITION_TIERS):
 *   1 Stück 38,99 € (mit Einrichtung) · 2: 33,99 € · 3–4: 27,99 € · 5–9: 26,99 € · 10–19: 25,99 € · 20–49: 24,99 €
 *   · 50–99: 22,99 € · ab 100: 21,99 €. Marge (Median): 9 % → 24 % → 23 % → 32 % → 41 % → 48 % → 49 % → 50 %.
 *   Stand 2026-11-26: 38,99 · 33,99 · 28,99 · 27,99 · 26,99 · 25,99 · 23,99 · 22,99 €; Marge (Median) 9 % → 24 % → 24 % → 35 % → 44 % → 49 % → 51 % → 52 %.
 * Gerechnet mit Einkaufspreisen und Versandkosten beider Lieferanten; kleinster Gewinn je Bestellung über alle 182 Modelle
 * und Mengen 1–120 siehe docs/kalkulationsmodell.md.
 *
 * Gilt NUR für DTF. Die Stickerei (Positionsstaffel + Stichaufpreis) bleibt bei QUANTITY_TIERS und ändert sich nicht –
 * abgesichert durch src/lib/pricing/__tests__/dtfStaffel.test.ts. Zurücksetzen: in calculatePrice() getDtfGrundpreisStufe
 * nicht mehr verwenden (dann gilt wieder QUANTITY_TIERS).
 */
export const DTF_GRUNDPREIS_STAFFEL: ReadonlyArray<DtfGrundpreisStufe> = [
  { minQuantity: 1, prozent: 0, mindestensEuro: 0 },
  { minQuantity: 5, prozent: 0, mindestensEuro: 1.0 },
  { minQuantity: 10, prozent: 0, mindestensEuro: 1.5 },
  { minQuantity: 20, prozent: 0, mindestensEuro: 3.0 },
  { minQuantity: 50, prozent: 8, mindestensEuro: 3.0 },
  { minQuantity: 100, prozent: 20, mindestensEuro: 4.0 },
  { minQuantity: 250, prozent: 23, mindestensEuro: 4.0 },
  { minQuantity: 500, prozent: 26, mindestensEuro: 4.0 },
  { minQuantity: 1000, prozent: 36, mindestensEuro: 4.0 },
];

/** Die DTF-Grundpreisstufe, die bei dieser Stückzahl gilt. */
export function getDtfGrundpreisStufe(quantity: number): DtfGrundpreisStufe {
  let aktuell = DTF_GRUNDPREIS_STAFFEL[0]!;
  for (const stufe of DTF_GRUNDPREIS_STAFFEL) {
    if (quantity >= stufe.minQuantity) aktuell = stufe;
  }
  return aktuell;
}

function getTierForQuantity(quantity: number): QuantityTier {
  let current: QuantityTier = { minQuantity: 0, baseDiscountPercent: 0, veredelungDiscountPercent: 0 };
  for (const tier of QUANTITY_TIERS) {
    if (quantity >= tier.minQuantity) current = tier;
  }
  return current;
}

function getNextTier(quantity: number): QuantityTier | null {
  return QUANTITY_TIERS.find((tier) => tier.minQuantity > quantity) ?? null;
}

/**
 * Kleinste bestellbare Menge. **Bewusst 1.**
 *
 * Vorher stand hier 5 – und `calculatePrice` rechnete mit
 * `Math.max(quantity, 5)`. Wer ein Einzelstück bestellte, zahlte damit
 * stillschweigend fünf. Privatkunden, Creator und kleine Vereine waren so
 * faktisch ausgeschlossen.
 *
 * Die Wirtschaftlichkeit kleiner Mengen wird nicht über eine Mindestmenge
 * gelöst, sondern über EINMALIGE Kosten (Regeltyp `setup_fee`): Sie fallen
 * EINMAL pro Auftrag an und verteilen sich auf die Stückzahl. Dadurch trägt
 * ein Einzelstück die Einrichtung allein, während der Stückpreis mit
 * steigender Menge von selbst sinkt – ohne jemanden auszuschließen.
 */
export const MINIMUM_QUANTITY = 1;

// Nutzt dieselbe Anwendbarkeitsprüfung wie evaluateRules() (Mengenfenster,
// Gültigkeitszeitraum) – sonst weicht dieser Pfad von der Regel-Engine ab
// und liefert bei Staffel-/Zeitfenster-Regeln einen falschen Preis.
//
// SUMMIERT alle passenden Regeln (wie evaluateRules()), statt nur die erste
// zu nehmen: Sind z.B. zwei per_position-Regeln für dieselbe Ansicht aktiv,
// gelten beide gemeinsam – sonst würde ein Teil des Preises still verschwinden.
function getPositionPrice(view: PrintView, rules: PricingRule[], quantity: number): number {
  return rules
    .filter((r) => r.ruleType === 'per_position' && r.printView === view && isRuleApplicable(r, quantity))
    .reduce((sum, r) => sum + r.price, 0);
}

function getElementTypeBasePrice(
  type: 'logo' | 'text',
  view: PrintView,
  rules: PricingRule[],
  quantity: number
): number {
  const ruleType = type === 'logo' ? 'per_logo' : 'per_text';
  return rules
    .filter(
      (r) => r.ruleType === ruleType && isRuleApplicable(r, quantity) && (!r.printView || r.printView === view)
    )
    .reduce((sum, r) => sum + r.price, 0);
}

export interface DtfPositionTier {
  minQuantity: number;
  /** Preis für die erste bedruckte Ansicht. */
  erste: number;
  /** Preis für die zweite bedruckte Ansicht (zusätzlich zur ersten). */
  zweite: number;
  /** Preis für jede weitere Ansicht ab der dritten. */
  abDritte: number;
}

/**
 * Feste Preisstaffel für DTF-Positionen (Betreiber-Vorgabe 2026-08-09).
 *
 * ERSETZT die vorherige prozentuale Veredelungsrabattierung für DTF
 * VOLLSTÄNDIG: Die Beträge hier sind bereits der fertige Endpreis je
 * Position – es wird in calculatePrice() nichts mehr zusätzlich
 * rabattiert (siehe discountedVariable dort). QUANTITY_TIERS.
 * veredelungDiscountPercent betrifft ab jetzt ausschließlich die
 * stichzahlbasierte Stickerei-Veredelung, nicht mehr DTF.
 *
 * STUFENFUNKTION, kein Gleiten: Die erreichte Mengenschwelle bestimmt den
 * Veredelungspreis für die GESAMTE Bestellung. 10, 25 und 49 Stück kosten
 * also exakt denselben Preis je Position; erst ab 50 Stück springt die
 * komplette Bestellung in die nächste (günstigere) Stufe. Weil ein Sprung an
 * der Grenze die Menge davor teurer machen kann als die Grenzmenge selbst,
 * deckelt calculatePrice() den Gesamtpreis kurz vor jeder Grenze (Mengenpreis-
 * Deckel, siehe dort) – die Tabelle selbst bleibt reine Stufenfunktion.
 *
 * Jede weitere Position ab der dritten kostet in jeder Stufe genauso viel
 * wie die dritte selbst (abDritte) – „dritte" und „jede weitere" fallen
 * also zusammen, es gibt keine eigene vierte Preisklasse.
 *
 * WENIGER MENGENRABATT (Festlegung 2026-11-26): Gegenüber dem Stand vom 2026-08-09 (erste Position 9 / 8 / 7,5 / 6 / 5,5 / 5 / 4,5 / 4 €)
 * liegt die erste Position ab 3 Stück auf JEDER Stufe genau 1,00 € höher. Der Betreiber wollte den Mengenrabatt kleiner, sodass der
 * Stückpreis ab 5 Stück im Mittel rund 5 % höher liegt. Auf der ,99-Leiter ist 1 € der kleinste mögliche Schritt (bei einem Stückpreis um
 * 22 € rund 4,5 %); ein fester Euro je Stufe lässt alle Abstände zwischen den Stufen unverändert (jede Stufe bis 100 Stück bleibt für jedes
 * Modell mindestens 1 € günstiger als die davor, dtfStaffel.test.ts) und trifft den Zielwert: Mittel über die Stufen ab 5 Stück +4,9 %
 * (ein Motiv), 1 und 2 Stück bleiben unverändert. Zweite und weitere Position, die Grundpreis-Staffel (DTF_GRUNDPREIS_STAFFEL) und die
 * Einrichtung bleiben, wie sie waren. Die Stickerei rechnet mit der eigenen, unveränderten Tabelle STICKEREI_POSITION_TIERS.
 * Rückgängig machen: die Spalte `erste` auf 9 / 8 / 7,5 / 6 / 5,5 / 5 / 4,5 / 4 zurücksetzen (dann gilt wieder der Stand vom 2026-08-09).
 */
// Stand der Vorgabe vom 2026-08-09 (erste Position): 9 / 8 / 7,5 / 6 / 5,5 / 5 / 4,5 / 4 €. Die Anhebung um rund 9 % vom 2026-11-12 ist am
// 2026-11-13 zurückgenommen (Betreiber: nur 3–5 % mehr, siehe config/pricing/marginTiers.ts – dort stieg nur der Textil-Grundpreis). Seit
// 2026-11-26 ist die erste Position ab 3 Stück 1 € höher (siehe oben). Die Reihenfolge der Stufen bleibt streng fallend.
export const DTF_POSITION_TIERS: DtfPositionTier[] = [
  { minQuantity: 1, erste: 9.0, zweite: 5.0, abDritte: 4.0 },
  { minQuantity: 3, erste: 9.0, zweite: 4.5, abDritte: 3.5 },
  { minQuantity: 10, erste: 8.5, zweite: 4.0, abDritte: 3.0 },
  { minQuantity: 50, erste: 7.0, zweite: 3.0, abDritte: 2.5 },
  { minQuantity: 100, erste: 6.5, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 250, erste: 6.0, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 500, erste: 5.5, zweite: 2.0, abDritte: 1.5 },
  { minQuantity: 1000, erste: 5.0, zweite: 2.0, abDritte: 1.5 },
];

/**
 * Positionsstaffel der STICKEREI – eingefrorene Kopie des Stands vom 2026-08-09 (Stickerei = Positionsstaffel + Stichaufpreis).
 *
 * Bis 2026-11-26 teilten sich DTF und Stickerei die Tabelle DTF_POSITION_TIERS. Seit die DTF-Staffel angepasst wird (weniger Mengenrabatt,
 * docs/kalkulationsmodell.md, Abschnitt 2026-11-26), bekommt die Stickerei ihre eigene, unveränderte Tabelle: Ihre Preise dürfen sich nicht
 * ändern (Stickerei ist derzeit pausiert; Test dtfStaffel.test.ts friert 60 Vergleichspreise ein). Ob sie später wieder dieselbe Staffel
 * wie DTF bekommt, ist eine eigene Betreiber-Entscheidung.
 */
export const STICKEREI_POSITION_TIERS: ReadonlyArray<DtfPositionTier> = [
  { minQuantity: 1, erste: 9.0, zweite: 5.0, abDritte: 4.0 },
  { minQuantity: 3, erste: 8.0, zweite: 4.5, abDritte: 3.5 },
  { minQuantity: 10, erste: 7.5, zweite: 4.0, abDritte: 3.0 },
  { minQuantity: 50, erste: 6.0, zweite: 3.0, abDritte: 2.5 },
  { minQuantity: 100, erste: 5.5, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 250, erste: 5.0, zweite: 2.5, abDritte: 2.0 },
  { minQuantity: 500, erste: 4.5, zweite: 2.0, abDritte: 1.5 },
  { minQuantity: 1000, erste: 4.0, zweite: 2.0, abDritte: 1.5 },
];

function getPositionTier(quantity: number, tiers: ReadonlyArray<DtfPositionTier>): DtfPositionTier {
  let current: DtfPositionTier = tiers[0]!;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity) current = tier;
  }
  return current;
}

/**
 * Ob für diese Preisregeln/Menge überhaupt die Positionsstaffel gilt
 * (aktive first_position/additional_position-Regel vorhanden). Seit
 * 2026-09-03 sind diese Regeln für DTF UND Stickerei aktiv; bei Stickerei
 * kommt über getVariableCost()/per_1000_stitches zusätzlich der
 * Stichaufpreis hinzu (die Tabelle heißt aus Kompatibilitätsgründen
 * weiterhin DTF_POSITION_TIERS).
 *
 * Nutzt dieselbe Anwendbarkeitsprüfung wie die übrigen Getter (Mengenfenster,
 * Gültigkeitszeitraum) – nur um FESTZUSTELLEN, ob DTF-Preisregeln aktiv
 * sind, nicht um deren Rohpreis zu lesen (der kommt jetzt aus
 * DTF_POSITION_TIERS oben, nicht mehr aus der Regel selbst).
 */
function isDtfPositionPricingActive(rules: PricingRule[], quantity: number): boolean {
  return rules.some(
    (r) =>
      (r.ruleType === 'first_position' || r.ruleType === 'additional_position') && isRuleApplicable(r, quantity)
  );
}

/**
 * Die für die Preisberechnung "abrechenbare" Fläche eines Elements. Bei
 * TEXT wird nur der tatsächlich von Buchstaben bedeckte Anteil berechnet
 * (inkCoverageRatio). Bei LOGO wird die Box bereits beim Hochladen auf
 * den tatsächlichen Bildinhalt zugeschnitten, zusätzlich wird der
 * Füllgrad innerhalb dieser Box berücksichtigt (contentFillRatio).
 */
function getBillableAreaCm2(element: ConfigElement): number {
  const boxAreaCm2 = element.widthCm * element.heightCm;
  if (element.type === 'text') {
    return boxAreaCm2 * (element.inkCoverageRatio ?? 0.35);
  }
  return boxAreaCm2 * (element.contentFillRatio ?? 0.85);
}

/**
 * Variable Kosten eines Elements: entweder Fläche × €/cm² ODER
 * (Stiche / 1000) × €/1000-Stiche – je nachdem, welcher REGELTYP aktiv ist.
 * Sind mehrere Regeln DESSELBEN Typs gleichzeitig aktiv (z.B. zwei
 * per_cm2-Regeln), gelten sie gemeinsam und werden summiert – wie
 * evaluateRules() es für den Veredelungstopf tut. Nur der TYP
 * (Fläche vs. Stichzahl) bleibt exklusiv, nicht die einzelne Regel.
 *
 * Nutzt dieselbe Anwendbarkeitsprüfung wie getPositionPrice()/
 * getElementTypeBasePrice() (Mengenfenster, Gültigkeitszeitraum) – sonst
 * weicht dieser Pfad von der Regel-Engine ab und liefert bei Staffel-/
 * Zeitfenster-Regeln einen falschen Preis.
 */
function getVariableCost(element: ConfigElement, rules: PricingRule[], quantity: number): number {
  const stitchRules = rules.filter(
    (r) =>
      r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity) && (!r.printView || r.printView === element.view)
  );
  if (stitchRules.length > 0) {
    const stitches = element.estimatedStitches ?? 0;
    return stitchRules.reduce((sum, r) => sum + (stitches / 1000) * r.price, 0);
  }
  const areaRules = rules.filter(
    (r) => r.ruleType === 'per_cm2' && isRuleApplicable(r, quantity) && (!r.printView || r.printView === element.view)
  );
  if (areaRules.length > 0) {
    const areaCm2 = getBillableAreaCm2(element);
    return areaRules.reduce((sum, r) => sum + areaCm2 * r.price, 0);
  }
  return 0;
}

/**
 * Alle Mengen, ab denen sich der Stückpreis dieser Regeln ändern kann (Staffelgrenzen): die Stufen der DTF-Grundpreis- und der
 * Positionsstaffel, dazu jedes Mengenfenster einer aktiven Preisregel (minQuantity und maxQuantity + 1 – z. B. das Ende der Einrichtung
 * für Kleinaufträge). Aufsteigend, ohne Doppelte, ohne die 1. Nur für DTF aussagekräftig; die Stickerei hat keinen Mengenpreis-Deckel.
 */
export function staffelgrenzen(pricingRules: PricingRule[]): number[] {
  const grenzen = new Set<number>();
  for (const s of DTF_GRUNDPREIS_STAFFEL) grenzen.add(s.minQuantity);
  for (const t of DTF_POSITION_TIERS) grenzen.add(t.minQuantity);
  for (const r of pricingRules) {
    if (!r.isActive) continue;
    if (r.minQuantity !== undefined) grenzen.add(r.minQuantity);
    if (r.maxQuantity !== undefined) grenzen.add(r.maxQuantity + 1);
  }
  return [...grenzen].filter((g) => Number.isInteger(g) && g > 1).sort((a, b) => a - b);
}

/**
 * Zentrale Preisberechnung – siehe Kopfkommentar der Datei. Rechnet die Staffel (`berechneStaffelpreis`) und setzt für DTF den
 * MENGENPREIS-DECKEL darauf.
 *
 * MENGENPREIS-DECKEL (Festlegung 2026-11-26, Aufgabe „Staffelpreise sollen Sinn ergeben“): Jede Staffelstufe gilt für die GESAMTE
 * Bestellung. Springt der Stückpreis an einer Grenze um u → u − 1 €, kostet die Menge g der Grenze weniger als g − 1 Stück davor, sobald
 * u < g (z. B. 19 Stück 360,81 €, 20 Stück 359,80 €). Auf der ,99-Leiter ist ein Sprung mindestens 1 € – ein kleinerer Sprung ist nicht
 * darstellbar –, bei Stückpreisen von 20–40 € lässt sich das Ansteigen der Gesamtsumme also nur bis etwa 20–40 Stück halten; ab
 * der Grenze 50 Stück gäbe es sonst keinen Mengenrabatt mehr. Deshalb gilt:
 *
 *     Gesamtpreis(q) = kleinster Staffelpreis aller Mengen von q bis zur letzten Staffelgrenze
 *                    = min( Staffelpreis(q), Staffelpreis(g) für jede Staffelgrenze g > q ).
 *
 * Wer knapp unter einer Grenze bestellt, zahlt also höchstens den Preis der Grenzmenge (47 bis 49 Stück zum Preis von 50 – „genauso viel
 * für mehr Stück“). Folgen, die der Wächtertest (staffelMonoton.test.ts) für ALLE Modelle prüft: Der Gesamtpreis sinkt mit der Menge nie, der
 * Stückpreis steigt nie, und an den Grenzmengen selbst (3, 5, 10, 20, 50 … Stück) bleibt der reguläre Stufenpreis auf ,99 stehen. Nur in der
 * kurzen Zone VOR einer Grenze ist der Stückpreis Gesamtpreis ÷ Menge und endet nicht auf ,99; die Preisdetails weisen den Betrag als eigene
 * Zeile („Mengenpreis wie bei N Stück“, breakdown.mengenDeckelPerUnit, NEGATIV) aus. Alternative, die verworfen wurde: eine Untergrenze HINTER
 * der Grenze (50 Stück kosten so viel wie 49) – sie träfe genau die runden Bestellmengen 50, 100, 250, 500 und 1000 mit einem Aufschlag
 * und machte „ab 100 Stück 21,99 €“ bei 100 Stück falsch (Begründung und Zahlen: docs/kalkulationsmodell.md, Abschnitt 2026-11-26).
 *
 * Gilt NUR für DTF (Positionsstaffel ohne Stichaufpreis); die Stickerei rechnet unverändert.
 *
 * AKTION (`input.aktion`, config/aktion.ts): Ein zeitlich begrenzter Prozent-Rabatt kommt als LETZTER Schritt auf den fertigen Positionspreis
 * (siehe wendeAktionAn). Er verändert weder Staffel noch Deckel – beide rechnen mit dem regulären Preis, dadurch bleibt „größere Menge kostet nie
 * weniger Stück für Stück“ unberührt, und ohne Aktion ist das Ergebnis Cent für Cent das bisherige.
 */
export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  const quantity = Math.max(input.quantity, 1);
  return wendeAktionAn(berechneMitDeckel(input, quantity), quantity, input.aktion);
}

function berechneMitDeckel(input: PriceCalculationInput, quantity: number): PriceCalculationResult {
  const roh = berechneStaffelpreis(input, quantity);
  // Ein fehlerhafter Preis (unbekannter Baustein) ist ohnehin nicht verwendbar – dann kein Deckel und keine weiteren Rechnungen,
  // damit der Fehler nicht für jede Staffelgrenze erneut protokolliert wird.
  if (input.mengenDeckel === false || roh.hasErrors) return roh;
  const regeln = input.pricingRules;
  const dtfAktiv = isDtfPositionPricingActive(regeln, quantity);
  const stichAktiv = regeln.some((r) => r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity));
  if (!dtfAktiv || stichAktiv) return roh;

  // Niedrigster Staffelpreis aller späteren Staffelgrenzen (die kleinste Grenze gewinnt bei Gleichstand: dort endet die Zone).
  let deckel = roh.totalPrice;
  let aufMenge: number | null = null;
  for (const g of staffelgrenzen(regeln)) {
    if (g <= quantity) continue;
    // Nur Mengen, für die dieselbe DTF-Positionsstaffel gilt (Mengenfenster der Regeln): Ein anderes Preismodell ist kein Vergleichspreis.
    if (!isDtfPositionPricingActive(regeln, g) || regeln.some((r) => r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, g))) continue;
    const spaeter = berechneStaffelpreis(input, g);
    if (spaeter.hasErrors) return roh;
    if (spaeter.totalPrice < deckel - 0.004) {
      deckel = spaeter.totalPrice;
      aufMenge = g;
    }
  }
  if (aufMenge === null) return roh;

  const stueck = roundToCents(deckel / quantity);
  const deckelTotal = roundToCents(deckel - roh.totalPrice);
  const deckelJeStueck = roundToCents(stueck - roh.unitPrice);
  return {
    ...roh,
    unitPrice: stueck,
    totalPrice: roundToCents(deckel),
    breakdown: {
      ...roh.breakdown,
      savingsAmount: roundToCents(roh.breakdown.savingsAmount - deckelTotal),
      mengenDeckelTotal: deckelTotal,
      mengenDeckelPerUnit: deckelJeStueck,
      mengenDeckelAufMenge: aufMenge,
    },
  };
}

function berechneStaffelpreis(input: PriceCalculationInput, quantity: number): PriceCalculationResult {
  const { basePrice, elements, pricingRules } = input;
  // Die TATSÄCHLICHE Menge wird berechnet – kein Hochsetzen auf eine
  // Mindestmenge mehr (siehe MINIMUM_QUANTITY). `quantity` kommt von
  // calculatePrice() und ist bereits gegen 0/negativ abgesichert, damit
  // unten nicht durch null geteilt wird.
  const tier = getTierForQuantity(quantity);

  // Mengenrabatt auf den Veredelungsanteil (Fläche/Stichzahl) – je Regel
  // deckelbar (PricingRule.maxDiscountPercent): Der Stichaufpreis der
  // Stickerei darf auch bei großen Mengen nie unter die Fremdkosten des
  // Stickpartners fallen (siehe config/pricingRules.ts). Der Deckel gilt für
  // den GESAMTEN variablen Anteil, weil je Veredelungsart nur EIN variabler
  // Regeltyp aktiv ist (Fläche ODER Stichzahl, siehe getVariableCost).
  // Berücksichtigt werden nur Regeln, die tatsächlich in den Preis eingehen
  // (anwendbar UND – bei printView – auf einer genutzten Ansicht); der Wert
  // ist auf 0–100 begrenzt.
  const genutzteAnsichten = new Set(elements.map((el) => el.view));
  const rabattDeckel = pricingRules
    .filter(
      (r) =>
        r.maxDiscountPercent !== undefined &&
        (r.ruleType === 'per_1000_stitches' || r.ruleType === 'per_cm2') &&
        isRuleApplicable(r, quantity) &&
        (!r.printView || genutzteAnsichten.has(r.printView))
    )
    .reduce((min, r) => Math.min(min, Math.max(0, Math.min(100, r.maxDiscountPercent!))), Number.POSITIVE_INFINITY);
  const veredelungRabattProzent = Math.min(tier.veredelungDiscountPercent, rabattDeckel);

  // Positionsaufschlag nur, wenn TATSÄCHLICH mehrere unterschiedliche
  // Ansichten gleichzeitig bedruckt/bestickt werden (z.B. Vorderseite UND
  // Rücken). Nutzt der Kunde nur EINE Ansicht – egal welche, auch nur
  // Rücken oder nur ein Ärmel – entsteht kein zusätzlicher Rüstaufwand
  // gegenüber "nur eine Fläche", also auch kein Aufschlag.
  const distinctViewsOrdered = [...new Set(elements.map((el) => el.view))];
  const distinctViewCount = distinctViewsOrdered.length;
  const getEffectivePositionPrice = (view: PrintView) =>
    distinctViewCount > 1 ? getPositionPrice(view, pricingRules, quantity) : 0;

  // ── Regelauswertung über die Engine ─────────────────────────────────
  // Alle Beträge kommen aus den Preisregeln, ausgewertet von
  // lib/pricing/ruleEngine.ts. Ein neuer Regeltyp wird dort registriert und
  // wirkt hier automatisch – diese Funktion muss dafür nicht angefasst werden.
  const charges = evaluateRules(pricingRules, {
    elements,
    distinctViews: distinctViewsOrdered,
    quantity,
    billableAreaCm2: getBillableAreaCm2,
    chargePositionFees: distinctViewCount > 1,
  });

  const elementBaseFeeTotal = elements.reduce(
    (sum, el) => sum + getElementTypeBasePrice(el.type, el.view, pricingRules, quantity),
    0
  );
  const positionFeeTotal = elements.reduce((sum, el) => sum + getEffectivePositionPrice(el.view), 0);

  // Positionsgestaffelter Aufschlag (erste/zweite/weitere Ansicht) – fällt
  // je Stück GENAU EINMAL an, nicht je Element (siehe DTF_POSITION_TIERS
  // oben). Gilt für DTF und – seit 2026-09-03 – auch für Stickerei, die
  // darüber hinaus den Stichaufpreis aus getVariableCost() unten trägt. Ohne
  // aktive first_position/additional_position-Regeln bleiben alle drei
  // Preise 0, das Produkt bleibt dann unverändert.
  const dtfPositionPricingActive = isDtfPositionPricingActive(pricingRules, quantity);
  const stichRegelAktiv = pricingRules.some((r) => r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity));
  // DTF und Stickerei haben getrennte Positionstabellen (siehe STICKEREI_POSITION_TIERS): Mit Stichaufpreis gilt die der Stickerei.
  const dtfTier = dtfPositionPricingActive
    ? getPositionTier(quantity, stichRegelAktiv ? STICKEREI_POSITION_TIERS : DTF_POSITION_TIERS)
    : null;
  const erstePositionPreis = dtfTier?.erste ?? 0;
  const zweitePositionPreis = dtfTier?.zweite ?? 0;
  const weiterePositionPreis = dtfTier?.abDritte ?? 0;
  const positionTierTotal =
    distinctViewCount === 0
      ? 0
      : distinctViewCount === 1
        ? erstePositionPreis
        : distinctViewCount === 2
          ? erstePositionPreis + zweitePositionPreis
          : erstePositionPreis + zweitePositionPreis + weiterePositionPreis * (distinctViewCount - 2);

  const variableCostTotal =
    elements.reduce((sum, el) => sum + getVariableCost(el, pricingRules, quantity), 0) + positionTierTotal;

  const perElement = elements.map((el) => ({
    elementId: el.id,
    price:
      getElementTypeBasePrice(el.type, el.view, pricingRules, quantity) +
      getEffectivePositionPrice(el.view) +
      getVariableCost(el, pricingRules, quantity),
  }));

  // Dynamisch je tatsächlich genutzter Ansicht akkumulieren (offene View-IDs).
  // Früher fix auf front/back/sleeve_left/sleeve_right initialisiert – dabei
  // ging der Flächenpreis jeder anderen Ansicht (Tasche, Schürze, Kapuze)
  // still verloren. Siehe Optimierungs-Register O3.
  const areaPriceByView: Record<string, number> = {};
  for (const el of elements) {
    areaPriceByView[el.view] =
      (areaPriceByView[el.view] ?? 0) +
      getVariableCost(el, pricingRules, quantity) * (1 - veredelungRabattProzent / 100);
  }
  // Positionsgestaffelter Aufschlag PRO ANSICHT für die Anzeige: die zuerst
  // bedruckte Ansicht (Reihenfolge der platzierten Elemente) bekommt
  // erstePositionPreis, die zweite zweitePositionPreis, jede weitere ab der
  // dritten weiterePositionPreis – eine reine Anzeige-Zuordnung, der
  // GESAMTPREIS (positionTierTotal oben) ist davon unabhängig immer korrekt.
  // Bei DTF ist nur der Positionsanteil ungleich 0; bei Stickerei (seit
  // 2026-09-03) kommen Positionsanteil UND rabattierter Stichaufpreis
  // derselben Ansicht zusammen. Die Positionsstaffel ist bereits der
  // fertige Endpreis (siehe DTF_POSITION_TIERS) – hier kommt KEIN
  // Rabattfaktor mehr drauf.
  distinctViewsOrdered.forEach((view, i) => {
    const anteil = i === 0 ? erstePositionPreis : i === 1 ? zweitePositionPreis : weiterePositionPreis;
    if (anteil === 0) return;
    areaPriceByView[view] = (areaPriceByView[view] ?? 0) + anteil;
  });

  // Grundpreis + Grundgebühren + Positionsaufschlag = "fester" Anteil,
  // leicht rabattiert. Fläche/Stichzahl (Stickerei) = "variabler" Anteil,
  // steil rabattiert (siehe Kommentar bei QUANTITY_TIERS). Die DTF-
  // Positionsstaffel steckt rechnerisch zwar mit im "variablen" Anteil
  // (variableCostTotal), ist aber selbst bereits der fertige Preis und wird
  // deshalb vor der Rabattierung wieder herausgerechnet.
  const fixedPortion = basePrice + elementBaseFeeTotal + positionFeeTotal;

  // Grundpreis-Rabatt: DTF hat eine eigene Staffel (DTF_GRUNDPREIS_STAFFEL: Prozent ODER Mindest-Euro, der größere gilt).
  // Alles mit Stichaufpreis (Stickerei) und alles ohne Positionsstaffel bleibt bei QUANTITY_TIERS – unverändert.
  let baseDiscountPercent = tier.baseDiscountPercent;
  if (dtfPositionPricingActive && !stichRegelAktiv && fixedPortion > 0) {
    const stufe = getDtfGrundpreisStufe(quantity);
    const rabattEuro = Math.min(fixedPortion, Math.max((fixedPortion * stufe.prozent) / 100, stufe.mindestensEuro));
    baseDiscountPercent = (rabattEuro / fixedPortion) * 100;
  }
  const discountedFixed = fixedPortion * (1 - baseDiscountPercent / 100);
  const discountedVariable =
    (variableCostTotal - positionTierTotal) * (1 - veredelungRabattProzent / 100) + positionTierTotal;

  // EINMALIGE Kosten des Auftrags (z.B. Rüsten/Digitalisieren). Kommen
  // vollständig aus den Preisregeln – ohne konfigurierte Regel ist der Wert 0.
  const setupTotal = charges.orderOnce;

  // Zuschläge je Stück (Premiumgarn, Spezialfolie …) gehören in den festen
  // Anteil; einmalige Zuschläge (Express) stecken bereits in `orderOnce`.
  const surchargePerUnit = charges.perUnitFixed - elementBaseFeeTotal - positionFeeTotal;

  // Großformat-Zuschlag (nur DTF): Mehrkosten der Transferfolie für Motive über dem Standardformat, nach der ECHTEN flachen Fläche
  // (config/pricing/grossformat.ts). Kein Mengenrabatt – er deckt Materialkosten, die je Stück anfallen.
  const grossformatPerUnit =
    dtfPositionPricingActive && !stichRegelAktiv
      ? elements.reduce((sum, el, index) => {
          // Nach POSITION zugeordnet, nicht nach Element-ID (die kommt vom Client und könnte doppelt vergeben sein). Nie kleiner als gezeichnet.
          const echt = input.echteMasse?.[index];
          return sum + grossformatZuschlag(Math.max(echt?.breiteCm ?? 0, el.widthCm), Math.max(echt?.hoeheCm ?? 0, el.heightCm));
        }, 0)
      : 0;

  let unitPriceUndiscounted = fixedPortion + variableCostTotal + surchargePerUnit + grossformatPerUnit;
  let unitPriceDiscounted = discountedFixed + discountedVariable + surchargePerUnit + grossformatPerUnit;

  // Ladenpreis (Festlegung des Betreibers 2026-11-12, lib/pricing/ladenpreis.ts): Der Stückpreis, den die Kundschaft
  // sieht – INKLUSIVE anteiliger Rüstkosten –, wird kaufmännisch auf den NÄCHSTEN ,99-Betrag gerundet (auf oder ab, höchstens ±0,50 €).
  // Die Rundung greift VOR den Nachlässen (Verein, Gutschein, Aktion): Ein Nachlass bezieht sich so auf den
  // angezeigten Listenpreis und wirkt in voller Höhe. Der Rundungsbetrag steckt wie ein Preisbaustein im festen
  // Anteil; „Stückpreis × Menge = Gesamtpreis“ bleibt für die Kundschaft nachrechenbar.
  let rundungJeStueck = 0; // nur für die Anzeige der Preisdetails weitergereicht (breakdown.rundungPerUnit)
  if (input.ladenpreisRundung !== false) {
    const listenpreisRoh = unitPriceDiscounted + setupTotalVorab(charges.orderOnce, quantity);
    rundungJeStueck = aufNaechsten99(listenpreisRoh) - listenpreisRoh;
    unitPriceDiscounted += rundungJeStueck;
    // Auch der „ohne Mengenvorteil“-Vergleichspreis wird zum Ladenpreis, damit „Sie sparen“ stimmt.
    const vergleichRoh = unitPriceUndiscounted + setupTotalVorab(charges.orderOnce, quantity);
    unitPriceUndiscounted += aufNaechsten99(vergleichRoh) - vergleichRoh;
  }

  // Betrag vor Nachlässen merken, damit der Nachlass unten als eigener
  // Posten ausgewiesen werden kann.
  const vorNachlass = unitPriceDiscounted;

  // Nachlässe aus der Phase 'discount' (Vereins-/Geschäftskundenrabatt,
  // Aktionen, Gutscheine) – NACH den Zuschlägen, aber VOR der Menge.
  if (charges.discountPercent > 0) {
    unitPriceDiscounted *= 1 - Math.min(charges.discountPercent, 100) / 100;
  }
  if (charges.discountPerUnit > 0) {
    unitPriceDiscounted = Math.max(0, unitPriceDiscounted - charges.discountPerUnit);
  }

  // Nachlass als eigener, ausweisbarer Betrag – die Pipeline muss ihn als
  // eigenen Posten zeigen können, sonst stimmt die Aufschlüsselung nicht mit
  // dem berechneten Gesamtpreis überein.
  const nachlassJeStueck = vorNachlass - unitPriceDiscounted;

  const totalPrice = unitPriceDiscounted * quantity + setupTotal;
  const savingsAmount = (unitPriceUndiscounted - unitPriceDiscounted) * quantity;

  // Angezeigter Stückpreis INKLUSIVE anteiliger Rüstkosten – nur so sieht der
  // Kunde, dass sich eine größere Menge lohnt. Bei 1 Stück steckt die ganze
  // Einrichtung darin, bei 100 Stück ein Hundertstel.
  const effectiveUnitPrice = totalPrice / quantity;

  // Dieselbe Anwendbarkeitsprüfung wie in getVariableCost() – sonst meldete
  // die Anzeige einen Stich-/Flächenpreis, der (z.B. außerhalb eines
  // Mengenfensters) gar nicht berechnet wird.
  const stitchRule = pricingRules.find((r) => r.ruleType === 'per_1000_stitches' && isRuleApplicable(r, quantity));
  const areaRule = pricingRules.find((r) => r.ruleType === 'per_cm2' && isRuleApplicable(r, quantity));
  const totalEstimatedStitches = elements.reduce((sum, el) => sum + (el.estimatedStitches ?? 0), 0);
  // Auch die NÄCHSTE Staffel gedeckelt ausweisen – sonst verspräche die
  // Anzeige einen Rabatt, den der Deckel nie gewährt.
  const naechsteStaffel = getNextTier(quantity);
  const nextTier = naechsteStaffel
    ? { ...naechsteStaffel, veredelungDiscountPercent: Math.min(naechsteStaffel.veredelungDiscountPercent, rabattDeckel) }
    : null;

  // Rundung auf ,99 € für die „Preisdetails“ (reine Anzeige, ändert keinen Preis): Die Einzelposten stehen dort auf Cent gerundet; der Rundungs-
  // posten gleicht aus, damit die Summe der angezeigten Zeilen genau den angezeigten Stückpreis ergibt. Weicht der Ausgleich um mehr als 2 Cent
  // vom echten Rundungsbetrag ab (z. B. weil ein hier nicht angezeigter Zuschlag oder Nachlass im Preis steckt), gilt der echte Betrag.
  const rundungEcht = roundToCents(rundungJeStueck);
  const summeAngezeigterPosten =
    roundToCents(basePrice * (1 - baseDiscountPercent / 100)) +
    roundToCents(positionFeeTotal * (1 - baseDiscountPercent / 100)) +
    Object.values(areaPriceByView).reduce((summe, betrag) => summe + roundToCents(betrag), 0) +
    roundToCents(grossformatPerUnit) +
    roundToCents(setupTotal / quantity);
  const rundungAusgleich = roundToCents(roundToCents(effectiveUnitPrice) - summeAngezeigterPosten);
  const rundungPerUnit = Math.abs(rundungAusgleich - rundungEcht) <= 0.02 ? rundungAusgleich : rundungEcht;

  return {
    unitPrice: roundToCents(effectiveUnitPrice),
    totalPrice: roundToCents(totalPrice),
    hasErrors: charges.issues.length > 0,
    issues: charges.issues,
    breakdown: {
      basePrice: roundToCents(basePrice * (1 - baseDiscountPercent / 100)),
      elementsPrice: roundToCents(elementBaseFeeTotal + positionFeeTotal + variableCostTotal),
      perElement,
      elementBaseFeeTotal: roundToCents(elementBaseFeeTotal * (1 - baseDiscountPercent / 100)),
      positionFeeTotal: roundToCents(positionFeeTotal * (1 - baseDiscountPercent / 100)),
      areaPriceByView: Object.fromEntries(
        Object.entries(areaPriceByView).map(([view, betrag]) => [view, roundToCents(betrag)])
      ),
      areaPricePerCm2: areaRule?.price ?? 0,
      pricePer1000Stitches: stitchRule?.price ?? 0,
      isStitchBased: Boolean(stitchRule),
      isPositionBased: erstePositionPreis > 0 || zweitePositionPreis > 0,
      firstPositionPrice: erstePositionPreis,
      additionalPositionPrice: zweitePositionPreis,
      furtherPositionPrice: weiterePositionPreis,
      totalEstimatedStitches,
      // Auf eine Nachkommastelle gerundet, weil bei den festen Euro-Beträgen der DTF-Staffel ein krummer Prozentwert entsteht
      // (die Preise selbst rechnen mit dem ungerundeten Wert, damit Anteile und Summe zusammenpassen).
      baseDiscountPercent: Math.round(baseDiscountPercent * 10) / 10,
      // Der TATSÄCHLICH angewandte Satz (ggf. gedeckelt) – nicht der rohe
      // Staffelwert, sonst zeigte die Oberfläche einen Rabatt, den es nicht gibt.
      veredelungDiscountPercent: veredelungRabattProzent,
      savingsAmount: roundToCents(savingsAmount),
      nextTier,
      setupTotal: roundToCents(setupTotal),
      setupPerUnit: roundToCents(setupTotal / quantity),
      rundungPerUnit,
      surchargePerUnit: roundToCents(surchargePerUnit),
      grossformatPerUnit: roundToCents(grossformatPerUnit),
      discountPerUnit: roundToCents(nachlassJeStueck),
      // Setzt calculatePrice() nachträglich, wenn der Mengenpreis-Deckel wirkt (siehe dort).
      mengenDeckelTotal: 0,
      mengenDeckelPerUnit: 0,
      mengenDeckelAufMenge: null,
      // Setzt calculatePrice() nachträglich, wenn eine Aktion übergeben wurde (siehe wendeAktionAn).
      aktionProzent: 0,
      aktionTotal: 0,
      aktionPerUnit: 0,
    },
  };
}

/**
 * Aktionsrabatt (config/aktion.ts) auf das fertige Ergebnis einer Position – NACH Mengenstaffel und Mengenpreis-Deckel, auf den ganzen
 * Positionspreis (Textil + Veredelung + Einrichtung).
 *
 * Rundung: Rabattiert wird immer der GESAMTPREIS (auf Cent gerundet); der Stückpreis ist daraus abgeleitet (Gesamtpreis ÷ Menge, auf Cent). Damit
 * sind es exakt die Prozent auf den Betrag, den die Kundschaft zahlt, und die Zusage „eine größere Bestellung kostet nie weniger“ (Staffel und
 * Mengenpreis-Deckel, staffelMonoton.test.ts) bleibt auch mit Aktion bestehen – die Rundung ist monoton, rabattierte Einzelstückpreise mal Menge
 * wären es um einige Cent nicht. Folge: „Stückpreis × Menge“ kann um bis zu eine halbe Cent-Einheit je Stück vom Gesamtpreis abweichen; die
 * Anzeige weist das mit „≈“ aus. Die Summe der Posten (positionStage) gleicht den Rest über die Zeile „Rundung“ aus; es geht nie ein Cent verloren.
 */
function wendeAktionAn(roh: PriceCalculationResult, quantity: number, aktion: PriceCalculationInput['aktion']): PriceCalculationResult {
  const prozent = aktion ? Math.min(100, Math.max(0, aktion.prozent)) : 0;
  if (!(prozent > 0) || roh.hasErrors || !(roh.totalPrice > 0)) return roh;

  const neuGesamt = roundToCents(roh.totalPrice * (1 - prozent / 100));
  const neuStueck = roundToCents(neuGesamt / quantity);
  return {
    ...roh,
    unitPrice: neuStueck,
    totalPrice: neuGesamt,
    breakdown: {
      ...roh.breakdown,
      aktionProzent: prozent,
      aktionTotal: roundToCents(neuGesamt - roh.totalPrice),
      aktionPerUnit: roundToCents(neuStueck - roh.unitPrice),
    },
  };
}

/** Anteil der einmaligen Auftragskosten je Stück (steckt im angezeigten Stückpreis). */
function setupTotalVorab(orderOnce: number, quantity: number): number {
  return orderOnce / quantity;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
