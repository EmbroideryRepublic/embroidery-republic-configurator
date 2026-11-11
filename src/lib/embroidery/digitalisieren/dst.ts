/**
 * Tajima-DST: das gängigste Stickdateiformat (Industriemaschinen wie Tajima, Barudan, ZSK, SWF, Happy und viele
 * Heimmaschinen über USB; andere Formate wie PES/JEF lassen sich daraus in jeder Stick-Software erzeugen).
 *
 * ── Aufbau ─────────────────────────────────────────────────────────────
 *   512 Byte Kopf (Text: Name, Stichzahl, Farbwechsel, Ausdehnung) + je Stichpunkt 3 Byte + Endemarke 00 00 F3.
 *   Ein Eintrag ist ein VERSATZ (dx, dy) zur vorherigen Nadelposition in 0,1 mm, höchstens ±121. Er wird als
 *   ausgewogene Dreierzahl in den Stellen 1, 3, 9, 27, 81 kodiert; Byte 3 trägt die Art: Stich / Sprung / Farbwechsel / Ende.
 *   Die y-Achse zeigt in DST nach OBEN (im Stickplan nach unten, deshalb wird y hier gespiegelt).
 *
 * ── Farben ─────────────────────────────────────────────────────────────
 * DST kennt nur "Farbwechsel", keine Garnfarben. Die Reihenfolge der Farben steht in der Bestellung/Vorschau; die
 * Zuordnung zu Garnnummern geschieht an der Maschine oder in der Software.
 */
import { planZuBefehlen, type Befehlsfolge } from './befehle';
import { DST_MAX_SCHRITT_EINHEITEN, SCHNITT_AB_MM } from './parameter';
import type { Stickplan } from './stickplan';

export type DstArt = 'stich' | 'sprung' | 'farbwechsel' | 'ende';

export interface DstEintrag {
  /** Absolute Position in 0,1 mm (y nach OBEN, wie in der Datei). */
  x: number;
  y: number;
  art: DstArt;
}

// Stellenwerte und ihre Bits: [Wert, Byte, Bit(+), Bit(−)] für x; für y analog.
const X_BITS: Array<[number, number, number, number]> = [
  [1, 0, 0x01, 0x02],
  [3, 1, 0x01, 0x02],
  [9, 0, 0x04, 0x08],
  [27, 1, 0x04, 0x08],
  [81, 2, 0x04, 0x08],
];
const Y_BITS: Array<[number, number, number, number]> = [
  [1, 0, 0x80, 0x40],
  [3, 1, 0x80, 0x40],
  [9, 0, 0x20, 0x10],
  [27, 1, 0x20, 0x10],
  [81, 2, 0x20, 0x10],
];

const FLAGGE: Record<Exclude<DstArt, 'ende'>, number> = { stich: 0x03, sprung: 0x83, farbwechsel: 0xc3 };

/** Kodiert einen Versatz (je Achse −121…121) in drei Byte. */
export function kodiereEintrag(dx: number, dy: number, art: Exclude<DstArt, 'ende'> | 'ende'): [number, number, number] {
  if (art === 'ende') return [0x00, 0x00, 0xf3];
  if (Math.abs(dx) > DST_MAX_SCHRITT_EINHEITEN || Math.abs(dy) > DST_MAX_SCHRITT_EINHEITEN) {
    throw new Error(`DST-Versatz außerhalb ±${DST_MAX_SCHRITT_EINHEITEN}: ${dx}/${dy}`);
  }
  const bytes: [number, number, number] = [0, 0, FLAGGE[art]];
  const ziffern = (wert: number, tabelle: typeof X_BITS) => {
    let rest = wert;
    for (const [stelle, byte, plus, minus] of [...tabelle].reverse()) {
      if (rest > stelle / 2) {
        bytes[byte] = (bytes[byte] ?? 0) | plus;
        rest -= stelle;
      } else if (rest < -stelle / 2) {
        bytes[byte] = (bytes[byte] ?? 0) | minus;
        rest += stelle;
      }
    }
    if (rest !== 0) throw new Error(`DST-Kodierung ging nicht auf (Rest ${rest}) für ${wert}`);
  };
  ziffern(dx, X_BITS);
  ziffern(dy, Y_BITS);
  return bytes;
}

/** Liest einen Eintrag zurück (unabhängig von der Kodierung oben: Summe der gesetzten Stellenwerte). */
export function dekodiereEintrag(b0: number, b1: number, b2: number): { dx: number; dy: number; art: DstArt } {
  const bytes = [b0, b1, b2];
  const summe = (tabelle: typeof X_BITS) => tabelle.reduce((s, [stelle, byte, plus, minus]) => s + ((bytes[byte]! & plus ? stelle : 0) - (bytes[byte]! & minus ? stelle : 0)), 0);
  let art: DstArt = 'stich';
  if ((b2 & 0xf3) === 0xf3) art = 'ende';
  else if ((b2 & 0xc3) === 0xc3) art = 'farbwechsel';
  else if (b2 & 0x80) art = 'sprung';
  return { dx: summe(X_BITS), dy: summe(Y_BITS), art };
}

function ascii(text: string, laenge: number): string {
  return text.replace(/[^\x20-\x7E]/g, '_').padEnd(laenge, ' ').slice(0, laenge);
}

/**
 * Fadenschnitt in DST: Das Format hat keinen eigenen Schnittbefehl. Üblich (Tajima-Konvention, auch von Wilcom und
 * pyembroidery so geschrieben) sind drei Sprünge, die sich zu null aufheben; die Maschine schneidet dann den Faden.
 */
