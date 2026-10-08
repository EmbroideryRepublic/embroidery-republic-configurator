/**
 * Besucherzähler – Auswertung für den Adminbereich.
 *
 * `baueStatistik` ist rein (testbar): Es füllt Tage ohne Besucher mit 0 auf,
 * damit der Verlauf lückenlos ist, und rechnet die Kennzahlen aus.
 * `ladeBesuchsstatistik` holt die Rohzahlen über die Funktion
 * `lade_besuchsstatistik` (Migration 0037) – die aggregiert in SQL, weil
 * PostgREST Antworten bei 1000 Zeilen abschneidet.
 *
 * Fehlen die Tabellen (Migration noch nicht eingespielt) oder ist die Datenbank
 * nicht erreichbar, liefert die Funktion `null` – der Adminbereich zeigt dann
 * einen Hinweis statt abzustürzen.
 */
import { BESUCH_ANZEIGE_TAGE } from '@/config/besuch';
import { createAdminClient } from '@/lib/supabase/server';
import { berlinTag } from './erfassen';

export interface BesuchTag {
  tag: string;
  besucher: number;
  aufrufe: number;
}
export interface BesuchSeite {
  pfad: string;
  aufrufe: number;
}
export interface BesuchQuelle {
  quelle: string;
  besucher: number;
  aufrufe: number;
}

export interface RohStatistik {
  tage: BesuchTag[];
  seiten: BesuchSeite[];
  quellen: BesuchQuelle[];
}

export interface BesuchsStatistik {
  /** Lückenlos, ältester Tag zuerst, endet mit heute. */
  tage: BesuchTag[];
  seiten: BesuchSeite[];
  quellen: BesuchQuelle[];
  heute: BesuchTag;
  gestern: BesuchTag;
  /** Summen über Tage – derselbe Mensch an zwei Tagen zählt zweimal. */
  letzte7: { besucher: number; aufrufe: number };
  letzte30: { besucher: number; aufrufe: number };
  /** Seitenaufrufe je Besucher (30 Tage); `null` ohne Besucher. */
  seitenProBesuch: number | null;
  /** Erster Tag mit Zahlen im Zeitraum – `null`, solange noch nichts gezählt wurde. */
  ersterTagMitDaten: string | null;
}

/** Tag ± n Tage (reine Datumsrechnung auf `YYYY-MM-DD`, ohne Zeitzonenfalle). */
export function tagPlus(tag: string, n: number): string {
  const d = new Date(`${tag}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const summe = (tage: BesuchTag[]) => ({
  besucher: tage.reduce((s, t) => s + t.besucher, 0),
  aufrufe: tage.reduce((s, t) => s + t.aufrufe, 0),
});

export function baueStatistik(roh: RohStatistik, heuteTag: string, tageAnzahl = BESUCH_ANZEIGE_TAGE): BesuchsStatistik {
  const nachTag = new Map(roh.tage.map((t) => [t.tag, t]));
  const tage: BesuchTag[] = [];
  for (let i = tageAnzahl - 1; i >= 0; i--) {
    const tag = tagPlus(heuteTag, -i);
    tage.push(nachTag.get(tag) ?? { tag, besucher: 0, aufrufe: 0 });
  }
  const heute = tage[tage.length - 1]!;
  const gestern = tage[tage.length - 2] ?? { tag: tagPlus(heuteTag, -1), besucher: 0, aufrufe: 0 };
  const s30 = summe(tage);
  return {
    tage,
    seiten: roh.seiten,
    quellen: roh.quellen,
    heute,
    gestern,
    letzte7: summe(tage.slice(-7)),
    letzte30: s30,
    seitenProBesuch: s30.besucher > 0 ? Math.round((s30.aufrufe / s30.besucher) * 10) / 10 : null,
    ersterTagMitDaten: tage.find((t) => t.besucher > 0 || t.aufrufe > 0)?.tag ?? null,
  };
}

/** `null`, wenn die Zahlen nicht geladen werden konnten (Tabellen fehlen, Datenbank down). */
export async function ladeBesuchsstatistik(jetzt: Date = new Date()): Promise<BesuchsStatistik | null> {
  const heuteTag = berlinTag(jetzt);
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc('lade_besuchsstatistik', {
      p_von: tagPlus(heuteTag, -(BESUCH_ANZEIGE_TAGE - 1)),
    });
    if (error || !data) {
      console.error('[besuch] Auswertung nicht ladbar:', error?.message ?? 'keine Daten');
      return null;
    }
    const roh = data as Partial<RohStatistik>;
    return baueStatistik(
      { tage: roh.tage ?? [], seiten: roh.seiten ?? [], quellen: roh.quellen ?? [] },
      heuteTag
    );
  } catch (fehler) {
    console.error('[besuch] Auswertung nicht ladbar:', fehler instanceof Error ? fehler.message : fehler);
    return null;
  }
}
