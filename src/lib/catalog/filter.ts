/**
 * ═══════════════════════════════════════════════════════════════════════
 * FILTERN, SORTIEREN, FACETTEN – reine Logik
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kein Next, keine Datenbank, kein Zustand: Alles hier ist eine Funktion von
 * (Produkte, Kriterien) auf ein Ergebnis und damit vollständig prüfbar.
 *
 * ── Die Facettenzählung ist der heikle Teil ───────────────────────────
 * Die Trefferzahlen einer Dimension werden gegen alle ANDEREN aktiven Filter
 * berechnet, aber ohne den eigenen. Sonst zeigte der Markenfilter nach der
 * Wahl von „Gildan" bei jeder anderen Marke 0 an – man könnte nie eine
 * zweite Marke dazunehmen. Genau so verhalten sich große Fashion-Shops.
 */
import type { ProductConfig } from '@/config/products/types';
import {
  farbgruppenVon, geschlechterVon, materialGruppen, passformVon, aufnahmedatumVon,
} from '@/config/products/facetten';
import { groessenRang } from '@/config/products/groessen';
import { ermittleVerfuegbarkeit } from './verfuegbarkeit';
import {
  MENGEN_DIMENSIONEN, slug, type FilterKriterien, type MengenDimension, type Sortierung,
} from './kriterien';

/** Die filterbaren Werte eines Produkts – einmal berechnet, mehrfach genutzt. */
export interface Merkmale {
  kategorie: string;
  marke: string;
  qualitaet: string;
  material: string[];
  passform: string[];
  groesse: string[];
  farbe: string[];
  geschlecht: string[];
  gewicht: number;
  preis: number;
  lieferbar: boolean;
  aufgenommenAm: string;
}

export function merkmaleVon(p: ProductConfig): Merkmale {
  const passform = passformVon(p);
  return {
    kategorie: p.productType,
    marke: slug(p.brand),
    qualitaet: p.qualityTier,
    material: materialGruppen(p),
    passform: passform ? [passform] : [],
    groesse: p.sizes,
    farbe: farbgruppenVon(p),
    geschlecht: geschlechterVon(p),
    gewicht: p.weightGsm,
    preis: p.basePrice,
    lieferbar: ermittleVerfuegbarkeit(p) === 'lieferbar',
    aufgenommenAm: aufnahmedatumVon(p),
  };
}

/** Schnittprüfung: leerer Filter lässt alles durch, sonst ODER innerhalb der Dimension. */
function trifft(gewaehlt: string[], vorhanden: string[]): boolean {
  return gewaehlt.length === 0 || gewaehlt.some((w) => vorhanden.includes(w));
}

/**
 * Passt ein Produkt auf die Kriterien?
 *
 * `ausser` blendet eine Dimension aus – genau das braucht die
 * Facettenzählung, um die eigene Dimension nicht gegen sich selbst zu prüfen.
 */
export function passt(m: Merkmale, k: FilterKriterien, ausser?: MengenDimension): boolean {
  const pruefe = (dim: MengenDimension, vorhanden: string[]) =>
    dim === ausser || trifft(k[dim] as string[], vorhanden);

  if (!pruefe('kategorie', [m.kategorie])) return false;
  if (!pruefe('marke', [m.marke])) return false;
  if (!pruefe('qualitaet', [m.qualitaet])) return false;
  if (!pruefe('material', m.material)) return false;
  if (!pruefe('passform', m.passform)) return false;
  if (!pruefe('groesse', m.groesse)) return false;
  if (!pruefe('farbe', m.farbe)) return false;
  if (!pruefe('geschlecht', m.geschlecht)) return false;

  if (k.gewichtVon !== undefined && m.gewicht < k.gewichtVon) return false;
  if (k.gewichtBis !== undefined && m.gewicht > k.gewichtBis) return false;
  if (k.preisVon !== undefined && m.preis < k.preisVon) return false;
  if (k.preisBis !== undefined && m.preis > k.preisBis) return false;

  // Nicht lieferbare Produkte sind standardmäßig unsichtbar.
  if (!k.auchNichtLieferbare && !m.lieferbar) return false;

  return true;
}

// ── Sortierung ─────────────────────────────────────────────────────────

/** Verkaufszahlen je Produkt-ID; leer, solange nichts verkauft wurde. */
export type Beliebtheit = Record<string, number>;

