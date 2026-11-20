/**
 * Zwischenablage für große Logo-Dateien – die Serverseite.
 *
 * Warum und wie: config/upload.ts. Kurz: Vercel nimmt je Funktionsaufruf höchstens 4,5 MB Anfragekörper an, große Dateien kommen deshalb in
 * Teilen (POST /api/upload/teil) und liegen bis zur Bestellung unter `staging/<Tag>/<Ticket>/<Nr>.part`.
 *
 * Sicherheit:
 *  • Teile werden nur unter einem frischen Tag (heute/gestern) und mit einer gültigen UUID als Ticket angenommen; Pfade bestehen
 *    ausschließlich aus Werten, die hier streng geprüft werden.
 *  • Beim Zusammensetzen zählt nur der Verweis aus der Bestellung: Teilzahl, Teilgrößen und Gesamtgröße müssen stimmen, danach läuft die
 *    Datei durch dieselbe Prüfung wie jede andere (pruefeBytes: Größe, PNG-Signatur, Abmessungen).
 *  • Zusammensetzen läuft über eine begrenzte Warteschlange (MAX_ZUSAMMENSETZEN_GLEICHZEITIG Plätze je Instanz): Eine 45-MB-Datei belegt beim
 *    Zusammenfügen etwa das Doppelte im Speicher. Jedes Laden eines Teils hat ein Zeitlimit, damit eine hängende Verbindung keinen Platz dauerhaft
 *    besetzt und andere Bestellungen nicht blockiert.
 */
import { downloadProductionFile, listeUnterordner, removeProductionFiles, uploadProductionFile } from '@/lib/supabase/storage';
import {
  MAX_TEILE,
  MAX_ZUSAMMENSETZEN_GLEICHZEITIG,
  MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG,
  MAX_ZWISCHENABLAGE_DATEIEN_JE_BESTELLUNG,
  MAX_ZWISCHENABLAGE_VERWEISE_JE_BESTELLUNG,
  TEIL_LADE_TIMEOUT_MS,
  TEIL_MAX_BYTES,
  ZUSAMMENSETZEN_GESAMT_TIMEOUT_MS,
  ZWISCHENABLAGE_ORDNER,
  ZWISCHENABLAGE_VERFALL_TAGE,
} from '@/config/upload';
import type { CartItem } from '@/types';
import { ablehnen, pruefeBytes, type UploadPruefung } from './pruefeUpload';
import {
  istGueltigesTicket,
  istTagFrisch,
  istZwischenablageRef,
  liesRef,
  teilPfad,
  ticketOrdner,
  tagVon,
  type ZwischenablageRef,
} from './zwischenablageRef';

export type TeilErgebnis = { ok: true } | { ok: false; status: 400 | 413; grund: string };

/** Legt EIN Teil ab. Größe, Tag, Ticket und Teilnummer werden hier geprüft – der Aufrufer reicht die Rohwerte aus der Anfrage durch. */
export async function speichereTeil(
  eingabe: { tag: string; ticket: string; nr: number; daten: Buffer },
  jetzt: Date = new Date()
): Promise<TeilErgebnis> {
  const { tag, ticket, nr, daten } = eingabe;
  if (!istTagFrisch(tag, jetzt)) return { ok: false, status: 400, grund: 'Ungültiger Tag.' };
  if (!istGueltigesTicket(ticket)) return { ok: false, status: 400, grund: 'Ungültiges Ticket.' };
  if (!Number.isInteger(nr) || nr < 0 || nr >= MAX_TEILE) return { ok: false, status: 400, grund: 'Ungültige Teilnummer.' };
  if (daten.length === 0) return { ok: false, status: 400, grund: 'Leeres Teil.' };
  if (daten.length > TEIL_MAX_BYTES) return { ok: false, status: 413, grund: 'Teil zu groß.' };

  await uploadProductionFile(teilPfad({ tag, ticket }, nr), daten, 'application/octet-stream');
  return { ok: true };
}

/** Alles, was zum Zusammensetzen von außen gebraucht wird – austauschbar für Tests. */
export interface ZwischenablageEinAus {
  lade: (pfad: string) => Promise<Buffer>;
}

const STANDARD_EIN_AUS: ZwischenablageEinAus = { lade: downloadProductionFile };

/** Begrenzte Warteschlange: höchstens `plaetze` Aufgaben gleichzeitig, die übrigen warten der Reihe nach. Ein Platz wird immer wieder frei. */
export class Plaetze {
  private frei: number;
  private readonly warteschlange: Array<() => void> = [];
  constructor(plaetze: number) {
    this.frei = plaetze;
  }

