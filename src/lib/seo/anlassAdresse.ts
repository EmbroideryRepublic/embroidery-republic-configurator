/**
 * Adressen der Anlass- und Ratgeberseiten (config/seo/anlassSeiten.ts) – bewusst leicht (nur die Textkonfiguration,
 * keine Preis-Engine), damit Startseite, Fußzeile und Sitemap sie importieren können, ohne die Preislogik mitzuladen.
 * Gegenstück zu kategorieAdresse.ts und dtfAdresse.ts.
 */
import { ANLASS_SEITEN, type AnlassSeite } from '@/config/seo/anlassSeiten';

export function alleAnlassSlugs(): string[] {
  return ANLASS_SEITEN.map((s) => s.slug);
}

export function anlassSeiteVon(slug: string): AnlassSeite | undefined {
  return ANLASS_SEITEN.find((s) => s.slug === slug);
}
