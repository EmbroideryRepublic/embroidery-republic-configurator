/**
 * Kontaktbögen zur SICHTPRÜFUNG der Druckflächen.
 *
 * Zeichnet je Produkt die konfigurierte Druckfläche als Rahmen auf das echte
 * Produktfoto und setzt die Kacheln zu Bögen à 12 zusammen. Damit lässt sich
 * Produkt für Produkt beurteilen, ob die Fläche sinnvoll sitzt – groß genug,
 * aber nicht über Kragen, Naht, Ärmel oder Saum hinaus.
 *
 * Eine rein rechnerische Prüfung reicht hier nicht: Auf weissem Studiohintergrund
 * ist ein weisses oder mehrfarbiges Kleidungsstück (z.B. Baseball-Shirt mit
 * Kontrastärmeln) nicht zuverlässig von der Silhouette zu trennen – eine
 * Deckungsmessung meldet dort Fehlalarme. Das Auge entscheidet.
 *
 * Aufruf: npx tsx scripts/druckflaechenKontaktbogen.mts [view] [ausgabeordner]
 *   view          front (Standard) | back | sleeve_left | sleeve_right
 */
import { mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { PRINT_AREA_DATA } from '../src/config/printAreaData.ts';
import { PRODUCTS } from '../src/config/products/index.ts';
import { bildFuerAnsicht, assetVerfuegbarkeit, PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

const VIEW = process.argv[2] ?? 'front';
const OUT = process.argv[3] ?? 'qa-screenshots/druckflaechen';
const KACHEL = 300;
const SPALTEN = 4;
const ZEILEN = 3;
const PRO_BOGEN = SPALTEN * ZEILEN;

/** Dunkelste Farbe mit Fotos – auf ihr ist der Rahmen am besten zu beurteilen. */
const helligkeit = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

mkdirSync(OUT, { recursive: true });

const kacheln: { id: string; buffer: Buffer }[] = [];

for (const p of PRODUCTS) {
  const flaeche = PRINT_AREA_DATA[p.id]?.[VIEW as 'front'];
  if (!flaeche) continue;
  const farbe = p.colors
    .filter((c) => assetVerfuegbarkeit(p.id, c.id) === 'vorhanden')
    .sort((a, b) => helligkeit(a.hex) - helligkeit(b.hex))[0];
  if (!farbe) continue;
  const pfad = bildFuerAnsicht(p.id, farbe.id, VIEW);
  if (!pfad || pfad === PLATZHALTER_BILD) continue;
  const datei = `public${pfad.replace(/\.webp$/, '.png')}`;
  if (!existsSync(datei)) continue;

  // Maße aus dem DEKODIERTEN Bild nehmen (nach EXIF-Rotation), sonst passt das
  // SVG-Overlay nicht zur Bildgröße und sharp bricht ab.
  const basis = await sharp(datei).rotate().png().toBuffer({ resolveWithObject: true });
  const W = basis.info.width, H = basis.info.height;
  if (!W || !H) continue;

  // x0/y0/x1/y1 sind Prozent der Bildkante (0–100).
  const x = (flaeche.x0 / 100) * W;
  const y = (flaeche.y0 / 100) * H;
  const bw = ((flaeche.x1 - flaeche.x0) / 100) * W;
  const bh = ((flaeche.y1 - flaeche.y0) / 100) * H;
  const rahmen = Math.max(3, Math.round(W / 180));
  const svg = `<svg width="${W}" height="${H}">
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="none" stroke="#e11d48" stroke-width="${rahmen}"/>
  </svg>`;

  // ZWEI Durchgänge: sharp wendet resize IMMER vor composite an, unabhängig von
  // der Aufrufreihenfolge. In einer Kette würde das Overlay in Originalgröße auf
  // das bereits verkleinerte Bild gelegt – sharp bricht dann ab.
  const mitRahmen = await sharp(basis.data)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  const buffer = await sharp(mitRahmen)
    .resize(KACHEL, KACHEL, { fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  kacheln.push({ id: p.id, buffer });
}

let bogen = 0;
for (let i = 0; i < kacheln.length; i += PRO_BOGEN) {
  const teil = kacheln.slice(i, i + PRO_BOGEN);
  const bildH = Math.ceil(teil.length / SPALTEN) * (KACHEL + 22);
  const beschriftung = teil
    .map((k, n) => {
      const sx = (n % SPALTEN) * KACHEL;
      const sy = Math.floor(n / SPALTEN) * (KACHEL + 22) + KACHEL + 15;
      const text = k.id.length > 42 ? k.id.slice(0, 41) + '…' : k.id;
      return `<text x="${sx + 4}" y="${sy}" font-family="sans-serif" font-size="11" fill="#111">${text}</text>`;
    })
    .join('');

  const ziel = `${OUT}/${VIEW}_${String(++bogen).padStart(2, '0')}.png`;
  await sharp({
    create: { width: SPALTEN * KACHEL, height: bildH, channels: 3, background: '#ffffff' },
  })
    .composite([
      ...teil.map((k, n) => ({
        input: k.buffer,
        left: (n % SPALTEN) * KACHEL,
        top: Math.floor(n / SPALTEN) * (KACHEL + 22),
      })),
      { input: Buffer.from(`<svg width="${SPALTEN * KACHEL}" height="${bildH}">${beschriftung}</svg>`), top: 0, left: 0 },
    ])
    .png()
    .toFile(ziel);
  console.log(ziel);
}
console.log(`\n${kacheln.length} Produkte auf ${bogen} Bögen (Ansicht: ${VIEW}).`);
