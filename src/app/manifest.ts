/**
 * Web-App-Manifest.
 *
 * Sorgt dafür, dass der Shop beim Ablegen auf dem Startbildschirm einen
 * richtigen Namen und ein Symbol bekommt statt „localhost" bzw. eines
 * Bildschirmfotos, und dass mobile Browser die Adressleiste in der Markenfarbe
 * einfärben. Ohne Manifest fällt beides auf Browserstandards zurück.
 *
 * Bewusst `display: 'browser'`: Der Shop ist eine Website, keine App –
 * `standalone` würde Zurück-Knopf und Adressleiste entfernen, was beim
 * Einkaufen (Links teilen, Verlauf) eher stört als hilft.
 *
 * Die Symbole liegen als `app/icon.png` bzw. `app/apple-icon.png` und werden
 * von Next unter `/icon.png` und `/apple-icon.png` ausgeliefert.
 */
import type { MetadataRoute } from 'next';
import { COMPANY } from '@/config/company';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: COMPANY.tradeName,
    short_name: 'Embroidery Republic',
    description:
      'Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet.',
    start_url: '/',
    display: 'browser',
    lang: 'de',
    // Creme-Hintergrund und Gold-Akzent aus tailwind.config.ts.
    background_color: '#f7f1e6',
    theme_color: '#b8935a',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
