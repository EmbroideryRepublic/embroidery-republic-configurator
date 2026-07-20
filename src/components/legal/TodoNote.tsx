import type { ReactNode } from 'react';

/**
 * Einheitliche Markierung für rechtlich erforderliche Angaben, die noch NICHT
 * vorliegen. Bewusst auffällig – solche Lücken dürfen im Live-Betrieb nicht
 * übersehen werden. Es werden hier niemals Werte erfunden oder geschätzt.
 */
export function TodoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
      <strong>Noch zu ergänzen.</strong> {children}
    </div>
  );
}

/** Inline-Platzhalter für eine einzelne fehlende Pflichtangabe. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
      [{children}]
    </mark>
  );
}
