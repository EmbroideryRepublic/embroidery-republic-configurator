/**
 * Gedächtnis des Produktbrowsers.
 *
 * Damit sich der Konfigurator persönlich anfühlt, merkt er sich über Sitzungen
 * hinweg, welche Gruppen offen waren, welche Produktart zuletzt gewählt war und
 * wie weit die Modellliste gescrollt war. Kommt der Kunde zurück, steht er
 * wieder dort, wo er aufgehört hat.
 *
 * ── Mehrere Gruppen gleichzeitig offen (kein Akkordeon) ───────────────
 * `offeneGruppen` ist eine LISTE: Eine Gruppe zu öffnen schließt keine andere.
 * So behalten Nutzer ihren Kontext und können mehrere Kategorien gleichzeitig
 * vergleichen. Nur ein bewusstes Zuklappen schließt eine Gruppe wieder.
 *
 * Bewusst getrennt vom `configuratorStore`. Persistenz über `zustand/persist`
 * in `localStorage`. (Frühere Fassung hielt eine einzelne `offeneGruppe`; der
 * alte Schlüssel wird beim Laden schlicht ignoriert – die Liste startet leer.)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hauptgruppe } from '@/lib/configurator/produktbaum';
import type { ProductType } from '@/types';

export type BrowserAuswahl = { gruppe: Hauptgruppe; art: ProductType };

interface BrowserState {
  /** Alle aktuell aufgeklappten Hauptgruppen (mehrere gleichzeitig möglich). */
  offeneGruppen: Hauptgruppe[];
  gewaehlt: BrowserAuswahl | null;
  modellScrollTop: number;
  /** Gruppe auf-/zuklappen, ohne andere Gruppen zu berühren. */
  toggleGruppe: (g: Hauptgruppe) => void;
  /** Gruppe sicher öffnen (falls noch nicht offen) – ohne andere zu schließen. */
  oeffneGruppe: (g: Hauptgruppe) => void;
  setGewaehlt: (v: BrowserAuswahl | null) => void;
  setModellScrollTop: (n: number) => void;
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set) => ({
      offeneGruppen: [],
      gewaehlt: null,
      modellScrollTop: 0,
      toggleGruppe: (g) =>
        set((s) => ({
          offeneGruppen: s.offeneGruppen.includes(g)
            ? s.offeneGruppen.filter((x) => x !== g)
            : [...s.offeneGruppen, g],
        })),
      oeffneGruppe: (g) =>
        set((s) => (s.offeneGruppen.includes(g) ? {} : { offeneGruppen: [...s.offeneGruppen, g] })),
      // Wechselt der Ast, ist die alte Scrollposition wertlos – zurücksetzen.
      setGewaehlt: (gewaehlt) => set({ gewaehlt, modellScrollTop: 0 }),
      setModellScrollTop: (modellScrollTop) => set({ modellScrollTop }),
    }),
    { name: 'konfigurator-browser' }
  )
);
