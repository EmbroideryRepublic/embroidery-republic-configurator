import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { GlobaleKopfzeile } from '@/components/layout/GlobaleKopfzeile';
import { CartDrawerHost } from '@/components/layout/CartDrawerHost';
import { Besuchszaehler } from '@/components/layout/Besuchszaehler';
import { AktionsLeiste } from '@/components/aktion/AktionsLeiste';
import { aktuelleAktion } from '@/config/aktion';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { suchmaschinenBestaetigung } from '@/lib/seo/bestaetigung';
import { websiteSchema } from '@/lib/seo/strukturierteDaten';
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Betriebsschalter (config/bestellweg.ts): Solange die Stickerei pausiert ist, verspricht keine Beschreibung sie.
const STICKEREI_AN = veredelungVerfuegbar('embroidery');

export const metadata: Metadata = {
  // Basis für ALLE relativen Metadaten-URLs (Open-Graph-Bilder, Canonical).
  // Ohne sie fällt Next auf `http://localhost:3000` zurück – geteilte Links
  // trügen dann ein Vorschaubild, das nirgends erreichbar ist. Gleiche Quelle
  // wie sitemap.ts und robots.ts: die KANONISCHE Adresse (der Host, der
  // tatsächlich ausliefert) – sonst zeigten Canonicals und Vorschaubilder auf
  // eine Weiterleitung, siehe basisUrl.ts.
  metadataBase: new URL(kanonischeBasisUrl()),
  // Unterseiten setzen nur ihren eigenen Titel; die Marke hängt das Template an.
  title: {
    // Solange die Stickerei pausiert ist (config/bestellweg.ts), nennt kein Titel sie (Freigabe 2026-11-24).
    default: STICKEREI_AN
      ? 'Embroidery Republic Germany | Firmenbekleidung bedrucken & besticken'
      : 'Embroidery Republic Germany | Firmenbekleidung bedrucken',
    template: '%s | Embroidery Republic Germany',
  },
  description: STICKEREI_AN
    ? 'Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet – ab 1 Stück, mit kostenloser Designprüfung.'
    : 'Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck, live im Konfigurator gestaltet – ab 1 Stück, mit kostenloser Designprüfung.',
  applicationName: 'Embroidery Republic Germany',
  keywords: [
    'Firmenbekleidung bedrucken',
    ...(STICKEREI_AN ? ['Arbeitskleidung besticken'] : ['Arbeitskleidung bedrucken']),
    'DTF-Transferdruck',
    ...(STICKEREI_AN ? ['Stickerei Firmenlogo'] : []),
    'Teambekleidung',
    'Textilveredelung',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Embroidery Republic Germany',
    title: STICKEREI_AN
      ? 'Firmenbekleidung bedrucken & besticken – live konfigurieren'
      : 'Firmenbekleidung bedrucken – live konfigurieren',
    description: STICKEREI_AN
      ? 'DTF-Transferdruck und Stickerei für Firmen- und Teambekleidung. Motiv hochladen, platzieren, Preis in Echtzeit sehen – ab 1 Stück.'
      : 'DTF-Transferdruck für Firmen- und Teambekleidung. Motiv hochladen, platzieren, Preis in Echtzeit sehen – ab 1 Stück.',
  },
  // Site-weiter Default (bislang komplett gefehlt – Twitter/X fiel dadurch
  // auf Open-Graph zurück, aber ohne die explizite Kartenart wählte die
  // Vorschau nicht zuverlässig das große Bildformat). Einzelne Seiten mit
  // eigenem `openGraph` (z.B. Produktseiten) erben dieses `twitter`-Objekt
  // unverändert mit – dieselbe Vererbung, die Next.js für `openGraph` nutzt.
  // KORREKTUR 2026-11-12: Hier standen Titel und Beschreibung der Startseite. Weil Unterseiten das twitter-Objekt komplett erben,
  // zeigte JEDE Produkt- und Kategorieseite beim Teilen auf X den Startseiten-Text (twitter:title hat dort Vorrang vor og:title).
  // Jetzt nur noch die Kartenart: Ohne twitter:title/-description nimmt X den og:title und og:description der jeweiligen Seite.
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
  // Bestätigung bei Google Search Console / Bing Webmaster Tools. Gibt nur etwas
  // aus, wenn die Vercel-Variablen GOOGLE_SITE_VERIFICATION bzw.
  // BING_SITE_VERIFICATION gesetzt sind – siehe lib/seo/bestaetigung.ts.
  verification: suchmaschinenBestaetigung(process.env),
};

/**
 * Seit Next 14 gehören `themeColor` und `viewport` in einen eigenen Export.
 * Die Markenfarbe färbt die Adressleiste mobiler Browser ein – ohne sie bleibt
 * dort das Browsergrau stehen.
 */
export const viewport: Viewport = {
  themeColor: '#faf7f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Preisaktion (config/aktion.ts, z. B. Black Week): Der Server liefert die Leiste nur, solange sie läuft; der Browser blendet sie bei Ablauf selbst aus.
  const aktion = aktuelleAktion();
  return (
    <html lang="de">
      <body
        className={`${inter.variable} flex min-h-screen flex-col bg-cream font-sans text-brand antialiased`}
      >
        <JsonLd daten={websiteSchema(kanonischeBasisUrl())} />
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
        {aktion && <AktionsLeiste aktion={aktion} />}
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
        {/* Eigener, cookieloser Besucherzähler (siehe Datenschutzerklärung,
            Ziffer 3 „Reichweitenmessung", und docs/besucherzaehler.md). */}
        <Besuchszaehler />
      </body>
    </html>
  );
}
