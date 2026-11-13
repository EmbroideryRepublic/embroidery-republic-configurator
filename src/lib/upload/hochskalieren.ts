/**
 * Hochskalieren von Rasterbildern mit niedriger Auflösung (Logo-Upload, Button in der Qualitätsampel).
 *
 * ── Was das kann – und was nicht ──────────────────────────────────────
 * Beim Vergrößern entsteht KEIN neues Bilddetail: Ein 150-Pixel-Logo bleibt ein 150-Pixel-Logo, nur mit mehr Bildpunkten. Was das
 * Verfahren verbessert, ist die Darstellung der Kanten: Statt grober Treppenstufen oder weicher Unschärfe (wie bei einfachem
 * Vergrößern) entstehen glatte, klare Kanten. Das hilft bei Logos, Schriftzügen und Grafiken; ein verwaschenes Foto wird nicht
 * zum scharfen Foto. Die Oberfläche sagt das ausdrücklich (ElementToolbar) und zeigt weiter die ursprüngliche Auflösung an.
 *
 * ── Verfahren (reine Rechnung, ohne Browser – deshalb im Test prüfbar) ─
 *   1. Alpha vormultiplizieren: Transparente Ränder färben die Kante nicht dunkel.
 *   2. Bikubische Interpolation (Catmull-Rom, a = −0,5), getrennt in Zeilen und Spalten – glatte Verläufe, wenig Überschwingen.
 *   3. Unscharfmaskierung auf allen vier vormultiplizierten Kanälen: schärft Farbkanten UND die Deckkraft-Kante (Transparenz),
 *      begrenzt auf gültige Werte (Farbe ≤ Deckkraft).
 *   4. Rückrechnung auf nicht vormultipliziertes RGBA.
 * Speicherschonend: Die Zeilen der horizontalen Interpolation werden nur für die gerade gebrauchten Ausgabezeilen berechnet
 * (Ringpuffer); rechnet in Scheiben und gibt dem Browser dazwischen Luft (`pause`), damit die Oberfläche nicht einfriert.
 *
 * ── Grenzen (Server: lib/upload/pruefeUpload.ts, Bestellung: 15 MB Gesamtgröße) ──
 * Längste Kante nach dem Hochskalieren höchstens 3.000 px (Server erlaubt 8.000 px), Faktor 2 bis 4. Eine Datei, die das nicht
 * zuließe, wird gar nicht erst angeboten.
 */
import { OK_DPI } from '@/lib/canvas/logoQualitaet';

/** Längste Kante nach dem Hochskalieren. */
export const MAX_KANTE_PX = 3000;
/** Größter Vergrößerungsfaktor. */
export const MAX_FAKTOR = 4;
export const MIN_FAKTOR = 2;

export interface Hochskalierung {
  faktor: number;
  neueBreitePx: number;
  neueHoehePx: number;
  /** Rechnerische Auflösung danach (bei unveränderter Druckbreite). */
  erreichteDpi: number;
}

/**
 * Welcher Faktor reicht, um die optimale Auflösung (OK_DPI) zu erreichen – gedeckelt durch Faktor- und Kantengrenze.
 * `null`, wenn nichts zu tun ist (schon optimal) oder nichts Sinnvolles möglich ist (Bild schon zu groß für Faktor 2).
 */
export function waehleHochskalierung(p: { breitePx: number; hoehePx: number; dpi: number }): Hochskalierung | null {
  const { breitePx, hoehePx, dpi } = p;
  if (!(breitePx > 0) || !(hoehePx > 0) || !(dpi > 0) || dpi >= OK_DPI) return null;
  let faktor = Math.min(MAX_FAKTOR, Math.max(MIN_FAKTOR, Math.ceil(OK_DPI / dpi)));
  while (faktor >= MIN_FAKTOR && Math.max(breitePx, hoehePx) * faktor > MAX_KANTE_PX) faktor--;
  if (faktor < MIN_FAKTOR) return null;
  return { faktor, neueBreitePx: breitePx * faktor, neueHoehePx: hoehePx * faktor, erreichteDpi: dpi * faktor };
}

export interface Rgba {
  /** Nicht vormultipliziertes RGBA, Zeile für Zeile. */
  daten: Uint8ClampedArray;
  breite: number;
  hoehe: number;
}

