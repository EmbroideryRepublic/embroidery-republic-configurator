/**
 * ZENTRALE Zeitsteuerung des Bestellprozesses.
 *
 * Jeder zeitgesteuerte Vorgang rund um eine Bestellung liest seine Frist
 * ausschließlich hier – nirgends sonst steht eine Dauer im Code. Eine
 * Änderung an dieser Datei wirkt damit überall gleichzeitig: Storno-Seite,
 * E-Mail-Texte, Adminfilter, Token-Gültigkeit.
 *
 * ── Warum eine Frist und nicht ein Statusfeld ──────────────────────────
 * Der Zustand einer Bestellung wird IMMER aus `created_at` + Frist
 * berechnet, nie gespeichert und nie von einem Job umgeschaltet. Dadurch
 * gibt es keinen Hintergrundprozess, der ausfallen könnte, und keinen
 * gespeicherten Zustand, der von der Realität abweichen könnte.
 *
 * ── Zeitzonen ─────────────────────────────────────────────────────────
 * Alle Berechnungen laufen auf absoluten Zeitstempeln (UTC-basiert, wie
 * `timestamptz` in Postgres). Die Anzeige beim Kunden ist reine
 * Information – ob eine Stornierung zulässig ist, entscheidet
 * AUSSCHLIESSLICH der Server.
 */

const MINUTE = 60 * 1000;
const STUNDE = 60 * MINUTE;

/**
 * Wie lange nach Bestelleingang der Kunde selbst stornieren darf.
 *
 * Dieser Wert bestimmt zugleich:
 *  - ab wann die Bestellung im Adminbereich erscheint,
 *  - wann die interne Benachrichtigung versendet wird,
 *  - ab wann Lieferantenprozesse überhaupt starten dürfen.
 *
 * Er steht so auch in den AGB (§ Stornierung) – eine Änderung hier
 * erfordert eine Anpassung des Rechtstextes.
 */
export const STORNOFRIST_MS = 2 * STUNDE;

/**
 * Gültigkeit des signierten Storno-/Bestellansicht-Tokens.
 *
 * BEWUSST deutlich länger als die Stornofrist: Die Seite bleibt auch nach
 * Fristablauf erreichbar und zeigt dann die Bestelldetails ohne
 * Storno-Möglichkeit. Ein „toter Link" in einer alten E-Mail wäre für den
 * Kunden ärgerlich und würde Supportaufwand erzeugen.
 *
 * Ob storniert werden DARF, hängt niemals an dieser Gültigkeit, sondern
 * immer an STORNOFRIST_MS gegen `created_at`.
 */
export const BESTELLANSICHT_TOKEN_GUELTIGKEIT_MS = 90 * 24 * STUNDE;

/**
 * Verzögerung der INTERNEN Benachrichtigung an den Betreiber.
 *
 * Identisch zur Stornofrist: Der Betreiber soll nicht über Bestellungen
 * informiert werden, die Minuten später storniert werden. Als eigene
 * Konstante geführt, damit beide Werte später unabhängig einstellbar sind.
 */
export const INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS = STORNOFRIST_MS;

/** Ende der Stornofrist einer Bestellung. */
export function stornofristEndet(createdAt: Date | string): Date {
  const start = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return new Date(start.getTime() + STORNOFRIST_MS);
}

/**
 * Darf der Kunde diese Bestellung JETZT noch selbst stornieren?
 *
 * `jetzt` ist injizierbar, damit die Randfälle (eine Sekunde vor/nach
 * Ablauf) testbar sind – produktiv wird immer die Serverzeit genutzt.
 */
export function stornofristLaeuftNoch(createdAt: Date | string, jetzt: Date = new Date()): boolean {
  return jetzt.getTime() < stornofristEndet(createdAt).getTime();
}

/**
 * Ist die Bestellung so weit, dass sie bearbeitet werden darf? Genau dann
 * erscheint sie im Adminbereich, geht die interne Benachrichtigung raus und
 * dürfen Lieferantenprozesse starten.
 */
export function bearbeitungFreigegeben(createdAt: Date | string, jetzt: Date = new Date()): boolean {
  return !stornofristLaeuftNoch(createdAt, jetzt);
}

/** Verbleibende Zeit in Millisekunden (0, wenn abgelaufen). Nur für die Anzeige. */
export function verbleibendeStornozeitMs(createdAt: Date | string, jetzt: Date = new Date()): number {
  return Math.max(0, stornofristEndet(createdAt).getTime() - jetzt.getTime());
}
