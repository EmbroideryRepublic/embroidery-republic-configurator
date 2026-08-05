/**
 * Echte Kundenstimmen und Referenzen – einzige Quelle.
 *
 * ── Nur Echtes, niemals Platzhalter ───────────────────────────────────
 * Diese Listen sind bewusst leer. Es werden ausschließlich **echte**,
 * ausdrücklich freigegebene Bewertungen und Referenzen eingetragen – keine
 * erfundenen Stimmen, keine Beispiel-Logos. Solange eine Liste leer ist,
 * blendet sich der zugehörige Abschnitt auf der Startseite vollständig aus
 * (siehe `components/shop/Kundenstimmen.tsx`). So entsteht nie ein leerer
 * „Was Kunden sagen"-Block und keine Falschangabe in den strukturierten Daten.
 *
 * ── So werden echte Daten ergänzt ─────────────────────────────────────
 * 1. Nach Auslieferung um eine Bewertung bitten (Bestell-Follow-up).
 * 2. Mit schriftlicher Erlaubnis hier eintragen (Name/Rolle wie freigegeben).
 * 3. Für Logo-Referenzen echte Dateien unter `public/referenzen/` ablegen.
 * Sobald mindestens ein Eintrag existiert, erscheinen Abschnitt und – bei
 * Bewertungen mit Sternwert – die aggregierte Bewertung automatisch.
 */

export interface Kundenstimme {
  /** Name wie freigegeben (z. B. „M. Keller" oder voller Name mit Erlaubnis). */
  autor: string;
  /** Rolle/Organisation, optional (z. B. „Vereinsvorstand, TuS Köln"). */
  rolle?: string;
  /** Der freigegebene Wortlaut. */
  text: string;
  /** Sternwert 1–5, optional. Nur setzen, wenn echt erhoben. */
  bewertung?: number;
}

export interface Referenz {
  /** Name der Organisation, wie freigegeben. */
  name: string;
  /** Pfad zu einem echten Logo unter public/referenzen/, optional. */
  logo?: string;
}

/** Echte, freigegebene Kundenstimmen. Leer, bis welche vorliegen. */
export const KUNDENSTIMMEN: Kundenstimme[] = [];

/** Echte Referenzkunden. Leer, bis welche vorliegen. */
export const REFERENZEN: Referenz[] = [];
