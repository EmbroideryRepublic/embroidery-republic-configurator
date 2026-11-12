/**
 * Meta-Beschreibung der Produktübersicht (/produkt).
 *
 * Aus den tatsächlich vertretenen Produktarten gebaut (neue Produktgruppe → erscheint von selbst). Mit der Kinderbekleidung wurde die
 * Liste so lang, dass die Beschreibung 168 Zeichen erreichte – Google schneidet ab rund 160 ab. Deshalb gilt ein Zeichenbudget: passt
 * der volle Satz nicht, entfällt „etablierter Marken“; passt auch das nicht, wird am Wortende gekürzt.
 *
 * Solange die Stickerei pausiert ist (Betreiberschalter, config/bestellweg.ts), verspricht die Beschreibung nur DTF-Transferdruck.
 */
import { kuerzenAufLaenge } from './kuerzen';

export const BESCHREIBUNG_MAX = 160;

/** „A, B und C“ aus einer Liste. */
export function listeMitUnd(items: string[]): string {
  if (items.length === 0) return 'Produkte';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]!}`;
}

export function shopBeschreibung(artenPlural: string[], stickereiVerfuegbar: boolean): string {
  const liste = listeMitUnd(artenPlural);
  const verfahren = stickereiVerfuegbar ? 'mit DTF-Transferdruck oder Stickerei veredelt' : 'mit DTF-Transferdruck veredelt';
  const voll = `${liste} etablierter Marken – ${verfahren}, ab 1 Stück.`;
  if (voll.length <= BESCHREIBUNG_MAX) return voll;
  const kurz = `${liste} – ${verfahren}, ab 1 Stück.`;
  return kuerzenAufLaenge(kurz, BESCHREIBUNG_MAX);
}
