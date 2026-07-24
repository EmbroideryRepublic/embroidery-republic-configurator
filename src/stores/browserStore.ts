/**
 * Gedächtnis des Produktbrowsers.
 *
 * Damit sich der Konfigurator persönlich anfühlt, merkt er sich über Sitzungen
 * hinweg, welche Gruppe und Produktart zuletzt offen waren und wie weit die
 * Modellliste gescrollt war. Kommt der Kunde zurück, steht er wieder dort, wo
 * er aufgehört hat – statt sich neu zu orientieren.
 *
 * Bewusst getrennt vom `configuratorStore` (der die eigentliche Konfiguration
 * hält): Dies ist reiner Navigationszustand des linken Bereichs. Persistenz
 * über `zustand/persist` in `localStorage`, wie bei Favoriten und Währung.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hauptgruppe } from '@/lib/configurator/produktbaum';
import type { ProductType } from '@/types';

export type BrowserAuswahl = { gruppe: Hauptgruppe; art: ProductType };

interface BrowserState {
  offeneGruppe: Hauptgruppe | null;
  gewaehlt: BrowserAuswahl | null;
  modellScrollTop: number;
  setOffeneGruppe: (g: Hauptgruppe | null) => void;
  setGewaehlt: (v: BrowserAuswahl | null) => void;
  setModellScrollTop: (n: number) => void;
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set) => ({
      offeneGruppe: null,
      gewaehlt: null,
      modellScrollTop: 0,
      setOffeneGruppe: (offeneGruppe) => set({ offeneGruppe }),
      // Wechselt der Ast, ist die alte Scrollposition wertlos – zurücksetzen.
      setGewaehlt: (gewaehlt) => set({ gewaehlt, modellScrollTop: 0 }),
      setModellScrollTop: (modellScrollTop) => set({ modellScrollTop }),
    }),
    { name: 'konfigurator-browser' }
  )
);
