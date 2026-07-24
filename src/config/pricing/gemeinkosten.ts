/**
 * ═══════════════════════════════════════════════════════════════════════
 * GEMEINKOSTEN UND GEWINN – Bausteine der Verkaufspreisbildung
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Alles, was zwischen den direkten Kosten (Textil, Transfer, Versand,
 * Verpackung) und dem Verkaufspreis liegt.
 *
 * ── Abgrenzung zur Preispipeline ──────────────────────────────────────
 * Diese Datei gehört NICHT in `lib/pricing/`. Der Unterschied ist
 * grundsätzlich:
 *
 *   lib/pricing/  – was die Kundschaft ZAHLT. Jeder Posten erscheint auf
 *                   Rechnung und Bestätigung.
 *   hier          – wie wir zu diesem Preis KOMMEN. Interne Kalkulation.
 *                   Kein Posten davon steht je auf einer Kundenrechnung.
 *
 * Ein Gewinnaufschlag ist keine Rechnungsposition, sondern ein Bestandteil
 * des Preises. Diese Trennung sauber zu halten verhindert, dass interne
 * Kalkulationsgrößen versehentlich in Kundendokumenten landen.
 *
 * ── Stand der Werte (2026-07-22) ──────────────────────────────────────
 * Jeder Block trägt in seiner Beschreibung, woher sein Wert stammt. Drei
 * Fälle sind zu unterscheiden, und die Unterscheidung ist wichtig:
 *
 *   Angabe Betreiber – genannt und damit belastbar (Verpackung, Versand,
 *                      Ausschussquoten).
 *   Marktüblich      – NICHT gemessen, aus üblichen Konditionen gesetzt
 *                      (Zahlungsgebühren). Bei erster echter Abrechnung
 *                      ersetzen.
 *   Bewusst aus      – aktiv:false ist hier eine Entscheidung, kein
 *                      fehlender Wert (Retouren, Arbeitszeit).
 *
 * Blöcke, die weiterhin auf 0 und inaktiv stehen, sind schlicht unbekannt.
 * Sie sind Null, weil sie unbekannt sind – nicht, weil sie nicht anfielen.
 */

/**
 * Wie ein Kostenblock rechnerisch wirkt.
 *
 * Bewusst ein geschlossener Union-Typ: Kommt eine Art dazu, ohne dass die
 * Verarbeitung sie kennt, ist das ein Übersetzungsfehler – nicht ein
 * stillschweigend übersprungener Kostenblock. Dasselbe Vorgehen wie bei den
 * Preisregel-Handlern (`lib/pricing/ruleEngine.ts`).
 */
export type GemeinkostenArt =
  /** Anteil des Verkaufspreises, z.B. Zahlungsgebühr oder Gewinn. */
  | 'prozent_vom_verkaufspreis'
  /**
   * Risikoanteil: Der Umsatz fällt teilweise aus (Retoure, Ausschuss,
   * Reklamation). Wirkt rechnerisch wie ein Aufschlag, weil die verbleibenden
   * Aufträge den Ausfall mittragen müssen.
   */
  | 'risiko_prozent'
  /** Fester Betrag je Bestellung, unabhängig von der Stückzahl. */
  | 'betrag_je_bestellung'
  /** Fester Betrag je gefertigtem Stück. */
  | 'betrag_je_stueck'
  /**
   * Monatlicher Fixbetrag. Braucht zur Umlage eine Bezugsgröße – die
   * erwartete Zahl der Bestellungen je Monat. Ohne sie lässt sich ein
   * Monatsbetrag nicht auf eine Bestellung beziehen.
   */
  | 'fix_monatlich';

/**
 * Auf welcher Ebene ein Kostenblock entsteht.
 *
 * Festlegung des Betreibers vom 2026-07-22 und die wichtigste Unterscheidung
 * der ganzen Kalkulation:
 *
 *   produkt     Fällt für jedes gefertigte Stück an. Einkauf, Transfer,
 *               Stickgarn, Ausschuss. Verdoppelt sich mit der Menge.
 *
 *   bestellung  Fällt EINMAL an, gleichgültig wie viele Stück oder wie viele
 *               verschiedene Produkte in der Bestellung sind. Kundenversand,
 *               Verpackung, Zahlungsgebühr, Lieferantenversand.
 *
 * Warum das zählt: Bestellbezogene Kosten dürfen ein einzelnes Produkt nicht
 * künstlich verteuern. Bestellt jemand ein T-Shirt und einen Hoodie, wird der
 * Versand einmal getragen und nicht zweimal – und bei einer Sammelbestellung
 * über mehrere Kunden hinweg relativiert er sich weiter oder entfällt.
 */
