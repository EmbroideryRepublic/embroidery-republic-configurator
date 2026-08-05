import { create } from 'zustand';

/**
 * Kurzlebiger UI-Zustand, der seitenübergreifend gilt, aber NICHT persistiert
 * werden soll (kein localStorage): aktuell nur, ob die Warenkorb-Schublade
 * offen ist.
 *
 * Warum ein eigener Store und nicht lokaler State: Der Warenkorb soll von
 * JEDER Seite über das Symbol in der Kopfzeile geöffnet werden können. Ein
 * globaler Host (CartDrawerHost) rendert die Schublade, die Kopfzeile schaltet
 * hier nur `warenkorbOffen` um – ohne dass beide dieselbe Komponente kennen
 * müssen. Der Konfigurator bringt seine eigene Schublade mit und bleibt davon
 * unberührt (v1.0).
 */
interface UiState {
  warenkorbOffen: boolean;
  oeffneWarenkorb: () => void;
  schliesseWarenkorb: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  warenkorbOffen: false,
  oeffneWarenkorb: () => set({ warenkorbOffen: true }),
  schliesseWarenkorb: () => set({ warenkorbOffen: false }),
}));
