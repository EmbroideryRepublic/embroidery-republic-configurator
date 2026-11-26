/**
 * Lupe für die Konfigurator-Vorschau – reine Rechenlogik.
 *
 * Bewusst OHNE React, Konva und DOM: Alles hier ist eine Funktion von Zahlen und lässt sich mit `tsx --test` prüfen
 * (siehe __tests__/lupe.test.ts). Die Komponente `VorschauLupe.tsx` liest nur Rechtecke und Zeigerpositionen aus dem Browser,
 * rechnet hier und schreibt das Ergebnis zurück.
 *
 * Begriffe:
 *  - Vorschau   die Konva-Leinwand (Stage) im Konfigurator, in CSS-Pixeln.
 *  - Hülle      der äußere Rahmen um Vorschau + Lineale; darin wird die Linse positioniert.
 *  - Linse      der runde Ausschnitt, der unter dem Zeiger liegt und vergrößert zeigt, was darunter ist.
 *  - Zwischenspeicher  ein einmal in hoher Auflösung gezeichnetes Bild der Vorschau (nur Foto + Motive, ohne
 *                       Bedienelemente). Die Linse zeichnet ihren Ausschnitt aus diesem Bild, nicht aus der 1×-Darstellung.
 *
 * Die Lupe ist reine Anzeige. Nichts hiervon fließt in Bestellung, Produktionsdateien oder Preis.
 */
import type { ConfigElement, PrintView } from '@/types';

export interface Punkt {
  x: number;
  y: number;
}

