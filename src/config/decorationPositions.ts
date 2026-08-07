/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZENTRALE Beschreibung aller Veredelungspositionen.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Eine Veredelungsposition ist eine Stelle am Kleidungsstück, die bedruckt
 * oder bestickt werden kann – heute Vorderseite, Rückseite und die beiden
 * Ärmel, künftig z.B. Kapuze, Brusttasche, Kragen oder Hosenbein.
 *
 * ── Offene ID, zentral gepflegt ───────────────────────────────────────
 * `PrintView` ist eine OFFENE View-ID (ADR 0001): eine neue Position ist rein
 * additiv. Die frühere Compiler-Vollständigkeit ersetzen Wächter-Tests
 * (viewRegistry.test.ts) – jede genutzte View MUSS registriert sein.
 *
 * ALLES ANDERE steht ausschließlich hier: Anzeigename, Übersetzungsschlüssel,
 * Reihenfolge, Eigenschaften. Oberflächen führen KEINE eigenen Listen oder
 * Bezeichnungen mehr. Vorher lagen dieselben vier Zuordnungen in
 * orderTypes.ts, ViewSwitcher, SummaryPanel und LargePreviewModal – vier
 * Orte, die beim Hinzufügen einer Position alle hätten mitgepflegt werden
 * müssen.
 *
 * ── Position ≠ vorhandene Ansicht ─────────────────────────────────────
 * WICHTIG: Diese Datei beschreibt, WO veredelt werden kann. Ob ein Produkt
 * dafür ein reales Herstellerfoto besitzt, ist eine davon unabhängige
 * Information am Produkt (siehe ProductConfig). Eine Kapuzenveredelung ist
 * denkbar, ohne dass der Hersteller ein Kapuzenfoto liefert.
 *
 * ── Eine neue Position ergänzen ───────────────────────────────────────
 *  1. Eintrag in DECORATION_POSITIONS unten ergänzen (die Registry IST die
 *     Quelle der Wahrheit – `PrintView` ist eine offene View-ID),
 *  2. Übersetzungsschlüssel in i18n anlegen,
 *  3. für Produkte, die die Position führen, einen Druckbereich hinterlegen.
 * Die Wächter-Tests (config/__tests__/viewRegistry.test.ts) stellen sicher,
 * dass jede von einem Produkt geführte Ansicht hier registriert ist UND einen
 * Druckbereich hat – eine Position ohne Druckfläche wäre sonst im Konfigurator
 * auswählbar, aber unbenutzbar. Siehe docs/adr/0001-generische-druckansichten.md.
 */
import type { PrintView } from '@/types';
import type { TranslationKey } from '@/lib/i18n/translations';

/** Fachlich sprechender Name für den Typ – identisch zur offenen View-ID
 *  `PrintView`. Gültige Werte kommen aus DECORATION_POSITIONS (Registry),
 *  nicht aus dem Typ. */
export type DecorationPosition = PrintView;

/** Grobe Einordnung – erlaubt Filter wie „nur Ärmelveredelung". OFFEN, damit
 *  neue Produktgruppen eigene Gruppen mitbringen können (z.B. 'tasche',
 *  'kopf', 'schuerze'). Autocomplete für die etablierten Werte bleibt. */
export type PositionGruppe = 'koerper' | 'aermel' | (string & {});

/** Standard-Nahtabstand je Ansicht in cm, falls die Definition keinen eigenen
 *  Wert setzt. */
export const DEFAULT_SEAM_MARGIN_CM = 2;

/** Geometrie-Rezept einer Ansicht: WIE die Druckfläche entsteht. Offene ID –
 *  die Rezept-Strategie-Registry im Geometrie-Generator (M4) löst sie auf.
 *  'torso-zylinder' (Rumpf), 'oberarm-band' (Ärmel), 'flachteil' (Tasche/
 *  Schürze/Handtuch/Decke), 'wickelflaeche' (Cap). Siehe ADR 0002 §3. */
export type RezeptId = 'torso-zylinder' | 'oberarm-band' | 'flachteil' | 'wickelflaeche' | (string & {});

