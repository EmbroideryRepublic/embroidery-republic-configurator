/**
 * Stammen alle Farben eines Produkts aus DERSELBEN Fotoserie?
 *
 * Der Bilddubletten-Audit findet das Gegenteil (zwei Produkte, ein Bild). Hier
 * geht es um den Stilbruch INNERHALB eines Produkts: Wenn 45 Farben vom
 * Hersteller-Studio kommen und 5 von einem anderen Händler, springt beim
 * Farbwechsel die Form des Kleidungsstücks. Der Kunde liest das als Fehler.
 *
 * Verfahren: Jede Vorderansicht wird auf eine 64×64-Maske reduziert (Kleidungs-
 * stück gegen Hintergrund, über die Alpha-/Helligkeitsschwelle). Verglichen wird
 * jede Farbe gegen die MEDIAN-Maske ihres Produkts über die Jaccard-Ähnlichkeit
 * (IoU). Farbe und Helligkeit spielen dabei keine Rolle – nur der Umriss.
 *
 * Ein niedriger IoU ist ein HINWEIS, kein Urteil: Melierte Stoffe, sehr helle
 * Farben auf weißem Grund und Damenschnitte in gemischten Paletten erzeugen
 * echte Abweichungen. Deshalb gibt das Skript eine Rangliste aus, keine Ampel.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/silhouettenAudit.mts [--schwelle 0.9] [--produkt <id>]
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

const N = 64;

/** Wert eines Schalters. NICHT `argv[indexOf(x)+1]` – ohne den Schalter ist das
 *  `argv[0]`, also der Node-Pfad, und die Bedingung kippt lautlos. */
function flagWert(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const schwelle = Number(flagWert('--schwelle')) || 0.9;
const nurProdukt = flagWert('--produkt');

const datei = (pfad: string) =>
  join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));

/**
 * Maske: 1 = Kleidungsstück.
 *
 * Nicht über eine Helligkeitsschwelle – die Aufnahmen sind deckend weiß
 * hinterlegt (Alpha ist durchweg 255), und ein WEISSES Shirt auf weißem Grund
 * verschwindet dabei komplett. Stattdessen wird der HINTERGRUND bestimmt: die
 * zusammenhängende, fast weiße Fläche, die den Bildrand berührt. Alles, was
 * davon eingeschlossen ist, gehört zum Kleidungsstück – auch wenn es selbst
 * weiß ist, denn sein Umriss und seine Faltenschatten trennen es vom Rand.
 *
 * Gearbeitet wird auf 256×256 (die Kanten dünner Ärmel überleben das) und
 * anschließend auf N×N verdichtet.
 */
const FEIN = 256;

async function maske(pfad: string): Promise<Uint8Array> {
  const { data, info } = await sharp(pfad)
    .resize(FEIN, FEIN, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = info.channels;
  const fastWeiss = new Uint8Array(FEIN * FEIN);
  for (let i = 0; i < FEIN * FEIN; i++) {
    const p = i * k;
    fastWeiss[i] = data[p]! > 243 && data[p + 1]! > 243 && data[p + 2]! > 243 ? 1 : 0;
  }

  // Flutfüllung vom Rand über fast weiße Pixel – das ist der Hintergrund.
  const hintergrund = new Uint8Array(FEIN * FEIN);
  const stapel: number[] = [];
  for (let x = 0; x < FEIN; x++) {
    stapel.push(x, (FEIN - 1) * FEIN + x);
  }
  for (let y = 0; y < FEIN; y++) {
    stapel.push(y * FEIN, y * FEIN + FEIN - 1);
  }
  while (stapel.length) {
    const i = stapel.pop()!;
    if (hintergrund[i] || !fastWeiss[i]) continue;
    hintergrund[i] = 1;
    const x = i % FEIN;
    const y = (i / FEIN) | 0;
    if (x > 0) stapel.push(i - 1);
    if (x < FEIN - 1) stapel.push(i + 1);
    if (y > 0) stapel.push(i - FEIN);
    if (y < FEIN - 1) stapel.push(i + FEIN);
  }

  // Verdichten: eine N-Zelle zählt als Kleidungsstück, wenn die Mehrheit ihrer
  // Feinpixel dazugehört.
  const f = FEIN / N;
  const m = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let treffer = 0;
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          if (!hintergrund[(y * f + dy) * FEIN + (x * f + dx)]) treffer++;
        }
      }
      m[y * N + x] = treffer * 2 > f * f ? 1 : 0;
    }
  }
  return m;
}

function iou(a: Uint8Array, b: Uint8Array): number {
  let schnitt = 0;
  let vereinigung = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) vereinigung++;
    if (a[i] && b[i]) schnitt++;
  }
  return vereinigung ? schnitt / vereinigung : 1;
}

const befunde: { produkt: string; farbe: string; iou: number }[] = [];
let geprueft = 0;

for (const p of PRODUCTS) {
  if (nurProdukt && p.id !== nurProdukt) continue;
  const farben = p.colors.filter((c) => ASSET_MANIFEST[p.id]?.[c.id]?.status === 'real');
  if (farben.length < 4) continue; // unter 4 Farben ist ein „Median" bedeutungslos

  const masken: { farbe: string; m: Uint8Array }[] = [];
  for (const c of farben) {
    const pfad = ASSET_MANIFEST[p.id]![c.id]!.views.front;
    if (!pfad) continue;
    const f = datei(pfad);
    if (!existsSync(f)) continue;
    masken.push({ farbe: c.id, m: await maske(f) });
  }
  if (masken.length < 4) continue;
  geprueft += masken.length;

  // Median-Maske: ein Pixel gehört zum Kleidungsstück, wenn die Mehrheit der
  // Farben es so sieht. Robust gegen einzelne Ausreißer – anders als ein Mittel.
  const median = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) {
    let treffer = 0;
    for (const { m } of masken) treffer += m[i]!;
    median[i] = treffer * 2 > masken.length ? 1 : 0;
  }

  for (const { farbe, m } of masken) {
    const wert = iou(m, median);
    if (wert < schwelle) befunde.push({ produkt: p.id, farbe, iou: wert });
  }
}

befunde.sort((a, b) => a.iou - b.iou);
console.log(`${geprueft} Vorderansichten geprueft · ${befunde.length} Umrisse weichen vom Produkt-Median ab (IoU < ${schwelle})\n`);
for (const b of befunde.slice(0, 60)) {
  console.log(`  IoU ${b.iou.toFixed(3)}  ${b.produkt} / ${b.farbe}`);
}
if (befunde.length > 60) console.log(`  … und ${befunde.length - 60} weitere`);
