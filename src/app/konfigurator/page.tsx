import type { Metadata } from 'next';
import { ConfiguratorPrototype } from '@/components/configurator/ConfiguratorPrototype';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';

/**
 * Der Konfigurator.
 *
 * Lag bis 2026-07-23 auf `/`. Seit die Startseite eine eigene Seite ist,
 * hat er eine sprechende Adresse – Einstiege aus Katalog, FAQ und Navigation
 * zeigen hierher, Produktvorwahl weiterhin über `?produkt=<id>`.
 */
// Titel/Beschreibung ohne Stickerei (Freigabe 2026-11-24, Stickerei pausiert; Wortlaut: seo-bestandsaufnahme-2026-11-24.md).
export const metadata: Metadata = {
  title: { absolute: 'T-Shirt, Hoodie & Polo online gestalten | Konfigurator' },
  description:
    'Logo oder Text auf T-Shirt, Hoodie oder Polo platzieren, Farbe und Größe wählen, Preis sofort sehen – DTF-Transferdruck ab 1 Stück, ohne Mindestmenge.',
  alternates: { canonical: '/konfigurator' },
  openGraph: {
    title: 'T-Shirt, Hoodie & Polo online gestalten | Konfigurator',
    description:
      'Logo oder Text platzieren, Farbe und Größe wählen, Preis sofort sehen – DTF-Transferdruck ab 1 Stück, ohne Mindestmenge.',
    images: [STANDARD_VORSCHAUBILD],
  },
};

export default function KonfiguratorSeite() {
  return (
    <main className="w-full bg-cream">
      {/* Für Screenreader und Dokumentstruktur: der Konfigurator brachte bisher
          keine h1 mit. Visuell versteckt, damit das eingefrorene v1.0-Layout
          unberührt bleibt. */}
      <h1 className="sr-only">Konfigurator – Textilien mit Logo oder Motiv gestalten</h1>
      <ConfiguratorPrototype />
    </main>
  );
}
