/**
 * ═══════════════════════════════════════════════════════════════════════
 * FILTERKRITERIEN – die URL ist die einzige Wahrheit
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Es gibt bewusst KEINEN zweiten Zustand im Browser. Was gefiltert ist,
 * steht in der Adresszeile: teilbar, speicherbar, nach einem Neuladen
 * unverändert. Diese Datei übersetzt in beide Richtungen und ist rein –
 * kein Next, kein Katalog, keine Datenbank.
 *
 * ── Unbekannte Werte werden ignoriert, nicht abgelehnt ────────────────
 * Eine geteilte Adresse soll auch dann noch eine sinnvolle Seite zeigen,
 * wenn das Sortiment sich geändert hat. Ein weggefallener Farbwert führt
 * deshalb zu „Filter ohne Wirkung", nicht zu einer Fehlerseite.
 */
import {
  FARBGRUPPE_LABELS, GESCHLECHT_LABELS, MATERIAL_LABELS, PASSFORM_LABELS,
  type Farbgruppe, type Geschlecht, type MaterialGruppe, type Passform,
} from '@/config/products/facetten';

export type Sortierung = 'beliebtheit' | 'preis-auf' | 'preis-ab' | 'neu' | 'name-az' | 'name-za';

export const SORTIER_LABELS: Record<Sortierung, string> = {
  beliebtheit: 'Beliebtheit',
  'preis-auf': 'Preis aufsteigend',
  'preis-ab': 'Preis absteigend',
  neu: 'Neuheiten',
  'name-az': 'Name A–Z',
  'name-za': 'Name Z–A',
};

export const STANDARD_SORTIERUNG: Sortierung = 'beliebtheit';
export const PRO_SEITE = 24;

export interface FilterKriterien {
  kategorie: string[];
  marke: string[];
  qualitaet: string[];
  material: MaterialGruppe[];
  passform: Passform[];
  groesse: string[];
  farbe: Farbgruppe[];
  geschlecht: Geschlecht[];
  gewichtVon?: number;
  gewichtBis?: number;
  preisVon?: number;
  preisBis?: number;
  /** true = auch nicht lieferbare Produkte anzeigen. Standard: false. */
  auchNichtLieferbare: boolean;
  sortierung: Sortierung;
  /** Darstellung der Treffer – Raster (Standard) oder Liste. */
  ansicht: Ansicht;
  seite: number;
}

export type Ansicht = 'raster' | 'liste';

export const LEERE_KRITERIEN: FilterKriterien = {
  kategorie: [], marke: [], qualitaet: [], material: [], passform: [],
  groesse: [], farbe: [], geschlecht: [],
  // Bewusst ausgeschrieben statt weggelassen: So hat ein gelesenes Kriterium
  // dieselbe Form wie dieses hier – sonst unterscheiden sich zwei inhaltlich
  // gleiche Objekte allein durch fehlende Schlüssel.
  gewichtVon: undefined, gewichtBis: undefined,
  preisVon: undefined, preisBis: undefined,
  auchNichtLieferbare: false, sortierung: STANDARD_SORTIERUNG, ansicht: 'raster', seite: 1,
};

/** Die Mengen-Dimensionen – für Chips, Zurücksetzen und Facettenzählung. */
export const MENGEN_DIMENSIONEN = [
  'kategorie', 'marke', 'qualitaet', 'material', 'passform',
  'groesse', 'farbe', 'geschlecht',
] as const;
export type MengenDimension = (typeof MENGEN_DIMENSIONEN)[number];

/**
 * Slug für Werte, die als Klartext in die Adresse sollen (Marken, Größen).
 * „Fruit of the Loom" → „fruit-of-the-loom", „SOL'S" → „sol-s".
 */
