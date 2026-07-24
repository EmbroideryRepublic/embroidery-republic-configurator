'use client';

/**
 * Kopfzeile für alle Seiten außer dem Konfigurator.
 *
 * Der Konfigurator bringt seine eigene Kopfzeile mit – er braucht den
 * Warenkorb als Schublade und den Vergleich, beides mit eigenen Handhaben.
 * Alle übrigen Seiten hatten bisher GAR KEINE Navigation, was nicht auffiel,
 * solange der Konfigurator die Startseite war.
 *
 * Diese Weiche verhindert zwei Kopfzeilen übereinander. Sie verschwindet,
 * sobald die Warenkorb-Schublade seitenübergreifend verfügbar ist.
 */
import { usePathname } from 'next/navigation';
import { SiteHeader } from './SiteHeader';

export function GlobaleKopfzeile() {
  const pfad = usePathname();
  if (pfad?.startsWith('/konfigurator')) return null;
  return <SiteHeader />;
}
