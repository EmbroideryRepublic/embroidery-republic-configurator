/**
 * Bestätigung der Website bei Suchmaschinen (HTML-Tag-Verfahren).
 *
 * Google Search Console und Bing Webmaster Tools verlangen den Nachweis, dass die
 * Website dem Antragsteller gehört – ohne diese Bestätigung gibt es weder Zahlen
 * (Suchbegriffe, Klicks, Position) noch die Möglichkeit, neue Seiten zur
 * Indexierung vorzuschlagen. Das HTML-Tag-Verfahren braucht keinen DNS-Zugang:
 * Die Werkzeuge nennen einen Code, der als <meta>-Tag im <head> der Startseite
 * stehen muss.
 *
 * Die Codes stehen in Vercel-Umgebungsvariablen und NICHT im Quelltext:
 *   GOOGLE_SITE_VERIFICATION   → <meta name="google-site-verification" content="…">
 *   BING_SITE_VERIFICATION     → <meta name="msvalidate.01" content="…">
 * Ohne Variable wird nichts ausgegeben. Weil die Metadaten beim Build entstehen,
 * greift eine neu gesetzte Variable erst nach dem nächsten Deploy.
 *
 * Nur codeähnliche Werte werden ausgegeben: Ein versehentlich eingefügter
 * ganzer <meta>-Tag oder ein Leerzeichen soll nicht als kaputtes HTML im <head>
 * landen (Google-Codes sind 43 Zeichen aus A–Z a–z 0–9 _ -, Bing-Codes 32
 * Hexzeichen).
 */
const CODE_MUSTER = /^[A-Za-z0-9_-]{16,128}$/;

export interface Suchmaschinenbestaetigung {
  google?: string;
  other?: Record<string, string>;
}

function gueltig(wert: string | undefined): string | undefined {
  const bereinigt = wert?.trim();
  return bereinigt && CODE_MUSTER.test(bereinigt) ? bereinigt : undefined;
}

/** Das `verification`-Objekt für die Next.js-Metadaten – oder `undefined`, wenn nichts gesetzt ist. */
export function suchmaschinenBestaetigung(
  umgebung: Record<string, string | undefined>
): Suchmaschinenbestaetigung | undefined {
  const google = gueltig(umgebung.GOOGLE_SITE_VERIFICATION);
  const bing = gueltig(umgebung.BING_SITE_VERIFICATION);
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
  };
}
