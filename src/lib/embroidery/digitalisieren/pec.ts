/**
 * PEC: der Stichteil der Brother-Dateien (PES enthält ihn; die Maschine liest NUR diesen Teil).
 *
 * ── Aufbau (ab Beginn des PEC-Teils) ───────────────────────────────────
 *   20 Byte   "LA:" + Name (16 Zeichen, mit Leerzeichen aufgefüllt) + CR
 *   14 Byte   12 Leerzeichen, 0xFF, 0x00
 *    2 Byte   Breite der Vorschau in Byte (6), Höhe (38)
 *   12 Byte   Leerzeichen
 *    1 Byte   Anzahl Garnfarben − 1, dann je Farbe der Palettenplatz (1…64)
 *   Rest      Leerzeichen bis 512 Byte
 *   Stichblock: 00 00, Länge (3 Byte), 31 FF F0, Breite, Höhe (je 2 Byte, 0,1 mm), 0x1E0, 0x1B0, dann die Stiche
 *   Vorschaubilder: 48×38 Punkte, 1 Bit je Punkt (228 Byte); zuerst das ganze Motiv, dann eines je Farbe
 *
 * ── Stichkodierung ─────────────────────────────────────────────────────
 * Je Eintrag zwei Werte (dx, dy), Versatz zur vorigen Nadelposition in 0,1 mm, y nach UNTEN.
 *   Kurz:  1 Byte, 7 Bit mit Vorzeichen (−63…62)
 *   Lang:  2 Byte, 0x8000 | Art<<8 | 12 Bit mit Vorzeichen; Art 0x10 = Sprung, 0x20 = Sprung MIT Fadenschnitt
 *   FE B0 02 / FE B0 01 (abwechselnd) = Farbwechsel, FF = Ende
 * Nach einem Sprung beginnt die Naht mit einem Einstich genau am Ziel (der Stickplan setzt ihn bereits).
 */
import type { Befehlsfolge } from './befehle';
import { ByteSchreiber } from './schreiber';

const SPRUNG = 0x10;
const SCHNITT_SPRUNG = 0x20;
export const PEC_ICON_BREITE = 48;
export const PEC_ICON_HOEHE = 38;
const ICON_STRIDE = PEC_ICON_BREITE / 8;

function schreibeWert(w: ByteSchreiber, wert: number, lang: boolean, art: number): void {
  if (!lang && wert > -64 && wert < 63) {
    w.u8(wert & 0x7f);
    return;
  }
  const bits = (wert & 0x0fff) | 0x8000 | (art << 8);
  w.u8((bits >> 8) & 0xff);
  w.u8(bits & 0xff);
}

/** Zeichnet eine Linie (Bresenham) in ein 48×38-Bild; Bit 0 eines Bytes ist der linkeste Punkt. */
function linie(bild: Uint8Array, x0: number, y0: number, x1: number, y1: number): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const zx = Math.round(x1);
  const zy = Math.round(y1);
  const dx = Math.abs(zx - x);
  const dy = -Math.abs(zy - y);
  const sx = x < zx ? 1 : -1;
  const sy = y < zy ? 1 : -1;
  let fehler = dx + dy;
  for (;;) {
    punkt(bild, x, y);
    if (x === zx && y === zy) break;
    const e2 = 2 * fehler;
    if (e2 >= dy) {
      fehler += dy;
      x += sx;
    }
    if (e2 <= dx) {
      fehler += dx;
      y += sy;
    }
  }
}

function punkt(bild: Uint8Array, x: number, y: number): void {
  if (x < 0 || x >= PEC_ICON_BREITE || y < 0 || y >= PEC_ICON_HOEHE) return;
  bild[y * ICON_STRIDE + (x >> 3)]! |= 1 << (x & 7);
}

