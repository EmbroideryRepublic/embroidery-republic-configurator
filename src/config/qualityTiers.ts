/**
 * Qualitätsstufen des Sortiments – die kundenseitige Orientierung.
 *
 * Statt Kunden mit einem Dutzend Marken zu konfrontieren, ordnet jede
 * Qualitätsstufe mehrere Marken/Produkte in eine verständliche Klasse ein.
 *
 * ── Interne Werte vs. Anzeige ─────────────────────────────────────────
 * Die Typwerte (`basic` … `luxury`) bleiben unverändert – sie stecken in
 * allen Produktdateien UND in der Margentabelle (`pricing/marginTiers.ts`).
 * Nach außen wird `standard` bewusst als „Classic" angezeigt. Eine
 * Umbenennung des Typs wäre eine Datenmigration ohne fachlichen Gewinn.
 *
 * ── Einziger Ort für Anzeigenamen ─────────────────────────────────────
 * Shop, Produktkarte, Konfigurator, Filter und Adminbereich lesen
 * ausschließlich von hier. Ein späterer Wechsel von „Classic" auf einen
 * anderen Namen ist damit eine Änderung an genau einer Zeile.
 */
import type { QualityTier } from '@/types';

/** Kundenseitige Bezeichnung je Stufe. */
export const QUALITY_TIER_LABELS: Record<QualityTier, string> = {
  basic: 'Basic',
  standard: 'Classic',
  premium: 'Premium',
  luxury: 'Luxury',
};

/**
 * Aufsteigende Rangfolge – von einfach nach hochwertig.
 *
 * BEWUSST explizit und nicht aus `Object.keys(QUALITY_TIER_LABELS)`
 * abgeleitet: Die Reihenfolge ist eine fachliche Aussage, keine Folge der
 * Schreibreihenfolge im Objekt. Filter und Sortierungen richten sich
 * danach, damit „Basic vor Premium" nirgends dem Zufall überlassen ist.
 */
export const QUALITY_TIER_ORDER: readonly QualityTier[] = ['basic', 'standard', 'premium', 'luxury'];

/** Kurzer Zusatz für Tooltips/Beschreibungen. Bewusst knapp und ohne
 *  Werbesprache – die Stufe soll einordnen, nicht verkaufen. */
export const QUALITY_TIER_HINTS: Record<QualityTier, string> = {
  basic: 'Solide Basisqualität für große Mengen',
  standard: 'Ausgewogenes Verhältnis von Qualität und Preis',
  premium: 'Höhere Grammatur und feinere Verarbeitung',
  luxury: 'Hochwertigste Materialien und Verarbeitung',
};

/** Anzeigename einer Stufe. */
export function qualityTierLabel(tier: QualityTier): string {
  return QUALITY_TIER_LABELS[tier];
}

/**
 * Sortiert Stufen nach der fachlichen Rangfolge. Nützlich für Filterlisten,
 * die sich dynamisch aus dem Sortiment ableiten (dort liegen die Stufen
 * sonst in der Reihenfolge des ersten Vorkommens).
 */
export function sortiereQualityTiers(tiers: readonly QualityTier[]): QualityTier[] {
  return [...tiers].sort((a, b) => QUALITY_TIER_ORDER.indexOf(a) - QUALITY_TIER_ORDER.indexOf(b));
}
