'use client';

/**
 * Hinweis auf rechtlichen Seiten (AGB, Impressum, Datenschutz), die
 * absichtlich NICHT automatisch übersetzt werden (Rechtstext-Risiko – siehe
 * Kopfkommentar von lib/i18n/translations.ts). Erscheint NUR, wenn die
 * Oberfläche gerade auf Englisch steht, damit eine deutsche Seite nicht
 * kommentarlos "halb-englisch" wirkt: die Sprachumschaltung bleibt sichtbar
 * wirksam (Navigation/Footer sind übersetzt), der Rechtstext selbst bleibt
 * bewusst Deutsch, mit klarer Begründung statt stillschweigend.
 */
import { useLanguageStore, translate } from '@/stores/languageStore';

export function LegalPageNotice() {
  const language = useLanguageStore((s) => s.language);
  if (language !== 'en') return null;

  return (
    <p className="mb-6 rounded-lg border border-gold/20 bg-gold-light/30 px-3 py-2 text-xs text-brand/70">
      {translate('legal_page_only_german', language)}
    </p>
  );
}
