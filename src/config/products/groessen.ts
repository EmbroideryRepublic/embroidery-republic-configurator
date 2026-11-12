/**
 * ═══════════════════════════════════════════════════════════════════════
 * GRÖSSENLEITER-REGISTRY (GROESSEN_LEITERN)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Größen sind nicht überall Konfektion (S/M/L/…): eine Beanie hat Kopfweiten,
 * eine Tasche „One Size", ein Maßprodukt Zentimeter. Damit die Kernlogik
 * (Sortierung, „nächstgelegene Größe" beim Produktwechsel) für ALLE Fälle
 * funktioniert, steht die Skala hier als typisierte LEITER – nicht mehr als
 * fest verdrahtete Konfektionsreihenfolge. Siehe ADR 0002 §2.
 *
 * ── Muster wie überall ────────────────────────────────────────────────
 * Offene Leiter-ID + zentrale Registry + Resolver (`groessenLeiterVon`) +
 * produkt-/typseitige Deklaration (`ProductConfig.sizeScale` bzw.
 * `PRODUCT_TYPES[type].groessenLeiter`) + Wächter-Tests. Default `konfektion-eu`
 * bildet das bisherige Verhalten 1:1 ab (Bestand byte-identisch).
 *
 * ── Strategie je Leiter-Typ ───────────────────────────────────────────
 * Der Typ bestimmt, WIE „nächste Größe" gerechnet wird: geordnet-diskret
 * (konfektion/kopfweite) über den Index, Einheitsgröße über die einzige Größe
 * (Menge geht NIE verloren – der frühere Bruch H2), Maß über eine Metrik.
 */
import type { ProductConfig } from './types';
import { PRODUCT_TYPES } from './productTypes';

/** Konfektionsgrößen in natürlicher Reihenfolge – Ordnung der Standard-Leiter. */
export const KONFEKTIONSGROESSEN: readonly string[] = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL',
];

/** Kindergrößen = Körpergröße in cm, wie der Lieferant sie führt (92 … 164). Natürliche Reihenfolge. */
export const KINDERGROESSEN: readonly string[] = [
  '56', '62', '68', '74', '80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152', '158', '164', '170', '176',
];

/** Art der Größenskala – bestimmt die „nächste Größe"-Strategie. Offen, damit
 *  neue Skalen (z.B. Schuhgrößen) hinzukommen können, ohne den Kern zu ändern. */
export type GroessenSkalaTyp = 'konfektion' | 'kopfweite' | 'einheit' | 'mass' | (string & {});

export interface GroessenLeiter {
  id: string;
  typ: GroessenSkalaTyp;
  /** Bekannte Ordnung (geordnet-diskrete Skalen). Leer bei rein metrischen. */
  ordnung: readonly string[];
  /** Referenzgröße (z.B. für das Live-Lineal); Bestand: 'M'. */
  referenz?: string;
  /** Anzeigevokabular („Größe"/„Größen", „Kopfweite"/…). */
  vokabular: { singular: string; plural: string };
  /** Numerische Metrik für kontinuierliche Skalen (typ 'mass'). */
  metrik?: (label: string) => number;
}

export const DEFAULT_GROESSEN_LEITER = 'konfektion-eu';

/**
 * Kindergrößen-Leitern. Die Lieferanten bezeichnen Kindergrößen NICHT einheitlich – jedes Schema bekommt seine eigene,
 * geordnete Leiter, und die Produkte nennen sie über `sizeScale`. Die Bezeichnungen stehen exakt so da, wie der Lieferant
 * sie führt (nichts umgerechnet, nichts geraten); die Leiter-Ordnung muss GROSSBUCHSTABEN tragen (indexIn vergleicht so).
 *   kinder-cm      Körpergröße in cm                       (Fruit of the Loom, Just Hoods …)
 *   kinder-doppel  zwei Körpergrößen je Größe              (Neutral)
 *   kinder-alter   Alter mit Körpergröße in Klammern       (B&C)
 *   kinder-jugend  Jugendgrößen XS … XL, ab 140 cm          (Gildan Youth T-Shirt)
 *   kinder-gildan  Kindergrößen XS … XL, 104 … 176 cm       (Gildan Youth Sweat/Hoodie)
 *   kinder-jahre   Kindergrößen XXS … XL mit Lebensjahren   (Just Hoods)
 * Alle sind geordnet-diskret ('konfektion'): „nächste Größe“ beim Produktwechsel läuft über den Index.
 */
