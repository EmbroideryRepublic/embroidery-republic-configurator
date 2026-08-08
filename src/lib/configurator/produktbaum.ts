/**
 * Produktbaum des Konfigurators – reine Logik, keine Darstellung.
 *
 * Der linke Bereich im Konfigurator ist ein *Browser*, kein Filterbereich:
 * Die Kundschaft steckt bereits im Konfigurator und will schnell zwischen
 * Kleidungsstücken wechseln. Sie navigiert deshalb durch einen Baum
 * (Hauptgruppe → Produktart → Modell) und muss nichts filtern. Filter sind
 * eine optionale Hilfe und wirken hier nur als Vorauswahl auf den Baum.
 *
 * ── Die Navigationsregel: achsengetrieben, KEINE feste Achse ────────────
 * Die oberste Baumebene (Hauptgruppen) kommt NICHT aus fest verdrahtetem
 * Herren/Damen/Unisex, sondern aus der Navigationsachsen-Registry
 * (config/products/naviAchsen.ts). Jede Produktart nennt im PRODUCT_TYPES-
 * Register ihre `naviAchse`; die Registry liefert deren Gruppen und die
 * Zuordnung eines Produkts. So lässt sich der Katalog künftig nach Geschlecht,
 * Einsatzgebiet, Saison, Zielgruppe, Hersteller … gliedern – rein über Daten.
 *
 * Überschneidung ist eine Eigenschaft der Achse, nicht der Kernlogik: Bei der
 * Geschlechtsachse erscheint Unisexware zusätzlich unter Herren und Damen,
 * sodass kein Artikel hinter der Klassifizierung verschwindet; die Summe der
 * Gruppenzähler ist dann größer als der Bestand, und das ist richtig so.
 */
import type { ProductConfig, Farbgruppe } from '@/config/products/types';
import { produktTypLabel, PRODUCT_TYPE_ORDER } from '@/config/products/types';
import { AKTIVE_ACHSEN, produktAchsenId } from '@/config/products/naviAchsen';
import { QUALITY_TIER_LABELS } from '@/config/qualityTiers';
import { farbgruppenVon } from '@/lib/catalog/filter';
import type { ProductType, QualityTier } from '@/types';

/** ID einer Navigationsgruppe (oberste Baumebene). Offen – die gültigen Werte
 *  liefert die aktive Navigationsachse (naviAchsen.ts), nicht dieser Typ.
 *  Der Name ist achsenneutral („Hauptgruppe" = oberste Ebene), die Werte sind
 *  es seit M3.4 ebenfalls. */
export type Hauptgruppe = string;

/** Reihenfolge der Produktarten – von der häufigsten Anfrage abwärts.
 *  Zentral in PRODUCT_TYPE_ORDER (config/products/types); hier nur der fachlich
 *  sprechende Navigations-Alias. */
export const ARTFOLGE: readonly ProductType[] = PRODUCT_TYPE_ORDER;

/** Optionale Einschränkungen. Alle Felder wirken als UND; innerhalb von
 *  `groesse`/`farbe` (Mehrfachauswahl) wirken die gewählten Werte als ODER –
 *  wie bei jedem Fashion-Filter: „S ODER M", nicht „S UND M". */
export type Browserfilter = {
  suche: string;
  nurFavoriten: boolean;
  favoriten: string[];
  marke?: string;
  qualitaet?: QualityTier;
  material?: string;
  preisMax?: number;
  groesse: string[];
  farbe: Farbgruppe[];
};

export const LEERER_FILTER: Browserfilter = {
  suche: '', nurFavoriten: false, favoriten: [],
  marke: undefined, qualitaet: undefined, material: undefined, preisMax: undefined,
  groesse: [], farbe: [],
};

/** Sind über die Suche hinaus Filter gesetzt? Steuert den Zähler am Knopf. */
export function anzahlAktiverFilter(f: Browserfilter): number {
  let n = 0;
  if (f.marke) n++;
  if (f.qualitaet) n++;
  if (f.material) n++;
  if (f.preisMax !== undefined) n++;
  if (f.groesse.length > 0) n++;
  if (f.farbe.length > 0) n++;
  return n;
}

/**
 * Die Suche greift auf den GESAMTEN Katalog, nicht auf den geöffneten Ast –
 * wer „Gildan" eintippt, will alles von Gildan sehen, egal wo es im Baum
 * hängt. Gesucht wird in Name, Marke und Material.
 */
export function passtZurSuche(p: ProductConfig, suche: string): boolean {
  const q = suche.trim().toLowerCase();
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.material.toLowerCase().includes(q)
  );
}

/**
 * Passt ein Produkt auf den Filter?
 *
 * `ausser` blendet EINE Mehrfachauswahl-Dimension aus (groesse/farbe) – das
 * braucht die Facettenzählung im Filterpanel: Wie viele Treffer hätte „M",
 * wenn man es JETZT zusätzlich anhakt? Ohne diesen Ausschluss würde nach der
 * Wahl von „M" jede andere Größe 0 Treffer zeigen, sobald nur EINE Größe
 * gewählt werden könnte – dieselbe Systematik wie `passt()` in
 * lib/catalog/filter.ts (Surface A des Katalogs).
 */
