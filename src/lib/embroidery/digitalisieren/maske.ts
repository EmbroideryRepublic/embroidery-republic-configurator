/**
 * Rastermasken für die Digitalisierung: Zuschneiden, Farbebenen bilden, Vergrößern/Verkleinern, zusammenhängende Teile.
 *
 * Alles arbeitet auf einem Raster (Bildpunkte, x nach rechts, y nach unten); die Umrechnung in Millimeter übernimmt
 * der Aufrufer über `pxProMm`.
 */

export interface Raster {
  breite: number;
  hoehe: number;
  /** RGBA, 4 Bytes je Bildpunkt, nicht vormultipliziert. */
  rgba: Uint8Array;
}

export interface Maske {
  breite: number;
  hoehe: number;
  /** 1 = Garn, 0 = frei. */
  daten: Uint8Array;
}

export interface FarbEbene {
  /** "#rrggbb" */
  hex: string;
  maske: Maske;
  /** Anzahl der Bildpunkte dieser Farbe. */
  pixel: number;
}

export function neueMaske(breite: number, hoehe: number): Maske {
  return { breite, hoehe, daten: new Uint8Array(breite * hoehe) };
}

const ALPHA_SCHWELLE = 128;

export function hexVon(r: number, g: number, b: number): string {
  const z = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${z(r)}${z(g)}${z(b)}`;
}

/** Kleinstes Rechteck um alle (ausreichend deckenden) Bildpunkte; null = nichts sichtbar. */
export function tintenRahmen(raster: Raster): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = raster.breite;
  let y0 = raster.hoehe;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < raster.hoehe; y++) {
    for (let x = 0; x < raster.breite; x++) {
      if ((raster.rgba[(y * raster.breite + x) * 4 + 3] ?? 0) >= ALPHA_SCHWELLE) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** Schneidet das Raster auf den sichtbaren Teil zu (ohne Rand). Null, wenn nichts sichtbar ist. */
export function schneideZu(raster: Raster): Raster | null {
  const r = tintenRahmen(raster);
  if (!r) return null;
  const b = r.x1 - r.x0 + 1;
  const h = r.y1 - r.y0 + 1;
  const rgba = new Uint8Array(b * h * 4);
  for (let y = 0; y < h; y++) {
    const von = ((r.y0 + y) * raster.breite + r.x0) * 4;
    rgba.set(raster.rgba.subarray(von, von + b * 4), y * b * 4);
  }
  return { breite: b, hoehe: h, rgba };
}

/** Eine einfarbige Ebene aus dem Alphakanal (für Text: eine Garnfarbe). */
export function ebeneAusAlpha(raster: Raster, hex: string): FarbEbene {
  const maske = neueMaske(raster.breite, raster.hoehe);
  let pixel = 0;
  for (let i = 0; i < maske.daten.length; i++) {
    if ((raster.rgba[i * 4 + 3] ?? 0) >= ALPHA_SCHWELLE) {
      maske.daten[i] = 1;
      pixel++;
    }
  }
  return { hex, maske, pixel };
}

// ── Farbzerlegung für Logos ────────────────────────────────────────────

interface Behaelter {
  /** Index in der Histogramm-Liste. */
  eintraege: number[];
}

function abstand(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/**
 * Entfernt einen einfarbigen Hintergrund, der den Bildrand füllt (z. B. weißer Grund eines Logos ohne Transparenz):
 * Gestickt wird das Motiv, nicht sein Hintergrundrechteck. Gibt true zurück, wenn etwas entfernt wurde.
 */
export function entferneRandHintergrund(raster: Raster): boolean {
  const { breite: b, hoehe: h, rgba } = raster;
  const randIdx: number[] = [];
  for (let x = 0; x < b; x++) randIdx.push(x, (h - 1) * b + x);
  for (let y = 1; y < h - 1; y++) randIdx.push(y * b, y * b + b - 1);
  const deckend = randIdx.filter((i) => (rgba[i * 4 + 3] ?? 0) >= ALPHA_SCHWELLE);
  // Überwiegend transparent am Rand: es gibt keinen Hintergrund zu entfernen.
  if (deckend.length < randIdx.length * 0.6) return false;

  const zaehler = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (const i of deckend) {
    const schluessel = ((rgba[i * 4]! >> 4) << 8) | ((rgba[i * 4 + 1]! >> 4) << 4) | (rgba[i * 4 + 2]! >> 4);
    const e = zaehler.get(schluessel) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += rgba[i * 4]!;
    e.g += rgba[i * 4 + 1]!;
    e.b += rgba[i * 4 + 2]!;
    zaehler.set(schluessel, e);
  }
  let haeufigster: { n: number; r: number; g: number; b: number } | null = null;
  for (const e of zaehler.values()) if (!haeufigster || e.n > haeufigster.n) haeufigster = e;
  if (!haeufigster || haeufigster.n < deckend.length * 0.6) return false;
  const hg: [number, number, number] = [haeufigster.r / haeufigster.n, haeufigster.g / haeufigster.n, haeufigster.b / haeufigster.n];

  // Flutfüllung vom Rand aus über Bildpunkte, die dem Hintergrund ähneln.
  const besucht = new Uint8Array(b * h);
  const stapel: number[] = [];
  const ahnlich = (i: number) => (rgba[i * 4 + 3] ?? 0) >= ALPHA_SCHWELLE && abstand([rgba[i * 4]!, rgba[i * 4 + 1]!, rgba[i * 4 + 2]!], hg) <= 60;
  for (const i of randIdx) {
    if (!besucht[i] && ahnlich(i)) {
      besucht[i] = 1;
      stapel.push(i);
    }
  }
  let entfernt = 0;
  while (stapel.length) {
    const i = stapel.pop()!;
    rgba[i * 4 + 3] = 0;
    entfernt++;
    const x = i % b;
    const y = (i - x) / b;
    const nachbarn = [x > 0 ? i - 1 : -1, x < b - 1 ? i + 1 : -1, y > 0 ? i - b : -1, y < h - 1 ? i + b : -1];
    for (const n of nachbarn) {
      if (n >= 0 && !besucht[n] && ahnlich(n)) {
        besucht[n] = 1;
        stapel.push(n);
      }
    }
  }
  return entfernt > 0;
}

/**
 * Teilt ein farbiges Raster in höchstens `maxFarben` Garnfarben (Median-Cut auf einem 4-Bit-Histogramm), ordnet jeden
 * deckenden Bildpunkt der nächsten Farbe zu und gibt je Farbe eine Maske zurück. Seltene Farben (Kantenrauschen,
 * Verläufe) werden der nächstliegenden häufigen zugeschlagen. Reihenfolge: größte Fläche zuerst (Hintergrundflächen
 * werden zuerst gestickt, Details darüber).
 */
export function farbEbenen(raster: Raster, maxFarben: number): FarbEbene[] {
  const { breite: b, hoehe: h, rgba } = raster;
  const n = b * h;

  // Histogramm in 4 Bit je Kanal
  const behaelter = new Map<number, { n: number; r: number; g: number; b: number }>();
  let deckend = 0;
  for (let i = 0; i < n; i++) {
    if ((rgba[i * 4 + 3] ?? 0) < ALPHA_SCHWELLE) continue;
    deckend++;
    const r = rgba[i * 4]!;
    const g = rgba[i * 4 + 1]!;
    const bl = rgba[i * 4 + 2]!;
    const schluessel = ((r >> 4) << 8) | ((g >> 4) << 4) | (bl >> 4);
    const e = behaelter.get(schluessel) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += bl;
    behaelter.set(schluessel, e);
  }
  if (deckend === 0) return [];

  const eintraege = [...behaelter.entries()].map(([schluessel, e]) => ({
    schluessel,
    n: e.n,
    rgb: [e.r / e.n, e.g / e.n, e.b / e.n] as [number, number, number],
  }));

  // Median-Cut
  let boxen: Behaelter[] = [{ eintraege: eintraege.map((_, i) => i) }];
  const spannweite = (bx: Behaelter) => {
    let min = [255, 255, 255];
    let max = [0, 0, 0];
    for (const i of bx.eintraege) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k]!, eintraege[i]!.rgb[k]!);
        max[k] = Math.max(max[k]!, eintraege[i]!.rgb[k]!);
      }
    }
    const spanne = [max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!];
    const breitester = spanne[0]! >= spanne[1]! && spanne[0]! >= spanne[2]! ? 0 : spanne[1]! >= spanne[2]! ? 1 : 2;
    return { kanal: breitester, wert: spanne[breitester]! };
  };
  while (boxen.length < Math.max(1, maxFarben)) {
    let bestIndex = -1;
    let bestWert = 0;
    boxen.forEach((bx, idx) => {
      if (bx.eintraege.length < 2) return;
      const s = spannweite(bx);
      const gewicht = s.wert * bx.eintraege.reduce((summe, i) => summe + eintraege[i]!.n, 0);
      if (s.wert >= 16 && gewicht > bestWert) {
        bestWert = gewicht;
        bestIndex = idx;
      }
    });
    if (bestIndex < 0) break;
    const bx = boxen[bestIndex]!;
    const { kanal } = spannweite(bx);
    const sortiert = [...bx.eintraege].sort((a, c) => eintraege[a]!.rgb[kanal]! - eintraege[c]!.rgb[kanal]!);
    const gesamt = sortiert.reduce((summe, i) => summe + eintraege[i]!.n, 0);
    let laufend = 0;
    let schnitt = 1;
    for (let k = 0; k < sortiert.length - 1; k++) {
      laufend += eintraege[sortiert[k]!]!.n;
      schnitt = k + 1;
      if (laufend >= gesamt / 2) break;
    }
    boxen.splice(bestIndex, 1, { eintraege: sortiert.slice(0, schnitt) }, { eintraege: sortiert.slice(schnitt) });
  }

  // Palette = gewichtetes Mittel je Box; sehr ähnliche Farben zusammenlegen.
  let palette = boxen.map((bx) => {
    const gesamt = bx.eintraege.reduce((s, i) => s + eintraege[i]!.n, 0);
    const rgb: [number, number, number] = [0, 0, 0];
    for (const i of bx.eintraege) for (let k = 0; k < 3; k++) rgb[k] = rgb[k]! + eintraege[i]!.rgb[k]! * eintraege[i]!.n;
    return { rgb: [rgb[0] / gesamt, rgb[1] / gesamt, rgb[2] / gesamt] as [number, number, number], n: gesamt };
  });
  palette.sort((x, y) => y.n - x.n);
  const zusammen: typeof palette = [];
  for (const p of palette) {
    const naher = zusammen.find((q) => abstand(p.rgb, q.rgb) <= 48);
    if (naher) {
      const summe = naher.n + p.n;
      naher.rgb = [0, 1, 2].map((k) => (naher.rgb[k]! * naher.n + p.rgb[k]! * p.n) / summe) as [number, number, number];
      naher.n = summe;
    } else zusammen.push({ ...p });
  }
  palette = zusammen;

  // Jeden Histogrammeintrag der nächsten Palettenfarbe zuordnen
  const zuordnung = new Map<number, number>();
  for (const e of eintraege) {
    let best = 0;
    let bestAbstand = Infinity;
    palette.forEach((p, idx) => {
      const d = abstand(e.rgb, p.rgb);
      if (d < bestAbstand) {
        bestAbstand = d;
        best = idx;
      }
    });
    zuordnung.set(e.schluessel, best);
  }

  const ebenen: FarbEbene[] = palette.map((p) => ({ hex: hexVon(p.rgb[0], p.rgb[1], p.rgb[2]), maske: neueMaske(b, h), pixel: 0 }));
  for (let i = 0; i < n; i++) {
    if ((rgba[i * 4 + 3] ?? 0) < ALPHA_SCHWELLE) continue;
    const schluessel = ((rgba[i * 4]! >> 4) << 8) | ((rgba[i * 4 + 1]! >> 4) << 4) | (rgba[i * 4 + 2]! >> 4);
    const ebene = ebenen[zuordnung.get(schluessel) ?? 0]!;
    ebene.maske.daten[i] = 1;
    ebene.pixel++;
  }
  // Verschwindend kleine Farben (unter 0,4 % der Fläche) sind Kantenrauschen: verwerfen.
  return ebenen.filter((e) => e.pixel >= deckend * 0.004).sort((x, y) => y.pixel - x.pixel);
}

// ── Morphologie ────────────────────────────────────────────────────────

function scheibenOffsets(radius: number): Array<[number, number]> {
  const o: Array<[number, number]> = [];
  const r2 = radius * radius + 0.5;
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= r2) o.push([dx, dy]);
  return o;
}

/** Vergrößert die Maske um `radius` Bildpunkte (rund). */
export function dilatiere(maske: Maske, radius: number): Maske {
  if (radius <= 0) return { ...maske, daten: maske.daten.slice() };
  const { breite: b, hoehe: h } = maske;
  const aus = neueMaske(b, h);
  const offsets = scheibenOffsets(radius);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < b; x++) {
      if (!maske.daten[y * b + x]) continue;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < b && ny >= 0 && ny < h) aus.daten[ny * b + nx] = 1;
      }
    }
  }
  return aus;
}

/** Verkleinert die Maske um `radius` Bildpunkte (rund). Der Rand des Rasters zählt als frei. */
export function erodiere(maske: Maske, radius: number): Maske {
  if (radius <= 0) return { ...maske, daten: maske.daten.slice() };
  const { breite: b, hoehe: h } = maske;
  const aus = neueMaske(b, h);
  const offsets = scheibenOffsets(radius);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < b; x++) {
      if (!maske.daten[y * b + x]) continue;
      let alleGesetzt = true;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= b || ny < 0 || ny >= h || !maske.daten[ny * b + nx]) {
          alleGesetzt = false;
          break;
        }
      }
      if (alleGesetzt) aus.daten[y * b + x] = 1;
    }
  }
  return aus;
}

// ── Zusammenhängende Teile ─────────────────────────────────────────────

export interface Teil {
  id: number;
  pixel: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Schwerpunkt in Bildpunkten. */
  sx: number;
  sy: number;
}

/** Beschriftet die zusammenhängenden Teile (4er-Nachbarschaft); Beschriftung 0 = frei, Teile ab 1. */
export function teile(maske: Maske): { beschriftung: Int32Array; teile: Teil[] } {
  const { breite: b, hoehe: h, daten } = maske;
  const beschriftung = new Int32Array(b * h);
  const liste: Teil[] = [];
  const stapel: number[] = [];
  for (let start = 0; start < b * h; start++) {
    if (!daten[start] || beschriftung[start]) continue;
    const id = liste.length + 1;
    const t: Teil = { id, pixel: 0, x0: b, y0: h, x1: -1, y1: -1, sx: 0, sy: 0 };
    stapel.push(start);
    beschriftung[start] = id;
    while (stapel.length) {
      const i = stapel.pop()!;
      const x = i % b;
      const y = (i - x) / b;
      t.pixel++;
      t.sx += x;
      t.sy += y;
      if (x < t.x0) t.x0 = x;
      if (x > t.x1) t.x1 = x;
      if (y < t.y0) t.y0 = y;
      if (y > t.y1) t.y1 = y;
      if (x > 0 && daten[i - 1] && !beschriftung[i - 1]) (beschriftung[i - 1] = id), stapel.push(i - 1);
      if (x < b - 1 && daten[i + 1] && !beschriftung[i + 1]) (beschriftung[i + 1] = id), stapel.push(i + 1);
      if (y > 0 && daten[i - b] && !beschriftung[i - b]) (beschriftung[i - b] = id), stapel.push(i - b);
      if (y < h - 1 && daten[i + b] && !beschriftung[i + b]) (beschriftung[i + b] = id), stapel.push(i + b);
    }
    t.sx /= t.pixel;
    t.sy /= t.pixel;
    liste.push(t);
  }
  return { beschriftung, teile: liste };
}
