/**
 * Die öffentliche Basisadresse des Shops – eine einzige Quelle.
 *
 * Wird an mehreren Stellen gebraucht (Sitemap, robots.txt, strukturierte
 * Daten, Metadaten-Basis). Stand zuvor als Kopie in sitemap.ts und robots.ts;
 * jede Kopie war eine Gelegenheit, auseinanderzulaufen.
 *
 * ── Warum das in Produktion hart abbricht ─────────────────────────────
 * Fehlt `NEXT_PUBLIC_SITE_URL` beim Produktionsbau, entstünde still eine
 * Sitemap voller `http://localhost`-Adressen – ebenso Canonicals, die
 * strukturierten Daten (Produkt-URL, Bilder, Brotkrumen) und die
 * Open-Graph-Bilder. Nichts davon würde einen Fehler werfen, und niemandem
 * fiele es auf, bis Suchmaschinen wochenlang nichts Brauchbares indexiert
 * haben. Genau der Fall, den das Projekt mit „Fail-fast statt stiller
 * Annahmen" ausschließt (siehe docs/architektur.md §4b).
 *
 * In Entwicklung und Tests bleibt der bequeme Rückfall auf den lokalen
 * Entwicklungsserver (Port 3007, siehe docs/coding-standards.md).
 */
export function basisUrl(): string {
  const gesetzt = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (gesetzt) return gesetzt.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL ist nicht gesetzt. Ohne sie enthielten Sitemap, ' +
        'Canonical-Adressen, strukturierte Daten und Open-Graph-Bilder ' +
        'localhost-Adressen. Die Variable muss in der Produktionsumgebung ' +
        'gesetzt sein (z. B. https://embroidery-republic.com).'
    );
  }

  return 'http://localhost:3007';
}
