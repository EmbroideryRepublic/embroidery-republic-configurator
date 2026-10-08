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

/**
 * Hosts, die der Hoster per HTTP-Weiterleitung auf einen ANDEREN Host schickt.
 * Schlüssel = Host, wie er in `NEXT_PUBLIC_SITE_URL` steht; Wert = Host, der
 * die Seite tatsächlich ausliefert.
 *
 * Beleg (curl -I, 2026-10-08): `https://ergermany.de` antwortet mit
 * `308 Permanent Redirect → https://www.ergermany.de/`. Vercel leitet die
 * Domain ohne `www` auf `www` um – die Produktions-Variable steht aber auf der
 * Adresse OHNE `www`.
 */
const AUSLIEFERUNGS_HOST: Readonly<Record<string, string>> = {
  'ergermany.de': 'www.ergermany.de',
};

/**
 * Die Adresse, unter der Suchmaschinen den Shop tatsächlich sehen sollen –
 * für ALLES, was Suchmaschinen oder Link-Vorschauen lesen: Canonical-Tags,
 * Sitemap, `Sitemap:`-Zeile der robots.txt, strukturierte Daten, Open-Graph-
 * Bilder.
 *
 * ── Warum nicht einfach `basisUrl()` ──────────────────────────────────
 * Vorher zeigten alle diese Stellen auf `https://ergermany.de`, der Server
 * leitet diese Adresse aber auf `https://www.ergermany.de` um – und die Seite
 * dort erklärte sich selbst wieder zu `https://ergermany.de`. Jede kanonische
 * Adresse widersprach damit dem Server, alle 163 Sitemap-Einträge waren
 * Weiterleitungen. Google wertet das als widersprüchliche Signale
 * („Seite mit Weiterleitung", „Alternative Seite mit richtigem
 * kanonischen Tag") und indexiert solche Seiten verzögert bis gar nicht.
 *
 * ── Warum eine eigene Funktion statt `basisUrl()` zu ändern ───────────
 * `basisUrl()` speist auch Zahlungs-Rückkehradressen, die Auth-Weiterleitung
 * des Kundenkontos und E-Mail-Links. Die funktionieren heute (die Weiterleitung
 * kostet nur einen Sprung) – ihre Zieladressen sind zudem bei Supabase bzw.
 * den Zahlungsanbietern hinterlegt. Eine Umstellung dort ohne Gegenprüfung im
 * jeweiligen Dashboard könnte Registrierung oder Zahlung brechen; für
 * Suchmaschinen ist sie unnötig.
 *
 * Wer künftig stattdessen die Domain OHNE `www` zur Hauptadresse macht (Vercel
 * → Domains), muss den Eintrag oben entfernen – sonst zeigen die Canonicals
 * wieder auf eine Weiterleitung. `npm run seo:pruefen` erkennt das.
 */
export function kanonischeBasisUrl(): string {
  const basis = basisUrl();
  let url: URL;
  try {
    url = new URL(basis);
  } catch {
    return basis;
  }
  const ziel = AUSLIEFERUNGS_HOST[url.hostname];
  if (!ziel) return basis;
  url.hostname = ziel;
  return url.origin;
}
