/**
 * Besucherzähler – reine Hilfen für die Anzeige im Adminbereich (testbar,
 * ohne Datenbank und ohne React).
 */
import { zahl } from '@/lib/format';

export interface Achsenskala {
  /** Oberer Rand der Zeichenfläche – immer ein Vielfaches von `schritt`. */
  obergrenze: number;
  schritt: number;
  /** Beschriftete Marken von 0 bis `obergrenze` (höchstens 5). */
  marken: number[];
}

/**
 * Achse für ein Balkendiagramm mit ganzzahligen Werten: ein Schritt aus
 * 1 · 2 · 5 × 10ⁿ, bei dem höchstens vier Abschnitte entstehen. Jede Marke ist
 * eine ganze Zahl (Besucher kommen nicht zur Hälfte) und jede beschriftete
 * Marke liegt tatsächlich auf der Achse.
 */
export function achsenSkala(hoechsterWert: number): Achsenskala {
  const m = Math.max(1, Math.ceil(Number.isFinite(hoechsterWert) ? hoechsterWert : 1));
  let schritt = 1;
  for (let zehner = 1; ; zehner *= 10) {
    const passend = [1, 2, 5].map((f) => f * zehner).find((s) => Math.ceil(m / s) <= 4);
    if (passend) {
      schritt = passend;
      break;
    }
  }
  const obergrenze = Math.ceil(m / schritt) * schritt;
  return {
    obergrenze,
    schritt,
    marken: Array.from({ length: obergrenze / schritt + 1 }, (_, i) => i * schritt),
  };
}

/** `2026-10-08` → `08.10.` (reine Zeichenfolge, keine Zeitzonenrechnung). */
export function kurzesDatum(tag: string): string {
  const [, monat, tagImMonat] = tag.split('-');
  return monat && tagImMonat ? `${tagImMonat}.${monat}.` : tag;
}

/** `2026-10-08` → `08.10.2026`. */
export function langesDatum(tag: string): string {
  const [jahr, monat, tagImMonat] = tag.split('-');
  return jahr && monat && tagImMonat ? `${tagImMonat}.${monat}.${jahr}` : tag;
}

/** Anteil in Prozent mit einer Nachkommastelle, z.B. „12,5 %"; ohne Gesamtmenge „–". */
export function anteilText(teil: number, gesamt: number): string {
  if (!(gesamt > 0)) return '–';
  return `${zahl(Math.round((teil / gesamt) * 1000) / 10, 1)} %`;
}

/** Lesbarer Name einer Seite für die Auswertung. */
export function seitenName(pfad: string): string {
  return pfad === '/' ? 'Startseite' : pfad;
}
