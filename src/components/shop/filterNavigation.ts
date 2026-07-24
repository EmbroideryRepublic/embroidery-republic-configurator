'use client';

/**
 * Gemeinsame Fortschreibung der Adresszeile.
 *
 * Alle Filterbausteine (Kategorie-Reiter, Seitenleiste, Kopfleiste, Chips,
 * Mobil-Panel) teilen sich diesen Haken. Sie halten deshalb KEINEN eigenen
 * Zustand: Jeder schreibt nur die Adresse fort, der Server rendert neu.
 * Dadurch können mehrere Bausteine nebeneinander stehen, ohne sich
 * gegenseitig zu überschreiben.
 */
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { schreibeKriterien, type FilterKriterien } from '@/lib/catalog/kriterien';

export function useFilterNavigation(): {
  anwenden: (k: FilterKriterien) => void;
  wartet: boolean;
} {
  const router = useRouter();
  const [wartet, starte] = useTransition();

  const anwenden = (k: FilterKriterien) => {
    const abfrage = schreibeKriterien(k);
    // `replace` statt `push`: Jeder Häkchenklick soll keinen Eintrag in der
    // Vor/Zurück-Historie hinterlassen – sonst braucht man zwanzig Klicks
    // „zurück", um zur Herkunftsseite zu kommen.
    starte(() => router.replace(abfrage ? `/produkt?${abfrage}` : '/produkt', { scroll: false }));
  };

  return { anwenden, wartet };
}
