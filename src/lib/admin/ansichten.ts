/**
 * Gemeinsame Ansichts-Beschriftung/-Sortierung für alle Admin-Ansichten, die
 * Personalisierungselemente nach Ansicht (Vorderseite/Rückseite/Ärmel)
 * gruppieren – bisher unabhängig in ProductionPreview.tsx,
 * KundendateienPanel.tsx UND lib/admin/kundendateien.ts nachgebaut (Fund aus
 * dem adversarialen Review vom 2026-08-31: eine künftige Änderung an Labels
 * oder Reihenfolge, nur an einer Stelle nachgezogen, hätte die drei
 * Oberflächen unbemerkt auseinanderlaufen lassen – z.B. "Logo 2" auf dem
 * Bildschirm, aber ein anders benannter ZIP-Eintrag).
 */
import { PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import { DECORATION_POSITION_ORDER } from '@/config/decorationPositions';

export function ansichtLabel(view: string): string {
  return PRINT_VIEW_LABELS[view as keyof typeof PRINT_VIEW_LABELS] ?? view;
}

/** Fachliche Reihenfolge (Vorderseite, Rückseite, Ärmel …) statt zufälliger
 *  DB-Reihenfolge; unbekannte Views hängen defensiv hinten an. */
export function sortiereAnsichten(views: string[]): string[] {
  const bekannt = DECORATION_POSITION_ORDER.filter((v) => views.includes(v));
  const unbekannt = views.filter((v) => !(DECORATION_POSITION_ORDER as readonly string[]).includes(v));
  return [...bekannt, ...unbekannt];
}
