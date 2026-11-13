/**
 * Logik der Anlass- und Ratgeberseiten.
 *
 * Die TEXTE stehen in `config/seo/anlassSeiten.ts`. Hier wird daraus die Seite gebaut: Katalogfakten und
 * Konfigurationswerte einsetzen, Modelle wählen, Preisbeispiele für die Preis-Engine vorbereiten.
 * Nichts davon wird von Hand eingetragen, damit es nicht veraltet.
 *
 * Fail-fast wie bei den Kategorie- und DTF-Seiten: Ein unbekannter Platzhalter, eine Seite ohne Modelle oder ein
 * Beispiel ohne Produkt bricht den Build ab – lieber ein roter Build als eine veröffentlichte Seite mit falschem
 * oder leerem Inhalt.
 */
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import { produktTypLabelPlural } from '@/config/products/types';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { ANLASS_SEITEN, type AnlassBeispiel, type AnlassSeite } from '@/config/seo/anlassSeiten';
import type { KategorieBeispiel } from '@/config/seo/kategorieSeiten';
import { sortiere } from '@/lib/catalog/filter';
import { LEERE_KRITERIEN } from '@/lib/catalog/kriterien';
import { gewichtsSpanne, TABELLEN_ARTEN, type TabellenArt } from '@/lib/seo/katalogAuswertung';
import { geschlechterVon } from '@/config/products/facetten';
import { MIN_DPI, OK_DPI, ZIEL_DPI } from '@/lib/canvas/logoQualitaet';
import { formatiereGeld } from '@/lib/format';
import type { ProductType } from '@/types';

export { alleAnlassSlugs, anlassSeiteVon } from './anlassAdresse';

/** Druckbreiten (cm) der Auflösungstabelle auf der Ratgeberseite zu Druckdaten. */
export const AUFLOESUNG_BREITEN_CM = [5, 10, 15, 20, 25, 30] as const;

/** Mindestbreite des Bildes in Pixeln für eine Druckbreite bei gegebener Auflösung (aufgerundet). */
export function mindestPixel(breiteCm: number, dpi: number): number {
  return Math.ceil((breiteCm / 2.54) * dpi);
}

/** „A, B und C" aus einer Liste. */
function listeMitUnd(eintraege: string[]): string {
  if (eintraege.length <= 1) return eintraege[0] ?? '';
  return `${eintraege.slice(0, -1).join(', ')} und ${eintraege[eintraege.length - 1]}`;
}

export interface AnlassFakten {
  /** Die gezeigten Modelle, in der Reihenfolge der Kachel-Angaben (je Art die ersten Treffer der Katalog-Sortierung). */
  kacheln: ProductConfig[];
  /** Alle Modelle der genannten Arten (nicht nur die gezeigten). */
  anzahl: number;
  arten: ProductType[];
}

/** Reine Damenmodelle (Damenschnitt, V-Ausschnitt-Ladies …): für Vereine, Firmen und Jahrgänge nicht die erste Wahl. */
function nurDamen(p: ProductConfig): boolean {
  const g = geschlechterVon(p);
  return g.length > 0 && g.every((x) => x === 'damen');
}

/**
 * ALLE Modelle einer Art in der Standard-Sortierung des Katalogs (dieselbe Sortierung wie die Filteransicht).
 *
 * KORREKTUR 2026-11-13: Vorher kam die Liste aus `produktAbfrage().finde(…).produkte` – das ist nur die ERSTE SEITE (24 Treffer).
 * „Es gibt 78 Modelle“ zählte deshalb höchstens 24 je Art und die „ab“-Preise sahen nur diese Seite. Gezählt und für „ab“-Preise
 * herangezogen wird jetzt der ganze Katalog; die Modellauswahl (Kacheln) nimmt daraus die ersten Treffer ohne reine Damenmodelle.
 */
function alleProdukteDerArt(art: ProductType): ProductConfig[] {
  return sortiere(
    PRODUCTS.filter((p) => p.productType === art),
    LEERE_KRITERIEN.sortierung,
    {}
  );
}

export function anlassFakten(seite: AnlassSeite): AnlassFakten {
  const gesehen = new Set<string>();
  const kacheln: ProductConfig[] = [];
  let anzahl = 0;
  for (const k of seite.kacheln) {
    const alle = alleProdukteDerArt(k.art);
    if (alle.length === 0) throw new Error(`Anlassseite "${seite.slug}": im Katalog gibt es kein Produkt der Art "${k.art}".`);
    anzahl += alle.length;
    // Die Auswahl zeigt keine reinen Damenmodelle (für Vereine, Firmen und Jahrgänge nicht die erste Wahl); gezählt werden alle.
    for (const p of alle.filter((x) => !nurDamen(x)).slice(0, k.anzahl)) {
      if (gesehen.has(p.id)) continue;
      gesehen.add(p.id);
      kacheln.push(p);
    }
  }
  return { kacheln, anzahl, arten: seite.kacheln.map((k) => k.art) };
}