  /**
   * Belegt einen Platz und gibt die Funktion zurück, die ihn wieder freigibt. Die Freigabe wirkt nur EINMAL (mehrfaches Aufrufen ist
   * unschädlich) – so kann ein Platz weder doppelt frei werden noch durch eine vergessene Freigabe verloren gehen, wenn der Aufrufer sie
   * in ein `finally` legt.
   */
  async belege(): Promise<() => void> {
    if (this.frei > 0) this.frei--;
    else await new Promise<void>((weiter) => this.warteschlange.push(weiter));
    let freigegeben = false;
    return () => {
      if (freigegeben) return;
      freigegeben = true;
      const naechster = this.warteschlange.shift();
      if (naechster) naechster();
      else this.frei++;
    };
  }

  async fuehreAus<T>(aufgabe: () => Promise<T>): Promise<T> {
    const freigeben = await this.belege();
    try {
      return await aufgabe();
    } finally {
      freigeben();
    }
  }
}

const ZUSAMMENSETZEN = new Plaetze(MAX_ZUSAMMENSETZEN_GLEICHZEITIG);

/**
 * Belegt einen Platz zum Zusammensetzen und gibt ihn erst wieder her, wenn der Aufrufer `freigeben()` ruft. Der Platz zählt den SPEICHER, nicht
 * nur die Ladezeit: Er muss gehalten werden, solange die zusammengesetzte Datei (Puffer oder Data-URL) noch gebraucht wird, und gehört in ein
 * `finally`. Die Freigabe wirkt nur einmal.
 */
export function belegeZusammensetzen(): Promise<() => void> {
  return ZUSAMMENSETZEN.belege();
}

/** Bricht ein Laden nach `ms` Millisekunden ab, statt ewig zu warten. */
function mitZeitlimit<T>(arbeit: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const frist = new Promise<never>((_, abgelehnt) => {
    timer = setTimeout(() => abgelehnt(new Error(`Zeitüberschreitung nach ${ms} ms`)), ms);
  });
  return Promise.race([arbeit, frist]).finally(() => clearTimeout(timer));
}

/**
 * Setzt die Teile hinter einem Verweis zusammen und prüft die Datei vollständig – OHNE einen Platz zu belegen. Der Aufrufer belegt vorher einen
 * (`belegeZusammensetzen`) und hält ihn, solange das Ergebnis lebt. Gibt dieselbe Prüfung zurück wie `pruefeDataUrl`.
 *
 * Zeitlimits: je Teil `TEIL_LADE_TIMEOUT_MS`, für alle Teile zusammen `ZUSAMMENSETZEN_GESAMT_TIMEOUT_MS`. Ein Abbruch beendet das Warten, nicht die
 * Übertragung selbst; liegen gebliebene Reste sind höchstens ein Teil (3 MB) je abgebrochenem Zusammensetzen.
 */
export async function ladeUndPruefe(
  ref: string,
  ein: ZwischenablageEinAus = STANDARD_EIN_AUS,
  optionen: { timeoutMs?: number; gesamtTimeoutMs?: number } = {}
): Promise<UploadPruefung> {
  const timeoutMs = optionen.timeoutMs ?? TEIL_LADE_TIMEOUT_MS;
  const frist = Date.now() + (optionen.gesamtTimeoutMs ?? ZUSAMMENSETZEN_GESAMT_TIMEOUT_MS);
  const r = liesRef(ref);
  if (!r) return ablehnen('zwischenablage_unvollstaendig', `Ungültiger Verweis: ${JSON.stringify(String(ref).slice(0, 80))}`);

  const teile: Buffer[] = [];
  let summe = 0;
  for (let nr = 0; nr < r.teile; nr++) {
    const uebrig = frist - Date.now();
    if (uebrig <= 0) return ablehnen('zwischenablage_unvollstaendig', `Zeitüberschreitung beim Zusammensetzen (Teil ${nr} von ${r.teile}).`);
    let teil: Buffer;
    try {
      teil = await mitZeitlimit(ein.lade(teilPfad(r, nr)), Math.min(timeoutMs, uebrig));
    } catch (fehler) {
      return ablehnen('zwischenablage_unvollstaendig', `Teil ${nr} von ${r.teile} fehlt: ${fehler instanceof Error ? fehler.message : fehler}`);
    }
    const letzt = nr === r.teile - 1;
    // Alle Teile außer dem letzten sind voll; der letzte ist nicht größer als ein voller.
    if (teil.length === 0 || teil.length > TEIL_MAX_BYTES || (!letzt && teil.length !== TEIL_MAX_BYTES)) {
      return ablehnen(
        'zwischenablage_unvollstaendig',
        `Teil ${nr} hat ${teil.length} Bytes, erwartet ${letzt ? 'höchstens ' : ''}${TEIL_MAX_BYTES}.`
      );
    }
    teile.push(teil);
    summe += teil.length;
  }
  if (summe !== r.bytes) {
    return ablehnen('zwischenablage_unvollstaendig', `Summe der Teile ${summe} Bytes, angegeben ${r.bytes}.`);
  }
  return pruefeBytes(Buffer.concat(teile, summe));
}

