/**
 * Sitemap für Suchmaschinen.
 *
 * Enthält die statischen Seiten und jede Produktseite. Die Produktliste
 * kommt aus dem Katalog, nicht aus einer gepflegten Aufzählung — ein neues
 * Produkt steht damit automatisch in der Sitemap.
 *
 * Ausgenommen sind bewusst: der Adminbereich und `/bestellung/[token]`.
 * Beide sind nicht öffentlich und in ihren Metadaten bereits auf `noindex`
 * gesetzt.
 *
 * `lastModified` wird bewusst weggelassen: Ohne ein echtes, gepflegtes
 * Änderungsdatum je Seite würde hier sonst der Abrufzeitpunkt der Sitemap
 * selbst landen — bei jedem Crawl ein neuer Wert für dieselbe URL. Das ist
 * ein falsches Signal, das Suchmaschinen dazu bringen kann, das
 * lastmod-Signal für die ganze Sitemap zu ignorieren.
 */
import type { MetadataRoute } from 'next';
import { alleProduktSlugs } from '@/lib/products/productPage';
import { basisUrl } from '@/lib/seo/basisUrl';

export default function sitemap(): MetadataRoute.Sitemap {
  const basis = basisUrl();

  const statisch: { pfad: string; prioritaet: number }[] = [
    { pfad: '', prioritaet: 1 },
    { pfad: '/konfigurator', prioritaet: 0.9 },
    { pfad: '/produkt', prioritaet: 0.9 },
    { pfad: '/ueber-uns', prioritaet: 0.5 },
    { pfad: '/faq', prioritaet: 0.5 },
    { pfad: '/kontakt', prioritaet: 0.5 },
    { pfad: '/impressum', prioritaet: 0.2 },
    { pfad: '/datenschutz', prioritaet: 0.2 },
    { pfad: '/agb', prioritaet: 0.2 },
  ];

  return [
    ...statisch.map((s) => ({
      url: `${basis}${s.pfad}`,
      changeFrequency: 'monthly' as const,
      priority: s.prioritaet,
    })),
    ...alleProduktSlugs().map((slug) => ({
      url: `${basis}/produkt/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
