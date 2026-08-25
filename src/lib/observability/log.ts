/**
 * ═══════════════════════════════════════════════════════════════════════
 * PROTOKOLLIERUNG – die einzige Stelle, die etwas ausgibt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kein `console.*` mehr im Projekt. Ein Wächter-Test schlägt an, sobald
 * irgendwo wieder eines auftaucht.
 *
 * ── Warum strukturiert ────────────────────────────────────────────────
 * Fragen wie „alle Bestellfehler der letzten Stunde" oder „wie oft trat das
 * auf?" lassen sich über Freitext nicht beantworten. Ausgegeben wird eine
 * Zeile JSON je Ereignis – von jeder Protokollansicht nach Feldern
 * filterbar.
 *
 * ── Warum die Bereinigung hier sitzt ──────────────────────────────────
 * Personenbezogene Daten gehören nicht ins Protokoll. Sich an über hundert
 * Aufrufstellen auf Disziplin zu verlassen, geht schief – irgendwann
 * schreibt jemand `${params}` in eine Meldung. Deshalb bereinigt diese
 * Funktion **jede** Ausgabe, bevor sie irgendwohin geht.
 *
 * ── Produktionsmodus ──────────────────────────────────────────────────
 * In Produktion erscheinen keine Stacktraces, keine internen Variablen und
 * keine Debug-Einträge. Ein Stacktrace verrät Dateipfade, Bibliotheks-
 * versionen und Codeaufbau – für eine Angreiferin wertvoll, für den Betrieb
 * entbehrlich, solange Kategorie, Ereignis und Kennung stimmen.
 */
import { aktuellerKontext, laufzeitMs } from './kontext';

/**
 * Fachliche Einordnung eines Ereignisses.
 *
 * Geschlossene Liste statt Freitext: Nur so lässt sich später nach
 * Kategorie filtern, ohne Zeichenketten zu durchsuchen.
 */
export type Kategorie =
  | 'AUTH'
  | 'ORDER'
  | 'PAYMENT'
  | 'UPLOAD'
  | 'STORAGE'
  | 'SUPPLIER'
  | 'EMAIL'
  | 'CRON'
  | 'RATE_LIMIT'
  | 'SYSTEM';

/**
 * Schweregrad.
 *
 * `DEBUG` erscheint ausschließlich in der Entwicklung und ist deshalb nicht
 * Teil der fachlichen Schweregrade – es beschreibt keinen Betriebszustand.
 */
export type Schwere = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/** Ab dieser Schwere wird zusätzlich in `system_ereignisse` geschrieben. */
export const PERSISTENZ_AB: Schwere = 'WARNING';

/** Vergleichbare Rangordnung der Schweregrade. Auch von ereignis.ts genutzt,
 *  damit es keine zweite Rangtabelle gibt, die aus dem Takt geraten könnte. */
export const RANG: Record<Schwere, number> = { DEBUG: 0, INFO: 1, WARNING: 2, ERROR: 3, CRITICAL: 4 };

function istProduktion(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Extrahiert eine lesbare Meldung aus einem geworfenen/gemeldeten Wert.
 *
 * Nicht jeder Fehler ist eine `Error`-Instanz: Resends `ErrorResponse` und
 * Supabases `PostgrestError` sind reine `{message, ...}`-Objekte. Ohne diese
 * Prüfung lieferte `String(f)` für sie `"[object Object]"` – die eigentliche
 * Fehlermeldung war dann unwiederbringlich verloren (siehe Vorfall
 * 2026-08-21: eine abgelehnte Bestellbestätigung ließ sich im Protokoll nicht
 * mehr nachvollziehen, weil genau das passierte).
 */
function nachrichtVon(f: unknown): string {
  if (f instanceof Error) return f.message;
  if (typeof f === 'object' && f !== null && 'message' in f) {
    const wert = (f as { message: unknown }).message;
    if (typeof wert === 'string') return wert;
  }
  return String(f);
}

/**
 * Entfernt personenbezogene und geheime Angaben aus einem Text.
 *
 * Bewusst grob und lieber einmal zu viel: Ein unkenntlich gemachter
 * Protokolleintrag ist ärgerlich, ein durchgerutschtes Datum ein Vorfall.
 */
export function bereinige(text: string): string {
  return (
    text
      // E-Mail-Adressen – die häufigste Gefahr, weil sie in fast jedem
      // Bestell- und Kontaktvorgang vorkommen.
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
      // IPv4 auf das Netz kürzen: „kommt das gehäuft aus einer Richtung?"
      // bleibt beantwortbar, die einzelne Person nicht identifizierbar.
      .replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b/g, '$1.x')
      // Bekannte Schlüsselformate.
      .replace(/\b(sk|pk|rk)_(test|live)_[A-Za-z0-9]+/g, '[schlüssel]')
      .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [token]')
      // Lange Zufallszeichenketten: Sitzungstoken, Signaturen, Schlüssel.
      // UUIDs (mit Bindestrichen) bleiben erhalten – sie sind Kennungen,
      // keine Geheimnisse, und für die Nachvollziehbarkeit unverzichtbar.
      .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[gekürzt]')
  );
}

