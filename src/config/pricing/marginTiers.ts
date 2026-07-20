import type { QualityTier } from '@/types';

/**
 * PLATZHALTER – vorläufige Schätzwerte, keine finalen Geschäftszahlen.
 * Einzige Stelle, an der die Marge zwischen Einkaufspreis und
 * Verkaufs-Grundpreis (basePrice) je Qualitätsstufe definiert ist. Jede
 * künftige Preisänderung je Stufe wird hier einmal geändert und wirkt
 * sofort auf alle Produkte aller Marken, ohne einzelne Produkteinträge
 * anzufassen.
 */
export const QUALITY_TIER_MARGIN: Record<QualityTier, number> = {
  basic: 2.2,
  standard: 2.5,
  premium: 2.8,
  luxury: 3.2,
};

/** Rundet auf x.90 (üblicher Ladenpreis-Stil, siehe bestehende basePrice-
 *  Werte in products.ts: 11.0, 18.9, 22.9, 34.9, ...). */
function roundToPsychologicalPrice(value: number): number {
  const floor90 = Math.floor(value) + 0.9;
  return floor90 >= value ? floor90 : Math.ceil(value) + 0.9;
}

/**
 * Einziger Ort, an dem basePrice aus purchasePrice + qualityTier
 * abgeleitet wird. Jedes Produkt jeder Marke ruft ausschließlich diese
 * Funktion auf, nie eine eigene Formel.
 */
export function computeBasePrice(purchasePrice: number, qualityTier: QualityTier): number {
  return roundToPsychologicalPrice(purchasePrice * QUALITY_TIER_MARGIN[qualityTier]);
}
