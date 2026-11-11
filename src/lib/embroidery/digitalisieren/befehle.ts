/**
 * Befehlsfolge: der Stickplan in der Form, die alle Dateiformate gemeinsam brauchen.
 *
 * Absolute Positionen in 0,1 mm (ganze Zahlen, y wie im Stickplan NACH UNTEN), Arten: Stich, Sprung (Nadel hoch, bewegen),
 * Schnitt (Faden abschneiden – steht VOR dem Sprung, den er betrifft), Farbwechsel, Ende. Lange Wege werden hier in Schritte
 * zerlegt, die das Zielformat noch kodieren kann (DST ±121, JEF ±127, PEC ±2047); Zwischenziele werden ABSOLUT gerundet,
 * damit sich keine Rundungsfehler aufsummieren.
 *
 * ── Fadenschnitt ───────────────────────────────────────────────────────
 * Ein Sprung ab `schnittAbMm` mitten in einer Farbe bekommt einen Schnitt: Sonst bliebe ein Verbindungsfaden zwischen den
 * Buchstaben stehen, den man von Hand abschneiden müsste. Am Anfang einer Farbe schneidet der Farbwechsel selbst. Kurze
 * Sprünge (innerhalb eines Buchstabens) bleiben ohne Schnitt, vorn und hinten sichern Sicherungsstiche die Naht.
 */
import type { Stickplan } from './stickplan';

export type BefehlArt = 'stich' | 'sprung' | 'schnitt' | 'farbwechsel' | 'ende';

export interface Befehl {
  /** Absolute Position in 0,1 mm. */
  x: number;
  y: number;
  art: BefehlArt;
}

export interface Befehlsfolge {
  befehle: Befehl[];
  /** Garnfarben in der Reihenfolge der Farbblöcke (#rrggbb). */
  farben: string[];
  /** Umschließendes Rechteck aller Positionen in 0,1 mm (inkl. Ursprung). */
  grenzen: { minX: number; minY: number; maxX: number; maxY: number };
  schnitte: number;
}

export interface BefehlsOptionen {
  /** Größter Versatz je Achse und Eintrag, den das Format kodieren kann (0,1 mm). */
  maxSchritt: number;
  /** Sprünge ab dieser Länge (mm) mitten in einer Farbe bekommen einen Fadenschnitt. */
  schnittAbMm: number;
}

export function planZuBefehlen(plan: Stickplan, opt: BefehlsOptionen): Befehlsfolge {
  const befehle: Befehl[] = [];
  const farben: string[] = [];
  let px = 0;
  let py = 0;
  let schnitte = 0;
  const grenzen = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const merke = () => {
    grenzen.minX = Math.min(grenzen.minX, px);
    grenzen.maxX = Math.max(grenzen.maxX, px);
    grenzen.minY = Math.min(grenzen.minY, py);
    grenzen.maxY = Math.max(grenzen.maxY, py);
  };

  const bewege = (zx: number, zy: number, art: 'stich' | 'sprung') => {
    const dx = zx - px;
    const dy = zy - py;
    const schritte = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / opt.maxSchritt));
    const startX = px;
    const startY = py;
    for (let i = 1; i <= schritte; i++) {
      px = startX + Math.round((dx * i) / schritte);
      py = startY + Math.round((dy * i) / schritte);
      befehle.push({ x: px, y: py, art });
      merke();
    }
  };

  plan.bloecke.forEach((block, index) => {
    farben.push(block.hex);
    if (index > 0) befehle.push({ x: px, y: py, art: 'farbwechsel' });
    let hatStiche = false;
    for (const s of block.stiche) {
      const zx = Math.round(s.x * 10);
      const zy = Math.round(s.y * 10);
      if (s.art === 'sprung') {
        const weg = Math.hypot(zx - px, zy - py) / 10;
        if (hatStiche && weg >= opt.schnittAbMm) {
          befehle.push({ x: px, y: py, art: 'schnitt' });
          schnitte++;
        }
        bewege(zx, zy, 'sprung');
      } else {
        bewege(zx, zy, 'stich');
        hatStiche = true;
      }
    }
  });
  befehle.push({ x: px, y: py, art: 'ende' });
  return { befehle, farben, grenzen, schnitte };
}
