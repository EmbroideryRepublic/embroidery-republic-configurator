/**
 * Freistellen eines Logos von einem EINFARBIGEN (oder sanft verlaufenden) Hintergrund – reine Pixelrechnung ohne Browser-Bezug, damit sie in Tests
 * Pixel für Pixel geprüft werden kann. Die Browser-Anbindung (Canvas, Data-URL) steht in backgroundRemoval.ts.
 *
 * ── Warum neu (Betreiberwunsch 2026-11-27: „funktioniert sehr schlecht“) ───────────────────────────────────────────
 * Die frühere Fassung (bis 2026-11-27) flutete vom Rand aus und verglich jeden Schritt nur mit dem NACHBARPIXEL. Das hatte drei Folgen:
 *   1. Der Hintergrund „kroch“ über weiche Kantenverläufe ins Motiv (hellere Motivteile, JPEG-Kanten, hochgerechnete Bilder).
 *   2. Die weiche Kante (Alpha) wurde aus dem Unterschied zweier Nachbarpixel geschätzt, nicht aus dem Abstand zum Hintergrund – das ergab
 *      willkürliche Transparenz an den Rändern.
 *   3. Der helle Saum der Kantenpixel (Mischfarbe aus Motiv und Weiß) blieb stehen: auf dunklem Textil ein weißer Rand um das Motiv.
 *
 * ── So rechnet die neue Fassung ─────────────────────────────────────────────────────────────────────────────────────
 *   1. HINTERGRUND SCHÄTZEN. Häufigste Farbe am Bildrand (bei verlaufenden Hintergründen: ein glattes Modell aus den vier Rändern).
 *      Passt der Rand nicht zu einem einfarbigen/sanft verlaufenden Hintergrund (Foto, Muster), wird NICHT freigestellt
 *      (`HintergrundNichtEinfarbig`) – lieber ehrlich ablehnen als das Motiv zerstören.
 *   2. KERN. Vom Rand aus werden nur Pixel entfernt, deren ABSTAND ZUM HINTERGRUND klein ist (nicht der zum Nachbarn) und die mit dem Rand
 *      zusammenhängen (4er-Nachbarschaft: kein Durchsickern durch diagonale Lücken). Dadurch kann der Hintergrund nicht ins Motiv kriechen.
 *      Eine zweite, vorsichtige Stufe nimmt das Rauschen um das Motiv mit (JPEG-Flimmern), aber nie Pixel direkt neben kräftigen Motivfarben.
 *   3. KANTE. Die Pixel direkt am Kern sind Mischungen aus Motiv und Hintergrund. Für jedes wird die reine Motivfarbe aus dem Inneren
 *      fortgeführt, daraus der Deckungsgrad (Alpha) berechnet und die Farbe durch die Motivfarbe ersetzt – kein heller Saum mehr.
 *   4. AUFRÄUMEN. Winzige, kontrastarme Einzelpunkte im freigestellten Bereich (Kompressionsrauschen) werden entfernt.
 *
 * Bewusste Grenzen: Eingeschlossene Flächen in der Hintergrundfarbe (Innenflächen von O, A, B oder weißer Text im farbigen Kasten) bleiben
 * erhalten – ob sie Hintergrund oder Motiv sind, lässt sich aus den Pixeln nicht entscheiden, und zerstörte Motive sind schlimmer als eine
 * stehengebliebene Innenfläche. Bilder, die schon Transparenz haben, werden unverändert zurückgegeben.
 */

/** Der Rand ist weder einfarbig noch sanft verlaufend, oder es bleibt kein Hintergrund/Motiv übrig – es wird nichts verändert. */
export class HintergrundNichtEinfarbig extends Error {
  constructor(public readonly grund: 'nicht-einfarbig' | 'kein-hintergrund' | 'kein-motiv' | 'zu-klein') {
    super(
      grund === 'nicht-einfarbig'
        ? 'Der Hintergrund ist nicht einfarbig.'
        : grund === 'kein-hintergrund'
          ? 'Es wurde kein Hintergrund am Bildrand gefunden.'
          : grund === 'kein-motiv'
            ? 'Nach dem Freistellen bliebe kein Motiv übrig.'
            : 'Das Bild ist zu klein.'
    );
    this.name = 'HintergrundNichtEinfarbig';
  }
}

