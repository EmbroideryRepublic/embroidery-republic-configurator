/**
 * Standard-Vorschaubild für geteilte Links (WhatsApp, LinkedIn, Facebook, Slack,
 * iMessage …).
 *
 * ── Warum jede Seite es selbst nennen muss ────────────────────────────
 * Next.js liefert `app/opengraph-image.jpg` nur dann mit aus, wenn eine Seite
 * KEIN eigenes `openGraph`-Objekt setzt. Setzt sie eines (für Titel und
 * Beschreibung der Vorschau), ersetzt es das geerbte Objekt vollständig –
 * samt Bild. Live gemessen am 2026-10-08: /faq, /ueber-uns, /kontakt und
 * /konfigurator hatten deshalb KEIN Vorschaubild; wer den Konfigurator (die
 * wichtigste Seite) teilte, zeigte nur einen nackten Link.
 *
 * Wer `openGraph` setzt, trägt hier `images: [STANDARD_VORSCHAUBILD]` ein.
 * `twitter:image` folgt automatisch dem OG-Bild (live an der Produktseite belegt).
 */
export const STANDARD_VORSCHAUBILD = {
  /** Relativ – wird gegen `metadataBase` (kanonische Adresse) aufgelöst. */
  url: '/opengraph-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Logo von Embroidery Republic Germany',
};
