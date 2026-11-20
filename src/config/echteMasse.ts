import type { ConfigElement, PrintMethod } from '@/types';
import { getProduct } from '@/config/products';
import { kleinsteBestellteGroesse, groessenLeiterVon } from '@/config/products/groessen';
import { flaecheFuerGroesse, getPrintAreasSync } from '@/config/printAreas';
import { echteMasse, type EchteMasse } from './abwicklung';

/**
 * Echte (flache) Maße je Element einer Bestellposition – in der Reihenfolge der Elemente (`undefined` = keine Abwicklung).
 *
 * Bewusst nach POSITION in der Liste zugeordnet, nicht nach Element-ID: Die ID kommt vom Client. Zwei Motive mit gleicher ID würden sich
 * in einer ID-Zuordnung überschreiben, und das große Motiv bekäme die Maße des kleinen (Preis-Manipulation beim Großformat-Zuschlag).
 *
 * Nur Elemente, für die es eine Abwicklung gibt (DTF auf Vorder-/Rückseite), haben einen Eintrag. Für alles andere (Ärmel, Stickerei,
 * Produkte ohne Fläche) bleibt es `undefined`, und Aufrufer verwenden das gezeichnete Maß unverändert.
 *
 * Die Fläche wird gegen die KLEINSTE bestellte Größe aufgelöst – dieselbe Regel wie in der Bestellprüfung
 * (orderValidation.ts), im Editor und im Produktionsbild: Ein Motiv wird einmal platziert und auf jede Größe gedruckt.
 *
 * Reine Ableitung aus Katalog + gezeichneter Geometrie. Das Ergebnis wird nie gespeichert und nie vom Client übernommen:
 * der Server rechnet es für Preis und Produktionsangaben selbst.
 */
export function echteMasseJeElement(position: {
  productId: string;
  /** Unbekannt/leer (alte Bestellungen) wird wie DTF behandelt – Stickerei hat keine Abwicklung. */
  printMethod: PrintMethod | string | null | undefined;
  sizeQuantities: Record<string, number>;
  elements: Array<Pick<ConfigElement, 'view' | 'xCm' | 'widthCm' | 'heightCm'>>;
}): Array<EchteMasse | undefined> {
  const leer = position.elements.map(() => undefined);
  const product = getProduct(position.productId);
  if (!product || position.elements.length === 0) return leer;

  const methode: PrintMethod = position.printMethod === 'embroidery' ? 'embroidery' : 'dtf';
  const flaechen = getPrintAreasSync(position.productId, methode);
  if (flaechen.length === 0) return leer;
  const groesse = kleinsteBestellteGroesse(position.sizeQuantities, groessenLeiterVon(product));

  return position.elements.map((element) => {
    const roh = flaechen.find((f) => f.view === element.view);
    if (!roh?.abwicklung) return undefined;
    return echteMasse(element, flaecheFuerGroesse(roh, groesse));
  });
}

/**
 * Die Größe, nach der die echten Maße einer Position gelten: die KLEINSTE bestellte. Ein Motiv wird einmal platziert und auf jede
 * bestellte Größe gleich groß gedruckt – es muss auf der kleinsten passen. Für die Anzeige („gerechnet für Größe S“).
 */
export function massgeblicheGroesse(position: { productId: string; sizeQuantities: Record<string, number> }): string | undefined {
  const product = getProduct(position.productId);
  if (!product) return undefined;
  return kleinsteBestellteGroesse(position.sizeQuantities, groessenLeiterVon(product));
}