/** Setzt {platzhalter} ein. Unbekannte oder nicht befüllbare Platzhalter werfen. */
export function fuelleAnlass(text: string, seite: AnlassSeite, f: AnlassFakten): string {
  const werte: Record<string, () => string> = {
    anzahl: () => {
      if (f.anzahl === 0) throw new Error(`{anzahl} in "${seite.slug}" verwendet, die Seite zeigt keine Modelle.`);
      return String(f.anzahl);
    },
    arten: () => {
      if (f.arten.length === 0) throw new Error(`{arten} in "${seite.slug}" verwendet, die Seite zeigt keine Modelle.`);
      return listeMitUnd(f.arten.map((a) => produktTypLabelPlural(a)));
    },
    produktion: () => `${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktagen`,
    produktionszeit: () => `${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktage`,
    versand: () => `${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktagen`,
    versandkosten: () => formatiereGeld(SHIPPING_RATES.DE.cost),
    frei: () => formatiereGeld(SHIPPING_RATES.DE.freeFrom),
    dpiMin: () => String(MIN_DPI),
    dpiOk: () => String(OK_DPI),
    dpiZiel: () => String(ZIEL_DPI),
  };
  return text.replace(/\{(\w+)\}/g, (treffer, name: string) => {
    const gewicht = /^gewicht(Min|Max)_(\w+)$/.exec(name);
    if (gewicht) {
      const art = gewicht[2] as TabellenArt;
      if (!TABELLEN_ARTEN.includes(art)) throw new Error(`${treffer} in "${seite.slug}": für "${art}" gibt es keine Gewichtsauswertung.`);
      const spanne = gewichtsSpanne(art);
      return String(gewicht[1] === 'Min' ? spanne.min : spanne.max);
    }
    const preis = /^abPreis_(\w+)$/.exec(name);
    if (preis) {
      const art = preis[1]!.replace(/_/g, '-') as ProductType;
      const preise = alleProdukteDerArt(art).map((p) => p.basePrice);
      if (preise.length === 0) throw new Error(`${treffer} in "${seite.slug}": kein Produkt der Art "${art}".`);
      return formatiereGeld(Math.min(...preise));
    }
    const wert = werte[name];
    if (!wert) throw new Error(`Unbekannter Platzhalter ${treffer} in Anlasstext: "${text.slice(0, 60)}…"`);
    return wert();
  });
}

// ── Preisbeispiele ──────────────────────────────────────────────────────

/** Bevorzugte Größen für die Beispielverteilung (wie bei den DTF-Seiten). */
const BEISPIEL_GROESSEN = ['M', 'L', 'XL'];

/** Verteilt `menge` Stück gleichmäßig auf die verfügbaren der Größen M, L, XL (sonst auf die ersten drei Größen). */
export function verteileGroessen(menge: number, produkt: ProductConfig): Record<string, number> {
  const verfuegbar = BEISPIEL_GROESSEN.filter((g) => produkt.sizes.includes(g));
  const groessen = verfuegbar.length === BEISPIEL_GROESSEN.length ? verfuegbar : produkt.sizes.slice(0, 3);
  if (groessen.length === 0) throw new Error(`Beispielprodukt ${produkt.id} hat keine Größen.`);
  const nutzbar = menge >= groessen.length ? groessen : groessen.slice(0, menge);
  const basis = Math.floor(menge / nutzbar.length);
  let rest = menge - basis * nutzbar.length;
  const verteilung: Record<string, number> = {};
  for (const g of nutzbar) {
    verteilung[g] = basis + (rest > 0 ? 1 : 0);
    if (rest > 0) rest--;
  }
  return verteilung;
}

/** Das günstigste Erwachsenen-Modell einer Art (ohne reine Damenmodelle) – wie auf den DTF-Seiten das Vergleichsteil der Beispiele. */
export function beispielProdukt(art: ProductType): ProductConfig {
  const produkt = [...PRODUCTS.filter((p) => p.productType === art && !nurDamen(p))].sort((a, b) => a.basePrice - b.basePrice)[0];
  if (!produkt) throw new Error(`Kein Beispielprodukt der Art "${art}".`);
  return produkt;
}

/** Wandelt die Beispiele der Seite in die Eingabe der Preis-Engine (`berechneBeispiele`). */
export function alsKategorieBeispiele(beispiele: AnlassBeispiel[]): KategorieBeispiel[] {
  return beispiele.map((b) => {
    const produkt = beispielProdukt(b.art);
    return {
      beschriftung: b.beschriftung,
      produktId: produkt.id,
      methode: 'dtf' as const,
      groessen: verteileGroessen(b.menge, produkt),
      flaechen: b.flaechen,
    };
  });
}

/** Alle Seiten mit ihren Fakten – für Tests und Prüfungen. */
export function alleAnlassSeitenMitFakten(): { seite: AnlassSeite; fakten: AnlassFakten }[] {
  return ANLASS_SEITEN.map((seite) => ({ seite, fakten: anlassFakten(seite) }));
}
