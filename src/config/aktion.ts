/**
 * Preisaktionen des Shops (zeitlich begrenzte Prozent-Rabatte auf ALLE Positionen).
 *
 * EINZIGE Quelle für Zeitraum, Satz und Code einer Aktion. Aktuell: die Black Week 2026 – 10 % auf alle Produkte bis einschließlich 15.12.2026.
 *
 * ── So wirkt die Aktion ───────────────────────────────────────────────────────────────────────────────────────────────
 * • Der Rabatt wird im Preiskern (lib/pricing/calculatePrice.ts, Eingabe `aktion`) auf den Gesamtpreis JEDER Position gerechnet – also auf
 *   Textil, Veredelung und Einrichtung, nicht auf den Versand. Er steckt damit in den Positionspreisen von Konfigurator, Warenkorb, Server,
 *   Bestellung und Rechnung; die Versandermittlung der Rechnung („Endsumme minus Positionen“) bleibt unverändert richtig.
 * • Der Code „BLACK10“ wird NIE eingegeben: Er ist die sichtbare Bezeichnung des automatisch gewährten Rabatts (Warenkorb, Preisdetails).
 *   Es gibt bewusst keine Eingabefelder und keinen Gutscheinmechanismus – nichts, was sich umgehen, verpassen oder mehrfach einlösen ließe.
 * • Der Server entscheidet (orders.ts übergibt `aktuelleAktion()` an `priceCart`); die Anzeige im Browser rechnet mit derselben Funktion und
 *   zeigt dadurch denselben Betrag. Ohne Übergabe rechnet jede Preisfunktion OHNE Aktion – so bleiben Tests und statische Preisbeispiele
 *   (SEO-Seiten) unabhängig vom Datum.
 *
 * ── Zeitraum ──────────────────────────────────────────────────────────────────────────────────────────────────────────
 * Berliner Zeit. Im ganzen Zeitraum gilt Winterzeit (MEZ = UTC+1), deshalb stehen die Grenzen mit festem Versatz. `ende` ist ABSCHLIESSEND
 * (exklusiv): die Aktion läuft bis zum Ablauf des 15.12.2026, also bis 00:00 Uhr am 16.12.2026.
 *
 * Rechtlicher Hinweis (Preisangabenverordnung § 11, 30-Tage-Tiefstpreis): Der Rabatt wird als Prozentsatz auf den Preis im Shop beworben, es werden
 * keine durchgestrichenen „Statt-Preise“ ausgewiesen. Die Preise wurden am 12./13.11. und 18.11.2026 geändert; ob ein Sonderfall mit
 * Tiefstpreis-Angabe nötig ist, sollte der Betreiber vor dem Start rechtlich prüfen lassen (docs/aktion-black-week.md).
 */

export interface PreisAktion {
  /** Stabile Kennung (Tests, Auswertung). */
  id: string;
  /** Name für Überschriften: „Black Week“. */
  name: string;
  /** Sichtbarer Code, der im Warenkorb als automatisch angewendet erscheint. Wird nie eingegeben. */
  code: string;
  /** Rabattsatz in Prozent (0–100) auf den Gesamtpreis jeder Position. */
  prozent: number;
  /** Beginn (einschließlich), ISO 8601 mit Zeitzonen-Versatz. */
  beginn: string;
  /** Ende (ausschließlich), ISO 8601 mit Zeitzonen-Versatz. */
  ende: string;
  /** Letzter Aktionstag zum Anzeigen: „15.12.2026“. */
  letzterTag: string;
  /** Kurzform für enge Stellen: „15.12.“. */
  letzterTagKurz: string;
}

export const BLACK_WEEK_2026: PreisAktion = {
  id: 'black-week-2026',
  name: 'Black Week',
  code: 'BLACK10',
  prozent: 10,
  // 27.11.2026 (Black Friday) 00:00 Uhr Berliner Zeit
  beginn: '2026-11-27T00:00:00+01:00',
  // bis einschließlich 15.12.2026 → Ende ist der 16.12.2026, 00:00 Uhr
  ende: '2026-12-16T00:00:00+01:00',
  letzterTag: '15.12.2026',
  letzterTagKurz: '15.12.',
};

/** Alle Aktionen, die der Shop kennt. Überschneiden sich zwei, gilt die mit dem höheren Satz (nie addiert). */
export const PREIS_AKTIONEN: readonly PreisAktion[] = [BLACK_WEEK_2026];

/** Läuft die Aktion zum Zeitpunkt `jetzt`? Beginn einschließlich, Ende ausschließlich. */
export function istAktionAktiv(aktion: PreisAktion, jetzt: Date = new Date()): boolean {
  const t = jetzt.getTime();
  if (!Number.isFinite(t)) return false;
  return t >= new Date(aktion.beginn).getTime() && t < new Date(aktion.ende).getTime();
}

/**
 * Die zum Zeitpunkt `jetzt` gültige Aktion – oder null. Zwei gleichzeitige Aktionen werden NICHT addiert: Es gilt die mit dem höheren Satz.
 * Aufrufer, die einen Preis zu einem bestimmten Zeitpunkt nachrechnen (z. B. eine bestehende Bestellung), übergeben diesen Zeitpunkt.
 */
export function aktuelleAktion(jetzt: Date = new Date()): PreisAktion | null {
  let beste: PreisAktion | null = null;
  for (const a of PREIS_AKTIONEN) {
    if (!istAktionAktiv(a, jetzt)) continue;
    if (beste === null || a.prozent > beste.prozent) beste = a;
  }
  return beste;
}

/** Ganze Tage bis zum Ende der Aktion (aufgerundet, mindestens 0). Für „noch X Tage“. */
export function verbleibendeTage(aktion: PreisAktion, jetzt: Date = new Date()): number {
  const rest = new Date(aktion.ende).getTime() - jetzt.getTime();
  if (!Number.isFinite(rest) || rest <= 0) return 0;
  return Math.ceil(rest / 86_400_000);
}