export interface Rechteck {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Vergrößerung ───────────────────────────────────────────────────────

/** Wählbare Stufen der Vergrößerung (Auftrag: zwischen 2× und 4×). */
export const LUPE_STAERKEN = [2, 2.5, 3, 4] as const;
export const LUPE_MIN_STAERKE = 2;
export const LUPE_MAX_STAERKE = 4;
/** Startwert: wie auf dem Vorbildfoto etwa 2,5-fach. */
export const LUPE_STANDARD_STAERKE = 2.5;

/** Hält eine beliebige Zahl im erlaubten Bereich; Unsinn (NaN) fällt auf den Standard zurück. */
export function begrenzeStaerke(wert: number): number {
  if (!Number.isFinite(wert)) return LUPE_STANDARD_STAERKE;
  return Math.min(LUPE_MAX_STAERKE, Math.max(LUPE_MIN_STAERKE, wert));
}

/**
 * Nächste Stufe in Richtung +1 (stärker) oder −1 (schwächer). An den Enden bleibt es stehen.
 * Liegt der aktuelle Wert zwischen zwei Stufen, springt es zur nächsten Stufe in der gewünschten Richtung.
 */
export function naechsteStaerke(aktuell: number, richtung: 1 | -1): number {
  const wert = begrenzeStaerke(aktuell);
  if (richtung === 1) {
    return LUPE_STAERKEN.find((s) => s > wert + 1e-9) ?? LUPE_MAX_STAERKE;
  }
  const kleinere = LUPE_STAERKEN.filter((s) => s < wert - 1e-9);
  return kleinere.length > 0 ? kleinere[kleinere.length - 1]! : LUPE_MIN_STAERKE;
}

/** „2,5×“ (de) bzw. „2.5×“ (en); ganze Zahlen ohne Nachkommastelle. */
export function staerkeText(wert: number, sprache: 'de' | 'en' = 'de'): string {
  const zahl = Number.isInteger(wert) ? String(wert) : String(wert).replace('.', sprache === 'de' ? ',' : '.');
  return `${zahl}×`;
}

// ── Linsengröße und -lage ──────────────────────────────────────────────

export const LINSE_DURCHMESSER_GROSS_PX = 200;
export const LINSE_DURCHMESSER_KLEIN_PX = 150;
/** Unterhalb dieser Fensterbreite gilt die kleine Linse (Handy). */
export const LINSE_KLEIN_BIS_FENSTERBREITE_PX = 640;
/** Weißer Rand der Linse (Auftrag: etwa 4–6 px). Gehört zum Außendurchmesser. */
export const LINSE_RAND_PX = 5;
/** Abstand zwischen Fingerspitze und Linsenrand, damit der Finger die Linse nicht verdeckt. */
export const FINGER_ABSTAND_PX = 24;

/** Außendurchmesser der Linse: ca. 200 px, auf kleinen Bildschirmen ca. 150 px. */
export function linsenDurchmesser(fensterBreite: number): number {
  return fensterBreite < LINSE_KLEIN_BIS_FENSTERBREITE_PX ? LINSE_DURCHMESSER_KLEIN_PX : LINSE_DURCHMESSER_GROSS_PX;
}

/** Durchmesser der Fläche INNERHALB des weißen Rands – darauf bezieht sich die Vergrößerung. */
export function linsenInnenDurchmesser(aussen: number): number {
  return Math.max(1, aussen - 2 * LINSE_RAND_PX);
}

/** Schnittmenge zweier Rechtecke; `null`, wenn sie sich nicht überlappen. */
export function schnittmenge(a: Rechteck, b: Rechteck): Rechteck | null {
  const links = Math.max(a.x, b.x);
  const oben = Math.max(a.y, b.y);
  const rechts = Math.min(a.x + a.width, b.x + b.width);
  const unten = Math.min(a.y + a.height, b.y + b.height);
  if (rechts <= links || unten <= oben) return null;
  return { x: links, y: oben, width: rechts - links, height: unten - oben };
}

/** Klemmt den Punkt in das Rechteck (für Zeiger, die knapp außerhalb der Vorschau liegen). */
export function klemmePunkt(punkt: Punkt, bereich: Rechteck): Punkt {
  return {
    x: Math.min(bereich.x + bereich.width, Math.max(bereich.x, punkt.x)),
    y: Math.min(bereich.y + bereich.height, Math.max(bereich.y, punkt.y)),
  };
}

/**
 * Hält die GANZE Linse im Bereich. Ist der Bereich schmaler/niedriger als die Linse selbst (kleines Handy-Fenster),
 * wird sie in dieser Richtung mittig gesetzt – statt hin und her zu springen.
 */
export function klemmeLinsenmitte(mitte: Punkt, bereich: Rechteck, radius: number): Punkt {
  const achse = (wert: number, start: number, laenge: number) => {
    if (laenge <= 2 * radius) return start + laenge / 2;
    return Math.min(start + laenge - radius, Math.max(start + radius, wert));
  };
  return { x: achse(mitte.x, bereich.x, bereich.width), y: achse(mitte.y, bereich.y, bereich.height) };
}

export type ZeigerArt = 'maus' | 'finger';

/**
 * Wo steht die Linse, und welcher Punkt der Vorschau wird in ihrer Mitte gezeigt?
 *
 * - Maus/Pfeiltasten: echte Lupe. Die Linse sitzt auf dem Zeiger und zeigt, was unter ihr liegt. Am Rand wird das
 *   Linsenfenster in den Bereich geschoben; gezeigt wird dann der Punkt unter der verschobenen Linsenmitte.
 * - Finger: Die Linse sitzt OBERHALB der Fingerspitze (Radius + Abstand), gezeigt wird die Stelle unter dem Finger –
 *   sonst verdeckt der Finger genau das, was man prüfen will. Passt sie oben nicht in den Bereich, kommt sie darunter.
 *
 * Alle Punkte liegen im Koordinatensystem der Hülle (CSS-Pixel, obere linke Ecke = Ursprung).
 */
export function linsenGeometrie(eingabe: {
  zeiger: Punkt;
  art: ZeigerArt;
  /** Lage der Vorschau (Konva-Leinwand) in der Hülle. */
  bild: Rechteck;
  /** Bereich, in dem die gesamte Linse liegen darf. */
  bereich: Rechteck;
  radius: number;
  fingerAbstand?: number;
}): { fensterMitte: Punkt; ziel: Punkt } {
  const { zeiger, art, bild, bereich, radius } = eingabe;
  if (art === 'maus') {
    const fensterMitte = klemmeLinsenmitte(zeiger, bereich, radius);
    return { fensterMitte, ziel: fensterMitte };
  }
  const ziel = klemmePunkt(zeiger, bild);
  const versatz = radius + (eingabe.fingerAbstand ?? FINGER_ABSTAND_PX);
  const oben: Punkt = { x: ziel.x, y: ziel.y - versatz };
  const passtOben = oben.y - radius >= bereich.y;
  const unten: Punkt = { x: ziel.x, y: ziel.y + versatz };
  const passtUnten = unten.y + radius <= bereich.y + bereich.height;
  const gewaehlt = passtOben || !passtUnten ? oben : unten;
  return { fensterMitte: klemmeLinsenmitte(gewaehlt, bereich, radius), ziel };
}

/** Zeigerposition als Anteil (0…1) an der Vorschau; außerhalb wird auf den Rand geklemmt. */
export function zeigerAnteil(zeiger: Punkt, bild: Rechteck): Punkt {
  if (bild.width <= 0 || bild.height <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: Math.min(1, Math.max(0, (zeiger.x - bild.x) / bild.width)),
    y: Math.min(1, Math.max(0, (zeiger.y - bild.y) / bild.height)),
  };
}

// ── Ausschnitt aus dem Zwischenspeicher ────────────────────────────────

export interface Ausschnitt {
  /** Quelle im Zwischenspeicher (Bildpunkte). */
  quelle: Rechteck;
  /** Ziel im Linsen-Canvas (Bildpunkte des Canvas). */
  ziel: Rechteck;
}

/**
 * Welcher Teil des Zwischenspeichers kommt wohin im Linsen-Canvas?
 *
 * Der Ausschnitt ist so groß wie die Linseninnenfläche geteilt durch die Stärke (bei 2,5× und 190 px Innendurchmesser
 * also 76 CSS-Pixel der Vorschau). Ragt er über den Rand der Vorschau hinaus, wird er beschnitten UND das Ziel im
 * gleichen Verhältnis verkleinert/verschoben – der Rest der Linse bleibt dann leer (die Komponente füllt ihn mit
 * Hintergrund), statt dass das Bild gestreckt oder verschoben wird. Liegt gar nichts im Bild: `null`.
 */
export function berechneAusschnitt(eingabe: {
  /** Mitte des Ausschnitts in CSS-Pixeln, bezogen auf die obere linke Ecke der Vorschau. */
  ziel: Punkt;
  /** Größe der Vorschau in CSS-Pixeln. */
  vorschau: { width: number; height: number };
  /** Größe des Zwischenspeichers in Bildpunkten. */
  zwischenspeicher: { width: number; height: number };
  /** Innendurchmesser der Linse in CSS-Pixeln. */
  linseCss: number;
  /** Kantenlänge des Linsen-Canvas in Bildpunkten (CSS × Geräte-Pixelverhältnis). */
  linsePixel: number;
  staerke: number;
}): Ausschnitt | null {
  const { ziel, vorschau, zwischenspeicher, linseCss, linsePixel } = eingabe;
  if (vorschau.width <= 0 || vorschau.height <= 0 || zwischenspeicher.width <= 0 || zwischenspeicher.height <= 0) return null;
  const staerke = begrenzeStaerke(eingabe.staerke);
  const fx = zwischenspeicher.width / vorschau.width;
  const fy = zwischenspeicher.height / vorschau.height;
  const seiteCss = linseCss / staerke;
  const sw = seiteCss * fx;
  const sh = seiteCss * fy;
  const x0 = ziel.x * fx - sw / 2;
  const y0 = ziel.y * fy - sh / 2;

  const links = Math.max(0, x0);
  const oben = Math.max(0, y0);
  const rechts = Math.min(zwischenspeicher.width, x0 + sw);
  const unten = Math.min(zwischenspeicher.height, y0 + sh);
  if (rechts <= links || unten <= oben) return null;

  return {
    quelle: { x: links, y: oben, width: rechts - links, height: unten - oben },
    ziel: {
      x: ((links - x0) / sw) * linsePixel,
      y: ((oben - y0) / sh) * linsePixel,
      width: ((rechts - links) / sw) * linsePixel,
      height: ((unten - oben) / sh) * linsePixel,
    },
  };
}

// ── Zwischenspeicher: Auflösung und Aktualisierung ─────────────────────

/** Wunschfaktor des Zwischenspeichers, bezogen auf die logische Leinwand (Auftrag: pixelRatio 3). */
export const SCHNAPPSCHUSS_FAKTOR = 3;
/** Obergrenzen, damit auch Handys (iOS: höchstens ca. 16,7 Mio. Bildpunkte je Canvas) den Zwischenspeicher bekommen. */
export const SCHNAPPSCHUSS_MAX_KANTE_PX = 4096;
export const SCHNAPPSCHUSS_MAX_FLAECHE_PX = 12_000_000;
/** Auftrag: Aktualisierung mit kurzer Verzögerung, ca. 150–250 ms. */
export const SCHNAPPSCHUSS_ENTPRELLUNG_MS = 200;
export const SCHNAPPSCHUSS_NEUVERSUCH_MS = 200;
export const SCHNAPPSCHUSS_MAX_NEUVERSUCHE = 15;

/**
 * Welches `pixelRatio` bekommt `stage.toCanvas`?
 *
 * Konva multipliziert `pixelRatio` mit der AKTUELLEN Stage-Größe. Die ist je nach Bildschirm und Zoom-Stufe sehr
 * unterschiedlich (auf dem Handy etwa 0,3 der logischen Leinwand, bei 250 % Zoom das 2,5-Fache). Würde man pauschal 3
 * nehmen, wäre der Zwischenspeicher auf dem Handy schwammig (0,9-fach) und bei hohem Zoom riesig. Deshalb wird der
 * Faktor auf die LOGISCHE Leinwand bezogen: Der Zwischenspeicher ist immer rund (logische Größe × Faktor) groß.
 */
export function berechneSchnappschussPixelRatio(eingabe: {
  /** Aktueller Skalierfaktor der Stage (scale × zoom): CSS-Breite der Stage / logische Breite. */
  stageScale: number;
  logischeBreite: number;
  logischeHoehe: number;
  wunschFaktor?: number;
  maxKante?: number;
  maxFlaeche?: number;
}): { pixelRatio: number; faktor: number; breite: number; hoehe: number } {
  const { logischeBreite, logischeHoehe } = eingabe;
  const stageScale = eingabe.stageScale > 0 && Number.isFinite(eingabe.stageScale) ? eingabe.stageScale : 1;
  const wunsch = eingabe.wunschFaktor ?? SCHNAPPSCHUSS_FAKTOR;
  const maxKante = eingabe.maxKante ?? SCHNAPPSCHUSS_MAX_KANTE_PX;
  const maxFlaeche = eingabe.maxFlaeche ?? SCHNAPPSCHUSS_MAX_FLAECHE_PX;
  const grenzeKante = maxKante / Math.max(logischeBreite, logischeHoehe);
  const grenzeFlaeche = Math.sqrt(maxFlaeche / (logischeBreite * logischeHoehe));
  const faktor = Math.max(1, Math.min(wunsch, grenzeKante, grenzeFlaeche));
  return {
    pixelRatio: faktor / stageScale,
    faktor,
    breite: Math.round(logischeBreite * faktor),
    hoehe: Math.round(logischeHoehe * faktor),
  };
}

export interface Entprellt {
  /** Plant den Lauf in `ms`; ein weiterer Aufruf davor schiebt ihn nach hinten. */
  aufrufen(): void;
  /** Läuft sofort und verwirft einen geplanten Lauf. */
  sofort(): void;
  /** Verwirft einen geplanten Lauf. */
  abbrechen(): void;
  ausstehend(): boolean;
}

/**
 * Entprellung: Viele Aufrufe kurz hintereinander (Tippen, Ziehen, Farbwechsel) lösen nur EINEN Lauf aus,
 * `ms` nach dem letzten Aufruf. Der Zwischenspeicher wird so nicht bei jeder Änderung neu gezeichnet.
 * Die Zeitgeber werden erst beim Aufruf gelesen (testbar mit gefälschten Zeitgebern).
 */
export function entprelle(fn: () => void, ms: number): Entprellt {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const abbrechen = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    aufrufen() {
      abbrechen();
      timer = setTimeout(() => {
        timer = null;
        fn();
      }, ms);
    },
    sofort() {
      abbrechen();
      fn();
    },
    abbrechen,
    ausstehend: () => timer !== null,
  };
}

