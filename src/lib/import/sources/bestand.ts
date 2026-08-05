/**
 * „Bestand"-`ImageSource` (ADR 0006): liefert die BEREITS vorhandenen echten
 * Fotos aus der Asset-Schicht als Originale. Zweck: beim Herstellerimport bleibt
 * der bestehende, bereits normalisierte Bildbestand erhalten und wird von der
 * zentralen Pipeline gleich behandelt wie jede Herstellerquelle – ein Original
 * wird nie verloren, nur ggf. durch ein besseres Herstellerbild ersetzt.
 *
 * Priorität bewusst HOCH (= schwach): ein echter Hersteller (prioritaet 0…N) geht
 * vor; der Bestand füllt Lücken und bewahrt, was der Hersteller nicht liefert.
 *
 * Resolver injizierbar (Default: Asset-Schicht) → im Test ohne Manifest prüfbar.
 */
import type { ImageSource, BildReferenz, ImportProduktRef } from '../imageSource';
import { resolveColorImages, PLATZHALTER_BILD } from '@/lib/assets';

export const BESTAND_PRIORITAET = 1000;

type Resolver = (productId: string, colorId: string) => Record<string, string>;

export function bestandImageSource(resolver: Resolver = resolveColorImages): ImageSource {
  return {
    quelle: 'bestand',
    prioritaet: BESTAND_PRIORITAET,
    async bilderFuer(produkt: ImportProduktRef): Promise<BildReferenz[]> {
      const refs: BildReferenz[] = [];
      for (const c of produkt.colors) {
        for (const [view, pfad] of Object.entries(resolver(produkt.id, c.id))) {
          // Nur ECHTE Fotos als Bestand liefern – Platzhalter sind kein Original.
          if (!pfad || pfad === PLATZHALTER_BILD) continue;
          refs.push({
            colorId: c.id,
            view,
            viewKonfidenz: 'gelabelt', // die bestehende View-Zuordnung ist verifiziert
            rolle: 'ansicht-flach',
            herkunft: 'original',
            quellUrl: pfad,
            quelle: 'bestand',
            prioritaet: BESTAND_PRIORITAET,
          });
        }
      }
      return refs;
    },
  };
}
