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
 * `lastModified` steht NUR bei Seiten, deren Inhalt bewusst überarbeitet wurde
 * (config/seo/aenderungen.ts, mit dem Tag der Überarbeitung). Ohne ein echtes,
 * gepflegtes Änderungsdatum würde hier sonst der Abrufzeitpunkt der Sitemap
 * selbst landen — bei jedem Crawl ein neuer Wert für dieselbe URL. Das ist
 * ein falsches Signal, das Suchmaschinen dazu bringen kann, das
 * lastmod-Signal für die ganze Sitemap zu ignorieren.
 */
import type { MetadataRoute } from 'next';
import { alleProduktSlugs } from '@/lib/products/productPage';
import { getProduct } from '@/config/products';
import { sitemapBilder } from '@/lib/seo/sitemapBilder';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { alleKategorieSlugs } from '@/lib/seo/kategorieAdresse';
import { alleDtfSlugs } from '@/lib/seo/dtfAdresse';
import { alleAnlassSlugs } from '@/lib/seo/anlassAdresse';
import { LETZTE_AENDERUNG } from '@/config/seo/aenderungen';

/** `lastModified`-Feld für eine Seite – nur, wenn ein Änderungsdatum gepflegt ist. */
function letzteAenderung(pfad: string): { lastModified: Date } | Record<string, never> {
  const tag = LETZTE_AENDERUNG[pfad];
  return tag ? { lastModified: new Date(`${tag}T00:00:00Z`) } : {};
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Kanonische Adresse (nicht die Betriebsadresse): Jede Sitemap-URL muss
  // direkt mit 200 antworten, nicht über eine Weiterleitung – siehe basisUrl.ts.
  const basis = kanonischeBasisUrl();

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
      ...letzteAenderung(s.pfad),
      changeFrequency: 'monthly' as const,
      priority: s.prioritaet,
    })),
    // Kategorie-Landingpages (config/seo/kategorieSeiten.ts) – die indexierbaren
    // Einstiege für Suchanfragen wie „Hoodies bedrucken lassen".
    ...alleKategorieSlugs().map((slug) => ({
      url: `${basis}/${slug}`,
      ...letzteAenderung(`/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    // DTF-Landingpages (config/seo/dtfSeiten.ts): Marken und weitere Produktarten.
    ...alleDtfSlugs().map((slug) => ({
      url: `${basis}/${slug}`,
      ...letzteAenderung(`/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Anlass- und Ratgeberseiten (config/seo/anlassSeiten.ts).
    ...alleAnlassSlugs().map((slug) => ({
      url: `${basis}/${slug}`,
      ...letzteAenderung(`/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Produktseiten samt ihren Fotos (Vorderseiten mehrerer Farben, Rück-/Ärmelansicht) für die Bildersuche.
    ...alleProduktSlugs().map((slug) => {
      const produkt = getProduct(slug);
      const images = produkt ? sitemapBilder(produkt, basis) : [];
      return {
        url: `${basis}/produkt/${slug}`,
        ...letzteAenderung(`/produkt/${slug}`),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        ...(images.length > 0 ? { images } : {}),
      };
    }),
  ];
}
