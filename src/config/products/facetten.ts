/**
 * ═══════════════════════════════════════════════════════════════════════
 * FACETTEN – filterbare Merkmale aus den Katalogdaten
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die Katalogfelder `material`, `fit`, `detailedDescription.gender` und die
 * Farbnamen sind FREITEXT – gute Prosa für die Produktseite, als Filter aber
 * unbrauchbar: 27 verschiedene Materialtexte bei 43 Produkten, 22 Passformen,
 * 50 Farbnamen für rund ein Dutzend Grundfarben.
 *
 * Hier steht die Übersetzung in geschlossene Vokabulare. Bewusst als
 * AUSDRÜCKLICHE Zuordnungstabelle und nicht als Mustererkennung auf dem
 * Freitext: Ein regulärer Ausdruck über Herstellerprosa ist genau so lange
 * richtig, bis ein Lieferant anders formuliert – und scheitert dann still.
 * Eine Tabelle scheitert laut (siehe Wächter-Tests): Sobald ein Produkt einen
 * Wert mitbringt, der hier fehlt, schlägt der Test an und die Einordnung wird
 * einmal bewusst getroffen.
 *
 * Damit bleibt die Zusage erfüllt, dass die Filter „automatisch mitwachsen":
 * Die Filterleiste liest ihre Werte immer aus dem Bestand (keine
 * hartkodierten Optionslisten in der Oberfläche) – diese Datei sagt nur,
 * WELCHER Gruppe ein vorhandener Wert angehört.
 */
import type { ProductConfig } from './types';
import {
  MATERIAL_GRUPPEN_GENERIERT,
  PASSFORMEN_GENERIERT,
  GESCHLECHTER_GENERIERT,
  FARBGRUPPEN_GENERIERT,
} from './facettenGeneriert.generated';

// ── Vokabulare ─────────────────────────────────────────────────────────

export type MaterialGruppe =
  | 'baumwolle-100'
  | 'bio-baumwolle'
  | 'mischgewebe'
  | 'polyester'
  | 'recycelt';

export type Passform = 'regular' | 'slim' | 'tailliert' | 'weit' | 'oversized';

export type Geschlecht = 'damen' | 'herren' | 'unisex';

export type Farbgruppe =
  | 'schwarz' | 'weiss' | 'grau' | 'blau' | 'tuerkis' | 'gruen'
  | 'gelb' | 'orange' | 'rot' | 'rosa' | 'lila' | 'braun' | 'beige';

export const MATERIAL_LABELS: Record<MaterialGruppe, string> = {
  'baumwolle-100': '100 % Baumwolle',
  'bio-baumwolle': 'Bio-Baumwolle',
  mischgewebe: 'Mischgewebe',
  polyester: 'Polyester',
  recycelt: 'Recycelt',
};

export const PASSFORM_LABELS: Record<Passform, string> = {
  regular: 'Regular Fit',
  slim: 'Slim Fit',
  tailliert: 'Tailliert',
  weit: 'Weit geschnitten',
  oversized: 'Oversized',
};

export const GESCHLECHT_LABELS: Record<Geschlecht, string> = {
  damen: 'Damen',
  herren: 'Herren',
  unisex: 'Unisex',
};

export const FARBGRUPPE_LABELS: Record<Farbgruppe, string> = {
  schwarz: 'Schwarz', weiss: 'Weiß', grau: 'Grau', blau: 'Blau',
  tuerkis: 'Türkis', gruen: 'Grün', gelb: 'Gelb', orange: 'Orange',
  rot: 'Rot', rosa: 'Rosa', lila: 'Lila', braun: 'Braun', beige: 'Beige',
};

/** Anzeigefarbe der Farbpunkte in der Filterleiste. */
export const FARBGRUPPE_HEX: Record<Farbgruppe, string> = {
  schwarz: '#2B2B2B', weiss: '#F4F4F5', grau: '#9A9A9A', blau: '#2C4E9C',
  tuerkis: '#0E8F8C', gruen: '#3E7A46', gelb: '#F5CE2A', orange: '#F07C34',
  rot: '#C42B3A', rosa: '#E86A9B', lila: '#6A4E8C', braun: '#6B5341', beige: '#D8C7A8',
};

// ── Zuordnung: Materialtext → Gruppen ──────────────────────────────────
// Mehrwertig: Ein Stoff kann zugleich Bio, Mischgewebe und recycelt sein.
// „100 % Baumwolle (meliert: …)" bleibt Baumwolle: Die Melange-Abweichung
// betrifft einzelne Farben, nicht das Produkt.

