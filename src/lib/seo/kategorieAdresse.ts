/**
 * Adressen der Kategorie-Landingpages – bewusst leicht (nur die Textkonfiguration,
 * keine Preis-Engine), damit Startseite, Produktseiten und strukturierte Daten
 * sie importieren können, ohne die gesamte Preislogik mitzuladen.
 */
import type { ProductType } from '@/types';
import { KATEGORIE_SEITEN, type KategorieSeite } from '@/config/seo/kategorieSeiten';

export function alleKategorieSlugs(): string[] {
  return KATEGORIE_SEITEN.map((s) => s.slug);
}

export function kategorieSeiteVon(slug: string): KategorieSeite | undefined {
  return KATEGORIE_SEITEN.find((s) => s.slug === slug);
}

/**
 * Adresse, auf die eine Produktart intern verlinkt wird: die indexierbare
 * Landingpage, falls es eine gibt – sonst die (noindex-)Filteransicht. Einzige
 * Stelle dieser Entscheidung, damit Startseite, Produktseite und strukturierte
 * Daten dieselbe Adresse nutzen.
 */
export function kategorieLink(art: ProductType): string {
  const seite = KATEGORIE_SEITEN.find((s) => s.art === art);
  return seite ? `/${seite.slug}` : `/produkt?kategorie=${art}`;
}