export interface HochskalierOptionen {
  /** Stärke der Unscharfmaskierung (0 = keine). */
  schaerfe?: number;
  /** Wird in regelmäßigen Abständen aufgerufen, damit der Browser dazwischen zeichnen kann. */
  pause?: () => Promise<void>;
}

/** Standardstärke: am synthetischen Logo-Test gegen bikubisch/Nearest abgestimmt (siehe hochskalieren.test.ts). */
export const STANDARD_SCHAERFE = 0.6;

/** Catmull-Rom-Gewichte (a = −0,5) für die vier Stützstellen −1, 0, +1, +2 bei Bruchteil t. */
function catmullRom(t: number, aus: Float32Array, o: number): void {
  const t2 = t * t;
  const t3 = t2 * t;
  aus[o] = -0.5 * t3 + t2 - 0.5 * t;
  aus[o + 1] = 1.5 * t3 - 2.5 * t2 + 1;
  aus[o + 2] = -1.5 * t3 + 2 * t2 + 0.5 * t;
  aus[o + 3] = 0.5 * t3 - 0.5 * t2;
}

interface Achse {
  /** Erste Stützstelle (kann außerhalb liegen → geklemmt) je Ausgabekoordinate. */
  start: Int32Array;
  /** Vier Gewichte je Ausgabekoordinate. */
  gewicht: Float32Array;
}

function berechneAchse(ausgabe: number, quelle: number, faktor: number): Achse {
  const start = new Int32Array(ausgabe);
  const gewicht = new Float32Array(ausgabe * 4);
  for (let x = 0; x < ausgabe; x++) {
    const pos = (x + 0.5) / faktor - 0.5;
    const i = Math.floor(pos);
    start[x] = i - 1;
    catmullRom(pos - i, gewicht, x * 4);
  }
  void quelle;
  return { start, gewicht };
}

const klemme = (i: number, max: number) => (i < 0 ? 0 : i > max ? max : i);

const SCHEIBE_ZEILEN = 48;