const MATERIAL_GRUPPEN_BASIS: Record<string, MaterialGruppe[]> = {
  '100% Baumwolle': ['baumwolle-100'],
  '100% Baumwolle (Grau meliert: 90% Baumwolle/10% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (Grau meliert: 90% Baumwolle/10% Polyester, Dunkelgrau meliert: 50%/50%)': ['baumwolle-100'],
  '100% Baumwolle (Hellgrau meliert: 90%/10% Polyester, Grau meliert: 97%/3% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (Jersey), außer Grau meliert: 90% Baumwolle/10% Polyester, Dunkelgrau meliert: 50% Baumwolle/50% Polyester': ['baumwolle-100'],
  '100% Baumwolle (Piqué), außer Grau meliert: 90% Baumwolle/10% Polyester': ['baumwolle-100'],
  '100% Baumwolle (außer Grau meliert: 85% Baumwolle, 15% Viskose)': ['baumwolle-100'],
  '100% Baumwolle (meliert: 97% Baumwolle, 3% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (meliert: 97-99% Baumwolle, 1-3% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (meliert: 98% Baumwolle, 2% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (meliert: 98-99% Baumwolle, 1-2% Polyester)': ['baumwolle-100'],
  '100% Baumwolle (meliert: Baumwoll-/Polyester-Mischgewebe)': ['baumwolle-100'],
  '100% Baumwolle (meliert: diverse Baumwoll-/Polyester-Mischungen)': ['baumwolle-100'],
  '100% halbgekämmte Ringspun-Baumwolle (Grey Melange: 85% Baumwolle/15% Viskose)': ['baumwolle-100'],
  '100% Micro-Polyester': ['polyester'],
  '100% Polyester (Fleece)': ['polyester'],
  '100% biologisch erzeugte Baumwolle': ['bio-baumwolle', 'baumwolle-100'],
  '100% biologisch erzeugte Baumwolle (Piqué)': ['bio-baumwolle', 'baumwolle-100'],
  '100% biologisch erzeugte, gekämmte Ringspun-Baumwolle (Grau meliert: 97% Baumwolle/3% Viskose)': ['bio-baumwolle', 'baumwolle-100'],
  '100% gekämmte, ringgesponnene Bio-Baumwolle': ['bio-baumwolle', 'baumwolle-100'],
  '50% Baumwolle, 50% Polyester (Fleece, innen angeraut)': ['mischgewebe'],
  '70% Baumwolle, 30% Polyester': ['mischgewebe'],
  '80% Baumwolle, 20% Polyester': ['mischgewebe'],
  '80% Baumwolle, 20% Polyester (Anthrazit: 52%/48%, Hellgrau meliert: 75%/25%)': ['mischgewebe'],
  '80% biologisch erzeugte Baumwolle, 20% recyceltes Polyester': ['bio-baumwolle', 'mischgewebe', 'recycelt'],
  '80% ringgesponnene Baumwolle, 20% Polyester': ['mischgewebe'],
  '97% Baumwolle, 3% Elastan (Piqué; Grau meliert abweichend)': ['mischgewebe'],
};

// ── Zuordnung: Passformtext → Passform ─────────────────────────────────
// Die Freitexte mischen Passform mit Ausstattung („Kängurutasche",
// „3-Knopfleiste"); hier zählt allein der Schnitt.

const PASSFORMEN_BASIS: Record<string, Passform> = {
  'Classic Fit, Unisex': 'regular',
  'Damen, körpernah geschnitten mit Seitennähten': 'tailliert',
  'Damen, taillierte Passform mit Seitennähten': 'tailliert',
  'Damen, taillierter Lady-Fit mit Seitennähten': 'tailliert',
  'Damen, taillierter Schnitt mit Seitennähten': 'tailliert',
  'Damen, taillierter Schnitt mit Seitennähten, 3-Knopfleiste': 'tailliert',
  'Feminine Fit mit Seitennähten': 'tailliert',
  'Feminine Passform mit Seitennähten': 'tailliert',
  'Figurbetont, fällt klein aus': 'slim',
  'Gerader Schnitt, normale Passform, Seitenschlitze': 'regular',
  'Gerader Schnitt, rundgewebter Stoff ohne Seitennähte': 'regular',
  'Moderner, körperbetonter Slim Fit, schmales Rundhals-Bündchen': 'slim',
  'Unisex, fällt klein aus, Raglanärmel': 'regular',
  'Unisex, gerader Schnitt': 'regular',
  'Unisex, gerader Schnitt, Kapuze mit Kordelzug': 'regular',
  'Unisex, normale Passform': 'regular',
  'Unisex, normale Passform, Kängurutasche': 'regular',
  'Unisex, normale Passform, Kängurutaschen': 'regular',
  'Unisex, normale Passform, Raglanärmel': 'regular',
  'Unisex, normale Passform, Seitentaschen': 'regular',
  'Unisex-Rundhals, Schlauchwarenverarbeitung': 'regular',
  'Weit geschnitten, 2-Knopfleiste, Rippstrick-Kragen und Ärmelsäume': 'weit',
};

// ── Zuordnung: Geschlechtstext → Geschlechter ──────────────────────────
// „Unisex/Herren" ist ein Mischwert und wird auf BEIDE Werte abgebildet –
// nur so findet die Kundin das Produkt unter „Herren" UND unter „Unisex".

