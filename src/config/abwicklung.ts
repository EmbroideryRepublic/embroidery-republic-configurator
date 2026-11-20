import type { ConfigElement, PrintArea } from '@/types';

/**
 * ABWICKLUNG – von der gezeichneten (projizierten) Breite zur ECHTEN flachen Breite.
 *
 * ── Warum es das braucht ─────────────────────────────────────────────
 * Das Produktfoto zeigt die Brust von vorn, also gewölbt. Der Konfigurator rechnet Pixel in Zentimeter mit EINEM Maßstab um
 * (aus der Höhe, siehe cmConversion.ts). Senkrecht stimmt das, waagerecht nicht: Ein Motiv, das im Bild 30 cm breit aussieht, ist
 * auf dem flach liegenden Textil deutlich breiter, weil der Stoff zu den Seiten hin wegkippt. Beim Hoodie Größe M (Brust 56 cm
 * flach) sind aus 30 gezeichneten Zentimetern 35,5 echte, aus 35 gezeichneten 49. Wer nach dem gezeichneten Maß produziert, druckt
 * zu klein.
 *
 * ── Modell ────────────────────────────────────────────────────────────
 * Die Brust ist ein Zylinder mit dem Radius r = flache Brustbreite / π (halber Umfang = flache Breite). Ein Punkt im Abstand u
 * (Bogenlänge, flach gemessen) von der Mitte erscheint im Foto bei x = r · sin(u / r). Umgekehrt ist u = r · asin(x / r). Die
 * flache Breite eines Motivs von x1 bis x2 (gezeichnet, ab Brustmitte) ist damit r · (asin(x2 / r) − asin(x1 / r)).
 *
 * Gemessen wurde das Verhältnis „sichtbare Torsobreite / flache Brustbreite“ an 28 Produkten: 0,6575 ± 0,042 (Zylinder: 2/π =
 * 0,6366). Das Modell ist also eine gute Näherung, keine Messung am einzelnen Kleidungsstück – an den Rändern reagiert die Breite
 * stark auf Bruchteile eines Zentimeters. Die Höhe wird nicht umgerechnet (das Foto ist senkrecht maßstabsgetreu).
 */

/** Krümmung der Brust einer Fläche: Radius und Lage der Brustmitte (cm ab linker Flächenkante). */
export interface Abwicklung {
  radiusCm: number;
  mitteCm: number;
}

/** Bogenlänge (flach) zu einer gezeichneten Strecke ab Brustmitte; außerhalb der Kontur wird auf den Rand begrenzt. */
function bogenAb(xAbMitteCm: number, radiusCm: number): number {
  const s = Math.max(-1, Math.min(1, xAbMitteCm / radiusCm));
  return radiusCm * Math.asin(s);
}

/**
 * Echte flache Breite eines Motivs, das in der Fläche von `xCm` bis `xCm + breiteCm` gezeichnet ist (cm ab linker Flächenkante).
 * Ohne Krümmungsangabe (Ärmel, Stickerei, Ansichten ohne Abwicklung) gilt die gezeichnete Breite unverändert.
 */
export function flacheBreiteCm(xCm: number, breiteCm: number, abwicklung?: Abwicklung | null): number {
  if (!abwicklung || !(abwicklung.radiusCm > 0)) return breiteCm;
  const { radiusCm, mitteCm } = abwicklung;
  return bogenAb(xCm + breiteCm - mitteCm, radiusCm) - bogenAb(xCm - mitteCm, radiusCm);
}

/** Echte flache Breite der gesamten Fläche = die größte Breite, die ein Motiv hier überhaupt haben kann. */
export function flacheFlaechenBreiteCm(flaeche: Pick<PrintArea, 'boxWidthCm' | 'abwicklung'>): number {
  return flacheBreiteCm(0, flaeche.boxWidthCm, flaeche.abwicklung);
}

export interface EchteMasse {
  breiteCm: number;
  hoeheCm: number;
}

/**
 * Echte (flache) Maße eines Elements auf seiner Fläche. Die Höhe bleibt, die Breite wird abgewickelt. Das Ergebnis ist nie
 * kleiner als das gezeichnete Maß und beschreibt das Motiv unrotiert (die Drehung ändert die Folie nicht).
 */
export function echteMasse(
  element: Pick<ConfigElement, 'xCm' | 'widthCm' | 'heightCm'>,
  flaeche: Pick<PrintArea, 'abwicklung'> | null | undefined
): EchteMasse {
  const breite = flacheBreiteCm(element.xCm, element.widthCm, flaeche?.abwicklung);
  return { breiteCm: Math.max(breite, element.widthCm), hoeheCm: element.heightCm };
}

/** Bei 0,1 cm genau – so zeigen Editor, Admin, Mail und Produktionsblatt dieselbe Zahl. */
export function rundeMassCm(wert: number): number {
  return Math.round(wert * 10) / 10;
}
