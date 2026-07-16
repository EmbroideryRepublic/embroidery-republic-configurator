import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['600', '700'] });

export const metadata: Metadata = {
  title: 'Embroidery Republic Germany | Bekleidungskonfigurator',
  description: 'DTF-Transferdruck & Stickerei für Firmenbekleidung – personalisieren Sie in Echtzeit.',
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