// ── Welche Änderungen machen den Zwischenspeicher ungültig? ────────────

/** Lange Adressen (data:-URLs eines Logos können mehrere MB lang sein) kürzen, damit der Schlüssel klein bleibt. */
function kurz(url: string): string {
  return url.length <= 160 ? url : `${url.length}:${url.slice(0, 64)}…${url.slice(-64)}`;
}

/**
 * Schlüssel für „sieht der Zwischenspeicher noch richtig aus?“. Enthält NUR, was im Bild sichtbar ist: Ansicht,
 * Produktfoto, Textilart (hell/dunkel) und je Motiv Lage, Größe, Drehung und Inhalt.
 * Bewusst NICHT enthalten: Auswahl, Rand-Warnung (`isOutOfBounds`), Preis, Stichzahl, Name – die ändern nichts am Bild,
 * und ohne diese Trennung würde jedes Anklicken eines Motivs eine neue Aufnahme auslösen.
 */
export function schnappschussSchluessel(eingabe: {
  ansicht: PrintView;
  produktBildUrl: string;
  produktBildGeladen: boolean;
  textilHell: boolean;
  elemente: readonly ConfigElement[];
}): string {
  const motive = eingabe.elemente
    .filter((el) => el.view === eingabe.ansicht && !el.hidden)
    .map((el) => {
      const gemeinsam = [el.id, el.xCm, el.yCm, el.widthCm, el.heightCm, el.rotationDeg, el.locked ? 1 : 0];
      if (el.type === 'logo') return [...gemeinsam, 'logo', kurz(el.fileUrl)];
      return [
        ...gemeinsam,
        'text',
        el.content,
        el.fontFamily,
        el.fontSizePx,
        el.color,
        el.bold ? 1 : 0,
        el.italic ? 1 : 0,
        el.align,
        el.letterSpacing,
        el.lineHeight,
        el.hasShadow ? 1 : 0,
        el.hasOutline ? 1 : 0,
        el.outlineColor,
      ];
    });
  return JSON.stringify([eingabe.ansicht, kurz(eingabe.produktBildUrl), eingabe.produktBildGeladen, eingabe.textilHell, motive]);
}

