/**
 * Unabhängige Leser für PES, JEF und DST – NUR für Tests.
 *
 * Sie sind aus der Format-Beschreibung (Aufbau der Felder) geschrieben, nicht aus dem Schreibcode abgeleitet, und liefern die
 * Stichfolge in derselben Form wie planZuBefehlen (absolute Positionen in 0,1 mm, y nach UNTEN; Fadenschnitt als eigener Befehl).
 * Was ein Schreiber falsch kodiert, fällt hier als Abweichung auf.
 */
import { leseDst } from '../dst';
import type { Befehl } from '../befehle';

function int8(b: number): number {
  return b > 127 ? b - 256 : b;
}

// ── PES / PEC ───────────────────────────────────────────────────────────

export interface GelesenesPes {
  signatur: string;
  pecOffset: number;
  label: string;
  /** Palettenplatz je Farbe (Brother, 1…64) */
  plaetze: number[];
  blockLaenge: number;
  breite: number;
  hoehe: number;
  befehle: Befehl[];
  /** Bytes hinter dem Stichblock = Vorschaubilder */
  vorschauBytes: number;
  vorschauErstesByte: number;
  /** Position des Stichblock-Endes (nach dem 0xFF) laut Länge im Block und laut Dekodierung */
  endeLautLaenge: number;
  endeLautDekodierung: number;
  /** Strings des PES-Teils, die der Leser gefunden hat (CEmbOne, CSewSeg) */
  hatBloecke: boolean;
}

function leseWertPec(buf: Buffer, i: number): { wert: number; art: number; weiter: number } {
  const b = buf[i]!;
  if (b & 0x80) {
    const roh = ((b & 0x0f) << 8) | buf[i + 1]!;
    const wert = roh >= 0x800 ? roh - 0x1000 : roh;
    return { wert, art: b & 0x30, weiter: i + 2 };
  }
  const wert = b >= 0x40 ? b - 0x80 : b;
  return { wert, art: 0, weiter: i + 1 };
}

export function lesePes(buf: Buffer): GelesenesPes {
  const signatur = buf.toString('latin1', 0, 8);
  const pecOffset = buf.readUInt32LE(8);
  const p = pecOffset;
  const label = buf.toString('latin1', p, p + 20);
  const anzahl = buf[p + 48]! + 1;
  const plaetze: number[] = [];
  for (let k = 0; k < anzahl; k++) plaetze.push(buf[p + 49 + k]!);
  const block = p + 512;
  const blockLaenge = buf.readUIntLE(block + 2, 3);
  const breite = buf.readUInt16LE(block + 8);
  const hoehe = buf.readUInt16LE(block + 10);
  const befehle: Befehl[] = [];
  let x = 0;
  let y = 0;
  let i = block + 16;
  let letzteArt = 0;
  let schnittMerker = false;
  for (;;) {
    const b = buf[i]!;
    if (b === 0xff) {
      befehle.push({ x, y, art: 'ende' });
      i += 1;
      break;
    }
    if (b === 0xfe && buf[i + 1] === 0xb0) {
      befehle.push({ x, y, art: 'farbwechsel' });
      i += 3;
      continue;
    }
    const a = leseWertPec(buf, i);
    const c = leseWertPec(buf, a.weiter);
    i = c.weiter;
    letzteArt = a.art;
    x += a.wert;
    y += c.wert;
    if (letzteArt & 0x20) {
      schnittMerker = true;
      befehle.push({ x: x - a.wert, y: y - c.wert, art: 'schnitt' });
    }
    befehle.push({ x, y, art: letzteArt ? 'sprung' : 'stich' });
    void schnittMerker;
  }
  return {
    signatur,
    pecOffset,
    label,
    plaetze,
    blockLaenge,
    breite,
    hoehe,
    befehle,
    vorschauBytes: buf.length - i,
    vorschauErstesByte: buf[i] ?? -1,
    endeLautLaenge: block + blockLaenge,
    endeLautDekodierung: i,
    hatBloecke: buf.includes(Buffer.from('CEmbOne')) && buf.includes(Buffer.from('CSewSeg')),
  };
}

// ── JEF ─────────────────────────────────────────────────────────────────

