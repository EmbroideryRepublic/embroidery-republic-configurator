/**
 * PES (Version 1): das Brother-Format (Brother, Babylock, Bernina mit Brother-Technik, auch PE-Design/Embird).
 *
 * ── Aufbau ─────────────────────────────────────────────────────────────
 *   "#PES0001", Offset des PEC-Teils (4 Byte), kleiner Kopf (Skalierung, Rahmen, Zahl der Blöcke),
 *   Block "CEmbOne" mit Umriss und Abschnitt "CSewSeg" (die Stiche als Linienzüge je Farbe, für die Software),
 *   dann der PEC-Teil (pec.ts) – den liest die Maschine.
 * Die Farben stehen als Palettenplatz der Brother-Standardpalette (garnpaletten.ts) im PEC-Kopf und in den Abschnitten.
 */
import type { Befehlsfolge } from './befehle';
import { schreibePec } from './pec';
import { ByteSchreiber } from './schreiber';

const EMB_ONE = 'CEmbOne';
const EMB_SEG = 'CSewSeg';

function schreibeString16(w: ByteSchreiber, text: string): void {
  w.u16(text.length).text(text);
}

interface Abschnitt {
  punkte: Array<[number, number]>;
  farbplatz: number;
  /** 0 = Stiche, 1 = Sprung */
  art: 0 | 1;
}

/** Zerlegt die Befehlsfolge in Abschnitte gleicher Art und Farbe (Stiche bzw. Sprünge), Koordinaten relativ zur linken unteren Ecke. */
function abschnitte(folge: Befehlsfolge, plaetze: number[], anpassungX: number, anpassungY: number): Abschnitt[] {
  const ergebnis: Abschnitt[] = [];
  let farbIndex = 0;
  let stichX = 0;
  let stichY = 0;
  let i = 0;
  const b = folge.befehle;
  while (i < b.length) {
    const art = b[i]!.art;
    let j = i;
    while (j < b.length && b[j]!.art === art) j++;
    const gruppe = b.slice(i, j);
    if (art === 'farbwechsel') {
      farbIndex += gruppe.length;
    } else if (art === 'sprung') {
      const letzter = gruppe[gruppe.length - 1]!;
      ergebnis.push({
        punkte: [
          [stichX - anpassungX, stichY - anpassungY],
          [letzter.x - anpassungX, letzter.y - anpassungY],
        ],
        farbplatz: plaetze[Math.min(farbIndex, plaetze.length - 1)]!,
        art: 1,
      });
    } else if (art === 'stich') {
      const punkte: Array<[number, number]> = [];
      for (const s of gruppe) {
        stichX = s.x;
        stichY = s.y;
        punkte.push([s.x - anpassungX, s.y - anpassungY]);
      }
      ergebnis.push({ punkte, farbplatz: plaetze[Math.min(farbIndex, plaetze.length - 1)]!, art: 0 });
    }
    i = j;
  }
  return ergebnis;
}

/**
 * Schreibt die Befehlsfolge als PES (Version 1, vollständig mit Softwareblöcken).
 * `palettenPlaetze` = Brother-Palettenplatz (1…64) je Farbblock.
 */
export function schreibePes(folge: Befehlsfolge, name: string, palettenPlaetze: number[]): Buffer {
  const w = new ByteSchreiber();
  w.text('#PES0001');
  const pecOffsetFeld = w.laenge;
  w.u32(0);

  const { minX, minY, maxX, maxY } = folge.grenzen;
  const cx = (maxX + minX) / 2;
  const cy = (maxY + minY) / 2;
  const links = minX - cx;
  const oben = minY - cy;
  const rechts = maxX - cx;
  const unten = maxY - cy;

  // Kopf Version 1: Skalierung, Rahmen, Zahl der eigenständigen Blöcke
  w.u16(0x01).u16(0x01).u16(1);
  w.u16(0xffff).u16(0x0000);

  // Block CEmbOne
  schreibeString16(w, EMB_ONE);
  const breite = rechts - links;
  const hoehe = unten - oben;
  for (let k = 0; k < 8; k++) w.u16(0); // Umriss (links, oben, rechts, unten) zweimal
  const transX = 350 + 1300 / 2 - breite / 2;
  const transY = 100 + hoehe + 1800 / 2 - hoehe / 2;
  w.f32(1).f32(0).f32(0).f32(1).f32(transX).f32(transY);
  w.u16(1).u16(0).u16(0).u16(Math.trunc(breite)).u16(Math.trunc(hoehe));
  w.fuell(0, 8);
  const abschnittsZahlFeld = w.laenge;
  w.u16(0);
  w.u16(0xffff).u16(0x0000); // es folgen weitere Blöcke

  // Block CSewSeg
  schreibeString16(w, EMB_SEG);
  const liste = abschnitte(folge, palettenPlaetze, minX, maxY);
  const farbprotokoll: Array<[number, number]> = [];
  let letzterPlatz = -1;
  let naechsteArt = -1;
  liste.forEach((a, index) => {
    if (naechsteArt !== -1) w.u16(0x8003); // Abschnittsende
    naechsteArt = a.art;
    if (a.farbplatz !== letzterPlatz) {
      farbprotokoll.push([index, a.farbplatz]);
      letzterPlatz = a.farbplatz;
    }
    w.u16(a.art).u16(a.farbplatz).u16(a.punkte.length);
    for (const [px, py] of a.punkte) w.u16(Math.trunc(px)).u16(Math.trunc(py));
  });
  w.u16(farbprotokoll.length);
  for (const [abschnitt, platz] of farbprotokoll) w.u16(abschnitt).u16(platz);
  w.setzeU16(abschnittsZahlFeld, liste.length);
  w.u16(0).u16(0); // keine weiteren Blöcke

  // PEC-Teil
  w.setzeU32(pecOffsetFeld, w.laenge);
  w.roh(schreibePec(folge, name, palettenPlaetze).bytes);
  return w.zuBuffer();
}
