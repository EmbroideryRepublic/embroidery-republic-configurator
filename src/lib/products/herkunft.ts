/**
 * Herkunftsland für die Anzeige. Die Lieferantendaten führen bei 129 von 154 Produkten
 * entweder einen leeren Text oder „k.A." (keine Angabe). Eine Zeile „Herkunft: k.A." sagt der
 * Kundschaft nichts und wirkt wie ein vergessener Platzhalter – sie erscheint nur, wenn es
 * wirklich ein Land gibt.
 */
export function echteHerkunft(wert: string | undefined | null): string | null {
  const text = (wert ?? '').trim();
  if (!text) return null;
  // „k.A.", „k. A.", „keine Angabe", „n/a", „-" – alles, was erkennbar KEIN Land ist.
  if (/^(k\.?\s?a\.?|keine angabe|n\/?a|unbekannt|-+|–+)$/i.test(text)) return null;
  return text;
}
