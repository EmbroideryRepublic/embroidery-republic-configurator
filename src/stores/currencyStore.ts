import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'EUR' | 'CHF';

/**
 * WICHTIG: Das ist ein statischer Näherungskurs, KEIN Live-Wechselkurs.
 * Für echten Produktivbetrieb müsste hier eine echte Wechselkurs-API
 * angebunden werden (z.B. täglich aktualisiert via Cronjob/Edge Function).
 */
const APPROX_RATES: Record<Currency, number> = {
  EUR: 1,
  CHF: 0.95,
};

/**
 * Eigenständige (Nicht-Hook-)Funktion außerhalb des Stores. WICHTIG,
 * warum: Vorher gab der Store `formatPrice` als Funktion ZURÜCK, und
 * Komponenten haben `useCurrencyStore((s) => s.formatPrice)` abonniert.
 * Die Funktionsreferenz selbst ändert sich aber NIE (sie wird beim Erstellen
 * des Stores einmalig definiert) – ändert sich nur `currency`, hat React
 * dadurch keinen Grund, neu zu rendern, obwohl ein erneuter Aufruf von
 * formatPrice() ein anderes Ergebnis liefern würde. Die Preisanzeige blieb
 * dadurch nach einem Währungswechsel eingefroren. Jetzt abonnieren
 * Komponenten stattdessen `currency` direkt (ein einfacher String, den
 * Zustand korrekt auf Änderungen prüft) und rufen diese Funktion mit dem
 * aktuellen Wert auf.
 */
export function formatPriceWithCurrency(amountInEur: number, currency: Currency): string {
  const converted = amountInEur * APPROX_RATES[currency];
  const formatted = converted.toFixed(2);
  return currency === 'EUR' ? `${formatted} €` : `${formatted} CHF`;
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'EUR',
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'konfigurator-currency' }
  )
);