export function sortiere(
  produkte: ProductConfig[],
  sortierung: Sortierung,
  beliebtheit: Beliebtheit = {}
): ProductConfig[] {
  const kopie = [...produkte];
  const name = (a: ProductConfig, b: ProductConfig) => a.name.localeCompare(b.name, 'de');

  switch (sortierung) {
    case 'preis-auf':
      return kopie.sort((a, b) => a.basePrice - b.basePrice || name(a, b));
    case 'preis-ab':
      return kopie.sort((a, b) => b.basePrice - a.basePrice || name(a, b));
    case 'neu':
      return kopie.sort(
        (a, b) => aufnahmedatumVon(b).localeCompare(aufnahmedatumVon(a)) || name(a, b)
      );
    case 'name-az':
      return kopie.sort(name);
    case 'name-za':
      return kopie.sort((a, b) => name(b, a));
    case 'beliebtheit':
    default:
      // Ohne Verkaufszahlen greift ein nachvollziehbarer Ersatz: höhere
      // Qualitätsstufe zuerst, dann günstiger. Sonst wirkte „Beliebtheit"
      // am Anfang wie eine Zufallsreihenfolge.
      return kopie.sort((a, b) => {
        const diff = (beliebtheit[b.id] ?? 0) - (beliebtheit[a.id] ?? 0);
        if (diff !== 0) return diff;
        const stufe = (STUFEN_RANG[b.qualityTier] ?? 0) - (STUFEN_RANG[a.qualityTier] ?? 0);
        if (stufe !== 0) return stufe;
        return a.basePrice - b.basePrice || name(a, b);
      });
  }
}

const STUFEN_RANG: Record<string, number> = { basic: 0, standard: 1, premium: 2, luxury: 3 };

/**
 * Reihenfolge der Konfektionsgrößen.
 *
 * Unbekannte Bezeichnungen landen hinten und werden dort alphabetisch
 * einsortiert – so bricht eine neue Größe die Liste nicht, sondern fällt auf.
 */
// ── Facetten ───────────────────────────────────────────────────────────

export interface FacettenWert {
  wert: string;
  anzahl: number;
}
export type Facetten = Record<MengenDimension, FacettenWert[]>;

export interface Spannen {
  preisMin: number;
  preisMax: number;
  gewichtMin: number;
  gewichtMax: number;
}

/**
 * Zählt je Dimension, wie viele Produkte auf einen Wert entfallen – jeweils
 * unter Berücksichtigung aller anderen Filter (siehe Kopfkommentar).
 * Werte mit 0 Treffern bleiben enthalten, damit die Leiste nicht springt;
 * die Oberfläche graut sie aus.
 */
export function berechneFacetten(alle: Merkmale[], k: FilterKriterien): Facetten {
  const facetten = {} as Facetten;

  for (const dim of MENGEN_DIMENSIONEN) {
    const zaehler = new Map<string, number>();
    // Erst alle im Bestand vorkommenden Werte anlegen (auch die mit 0) …
    for (const m of alle) for (const w of werteVon(m, dim)) if (!zaehler.has(w)) zaehler.set(w, 0);
    // … dann gegen die anderen Filter zählen.
    for (const m of alle) {
      if (!passt(m, k, dim)) continue;
      for (const w of werteVon(m, dim)) zaehler.set(w, (zaehler.get(w) ?? 0) + 1);
    }
    const eintraege = [...zaehler.entries()].map(([wert, anzahl]) => ({ wert, anzahl }));

    // Größen folgen der KONFEKTIONSREIHENFOLGE, nicht der Trefferzahl:
    // „L, M, S, XL, XXL" (alphabetisch oder nach Häufigkeit) sieht für
    // Kundschaft schlicht falsch aus. Alle anderen Dimensionen sortieren
    // nach Häufigkeit – dort ist das Übliche zuerst hilfreich.
    facetten[dim] =
      dim === 'groesse'
        ? eintraege.sort((a, b) => groessenRang(a.wert) - groessenRang(b.wert))
        : eintraege.sort((a, b) => b.anzahl - a.anzahl || a.wert.localeCompare(b.wert, 'de'));
  }

  return facetten;
}

function werteVon(m: Merkmale, dim: MengenDimension): string[] {
  switch (dim) {
    case 'kategorie': return [m.kategorie];
    case 'marke': return [m.marke];
    case 'qualitaet': return [m.qualitaet];
    case 'material': return m.material;
    case 'passform': return m.passform;
    case 'groesse': return m.groesse;
    case 'farbe': return m.farbe;
    case 'geschlecht': return m.geschlecht;
  }
}

/** Preis- und Gewichtsspanne des GESAMTEN Bestands – Grenzen der Schieberegler. */
export function spannen(alle: Merkmale[]): Spannen {
  const preise = alle.map((m) => m.preis);
  const gewichte = alle.map((m) => m.gewicht);
  return {
    preisMin: Math.floor(Math.min(...preise)),
    preisMax: Math.ceil(Math.max(...preise)),
    gewichtMin: Math.min(...gewichte),
    gewichtMax: Math.max(...gewichte),
  };
}
