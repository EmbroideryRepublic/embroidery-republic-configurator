import type { Metadata } from 'next';
import { ConfiguratorPrototype } from '@/components/configurator/ConfiguratorPrototype';

/**
 * Der Konfigurator.
 *
 * Lag bis 2026-07-23 auf `/`. Seit die Startseite eine eigene Seite ist,
 * hat er eine sprechende Adresse – Einstiege aus Katalog, FAQ und Navigation
 * zeigen hierher, Produktvorwahl weiterhin über `?produkt=<id>`.
 */
export const metadata: Metadata = {
  title: 'Konfigurator',
  description:
    'Gestalte deine Textilien selbst: Logo oder Text platzieren, Farbe und Größe wählen, Preis sofort sehen. Veredelt per DTF-Transferdruck oder Stickerei.',
  alternates: { canonical: '/konfigurator' },
  openGraph: {
    title: 'Konfigurator',
    description:
      'Logo oder Text platzieren, Farbe und Größe wählen, Preis sofort sehen – veredelt per DTF-Transferdruck oder Stickerei.',
  },
};

export default function KonfiguratorSeite() {
  return (
    <main className="w-full bg-cream">
      {/* Für Screenreader und Dokumentstruktur: der Konfigurator brachte bisher
          keine h1 mit. Visuell versteckt, damit das eingefrorene v1.0-Layout
          unberührt bleibt. */}
      <h1 className="sr-only">Konfigurator – Textilien mit Druck oder Stickerei gestalten</h1>
      <ConfiguratorPrototype />
    </main>
  );
}