function kinderLeiter(id: string, ordnung: readonly string[], referenz: string): GroessenLeiter {
  return { id, typ: 'konfektion', ordnung, referenz, vokabular: { singular: 'Größe', plural: 'Größen' } };
}
export const KINDER_LEITERN: Record<string, GroessenLeiter> = {
  'kinder-cm': kinderLeiter('kinder-cm', KINDERGROESSEN, '128'),
  'kinder-doppel': kinderLeiter('kinder-doppel', ['92/98', '104/110', '116/122', '128/134', '140/146', '152/158'], '128/134'),
  'kinder-alter': kinderLeiter(
    'kinder-alter',
    ['3/4 (98/104)', '5/6 (110/116)', '7/8 (122/128)', '9/11 (134/146)', '12/13 (152/161)'],
    '7/8 (122/128)'
  ),
  'kinder-jugend': kinderLeiter('kinder-jugend', ['XS (140/152)', 'S (164)', 'M (170)', 'L (176)', 'XL (182+)'], 'S (164)'),
  'kinder-gildan': kinderLeiter('kinder-gildan', ['XS (104/110)', 'S (116/128)', 'M (140/152)', 'L (164)', 'XL (176)'], 'M (140/152)'),
  'kinder-jahre': kinderLeiter(
    'kinder-jahre',
    ['XXS (1-2YRS)', 'XS (3-4YRS)', 'S (5-6YRS)', 'M (7-8YRS)', 'L (9-11YRS)', 'XL (12-13YRS)'],
    'M (7-8YRS)'
  ),
};

/**
 * Alle bekannten Größenleitern. Heute nur Konfektion (der gesamte Bestand);
 * kopfweite/einheit/mass kommen mit ihren Produktgruppen hinzu – die Strategien
 * in `naechsteGroesse` sind bereits dafür vorbereitet.
 */
export const GROESSEN_LEITERN: Record<string, GroessenLeiter> = {
  'konfektion-eu': {
    id: 'konfektion-eu',
    typ: 'konfektion',
    ordnung: KONFEKTIONSGROESSEN,
    referenz: 'M',
    vokabular: { singular: 'Größe', plural: 'Größen' },
  },
  ...KINDER_LEITERN,
};

/** Die Standard-Leiter (Konfektion) – nie undefined. */
const KONFEKTION = GROESSEN_LEITERN[DEFAULT_GROESSEN_LEITER]!;

/**
 * Kleinste GRÖSSE mit Stückzahl > 0 – die Größe, gegen die eine
 * größenabhängige Druckfläche (PrintArea.bySize, config/printAreas.ts)
 * geprüft werden muss, wenn eine Bestellposition mehrere Größen gleichzeitig
 * umfasst. Ein Motiv wird EINMAL platziert und identisch auf jede bestellte
 * Größe gedruckt (Standard-Praxis bei Sammelaufträgen) – es muss also auf
 * der KLEINSTEN Größe passen, sonst würde es dort über den bedruckbaren
 * Bereich hinausragen, obwohl es auf der größeren Größe frei Platz hätte.
 *
 * `undefined`, wenn keine Größe eine Stückzahl > 0 trägt (Warenkorb noch
 * leer) – Aufrufer fallen dann auf ihren eigenen Standard zurück (z.B. die
 * Referenzgröße der Leiter).
 */
export function kleinsteBestellteGroesse(
  sizeQuantities: Record<string, number>,
  leiter: GroessenLeiter = KONFEKTION
): string | undefined {
  const bestellte = Object.keys(sizeQuantities).filter((s) => (sizeQuantities[s] ?? 0) > 0);
  if (bestellte.length === 0) return undefined;
  return bestellte.reduce((kleinste, g) =>
    groessenRang(g, leiter) < groessenRang(kleinste, leiter) ? g : kleinste
  );
}

/**
 * Die Größenleiter eines Produkts: eigener `sizeScale`-Override zuerst, sonst
 * die Leiter seiner Produktart (Register), sonst die Konfektions-Standardleiter.
 */
