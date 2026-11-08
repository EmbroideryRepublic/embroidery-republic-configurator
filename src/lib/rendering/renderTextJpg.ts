import { Resvg } from '@resvg/resvg-js';
import { encode } from 'jpeg-js';
import { ladeAnsichtGrundlage } from './ansichtGrundlage';
import { resvgSchriftOptionen } from './fonts';
import { buildTextOnlySvg, zerlegeInZeilen, type Ausschnitt } from './svgScene';
import type { RenderableTextElement, RenderPrintViewInput } from './types';

/**
 * Ein Text-Element einer Bestellung als Bilddatei – für den Download im
 * Adminbereich: als JPG (renderTextAlsJpg) und als PNG mit transparentem
 * Hintergrund (renderTextAlsPng, die Datei für die DTF-Bestellung).
 *
 * ── Was die Datei zeigt ────────────────────────────────────────────────
 * NUR den Text, wie er im Editor gestaltet wurde (Schrift, Größe, Farbe,
 * fett/kursiv, Ausrichtung, Zeilenumbrüche, Buchstabenabstand, Kontur,
 * Schatten), unverdreht und eng zugeschnitten mit einem kleinen Rand. Die
 * Drehung, die der Kunde im Editor gewählt hat, steht in den Bestelldaten
 * (Position/Maße) und gehört beim Auflegen auf das Textil, nicht in die Datei.
 *
 * ── Größe ──────────────────────────────────────────────────────────────
 * Die Datei hat die Größe, in der der Text gedruckt wird: gleicher Maßstab
 * (Pixel je cm) wie die Produktionsvorschau (ansichtGrundlage.ts) und 300 dpi.
 * Das eingebettete JFIF-dpi-Feld stimmt damit – Grafikprogramme öffnen die
 * Datei in der echten Druckgröße.
 *
 * ── Hintergrund ────────────────────────────────────────────────────────
 * JPG kennt keine Transparenz. Weiß ist der Normalfall; ist die Schrift so
 * hell, dass sie auf Weiß verschwände (z. B. weiße Schrift ohne Kontur),
 * kommt ein dunkler Grund darunter, sonst wäre die Datei scheinbar leer.
 * Beim DTF-Druck würde dieser Grund mitgedruckt – dafür gibt es das PNG: gleicher
 * Ausschnitt und gleiche Größe, aber ohne Hintergrund, mit der Auflösung im
 * pHYs-Block.
 *
 * ── Schrift ────────────────────────────────────────────────────────────
 * Wie in der Produktionsvorschau: gebündelte freie Ersatzschriften (Impact →
 * Anton usw., siehe fonts.ts). Fehlt der Ersatzschrift ein Kursiv-Schnitt,
 * wird er nachgebildet (svgScene.ts). Kein Ersatz für die Original-Schrift in
 * der Druckvorstufe – die Datei zeigt, wie der Text aussehen soll.
 */

/** Auflösung der Datei in Punkten je Zoll – übliche Vorgabe für Druckdaten. */
export const TEXT_JPG_DPI = 300;
const JPEG_QUALITAET = 95;
/** Rand um den sichtbaren Text, in cm (bei 300 dpi rund 30 Pixel). */
const RAND_CM = 0.25;
/** Obergrenzen, damit ein riesiger Text den Server nicht in die Knie zwingt.
 *  Wird eine überschritten, sinkt die Auflösung (und wird entsprechend
 *  eingetragen) statt abzubrechen. */
const MAX_KANTE_PX = 12_000;
const MAX_PIXEL = 60_000_000;
/** Nennmaß der Fläche, in der der Text liegt, in logischen Editor-Pixeln. Die
 *  Fläche bestimmt nur, wo links/rechts ausgerichteter Text ansetzt; sie wird
 *  nie gerastert (nur der zugeschnittene Ausschnitt). Sie wächst mit dem
 *  Maßstab mit – dadurch ist die ganze Szene bei jedem Maßstab dieselbe,
 *  nur gestreckt, und Koordinaten lassen sich einfach umrechnen. */
