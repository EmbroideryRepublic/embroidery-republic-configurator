/**
 * robots.txt.
 *
 * Adminbereich und die signierten Bestellansichten werden ausgeschlossen.
 * Die Bestellansicht trägt zwar bereits `noindex` in ihren Metadaten, aber
 * ein Crawler soll den Link gar nicht erst abrufen — er enthält ein
 * Zugriffstoken.
 */
import type { MetadataRoute } from 'next';
import { basisUrl } from '@/lib/seo/basisUrl';

export default function robots(): MetadataRoute.Robots {
  const basis = basisUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/bestellung/'],
    },
    sitemap: `${basis}/sitemap.xml`,
  };
}