export interface FreistellErgebnis {
  /** Neues RGBA-Feld in der Größe der Eingabe (die Eingabe bleibt unverändert). */
  rgba: Uint8ClampedArray;
  /** Anteil der Pixel, die jetzt vollständig transparent sind (0–1). */
  entfernterAnteil: number;
  /** true = das Bild hatte schon Transparenz und wurde unverändert zurückgegeben. */
  schonFrei: boolean;
}

export interface FreistellOptionen {
  /**
   * Eingeschlossene Flächen in der Hintergrundfarbe (Innenräume von O, A, B, R …):
   *   'auto' (Standard) – nur bei kleinen Formen (Buchstaben) entfernen; große Formen (Kasten, Kreis, Abzeichen) behalten ihre weißen Flächen
   *   'alle'            – jede eingeschlossene Fläche in Hintergrundfarbe entfernen (für Schriftzüge, deren Buchstaben sich berühren)
   */
  innenflaechen?: 'auto' | 'alle';
  /**
   * War das Bild vorher hochgerechnet (lib/upload/hochskalieren.ts), sind die Kantenverläufe um diesen Faktor breiter – der Kantenstreifen,
   * in dem Motiv- und Hintergrundfarbe getrennt werden, wächst mit.
   */
  hochskaliertFaktor?: number;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Euklidischer Farbabstand im RGB-Raum (0 … 441). */
function abstand(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Laufender Median über ein Fenster – unempfindlich gegen Motivpixel, die den Rand berühren. */
function glatteRandlinie(werte: Float32Array, fenster: number): Float32Array {
  const n = werte.length;
  const aus = new Float32Array(n);
  const halb = Math.max(1, fenster >> 1);
  const puffer: number[] = [];
  for (let i = 0; i < n; i++) {
    puffer.length = 0;
    const von = Math.max(0, i - halb);
    const bis = Math.min(n - 1, i + halb);
    for (let j = von; j <= bis; j++) puffer.push(werte[j]!);
    puffer.sort((a, b) => a - b);
    aus[i] = puffer[puffer.length >> 1]!;
  }
  return aus;
}

export function freistelle(src: Uint8ClampedArray, w: number, h: number, optionen: FreistellOptionen = {}): FreistellErgebnis {
  if (w < 4 || h < 4) throw new HintergrundNichtEinfarbig('zu-klein');
  const N = w * h;

  // ── 0. Schon transparent? Dann gibt es nichts freizustellen. ─────────────────────────────────────────────────
  let durchsichtig = 0;
  for (let i = 0; i < N; i++) if (src[i * 4 + 3]! < 128) durchsichtig++;
  if (durchsichtig > N * 0.02) return { rgba: new Uint8ClampedArray(src), entfernterAnteil: 0, schonFrei: true };

  // ── 1. Hintergrund am Rand schätzen ──────────────────────────────────────────────────────────────────────────
  const rand: number[] = [];
  for (let x = 0; x < w; x++) rand.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) rand.push(y * w, y * w + (w - 1));
  const P = rand.length;

  const histogramm = new Map<number, number>();
  for (const idx of rand) {
    const o = idx * 4;
    const schluessel = ((src[o]! >> 3) << 10) | ((src[o + 1]! >> 3) << 5) | (src[o + 2]! >> 3);
    histogramm.set(schluessel, (histogramm.get(schluessel) ?? 0) + 1);
  }
  let bestKey = 0;
  let bestN = -1;
  for (const [k, n] of histogramm) {
    if (n > bestN) {
      bestN = n;
      bestKey = k;
    }
  }
  const mr = ((bestKey >> 10) & 31) * 8 + 4;
  const mg = ((bestKey >> 5) & 31) * 8 + 4;
  const mb = (bestKey & 31) * 8 + 4;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sn = 0;
  for (const idx of rand) {
    const o = idx * 4;
    if (abstand(src[o]!, src[o + 1]!, src[o + 2]!, mr, mg, mb) <= 40) {
      sr += src[o]!;
      sg += src[o + 1]!;
      sb += src[o + 2]!;
      sn++;
    }
  }
  const c0r = sn > 0 ? sr / sn : mr;
  const c0g = sn > 0 ? sg / sn : mg;
  const c0b = sn > 0 ? sb / sn : mb;
  let nahe = 0;
  let mittel = 0;
  for (const idx of rand) {
    const o = idx * 4;
    const d = abstand(src[o]!, src[o + 1]!, src[o + 2]!, c0r, c0g, c0b);
    if (d <= 24) nahe++;
    else if (d <= 60) mittel++;
  }
  // Einfarbig: Die meisten Randpixel haben die Hauptfarbe, und die übrigen sind entweder wenige oder weit davon entfernt (Motiv, das den Rand
  // berührt). Ein VERLAUF dagegen hat viele Randpixel in „mittlerem“ Abstand zur Hauptfarbe – dafür gibt es das glatte Randmodell.
  const einfarbig = nahe / P >= 0.9 || (nahe / P >= 0.3 && mittel / P <= 0.05);

  // Verlaufender Hintergrund: glattes Modell aus den vier Rändern (Coons-Fläche), Ränder per Median von Motivpixeln befreit.
  let oben: [Float32Array, Float32Array, Float32Array] | null = null;
  let unten: [Float32Array, Float32Array, Float32Array] | null = null;
  let links: [Float32Array, Float32Array, Float32Array] | null = null;
  let rechts: [Float32Array, Float32Array, Float32Array] | null = null;
  if (!einfarbig) {
    const linie = (laenge: number, index: (i: number) => number): [Float32Array, Float32Array, Float32Array] => {
      const kanaele: [Float32Array, Float32Array, Float32Array] = [new Float32Array(laenge), new Float32Array(laenge), new Float32Array(laenge)];
      for (let i = 0; i < laenge; i++) {
        const o = index(i) * 4;
        kanaele[0][i] = src[o]!;
        kanaele[1][i] = src[o + 1]!;
        kanaele[2][i] = src[o + 2]!;
      }
      const fenster = Math.max(9, Math.round(laenge / 12));
      return [glatteRandlinie(kanaele[0], fenster), glatteRandlinie(kanaele[1], fenster), glatteRandlinie(kanaele[2], fenster)];
    };
    oben = linie(w, (x) => x);
    unten = linie(w, (x) => (h - 1) * w + x);
    links = linie(h, (y) => y * w);
    rechts = linie(h, (y) => y * w + (w - 1));
  }
  // Hintergrundfarbe an (x, y) – Ergebnis in `bg`.
  const bg: [number, number, number] = [c0r, c0g, c0b];
  const hintergrundAn = (x: number, y: number) => {
    if (einfarbig) return;
    const u = w > 1 ? x / (w - 1) : 0;
    const v = h > 1 ? y / (h - 1) : 0;
    for (let c = 0; c < 3; c++) {
      const o = oben![c]!;
      const un = unten![c]!;
      const l = links![c]!;
      const r = rechts![c]!;
      bg[c] =
        (1 - v) * o[x]! + v * un[x]! + (1 - u) * l[y]! + u * r[y]! -
        ((1 - u) * (1 - v) * o[0]! + u * (1 - v) * o[w - 1]! + (1 - u) * v * un[0]! + u * v * un[w - 1]!);
    }
  };

  // Abstand jedes Pixels zum (örtlichen) Hintergrund.
  const dist = new Float32Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;
      hintergrundAn(x, y);
      dist[i] = abstand(src[o]!, src[o + 1]!, src[o + 2]!, bg[0], bg[1], bg[2]);
    }
  }

  // Passt der Rand zum Hintergrundmodell? Sonst ist es ein Foto/Muster → ablehnen.
  let passend = 0;
  let quadrat = 0;
  let inlier = 0;
  for (const idx of rand) {
    if (dist[idx]! <= 30) passend++;
    if (dist[idx]! <= 24) {
      quadrat += dist[idx]! * dist[idx]!;
      inlier++;
    }
  }
  if (passend / P < (einfarbig ? 0.6 : 0.7)) throw new HintergrundNichtEinfarbig('nicht-einfarbig');
  const rauschen = inlier > 0 ? Math.sqrt(quadrat / inlier) : 0;
  // Schwelle für „ist Hintergrund“: mehrfaches Rauschen des Randes, nie so klein, dass JPEG-Flimmern stehenbleibt, nie so groß, dass helle Motivteile fallen.
  const tNah = clamp(3 * rauschen + 4, 10, 32);
  const tMittel = Math.min(48, tNah * 2);

  // ── 2. Kern: zusammenhängend mit dem Rand, Abstand zum Hintergrund klein ───────────────────────────────────────
  const kern = new Uint8Array(N); // 1 = Hintergrund
  const schlange = new Int32Array(N);
  let kopf = 0;
  let ende = 0;
  for (const idx of rand) {
    if (dist[idx]! <= tNah && !kern[idx]) {
      kern[idx] = 1;
      schlange[ende++] = idx;
    }
  }
  if (ende === 0) throw new HintergrundNichtEinfarbig('kein-hintergrund');
  while (kopf < ende) {
    const p = schlange[kopf++]!;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0 && !kern[p - 1] && dist[p - 1]! <= tNah) {
      kern[p - 1] = 1;
      schlange[ende++] = p - 1;
    }
    if (x < w - 1 && !kern[p + 1] && dist[p + 1]! <= tNah) {
      kern[p + 1] = 1;
      schlange[ende++] = p + 1;
    }
    if (y > 0 && !kern[p - w] && dist[p - w]! <= tNah) {
      kern[p - w] = 1;
      schlange[ende++] = p - w;
    }
    if (y < h - 1 && !kern[p + w] && dist[p + w]! <= tNah) {
      kern[p + w] = 1;
      schlange[ende++] = p + w;
    }
  }
  if (ende < N * 0.0005) throw new HintergrundNichtEinfarbig('kein-hintergrund');

  // Zweite, vorsichtige Stufe: Flimmern (Kompressionsrauschen) um das Motiv. Aufgenommen wird nur, was kontrastarm ist UND nicht neben einer
  // kräftigen Motivfarbe liegt – Kantenpixel des Motivs bleiben für die Kantenberechnung unten erhalten.
  const nachbarMax = (x: number, y: number) => {
    let m = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= w) continue;
        const d = dist[yy * w + xx]!;
        if (d > m) m = d;
      }
    }
    return m;
  };
  for (let runde = 0; runde < 5; runde++) {
    let neu = 0;
    const kandidaten: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (kern[i] || dist[i]! > tMittel) continue;
        const anKern = (x > 0 && kern[i - 1]) || (x < w - 1 && kern[i + 1]) || (y > 0 && kern[i - w]) || (y < h - 1 && kern[i + w]);
        if (anKern && nachbarMax(x, y) <= tMittel + 8) kandidaten.push(i);
      }
    }
    for (const i of kandidaten) {
      kern[i] = 1;
      neu++;
    }
    if (neu === 0) break;
  }

  // Sanfte Verläufe im Hintergrund (Vignette mit hellem Zentrum, Schatten): Das Randmodell trifft die Mitte nicht genau. Der Hintergrund darf deshalb
  // über SEHR sanfte Übergänge weiterkriechen (Schritt zum Nachbarpixel höchstens 4 je Kanal) – Motivkanten sind immer steiler. Je einfarbiger der
  // Rand, desto kürzer die Leine (Abstand zum Hintergrundmodell höchstens 60, bei verlaufendem Hintergrund 90).
  {
    const kriechGrenze = einfarbig ? 60 : 90;
    kopf = 0;
    ende = 0;
    for (let i = 0; i < N; i++) {
      if (!kern[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      if ((x > 0 && !kern[i - 1]) || (x < w - 1 && !kern[i + 1]) || (y > 0 && !kern[i - w]) || (y < h - 1 && !kern[i + w])) schlange[ende++] = i;
    }
    const sanft = (p: number, q: number) =>
      Math.abs(src[p * 4]! - src[q * 4]!) <= 4 && Math.abs(src[p * 4 + 1]! - src[q * 4 + 1]!) <= 4 && Math.abs(src[p * 4 + 2]! - src[q * 4 + 2]!) <= 4;
    while (kopf < ende) {
      const p = schlange[kopf++]!;
      const x = p % w;
      const y = (p - x) / w;
      const nachbarn = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nachbarn) {
        if (q < 0 || kern[q] || dist[q]! > kriechGrenze || !sanft(p, q)) continue;
        kern[q] = 1;
        schlange[ende++] = q;
      }
    }
  }

  // Eingeschlossene Flächen in der Hintergrundfarbe („Innenflächen“): Sie hängen nicht mit dem Rand zusammen und blieben bisher stehen. Ob eine
  // Innenfläche Hintergrund ist (Innenraum von B, A, R, O …) oder Motiv (weißer Text im farbigen Kasten), steht in den Pixeln nicht – entschieden
  // wird nach der Größe der umgebenden Form: Gehört die Innenfläche zu einer Form, die nur einen kleinen Teil des Motivs ausmacht (ein Buchstabe),
  // ist sie Hintergrund; gehört sie zu einer großen Form (Kasten, Kreis, Abzeichen), ist sie Gestaltung und bleibt. Bewusst vorsichtig.
  entferneInnenflaechen(kern, dist, tMittel, w, h, schlange, optionen.innenflaechen === 'alle');

  // ── 3. Kantenstreifen: Abstand zum Kern in Ringen (8er-Nachbarschaft) ────────────────────────────────────────────
  const longSide = Math.max(w, h);
  const faktor = Math.max(1, Math.round(optionen.hochskaliertFaktor ?? 1));
  const R = Math.min(12, clamp(Math.round(longSide / 500) + 1, 2, 6) * faktor);
  const ring = new Uint8Array(N).fill(255); // 0 = Kern, 1…R = Kantenring, 255 = Motivinneres
  ende = 0;
  kopf = 0;
  for (let i = 0; i < N; i++) if (kern[i]) ring[i] = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (kern[i]) continue;
      let anKern = false;
      for (let dy = -1; dy <= 1 && !anKern; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          if (kern[yy * w + xx]) {
            anKern = true;
            break;
          }
        }
      }
      if (anKern) {
        ring[i] = 1;
        schlange[ende++] = i;
      }
    }
  }
  while (kopf < ende) {
    const p = schlange[kopf++]!;
    const k = ring[p]!;
    if (k >= R) continue;
    const x = p % w;
    const y = (p - x) / w;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= w) continue;
        const q = yy * w + xx;
        if (ring[q] === 255 && !kern[q]) {
          ring[q] = k + 1;
          schlange[ende++] = q;
        }
      }
    }
  }
  const ringAnzahl = ende; // schlange[0 … ringAnzahl) = alle Ringpixel, nach Ring aufsteigend sortiert

  // Reine Motivfarbe je Ringpixel: von innen nach außen fortgeführt (Mittel der weiter innen liegenden Nachbarn).
  const farbe = new Uint8ClampedArray(N * 3);
  // Pixel ohne weiter innen liegenden Nachbarn (Mitte eines dünnen Strichs): Ihre Farbe ist die einzige, die es gibt – kein Entmischen, voll deckend.
  const ohneInneres = new Uint8Array(N);
  const farbeAn = (q: number, kanal: number) => (ring[q] === 255 ? src[q * 4 + kanal]! : farbe[q * 3 + kanal]!);
  for (let j = ringAnzahl - 1; j >= 0; j--) {
    const p = schlange[j]!;
    const k = ring[p]!;
    const x = p % w;
    const y = (p - x) / w;
    let fr = 0;
    let fg = 0;
    let fb = 0;
    let n = 0;
    let besterAbstand = -1;
    let br = src[p * 4]!;
    let bgn = src[p * 4 + 1]!;
    let bb = src[p * 4 + 2]!;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= w) continue;
        const q = yy * w + xx;
        if (kern[q]) continue;
        // Nur kräftige Motivfarben fortführen: Eingeschlossene Flächen in Hintergrundfarbe (Innenfläche eines weißen Buchstabens im Kasten) würden
        // die Farbe sonst Richtung Weiß ziehen und dünne Striche ausbleichen.
        if (ring[q]! > k && (ring[q] !== 255 || dist[q]! > tMittel * 1.5)) {
          fr += farbeAn(q, 0);
          fg += farbeAn(q, 1);
          fb += farbeAn(q, 2);
          n++;
        }
        // Rückfall für dünne Linien (kein Nachbar weiter innen): das kräftigste Pixel der Umgebung.
        if (ring[q]! >= k && dist[q]! > besterAbstand) {
          besterAbstand = dist[q]!;
          br = src[q * 4]!;
          bgn = src[q * 4 + 1]!;
          bb = src[q * 4 + 2]!;
        }
      }
    }
    if (n > 0) {
      farbe[p * 3] = fr / n;
      farbe[p * 3 + 1] = fg / n;
      farbe[p * 3 + 2] = fb / n;
    } else {
      farbe[p * 3] = br;
      farbe[p * 3 + 1] = bgn;
      farbe[p * 3 + 2] = bb;
      ohneInneres[p] = 1;
    }
  }

  // ── Ausgabe: Kern transparent, Kantenpixel entmischt ────────────────────────────────────────────────────────────
  const aus = new Uint8ClampedArray(src);
  for (let i = 0; i < N; i++) if (kern[i]) aus[i * 4 + 3] = 0;
  for (let j = 0; j < ringAnzahl; j++) {
    const p = schlange[j]!;
    if (ohneInneres[p]) continue;
    const x = p % w;
    const y = (p - x) / w;
    hintergrundAn(x, y);
    const fr = farbe[p * 3]!;
    const fg = farbe[p * 3 + 1]!;
    const fb = farbe[p * 3 + 2]!;
    const fx = fr - bg[0];
    const fy = fg - bg[1];
    const fz = fb - bg[2];
    const ff = fx * fx + fy * fy + fz * fz;
    // Motivfarbe fast gleich dem Hintergrund (sehr helles Motiv): nicht trennbar – Pixel unverändert lassen.
    if (ff < 30 * 30) continue;
    const o = p * 4;
    const a = clamp(((src[o]! - bg[0]) * fx + (src[o + 1]! - bg[1]) * fy + (src[o + 2]! - bg[2]) * fz) / ff, 0, 1);
    if (a >= 0.96) continue; // praktisch voll deckend: Originalfarbe behalten
    if (a <= 0.04) {
      aus[o + 3] = 0;
      continue;
    }
    aus[o] = fr;
    aus[o + 1] = fg;
    aus[o + 2] = fb;
    aus[o + 3] = Math.round(a * 255);
  }

  // Helle Einzelpixel am Rand (Flimmern, Eckpixel): kaum vom Hintergrund unterscheidbar und fast nur von Transparenz umgeben → weg.
  {
    const frei = (q: number) => aus[q * 4 + 3]! < 40;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (aus[i * 4 + 3]! < 40 || dist[i]! > 70) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && frei(i + dy * w + dx)) n++;
        if (n >= 6) aus[i * 4 + 3] = 0;
      }
    }
  }

  // ── 4. Aufräumen: winzige, kontrastarme Einzelpunkte im freigestellten Bereich ─────────────────────────────────
  // Jede zusammenhängende sichtbare Fläche (8er-Nachbarschaft) wird genau einmal durchlaufen. Klein UND (winzig ODER kaum vom Hintergrund
  // abgesetzt) = Kompressionsrauschen und wird entfernt; alles andere ist Motiv (auch kleine Punkte wie der i-Punkt, solange sie kräftig sind).
  const gesehen = new Uint8Array(N);
  const maxPunkt = Math.max(12, Math.round(N * 0.0002));
  for (let start = 0; start < N; start++) {
    if (gesehen[start] || aus[start * 4 + 3]! === 0) continue;
    let k = 0;
    let e = 0;
    let maxDist = 0;
    schlange[e++] = start;
    gesehen[start] = 1;
    while (k < e) {
      const p = schlange[k++]!;
      if (dist[p]! > maxDist) maxDist = dist[p]!;
      const x = p % w;
      const y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const q = yy * w + xx;
          if (!gesehen[q] && aus[q * 4 + 3]! !== 0) {
            gesehen[q] = 1;
            schlange[e++] = q;
          }
        }
      }
    }
    if (e <= maxPunkt && (e <= 12 || maxDist <= 60)) {
      for (let j = 0; j < e; j++) aus[schlange[j]! * 4 + 3] = 0;
    }
  }

  let weg = 0;
  for (let i = 0; i < N; i++) if (aus[i * 4 + 3]! === 0) weg++;
  if (weg > N * 0.995) throw new HintergrundNichtEinfarbig('kein-motiv');
  return { rgba: aus, entfernterAnteil: weg / N, schonFrei: false };
}