const NENN_LOGISCH_PX = 1_000;
/** Ab diesem Kontrastverhältnis zu Weiß gilt eine Farbe auf weißem Grund
 *  als gut sichtbar. */
const MIN_KONTRAST_AUF_WEISS = 1.6;
/** Pixel mit weniger Deckkraft zählen nicht zur Schrift (Auslaufen des
 *  Schattens), sonst würde der Zuschnitt unnötig weit. */
const MIN_ALPHA = 8;
/** Maßstab der Suchrasterung gegenüber der Datei (siehe renderTextAlsJpg). */
const PROBE_FAKTOR = 0.25;
const KEIN_TEXT = 'Der Text enthält nichts Sichtbares (leer oder nur Leerzeichen).';

/** Die beiden möglichen Hintergründe als CSS-Farbe. */
const HINTERGRUND = { weiss: '#ffffff', dunkel: '#333333' } as const;

export type TextJpgHintergrund = keyof typeof HINTERGRUND;

export interface TextJpgEingabe {
  productId: string;
  colorId: string;
  view: RenderPrintViewInput['view'];
  printMethod: RenderPrintViewInput['printMethod'];
  sizeQuantities: Record<string, number>;
  element: RenderableTextElement;
  /** Zielauflösung; Standard TEXT_JPG_DPI. */
  dpi?: number;
  /** Obergrenzen für Kantenlänge und Pixelzahl; Standard MAX_KANTE_PX / MAX_PIXEL.
   *  Nur für Tests, damit sich das Absenken der Auflösung billig prüfen lässt. */
  grenzen?: { maxKantePx: number; maxPixel: number };
}

export interface TextJpgDatei {
  ok: true;
  jpg: Buffer;
  breitePx: number;
  hoehePx: number;
  /** Tatsächlich eingebettete Auflösung (niedriger als gewünscht nur bei
   *  extrem großen Texten, siehe MAX_KANTE_PX). */
  dpi: number;
  /** Größe der Datei in Druckgröße. */
  breiteCm: number;
  hoeheCm: number;
  hintergrund: TextJpgHintergrund;
  zeilen: number;
}

export type TextJpgErgebnis = TextJpgDatei | { ok: false; grund: string };

