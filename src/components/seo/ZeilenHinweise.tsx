import { zeilenHinweise } from '@/config/seo/preisHinweise';

/**
 * Erklärsätze unter einer Preisbeispiel-Zeile (Einrichtung bei 1–2 Stück, zweite bedruckte Position).
 * Wortlaut und Regeln: config/seo/preisHinweise.ts. Zeigt nichts, wenn die Zeile keine Erklärung braucht.
 */
export function ZeilenHinweise({
  menge,
  positionen,
  eigener,
  dtf,
  grossformat,
}: {
  menge: number;
  positionen: number;
  eigener?: string;
  dtf?: boolean;
  /** Großformat-Zuschlag je Stück aus der Preis-Engine (berechneBeispiele). */
  grossformat?: number;
}) {
  const hinweise = zeilenHinweise({ menge, positionen, eigener, dtf, grossformat });
  if (hinweise.length === 0) return null;
  return (
    <>
      {hinweise.map((hinweis) => (
        <p key={hinweis} className="mt-1.5 text-[13px] leading-relaxed text-brand/70">
          {hinweis}
        </p>
      ))}
    </>
  );
}