export type Kostenebene = 'produkt' | 'bestellung';

/**
 * Wie ein bestellbezogener Kostenblock auf die Positionen fällt.
 *
 * Nur für `bestellung`-Blöcke von Bedeutung. Der Schlüssel ist Teil der
 * fachlichen Aussage, nicht der Technik: Versand nach Menge zu verteilen und
 * Zahlungsgebühren nach Wert ist eine Entscheidung, keine Formalie.
 */
export type Verteilungsschluessel =
  /** Jedes Stück trägt gleich viel. Passend für Versand und Verpackung. */
  | 'nach_menge'
  /** Teure Positionen tragen mehr. Passend für wertabhängige Gebühren. */
  | 'nach_wert'
  /** Jede Position trägt gleich viel, unabhängig von Menge und Wert. */
  | 'je_position';

/**
 * Auf welcher Ebene diese Kostenart entsteht.
 *
 * ABGELEITET, nicht am Block gepflegt: Ein zweites Feld könnte der `art`
 * widersprechen („je Stück" und zugleich „bestellbezogen"), und niemand
 * bemerkte es. Aus der Art folgt die Ebene eindeutig.
 */
export function kostenebene(art: GemeinkostenArt): Kostenebene {
  switch (art) {
    case 'betrag_je_stueck':
    case 'risiko_prozent':
      return 'produkt';
    case 'betrag_je_bestellung':
    case 'prozent_vom_verkaufspreis':
    case 'fix_monatlich':
      return 'bestellung';
  }
}

export interface Gemeinkostenblock {
  id: string;
  bezeichnung: string;
  art: GemeinkostenArt;
  /**
   * Wie dieser Block auf die Positionen einer Bestellung verteilt wird.
   * Nur bei `bestellung`-Ebene wirksam; ohne Angabe gilt `nach_menge`.
   */
  verteilung?: Verteilungsschluessel;
  /** Prozentsatz oder Eurobetrag, je nach `art`. 0 = unbekannt. */
  wert: number;
  /** false = fließt nicht in die Kalkulation ein. */
  aktiv: boolean;
  /** Wofür der Block steht und woran der Wert zu ermitteln wäre. */
  beschreibung: string;
}

/**
 * Bezugsgröße für die Umlage monatlicher Fixkosten.
 *
 * 0 = unbekannt. Solange sie fehlt, lassen sich `fix_monatlich`-Blöcke nicht
 * auf eine einzelne Bestellung umlegen – das ist kein Rechenfehler, sondern
 * eine fehlende Geschäftsangabe.
 */
export const ERWARTETE_BESTELLUNGEN_JE_MONAT = 0;

/**
 * Die Kostenblöcke, in der Reihenfolge der Kalkulation.
 *
 * Aufgenommen sind die vom Betreiber genannten Positionen. Weitere lassen
 * sich ergänzen, ohne die Verarbeitung anzufassen.
 */
