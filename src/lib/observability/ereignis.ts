/**
 * ═══════════════════════════════════════════════════════════════════════
 * SYSTEMEREIGNISSE – was dauerhaft festgehalten wird
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ergänzt die Protokollierung um Persistenz. Das Plattformprotokoll hält je
 * nach Tarif nur Stunden bis Tage vor; für „seit wann tritt das auf?" und
 * „häuft sich das?" braucht es eine Tabelle (Migration 0019).
 *
 * ── Nur was jemand sehen sollte ───────────────────────────────────────
 * Geschrieben wird ab WARNING. Jede Zeile zu speichern ließe die Tabelle
 * sinnlos wachsen und das Wichtige untergehen.
 *
 * ── Schreibt niemals blockierend ──────────────────────────────────────
 * Ein misslungener Protokolleintrag darf den Vorgang nicht scheitern lassen,
 * den er beschreibt. Fehler beim Schreiben werden selbst nur protokolliert.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { aktuellerKontext } from './kontext';
import { bereinige, log, PERSISTENZ_AB, RANG, type Felder, type Kategorie, type Schwere } from './log';

export interface EreignisEingabe {
  schwere: Exclude<Schwere, 'DEBUG'>;
  kategorie: Kategorie;
  ereignis: string;
  meldung?: string;
  felder?: Felder;
  fehler?: unknown;
}

/**
 * Protokolliert UND hält fest.
 *
 * Der übliche Weg für alles, was im Betrieb auffallen soll: Die Zeile geht
 * ins Plattformprotokoll (sofort sichtbar) und ab WARNING zusätzlich in die
 * Tabelle (dauerhaft auswertbar).
 */
export async function meldeEreignis(eingabe: EreignisEingabe): Promise<void> {
  const zeile = log({
    schwere: eingabe.schwere,
    kategorie: eingabe.kategorie,
    ereignis: eingabe.ereignis,
    meldung: eingabe.meldung,
    felder: eingabe.felder,
    fehler: eingabe.fehler,
  });

  if (RANG[eingabe.schwere] < RANG[PERSISTENZ_AB]) return;

  const kontext = aktuellerKontext();

  try {
    const db = createAdminClient();
    const { error } = await db.from('system_ereignisse').insert({
      schwere: eingabe.schwere,
      kategorie: eingabe.kategorie,
      ereignis: eingabe.ereignis,
      // Bereits bereinigt durch log(); hier erneut, weil diese Funktion auch
      // direkt aufgerufen werden könnte.
      meldung: eingabe.meldung ? bereinige(eingabe.meldung) : null,
      anfrage_id: kontext?.anfrageId ?? null,
      bestellnummer: kontext?.bestellnummer ?? null,
      detail: {
        ...(eingabe.felder ?? {}),
        // Der Stacktrace wird bewusst NICHT gespeichert – er verrät
        // Dateipfade und Codeaufbau. Die bereinigte Meldung genügt.
        ...(zeile.fehler ? { fehler: zeile.fehler } : {}),
      },
    });
    if (error) {
      log({
        schwere: 'WARNING',
        kategorie: 'SYSTEM',
        ereignis: 'ereignis_nicht_gespeichert',
        meldung: error.message,
      });
    }
  } catch (fehler) {
    log({
      schwere: 'WARNING',
      kategorie: 'SYSTEM',
      ereignis: 'ereignis_nicht_gespeichert',
      fehler,
    });
  }
}

export interface Haeufung {
  kategorie: string;
  ereignis: string;
  schwere: string;
  anzahlAktuell: number;
  schnittJeStunde: number;
  faktor: number;
}

/**
 * Ungewöhnliche Häufungen der letzten Stunden.
 *
 * Vergleicht den aktuellen Zeitraum mit dem Stundendurchschnitt der letzten
 * sieben Tage. Ein Faktor deutlich über 1 heißt: Hier passiert gerade etwas.
 */
export async function haeufungen(stunden = 1): Promise<Haeufung[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc('ereignis_haeufungen', { p_stunden: stunden });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((z) => ({
      kategorie: z.kategorie as string,
      ereignis: z.ereignis as string,
      schwere: z.schwere as string,
      anzahlAktuell: Number(z.anzahl_aktuell),
      schnittJeStunde: Number(z.schnitt_je_stunde),
      faktor: Number(z.faktor),
    }));
  } catch {
    return [];
  }
}

export interface LetztesEreignis {
  zeit: string;
  schwere: string;
  kategorie: string;
  ereignis: string;
  meldung: string | null;
  anfrageId: string | null;
  bestellnummer: string | null;
}

/** Die jüngsten Ereignisse – für die Übersicht im Adminbereich. */
export async function letzteEreignisse(grenze = 50): Promise<LetztesEreignis[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('system_ereignisse')
      .select('zeit, schwere, kategorie, ereignis, meldung, anfrage_id, bestellnummer')
      .order('zeit', { ascending: false })
      .limit(grenze);
    if (error || !data) return [];
    return data.map((z) => ({
      zeit: z.zeit as string,
      schwere: z.schwere as string,
      kategorie: z.kategorie as string,
      ereignis: z.ereignis as string,
      meldung: (z.meldung as string | null) ?? null,
      anfrageId: (z.anfrage_id as string | null) ?? null,
      bestellnummer: (z.bestellnummer as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
