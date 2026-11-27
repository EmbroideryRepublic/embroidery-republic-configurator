/**
 * Rechenbeispiele der Aktionsseite (/black-week): dieselben T-Shirt-Beispiele wie auf der Kategorieseite, einmal zum regulären Preis und einmal
 * mit dem Aktionsrabatt – beides über `priceCart`, also exakt die Zahlen, die Konfigurator und Kasse für diese Konfiguration zeigen.
 * Keine Preise stehen fest im Text; ändern sich Preise oder der Satz, ändern sich die Beispiele mit.
 */
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { getProduct } from '@/config/products';
import { priceCart } from '@/lib/pricing/serverPricing';
import { positionAlsCartItem } from '@/lib/seo/kategorieSeite';
import type { PreisAktion } from '@/config/aktion';

export interface AktionsBeispiel {
  beschriftung: string;
  menge: number;
  /** Gesamtpreis ohne Aktion (Warenwert, ohne Versand). */
  gesamtRegulaer: number;
  /** Gesamtpreis mit Aktion. */
  gesamtAktion: number;
  /** Differenz (positiv). */
  ersparnis: number;
}

const BEISPIEL_SEITE = 't-shirts-bedrucken-besticken';
/** So viele Beispiele zeigt die Seite (Einzelstück, kleine Bestellung, Teamausstattung). */
const ANZAHL = 3;

const runde2 = (n: number) => Math.round(n * 100) / 100;

export async function berechneAktionsBeispiele(aktion: PreisAktion): Promise<AktionsBeispiel[]> {
  const seite = KATEGORIE_SEITEN.find((s) => s.slug === BEISPIEL_SEITE);
  if (!seite) return [];
  const beispiele = seite.beispiele.filter((b) => b.methode === 'dtf').slice(0, ANZAHL);
  const ergebnis: AktionsBeispiel[] = [];
  for (const b of beispiele) {
    const produkt = getProduct(b.produktId);
    if (!produkt) continue;
    const position = positionAlsCartItem(b, produkt);
    const regulaer = await priceCart([position]);
    const mitAktion = await priceCart([position], undefined, aktion);
    if (regulaer.blocked || mitAktion.blocked || regulaer.totalQuantity < 1) continue;
    ergebnis.push({
      beschriftung: b.beschriftung,
      menge: regulaer.totalQuantity,
      gesamtRegulaer: runde2(regulaer.subtotal),
      gesamtAktion: runde2(mitAktion.subtotal),
      ersparnis: runde2(regulaer.subtotal - mitAktion.subtotal),
    });
  }
  return ergebnis;
}