export const GEMEINKOSTEN_BLOECKE: Gemeinkostenblock[] = [
  {
    id: 'verpackung',
    bezeichnung: 'Verpackung',
    art: 'betrag_je_bestellung',
    verteilung: 'nach_menge',
    wert: 0.5,
    aktiv: true,
    beschreibung:
      'Karton je Bestellung. Versandbeutel werden nicht verwendet; Klebeband und sonstiges Verbrauchsmaterial ' +
      'sind laut Betreiber vernachlässigbar und daher nicht eigens erfasst. Angabe Betreiber 2026-07-22.',
  },
  {
    id: 'versandkosten',
    bezeichnung: 'Versandkosten DHL',
    art: 'betrag_je_bestellung',
    verteilung: 'nach_menge',
    wert: 5.5,
    aktiv: true,
    beschreibung:
      'Was uns der Versand tatsächlich kostet. Die Kundschaft zahlt 6,90 € bzw. ab 75 € Bestellwert nichts – ' +
      'die Gegenrechnung erfolgt in der Auftragskalkulation, nicht hier. Angabe Betreiber 2026-07-22.',
  },
  {
    id: 'lieferantenversand',
    bezeichnung: 'Lieferantenversand (Textil)',
    art: 'betrag_je_bestellung',
    verteilung: 'nach_menge',
    wert: 4.9,
    aktiv: true,
    beschreibung:
      'Versand des Textil-Großhändlers, entfallend ab 150 € Warenwert. Fällt in der Anfangsphase je ' +
      'Kundenbestellung an, weil erst nach Kundeneingang bestellt wird. Der WERT hier ist nur der Höchstbetrag – ' +
      'ob und in welcher Höhe er tatsächlich anfällt, entscheidet `beschaffung.ts` anhand von Warenwert und ' +
      'Beschaffungsmodell. Bei Lagerhaltung entfällt er ganz. Festlegung des Betreibers 2026-07-22.',
  },
  {
    id: 'zahlungsgebuehr',
    bezeichnung: 'Zahlungsgebühren',
    art: 'prozent_vom_verkaufspreis',
    wert: 2.5,
    aktiv: true,
    beschreibung:
      'Mischsatz über PayPal, Kreditkarte und Klarna – auf Wunsch des Betreibers nicht je Zahlungsart getrennt. ' +
      'MARKTÜBLICHER WERT, nicht aus eigenen Abrechnungen gemessen: PayPal und Klarna liegen bei rund 2,5–3 %, ' +
      'Kartenzahlung darunter. Sobald echte Abrechnungen vorliegen, hier ersetzen.',
  },
  {
    id: 'zahlungsgebuehr_fix',
    bezeichnung: 'Zahlungsgebühr (Festbetrag)',
    art: 'betrag_je_bestellung',
    verteilung: 'nach_wert',
    wert: 0.35,
    aktiv: true,
    beschreibung:
      'Der Festbetrag je Vorgang, den alle drei Anbieter zusätzlich zum Prozentsatz berechnen. Bei kleinen ' +
      'Bestellungen fällt er stärker ins Gewicht als der Prozentsatz. MARKTÜBLICHER WERT, siehe zahlungsgebuehr.',
  },
  {
    id: 'retourenquote',
    bezeichnung: 'Retouren',
    art: 'risiko_prozent',
    wert: 0,
    aktiv: false,
    beschreibung:
      'BEWUSST AUSGESCHALTET, nicht unbekannt. Festlegung des Betreibers vom 2026-07-22: Es werden ausschließlich ' +
      'personalisierte Produkte verkauft, die vom Widerrufsrecht ausgenommen sind. Das Risiko wandert damit in ' +
      'den Ausschuss, der die Fehler der eigenen Fertigung abdeckt.',
  },
  {
    id: 'ausschuss_stick',
    bezeichnung: 'Ausschuss Stickerei',
    art: 'risiko_prozent',
    wert: 10,
    aktiv: true,
    beschreibung:
      'Fehlerquote beim Sticken (Fadenriss, Verzug, Fehlpositionierung). Deutlich höher als beim Druck, weil das ' +
      'Textil beim Sticken durchstochen und dabei unrettbar beschädigt wird. Angabe Betreiber 2026-07-22.',
  },
  {
    id: 'ausschuss_dtf',
    bezeichnung: 'Ausschuss DTF-Druck',
    art: 'risiko_prozent',
    wert: 2,
    aktiv: true,
    beschreibung:
      'Fehlerquote beim Transferdruck (Fehlpressung, Verzug, Farbabweichung). Niedriger als beim Sticken, weil ' +
      'der Transfer vor dem Pressen geprüft werden kann. Angabe Betreiber 2026-07-22.',
  },
  {
    id: 'reklamationen',
    bezeichnung: 'Reklamationen und Nachlieferungen',
    art: 'risiko_prozent',
    wert: 0,
    aktiv: false,
    beschreibung:
      'Kostenlose Nachfertigung oder Erstattung nach berechtigter Beanstandung. Getrennt von Retouren geführt, ' +
      'weil hier zusätzlich Material und Arbeit verloren gehen.',
  },
  {
    id: 'maschinenverschleiss',
    bezeichnung: 'Maschinenverschleiß',
    art: 'betrag_je_stueck',
    wert: 0,
    aktiv: false,
    beschreibung:
      'Abnutzung der Transferpresse (Heizplatte, Andruck). Betrifft NUR die Presse – die Transfers selbst werden ' +
      'eingekauft, dort entsteht kein Verschleiß bei uns. Aus Anschaffungspreis geteilt durch erwartete Pressvorgänge.',
  },
  {
    id: 'strom',
    bezeichnung: 'Strom',
    art: 'betrag_je_stueck',
    wert: 0,
    aktiv: false,
    beschreibung:
      'Energieverbrauch der Transferpresse je Pressvorgang. Aus Leistungsaufnahme, Pressdauer und Arbeitspreis ' +
      'zu berechnen – der Grundverbrauch des Betriebs gehört dagegen unter fix_monatlich.',
  },
  {
    id: 'software',
    bezeichnung: 'Software und Dienste',
    art: 'fix_monatlich',
    wert: 0,
    aktiv: false,
    beschreibung: 'Laufende Lizenzen und Abonnements (Grafik, Buchhaltung, E-Mail-Versand).',
  },
  {
    id: 'hosting',
    bezeichnung: 'Hosting und Infrastruktur',
    art: 'fix_monatlich',
    wert: 0,
    aktiv: false,
    beschreibung: 'Betrieb des Shops: Server, Datenbank, Dateispeicher, Domain.',
  },
  {
    id: 'versicherungen',
    bezeichnung: 'Versicherungen',
    art: 'fix_monatlich',
    wert: 0,
    aktiv: false,
    beschreibung: 'Betriebshaftpflicht und weitere laufende Versicherungen.',
  },
  {
    id: 'arbeitszeit',
    bezeichnung: 'Arbeitszeit',
    art: 'betrag_je_stueck',
    wert: 0,
    aktiv: false,
    beschreibung:
      'BEWUSST AUSGESCHALTET. Festlegung des Betreibers vom 2026-07-22: Die Produktion läuft neben der regulären ' +
      'Tätigkeit, die Arbeitszeit soll die Preise nicht treiben. Als interner Referenzwert gelten 30 €/Stunde ' +
      '(siehe STUNDENSATZ_REFERENZ) – nur zur Beurteilung, ob ein Auftrag den Aufwand lohnt, nie im Preis.',
  },
  {
    id: 'gewinn',
    bezeichnung: 'Unternehmerischer Gewinn',
    art: 'prozent_vom_verkaufspreis',
    wert: 25,
    aktiv: true,
    beschreibung:
      'KEIN Kostenblock, sondern das Ziel der Kalkulation. Prozentual und nicht als fester Betrag – ausdrückliche ' +
      'Festlegung des Betreibers, damit teure Produkte nicht denselben Aufschlag tragen wie günstige. ' +
      'Der Satz von 25 % ist die HAUPT-STELLSCHRAUBE der gesamten Preisbildung und noch nicht bestätigt: ' +
      'Er wurde so gewählt, dass die Preise ungefähr auf Shirtinator-Niveau landen. Hier drehen, nicht an Produktpreisen.',
  },
];

