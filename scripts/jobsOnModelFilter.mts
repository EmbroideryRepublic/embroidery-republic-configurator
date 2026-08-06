/**
 * Torwächter VOR dem Import: lädt jede Bild-URL eines Job-Files probeweise und
 * wirft die On-Model-Aufnahmen raus, bevor sie im Shop landen.
 *
 * Warum das hier gehört und nicht in den Audit danach: `onModelAudit` findet
 * solche Bilder erst, wenn sie schon abgelegt sind – und `generatePrintAreaData`
 * hat dann bereits die Kontur eines MENSCHEN vermessen und die Druckfläche über
 * Kopf und Schultern gelegt. Genau das ist beim Gildan Ultra Cotton Longsleeve
 * passiert. Ein Rückbau ist mühsam; die Ablehnung an der Tür ist billig.
 *
 * Verfahren: Hautregel nach Kovac et al. – aber die Menge allein trennt NICHT.
 * Gemessen: ein rosa Freisteller (Gildan „Heliconia") kommt auf 48 % Hautanteil
 * und 26 % in der Kopfregion, eine echte On-Model-Rückansicht dagegen nur auf
 * 10 % / 6 %. Der Stoff IST die Hautfarbe; jede absolute Schwelle wirft damit
 * genau die guten Freisteller raus.
 *
 * Entscheidend ist deshalb, ob die hautfarbenen Pixel die STOFFFARBE sind oder
 * etwas anderes: Bestimmt wird die dominante Nicht-Weiß-Farbe des Bildes, und
 * gezählt werden nur Hautpixel, die weit davon entfernt liegen. Beim rosa
 * Freisteller ist das praktisch nichts – die „Haut" ist der Stoff. Beim Model im
 * navyfarbenen Shirt sind Gesicht, Hals und Arme weit von Navy entfernt.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/jobsOnModelFilter.mts <jobs.json> [--schreiben]
 *
 * Ohne --schreiben wird nur berichtet. Mit --schreiben wird die Datei gefiltert
 * neu geschrieben und die Ablehnungen nach <jobs>.onmodel.json protokolliert.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const datei = process.argv[2];
if (!datei) throw new Error('Aufruf: scripts/jobsOnModelFilter.mts <jobs.json> [--schreiben]');
const schreiben = process.argv.includes('--schreiben');

/**
 * Anteil stofffremder Hautpixel, ab dem ein Mensch im Bild angenommen wird.
 *
 * An echten Daten kalibriert (Rückansichten-Charge 2, 436 Bilder): Die 45
 * On-Model-Rückansichten des Gildan Ultra Cotton liegen geschlossen zwischen
 * 6,6 % und 12,0 % – unabhängig von der Stofffarbe, denn dasselbe Modell trägt
 * jede Farbe. Die verbliebenen Fehlalarme (Faltenschatten in roten und orangen
 * Freistellern) liegen bei 2,2–3,5 %. Zwischen 3,5 % und 6,2 % liegt nichts;
 * 5 % trennt beide Gruppen mit Abstand nach beiden Seiten.
 */
const SCHWELLE = 0.05;
/** Ab diesem RGB-Abstand gilt ein Hautpixel als NICHT die Stofffarbe. */
const ABSTAND = 70;

const istHaut = (r: number, g: number, b: number) =>
  r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b;

async function pruefe(url: string): Promise<{ fremd: number } | null> {
  let roh: Buffer;
  try {
    const antwort = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!antwort.ok) return null;
    roh = Buffer.from(await antwort.arrayBuffer());
  } catch {
    return null;
  }
  try {
    const { data, info } = await sharp(roh)
      .resize(96, 96, { fit: 'fill' })
      .flatten({ background: '#ffffff' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const k = info.channels;
    const n = info.width * info.height;

    // Dominante Nicht-Weiß-Farbe = die Stofffarbe. Grob quantisiert (32er
    // Raster), damit Faltenschatten nicht in hundert Eimer zerfallen.
    const eimer = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < n; i++) {
      const p = i * k;
      const r = data[p]!, g = data[p + 1]!, b = data[p + 2]!;
      if (r > 240 && g > 240 && b > 240) continue; // Hintergrund
      const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
      const e = eimer.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      eimer.set(key, e);
    }
    let stoff = { r: 255, g: 255, b: 255 };
    let max = 0;
    for (const e of eimer.values()) {
      if (e.n > max) { max = e.n; stoff = { r: e.r / e.n, g: e.g / e.n, b: e.b / e.n }; }
    }

    let fremd = 0;
    for (let i = 0; i < n; i++) {
      const p = i * k;
      const r = data[p]!, g = data[p + 1]!, b = data[p + 2]!;
      if (!istHaut(r, g, b)) continue;
      const d = Math.hypot(r - stoff.r, g - stoff.g, b - stoff.b);
      if (d > ABSTAND) fremd++;
    }
    return { fremd: fremd / n };
  } catch {
    return null;
  }
}

type Job = { productId: string; quelle?: string; colors: Record<string, string | undefined>[] };
const jobs: Job[] = JSON.parse(readFileSync(datei, 'utf8'));
const abgelehnt: { productId: string; colorId: string; view: string; fremd: string; url: string }[] = [];
let geprueft = 0;

for (const j of jobs) {
  for (const c of j.colors ?? []) {
    for (const view of ['front', 'back', 'side'] as const) {
      const url = c[view];
      if (typeof url !== 'string') continue;
      geprueft++;
      const m = await pruefe(url);
      if (!m) continue;
      if (m.fremd > SCHWELLE) {
        abgelehnt.push({
          productId: j.productId,
          colorId: String(c.id),
          view,
          fremd: (m.fremd * 100).toFixed(1) + '%',
          url,
        });
        delete c[view];
      }
    }
  }
}

// Farben, deren front weggefallen ist, ganz verwerfen: ohne Vorderansicht löscht
// ingestDirect den Zielordner – das wäre schlimmer als die abgelehnte Aufnahme.
for (const j of jobs) j.colors = (j.colors ?? []).filter((c) => typeof c.front === 'string');

console.log(`${geprueft} Bilder geprueft · ${abgelehnt.length} als On-Model abgelehnt`);
const proProdukt = new Map<string, number>();
for (const a of abgelehnt) proProdukt.set(a.productId, (proProdukt.get(a.productId) ?? 0) + 1);
for (const [id, n] of [...proProdukt].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${id}`);

if (schreiben) {
  writeFileSync(datei, JSON.stringify(jobs, null, 2));
  writeFileSync(datei.replace(/\.json$/, '.onmodel.json'), JSON.stringify(abgelehnt, null, 2));
  console.log(`\n→ ${datei} gefiltert · Ablehnungen in ${datei.replace(/\.json$/, '.onmodel.json')}`);
}
