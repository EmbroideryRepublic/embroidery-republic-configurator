/**
 * JEF: das Janome-Format (Janome, Elna/Kenmore-Reihen mit Janome-Technik).
 *
 * ── Aufbau ─────────────────────────────────────────────────────────────
 *   0x00  Offset der Stiche (4 Byte) = 0x74 + 8 × Farben
 *   0x04  Kennung 0x14 (4 Byte)
 *   0x08  Datum "JJJJMMTThhmmss" (14 Byte), 2 Nullbytes
 *   0x18  Zahl der Farben, Zahl der Punkte (je 4 Byte)
 *   0x20  Rahmengröße (4 Byte), Halbbreite/-höhe des Motivs (je zweimal), vier Rahmenabstände (je 4 × 4 Byte)
 *   0x74  je Farbe der Palettenplatz (4 Byte), dann je Farbe 0x0D (4 Byte)
 *   Stiche: je Punkt 2 Byte (dx, dy, vorzeichenbehaftet, 0,1 mm, y nach OBEN);
 *           0x80 0x01 = Farbwechsel (mit Versatz), 0x80 0x02 = Sprung (mit Versatz), 0x80 0x10 = Ende;
 *           Fadenschnitt = dreimal 0x80 0x02 0x00 0x00 (Janome-Konvention).
 * Die Farben stehen als Palettenplatz der Janome-Standardpalette (garnpaletten.ts).
 */
import type { Befehlsfolge } from './befehle';
import { ByteSchreiber } from './schreiber';

const SCHNITT_WIEDERHOLUNGEN = 3;

function rahmenGroesse(breite: number, hoehe: number): number {
  if (breite < 500 && hoehe < 500) return 1; // 50 × 50
  if (breite < 1260 && hoehe < 1100) return 3; // 126 × 110
  if (breite < 1400 && hoehe < 2000) return 2; // 140 × 200
  if (breite < 2000 && hoehe < 2000) return 4; // 200 × 200
  return 0; // 110 × 110
}

function rahmenAbstand(w: ByteSchreiber, x: number, y: number): void {
  if (Math.min(x, y) >= 0) {
    w.u32(x).u32(y).u32(x).u32(y);
  } else {
    w.u32(-1).u32(-1).u32(-1).u32(-1);
  }
}

function zweierKomplement(wert: number): number {
  if (wert < -128 || wert > 127) throw new Error(`JEF-Versatz außerhalb von ±127: ${wert}`);
  return wert & 0xff;
}

/**
 * Schreibt die Befehlsfolge als JEF. `palettenPlaetze` = Janome-Palettenplatz je Farbblock; `datum` steht im Kopf
 * (Standard: jetzt).
 */
export function schreibeJef(folge: Befehlsfolge, palettenPlaetze: number[], datum: Date = new Date()): Buffer {
  const w = new ByteSchreiber();
  const farben = palettenPlaetze.length;

  // Punkte zählen (wie die Datei sie schreibt)
  let punkte = 1; // Ende
  for (const b of folge.befehle) {
    if (b.art === 'stich') punkte += 1;
    else if (b.art === 'sprung') punkte += 2;
    else if (b.art === 'schnitt') punkte += 2 * SCHNITT_WIEDERHOLUNGEN;
    else if (b.art === 'farbwechsel') punkte += 2;
  }

  const zweistellig = (n: number) => String(n).padStart(2, '0');
  const datumText =
    `${datum.getFullYear()}${zweistellig(datum.getMonth() + 1)}${zweistellig(datum.getDate())}` +
    `${zweistellig(datum.getHours())}${zweistellig(datum.getMinutes())}${zweistellig(datum.getSeconds())}`;

  w.u32(0x74 + farben * 8);
  w.u32(0x14);
  w.text(datumText);
  w.u8(0).u8(0);
  w.u32(farben);
  w.u32(punkte);
  const breite = Math.round(folge.grenzen.maxX - folge.grenzen.minX);
  const hoehe = Math.round(folge.grenzen.maxY - folge.grenzen.minY);
  w.u32(rahmenGroesse(breite, hoehe));
  const halbB = Math.round(breite / 2);
  const halbH = Math.round(hoehe / 2);
  w.u32(halbB).u32(halbH).u32(halbB).u32(halbH);
  rahmenAbstand(w, 550 - halbB, 550 - halbH); // Rahmen 110 × 110
  rahmenAbstand(w, 250 - halbB, 250 - halbH); // Rahmen 50 × 50
  rahmenAbstand(w, 700 - halbB, 1000 - halbH); // Rahmen 140 × 200
  rahmenAbstand(w, 700 - halbB, 1000 - halbH); // eigener Rahmen
  for (const platz of palettenPlaetze) w.u32(platz);
  for (let i = 0; i < farben; i++) w.u32(0x0d);
  if (w.laenge !== 0x74 + farben * 8) throw new Error('JEF-Kopf hat die falsche Länge');

  let xx = 0;
  let yy = 0;
  for (const b of folge.befehle) {
    if (b.art === 'ende') break;
    if (b.art === 'schnitt') {
      for (let i = 0; i < SCHNITT_WIEDERHOLUNGEN; i++) w.roh([0x80, 0x02, 0x00, 0x00]);
      continue;
    }
    const dx = b.x - xx;
    const dy = b.y - yy;
    if (b.art === 'stich') {
      w.u8(zweierKomplement(dx)).u8(zweierKomplement(-dy));
    } else if (b.art === 'sprung') {
      w.u8(0x80).u8(0x02).u8(zweierKomplement(dx)).u8(zweierKomplement(-dy));
    } else if (b.art === 'farbwechsel') {
      w.u8(0x80).u8(0x01).u8(zweierKomplement(dx)).u8(zweierKomplement(-dy));
    }
    xx = b.x;
    yy = b.y;
  }
  w.u8(0x80).u8(0x10);
  return w.zuBuffer();
}
