/**
 * Hinweis „Preise im Warenkorb wurden aktualisiert“.
 *
 * Merkt sich (bewusst NICHT gespeichert), wie viele Positionen beim Laden des Warenkorbs einen neuen Preis bekommen haben
 * (lib/cart/preiseAktualisieren.ts), damit der Warenkorb es der Kundschaft sagen kann – bis sie den Hinweis schließt.
 */
import { create } from 'zustand';

interface WarenkorbHinweisState {
  /** Positionen, deren Preis beim Laden angepasst wurde (0 = kein Hinweis). */
  geaenderte: number;
  setze: (geaenderte: number) => void;
  schliesse: () => void;
}

export const useWarenkorbHinweisStore = create<WarenkorbHinweisState>((set) => ({
  geaenderte: 0,
  setze: (geaenderte) => set({ geaenderte: Math.max(0, Math.floor(geaenderte)) }),
  schliesse: () => set({ geaenderte: 0 }),
}));
