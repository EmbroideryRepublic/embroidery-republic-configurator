/**
 * ═══════════════════════════════════════════════════════════════════════
 * DEUTSCHE ANZEIGE VON ZAHLEN UND GELDBETRÄGEN – die einzige Stelle
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Shop, Adminbereich, E-Mails, Produktionsblatt, Preisauskunft und alle
 * künftigen Dokumente (Rechnung, Gutschrift) formatieren ausschließlich
 * hier. Deutsche Schreibweise nutzt das Komma als Dezimaltrennzeichen –
 * ohne diese Helfer erscheinen Maße als „45.7 cm" und Preise als „31.64 €".
 *
 * ── Warum die Geldformatierung hinzukam ───────────────────────────────
 * Es liefen vier Verfahren nebeneinander: `formatPriceWithCurrency` im
 * Shop, `toLocaleString(style:'currency')` im Adminbereich, `euro()` auf den
 * Produktseiten – und `toFixed(2)` in E-Mails, Produktionsblatt und
 * Preisauskunft. Die ersten drei ergaben „31,64 €", das letzte „31.64 €"
 * mit englischem Dezimalpunkt und ohne Tausenderzeichen.
 *
 * Betroffen waren ausgerechnet die Stellen, die aus dem Haus gehen:
 * Bestellbestätigung, interne Meldung, Produktionsblatt. Dieselbe Bestellung
 * war im Shop anders ausgezeichnet als in der Mail darüber. Aufgefallen ist
 * es erst durch den End-to-End-Test, der angezeigten mit gespeichertem Preis
 * verglich – mit einer Rechnung wäre daraus ein kaufmännisches Problem
 * geworden.
 *
 * ── Ausschliesslich DARSTELLUNG ───────────────────────────────────────
 * Diese Datei rechnet nicht und rundet nicht fachlich. Sie bekommt einen
 * bereits berechneten Wert und macht daraus Text. Beträge entstehen einzig
 * in der Preispipeline (`lib/pricing/`), die Umrechnung in Cent für
 * Zahlungen einzig in `lib/payments/betrag.ts`.
 *
 * Bewusst OHNE eigene Importe: Dadurch ist die Datei von Server, Browser,
 * E-Mail-Vorlage, PDF-Erzeugung und Hintergrundjob gleichermaßen nutzbar –
 * und die Preispipeline darf sie verwenden, ohne ihre Reinheit zu verlieren.
 */

/**
 * Das Gebietsschema ist FEST und wird nicht vom Browser übernommen.
 *
 * Zwei Gründe: Server und Client müssen dieselbe Zeichenkette erzeugen,
 * sonst weicht die Hydration ab. Und ein Preis auf einer deutschsprachigen
 * Seite gehört in deutscher Schreibweise ausgezeichnet, unabhängig davon,
 * wie der Browser der Besucherin eingestellt ist.
 */
const GEBIETSSCHEMA = 'de-DE';

/** Zahl mit deutschem Dezimalkomma, ohne unnötige Nachkommastellen. */
export function zahl(wert: number, maxNachkomma = 1): string {
  return new Intl.NumberFormat(GEBIETSSCHEMA, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxNachkomma,
  }).format(wert);
}

/** Maßangabe in Zentimetern, z.B. „45,7 cm". */
export function cm(wert: number): string {
  return `${zahl(wert)} cm`;
}

// ── Geldbeträge ─────────────────────────────────────────────────────────

/** Währungen, die dargestellt werden können. */
export type GeldWaehrung = 'EUR' | 'CHF';

const ZEICHEN: Record<GeldWaehrung, string> = {
  EUR: '€',
  CHF: 'CHF',
};

/**
 * Formatiert einen bereits berechneten Betrag zur Anzeige.
 *
 * @param betrag   Betrag in der angegebenen Währung (KEINE Cent).
 * @param waehrung Standard EUR.
 *
 * Beispiele: `31,64 €` · `1.234,56 €` · `-5,00 €` · `31,64 CHF`
 */
export function formatiereGeld(betrag: number, waehrung: GeldWaehrung = 'EUR'): string {
  // Unbrauchbare Werte nicht als „NaN €" anzeigen: Das sagt der Kundschaft
  // nichts und sieht in einer Rechnung nach Fehler aus. Ein Strich ist
  // ehrlicher und fällt beim Korrekturlesen sofort auf.
  if (!Number.isFinite(betrag)) return `– ${ZEICHEN[waehrung]}`;

  const formatiert = new Intl.NumberFormat(GEBIETSSCHEMA, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(betrag);
  return `${formatiert} ${ZEICHEN[waehrung]}`;
}

/**
 * Wie `formatiereGeld`, aber mit ausdrücklichem Vorzeichen bei positiven
 * Beträgen. Für Aufschlüsselungen, in denen Zu- und Abschläge nebeneinander
 * stehen und „+2,50 €" neben „-5,00 €" deutlicher ist als „2,50 €".
 */
export function formatiereGeldMitVorzeichen(betrag: number, waehrung: GeldWaehrung = 'EUR'): string {
  if (!Number.isFinite(betrag)) return formatiereGeld(betrag, waehrung);
  const vorzeichen = betrag > 0 ? '+' : '';
  return `${vorzeichen}${formatiereGeld(betrag, waehrung)}`;
}
