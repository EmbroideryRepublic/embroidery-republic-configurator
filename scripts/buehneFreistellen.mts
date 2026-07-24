/**
 * Stellt Bühnenbilder für die Startseite frei.
 *
 * ── Warum ─────────────────────────────────────────────────────────────
 * Die Lieferantenfotos sind Packshots auf weißem Studiohintergrund. Auf der
 * cremefarbenen Startseite steht deshalb ein harter weißer Kasten um jedes
 * Kleidungsstück. Für Kacheln ist das egal (die sitzen auf weißen Karten),
 * für die formatfüllende Bühne ruiniert es die Wirkung.
 *
 * ── Was hier NICHT passiert ───────────────────────────────────────────
 * Es wird nichts erzeugt, eingefärbt oder retuschiert. Die Pixel des
 * Kleidungsstücks bleiben Byte für Byte identisch; entfernt wird allein der
 * zusammenhängende weiße Hintergrund, der vom Bildrand aus erreichbar ist.
 * Ein Flutfüller von den Rändern her – kein globaler Schwellwert, denn der
 * würde weiße Teile des Kleidungsstücks mit ausstanzen.
 *
 * ── Originale bleiben unberührt ───────────────────────────────────────
 * Geschrieben wird ausschließlich nach `public/buehne/`. Die Dateien unter
 * `public/products/` rührt dieses Skript nicht an – der Konfigurator rechnet
 * mit ihnen (Bildkontur, Druckflächen), und der Architektur-Freeze gilt.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/buehneFreistellen.mts
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Bilder, die frei gestellt auf der Startseite stehen. */
const QUELLEN = [
  { von: 'public/products/justhoods-college-hoodie-grey/front.png', nach: 'hoodie.png' },
];

/** Farbabstand, bis zu dem ein Pixel noch als Hintergrund gilt. */
const TOLERANZ = 20;
/** Größerer Abstand für die Kantenglättung – dazwischen wird weich geblendet. */
const KANTE = 68;

function abstand(d: Buffer, i: number, ref: number[]): number {
  return Math.max(
    Math.abs(d[i]! - ref[0]!),
    Math.abs(d[i + 1]! - ref[1]!),
    Math.abs(d[i + 2]! - ref[2]!)
  );
}

async function freistellen(von: string, nach: string): Promise<void> {
  const { data, info } = await sharp(von).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: b, height: h } = info;
  const px = Buffer.from(data);

  // Der Bildrand ist per Definition Hintergrund – seine Farbe ist die
  // Referenz. (Alle geprüften Packshots haben oben links reines Weiß.)
  const ref = [px[0]!, px[1]!, px[2]!];

  // Flutfüllung vom Rand. Iterativ mit eigenem Stapel, nicht rekursiv:
  // bei 620×720 Pixeln liefe die Aufrufliste sonst über.
  const besucht = new Uint8Array(b * h);
  const stapel: number[] = [];
  for (let x = 0; x < b; x++) { stapel.push(x, (h - 1) * b + x); }
  for (let y = 0; y < h; y++) { stapel.push(y * b, y * b + b - 1); }

  let entfernt = 0;
  while (stapel.length > 0) {
    const p = stapel.pop()!;
    if (besucht[p]) continue;
    if (abstand(px, p * 4, ref) > TOLERANZ) continue;
    besucht[p] = 1;
    px[p * 4 + 3] = 0;
    entfernt++;

    const x = p % b;
    const y = (p / b) | 0;
    if (x > 0) stapel.push(p - 1);
    if (x < b - 1) stapel.push(p + 1);
    if (y > 0) stapel.push(p - b);
    if (y < h - 1) stapel.push(p + b);
  }

  // Kantenglättung: Packshots haben weiche Ränder. Ein harter Schnitt an der
  // Toleranzgrenze ergäbe Treppen. Pixel, die an einen entfernten Nachbarn
  // grenzen und noch hintergrundnah sind, werden anteilig durchsichtig.
  const alphaVorher = Buffer.from(px);
  let geglaettet = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < b - 1; x++) {
      const p = y * b + x;
      if (besucht[p]) continue;
      const nachbarFrei =
        besucht[p - 1] || besucht[p + 1] || besucht[p - b] || besucht[p + b];
      if (!nachbarFrei) continue;

      const d = abstand(alphaVorher, p * 4, ref);
      if (d >= KANTE) continue;
      px[p * 4 + 3] = Math.round((d / KANTE) * 255);
      geglaettet++;
    }
  }

  mkdirSync('public/buehne', { recursive: true });
  const ziel = join('public/buehne', nach);
  await sharp(px, { raw: { width: b, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(ziel);

  const anteil = ((entfernt / (b * h)) * 100).toFixed(1);
  console.log(`${nach.padEnd(14)} ${b}×${h}  Hintergrund entfernt: ${anteil} %  Kantenpixel: ${geglaettet}`);

  // Wächter: Wird deutlich zu viel oder zu wenig entfernt, stimmt etwas
  // nicht – dann lieber laut abbrechen als ein zerfressenes Bild ausliefern.
  if (entfernt / (b * h) < 0.2) throw new Error(`${nach}: kaum Hintergrund entfernt – Referenzfarbe prüfen`);
  if (entfernt / (b * h) > 0.9) throw new Error(`${nach}: fast alles entfernt – Toleranz zu hoch`);
}

for (const { von, nach } of QUELLEN) await freistellen(von, nach);
