/**
 * ═══════════════════════════════════════════════════════════════════════
 * ZENTRALE Beschreibung aller Veredelungspositionen.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Eine Veredelungsposition ist eine Stelle am Kleidungsstück, die bedruckt
 * oder bestickt werden kann – heute Vorderseite, Rückseite und die beiden
 * Ärmel, künftig z.B. Kapuze, Brusttasche, Kragen oder Hosenbein.
 *
 * ── Typsicher UND zentral gepflegt ────────────────────────────────────
 * Der Typ bleibt eine feste Aufzählung (`PrintView`): Kommt eine Position
 * dazu, zeigt der Compiler jede Stelle, die sie behandeln muss – Druckfläche,
 * Bild, Renderer. Diese Prüfung wollen wir behalten.
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
 *  1. Wert in `PrintView` (src/types/index.ts) aufnehmen,
 *  2. Eintrag in DECORATION_POSITIONS unten ergänzen,
 *  3. Übersetzungsschlüssel in i18n anlegen,
 *  4. den Compiler-Fehlern folgen (Druckflächen, Bilder, Renderer).
 * Schritt 4 ist Absicht: Eine Position ohne Druckfläche wäre im
 * Konfigurator auswählbar, aber unbenutzbar.
 */
import type { PrintView } from '@/types';
import type { TranslationKey } from '@/lib/i18n/translations';

/** Fachlich sprechender Name für den Typ – `PrintView` ist historisch
 *  gewachsen und steckt bis in die Datenbankspalten. */
export type DecorationPosition = PrintView;

/** Grobe Einordnung – erlaubt Filter wie „nur Ärmelveredelung". */
export type PositionGruppe = 'koerper' | 'aermel';

export interface DecorationPositionDefinition {
  id: DecorationPosition;
  /** Deutscher Anzeigename für E-Mails, PDF und Adminbereich. */
  label: string;
  /** Schlüssel für die mehrsprachige Oberfläche. */
  translationKey: TranslationKey;
  /** Anzeigereihenfolge in Ansichtswechsler, Zusammenfassung und PDF. */
  order: number;
  gruppe: PositionGruppe;
  /**
   * Diese Position wird aus einer anderen gespiegelt erzeugt statt eigens
   * fotografiert (rechter Ärmel = gespiegelter linker). Relevant für die
   * Bildbeschaffung, nicht für die Veredelung selbst.
   */
  gespiegeltVon?: DecorationPosition;
}

export const DECORATION_POSITIONS: Record<DecorationPosition, DecorationPositionDefinition> = {
  front: { id: 'front', label: 'Vorderseite', translationKey: 'view_front', order: 1, gruppe: 'koerper' },
  back: { id: 'back', label: 'Rückseite', translationKey: 'view_back', order: 2, gruppe: 'koerper' },
  sleeve_left: {
    id: 'sleeve_left',
    label: 'Ärmel links',
    translationKey: 'view_sleeve_left',
    order: 3,
    gruppe: 'aermel',
  },
  sleeve_right: {
    id: 'sleeve_right',
    label: 'Ärmel rechts',
    translationKey: 'view_sleeve_right',
    order: 4,
    gruppe: 'aermel',
    gespiegeltVon: 'sleeve_left',
  },
};

/** Alle Positionen in fachlicher Reihenfolge. */
export const DECORATION_POSITION_ORDER: readonly DecorationPosition[] = (
  Object.values(DECORATION_POSITIONS) as DecorationPositionDefinition[]
)
  .sort((a, b) => a.order - b.order)
  .map((d) => d.id);

/** Deutscher Anzeigename einer Position. */
export function positionLabel(position: DecorationPosition): string {
  return DECORATION_POSITIONS[position].label;
}

/** Übersetzungsschlüssel einer Position (mehrsprachige Oberfläche). */
export function positionTranslationKey(position: DecorationPosition): TranslationKey {
  return DECORATION_POSITIONS[position].translationKey;
}

/** Sortiert Positionen in die fachliche Reihenfolge. */
export function sortierePositionen(positionen: readonly DecorationPosition[]): DecorationPosition[] {
  return [...positionen].sort(
    (a, b) => DECORATION_POSITIONS[a].order - DECORATION_POSITIONS[b].order
  );
}

/** Alle Positionen einer Gruppe – Grundlage für Filter wie „nur Ärmel". */
export function positionenDerGruppe(gruppe: PositionGruppe): DecorationPosition[] {
  return DECORATION_POSITION_ORDER.filter((p) => DECORATION_POSITIONS[p].gruppe === gruppe);
}
