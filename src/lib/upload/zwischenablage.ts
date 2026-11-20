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
 *  • Zusammensetzen läuft nacheinander, nie parallel: Eine 45-MB-Datei belegt beim Zusammenfügen etwa das Doppelte im Speicher.
 */
import { downloadProductionFile, listeUnterordner, removeProductionFiles, uploadProductionFile } from '@/lib/supabase/storage';
import {
  MAX_TEILE,
  MAX_ZWISCHENABLAGE_DATEIEN_JE_BESTELLUNG,
  TEIL_MAX_BYTES,
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

let kette: Promise<unknown> = Promise.resolve();
/** Führt Aufgaben nacheinander aus (Speicherschutz). Ein Fehler einer Aufgabe stoppt die nächste nicht. */
function nacheinander<T>(aufgabe: () => Promise<T>): Promise<T> {
  const ergebnis = kette.then(aufgabe, aufgabe);
  kette = ergebnis.catch(() => undefined);
  return ergebnis;
}

/**
 * Setzt die Teile hinter einem Verweis zusammen und prüft die Datei vollständig.
 * Gibt dieselbe Prüfung zurück wie `pruefeDataUrl` – der Aufrufer behandelt beide Wege gleich.
 */
export function loeseZwischenablageAuf(ref: string, ein: ZwischenablageEinAus = STANDARD_EIN_AUS): Promise<UploadPruefung> {
  return nacheinander(async () => {
    const r = liesRef(ref);
    if (!r) return ablehnen('zwischenablage_unvollstaendig', `Ungültiger Verweis: ${JSON.stringify(String(ref).slice(0, 80))}`);

    const teile: Buffer[] = [];
    let summe = 0;
    for (let nr = 0; nr < r.teile; nr++) {
      let teil: Buffer;
      try {
        teil = await ein.lade(teilPfad(r, nr));
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
  });
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
  for (const item of items ?? []) {
    for (const element of item?.elements ?? []) {
      if (element?.type !== 'logo') continue;
      for (const url of [element.fileUrl, element.originalFileUrl]) {
        if (!istZwischenablageRef(url)) continue;
        const ref = liesRef(url);
        if (!ref) return 'Eine Datei wurde nicht vollständig übertragen. Bitte versuchen Sie es erneut.';
        if (!verschieden.has(url)) {
          verschieden.add(url);
          gesamtBytes += ref.bytes;
        }
      }
    }
  }
  // Je Datei höchstens 45 MB; insgesamt so viel, wie der Server beim Zusammensetzen nacheinander bewältigt.
  if (verschieden.size > MAX_ZWISCHENABLAGE_DATEIEN_JE_BESTELLUNG || gesamtBytes > 200 * 1024 * 1024) {
    return 'Die Bestellung enthält zu viele oder zu große Dateien. Bitte verkleinern Sie die Logos oder bestellen Sie in mehreren Schritten.';
  }
  return null;
}
