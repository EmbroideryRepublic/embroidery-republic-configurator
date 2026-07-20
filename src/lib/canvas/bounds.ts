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

/** Schiebt ein Element aus allen überlappenden Sperrzonen heraus (plus
 *  `marginPx` Sicherheitsabstand, siehe unten), mit möglichst wenig
 *  Bewegung, ohne dabei den umgebenden Druckbereich zu verlassen. Wird
 *  sowohl beim Ziehen (dragBoundFunc, läuft bei jeder Mausbewegung) als
 *  auch nach dem Skalieren verwendet, damit ein Motiv technisch gar nicht
 *  erst auf Kragen/Knöpfen/Reißverschluss abgelegt werden kann – die rote
 *  Warnung allein hielt Kunden bisher nicht davon ab.
 *
 *  `marginPx`: ohne Sicherheitsabstand landet ein herausgeschobenes
 *  Element manchmal nur hauchdünn (rechnerisch korrekt, aber optisch nicht
 *  unterscheidbar von einer Überlappung) neben einer kleinen Zone wie
 *  einem Knopf – die Schätzung der Textbox-Größe hat genug Toleranz, dass
 *  das dann sichtbar wie "liegt doch drauf" aussieht. Der Zuschlag sorgt
 *  für sichtbaren Luftraum.
 *
 *  WICHTIG: Alle GERADE überlappenden (inkl. Marge) Zonen werden pro
 *  Durchlauf zu einer gemeinsamen Bounding-Box zusammengefasst und in
 *  einem Schritt verlassen (nicht einzeln nacheinander). Bei eng
 *  benachbarten Zonen (z.B. Kragenband + mehrere Knopf-Kreise beim Polo)
 *  würde ein Element, das größer als der Abstand zwischen ihnen ist, sonst
 *  von Zone zu Zone "hüpfen" und nie wirklich vollständig herauskommen.
 *  Findet sich keine gültige Ausweichposition (Element größer als der
 *  Platz neben der Zonen-Gruppe), bleibt die zuletzt erreichte Position
 *  stehen – besser leicht überlappend als in einer Endlosschleife. */
export function pushOutOfExclusionZones(
  rect: BoundsRect,
  area: BoundsRect,
  zones: BoundsRect[],
  marginPx = 0
): { x: number; y: number } {
  let x = rect.x;
  let y = rect.y;
  const { width, height } = rect;

  for (let i = 0; i < zones.length + 2; i++) {
    const current = { x, y, width, height };
    const overlapping = zones.filter((z) =>
      overlapsExclusionZone(current, {
        x: z.x - marginPx,
        y: z.y - marginPx,
        width: z.width + marginPx * 2,
        height: z.height + marginPx * 2,
      })
    );
    if (overlapping.length === 0) break;

    const merged = {
      x: Math.min(...overlapping.map((z) => z.x)) - marginPx,
      y: Math.min(...overlapping.map((z) => z.y)) - marginPx,
      x2: Math.max(...overlapping.map((z) => z.x + z.width)) + marginPx,
      y2: Math.max(...overlapping.map((z) => z.y + z.height)) + marginPx,
    };

    const candidates: { x: number; y: number; cost: number }[] = [];
    const pushLeftX = merged.x - width;
    if (pushLeftX >= area.x) candidates.push({ x: pushLeftX, y, cost: Math.abs(pushLeftX - x) });
    const pushRightX = merged.x2;
    if (pushRightX + width <= area.x + area.width) candidates.push({ x: pushRightX, y, cost: Math.abs(pushRightX - x) });
    const pushUpY = merged.y - height;
    if (pushUpY >= area.y) candidates.push({ x, y: pushUpY, cost: Math.abs(pushUpY - y) });
    const pushDownY = merged.y2;
    if (pushDownY + height <= area.y + area.height) candidates.push({ x, y: pushDownY, cost: Math.abs(pushDownY - y) });

    const best = candidates.sort((a, b) => a.cost - b.cost)[0];
    if (!best) break;
    x = best.x;
    y = best.y;
  }

  return { x, y };
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
