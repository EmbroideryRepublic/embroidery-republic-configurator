import type { ConfigElement, PrintMethod } from '@/types';
import { getProduct } from '@/config/products';
import { kleinsteBestellteGroesse, groessenLeiterVon } from '@/config/products/groessen';
import { flaecheFuerGroesse, getPrintAreasSync } from '@/config/printAreas';
import { echteMasse, type EchteMasse } from './abwicklung';

/**
 * Echte (flache) Maße je Element einer Bestellposition – nach Element-ID.
 *
 * Nur Elemente, für die es eine Abwicklung gibt (DTF auf Vorder-/Rückseite), tauchen auf. Für alles andere (Ärmel, Stickerei,
 * Produkte ohne Fläche) fehlt der Eintrag, und Aufrufer verwenden das gezeichnete Maß unverändert.
 *
 * Die Fläche wird gegen die KLEINSTE bestellte Größe aufgelöst – dieselbe Regel wie in der Bestellprüfung
 * (orderValidation.ts), im Editor und im Produktionsbild: Ein Motiv wird einmal platziert und auf jede Größe gedruckt.
 *
 * Reine Ableitung aus Katalog + gezeichneter Geometrie. Das Ergebnis wird nie gespeichert und nie vom Client übernommen:
 * der Server rechnet es für Preis und Produktionsangaben selbst.
 */
export function echteMassePosition(position: {
  productId: string;
  /** Unbekannt/leer (alte Bestellungen) wird wie DTF behandelt – Stickerei hat keine Abwicklung. */
  printMethod: PrintMethod | string | null | undefined;
  sizeQuantities: Record<string, number>;
  elements: Array<Pick<ConfigElement, 'id' | 'view' | 'xCm' | 'widthCm' | 'heightCm'>>;
}): Record<string, EchteMasse> {
  const ergebnis: Record<string, EchteMasse> = {};
  const product = getProduct(position.productId);
  if (!product || position.elements.length === 0) return ergebnis;

  const methode: PrintMethod = position.printMethod === 'embroidery' ? 'embroidery' : 'dtf';
  const flaechen = getPrintAreasSync(position.productId, methode);
  if (flaechen.length === 0) return ergebnis;
  const groesse = kleinsteBestellteGroesse(position.sizeQuantities, groessenLeiterVon(product));

  for (const element of position.elements) {
    const roh = flaechen.find((f) => f.view === element.view);
    if (!roh?.abwicklung) continue;
    ergebnis[element.id] = echteMasse(element, flaecheFuerGroesse(roh, groesse));
  }
  return ergebnis;
}

/** Wie `echteMassePosition`, für Elemente ohne eigene ID (Bestellsatz, Mail): Ergebnis in der Reihenfolge der Elemente, `undefined` = keine Abwicklung. */
export function echteMasseJeElement(position: {
  productId: string;
  printMethod: PrintMethod | string | null | undefined;
  sizeQuantities: Record<string, number>;
  elements: Array<Pick<ConfigElement, 'view' | 'xCm' | 'widthCm' | 'heightCm'>>;
}): Array<EchteMasse | undefined> {
  const mitId = position.elements.map((e, i) => ({ id: String(i), view: e.view, xCm: e.xCm, widthCm: e.widthCm, heightCm: e.heightCm }));
  const nachId = echteMassePosition({ ...position, elements: mitId });
  return position.elements.map((_, i) => nachId[String(i)]);
}
