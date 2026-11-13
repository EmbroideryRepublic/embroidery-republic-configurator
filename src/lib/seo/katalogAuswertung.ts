/**
 * Auswertung des Katalogs für die Ratgeberseiten „Größentabelle“ und „Stoffgewicht“ (config/seo/anlassSeiten.ts).
 *
 * Alle Zahlen stammen aus den Produktdaten (Herstellerangaben: `sizeGuide.measurements`, `weightGsm`) und werden beim Bau der
 * Seite berechnet – nichts davon steht von Hand im Text. Reine Funktionen, keine Datenbank, kein Netz.
 *
 * Die Beispielmodelle der Größentabellen sind keine reinen Damenmodelle (die Seiten sprechen alle an); Gewichtsklassen und
 * Spannen zählen das ganze Sortiment. Wie bei den übrigen Anlassseiten gilt: lieber ein roter Build als eine Seite mit leerer
 * oder falscher Tabelle.
 */
import type { ProductConfig } from '@/config/products/types';
import { geschlechterVon } from '@/config/products/facetten';
import { PRODUCTS } from '@/config/products';
import { sortiere } from '@/lib/catalog/filter';
import { LEERE_KRITERIEN } from '@/lib/catalog/kriterien';

/** „Fruit of the Loom Valueweight T“ statt „Fruit of the Loom Fruit of the Loom Valueweight T“: manche Produktnamen tragen die Marke schon. */
export function markeUndName(p: { brand: string; name: string }): string {
  const name = p.name.replace(/[®™]/g, '');
  return name.toLowerCase().startsWith(p.brand.toLowerCase().replace(/[®™]/g, '')) ? name : `${p.brand.replace(/[®™]/g, '')} ${name}`;
}

/** Produktarten, für die es Tabellen gibt. */
export type TabellenArt = 'tshirt' | 'hoodie' | 'polo';
export const TABELLEN_ARTEN: readonly TabellenArt[] = ['tshirt', 'hoodie', 'polo'];

function nurDamen(p: ProductConfig): boolean {
  const g = geschlechterVon(p);
  return g.length > 0 && g.every((x) => x === 'damen');
}

/** ALLE Modelle einer Art in der Standard-Sortierung des Katalogs (nicht nur die erste Seite der Filteransicht). */
function alleDerArt(art: TabellenArt): ProductConfig[] {
  return sortiere(
    PRODUCTS.filter((p) => p.productType === art),
    LEERE_KRITERIEN.sortierung,
    {}
  );
}

/** Wie alleDerArt, ohne reine Damenmodelle (für die Beispielmodelle der Größentabellen). */
function modelleDerArt(art: TabellenArt): ProductConfig[] {
  return alleDerArt(art).filter((p) => !nurDamen(p));
}

// ── Größentabellen ──────────────────────────────────────────────────────

/** Größen der Tabelle: die, die jedes gezeigte Modell führt. */
export const TABELLEN_GROESSEN = ['S', 'M', 'L', 'XL', 'XXL'] as const;
/** So viele Modelle zeigt eine Tabelle. */
export const MODELLE_JE_TABELLE = 3;

export interface Mass {
  breiteCm: number;
  laengeCm: number;
}

export interface GroessenTabelle {
  art: TabellenArt;
  modelle: { id: string; name: string; brand: string; passform: string; masse: Record<string, Mass> }[];
  groessen: readonly string[];
}

