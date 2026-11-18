import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDbStorage, getTabId } from '@/lib/storage/indexedDbStorage';
import {
  bereinigeGespeicherte,
  entferneEntwurf,
  fuegeEntwurfEin,
  fuehreZusammen,
  type Entwurf,
} from '@/lib/configurator/entwuerfe';

interface EntwuerfeState {
  /** Neueste zuerst, höchstens `MAX_ENTWUERFE`, ein Entwurf je Produkt. */
  entwuerfe: Entwurf[];
  /** Merkt einen Entwurf (ersetzt den älteren Stand desselben Produkts). */
  merke: (entwurf: Entwurf) => void;
  /** Entfernt den Entwurf mit dieser ID. */
  entferne: (id: string) => void;
  leere: () => void;
}

/**
 * Entwürfe des Konfigurators („Zuletzt bearbeitet", siehe
 * lib/configurator/entwuerfe.ts für die Regeln).
 *
 * Gespeichert wird wie bei Warenkorb und Konfigurator: Tab-eindeutig in
 * IndexedDB (siehe getTabId in indexedDbStorage.ts). Ein Neuladen desselben
 * Tabs behält die Entwürfe, ein neuer Tab beginnt ohne – derselbe Zuschnitt wie
 * beim Arbeitsstand selbst, an dem sie hängen. Logos liegen als Base64 in den
 * Entwürfen, deshalb IndexedDB (nicht localStorage) und die Begrenzung der Zahl.
 */
export const useEntwuerfeStore = create<EntwuerfeState>()(
  persist(
    (set) => ({
      entwuerfe: [],
      merke: (entwurf) => set((s) => ({ entwuerfe: fuegeEntwurfEin(s.entwuerfe, entwurf) })),
      entferne: (id) => set((s) => ({ entwuerfe: entferneEntwurf(s.entwuerfe, id) })),
      leere: () => set({ entwuerfe: [] }),
    }),
    {
      name: `konfigurator-entwuerfe-${getTabId()}`,
      storage: createJSONStorage(() => indexedDbStorage),
      version: 1,
      // Das Laden aus IndexedDB ist asynchron: Wechselt jemand das Produkt, bevor
      // es fertig ist, steht der frisch gemerkte Entwurf schon im Zustand. Das
      // Standardverhalten (Gespeichertes überschreibt) würde ihn verlieren –
      // deshalb werden beide Listen zusammengeführt. Außerdem wird Gespeichertes
      // geprüft, bevor es verwendet wird (veraltete/defekte Daten).
      merge: (gespeichert, aktuell) => {
        const geladen = bereinigeGespeicherte((gespeichert as { entwuerfe?: unknown } | undefined)?.entwuerfe);
        return { ...aktuell, entwuerfe: fuehreZusammen(aktuell.entwuerfe, geladen) };
      },
      partialize: (state) => ({ entwuerfe: state.entwuerfe }),
    }
  )
);