const SCHNITT_SPRUENGE: ReadonlyArray<readonly [number, number]> = [
  [2, 2],
  [-4, -4],
  [2, 2],
];

/**
 * Schreibt die Befehlsfolge als DST. Wege über ±12,1 mm sind in der Befehlsfolge bereits in Schritte zerlegt (absolut gerundet,
 * damit sich keine Rundungsfehler aufsummieren); y wird gespiegelt, weil DST nach OBEN zählt.
 */
export function schreibeDstAusBefehlen(folge: Befehlsfolge, name: string): Buffer {
  const eintraege: Array<{ dx: number; dy: number; art: Exclude<DstArt, 'ende'> }> = [];
  let px = 0;
  let py = 0;
  let farbwechsel = 0;
  for (const b of folge.befehle) {
    if (b.art === 'ende') break;
    if (b.art === 'schnitt') {
      for (const [dx, dy] of SCHNITT_SPRUENGE) eintraege.push({ dx, dy, art: 'sprung' });
      continue;
    }
    if (b.art === 'farbwechsel') {
      eintraege.push({ dx: 0, dy: 0, art: 'farbwechsel' });
      farbwechsel++;
      continue;
    }
    eintraege.push({ dx: b.x - px, dy: -(b.y - py), art: b.art });
    px = b.x;
    py = b.y;
  }
  // Ausdehnung aus den Einträgen selbst (inkl. der kleinen Ausschläge der Schnitt-Sprünge): So stimmt der Kopf mit der Datei überein.
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  {
    let ax = 0;
    let ay = 0;
    for (const e of eintraege) {
      ax += e.dx;
      ay += e.dy;
      minX = Math.min(minX, ax);
      maxX = Math.max(maxX, ax);
      minY = Math.min(minY, ay);
      maxY = Math.max(maxY, ay);
    }
  }

  const stichzahl = eintraege.length;
  const kopf = [
    `LA:${ascii(name, 16)}`,
    `ST:${String(stichzahl).padStart(7, ' ')}`,
    `CO:${String(farbwechsel).padStart(3, ' ')}`,
    `+X:${String(maxX).padStart(5, ' ')}`,
    `-X:${String(-minX).padStart(5, ' ')}`,
    `+Y:${String(maxY).padStart(5, ' ')}`,
    `-Y:${String(-minY).padStart(5, ' ')}`,
    `AX:+${String(0).padStart(5, ' ')}`,
    `AY:+${String(0).padStart(5, ' ')}`,
    `MX:+${String(0).padStart(5, ' ')}`,
    `MY:+${String(0).padStart(5, ' ')}`,
    `PD:******`,
  ].join('\r');
  const kopfBytes = Buffer.alloc(512, 0x20);
  kopfBytes.write(kopf + '\r', 0, 'latin1');
  kopfBytes[Buffer.byteLength(kopf + '\r', 'latin1')] = 0x1a;

  const daten = Buffer.alloc((eintraege.length + 1) * 3);
  eintraege.forEach((e, i) => {
    const [b0, b1, b2] = kodiereEintrag(e.dx, e.dy, e.art);
    daten[i * 3] = b0;
    daten[i * 3 + 1] = b1;
    daten[i * 3 + 2] = b2;
  });
  const ende = kodiereEintrag(0, 0, 'ende');
  daten[eintraege.length * 3] = ende[0];
  daten[eintraege.length * 3 + 1] = ende[1];
  daten[eintraege.length * 3 + 2] = ende[2];
  return Buffer.concat([kopfBytes, daten]);
}

/** Schreibt den Stickplan als DST (siehe schreibeDstAusBefehlen). */
export function schreibeDst(plan: Stickplan, name: string): Buffer {
  return schreibeDstAusBefehlen(planZuBefehlen(plan, { maxSchritt: DST_MAX_SCHRITT_EINHEITEN, schnittAbMm: SCHNITT_AB_MM }), name);
}

export interface GelesenesDst {
  name: string;
  stichzahlKopf: number;
  farbwechselKopf: number;
  eintraege: DstEintrag[];
  /** Ausdehnung laut Kopf in 0,1 mm. */
  kopf: { plusX: number; minusX: number; plusY: number; minusY: number };
}

/** Liest eine DST-Datei (für Tests und die Gegenprobe: Kopf und Einträge werden unabhängig vom Schreiber ausgewertet). */
export function leseDst(datei: Buffer): GelesenesDst {
  const text = datei.toString('latin1', 0, 512);
  const feld = (kuerzel: string): string => {
    const m = new RegExp(`${kuerzel.replace(/[+\-]/g, '\\$&')}:([^\\r]*)\\r`).exec(text);
    return m ? m[1]! : '';
  };
  const eintraege: DstEintrag[] = [];
  let x = 0;
  let y = 0;
  for (let pos = 512; pos + 2 < datei.length; pos += 3) {
    const e = dekodiereEintrag(datei[pos]!, datei[pos + 1]!, datei[pos + 2]!);
    if (e.art === 'ende') {
      eintraege.push({ x, y, art: 'ende' });
      break;
    }
    x += e.dx;
    y += e.dy;
    eintraege.push({ x, y, art: e.art });
  }
  return {
    name: feld('LA').trim(),
    stichzahlKopf: Number(feld('ST').trim()),
    farbwechselKopf: Number(feld('CO').trim()),
    eintraege,
    kopf: { plusX: Number(feld('+X').trim()), minusX: Number(feld('-X').trim()), plusY: Number(feld('+Y').trim()), minusY: Number(feld('-Y').trim()) },
  };
}