export interface GelesenesJef {
  stichOffset: number;
  kennung: number;
  datum: string;
  farben: number;
  punkte: number;
  rahmen: number;
  plaetze: number[];
  befehle: Befehl[];
  /** Zahl der 2-Byte-Punkte ab dem Stichoffset */
  punkteImStichteil: number;
  endetMitEnde: boolean;
}

export function leseJef(buf: Buffer): GelesenesJef {
  const stichOffset = buf.readUInt32LE(0);
  const farben = buf.readUInt32LE(24);
  const plaetze: number[] = [];
  for (let k = 0; k < farben; k++) plaetze.push(buf.readUInt32LE(0x74 + 4 * k));
  const befehle: Befehl[] = [];
  let x = 0;
  let y = 0;
  let i = stichOffset;
  let endetMitEnde = false;
  // Fadenschnitt = drei Sprünge ohne Versatz hintereinander
  let nullSpruenge = 0;
  while (i < buf.length) {
    const b0 = buf[i]!;
    if (b0 === 0x80) {
      const kommando = buf[i + 1]!;
      if (kommando === 0x10) {
        befehle.push({ x, y, art: 'ende' });
        endetMitEnde = true;
        i += 2;
        break;
      }
      const dx = int8(buf[i + 2]!);
      const dy = -int8(buf[i + 3]!);
      i += 4;
      if (kommando === 0x01) {
        x += dx;
        y += dy;
        befehle.push({ x, y, art: 'farbwechsel' });
        nullSpruenge = 0;
      } else if (kommando === 0x02) {
        if (dx === 0 && dy === 0) {
          nullSpruenge++;
          if (nullSpruenge === 3) {
            befehle.push({ x, y, art: 'schnitt' });
            nullSpruenge = 0;
          }
        } else {
          nullSpruenge = 0;
          x += dx;
          y += dy;
          befehle.push({ x, y, art: 'sprung' });
        }
      } else {
        throw new Error(`Unbekannter JEF-Befehl 0x80 0x${kommando.toString(16)}`);
      }
      continue;
    }
    nullSpruenge = 0;
    x += int8(b0);
    y += -int8(buf[i + 1]!);
    befehle.push({ x, y, art: 'stich' });
    i += 2;
  }
  return {
    stichOffset,
    kennung: buf.readUInt32LE(4),
    datum: buf.toString('latin1', 8, 22),
    farben,
    punkte: buf.readUInt32LE(28),
    rahmen: buf.readUInt32LE(32),
    plaetze,
    befehle,
    punkteImStichteil: (buf.length - stichOffset) / 2,
    endetMitEnde,
  };
}

// ── DST ─────────────────────────────────────────────────────────────────

/** DST → Befehle (y nach unten). Drei Sprünge (+2,+2), (−4,−4), (+2,+2) gelten als Fadenschnitt. */
export function dstZuBefehlen(buf: Buffer): Befehl[] {
  const gelesen = leseDst(buf);
  const roh: Array<{ x: number; y: number; art: Befehl['art'] }> = gelesen.eintraege.map((e) => ({ x: e.x, y: -e.y, art: e.art === 'ende' ? 'ende' : e.art === 'farbwechsel' ? 'farbwechsel' : e.art === 'sprung' ? 'sprung' : 'stich' }));
  const ergebnis: Befehl[] = [];
  let px = 0;
  let py = 0;
  for (let i = 0; i < roh.length; i++) {
    const a = roh[i]!;
    const b = roh[i + 1];
    const c = roh[i + 2];
    if (a.art === 'sprung' && b?.art === 'sprung' && c?.art === 'sprung') {
      const d1 = [a.x - px, a.y - py];
      const d2 = [b.x - a.x, b.y - a.y];
      const d3 = [c.x - b.x, c.y - b.y];
      // im DST-Raum (y oben) waren es (2,2),(−4,−4),(2,2); nach der Spiegelung y: (2,−2),(−4,4),(2,−2)
      if (d1[0] === 2 && d1[1] === -2 && d2[0] === -4 && d2[1] === 4 && d3[0] === 2 && d3[1] === -2) {
        ergebnis.push({ x: px, y: py, art: 'schnitt' });
        i += 2;
        continue;
      }
    }
    ergebnis.push(a);
    px = a.x;
    py = a.y;
  }
  return ergebnis;
}
