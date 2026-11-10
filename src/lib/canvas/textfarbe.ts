/**
 * Textfarbe im Verhältnis zur Textilfarbe.
 *
 * Anlass (Stichprobentest 2026-11-10): Ein neuer Text bekam immer die Farbe
 * Schwarz – auf einem schwarzen Hoodie war er damit unsichtbar, ohne jede
 * Warnung. Jetzt wählt der Konfigurator die Standardfarbe nach dem Kontrast
 * zur Textilfarbe, und die Werkzeugleiste warnt, wenn Text und Textil
 * trotzdem fast gleich aussehen (z. B. nach einem Farbwechsel des Textils).
 *
 * Die Textilfarbe ist der Farbwert aus der Produktdefinition – eine
 * Näherung an das Foto, deshalb gilt die Warnschwelle bewusst großzügig.
 */

/** Unter diesem Kontrastverhältnis ist ein Text auf dem Textil kaum zu erkennen. */
export const TEXT_KONTRAST_MINDESTWERT = 2;

function zuRgb(farbe: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(farbe.trim());
  if (!m) return null;
  const hex = m[1]!.length === 3 ? m[1]!.split('').map((z) => z + z).join('') : m[1]!;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function leuchtdichte([r, g, b]: [number, number, number]): number {
  const linear = (k: number) => {
    const s = k / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Kontrastverhältnis nach WCAG (1 = gleich, 21 = Schwarz auf Weiß); null, wenn eine Farbe unbekannt ist. */
export function kontrastverhaeltnis(farbeA: string, farbeB: string): number | null {
  const a = zuRgb(farbeA);
  const b = zuRgb(farbeB);
  if (!a || !b) return null;
  const l1 = leuchtdichte(a);
  const l2 = leuchtdichte(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Schwarz oder Weiß – je nachdem, was sich vom Textil besser abhebt. Ohne bekannte Textilfarbe: Schwarz wie bisher. */
export function standardTextfarbe(textilHex: string | null | undefined): '#000000' | '#ffffff' {
  if (!textilHex) return '#000000';
  const zuSchwarz = kontrastverhaeltnis(textilHex, '#000000');
  const zuWeiss = kontrastverhaeltnis(textilHex, '#ffffff');
  if (zuSchwarz === null || zuWeiss === null) return '#000000';
  return zuWeiss > zuSchwarz ? '#ffffff' : '#000000';
}

/** Ist der Text auf diesem Textil kaum zu erkennen? Bei unbekannten Farben: nein (keine falsche Warnung). */
export function textKaumSichtbar(textHex: string | null | undefined, textilHex: string | null | undefined): boolean {
  if (!textHex || !textilHex) return false;
  const v = kontrastverhaeltnis(textHex, textilHex);
  return v !== null && v < TEXT_KONTRAST_MINDESTWERT;
}
