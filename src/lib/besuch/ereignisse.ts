/**
 * Besucherzähler – Auswertung der Ereignisse („Weg zur Bestellung“) für den Adminbereich.
 *
 * `baueTrichter` und `baueQuellenZeilen` sind rein (testbar). `ladeEreignisstatistik` holt die Rohzahlen über `lade_ereignisstatistik`
 * (Migration 0040); fehlt die Migration oder ist die Datenbank nicht erreichbar, liefert sie `null` – der Adminbereich zeigt dann einen
 * Hinweis statt abzustürzen.
 *
 * Gezählt werden Besucher je Tag (dieselbe Einheit wie „Besucher“ im Besucherzähler): Wer an zwei Tagen den Konfigurator öffnet, zählt
 * zweimal. Anteile sind deshalb Näherungen, keine Quoten verschiedener Personen.
 */
import { BESUCH_ANZEIGE_TAGE, BESUCH_EREIGNISSE, BESUCH_EREIGNIS_NAMEN, type BesuchEreignis } from '@/config/besuch';
import { createAdminClient } from '@/lib/supabase/server';
import { berlinTag } from './erfassen';
import { tagPlus } from './statistik';

export interface EreignisSumme {
  ereignis: string;
  besucher: number;
}
export interface EreignisQuelle {
  quelle: string;
  ereignis: string;
  besucher: number;
}
export interface RohEreignisse {
  summen: EreignisSumme[];
  quellen: EreignisQuelle[];
}

export interface Trichterstufe {
  ereignis: BesuchEreignis;
  name: string;
  besucher: number;
  /** Anteil an den Besuchern der Website im Zeitraum (0–1); `null` ohne Besucher. */
  anteilAnAllen: number | null;
  /** Anteil an „Konfigurator geöffnet“ (0–1); `null` für die erste Stufe oder wenn dort nichts gezählt wurde. */
  anteilAnGeoeffnet: number | null;
}

export interface QuellenZeile {
  quelle: string;
  /** Besucher je Ereignis (0, wenn nichts gezählt wurde). */
  je: Record<BesuchEreignis, number>;
}

const anteil = (teil: number, ganz: number): number | null => (ganz > 0 ? teil / ganz : null);

export function baueTrichter(summen: EreignisSumme[], besucherGesamt: number): Trichterstufe[] {
  const nach = new Map(summen.map((s) => [s.ereignis, s.besucher]));
  const geoeffnet = nach.get('konfigurator_geoeffnet') ?? 0;
  return BESUCH_EREIGNISSE.map((ereignis) => {
    const besucher = nach.get(ereignis) ?? 0;
    return {
      ereignis,
      name: BESUCH_EREIGNIS_NAMEN[ereignis],
      besucher,
      anteilAnAllen: anteil(besucher, besucherGesamt),
      anteilAnGeoeffnet: ereignis === 'konfigurator_geoeffnet' ? null : anteil(besucher, geoeffnet),
    };
  });
}

export function baueQuellenZeilen(quellen: EreignisQuelle[]): QuellenZeile[] {
  const leer = (): Record<BesuchEreignis, number> => ({ konfigurator_geoeffnet: 0, motiv_hochgeladen: 0, text_hinzugefuegt: 0, in_den_warenkorb: 0 });
  const nachQuelle = new Map<string, QuellenZeile>();
  for (const q of quellen) {
    if (!(BESUCH_EREIGNISSE as readonly string[]).includes(q.ereignis)) continue;
    const zeile = nachQuelle.get(q.quelle) ?? { quelle: q.quelle, je: leer() };
    zeile.je[q.ereignis as BesuchEreignis] += q.besucher;
    nachQuelle.set(q.quelle, zeile);
  }
  return [...nachQuelle.values()].sort(
    (a, b) => b.je.in_den_warenkorb - a.je.in_den_warenkorb || b.je.konfigurator_geoeffnet - a.je.konfigurator_geoeffnet || a.quelle.localeCompare(b.quelle, 'de')
  );
}

export interface Ereignisstatistik {
  trichter: Trichterstufe[];
  quellen: QuellenZeile[];
}

/** `null`, wenn die Zahlen nicht geladen werden konnten (Tabellen fehlen, Datenbank down). */
export async function ladeEreignisstatistik(besucherGesamt: number, jetzt: Date = new Date()): Promise<Ereignisstatistik | null> {
  const heuteTag = berlinTag(jetzt);
  try {
    const { data, error } = await createAdminClient().rpc('lade_ereignisstatistik', {
      p_von: tagPlus(heuteTag, -(BESUCH_ANZEIGE_TAGE - 1)),
    });
    if (error || !data) {
      console.error('[besuch] Ereignisse nicht ladbar:', error?.message ?? 'keine Daten');
      return null;
    }
    const roh = data as Partial<RohEreignisse>;
    return {
      trichter: baueTrichter(roh.summen ?? [], besucherGesamt),
      quellen: baueQuellenZeilen(roh.quellen ?? []),
    };
  } catch (fehler) {
    console.error('[besuch] Ereignisse nicht ladbar:', fehler instanceof Error ? fehler.message : fehler);
    return null;
  }
}