/**
 * Macht eingeschlossene Flächen in Hintergrundfarbe zu Hintergrund, sofern sie zu einer KLEINEN Form gehören (siehe Aufruf). Verändert `kern`.
 * `puffer` ist ein Arbeitsfeld der Größe w·h (die Warteschlange des Aufrufers), sein Inhalt ist danach unbrauchbar.
 */
function entferneInnenflaechen(kern: Uint8Array, dist: Float32Array, schwelle: number, w: number, h: number, puffer: Int32Array, alle: boolean) {
  const N = w * h;
  // Etikett: > 0 = Form (8er-Nachbarschaft), < 0 = Innenfläche (4er-Nachbarschaft), 0 = Kern/unbesucht.
  const etikett = new Int32Array(N);
  const istInnen = (i: number) => dist[i]! <= schwelle;
  const formFlaeche: number[] = [0];
  const innenFlaeche: number[] = [0];
  let formen = 0;
  let innen = 0;

  for (let start = 0; start < N; start++) {
    if (kern[start] || etikett[start]) continue;
    if (istInnen(start)) {
      innen++;
      const id = -innen;
      let k = 0;
      let e = 0;
      puffer[e++] = start;
      etikett[start] = id;
      while (k < e) {
        const p = puffer[k++]!;
        const x = p % w;
        const y = (p - x) / w;
        const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
        for (const q of nb) {
          if (q < 0 || kern[q] || etikett[q] || !istInnen(q)) continue;
          etikett[q] = id;
          puffer[e++] = q;
        }
      }
      innenFlaeche.push(e);
    } else {
      formen++;
      const id = formen;
      let k = 0;
      let e = 0;
      puffer[e++] = start;
      etikett[start] = id;
      while (k < e) {
        const p = puffer[k++]!;
        const x = p % w;
        const y = (p - x) / w;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            const q = yy * w + xx;
            if (kern[q] || etikett[q] || istInnen(q)) continue;
            etikett[q] = id;
            puffer[e++] = q;
          }
        }
      }
      formFlaeche.push(e);
    }
  }
  if (innen === 0) return;

  // Welche Form(en) berühren jede Innenfläche (4er-Nachbarschaft)?
  const anliegend: Map<number, number>[] = [];
  for (let i = 0; i <= innen; i++) anliegend.push(new Map());
  for (let p = 0; p < N; p++) {
    const id = etikett[p]!;
    if (id >= 0) continue;
    const x = p % w;
    const y = (p - x) / w;
    const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of nb) {
      if (q < 0) continue;
      const f = etikett[q]!;
      if (f > 0) {
        const m = anliegend[-id]!;
        m.set(f, (m.get(f) ?? 0) + 1);
      }
    }
  }

  let gesamt = 0;
  for (let f = 1; f <= formen; f++) gesamt += formFlaeche[f]!;
  const entfernen = new Uint8Array(innen + 1);
  let irgendeine = false;
  for (let id = 1; id <= innen; id++) {
    const m = anliegend[id]!;
    if (alle) {
      if (innenFlaeche[id]! >= Math.max(8, N * 0.00003)) {
        entfernen[id] = 1;
        irgendeine = true;
      }
      continue;
    }
    if (m.size !== 1) continue; // von mehreren Formen umgeben (oder keiner): nicht eindeutig → behalten
    const form = [...m.keys()][0]!;
    const anteil = formFlaeche[form]! / Math.max(1, gesamt);
    // Kleine Form (ein Buchstabe). Mindestgröße: Winzige „Innenflächen“ sind Reste von Kantenpixeln (Kompressionsrauschen), keine echten Innenräume.
    // Die Innenfläche darf auch größer sein als die Tinte der Form selbst (dünne Schrift: der Innenraum eines „o“ ist größer als der Strich).
    if (anteil <= 0.55 && innenFlaeche[id]! >= Math.max(8, N * 0.00003)) {
      entfernen[id] = 1;
      irgendeine = true;
    }
  }
  if (!irgendeine) return;
  for (let p = 0; p < N; p++) {
    const id = etikett[p]!;
    if (id < 0 && entfernen[-id]) kern[p] = 1;
  }
}