export function groessenLeiterVon(p: ProductConfig): GroessenLeiter {
  const id = p.sizeScale ?? PRODUCT_TYPES[p.productType]?.groessenLeiter ?? DEFAULT_GROESSEN_LEITER;
  return GROESSEN_LEITERN[id] ?? KONFEKTION;
}

/** Roher Index in einer Leiter-Ordnung; -1, wenn unbekannt. */
function indexIn(groesse: string, leiter: GroessenLeiter): number {
  return leiter.ordnung.indexOf(groesse.toUpperCase());
}

/**
 * Rang zum Sortieren innerhalb einer Leiter. Unbekannte Größen landen hinten
 * (Rang = Länge der Ordnung), sodass eine neue Bezeichnung die Sortierung nicht
 * bricht, sondern ans Ende fällt und dort auffällt. Ohne Leiter gilt Konfektion
 * (byte-identisch zur früheren, konfektionsfesten Sortierung).
 */
export function groessenRang(groesse: string, leiter: GroessenLeiter = KONFEKTION): number {
  const i = indexIn(groesse, leiter);
  return i === -1 ? leiter.ordnung.length : i;
}

/**
 * Rang einer Größe in der Größen-Facette des Shops (Filterleiste), die Größen mehrerer Leitern in EINER Liste zeigt:
 * zuerst die Konfektionsgrößen, danach die Kinder-Leitern in fester Folge (cm, Doppelgrößen, Alter, Gildan, Jugend,
 * Jahre), innerhalb jeder Leiter in deren Ordnung. Unbekannte Bezeichnungen ganz hinten. So bleibt jede Leiter für sich
 * richtig sortiert, ohne Größen verschiedener Schemata zu vermischen oder umzurechnen.
 */
export function groessenFacettenRang(groesse: string): number {
  const g = groesse.toUpperCase();
  const konf = KONFEKTION.ordnung.indexOf(g);
  if (konf !== -1) return konf;
  let offset = KONFEKTION.ordnung.length;
  for (const leiter of Object.values(KINDER_LEITERN)) {
    const i = leiter.ordnung.indexOf(g);
    if (i !== -1) return offset + i;
    offset += leiter.ordnung.length;
  }
  return offset;
}

/**
 * Die dem Wunsch nächstgelegene verfügbare Größe – Strategie nach Leiter-Typ.
 *
 *   • geordnet-diskret (konfektion/kopfweite): nächste per Index; ist der Wunsch
 *     dieser Leiter fremd, gibt es keine sinnvolle Nähe → undefined.
 *   • einheit: die (einzige) verfügbare Größe – so geht die Menge beim
 *     Produktwechsel NIE verloren (der frühere Bruch H2).
 *   • mass: nächster Wert per Metrik.
 */
export function naechsteGroesse(
  wunsch: string,
  verfuegbar: string[],
  leiter: GroessenLeiter
): string | undefined {
  if (verfuegbar.includes(wunsch)) return wunsch;
  if (verfuegbar.length === 0) return undefined;

  switch (leiter.typ) {
    case 'einheit':
      return verfuegbar[0];

    case 'mass': {
      if (!leiter.metrik) return verfuegbar[0];
      const ziel = leiter.metrik(wunsch);
      if (!Number.isFinite(ziel)) return undefined;
      let beste: string | undefined;
      let besterAbstand = Infinity;
      for (const g of verfuegbar) {
        const m = leiter.metrik(g);
        if (!Number.isFinite(m)) continue;
        const d = Math.abs(m - ziel);
        if (d < besterAbstand) {
          besterAbstand = d;
          beste = g;
        }
      }
      return beste;
    }

    default: {
      // geordnet-diskret (konfektion, kopfweite …)
      const rang = indexIn(wunsch, leiter);
      if (rang === -1) return undefined; // Wunsch nicht in dieser Leiter
      let beste: string | undefined;
      let besterAbstand = Infinity;
      for (const g of verfuegbar) {
        const r = indexIn(g, leiter);
        if (r === -1) continue;
        const d = Math.abs(r - rang);
        // Bei Gleichstand die kleinere Größe bevorzugen (fällt niemandem zu eng aus).
        if (d < besterAbstand || (d === besterAbstand && beste !== undefined && r < indexIn(beste, leiter))) {
          besterAbstand = d;
          beste = g;
        }
      }
      return beste;
    }
  }
}