export async function hochskaliereRgba(quelle: Rgba, faktor: number, opt: HochskalierOptionen = {}): Promise<Rgba> {
  const { breite: w, hoehe: h } = quelle;
  if (!Number.isInteger(faktor) || faktor < 1) throw new Error(`Ungültiger Faktor: ${faktor}`);
  if (quelle.daten.length !== w * h * 4) throw new Error('Pixeldaten passen nicht zu Breite und Höhe.');
  const pause = opt.pause ?? (async () => {});
  const schaerfe = opt.schaerfe ?? STANDARD_SCHAERFE;
  const W = w * faktor;
  const H = h * faktor;

  // 1. Vormultiplizieren (Float, 0–255).
  const vor = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = quelle.daten[i * 4 + 3]! / 255;
    vor[i * 4] = quelle.daten[i * 4]! * a;
    vor[i * 4 + 1] = quelle.daten[i * 4 + 1]! * a;
    vor[i * 4 + 2] = quelle.daten[i * 4 + 2]! * a;
    vor[i * 4 + 3] = quelle.daten[i * 4 + 3]!;
  }

  // 2. Bikubisch: horizontal je Quellzeile (Ringpuffer), vertikal je Ausgabezeile.
  const achseX = berechneAchse(W, w, faktor);
  const achseY = berechneAchse(H, h, faktor);
  const zeilenCache = new Map<number, Float32Array>();
  const horizontal = (zeile: number): Float32Array => {
    const z = klemme(zeile, h - 1);
    let r = zeilenCache.get(z);
    if (r) return r;
    r = new Float32Array(W * 4);
    const basis = z * w * 4;
    for (let x = 0; x < W; x++) {
      const s = achseX.start[x]!;
      const g = x * 4;
      const i0 = basis + klemme(s, w - 1) * 4;
      const i1 = basis + klemme(s + 1, w - 1) * 4;
      const i2 = basis + klemme(s + 2, w - 1) * 4;
      const i3 = basis + klemme(s + 3, w - 1) * 4;
      const g0 = achseX.gewicht[g]!, g1 = achseX.gewicht[g + 1]!, g2 = achseX.gewicht[g + 2]!, g3 = achseX.gewicht[g + 3]!;
      for (let c = 0; c < 4; c++) r[x * 4 + c] = vor[i0 + c]! * g0 + vor[i1 + c]! * g1 + vor[i2 + c]! * g2 + vor[i3 + c]! * g3;
    }
    zeilenCache.set(z, r);
    return r;
  };

  /** Vormultiplizierte Ausgabe (0–255, geklemmt, Farbe ≤ Deckkraft). */
  const A = new Uint8ClampedArray(W * H * 4);
  for (let Y = 0; Y < H; Y++) {
    const s = achseY.start[Y]!;
    const g = Y * 4;
    const z0 = horizontal(s), z1 = horizontal(s + 1), z2 = horizontal(s + 2), z3 = horizontal(s + 3);
    const g0 = achseY.gewicht[g]!, g1 = achseY.gewicht[g + 1]!, g2 = achseY.gewicht[g + 2]!, g3 = achseY.gewicht[g + 3]!;
    const o = Y * W * 4;
    for (let i = 0; i < W * 4; i++) A[o + i] = z0[i]! * g0 + z1[i]! * g1 + z2[i]! * g2 + z3[i]! * g3;
    // Zeilen, die kein Ausgabezeilen mehr braucht, aus dem Zwischenspeicher nehmen.
    const frei = klemme(s - 1, h - 1);
    for (const k of zeilenCache.keys()) if (k < frei) zeilenCache.delete(k);
    if (Y % SCHEIBE_ZEILEN === 0) await pause();
  }

  // 3. Unscharfmaskierung auf den vormultiplizierten Kanälen (Box-Weichzeichner, zwei getrennte Durchgänge).
  if (schaerfe > 0) {
    const radius = Math.max(1, Math.min(3, Math.round(faktor * 0.5)));
    const B = new Uint8ClampedArray(W * H * 4);
    const zeile = new Float32Array(Math.max(W, H));
    const fenster = radius * 2 + 1;
    // horizontal: A → B
    for (let Y = 0; Y < H; Y++) {
      const o = Y * W * 4;
      for (let c = 0; c < 4; c++) {
        let summe = 0;
        for (let k = -radius; k <= radius; k++) summe += A[o + klemme(k, W - 1) * 4 + c]!;
        for (let x = 0; x < W; x++) {
          B[o + x * 4 + c] = summe / fenster;
          summe += A[o + klemme(x + radius + 1, W - 1) * 4 + c]! - A[o + klemme(x - radius, W - 1) * 4 + c]!;
        }
      }
      if (Y % SCHEIBE_ZEILEN === 0) await pause();
    }
    // vertikal: B → Weichzeichnung, sofort verrechnet in A
    for (let x = 0; x < W; x++) {
      for (let c = 0; c < 4; c++) {
        for (let Y = 0; Y < H; Y++) zeile[Y] = B[(Y * W + x) * 4 + c]!;
        let summe = 0;
        for (let k = -radius; k <= radius; k++) summe += zeile[klemme(k, H - 1)]!;
        for (let Y = 0; Y < H; Y++) {
          const idx = (Y * W + x) * 4 + c;
          const p = A[idx]!;
          const weich = summe / fenster;
          A[idx] = p + schaerfe * (p - weich);
          summe += zeile[klemme(Y + radius + 1, H - 1)]! - zeile[klemme(Y - radius, H - 1)]!;
        }
      }
      if (x % (SCHEIBE_ZEILEN * 2) === 0) await pause();
    }
  }

  // 4. Zurück auf nicht vormultipliziertes RGBA (Farbe darf die Deckkraft nicht übersteigen).
  for (let i = 0; i < W * H; i++) {
    const a = A[i * 4 + 3]!;
    if (a === 0) {
      A[i * 4] = 0;
      A[i * 4 + 1] = 0;
      A[i * 4 + 2] = 0;
      continue;
    }
    if (a < 255) {
      const f = 255 / a;
      A[i * 4] = Math.min(255, Math.min(A[i * 4]!, a) * f);
      A[i * 4 + 1] = Math.min(255, Math.min(A[i * 4 + 1]!, a) * f);
      A[i * 4 + 2] = Math.min(255, Math.min(A[i * 4 + 2]!, a) * f);
    }
  }
  return { daten: A, breite: W, hoehe: H };
}
