import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { MINIMUM_QUANTITY } from '@/lib/pricing/calculatePrice';
import { indexedDbStorage } from '@/lib/storage/indexedDbStorage';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

/**
 * Persistiert im localStorage des Browsers (nur Warenkorb-Inhalt, keine
 * personenbezogenen Daten), damit ein versehentliches Neuladen der Seite
 * nicht die gesamte Konfiguration verwirft. Rein clientseitig – sobald die
 * Supabase-Anbindung steht, kann hier zusätzlich serverseitig gespeichert
 * werden, ohne die Komponenten anzufassen, die diesen Store nutzen.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateItemQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const nextQuantity = Math.max(quantity, MINIMUM_QUANTITY);
            return { ...i, quantity: nextQuantity, totalPrice: i.unitPrice * nextQuantity };
          }),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'konfigurator-cart',
      storage: createJSONStorage(() => indexedDbStorage),
      // WICHTIG: sizeLabel (eine Größe) -> sizeQuantities (mehrere Größen)
      // umgestellt. Ohne Migration hätten bereits im Warenkorb liegende
      // alte Positionen sizeQuantities === undefined gehabt –
      // Object.entries(undefined) in der Warenkorb-Anzeige hätte dann die
      // gesamte Warenkorb-Ansicht zum Absturz gebracht.
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as { items?: (CartItem & { sizeLabel?: string })[] };
        if (!state.items) return state;
        return {
          ...state,
          items: state.items.map((item) => {
            if (item.sizeQuantities) return item;
            const { sizeLabel, ...rest } = item;
            return {
              ...rest,
              sizeQuantities: sizeLabel ? { [sizeLabel]: item.quantity } : {},
            };
          }),
        };
      },
    }
  )
);

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}