/**
 * Interner Stundensatz – rein zur Beurteilung, NICHT Teil der Preisbildung.
 *
 * Der Betreiber fertigt neben der regulären Tätigkeit und möchte die
 * Arbeitszeit ausdrücklich nicht in die Preise einrechnen. Der Wert erlaubt
 * trotzdem die Frage „lohnt dieser Auftrag den Aufwand?" zu beantworten.
 */
export const STUNDENSATZ_REFERENZ = 30;

/** Ein einzelner Block, oder undefined. */
export function gemeinkostenblock(id: string): Gemeinkostenblock | undefined {
  return GEMEINKOSTEN_BLOECKE.find((b) => b.id === id);
}

/** Nur die Blöcke, die tatsächlich in die Kalkulation einfließen. */
export function aktiveGemeinkosten(): Gemeinkostenblock[] {
  return GEMEINKOSTEN_BLOECKE.filter((b) => b.aktiv && b.wert !== 0);
}

/**
 * Sind Gemeinkosten hinterlegt?
 *
 * Solange das false ist, bildet jede Kalkulation nur die DIREKTEN Kosten ab
 * – ein Verkaufspreis daraus deckt Zahlungsgebühren, Ausfälle, laufende
 * Kosten und Gewinn nicht.
 */
export function gemeinkostenHinterlegt(): boolean {
  return aktiveGemeinkosten().length > 0;
}
