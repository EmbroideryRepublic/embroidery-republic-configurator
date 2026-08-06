import { assetVerfuegbarkeit } from '@/lib/assets';

/**
 * Farben, die dem Kunden zur AUSWAHL gestellt werden dürfen.
 *
 * Gegenstück zu `sichtbareAnsichten()`: Dort geht es um „welche Ansicht darf ich
 * zeigen", hier um „welche Farbe darf ich anbieten".
 *
 * Die Katalogpaletten führen bewusst ALLE Herstellerfarben – sie sind die
 * fachliche Wahrheit über das Produkt und werden nicht beschnitten (Bestell-
 * validierung, Lieferanten-Mapping und Facetten-Statistik hängen daran).
 * Anbieten dürfen wir aber nur, was wir auch zeigen können: Eine Farbe ohne
 * echtes Herstellerfoto führte im Konfigurator zur Platzhalter-Silhouette,
 * sobald der Kunde sie anklickte. Genau das soll es nicht mehr geben.
 *
 * Damit ist die Regel strukturell statt per gepflegter Ausschlussliste: Sobald
 * der Bildimport eine Farbe nachliefert, erscheint sie von selbst wieder. Farben,
 * für die nach der Recherche nirgends ein offizielles Foto existiert, bleiben
 * ausgeblendet und stehen in docs/bildimport-abschlussbericht.md.
 *
 * Notnagel: Hat ein Produkt für KEINE Farbe Fotos, werden alle Farben gezeigt –
 * eine leere Farbleiste wäre schlimmer als ein Platzhalter. Der Wächtertest in
 * farben.test.ts stellt sicher, dass dieser Fall im Katalog nicht vorkommt.
 */
export function waehlbareFarben<T extends { id: string }>(
  productId: string,
  colors: readonly T[]
): readonly T[] {
  const mitFoto = colors.filter((c) => assetVerfuegbarkeit(productId, c.id) === 'vorhanden');
  return mitFoto.length ? mitFoto : colors;
}
