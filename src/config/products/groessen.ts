/**
 * Konfektionsgrößen in ihrer natürlichen Reihenfolge – eine einzige Quelle.
 *
 * Diese Reihenfolge wird an mehreren Stellen gebraucht (Facetten-Sortierung
 * der Filterleiste, „nächstgelegene Größe" beim Produktwechsel). Sie stand
 * zuvor mehrfach als Kopie im Code; jede Kopie war eine Gelegenheit,
 * auseinanderzulaufen. Deshalb hier zentral.
 */
export const KONFEKTIONSGROESSEN: readonly string[] = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL',
];

/** Roher Index in der Konfektionsreihenfolge; -1, wenn unbekannt. */
export function groessenIndex(groesse: string): number {
  return KONFEKTIONSGROESSEN.indexOf(groesse.toUpperCase());
}

/**
 * Rang einer Größe zum Sortieren. Unbekannte Größen landen hinten (Rang =
 * Länge), sodass eine neue Bezeichnung die Sortierung nicht bricht, sondern
 * ans Ende fällt und dort auffällt.
 */
export function groessenRang(groesse: string): number {
  const i = groessenIndex(groesse);
  return i === -1 ? KONFEKTIONSGROESSEN.length : i;
}
