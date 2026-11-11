/**
 * Füllreihen (Tatami) aus einer Rastermaske.
 *
 * Statt Umrisse zu vektorisieren, wird die Maske zeilenweise abgetastet: Quer zur Stichrichtung laufen Reihen im
 * Abstand der Stichdichte, auf jeder Reihe entstehen "Läufe" – die Stücke, die innerhalb der Fläche liegen. Das
 * behandelt Löcher (Innenräume von o, a, e …) und Einschnürungen ohne Sonderfälle und ist bei 0,1 mm Raster
 * genauer als die Stichdichte (0,4 mm) selbst.
 *
 * Die Einstiche jeder Reihe sind gegenüber der Nachbarreihe versetzt (Drittelversatz), damit keine
 * durchgehenden Stichlinien quer durch die Fläche entstehen.
 */
import type { Maske } from './maske';

/** Punkt in Millimetern (Rasterkoordinaten: x nach rechts, y nach unten). */
export interface Pt {
  x: number;
  y: number;
}

export interface Rahmen {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Lauf {
  /** Stichpunkte in Stichrichtung (mm). */
  punkte: Pt[];
}

export interface Reihe {
  index: number;
  /** Läufe dieser Reihe in der Reihenfolge, in der sie gestickt werden. */
  laeufe: Lauf[];
}

export interface FuellOptionen {
  pxProMm: number;
  winkelGrad: number;
  abstandMm: number;
  maxStichMm: number;
  minLaufMm: number;
}

interface RohLauf {
  /** u-Koordinaten (Bildpunkte) von Anfang und Ende. */
  u0: number;
  u1: number;
}

interface Geometrie {
  cx: number;
  cy: number;
  c: number;
  s: number;
  umin: number;
  umax: number;
  vmin: number;
  vmax: number;
}

function geometrie(rahmen: Rahmen, winkelGrad: number): Geometrie {
  const rad = (winkelGrad * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const cx = (rahmen.x0 + rahmen.x1 + 1) / 2;
  const cy = (rahmen.y0 + rahmen.y1 + 1) / 2;
  let umin = Infinity;
  let umax = -Infinity;
  let vmin = Infinity;
  let vmax = -Infinity;
  for (const [x, y] of [
    [rahmen.x0, rahmen.y0],
    [rahmen.x1 + 1, rahmen.y0],
    [rahmen.x0, rahmen.y1 + 1],
    [rahmen.x1 + 1, rahmen.y1 + 1],
  ] as const) {
    const dx = x - cx;
    const dy = y - cy;
    const u = dx * c + dy * s;
    const v = -dx * s + dy * c;
    umin = Math.min(umin, u);
    umax = Math.max(umax, u);
    vmin = Math.min(vmin, v);
    vmax = Math.max(vmax, v);
  }
  return { cx, cy, c, s, umin, umax, vmin, vmax };
}

/** Tastet eine Reihe ab und liefert die Läufe (u-Bereiche), die innerhalb liegen. */
function tasteReihe(maske: Maske, beschriftung: Int32Array | null, id: number, g: Geometrie, v: number): RohLauf[] {
  const laeufe: RohLauf[] = [];
  let anfang: number | null = null;
  let zuletzt = 0;
  for (let u = Math.floor(g.umin); u <= Math.ceil(g.umax); u += 1) {
    const x = g.cx + u * g.c - v * g.s;
    const y = g.cy + u * g.s + v * g.c;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    let innen = false;
    if (ix >= 0 && ix < maske.breite && iy >= 0 && iy < maske.hoehe) {
      const i = iy * maske.breite + ix;
      innen = maske.daten[i] === 1 && (beschriftung === null || beschriftung[i] === id);
    }
    if (innen) {
      if (anfang === null) anfang = u;
      zuletzt = u;
    } else if (anfang !== null) {
      laeufe.push({ u0: anfang, u1: zuletzt });
      anfang = null;
    }
  }
  if (anfang !== null) laeufe.push({ u0: anfang, u1: zuletzt });
  return laeufe;
}

/**
 * Misst für einen Winkel die mittlere Lauflänge (mm): kurze Läufe heißen, dass die Reihen QUER zu schmalen Strichen
 * liegen – das ergibt satinähnliche Stiche über die Strichbreite statt langer Stiche entlang des Strichs.
 */
export function mittlereLauflaenge(maske: Maske, beschriftung: Int32Array | null, id: number, rahmen: Rahmen, pxProMm: number, winkelGrad: number): number {
  const g = geometrie(rahmen, winkelGrad);
  const abstandPx = 0.8 * pxProMm;
  let summe = 0;
  let anzahl = 0;
  for (let v = g.vmin + abstandPx / 2; v < g.vmax; v += abstandPx) {
    for (const l of tasteReihe(maske, beschriftung, id, g, v)) {
      summe += (l.u1 - l.u0 + 1) / pxProMm;
      anzahl++;
    }
  }
  return anzahl === 0 ? Infinity : summe / anzahl;
}

/** Wählt den Winkel: bei schmalen Strichen quer dazu (kurze Läufe), sonst die gängigen 45°. */
export function waehleWinkel(maske: Maske, beschriftung: Int32Array | null, id: number, rahmen: Rahmen, pxProMm: number): number {
  const kandidaten = [45, 0, 90, 135];
  let beste = 45;
  let besteLaenge = mittlereLauflaenge(maske, beschriftung, id, rahmen, pxProMm, 45);
  for (const w of kandidaten.slice(1)) {
    const laenge = mittlereLauflaenge(maske, beschriftung, id, rahmen, pxProMm, w);
    if (laenge < besteLaenge * 0.9) {
      besteLaenge = laenge;
      beste = w;
    }
  }
  // Nur wenn tatsächlich schmale Striche vorliegen, vom Standardwinkel abweichen.
  return besteLaenge <= 3.2 ? beste : 45;
}

/** Zerlegt einen Lauf der Länge `laenge` (mm) in Einstiche mit Versatzmuster. Gibt Positionen entlang des Laufs zurück. */
function unterteile(laenge: number, maxStichMm: number, reihenIndex: number): number[] {
  const phasen = [1, 1 / 3, 2 / 3];
  const erster = maxStichMm * phasen[reihenIndex % 3]!;
  const positionen = [0];
  for (let p = erster; p < laenge - 0.3; p += maxStichMm) {
    if (p > 0.3) positionen.push(p);
  }
  positionen.push(laenge);
  return positionen;
}

/**
 * Erzeugt die Füllreihen eines Teils (oder einer ganzen Maske, wenn `beschriftung` null ist).
 * Gerade Reihen laufen vorwärts, ungerade rückwärts (Zickzack ohne Sprünge).
 */
export function fuellReihen(maske: Maske, beschriftung: Int32Array | null, id: number, rahmen: Rahmen, opt: FuellOptionen): Reihe[] {
  const g = geometrie(rahmen, opt.winkelGrad);
  const abstandPx = opt.abstandMm * opt.pxProMm;
  const reihen: Reihe[] = [];
  let index = 0;
  for (let v = g.vmin + abstandPx / 2; v < g.vmax; v += abstandPx, index++) {
    const roh = tasteReihe(maske, beschriftung, id, g, v);
    if (roh.length === 0) continue;
    const rueckwaerts = index % 2 === 1;
    const geordnet = rueckwaerts ? [...roh].reverse() : roh;
    const laeufe: Lauf[] = [];
    for (const l of geordnet) {
      const laengeMm = (l.u1 - l.u0) / opt.pxProMm;
      if (laengeMm < opt.minLaufMm) continue;
      const positionen = unterteile(laengeMm, opt.maxStichMm, index);
      const punkte: Pt[] = positionen.map((p) => {
        const u = rueckwaerts ? l.u1 - p * opt.pxProMm : l.u0 + p * opt.pxProMm;
        const x = g.cx + u * g.c - v * g.s;
        const y = g.cy + u * g.s + v * g.c;
        return { x: x / opt.pxProMm, y: y / opt.pxProMm };
      });
      laeufe.push({ punkte });
    }
    if (laeufe.length > 0) reihen.push({ index, laeufe });
  }
  return reihen;
}
