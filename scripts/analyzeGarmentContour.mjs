/**
 * Konturanalyse eines Produktfotos.
 *
 * Ermittelt aus dem echten Bild, wo das Kleidungsstück tatsächlich liegt –
 * zeilenweise, nicht als grobe Bounding-Box. Grundlage für realistische
 * Druck-/Stickflächen, die der Kontur folgen statt einem pauschalen Rechteck.
 *
 * Aufruf: node scripts/analyzeGarmentContour.mjs <bildpfad> [--profil]
 */
import sharp from 'sharp';

const HINTERGRUND_TOLERANZ = 18; // wie weit ein Pixel vom Hintergrund abweichen muss

/** Ab welchem Helligkeitssprung eine Kante angenommen wird (0–255).
 *  Empirisch gegen eine bekannte Kontrollgröße bestimmt: Bei
 *  russell-authentic-t liefern sechs farbige Varianten übereinstimmend
 *  25,7 / 74,1 % Torsokante. Die weiße Variante ergab mit Schwelle 6 noch
 *  34,3 %, ab Schwelle 4 dagegen 25,8 / 74,3 % — also Übereinstimmung im
 *  Zehntelbereich. Niedrigere Werte (3, 2) ändern nichts mehr, erhöhen aber
 *  die Anfälligkeit für Rauschen. Deshalb 4. */
const KANTEN_SCHWELLE = 4;

/**
 * Liefert für jede Bildzeile den linken/rechten Rand des Kleidungsstücks.
 *
 * `toleranz` überschreibt HINTERGRUND_TOLERANZ. Hintergrund: Bei WEISSER Ware
 * auf weißem Grund liegt der Stoff (gemessen 236–248) nur rund 16 Stufen je
 * Kanal neben dem Hintergrund (255). Mit der Voreinstellung 18 gilt er damit
 * selbst als Hintergrund, die Flutfüllung läuft in das Kleidungsstück hinein
 * und das Zeilenprofil wird unbrauchbar – sichtbar als zerrissene Kontur.
 * Die Voreinstellung bleibt unverändert, damit die erzeugten Flächen
 * reproduzierbar bleiben; die Qualitätssicherung ruft mit engerer Toleranz.
 */