/** Die ersten Modelle der Art, die für alle Tabellengrößen Maße führen. */
export function groessenTabelle(art: TabellenArt): GroessenTabelle {
  const modelle: GroessenTabelle['modelle'] = [];
  for (const p of modelleDerArt(art)) {
    const zeilen = p.sizeGuide?.measurements ?? [];
    const masse: Record<string, Mass> = {};
    for (const z of zeilen) {
      if ((TABELLEN_GROESSEN as readonly string[]).includes(z.size)) masse[z.size] = { breiteCm: z.breiteCm, laengeCm: z.hoeheCm };
    }
    // Zwei Modelle mit denselben Maßen (z. B. Schwestermodelle desselben Herstellers) zeigen nichts Neues – das nächste Modell zählt.
    const gleich = modelle.some((m) => TABELLEN_GROESSEN.every((g) => m.masse[g]!.breiteCm === masse[g]?.breiteCm && m.masse[g]!.laengeCm === masse[g]?.laengeCm));
    if (!gleich && TABELLEN_GROESSEN.every((g) => masse[g] !== undefined)) {
      modelle.push({ id: p.id, name: p.name, brand: p.brand, passform: p.fit, masse });
    }
    if (modelle.length === MODELLE_JE_TABELLE) break;
  }
  if (modelle.length < MODELLE_JE_TABELLE) {
    throw new Error(`Größentabelle "${art}": nur ${modelle.length} Modelle mit vollständigen Maßen (${TABELLEN_GROESSEN.join(', ')}).`);
  }
  return { art, modelle, groessen: TABELLEN_GROESSEN };
}

// ── Stoffgewicht ────────────────────────────────────────────────────────

export interface GewichtsBand {
  label: string;
  /** Untergrenze inklusive, Obergrenze exklusive (g/m²). */
  von: number;
  bis: number;
}

/** Gewichtsklassen je Art – Grenzen so gewählt, dass sie zu den Herstellerwerten passen (T-Shirt 130–220, Hoodie 240–540, Polo 170–240). */
export const GEWICHTS_BAENDER: Record<TabellenArt, GewichtsBand[]> = {
  tshirt: [
    { label: 'unter 150 g/m²', von: 0, bis: 150 },
    { label: '150 bis 169 g/m²', von: 150, bis: 170 },
    { label: '170 bis 199 g/m²', von: 170, bis: 200 },
    { label: 'ab 200 g/m²', von: 200, bis: Infinity },
  ],
  hoodie: [
    { label: 'unter 260 g/m²', von: 0, bis: 260 },
    { label: '260 bis 299 g/m²', von: 260, bis: 300 },
    { label: 'ab 300 g/m²', von: 300, bis: Infinity },
  ],
  polo: [
    { label: 'unter 180 g/m²', von: 0, bis: 180 },
    { label: '180 bis 199 g/m²', von: 180, bis: 200 },
    { label: 'ab 200 g/m²', von: 200, bis: Infinity },
  ],
};

export interface GewichtsKlasse {
  band: GewichtsBand;
  anzahl: number;
  /** Bis zu drei Beispielmodelle (aus der Standard-Sortierung). */
  beispiele: { id: string; name: string; brand: string; gewicht: number }[];
}

export interface GewichtsUebersicht {
  art: TabellenArt;
  /** Alle Modelle der Art mit Gewichtsangabe. */
  gesamt: number;
  min: number;
  max: number;
  klassen: GewichtsKlasse[];
}

export function gewichtsUebersicht(art: TabellenArt): GewichtsUebersicht {
  // Gewichtsklassen gelten für das GANZE Sortiment der Art (auch Damenschnitte).
  const mitGewicht = alleDerArt(art).filter((p): p is ProductConfig & { weightGsm: number } => typeof p.weightGsm === 'number');
  if (mitGewicht.length === 0) throw new Error(`Stoffgewicht "${art}": kein Modell mit Gewichtsangabe.`);
  const gewichte = mitGewicht.map((p) => p.weightGsm);
  const klassen = GEWICHTS_BAENDER[art].map((band) => {
    const treffer = mitGewicht.filter((p) => p.weightGsm >= band.von && p.weightGsm < band.bis);
    return {
      band,
      anzahl: treffer.length,
      beispiele: treffer.slice(0, 3).map((p) => ({ id: p.id, name: p.name, brand: p.brand, gewicht: p.weightGsm })),
    };
  });
  return { art, gesamt: mitGewicht.length, min: Math.min(...gewichte), max: Math.max(...gewichte), klassen };
}

/** Kleinstes und größtes Stoffgewicht einer Art (für Platzhalter in den Texten) – dieselbe Auswahl wie die Tabellen. */
export function gewichtsSpanne(art: TabellenArt): { min: number; max: number } {
  const u = gewichtsUebersicht(art);
  return { min: u.min, max: u.max };
}