/** Vorschaubild: Rahmen (ab Zeile 1, die erste Zeile bleibt leer) und das Motiv, eingepasst in 42×32 Punkte. */
function vorschaubild(folge: Befehlsfolge, farbIndex: number | null): Uint8Array {
  const bild = new Uint8Array(ICON_STRIDE * PEC_ICON_HOEHE);
  for (let x = 1; x <= 46; x++) {
    punkt(bild, x, 1);
    punkt(bild, x, 36);
  }
  for (let y = 1; y <= 36; y++) {
    punkt(bild, 1, y);
    punkt(bild, 46, y);
  }
  // Ausdehnung der Stiche
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of folge.befehle) {
    if (b.art !== 'stich') continue;
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x);
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y);
  }
  if (!isFinite(minX)) return bild;
  const breite = Math.max(1, maxX - minX);
  const hoehe = Math.max(1, maxY - minY);
  const massstab = Math.min(42 / breite, 32 / hoehe);
  const versatzX = 24 - ((minX + maxX) / 2) * massstab;
  const versatzY = 19 - ((minY + maxY) / 2) * massstab;
  let farbe = 0;
  let vorher: { x: number; y: number } | null = null;
  for (const b of folge.befehle) {
    if (b.art === 'farbwechsel') {
      farbe++;
      vorher = null;
      continue;
    }
    if (b.art !== 'stich') {
      vorher = null;
      continue;
    }
    const x = b.x * massstab + versatzX;
    const y = b.y * massstab + versatzY;
    if ((farbIndex === null || farbIndex === farbe) && vorher) linie(bild, vorher.x, vorher.y, x, y);
    vorher = { x, y };
  }
  return bild;
}

export interface PecErgebnis {
  bytes: Buffer;
}

/**
 * Schreibt den PEC-Teil. `palettenPlaetze` = Brother-Palettenplatz (1…64) je Farbblock.
 */
export function schreibePec(folge: Befehlsfolge, name: string, palettenPlaetze: number[]): PecErgebnis {
  const w = new ByteSchreiber();
  const anzahl = palettenPlaetze.length;

  // Kopf (512 Byte)
  w.text(`LA:${name.replace(/[^\x20-\x7E]/g, '_').slice(0, 8).padEnd(16, ' ')}\r`);
  w.fuell(0x20, 12).u8(0xff).u8(0x00);
  w.u8(ICON_STRIDE).u8(PEC_ICON_HOEHE);
  if (anzahl > 0) {
    w.fuell(0x20, 12);
    w.u8(anzahl - 1);
    for (const platz of palettenPlaetze) w.u8(platz);
  } else {
    w.roh([0x20, 0x20, 0x20, 0x20, 0x64, 0x20, 0x00, 0x20, 0x00, 0x20, 0x20, 0x20, 0xff]);
  }
  w.fuell(0x20, 463 - anzahl);
  if (w.laenge !== 512) throw new Error(`PEC-Kopf hat ${w.laenge} statt 512 Byte`);

  // Stichblock
  const blockStart = w.laenge;
  w.u8(0x00).u8(0x00);
  w.u24(0); // Länge, wird unten gesetzt
  w.roh([0x31, 0xff, 0xf0]);
  const breite = folge.grenzen.maxX - folge.grenzen.minX;
  const hoehe = folge.grenzen.maxY - folge.grenzen.minY;
  w.u16(Math.round(breite)).u16(Math.round(hoehe)).u16(0x1e0).u16(0x1b0);

  let farbeZwei = true;
  let springt = true;
  let erster = true;
  let letzterSchnitt = false;
  let xx = 0;
  let yy = 0;
  for (const b of folge.befehle) {
    if (b.art === 'schnitt') {
      letzterSchnitt = true;
      continue;
    }
    const dx = b.x - xx;
    const dy = b.y - yy;
    if (b.art === 'stich') {
      if (springt) {
        if (dx !== 0 && dy !== 0) {
          schreibeWert(w, 0, false, 0);
          schreibeWert(w, 0, false, 0);
        }
        springt = false;
      }
      schreibeWert(w, dx, false, 0);
      schreibeWert(w, dy, false, 0);
    } else if (b.art === 'sprung') {
      springt = true;
      const art = letzterSchnitt ? SCHNITT_SPRUNG : SPRUNG;
      schreibeWert(w, dx, true, art);
      schreibeWert(w, dy, true, art);
      letzterSchnitt = false;
    } else if (b.art === 'farbwechsel') {
      if (springt && !erster) {
        schreibeWert(w, 0, false, 0);
        schreibeWert(w, 0, false, 0);
      }
      springt = false;
      w.u8(0xfe).u8(0xb0).u8(farbeZwei ? 0x02 : 0x01);
      farbeZwei = !farbeZwei;
      letzterSchnitt = false;
    } else if (b.art === 'ende') {
      w.u8(0xff);
      break;
    }
    xx = b.x;
    yy = b.y;
    erster = false;
  }
  w.setzeU24(blockStart + 2, w.laenge - blockStart);

  // Vorschaubilder: Gesamtbild, dann je Farbe. Das erste Byte bleibt 0x00 (Leser erkennen daran das Ende der Stiche nach FF).
  w.roh(vorschaubild(folge, null));
  for (let i = 0; i < anzahl; i++) w.roh(vorschaubild(folge, i));
  return { bytes: w.zuBuffer() };
}
