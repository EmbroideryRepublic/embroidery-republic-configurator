import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type TranslationKey } from '@/lib/i18n/translations';

/**
 * Eigenständige (Nicht-Hook-)Funktion außerhalb des Stores – aus demselben
 * Grund wie bei formatPriceWithCurrency in currencyStore.ts: Der Store gab
 * vorher `t` als FUNKTION zurück, und Komponenten haben
 * `useLanguageStore((s) => s.t)` abonniert. Die Funktionsreferenz ändert
 * sich aber nie (einmalig beim Erstellen des Stores definiert) – ändert
 * sich nur `language`, hatte React dadurch keinen Grund neu zu rendern.
 * Der Sprachwechsel-Button hat dadurch sichtbar nichts bewirkt, bis die
 * Seite neu geladen wurde (dann griff der neue, persistierte Wert beim
 * ersten Rendern). Jetzt abonnieren Komponenten `language` direkt.
 */
export function translate(key: TranslationKey, language: Language, vars?: Record<string, string | number>): string {
  let text: string = translations[language][key] ?? translations.de[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'de',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'konfigurator-language', partialize: (state) => ({ language: state.language }) }
  )
);