export async function zeilenProfil(pfad, toleranz = HINTERGRUND_TOLERANZ) {
  const bild = sharp(pfad);
  const meta = await bild.metadata();
  const { data, info } = await bild.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  // Hintergrundfarbe aus den vier Ecken schätzen (Freisteller haben i.d.R.
  // weißen oder transparenten Hintergrund).
  const ecke = (x, y) => {
    const i = (y * w + x) * ch;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const ecken = [ecke(0, 0), ecke(w - 1, 0), ecke(0, h - 1), ecke(w - 1, h - 1)];
  const bg = {
    r: Math.round(ecken.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(ecken.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(ecken.reduce((s, c) => s + c.b, 0) / 4),
  };
  const bgTransparent = ecken.every((c) => c.a < 16);

  const istKleidung = (i) => {
    if (bgTransparent) return data[i + 3] > 64;
    if (data[i + 3] < 64) return false;
    const d =
      Math.abs(data[i] - bg.r) + Math.abs(data[i + 1] - bg.g) + Math.abs(data[i + 2] - bg.b);
    return d > toleranz * 3;
  };

  // ── Hintergrund vom Bildrand fluten, an KANTEN gestoppt ─────────────
  //
  // Zwei Vorgängerverfahren sind gescheitert:
  //  1. Globaler Farbabstand zur Eckfarbe. Weißer Stoff auf hellem Grund
  //     liegt innerhalb der Toleranz und galt als Hintergrund – gemessen
  //     bei russell-authentic-t/white: linke Kante bei 44,7 % statt 26,0 %,
  //     die halbe Stofffläche fehlte.
  //  2. Reine Flutfüllung vom Rand. Löst das nicht: Ist der Stoff farblich
  //     innerhalb der Toleranz, läuft die Flut mitten hinein.
  //
  // Dieses Verfahren nutzt zusätzlich den GRADIENTEN. Auch bei nahezu
  // gleicher Farbe erzeugt die Kante zwischen Stoff und Hintergrund einen
  // Helligkeitssprung (Schattenkante, Stoffrand). Die Flut darf ein Pixel
  // nur betreten, wenn es farblich Hintergrund ist UND dort keine Kante
  // liegt. Damit stoppt sie am Rand des Kleidungsstücks, unabhängig davon,
  // wie hell der Stoff ist.
  const grau = (i) => (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;

  /** Stärke des lokalen Helligkeitssprungs (4er-Nachbarschaft). */
  const gradient = (x, y) => {
    const i = (y * w + x) * ch;
    const g = grau(i);
    let maxDiff = 0;
    if (x > 0)     maxDiff = Math.max(maxDiff, Math.abs(g - grau(i - ch)));
    if (x < w - 1) maxDiff = Math.max(maxDiff, Math.abs(g - grau(i + ch)));
    if (y > 0)     maxDiff = Math.max(maxDiff, Math.abs(g - grau(i - w * ch)));
    if (y < h - 1) maxDiff = Math.max(maxDiff, Math.abs(g - grau(i + w * ch)));
    return maxDiff;
  };

  const farblichHintergrund = (i) => {
    if (bgTransparent) return data[i + 3] < 64;
    if (data[i + 3] < 64) return true;
    const d =
      Math.abs(data[i] - bg.r) + Math.abs(data[i + 1] - bg.g) + Math.abs(data[i + 2] - bg.b);
    return d <= toleranz * 3;
  };

  const passierbar = (x, y) =>
    farblichHintergrund((y * w + x) * ch) && gradient(x, y) < KANTEN_SCHWELLE;

  const hintergrund = new Uint8Array(w * h);
  const stapel = [];
  const setze = (x, y) => {
    const idx = y * w + x;
    if (!hintergrund[idx] && passierbar(x, y)) { hintergrund[idx] = 1; stapel.push(idx); }
  };

  for (let x = 0; x < w; x++) { setze(x, 0); setze(x, h - 1); }
  for (let y = 0; y < h; y++) { setze(0, y); setze(w - 1, y); }

  while (stapel.length > 0) {
    const idx = stapel.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0)     setze(x - 1, y);
    if (x < w - 1) setze(x + 1, y);
    if (y > 0)     setze(x, y - 1);
    if (y < h - 1) setze(x, y + 1);
  }

  const zeilen = [];
  for (let y = 0; y < h; y++) {
    let links = -1;
    let rechts = -1;
    let anzahl = 0;
    for (let x = 0; x < w; x++) {
      if (!hintergrund[y * w + x]) {
        if (links === -1) links = x;
        rechts = x;
        anzahl++;
      }
    }
    zeilen.push({ y, links, rechts, breite: links === -1 ? 0 : rechts - links + 1, anzahl });
  }

  return { w, h, format: meta.format, bgTransparent, bg, zeilen };
}

if (process.argv[1] && process.argv[1].endsWith('analyzeGarmentContour.mjs')) {
  const pfad = process.argv[2];
  const { w, h, bgTransparent, zeilen } = await zeilenProfil(pfad);
  const belegt = zeilen.filter((z) => z.breite > 0);
  const oben = belegt[0]?.y ?? 0;
  const unten = belegt[belegt.length - 1]?.y ?? h - 1;
  const maxBreite = Math.max(...zeilen.map((z) => z.breite));

  console.log(`Bild        : ${pfad}`);
  console.log(`Groesse     : ${w} x ${h} (Hintergrund ${bgTransparent ? 'transparent' : 'farbig'})`);
  console.log(`Kleidung    : y ${oben}..${unten}  (${((oben / h) * 100).toFixed(1)}% .. ${((unten / h) * 100).toFixed(1)}%)`);
  console.log(`Max. Breite : ${maxBreite}px (${((maxBreite / w) * 100).toFixed(1)}% der Bildbreite)`);

  if (process.argv.includes('--profil')) {
    console.log('\ny%     | links% | rechts% | breite%');
    for (let p = 0; p <= 100; p += 4) {
      const y = Math.min(h - 1, Math.round((p / 100) * (h - 1)));
      const z = zeilen[y];
      if (z.breite === 0) {
        console.log(`${String(p).padStart(3)}%   |   —    |    —    |   0`);
      } else {
        console.log(
          `${String(p).padStart(3)}%   | ${((z.links / w) * 100).toFixed(1).padStart(5)}  | ${((z.rechts / w) * 100).toFixed(1).padStart(6)}  | ${((z.breite / w) * 100).toFixed(1).padStart(5)}`
        );
      }
    }
  }
}
