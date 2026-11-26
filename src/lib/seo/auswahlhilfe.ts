/**
 * „Welches Modell passt?“ auf Kategorie- und Produktart-Seiten – die Eckpunkte der Art, berechnet aus dem Katalog.
 *
 * Warum: Die Seiten zeigten bisher eine Kachelliste mit Standardtext. Wer „Longsleeve bedrucken“ oder „Hoodies bedrucken lassen“ sucht, will
 * zuerst wissen, wie sich die Modelle unterscheiden. Diese Antwort ist je Produktart anders und veraltet nie, weil jede Zahl aus den
 * Produktdaten kommt (Grundpreis „ab“, Gewicht, Farben, Größen).
 *
 * Nur Fakten, keine Wertungen („beste Wahl“): ein Eckpunkt ist immer „am günstigsten“, „am leichtesten“ usw. innerhalb der Seite.
 * Reine Funktion, kein Netz, keine Datenbank.
 */
import type { ProductConfig } from '@/config/products/types';
import { formatiereGeld } from '@/lib/format';

/** Mindestens so viele Modelle, sonst sind „leichtestes/schwerstes“ keine Auswahlhilfe. */
export const MIN_MODELLE_AUSWAHLHILFE = 6;

export interface AuswahlPunkt {
  /** Eckpunkt(e), z. B. „Günstigster Einstieg · Leichtestes Modell“. */
  titel: string;
  produkt: ProductConfig;
  /** Eine Zeile mit den Zahlen des Modells. */
  detail: string;
}

function gewicht(p: ProductConfig): number | null {
  return typeof p.weightGsm === 'number' && p.weightGsm > 0 ? p.weightGsm : null;
}

function groessenSpanne(sizes: string[]): string {
  const erste = sizes[0];
  const letzte = sizes[sizes.length - 1];
  if (!erste) return '';
  return erste === letzte ? erste : `${erste}–${letzte}`;
}

/** Name mit Marke, ohne die Marke doppelt zu nennen („Russell Classic T“ statt „Russell Russell Classic T“). */
export function markeUndName(p: { brand: string; name: string }): string {
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`;
}

function nach(produkte: ProductConfig[], wert: (p: ProductConfig) => number | null, richtung: 'min' | 'max'): ProductConfig | null {
  let beste: ProductConfig | null = null;
  let besterWert: number | null = null;
  for (const p of produkte) {
    const w = wert(p);
    if (w === null) continue;
    const besser = besterWert === null || (richtung === 'min' ? w < besterWert : w > besterWert);
    // Bei Gleichstand gewinnt der alphabetisch erste, damit die Auswahl stabil bleibt.
    const gleichUndFrueher = besterWert !== null && w === besterWert && beste !== null && p.name.localeCompare(beste.name, 'de') < 0;
    if (besser || gleichUndFrueher) {
      beste = p;
      besterWert = w;
    }
  }
  return beste;
}

export function auswahlhilfe(produkte: ProductConfig[]): AuswahlPunkt[] | null {
  if (produkte.length < MIN_MODELLE_AUSWAHLHILFE) return null;
  const kandidaten: { titel: string; produkt: ProductConfig | null }[] = [
    { titel: 'Günstigster Einstieg', produkt: nach(produkte, (p) => p.basePrice, 'min') },
    { titel: 'Leichtestes Modell', produkt: nach(produkte, gewicht, 'min') },
    { titel: 'Schwerstes Modell', produkt: nach(produkte, gewicht, 'max') },
    { titel: 'Größte Farbauswahl', produkt: nach(produkte, (p) => p.colors.length, 'max') },
    { titel: 'Meiste Größen', produkt: nach(produkte, (p) => p.sizes.length, 'max') },
  ];

  const jeProdukt = new Map<string, AuswahlPunkt>();
  for (const k of kandidaten) {
    if (!k.produkt) continue;
    const vorhanden = jeProdukt.get(k.produkt.id);
    if (vorhanden) {
      vorhanden.titel = `${vorhanden.titel} · ${k.titel}`;
      continue;
    }
    const p = k.produkt;
    const g = gewicht(p);
    jeProdukt.set(p.id, {
      titel: k.titel,
      produkt: p,
      detail: [
        g ? `${g} g/m²` : null,
        `${p.colors.length} ${p.colors.length === 1 ? 'Farbe' : 'Farben'}`,
        p.sizes.length > 0 ? `Größen ${groessenSpanne(p.sizes)}` : null,
        `Textil ab ${formatiereGeld(p.basePrice)}`,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }
  const punkte = [...jeProdukt.values()];
  // Weniger als drei verschiedene Modelle sind keine Auswahlhilfe (z. B. wenn ein Modell alles gewinnt).
  return punkte.length >= 3 ? punkte : null;
}