export function slug(wert: string): string {
  return wert
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function liste(roh: string | string[] | undefined): string[] {
  if (roh === undefined) return [];
  const text = Array.isArray(roh) ? roh.join(',') : roh;
  return [...new Set(text.split(',').map((t) => t.trim()).filter(Boolean))];
}

function zahl(roh: string | string[] | undefined): number | undefined {
  const text = Array.isArray(roh) ? roh[0] : roh;
  if (text === undefined || text === '') return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
}

/** Erlaubte Werte einer Dimension – begrenzt auf das Vokabular. */
function nurBekannte<T extends string>(werte: string[], erlaubt: readonly T[]): T[] {
  return werte.filter((w): w is T => (erlaubt as readonly string[]).includes(w));
}

// Facetten-Vokabulare aus der Single Source (config/products/facetten) ableiten,
// NICHT duplizieren. nurBekannte() filtert per .includes(), daher ist die
// Schlüsselreihenfolge irrelevant und die Ableitung byte-identisch zur früheren
// Literalliste. So kann kein Vokabular mehr auseinanderlaufen.
const MATERIALIEN = Object.keys(MATERIAL_LABELS) as MaterialGruppe[];
const PASSFORMEN = Object.keys(PASSFORM_LABELS) as Passform[];
const GESCHLECHTER = Object.keys(GESCHLECHT_LABELS) as Geschlecht[];
const FARBEN = Object.keys(FARBGRUPPE_LABELS) as Farbgruppe[];
// Sortierung ist ein reines Query-Konzept (keine Produktfacette) und bleibt lokal.
const SORTIERUNGEN = ['beliebtheit', 'preis-auf', 'preis-ab', 'neu', 'name-az', 'name-za'] as const;

export type SuchParameter = Record<string, string | string[] | undefined>;

/** Liest die Kriterien aus den Adressparametern. Wirft nie. */
export function leseKriterien(p: SuchParameter): FilterKriterien {
  const sortierRoh = Array.isArray(p.sortierung) ? p.sortierung[0] : p.sortierung;
  const seite = zahl(p.seite);

  return {
    kategorie: liste(p.kategorie),
    marke: liste(p.marke),
    qualitaet: liste(p.qualitaet),
    material: nurBekannte(liste(p.material), MATERIALIEN),
    passform: nurBekannte(liste(p.passform), PASSFORMEN),
    groesse: liste(p.groesse),
    farbe: nurBekannte(liste(p.farbe), FARBEN),
    geschlecht: nurBekannte(liste(p.geschlecht), GESCHLECHTER),
    gewichtVon: zahl(p.gewichtVon),
    gewichtBis: zahl(p.gewichtBis),
    preisVon: zahl(p.preisVon),
    preisBis: zahl(p.preisBis),
    auchNichtLieferbare: (Array.isArray(p.verfuegbarkeit) ? p.verfuegbarkeit[0] : p.verfuegbarkeit) === 'alle',
    sortierung: (SORTIERUNGEN as readonly string[]).includes(sortierRoh ?? '')
      ? (sortierRoh as Sortierung)
      : STANDARD_SORTIERUNG,
    ansicht: (Array.isArray(p.ansicht) ? p.ansicht[0] : p.ansicht) === 'liste' ? 'liste' : 'raster',
    seite: seite && seite >= 1 ? Math.floor(seite) : 1,
  };
}

/**
 * Schreibt die Kriterien zurück in eine Abfragezeichenkette.
 * Standardwerte werden weggelassen – die Adresse bleibt kurz und lesbar.
 */
export function schreibeKriterien(k: FilterKriterien): string {
  const p = new URLSearchParams();
  const setze = (name: string, werte: string[]) => {
    if (werte.length > 0) p.set(name, werte.join(','));
  };

  setze('kategorie', k.kategorie);
  setze('marke', k.marke);
  setze('qualitaet', k.qualitaet);
  setze('material', k.material);
  setze('passform', k.passform);
  setze('groesse', k.groesse);
  setze('farbe', k.farbe);
  setze('geschlecht', k.geschlecht);
  if (k.gewichtVon !== undefined) p.set('gewichtVon', String(k.gewichtVon));
  if (k.gewichtBis !== undefined) p.set('gewichtBis', String(k.gewichtBis));
  if (k.preisVon !== undefined) p.set('preisVon', String(k.preisVon));
  if (k.preisBis !== undefined) p.set('preisBis', String(k.preisBis));
  if (k.auchNichtLieferbare) p.set('verfuegbarkeit', 'alle');
  if (k.sortierung !== STANDARD_SORTIERUNG) p.set('sortierung', k.sortierung);
  if (k.ansicht !== 'raster') p.set('ansicht', k.ansicht);
  if (k.seite > 1) p.set('seite', String(k.seite));

  return p.toString();
}

/** Ist überhaupt etwas gefiltert? (Sortierung und Seite zählen nicht.) */
export function hatAktiveFilter(k: FilterKriterien): boolean {
  return (
    MENGEN_DIMENSIONEN.some((d) => k[d].length > 0) ||
    k.gewichtVon !== undefined || k.gewichtBis !== undefined ||
    k.preisVon !== undefined || k.preisBis !== undefined ||
    k.auchNichtLieferbare
  );
}

/** Einen einzelnen Wert einer Dimension umschalten. Rein. */
export function schalteWert(k: FilterKriterien, dim: MengenDimension, wert: string): FilterKriterien {
  const vorhanden = (k[dim] as string[]).includes(wert);
  const neu = vorhanden ? (k[dim] as string[]).filter((w) => w !== wert) : [...(k[dim] as string[]), wert];
  // Jede Filteränderung springt zurück auf Seite 1 – sonst landet man auf
  // einer Seite, die es im neuen Ergebnis nicht mehr gibt.
  return { ...k, [dim]: neu, seite: 1 } as FilterKriterien;
}

/** Alle Filter entfernen. Sortierung und Ansicht sind keine Filter und bleiben. */
export function setzeZurueck(k: FilterKriterien): FilterKriterien {
  return { ...LEERE_KRITERIEN, sortierung: k.sortierung, ansicht: k.ansicht };
}
