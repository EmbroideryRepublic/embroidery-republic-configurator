import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { indexedDbStorage, getTabId } from '@/lib/storage/indexedDbStorage';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  /**
   * ENTFERNT – bewusst nicht ersetzt.
   *
   * Die frühere Fassung rechnete den Preis im Store selbst neu
   * (`unitPrice * Menge + Rüstkosten`) und war damit eine ZWEITE
   * Geschäftslogik neben der Preispipeline. Sie wandte die Mengenstaffel
   * nicht erneut an: Wer 5 Stück in den Warenkorb legte und dort auf 100
   * erhöhte, zahlte gemessen **173,82 € (11,2 %) zu viel**, weil der
   * Mengenrabatt von -5 % statt -25 % stehen blieb.
   *
   * Die Aktion hatte keinen einzigen Aufrufer und wurde deshalb entfernt
   * statt repariert. Wird die Mengenänderung im Warenkorb später gebraucht,
   * MUSS sie über `calculatePipeline` laufen (siehe
   * docs/geschaeftsarchitektur.md, Migration M1) – niemals über eine eigene
   * Rechnung im Store.
   */
  clear: () => void;
}

/**
 * HINWEIS zur Absendekennung gegen Doppelbestellungen:
 *
 * Sie liegt BEWUSST nicht hier, sondern synchron im localStorage (siehe
 * lib/hooks/useSubmitGuard.ts). Sie beschreibt einen Absendevorgang, nicht den
 * Warenkorbinhalt, und muss getrennt verworfen werden können: nach einer
 * unverbindlichen Anfrage bleibt der Warenkorb bestehen, die Kennung darf es
 * nicht – sonst gälte die anschließende echte Bestellung als Wiederholung der
 * Anfrage und entstünde nie.
 */

/**
 * Persistiert im localStorage des Browsers (nur Warenkorb-Inhalt, keine
 * personenbezogenen Daten), damit ein versehentliches Neuladen der Seite
 * nicht die gesamte Konfiguration verwirft. Rein clientseitig – sobald die
 * Supabase-Anbindung steht, kann hier zusätzlich serverseitig gespeichert
 * werden, ohne die Komponenten anzufassen, die diesen Store nutzen.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),


      clear: () => set({ items: [] }),
    }),
    {
      // Tab-eindeutig (siehe getTabId in indexedDbStorage.ts): sonst
      // überschreiben sich mehrere gleichzeitig geöffnete Tabs gegenseitig
      // den Warenkorb-Stand. Ein Reload IM SELBEN Tab behält den Stand
      // trotzdem (sessionStorage übersteht ihn), ein neuer Tab bekommt einen
      // eigenen, unabhängigen Datensatz.
      name: `konfigurator-cart-${getTabId()}`,
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

/**
 * Anzahl der Positionen (unterschiedliche Artikel), NICHT die
 * Gesamtstückzahl – Header-Badge und Drawer-Titel zeigen beide diese Zahl,
 * damit am selben Warenkorb nicht zwei widersprüchliche Zahlen erscheinen.
 */
export function getCartItemCount(items: CartItem[]): number {
  return items.length;
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}