/** Zusammensetzen mit eigenem Platz, der nach dem Ergebnis wieder frei ist. Für Aufrufer, die das Ergebnis sofort verbrauchen oder nur prüfen. */
export function loeseZwischenablageAuf(
  ref: string,
  ein: ZwischenablageEinAus = STANDARD_EIN_AUS,
  optionen: { timeoutMs?: number; gesamtTimeoutMs?: number } = {}
): Promise<UploadPruefung> {
  return ZUSAMMENSETZEN.fuehreAus(() => ladeUndPruefe(ref, ein, optionen));
}

/** Löscht die Teile hinter einem Verweis. Nicht-fatal: Reste räumt die Wartung nach spätestens zwei Tagen auf. */
export async function verwerfeZwischenablage(ref: string | ZwischenablageRef): Promise<void> {
  const r = typeof ref === 'string' ? liesRef(ref) : ref;
  if (!r) return;
  try {
    await removeProductionFiles(ticketOrdner(r));
  } catch (fehler) {
    console.warn('[zwischenablage] Teile konnten nicht gelöscht werden:', fehler instanceof Error ? fehler.message : fehler);
  }
}

/**
 * Wartung: entfernt alle Tagesordner, die älter als ZWISCHENABLAGE_VERFALL_TAGE sind (abgebrochene Bestellungen). Gibt die Zahl der
 * geleerten Tickets zurück. Läuft im Wartungsaufruf (api/cron/process-supplier-orders).
 */
export async function loescheAlteZwischenablage(jetzt: Date = new Date()): Promise<number> {
  const grenze = tagVon(new Date(jetzt.getTime() - ZWISCHENABLAGE_VERFALL_TAGE * 24 * 60 * 60 * 1000));
  let geleert = 0;
  for (const tag of await listeUnterordner(ZWISCHENABLAGE_ORDNER)) {
    // Nur Ordner, die wie ein Tag aussehen und VOR der Grenze liegen (Zeichenvergleich genügt bei JJJJMMTT).
    if (!/^\d{8}$/.test(tag) || tag >= grenze) continue;
    for (const ticket of await listeUnterordner(`${ZWISCHENABLAGE_ORDNER}/${tag}`)) {
      await removeProductionFiles(`${ZWISCHENABLAGE_ORDNER}/${tag}/${ticket}`);
      geleert++;
    }
  }
  return geleert;
}

/**
 * Große Logo-Dateien kommen nicht als Data-URL, sondern als Verweis auf die Zwischenablage (`staged:…`, siehe config/upload.ts). Diese
 * Prüfung sieht ALLE Verweise einer Bestellung an, bevor irgendetwas zusammengesetzt wird: Form, Anzahl, Gesamtgröße.
 * `null` = in Ordnung, sonst die Meldung für die Kundschaft.
 */
export function pruefeZwischenablageVerweise(items: CartItem[]): string | null {
  const verschieden = new Set<string>();
  let gesamtBytes = 0;
  let verweise = 0;
  for (const item of items ?? []) {
    for (const element of item?.elements ?? []) {
      if (element?.type !== 'logo') continue;
      for (const url of [element.fileUrl, element.originalFileUrl]) {
        if (!istZwischenablageRef(url)) continue;
        const ref = liesRef(url);
        if (!ref) return 'Eine Datei wurde nicht vollständig übertragen. Bitte versuchen Sie es erneut.';
        verweise++;
        if (!verschieden.has(url)) {
          verschieden.add(url);
          gesamtBytes += ref.bytes;
        }
      }
    }
  }
  // Je Datei höchstens 45 MB; insgesamt höchstens MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG (der Spitzenbedarf im Speicher ist ein Mehrfaches).
  if (
    verschieden.size > MAX_ZWISCHENABLAGE_DATEIEN_JE_BESTELLUNG ||
    verweise > MAX_ZWISCHENABLAGE_VERWEISE_JE_BESTELLUNG ||
    gesamtBytes > MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG
  ) {
    return 'Die Bestellung enthält zu viele oder zu große Dateien. Bitte verkleinern Sie die Logos oder bestellen Sie in mehreren Schritten.';
  }
  return null;
}