function clamp(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

/** "#rgb" / "#rrggbb" → [r,g,b]; andere Schreibweisen → null. */
function hexZuRgb(farbe: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(farbe.trim());
  if (!m) return null;
  const hex = m[1]!.length === 3 ? m[1]!.split('').map((z) => z + z).join('') : m[1]!;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

/** Relative Leuchtdichte nach WCAG (0 = schwarz, 1 = weiß). */
function leuchtdichte([r, g, b]: [number, number, number]): number {
  const linear = (k: number) => {
    const s = k / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Kontrastverhältnis einer Farbe zu Weiß (1 = unsichtbar, 21 = schwarz). */
function kontrastZuWeiss(rgb: [number, number, number]): number {
  return 1.05 / (leuchtdichte(rgb) + 0.05);
}

/**
 * Weißer Grund, außer die Schrift wäre darauf kaum zu sehen: helle Füllung
 * UND keine gut sichtbare Kontur. Unbekannte Farbschreibweisen gelten als gut
 * sichtbar – lieber Weiß als ein überraschend dunkles Bild.
 */
export function waehleHintergrund(element: Pick<RenderableTextElement, 'color' | 'hasOutline' | 'outlineColor'>): TextJpgHintergrund {
  const fuellung = hexZuRgb(element.color);
  const fuellungZuHell = fuellung !== null && kontrastZuWeiss(fuellung) < MIN_KONTRAST_AUF_WEISS;
  if (!fuellungZuHell) return 'weiss';
  const kontur = element.hasOutline ? hexZuRgb(element.outlineColor) : null;
  const konturSichtbar = kontur !== null && kontrastZuWeiss(kontur) >= MIN_KONTRAST_AUF_WEISS;
  return konturSichtbar ? 'weiss' : 'dunkel';
}

/** Schreibt die Auflösung in den JFIF-Kopf (Einheit: Punkte je Zoll). jpeg-js
 *  trägt dort sonst "1 × 1, keine Einheit" ein. */
function setzeDichte(jpg: Buffer, dpi: number): Buffer {
  const istJfif = jpg.length > 18 && jpg[0] === 0xff && jpg[1] === 0xd8 && jpg[2] === 0xff && jpg[3] === 0xe0 && jpg.toString('latin1', 6, 10) === 'JFIF';
  if (istJfif) {
    const wert = clamp(Math.round(dpi), 1, 65_535);
    jpg[13] = 1;
    jpg.writeUInt16BE(wert, 14);
    jpg.writeUInt16BE(wert, 16);
  }
  return jpg;
}

const CRC_TABELLE = (() => {
  const tabelle = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabelle[n] = c >>> 0;
  }
  return tabelle;
})();

/** CRC-32 wie in PNG-Blöcken (eigene Zeilen, weil zlib.crc32 erst ab neueren Node-Versionen existiert). */
function crc32(daten: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of daten) c = CRC_TABELLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Trägt die Auflösung als pHYs-Block in ein PNG ein (Punkte je Meter), direkt
 * hinter dem Kopfblock IHDR. Ohne ihn gilt in Grafikprogrammen meist 72 dpi –
 * die 21 cm breite Textdatei würde dort als 88 cm geöffnet.
 */
function setzePngDichte(png: Buffer, dpi: number): Buffer {
  const signatur = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const istPng = png.length > 33 && signatur.every((b, i) => png[i] === b) && png.toString('latin1', 12, 16) === 'IHDR';
  if (!istPng) return png;

  // Schon vorhanden? Dann nichts doppelt eintragen.
  for (let pos = 8; pos + 8 <= png.length; ) {
    const laenge = png.readUInt32BE(pos);
    if (png.toString('latin1', pos + 4, pos + 8) === 'pHYs') return png;
    pos += 12 + laenge;
  }

  const punkteJeMeter = Math.round(clamp(dpi, 1, 65_535) / 0.0254);
  const typUndDaten = Buffer.alloc(13);
  typUndDaten.write('pHYs', 0, 'latin1');
  typUndDaten.writeUInt32BE(punkteJeMeter, 4);
  typUndDaten.writeUInt32BE(punkteJeMeter, 8);
  typUndDaten[12] = 1; // Einheit: Meter
  const block = Buffer.alloc(21);
  block.writeUInt32BE(9, 0);
  typUndDaten.copy(block, 4);
  block.writeUInt32BE(crc32(typUndDaten), 17);

  const hinterIhdr = 8 + 25;
  return Buffer.concat([png.subarray(0, hinterIhdr), block, png.subarray(hinterIhdr)]);
}

/** Äußere Grenzen des sichtbaren Textes in der Szene, ohne Rand. */
function messeText(element: RenderableTextElement, massstab: number): Ausschnitt | null {
  const nenn = NENN_LOGISCH_PX * massstab;
  const svg = buildTextOnlySvg({ widthPx: nenn, heightPx: nenn, renderScale: massstab, element });
  const box = new Resvg(svg, { font: resvgSchriftOptionen() }).getBBox();
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

/** Rastert den Ausschnitt; `hintergrund` leer = transparent. */
function rastere(element: RenderableTextElement, massstab: number, ausschnitt: Ausschnitt, hintergrund?: string) {
  const nenn = NENN_LOGISCH_PX * massstab;
  const svg = buildTextOnlySvg({
    widthPx: nenn,
    heightPx: nenn,
    renderScale: massstab,
    element,
    ausschnitt,
    hintergrund,
  });
  return new Resvg(svg, { font: resvgSchriftOptionen() }).render();
}

/** Kleinstes Rechteck um alle ausreichend deckenden Pixel; null = nichts sichtbar. */
function findeTinte(pixel: Buffer, breite: number, hoehe: number) {
  let minX = breite;
  let minY = hoehe;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < hoehe; y++) {
    const zeile = y * breite * 4;
    for (let x = 0; x < breite; x++) {
      if ((pixel[zeile + x * 4 + 3] ?? 0) >= MIN_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/** Alles, was JPG und PNG gemeinsam brauchen: Maßstab, Auflösung und der genaue Bildausschnitt. */
interface Vorbereitet {
  ok: true;
  element: RenderableTextElement;
  massstab: number;
  dpi: number;
  pxProCm: number;
  ausschnitt: Ausschnitt;
}

/** Misst den Text, bestimmt Maßstab/Auflösung und den eng zugeschnittenen Ausschnitt (siehe Kopfkommentar). */
async function berechneAusschnitt(eingabe: TextJpgEingabe): Promise<Vorbereitet | { ok: false; grund: string }> {
  const element = eingabe.element;
  const grundlage = await ladeAnsichtGrundlage(eingabe);
  if (!grundlage) {
    return {
      ok: false,
      grund: 'Für diese Ansicht sind kein Produktbild oder keine Druckfläche hinterlegt – die Druckgröße des Textes lässt sich nicht bestimmen.',
    };
  }

  const wunschDpi = clamp(eingabe.dpi ?? TEXT_JPG_DPI, 72, 600);
  // Bildpunkte je logischem Editor-Pixel: in diesem Maß sind fontSizePx und
  // letterSpacing gespeichert. Dasselbe Maß ergibt die Produktionsvorschau.
  const massstabFuerDpi = (dpi: number) => dpi / 2.54 / grundlage.pxPerCmLogisch;

  let dpi = wunschDpi;
  let massstab = massstabFuerDpi(dpi);
  const box = messeText(element, massstab);
  if (!box) return { ok: false, grund: KEIN_TEXT };

  // Riesiger Text: Auflösung senken, bis er unter die Grenzen passt. Die
  // Ausdehnung wächst linear mit dem Maßstab (Rand und Schatten kommen
  // später dazu, dafür bleibt Luft unter den Grenzen).
  const maxKante = eingabe.grenzen?.maxKantePx ?? MAX_KANTE_PX;
  const maxPixel = eingabe.grenzen?.maxPixel ?? MAX_PIXEL;
  const faktor = Math.min(1, maxKante / Math.max(box.width, box.height), Math.sqrt(maxPixel / (box.width * box.height)));
  if (faktor < 1) {
    dpi = Math.max(1, wunschDpi * faktor * 0.9);
    massstab = massstabFuerDpi(dpi);
  }

  const pxProCm = dpi / 2.54;
  const randPx = Math.max(2, Math.round(RAND_CM * pxProCm));

  // Erste Rasterung: nur um zu sehen, wo wirklich Farbe liegt (die Messung
  // kennt weder Schatten noch Kontur genau) – deshalb transparent und in
  // kleinem Maßstab: ein Schatten wird beim Rastern verwischt, das kostet in
  // voller Größe Sekunden. Das Ergebnis wird auf den vollen Maßstab
  // zurückgerechnet; die ungenaue Kante (höchstens ein Probe-Pixel) liegt
  // weit innerhalb des Randes.
  const probeMassstab = massstab * PROBE_FAKTOR;
  const probeSchriftPx = element.fontSizePx * probeMassstab;
  let spielraum = Math.ceil((element.hasShadow ? 8 * probeMassstab : 0) + (element.hasOutline ? probeMassstab : 0) + 0.3 * probeSchriftPx + 8);
  let tinte: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
  let probe: Ausschnitt | null = null;
  for (let versuch = 0; versuch < 4 && !tinte; versuch++) {
    const probeBox = messeText(element, probeMassstab);
    if (!probeBox) return { ok: false, grund: KEIN_TEXT };
    const region: Ausschnitt = {
      x: Math.floor(probeBox.x - spielraum),
      y: Math.floor(probeBox.y - spielraum),
      width: Math.ceil(probeBox.width + 2 * spielraum) + 1,
      height: Math.ceil(probeBox.height + 2 * spielraum) + 1,
    };
    const bild = rastere(element, probeMassstab, region);
    const gefunden = findeTinte(bild.pixels, bild.width, bild.height);
    if (!gefunden) return { ok: false, grund: KEIN_TEXT };
    const beruehrtRand = gefunden.minX <= 0 || gefunden.minY <= 0 || gefunden.maxX >= bild.width - 1 || gefunden.maxY >= bild.height - 1;
    if (!beruehrtRand) {
      tinte = gefunden;
      probe = region;
    } else {
      spielraum *= 2;
    }
  }
  if (!tinte || !probe) return { ok: false, grund: 'Der Textrand ließ sich nicht sicher bestimmen.' };

  // Probe-Koordinaten → voller Maßstab: die ganze Szene ist bei jedem Maßstab
  // dieselbe, nur gestreckt (siehe NENN_LOGISCH_PX). Ein Probe-Pixel
  // Unschärfe an jeder Kante deckt der Rand ab.
  const voll = (probeWert: number) => probeWert / PROBE_FAKTOR;
  const unschaerfe = 1 / PROBE_FAKTOR;
  const links = voll(probe.x + tinte.minX) - unschaerfe;
  const oben = voll(probe.y + tinte.minY) - unschaerfe;
  const rechts = voll(probe.x + tinte.maxX + 1) + unschaerfe;
  const unten = voll(probe.y + tinte.maxY + 1) + unschaerfe;
  const ausschnitt: Ausschnitt = {
    x: Math.floor(links - randPx),
    y: Math.floor(oben - randPx),
    width: Math.ceil(rechts - links + 2 * randPx) + 1,
    height: Math.ceil(unten - oben + 2 * randPx) + 1,
  };

  return { ok: true, element, massstab, dpi, pxProCm, ausschnitt };
}

/** Der Text als JPG – deckender Hintergrund (weiß, bei sehr heller Schrift dunkel). */
export async function renderTextAlsJpg(eingabe: TextJpgEingabe): Promise<TextJpgErgebnis> {
  const v = await berechneAusschnitt(eingabe);
  if (!v.ok) return v;

  // Zweite Rasterung: genau dieser Ausschnitt auf deckendem Grund.
  const hintergrund = waehleHintergrund(v.element);
  const bild = rastere(v.element, v.massstab, v.ausschnitt, HINTERGRUND[hintergrund]);
  const kodiert = encode({ data: bild.pixels, width: bild.width, height: bild.height }, JPEG_QUALITAET);
  const jpg = setzeDichte(Buffer.from(kodiert.data), v.dpi);

  return {
    ok: true,
    jpg,
    breitePx: bild.width,
    hoehePx: bild.height,
    dpi: v.dpi,
    breiteCm: bild.width / v.pxProCm,
    hoeheCm: bild.height / v.pxProCm,
    hintergrund,
    zeilen: zerlegeInZeilen(v.element.content).length,
  };
}

export interface TextPngDatei {
  ok: true;
  png: Buffer;
  breitePx: number;
  hoehePx: number;
  dpi: number;
  breiteCm: number;
  hoeheCm: number;
  zeilen: number;
}

export type TextPngErgebnis = TextPngDatei | { ok: false; grund: string };

/**
 * Der Text als PNG mit TRANSPARENTEM Hintergrund – die Datei für den DTF-Druck.
 *
 * Ein JPG hat immer einen Hintergrund; beim DTF-Transfer würde er mitgedruckt
 * (Weiß wird als weiße Farbe gedruckt, ein dunkler Grund als Fläche). Für die
 * Druckbestellung gehört das PNG, in dem nur die Schrift Farbe trägt. Gleicher
 * Ausschnitt, gleiche Größe und Auflösung wie das JPG; die Auflösung steht im
 * PNG (pHYs), damit Grafikprogramme und Druckdienste die echte Größe lesen.
 */
export async function renderTextAlsPng(eingabe: TextJpgEingabe): Promise<TextPngErgebnis> {
  const v = await berechneAusschnitt(eingabe);
  if (!v.ok) return v;

  const bild = rastere(v.element, v.massstab, v.ausschnitt);
  const png = setzePngDichte(Buffer.from(bild.asPng()), v.dpi);

  return {
    ok: true,
    png,
    breitePx: bild.width,
    hoehePx: bild.height,
    dpi: v.dpi,
    breiteCm: bild.width / v.pxProCm,
    hoeheCm: bild.height / v.pxProCm,
    zeilen: zerlegeInZeilen(v.element.content).length,
  };
}
