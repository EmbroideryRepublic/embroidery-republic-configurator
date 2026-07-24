import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { GlobaleKopfzeile } from '@/components/layout/GlobaleKopfzeile';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  // Basis für ALLE relativen Metadaten-URLs (Open-Graph-Bilder, Canonical).
  // Ohne sie fällt Next auf `http://localhost:3000` zurück – geteilte Links
  // trügen dann ein Vorschaubild, das nirgends erreichbar ist. Gleiche Quelle
  // wie sitemap.ts und robots.ts.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3007'),
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
        <GlobaleKopfzeile />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