export function passtZumFilter(p: ProductConfig, f: Browserfilter, ausser?: 'groesse' | 'farbe'): boolean {
  if (f.nurFavoriten && !f.favoriten.includes(p.id)) return false;
  if (f.marke && p.brand !== f.marke) return false;
  if (f.qualitaet && p.qualityTier !== f.qualitaet) return false;
  if (f.material && p.material !== f.material) return false;
  if (f.preisMax !== undefined && p.basePrice > f.preisMax) return false;
  if (ausser !== 'groesse' && f.groesse.length > 0 && !f.groesse.some((g) => p.sizes.includes(g))) return false;
  if (ausser !== 'farbe' && f.farbe.length > 0 && !f.farbe.some((g) => farbgruppenVon(p).includes(g))) return false;
  return passtZurSuche(p, f.suche);
}

export type Artknoten = {
  art: ProductType;
  label: string;
  anzahl: number;
  modelle: ProductConfig[];
};

export type Gruppenknoten = {
  gruppe: Hauptgruppe;
  label: string;
  anzahl: number;
  arten: Artknoten[];
};

/**
 * Baut den vollständigen Baum.
 *
 * Die Hauptgruppen der aktiven Achsen bleiben immer erhalten – auch wenn eine
 * Suche sie leer räumt. Sonst spränge die Navigation beim Tippen. Produktarten
 * ohne Treffer verschwinden dagegen, denn ein leerer Ast lädt zum Klicken ein
 * und enttäuscht dann. Welche Gruppen es gibt, bestimmt allein die
 * Navigationsachsen-Registry (naviAchsen.ts) – keine feste Achse im Code.
 */
export function baueBaum(produkte: ProductConfig[], filter: Browserfilter): Gruppenknoten[] {
  const treffer = produkte.filter((p) => passtZumFilter(p, filter));
  const knoten: Gruppenknoten[] = [];

  // Über alle im Katalog aktiven Achsen und deren Gruppen. Ein Produkt erscheint
  // unter einer Gruppe, wenn es der Achse dieser Gruppe angehört UND die Achse es
  // der Gruppe zuordnet (Überschneidung möglich, z.B. Unisex in drei Gruppen).
  for (const achse of AKTIVE_ACHSEN) {
    for (const gruppe of achse.gruppen) {
      const drin = treffer.filter(
        (p) => produktAchsenId(p) === achse.id && achse.gruppenVon(p).includes(gruppe.id)
      );

      const arten: Artknoten[] = ARTFOLGE.map((art) => {
        const modelle = drin
          .filter((p) => p.productType === art)
          // Günstigste zuerst: die Kundschaft steigt beim Stöbern über den
          // Preis ein, nicht über den Modellnamen.
          .sort((a, b) => a.basePrice - b.basePrice || a.name.localeCompare(b.name, 'de'));
        return { art, label: produktTypLabel(art), anzahl: modelle.length, modelle };
      }).filter((a) => a.anzahl > 0);

      knoten.push({ gruppe: gruppe.id, label: gruppe.label, anzahl: drin.length, arten });
    }
  }

  return knoten;
}

/**
 * Kurzform der Zusammensetzung für ein Badge.
 *
 * Die Materialstrings im Katalog sind lang und mit Ausnahmen gespickt
 * („80% Baumwolle, 20% Polyester (Anthrazit: 52%/48%…)"). Für eine Karte
 * braucht es ein Wort, das nichts Falsches behauptet: bio bleibt bio, ein
 * Mischgewebe wird nicht zu „100 % Baumwolle" geschönt.
 */
export function materialKurz(material: string): string {
  const m = material.toLowerCase();
  const bio = m.includes('biologisch') || m.includes('bio-');
  const polyester = m.includes('polyester');
  if (bio) return polyester ? 'Bio-Mix' : 'Bio-Baumwolle';
  if (m.startsWith('100% baumwolle')) return '100 % Baumwolle';
  if (m.includes('baumwolle') && polyester) return 'Baumwoll-Mix';
  if (polyester) return 'Polyester';
  // Rest (z. B. Elastan-Anteile): erstes Segment vor der Klammer.
  return material.split('(')[0]!.trim();
}

export type BadgeTon = 'neutral' | 'bio' | 'gold';
export type Badge = { text: string; ton: BadgeTon };

/**
 * Dezente Merkmale einer Modellkarte. Bewusst wenige – zwei bis drei –, damit
 * die Karte ruhig bleibt: Zusammensetzung, Flächengewicht und, nur wenn es
 * etwas hervorzuheben gibt, die Güteklasse (Premium/Luxury in Gold).
 */
export function modellBadges(p: ProductConfig): Badge[] {
  const bio = /biologisch|bio-/i.test(p.material);
  const badges: Badge[] = [
    { text: materialKurz(p.material), ton: bio ? 'bio' : 'neutral' },
  ];
  if (p.weightGsm) badges.push({ text: `${p.weightGsm} g/m²`, ton: 'neutral' });
  if (p.qualityTier === 'premium' || p.qualityTier === 'luxury') {
    badges.push({ text: QUALITY_TIER_LABELS[p.qualityTier], ton: 'gold' });
  }
  return badges;
}

/** Modelle eines Astes – für die Liste neben dem Baum. */
export function modelleVon(
  baum: Gruppenknoten[],
  gruppe: Hauptgruppe,
  art: ProductType
): ProductConfig[] {
  return baum.find((g) => g.gruppe === gruppe)?.arten.find((a) => a.art === art)?.modelle ?? [];
}
