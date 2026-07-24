/**
 * Produktbaum des Konfigurators – reine Logik, keine Darstellung.
 *
 * Der linke Bereich im Konfigurator ist ein *Browser*, kein Filterbereich:
 * Die Kundschaft steckt bereits im Konfigurator und will schnell zwischen
 * Kleidungsstücken wechseln. Sie navigiert deshalb durch einen Baum
 * (Hauptgruppe → Produktart → Modell) und muss nichts filtern. Filter sind
 * eine optionale Hilfe und wirken hier nur als Vorauswahl auf den Baum.
 *
 * ── Die Navigationsregel ───────────────────────────────────────────────
 * Die interne Klassifizierung ist NICHT die Navigation. Gemessen am echten
 * Katalog (43 Artikel) trägt die reine Klassifizierung nicht:
 *
 *     Herren 14 (nur T-Shirt, Longsleeve, Polo)
 *     Damen  10 (nur T-Shirt, Polo)
 *     Unisex 29 (alle sieben Arten)
 *
 * Wer „Herren" öffnet und einen Kapuzenpullover sucht, fände dort keinen –
 * sämtliche Hoodies, Zip-Hoodies, Sweater und Jacken sind Unisex. Deshalb:
 * Unisexware erscheint ZUSÄTZLICH unter Herren und Damen. Reine Herrenware
 * bleibt bei Herren, reine Damenware bei Damen. Ergebnis: alle drei Gruppen
 * führen alle sieben Produktarten, kein Artikel versteckt sich hinter der
 * Datenstruktur. Die Gruppen überschneiden sich dadurch bewusst – die Summe
 * ihrer Zähler ist größer als der Bestand, und das ist richtig so.
 */
import type { ProductConfig } from '@/config/products/types';
import { PRODUCT_TYPE_LABELS } from '@/config/products/types';
import { geschlechterVon } from '@/config/products/facetten';
import { QUALITY_TIER_LABELS } from '@/config/qualityTiers';
import type { ProductType, QualityTier } from '@/types';

export type Hauptgruppe = 'herren' | 'damen' | 'unisex';

export const HAUPTGRUPPEN: Hauptgruppe[] = ['herren', 'damen', 'unisex'];

export const HAUPTGRUPPEN_LABELS: Record<Hauptgruppe, string> = {
  herren: 'Herren', damen: 'Damen', unisex: 'Unisex',
};

/** Reihenfolge der Produktarten – von der häufigsten Anfrage abwärts. */
export const ARTFOLGE: ProductType[] = [
  'tshirt', 'polo', 'hoodie', 'zip-hoodie', 'sweater', 'longsleeve', 'jacket', 'vest',
];

/**
 * Gehört ein Artikel in der Navigation zu dieser Hauptgruppe?
 *
 * Unisex zählt in alle drei Gruppen; die Gruppe „Unisex" selbst führt
 * ausschließlich Unisexware und ist damit ein zusätzlicher Einstieg, keine
 * Ausweichgruppe.
 */
export function gehoertZu(p: ProductConfig, gruppe: Hauptgruppe): boolean {
  const eigen = geschlechterVon(p);
  const istUnisex = eigen.includes('unisex');
  if (gruppe === 'unisex') return istUnisex;
  return istUnisex || eigen.includes(gruppe);
}

/** Optionale Einschränkungen. Alle Felder wirken als UND. */
export type Browserfilter = {
  suche: string;
  nurFavoriten: boolean;
  favoriten: string[];
  marke?: string;
  qualitaet?: QualityTier;
  material?: string;
  preisMax?: number;
};

export const LEERER_FILTER: Browserfilter = {
  suche: '', nurFavoriten: false, favoriten: [],
  marke: undefined, qualitaet: undefined, material: undefined, preisMax: undefined,
};

/** Sind über die Suche hinaus Filter gesetzt? Steuert den Zähler am Knopf. */
export function anzahlAktiverFilter(f: Browserfilter): number {
  let n = 0;
  if (f.marke) n++;
  if (f.qualitaet) n++;
  if (f.material) n++;
  if (f.preisMax !== undefined) n++;
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

export function passtZumFilter(p: ProductConfig, f: Browserfilter): boolean {
  if (f.nurFavoriten && !f.favoriten.includes(p.id)) return false;
  if (f.marke && p.brand !== f.marke) return false;
  if (f.qualitaet && p.qualityTier !== f.qualitaet) return false;
  if (f.material && p.material !== f.material) return false;
  if (f.preisMax !== undefined && p.basePrice > f.preisMax) return false;
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
 * Die drei Hauptgruppen bleiben immer erhalten – auch wenn eine Suche sie
 * leer räumt. Sonst spränge die Navigation beim Tippen. Produktarten ohne
 * Treffer verschwinden dagegen, denn ein leerer Ast lädt zum Klicken ein und
 * enttäuscht dann.
 */
export function baueBaum(produkte: ProductConfig[], filter: Browserfilter): Gruppenknoten[] {
  const treffer = produkte.filter((p) => passtZumFilter(p, filter));

  return HAUPTGRUPPEN.map((gruppe) => {
    const drin = treffer.filter((p) => gehoertZu(p, gruppe));

    const arten: Artknoten[] = ARTFOLGE.map((art) => {
      const modelle = drin
        .filter((p) => p.productType === art)
        // Günstigste zuerst: die Kundschaft steigt beim Stöbern über den
        // Preis ein, nicht über den Modellnamen.
        .sort((a, b) => a.basePrice - b.basePrice || a.name.localeCompare(b.name, 'de'));
      return { art, label: PRODUCT_TYPE_LABELS[art], anzahl: modelle.length, modelle };
    }).filter((a) => a.anzahl > 0);

    return {
      gruppe,
      label: HAUPTGRUPPEN_LABELS[gruppe],
      anzahl: drin.length,
      arten,
    };
  });
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
    { text: `${p.weightGsm} g/m²`, ton: 'neutral' },
  ];
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
