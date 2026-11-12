/**
 * Adressen der DTF-Landingpages (Marken und weitere Produktarten) – bewusst leicht
 * (nur die Textkonfiguration, keine Preis-Engine), damit Startseite, Produktseiten,
 * Fußzeile und Sitemap sie importieren können, ohne die Preislogik mitzuladen.
 * Gegenstück zu kategorieAdresse.ts.
 */
import type { ProductType } from '@/types';
import { DTF_SEITEN, type DtfSeite } from '@/config/seo/dtfSeiten';

export function alleDtfSlugs(): string[] {
  return DTF_SEITEN.map((s) => s.slug);
}

export function dtfSeiteVon(slug: string): DtfSeite | undefined {
  return DTF_SEITEN.find((s) => s.slug === slug);
}

/** Die Seite einer Marke (Schreibweise wie im Katalog), falls es eine gibt. */
export function markenSeiteVon(marke: string): DtfSeite | undefined {
  return DTF_SEITEN.find((s) => s.marke === marke);
}

/** Die DTF-Seite einer Produktart, falls es eine gibt (Longsleeve, Jacke, Zip-Hoodie). */
export function dtfArtSeiteVon(art: ProductType): DtfSeite | undefined {
  return DTF_SEITEN.find((s) => s.art === art);
}

export function alleMarkenSeiten(): DtfSeite[] {
  return DTF_SEITEN.filter((s) => s.marke !== undefined);
}
