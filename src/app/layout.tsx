import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['600', '700'] });

export const metadata: Metadata = {
  // Unterseiten setzen nur ihren eigenen Titel; die Marke hängt das Template an.
  title: {
    default: 'Embroidery Republic Germany | Firmenbekleidung bedrucken & besticken',
    template: '%s | Embroidery Republic Germany',
  },
  description:
    'Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet – ab 5 Stück, mit kostenloser Designprüfung.',
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
      'DTF-Transferdruck und Stickerei für Firmen- und Teambekleidung. Motiv hochladen, platzieren, Preis in Echtzeit sehen – ab 5 Stück.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body
        className={`${inter.variable} ${playfair.variable} flex min-h-screen flex-col bg-cream font-sans text-brand antialiased`}
      >
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