export interface DecorationPositionDefinition {
  id: DecorationPosition;
  /** Deutscher Anzeigename für E-Mails, PDF und Adminbereich. */
  label: string;
  /** Schlüssel für die mehrsprachige Oberfläche. */
  translationKey: TranslationKey;
  /** Anzeigereihenfolge in Ansichtswechsler, Zusammenfassung und PDF. */
  order: number;
  gruppe: PositionGruppe;
  /** Nahtabstand dieser Ansicht in cm (Registry ist die einzige Quelle;
   *  ohne Angabe gilt DEFAULT_SEAM_MARGIN_CM). */
  seamMarginCm?: number;
  /** Geometrie-Rezept dieser Ansicht. **Konsumiert ab M4-B1** vom Druckflächen-
   *  Generator (scripts/generatePrintAreaData.mts): er wählt die Geometrie-
   *  Behandlung datengetrieben über dieses Feld statt über hartkodierte View-IDs.
   *  Die realen Rezepte `torso-zylinder`/`oberarm-band` sind implementiert;
   *  `flachteil`/`wickelflaeche` sind fail-loud, bis ein reales Produkt sie führt. */
  geometrieRezept?: RezeptId;
  /** Prozessgrenze der Veredelung für diese Ansicht (cm) – deckelt die aus dem
   *  Kleidungsstück berechnete Fläche. **Einzige Quelle ab M4-B2**: der
   *  Druckflächen-Generator liest sie hier (frühere Dublett-Tabelle entfernt).
   *  Eine neue Ansicht bringt ihre Grenze als Daten mit, ohne Generator-Eingriff. */
  prozessgrenze?: { maxWidthCm: number; maxHeightCm: number };
  /** View-spezifische Positions-Presets (Schnellplatzierung im Konfigurator).
   *  Kleidungs-/gruppenspezifische Presets wie „Brust links/rechts" (nur auf der
   *  Vorderseite sinnvoll) stehen hier als Daten; die universellen Presets
   *  (oben/mittig/unten) kennt die Toolbar selbst. So bringt eine neue
   *  Produktgruppe ihre Presets mit, ohne UI-Eingriff (M4-C3). x/y = Anteil der
   *  freien Bewegungsfläche (0 = links/oben, 1 = rechts/unten). */
  presets?: readonly { labelKey: TranslationKey; x: number; y: number }[];
  /**
   * Diese Position wird aus einer anderen gespiegelt erzeugt statt eigens
   * fotografiert (rechter Ärmel = gespiegelter linker). Relevant für die
   * Bildbeschaffung, nicht für die Veredelung selbst.
   */
  gespiegeltVon?: DecorationPosition;
}

/** Zentrale View-Registry – EINZIGE Quelle der Wahrheit für alle bekannten
 *  Druckansichten. Offener Record-Typ (View-IDs sind offen); die Gültigkeit
 *  einer konkret genutzten View sichern die Wächter-Tests. */
