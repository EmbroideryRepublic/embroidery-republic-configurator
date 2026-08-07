/**
 * robots.txt.
 *
 * Adminbereich, die signierten Bestellansichten und der Kontobereich werden
 * ausgeschlossen. Die Bestellansicht trägt zwar bereits `noindex` in ihren
 * Metadaten, aber ein Crawler soll den Link gar nicht erst abrufen — er
 * enthält ein Zugriffstoken. Dieselbe Vorsicht für `/konto/` (persönliche
 * Kontodaten, jede Unterseite trägt ohnehin bereits eigenes `noindex`) und
 * `/auth/` (der Supabase-Callback – kein Inhalt, nur ein Umleitungssprung).
 */
import type { MetadataRoute } from 'next';
import { basisUrl } from '@/lib/seo/basisUrl';

export default function robots(): MetadataRoute.Robots {
  const basis = basisUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/bestellung/', '/konto/', '/auth/'],
    },
    sitemap: `${basis}/sitemap.xml`,
  };
}
