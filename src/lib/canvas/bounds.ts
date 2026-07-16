export interface BoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Prüft, ob ein Element vollständig innerhalb eines Bereichs liegt.
 * Wird für die harte Begrenzung (Drag/Resize-Clamping) verwendet.
 */
export function isWithinBounds(element: BoundsRect, area: BoundsRect): boolean {
  return (
    element.x >= area.x &&
    element.y >= area.y &&
    element.x + element.width <= area.x + area.width &&
    element.y + element.height <= area.y + area.height
  );
}

/**
 * Prüft, ob ein Element näher als `marginPx` an einer Kante des Druckbereichs
 * liegt (Nahtabstand). Wird für die visuelle Warnung verwendet – das Element
 * darf technisch noch innerhalb des Bereichs sein, aber zu nah an der Naht.
 */
export function isNearSeam(element: BoundsRect, area: BoundsRect, marginPx: number): boolean {
  const distLeft = element.x - area.x;
  const distTop = element.y - area.y;
  const distRight = area.x + area.width - (element.x + element.width);
  const distBottom = area.y + area.height - (element.y + element.height);

  return Math.min(distLeft, distTop, distRight, distBottom) < marginPx;
}

/** Prüft, ob sich ein Element mit einer Sperrzone (z.B. Knopfleiste,
 *  Reißverschluss) überschneidet – einfache Rechteck-Überlappungsprüfung. */
export function overlapsExclusionZone(element: BoundsRect, zone: BoundsRect): boolean {
  return (
    element.x < zone.x + zone.width &&
    element.x + element.width > zone.x &&
    element.y < zone.y + zone.height &&
    element.y + element.height > zone.y
  );
}

/** Begrenzt die Position eines Elements so, dass es vollständig im Bereich bleibt. */
export function clampPositionToBounds(
  element: BoundsRect,
  area: BoundsRect
): { x: number; y: number } {
  const maxX = area.x + area.width - element.width;
  const maxY = area.y + area.height - element.height;

  return {
    x: maxX >= area.x ? Math.min(Math.max(element.x, area.x), maxX) : area.x + (area.width - element.width) / 2,
    y: maxY >= area.y ? Math.min(Math.max(element.y, area.y), maxY) : area.y + (area.height - element.height) / 2,
  };
}