export const DECORATION_POSITIONS: Record<string, DecorationPositionDefinition> = {
  front: { id: 'front', label: 'Vorderseite', translationKey: 'view_front', order: 1, gruppe: 'koerper', seamMarginCm: 2, geometrieRezept: 'torso-zylinder', prozessgrenze: { maxWidthCm: 30, maxHeightCm: 47 }, presets: [{ labelKey: 'element_position_chest_left', x: 0.75, y: 0.18 }, { labelKey: 'element_position_chest_right', x: 0.25, y: 0.18 }] },
  back: { id: 'back', label: 'Rückseite', translationKey: 'view_back', order: 2, gruppe: 'koerper', seamMarginCm: 2, geometrieRezept: 'torso-zylinder', prozessgrenze: { maxWidthCm: 30, maxHeightCm: 47 } },
  sleeve_left: {
    id: 'sleeve_left',
    label: 'Ärmel links',
    translationKey: 'view_sleeve_left',
    order: 3,
    gruppe: 'aermel',
    seamMarginCm: 1.5,
    geometrieRezept: 'oberarm-band',
    prozessgrenze: { maxWidthCm: 11, maxHeightCm: 10 },
  },
  sleeve_right: {
    id: 'sleeve_right',
    label: 'Ärmel rechts',
    translationKey: 'view_sleeve_right',
    order: 4,
    gruppe: 'aermel',
    seamMarginCm: 1.5,
    geometrieRezept: 'oberarm-band',
    gespiegeltVon: 'sleeve_left',
    prozessgrenze: { maxWidthCm: 11, maxHeightCm: 10 },
  },

  // ── Positionen weiterer Produktgruppen (Groundwork Taschen/Schürzen) ──
  // Rein registrierte Positionen: Ein Produkt „aktiviert" eine davon, indem es
  // sie in seinen `views` führt UND eine Druckfläche dafür hinterlegt (dann
  // greifen die Wächter-Tests). So entstehen neue Produktgruppen ausschließlich
  // über Daten – ohne Eingriff in Kernlogik. Die Druck-Geometrie je Position
  // (Rezept) folgt mit der Import-/Geometrie-Pipeline (M4/M5).
  chest: { id: 'chest', label: 'Brustbereich', translationKey: 'view_chest', order: 5, gruppe: 'koerper', seamMarginCm: 2, geometrieRezept: 'flachteil' },
  pocket: { id: 'pocket', label: 'Tasche', translationKey: 'view_pocket', order: 6, gruppe: 'schuerze', seamMarginCm: 1.5, geometrieRezept: 'flachteil' },
  neckband: { id: 'neckband', label: 'Nackenband', translationKey: 'view_neckband', order: 7, gruppe: 'schuerze', seamMarginCm: 1, geometrieRezept: 'flachteil' },
  inside: { id: 'inside', label: 'Innenseite', translationKey: 'view_inside', order: 8, gruppe: 'tasche', seamMarginCm: 2, geometrieRezept: 'flachteil' },
  bottom: { id: 'bottom', label: 'Boden', translationKey: 'view_bottom', order: 9, gruppe: 'tasche', seamMarginCm: 2, geometrieRezept: 'flachteil' },
  side: { id: 'side', label: 'Seite', translationKey: 'view_side', order: 10, gruppe: 'tasche', seamMarginCm: 1.5, geometrieRezept: 'flachteil' },
};

/** Gibt es die Ansicht in der Registry? Grundlage der Wächter-Tests und der
 *  defensiven Zugriffe. */
export function istGueltigeView(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(DECORATION_POSITIONS, id);
}

/** Definition einer Ansicht oder undefined (unbekannte View). */
export function viewDef(id: string): DecorationPositionDefinition | undefined {
  return DECORATION_POSITIONS[id];
}

/** Nahtabstand einer Ansicht (Registry-Wert, sonst Default). */
export function seamMarginCmVon(id: string): number {
  return DECORATION_POSITIONS[id]?.seamMarginCm ?? DEFAULT_SEAM_MARGIN_CM;
}

/** Alle Positionen in fachlicher Reihenfolge. */
export const DECORATION_POSITION_ORDER: readonly DecorationPosition[] = (
  Object.values(DECORATION_POSITIONS) as DecorationPositionDefinition[]
)
  .sort((a, b) => a.order - b.order)
  .map((d) => d.id);

/** Deutscher Anzeigename einer Position. Unbekannte View → die ID selbst
 *  (defensiver Fallback; Wächter-Tests verhindern unbekannte Views im Bestand). */
export function positionLabel(position: DecorationPosition): string {
  return DECORATION_POSITIONS[position]?.label ?? position;
}

/** Übersetzungsschlüssel einer Position (mehrsprachige Oberfläche). Unbekannte
 *  View → die rohe ID (i18n fällt dann auf den Schlüssel zurück). */
export function positionTranslationKey(position: DecorationPosition): TranslationKey {
  return DECORATION_POSITIONS[position]?.translationKey ?? (position as TranslationKey);
}

/** Sortiert Positionen in die fachliche Reihenfolge. Unbekannte ans Ende. */
export function sortierePositionen(positionen: readonly DecorationPosition[]): DecorationPosition[] {
  return [...positionen].sort(
    (a, b) => (DECORATION_POSITIONS[a]?.order ?? Number.MAX_SAFE_INTEGER) - (DECORATION_POSITIONS[b]?.order ?? Number.MAX_SAFE_INTEGER)
  );
}
