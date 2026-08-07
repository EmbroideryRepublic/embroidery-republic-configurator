import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { GlobaleKopfzeile } from '@/components/layout/GlobaleKopfzeile';
import { CartDrawerHost } from '@/components/layout/CartDrawerHost';
import { basisUrl } from '@/lib/seo/basisUrl';
import { websiteSchema } from '@/lib/seo/strukturierteDaten';
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  // Basis für ALLE relativen Metadaten-URLs (Open-Graph-Bilder, Canonical).
  // Ohne sie fällt Next auf `http://localhost:3000` zurück – geteilte Links
  // trügen dann ein Vorschaubild, das nirgends erreichbar ist. Gleiche Quelle
  // wie sitemap.ts und robots.ts.
  metadataBase: new URL(basisUrl()),
  // Unterseiten setzen nur ihren eigenen Titel; die Marke hängt das Template an.
  title: {
    default: 'Embroidery Republic Germany | Firmenbekleidung bedrucken & besticken',
    template: '%s | Embroidery Republic Germany',
  },
  description:
    'Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet – ab 1 Stück, mit kostenloser Designprüfung.',
  applicationName: 'Embroidery Republic Germany',
  keywords: [
    'Firmenbekleidung bedrucken',
    'Arbeitskleidung besticken',
    'DTF-Transferdruck',
    'Stickerei Firmenlogo',
    'Teambekleidung',
    'Textilveredelung',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Embroidery Republic Germany',
    title: 'Firmenbekleidung bedrucken & besticken – live konfigurieren',
    description:
      'DTF-Transferdruck und Stickerei für Firmen- und Teambekleidung. Motiv hochladen, platzieren, Preis in Echtzeit sehen – ab 1 Stück.',
  },
  // Site-weiter Default (bislang komplett gefehlt – Twitter/X fiel dadurch
  // auf Open-Graph zurück, aber ohne die explizite Kartenart wählte die
  // Vorschau nicht zuverlässig das große Bildformat). Einzelne Seiten mit
  // eigenem `openGraph` (z.B. Produktseiten) erben dieses `twitter`-Objekt
  // unverändert mit – dieselbe Vererbung, die Next.js für `openGraph` nutzt.
  twitter: {
    card: 'summary_large_image',
    title: 'Firmenbekleidung bedrucken & besticken – live konfigurieren',
    description:
      'DTF-Transferdruck und Stickerei für Firmen- und Teambekleidung. Motiv hochladen, platzieren, Preis in Echtzeit sehen – ab 1 Stück.',
  },
  robots: { index: true, follow: true },
};

/**
 * Seit Next 14 gehören `themeColor` und `viewport` in einen eigenen Export.
 * Die Markenfarbe färbt die Adressleiste mobiler Browser ein – ohne sie bleibt
 * dort das Browsergrau stehen.
 */
export const viewport: Viewport = {
  themeColor: '#b8935a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body
        className={`${inter.variable} ${playfair.variable} flex min-h-screen flex-col bg-cream font-sans text-brand antialiased`}
      >
        <JsonLd daten={websiteSchema(basisUrl())} />
        {/* Erstes fokussierbares Element der Seite: für Tastatur-/Screenreader-
            Nutzung, die sonst durch die gesamte Kopfzeile/Navigation tabben
            müsste, um zum eigentlichen Inhalt zu gelangen. Visuell versteckt,
            erscheint erst bei Tastaturfokus. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-cream focus:shadow-elegant"
        >
          Zum Inhalt springen
        </a>
        <GlobaleKopfzeile />
        {/* tabindex=-1: macht den Container programmatisch fokussierbar
            (ohne ihn in die normale Tab-Reihenfolge aufzunehmen), damit der
            Skip-Link oben den Fokus tatsächlich hierher bewegen kann
            (WCAG G1). Ohne dieses Attribut aktualisiert der Link nur den
            URL-Hash, der Tastaturfokus bleibt aber auf <body>. */}
        <div id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</div>
        <Footer />
        {/* Globale Warenkorb-Schublade: auf allen Seiten außer dem Konfigurator
            (der bringt seine eigene mit). Rendert nur, wenn geöffnet. */}
        <CartDrawerHost />
      </body>
    </html>
  );
}
