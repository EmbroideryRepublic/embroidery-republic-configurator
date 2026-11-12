/**
 * Hinweis „Ihre bisherigen Stückzahlen wurden nicht übernommen“ nach einem Produktwechsel im Konfigurator.
 *
 * Wer von einem Erwachsenen-T-Shirt (Größe L × 3) zu Kinderbekleidung wechselt, hat keine passende Größe: Die Leitern (Konfektion,
 * Körpergröße in cm, Alter …) sind verschieden, und eine Größe zu raten wäre falsch. Die Menge verschwand bisher still. Dieser kleine,
 * bewusst NICHT gespeicherte Speicher merkt sich, wie viele Stück beim letzten Wechsel nicht übernommen werden konnten, damit die
 * Größentabelle es sagen kann – bis die Kundschaft wieder Stückzahlen einträgt.
 */
import { create } from 'zustand';

interface GroessenHinweisState {
  /** Stück, die beim letzten Produktwechsel keine passende Größe fanden (0 = nichts verloren). */
  verworfen: number;
  setze: (verworfen: number) => void;
}

export const useGroessenHinweisStore = create<GroessenHinweisState>((set) => ({
  verworfen: 0,
  setze: (verworfen) => set({ verworfen: Math.max(0, Math.floor(verworfen)) }),
}));
