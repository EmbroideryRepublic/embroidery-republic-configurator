/**
 * Warenkorb-Preise gegen den AKTUELLEN Stand neu rechnen.
 *
 * Eine Warenkorbposition speichert Stück- und Gesamtpreis zum Zeitpunkt des Hineinlegens (der Warenkorb bleibt in der Sitzung
 * erhalten). Ändern sich Preise zwischendurch – wie bei der Preisanhebung vom 2026-11-12 –, zeigte der Warenkorb den alten Preis,
 * während der Server (autoritativ, serverPricing.ts) den neuen berechnet: Die Kundschaft zahlte etwas anderes als sie sah.
 *
 * Diese Funktion rechnet jede Position mit derselben Funktion wie Konfigurator und Server (`calculatePrice`, aktuelle Katalog-
 * Grundpreise, aktuelle Preisregeln) neu und liefert nur dort geänderte Positionen zurück, wo sich ein Preis wirklich geändert hat.
 * Positionen unbekannter Produkte bleiben unangetastet (der Server lehnt sie ohnehin ab).
 */
import type { CartItem } from '@/types';
import { getProduct } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '@/lib/pricing/calculatePrice';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { echteMasseJeElement } from '@/config/echteMasse';
import type { PreisAktion } from '@/config/aktion';

const CENT = 0.005;

export interface PreiseNeuErgebnis {
  items: CartItem[];
  /** Wie viele Positionen einen anderen Preis bekommen haben. */
  geaendert: number;
}

/**
 * `aktion`: die jetzt gültige Preisaktion (config/aktion.ts, `aktuelleAktion()`; der Warenkorb übergibt sie). Ohne Angabe wird nicht rabattiert.
 * Beginnt oder endet eine Aktion, während der Warenkorb noch offen ist, ändern sich damit die Preise – genau wie bei einer Preisänderung.
 */
export async function berechnePreiseNeu(items: CartItem[], aktion: PreisAktion | null = null): Promise<PreiseNeuErgebnis> {
  let geaendert = 0;
  const ergebnis: CartItem[] = [];
  for (const item of items) {
    const produkt = getProduct(item.productId);
    const menge = sumSizeQuantities(item.sizeQuantities) || item.quantity;
    if (!produkt || !(menge > 0)) {
      ergebnis.push(item);
      continue;
    }
    const regeln = await getPricingRules(item.printMethod);
    const r = calculatePrice({
      basePrice: produkt.basePrice,
      quantity: menge,
      elements: item.elements,
      pricingRules: regeln,
      echteMasse: echteMasseJeElement(item),
      aktion,
    });
    if (r.hasErrors || !(r.totalPrice > 0)) {
      ergebnis.push(item);
      continue;
    }
    // Gespart durch die Aktion (positiv) – wird mit der Position gespeichert, damit der Warenkorb den Rabatt zeigen kann, ohne zurückzurechnen.
    const aktionErsparnis = r.breakdown.aktionTotal < 0 ? Math.round(-r.breakdown.aktionTotal * 100) / 100 : undefined;
    const anders =
      Math.abs(r.unitPrice - item.unitPrice) > CENT ||
      Math.abs(r.totalPrice - item.totalPrice) > CENT ||
      Math.abs(r.breakdown.setupTotal - (item.setupTotal ?? 0)) > CENT ||
      Math.abs((aktionErsparnis ?? 0) - (item.aktionErsparnis ?? 0)) > CENT;
    if (!anders) {
      ergebnis.push(item);
      continue;
    }
    geaendert++;
    const { aktionErsparnis: _alt, ...ohneAktion } = item;
    ergebnis.push({
      ...ohneAktion,
      unitPrice: r.unitPrice,
      totalPrice: r.totalPrice,
      setupTotal: r.breakdown.setupTotal,
      ...(aktionErsparnis !== undefined ? { aktionErsparnis } : {}),
    });
  }
  return { items: ergebnis, geaendert };
}
