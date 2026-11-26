import { getProduct } from '@/config/products';

/**
 * Name einer Farbe beim Lieferanten (Textil-Großhandel, ersatzweise L-Shop) – für den Adminbereich, das Produktionsblatt und die internen Mails.
 *
 * Kundinnen und Kunden sehen deutsche Farbnamen; wer die Rohware einkauft, braucht den Namen, unter dem der Lieferant die Farbe führt.
 * Bestellungen speichern nur die Farb-ID und den Namen zum Bestellzeitpunkt; der Lieferantenname wird deshalb über (Produkt, Farbe) im Katalog
 * nachgeschlagen. Ist das Produkt oder die Farbe nicht mehr im Katalog, gilt der gespeicherte Name.
 */
export function lieferantenFarbname(productId: string, colorId: string, gespeicherterName: string): string {
  const farbe = getProduct(productId)?.colors.find((c) => c.id === colorId);
  return farbe?.lieferantenName ?? gespeicherterName;
}
