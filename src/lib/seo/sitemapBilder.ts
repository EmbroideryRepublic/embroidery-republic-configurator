/**
 * Bild-URLs einer Produktseite für die Sitemap (Google-Bildersuche).
 *
 * Die Sitemap meldet Google zusätzlich zur Seite deren Fotos: ein paar Farben von vorn, dazu Rück- und Ärmelansicht der
 * ersten Farbe. So finden Crawler die Bilder auch dann, wenn die Seite selbst selten abgerufen wird (Googlebot holt nur
 * ca. 20 Seiten am Tag). Nur echte, wählbare Ansichten – nie der Platzhalter.
 */
import type { ProductConfig } from '@/config/products/types';
import { bildFuerAnsicht, PLATZHALTER_BILD } from '@/lib/assets';
import { waehlbareFarben } from '@/lib/products/farben';

/** Höchstzahl je Seite (Google erlaubt bis 1.000, mehr bringt für ein Produkt nichts). */
export const MAX_BILDER_JE_SEITE = 8;

export function sitemapBilder(produkt: ProductConfig, basis: string): string[] {
  const farben = waehlbareFarben(produkt.id, produkt.colors);
  const pfade: (string | undefined)[] = [];
  for (const f of farben.slice(0, 4)) pfade.push(bildFuerAnsicht(produkt.id, f.id, 'front'));
  const erste = farben[0];
  if (erste) {
    pfade.push(bildFuerAnsicht(produkt.id, erste.id, 'back'));
    pfade.push(bildFuerAnsicht(produkt.id, erste.id, 'sleeve_left'));
  }
  const eindeutig = new Set<string>();
  for (const p of pfade) if (p && p !== PLATZHALTER_BILD && p.startsWith('/products/')) eindeutig.add(`${basis}${p}`);
  return [...eindeutig].slice(0, MAX_BILDER_JE_SEITE);
}
