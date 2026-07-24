/**
 * ═══════════════════════════════════════════════════════════════════════
 * BETRAGSERMITTLUNG FÜR EINE ZAHLUNG – reine Regel, keine Nebenwirkung
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Grundsatz: **Der Client übermittelt niemals einen Betrag.** Er nennt
 * nur die Bestellung. Was zu zahlen ist, entsteht ausschließlich hier – aus
 * dem, was die Preispipeline berechnet, geprüft gegen das, was bei der
 * Bestellung gespeichert wurde.
 *
 * ── Warum beides und nicht nur eines ──────────────────────────────────
 * Nur der gespeicherte Betrag: Ein Fehler beim Anlegen bliebe unbemerkt und
 * würde eingezogen.
 * Nur die Neuberechnung: Ändert sich ein Katalogpreis, während der
 * Bezahlvorgang läuft, zahlt die Kundschaft plötzlich etwas anderes als
 * bestätigt.
 *
 * Deshalb: beides ermitteln, vergleichen – und bei Abweichung **gar nichts
 * tun**. Stillschweigend den niedrigeren Betrag zu nehmen wäre ein Verlust,
 * den höheren eine Preisangabe, die niemand gesehen hat. Eine ehrliche
 * Unterbrechung ist besser als beides. Dasselbe Prinzip wie `blocked` in der
 * Preispipeline: blockieren statt raten.
 */

/** Toleranz beim Vergleich: ein einziger Cent, für Rundungsdifferenzen. */
export const TOLERANZ_CENT = 1;

/**
 * Euro-Betrag in ganze Cent.
 *
 * ── Warum der Umweg über `toFixed(2)` ────────────────────────────────
 * Nachgemessen, nicht angenommen:
 *
 *   • Für Beträge mit ZWEI Nachkommastellen – also alles, was die
 *     Preispipeline über `roundCents` liefert – sind
 *     `Math.round(euro * 100)` und der Weg über `toFixed(2)` identisch.
 *     Geprüft für 0 bis 1000 € in Cent-Schritten: null Abweichungen.
 *
 *   • Erst ab drei Nachkommastellen gehen sie auseinander, und dort ist
 *     `toFixed` das genauere Verfahren. Beispiel 0,015 €: der tatsächlich
 *     gespeicherte Wert ist 0,014999…, korrekt sind also 1 Cent.
 *     `Math.round(0.015 * 100)` liefert dagegen 2.
 *
 * Der Umweg bringt im Regelbetrieb somit nichts – er kostet aber auch
 * nichts und deckt den Fall ab, dass hier je ein ungerundeter Betrag
 * ankommt. Bei Geld ist das die richtige Richtung, in der man irrt.
 *
 * Wirft bei unbrauchbaren Eingaben statt still 0 zu liefern – ein Betrag von
 * 0 € wäre der denkbar schlechteste Standardwert für eine Zahlung.
 */
export function euroZuCent(euro: number): number {
  if (!Number.isFinite(euro)) {
    throw new Error(`euroZuCent: „${euro}" ist kein gültiger Betrag.`);
  }
  if (euro < 0) {
    throw new Error(`euroZuCent: negativer Betrag (${euro}) – Erstattungen laufen über einen eigenen Weg.`);
  }
  return Math.round(Number(euro.toFixed(2)) * 100);
}

/** Ganze Cent zurück in Euro – für Anzeige und Protokoll. */
export function centZuEuro(cent: number): number {
  return Math.round(cent) / 100;
}

export type BetragsPruefung =
  | { ok: true; betragCent: number }
  | {
      ok: false;
      /** Für die Kundschaft verständlich. */
      meldung: string;
      /** Für Protokoll und Fehlersuche. */
      grund: string;
      erwartetCent: number;
      gespeichertCent: number;
    };

export interface BetragsPruefungEingabe {
  /** Von der Preispipeline JETZT berechneter Gesamtbetrag in Euro. */
  neuBerechnetEuro: number;
  /** Bei der Bestellung gespeicherter Gesamtbetrag in Euro (`orders.total_price`). */
  gespeichertEuro: number;
}

/**
 * Entscheidet, ob und mit welchem Betrag eine Zahlung eröffnet werden darf.
 *
 * Rein: kein Datenbankzugriff, keine Uhrzeit, kein Zufall. Beide Beträge
 * bringt der Aufrufer mit – dadurch ist diese Entscheidung vollständig
 * testbar und an jeder Stelle gleich.
 */
export function pruefeZahlbetrag({ neuBerechnetEuro, gespeichertEuro }: BetragsPruefungEingabe): BetragsPruefung {
  let erwartetCent: number;
  let gespeichertCent: number;
  try {
    erwartetCent = euroZuCent(neuBerechnetEuro);
    gespeichertCent = euroZuCent(gespeichertEuro);
  } catch (fehler) {
    return {
      ok: false,
      meldung: 'Der Zahlbetrag konnte nicht ermittelt werden. Bitte kontaktieren Sie uns – wir klären das persönlich.',
      grund: fehler instanceof Error ? fehler.message : String(fehler),
      erwartetCent: 0,
      gespeichertCent: 0,
    };
  }

  // Eine Zahlung über 0 € ist kein Grenzfall, sondern immer ein Fehler:
  // entweder ist der Warenkorb leer oder die Berechnung ist schiefgegangen.
  if (erwartetCent <= 0) {
    return {
      ok: false,
      meldung: 'Für diese Bestellung lässt sich kein Zahlbetrag ermitteln. Bitte stellen Sie den Warenkorb neu zusammen.',
      grund: `Berechneter Betrag ist ${erwartetCent} Cent.`,
      erwartetCent,
      gespeichertCent,
    };
  }

  if (Math.abs(erwartetCent - gespeichertCent) > TOLERANZ_CENT) {
    return {
      ok: false,
      meldung:
        'Der Preis dieser Bestellung hat sich zwischenzeitlich geändert. ' +
        'Aus Sicherheitsgründen wurde die Zahlung nicht gestartet – bitte kontaktieren Sie uns kurz, wir klären das persönlich.',
      grund:
        `Neuberechnung (${erwartetCent} Cent) weicht vom gespeicherten Bestellbetrag ` +
        `(${gespeichertCent} Cent) ab – Zahlung nicht eröffnet.`,
      erwartetCent,
      gespeichertCent,
    };
  }

  // Maßgeblich ist der GESPEICHERTE Betrag: Das ist der, den die Kundschaft
  // bestätigt hat und der in der Bestellbestätigung steht. Innerhalb der
  // Toleranz von einem Cent gilt er, nicht die Neuberechnung.
  return { ok: true, betragCent: gespeichertCent };
}
