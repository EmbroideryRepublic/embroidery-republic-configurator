'use client';

/**
 * Währungsbewusste Preisanzeige. Server-Komponenten (Startseite, Footer,
 * Produktkachel, Produktdetailseite) können `useCurrencyStore` nicht direkt
 * lesen – dieser kleine Client-Baustein kapselt genau das an einer Stelle,
 * statt denselben Umschalt-Code viermal zu duplizieren ("eine Berechnung,
 * ein Ort"). Rechnet und formatiert ausschließlich über
 * `formatPriceWithCurrency` (stores/currencyStore.ts) – hier passiert keine
 * eigene Umrechnung.
 */
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';

export function WaehrungsPreis({ betragInEur }: { betragInEur: number }) {
  const currency = useCurrencyStore((s) => s.currency);
  return <>{formatPriceWithCurrency(betragInEur, currency)}</>;
}