// ── Motive in der Ansicht ──────────────────────────────────────────────

/** Gibt es in dieser Ansicht mindestens ein sichtbares Motiv (Logo, Bild oder Text)? Ohne Motiv gibt es nichts zu prüfen. */
export function hatSichtbaresMotiv(elemente: readonly ConfigElement[], ansicht: PrintView): boolean {
  return elemente.some((el) => el.view === ansicht && !el.hidden);
}

/** Auf welchem Motiv startet die Lupe beim Einschalten? Das ausgewählte, sonst das erste sichtbare der Ansicht. */
export function waehleStartMotiv(
  elemente: readonly ConfigElement[],
  ansicht: PrintView,
  ausgewaehltId: string | null
): ConfigElement | null {
  const sichtbar = elemente.filter((el) => el.view === ansicht && !el.hidden);
  return sichtbar.find((el) => el.id === ausgewaehltId) ?? sichtbar[0] ?? null;
}

// ── Tastatur ───────────────────────────────────────────────────────────

export const TASTEN_SCHRITT_PX = 16;
export const TASTEN_SCHRITT_GROSS_PX = 64;

/** Pfeiltaste → Verschiebung der Linse in CSS-Pixeln (mit Umschalttaste größer); andere Tasten: `null`. */
export function tastenSchritt(taste: string, umschalt: boolean): Punkt | null {
  const schritt = umschalt ? TASTEN_SCHRITT_GROSS_PX : TASTEN_SCHRITT_PX;
  switch (taste) {
    case 'ArrowLeft':
      return { x: -schritt, y: 0 };
    case 'ArrowRight':
      return { x: schritt, y: 0 };
    case 'ArrowUp':
      return { x: 0, y: -schritt };
    case 'ArrowDown':
      return { x: 0, y: schritt };
    default:
      return null;
  }
}

/** „+“/„=“ → stärker, „−“/„-“ → schwächer, sonst `null`. */
export function tastenStaerkeRichtung(taste: string): 1 | -1 | null {
  if (taste === '+' || taste === '=') return 1;
  if (taste === '-' || taste === '−' || taste === '_') return -1;
  return null;
}