/** Zusatzangaben. Werte werden bereinigt, Schlüssel bleiben. */
export type Felder = Record<string, string | number | boolean | null | undefined>;

function bereinigeFelder(felder: Felder): Felder {
  const sauber: Felder = {};
  for (const [schluessel, wert] of Object.entries(felder)) {
    if (wert === undefined) continue;
    sauber[schluessel] = typeof wert === 'string' ? bereinige(wert) : wert;
  }
  return sauber;
}

export interface LogEintrag {
  schwere: Schwere;
  kategorie: Kategorie;
  /** Maschinenlesbare Kennung, z.B. 'transaktion_fehlgeschlagen'. */
  ereignis: string;
  /** Für Menschen. Wird bereinigt. */
  meldung?: string;
  felder?: Felder;
  /** Nur in der Entwicklung ausgegeben. */
  fehler?: unknown;
}

/**
 * Schreibt einen Eintrag.
 *
 * Gibt das erzeugte Objekt zurück – für Tests und für den Aufrufer, der es
 * an die Ereignistabelle weiterreichen möchte.
 */
export function log(eintrag: LogEintrag): Record<string, unknown> {
  // DEBUG existiert in Produktion nicht.
  if (eintrag.schwere === 'DEBUG' && istProduktion()) return {};

  const kontext = aktuellerKontext();
  const zeile: Record<string, unknown> = {
    zeit: new Date().toISOString(),
    schwere: eintrag.schwere,
    kategorie: eintrag.kategorie,
    ereignis: eintrag.ereignis,
  };

  if (kontext) {
    zeile.anfrage = kontext.anfrageId;
    if (kontext.bestellnummer) zeile.bestellung = kontext.bestellnummer;
    zeile.dauer_ms = laufzeitMs();
  }
  if (eintrag.meldung) zeile.meldung = bereinige(eintrag.meldung);
  if (eintrag.felder) Object.assign(zeile, bereinigeFelder(eintrag.felder));

  // ── Fehlerdetails: nur in der Entwicklung ───────────────────────────
  // Ein Stacktrace verrät Dateipfade, Bibliotheksversionen und Codeaufbau.
  // In Produktion genügt die Fehlermeldung – bereinigt.
  if (eintrag.fehler) {
    const f = eintrag.fehler;
    zeile.fehler = bereinige(nachrichtVon(f));
    if (!istProduktion() && f instanceof Error && f.stack) {
      zeile.stack = f.stack;
    }
  }

  const ausgabe = JSON.stringify(zeile);
  if (RANG[eintrag.schwere] >= RANG.ERROR) console.error(ausgabe);
  else if (eintrag.schwere === 'WARNING') console.warn(ausgabe);
  else console.info(ausgabe);

  return zeile;
}

/** Kurzformen – sparen an über hundert Stellen jeweils eine Zeile. */
export const protokoll = {
  debug: (kategorie: Kategorie, ereignis: string, meldung?: string, felder?: Felder) =>
    log({ schwere: 'DEBUG', kategorie, ereignis, meldung, felder }),
  info: (kategorie: Kategorie, ereignis: string, meldung?: string, felder?: Felder) =>
    log({ schwere: 'INFO', kategorie, ereignis, meldung, felder }),
  warnung: (kategorie: Kategorie, ereignis: string, meldung?: string, felder?: Felder) =>
    log({ schwere: 'WARNING', kategorie, ereignis, meldung, felder }),
  fehler: (kategorie: Kategorie, ereignis: string, meldung?: string, fehler?: unknown, felder?: Felder) =>
    log({ schwere: 'ERROR', kategorie, ereignis, meldung, fehler, felder }),
  kritisch: (kategorie: Kategorie, ereignis: string, meldung?: string, fehler?: unknown, felder?: Felder) =>
    log({ schwere: 'CRITICAL', kategorie, ereignis, meldung, fehler, felder }),
};