const GESCHLECHTER_BASIS: Record<string, Geschlecht[]> = {
  Damen: ['damen'],
  Herren: ['herren'],
  Unisex: ['unisex'],
  'Unisex/Herren': ['unisex', 'herren'],
};

// ── Zuordnung: Farbname → Grundfarbe ───────────────────────────────────
// Zweifarbige Artikel werden nach der ZUERST genannten Farbe eingeordnet –
// das ist die Farbe, die das Kleidungsstück prägt.

const FARBGRUPPEN_BASIS: Record<string, Farbgruppe> = {
  Anthrazit: 'grau', Azure: 'blau', Blush: 'rosa', 'Bottle Green': 'gruen',
  'Brick Red': 'rot', Burgundy: 'rot', Chocolate: 'braun', Cranberry: 'rot',
  'Dark Grey (Solid)': 'grau', 'Deep Navy': 'blau', 'Dunkelgrau meliert': 'grau',
  Graphite: 'grau', 'Grau meliert/Navy': 'grau', Grau: 'grau', 'Grün': 'gruen',
  'Heather Charcoal': 'grau', 'Heather Grey': 'grau', 'Heather Purple': 'lila',
  'Heather Royal': 'blau', 'Kelly Green': 'gruen', Khaki: 'braun',
  'Lime Green': 'gruen', 'Millennial Lilac': 'lila', Natural: 'beige',
  Navy: 'blau', 'Navy/Grau meliert': 'blau', Olive: 'gruen', Orange: 'orange',
  Petrol: 'blau', Pink: 'rosa', 'Powder Blue': 'blau', Purple: 'lila',
  Rot: 'rot', 'Rot/Weiß': 'rot', Royal: 'blau', Sage: 'gruen', Sand: 'beige',
  Schwarz: 'schwarz', 'Schwarz/Rot': 'schwarz', 'Sky Blue': 'blau',
  'Solar Yellow': 'gelb', Sunflower: 'gelb', 'Urban Khaki': 'gruen',
  'Very Turquoise': 'tuerkis', 'Weinrot/Anthrazit': 'rot', 'Weiß': 'weiss',
  'Weiß/Navy': 'weiss', 'Weiß/Royalblau': 'weiss', 'Weiß/Schwarz': 'weiss',
  Yellow: 'gelb',
};

/** Katalog-Startdatum – gilt für Produkte ohne eigenes `aufgenommenAm`.
 *  Für den Bestand liegt kein echtes Aufnahmedatum vor; „Neuheiten" wird
 *  deshalb erst mit den ersten gepflegten Daten aussagekräftig. */
export const KATALOG_START = '2026-01-01';

// ── Zusammenführung Hand + generiert ───────────────────────────────────
// Die exportierten Tabellen vereinen die handgepflegten Basiszuordnungen mit
// den automatisch erzeugten Ergänzungen der importierten Produkte
// (facettenGeneriert.generated.ts). Der Wächter-Test „keine toten Einträge"
// prüft die ZUSAMMENGEFÜHRTE Tabelle – der Generator emittiert daher nur
// tatsächlich genutzte, in der Basis noch fehlende Werte.

export const MATERIAL_GRUPPEN: Record<string, MaterialGruppe[]> = {
  ...MATERIAL_GRUPPEN_BASIS,
  ...MATERIAL_GRUPPEN_GENERIERT,
};

export const PASSFORMEN: Record<string, Passform> = {
  ...PASSFORMEN_BASIS,
  ...PASSFORMEN_GENERIERT,
};

export const GESCHLECHTER: Record<string, Geschlecht[]> = {
  ...GESCHLECHTER_BASIS,
  ...GESCHLECHTER_GENERIERT,
};

export const FARBGRUPPEN: Record<string, Farbgruppe> = {
  ...FARBGRUPPEN_BASIS,
  ...FARBGRUPPEN_GENERIERT,
};

// ── Auflösung je Produkt ───────────────────────────────────────────────

export function materialGruppen(p: ProductConfig): MaterialGruppe[] {
  return MATERIAL_GRUPPEN[p.material] ?? [];
}

export function passformVon(p: ProductConfig): Passform | undefined {
  return PASSFORMEN[p.fit];
}

export function geschlechterVon(p: ProductConfig): Geschlecht[] {
  const roh = p.detailedDescription?.gender;
  return roh ? GESCHLECHTER[roh] ?? [] : [];
}

export function farbgruppenVon(p: ProductConfig): Farbgruppe[] {
  const gruppen = new Set<Farbgruppe>();
  for (const farbe of p.colors) {
    const g = FARBGRUPPEN[farbe.name];
    if (g) gruppen.add(g);
  }
  return [...gruppen];
}

export function aufnahmedatumVon(p: ProductConfig): string {
  return p.aufgenommenAm ?? KATALOG_START;
}
