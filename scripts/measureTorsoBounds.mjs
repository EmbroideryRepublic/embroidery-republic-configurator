/**
 * Grenzbereich-Korrektur: misst je Produkt die TORSO-Breite (statt der
 * vollen Silhouette inkl. Ärmel) für Vorder-/Rückansicht.
 *
 * Methode: Die Kleidungsstück-Silhouette wird per Farbschwellenwert
 * erkannt (wie measureGarmentBounds.mjs). Am SAUM (unterste Zeilen des
 * Kleidungsstücks) entspricht die Silhouettenbreite exakt der
 * Torso-Breite – Ärmel enden höher. Gemessen wird der Median über ein
 * kleines Zeilenband oberhalb der Unterkante, damit einzelne Ausreißer
 * (Saumwellen, Kordel-Enden) das Ergebnis nicht verfälschen.
 *
 * Ausgabe: JSON { productId: { front: {x0,x1}, back: {x0,x1} } } –
 * Grundlage für die MEASURED-Aktualisierung in src/config/printAreas.ts.
 *
 * Aufruf: node scripts/measureTorsoBounds.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'products');

// productId → Anker-Ordner (aus src/config/products/*.ts, Stand Juli 2026).
const FOLDERS = {
  'fotl-heavy-t': 'fotl-heavy-t',
  'fotl-ladies-valueweight-vneck': 'fotl-ladies-vneck',
  'fotl-original-longsleeve': 'fotl-original-longsleeve',
  'fotl-original-vneck': 'fotl-original-vneck',
  'fotl-ladies-original-t': 'fotl-ladies-original-t',
  'fotl-iconic195-longsleeve': 'fotl-iconic195-longsleeve',
  'fotl-pure-cotton-t': 'fotl-pure-cotton-t',
  'fotl-super-premium-t': 'fotl-super-premium-t',
  'fotl-valueweight-t': 'fotl-valueweight-t',
  'fotl-valueweight-vneck': 'fotl-valueweight-vneck',
  'fotl-iconic195-t': 'fotl-iconic195-t',
  'fotl-ladies-iconic195-t': 'fotl-ladies-iconic195-t',
  'fotl-original-t': 'fotl-original-t',
  'fotl-ladies-valueweight-t': 'fotl-ladies-valueweight-t',
  'fotl-baseball-t': 'fotl-baseball-t',
  'fotl-premium-polo': 'fotl-premium-polo',
  'fotl-baseball-longsleeve': 'fotl-baseball-longsleeve',
  'sols-imperial-t': 'sols-imperial-t',
  'sols-north-fleece': 'sols-north-fleece',
  'gildan-heavy-t': 'gildan-heavy-t',
  'gildan-softstyle-polo': 'gildan-softstyle-polo',
  'gildan-vneck-t': 'gildan-vneck-t',
  'russell-authentic-t': 'russell-authentic-t',
  'russell-workwear-t': 'russell-workwear-t',
  'neutral-classic-polo': 'neutral-classic-polo',
  'neutral-rollsleeve-t': 'neutral-rollsleeve-t',
  'justhoods-college-hoodie': 'justhoods-college-hoodie',
  'justhoods-zoodie': 'justhoods-zoodie',
  'justhoods-awdis-sweat': 'justhoods-awdis-sweat',
  'justhoods-contrast-hoodie': 'justhoods-contrast-hoodie',
  'justhoods-quarterzip-sweat': 'justhoods-quarterzip-sweat',
  'bandc-inspire-hoodie': 'bandc-inspire-hoodie',
  'bandc-inspire-zip-hood': 'bandc-inspire-zip-hood',
  'stedman-slimfit-t': 'stedman-slimfit-t',
  'jn-active-t': 'jn-active-t',
  'jn-halfzip-sweat': 'jn-halfzip-sweat',
  'gildan-ladies-t': 'gildan-ladies-t',
  'fotl-ladies-premium-polo': 'fotl-ladies-premium-polo',
  'gildan-ladies-heavy-t': 'gildan-ladies-heavy-t',
  'gildan-ladies-vneck-t': 'gildan-ladies-vneck-t',
  'russell-ladies-authentic-t': 'russell-ladies-authentic-t',
  'gildan-ladies-polo': 'gildan-ladies-polo',
  'gildan-zip-hoodie': 'gildan-zip-hoodie',
};

const THRESHOLD = 15;
/** Sicherheitsabstand nach innen (in % der Bildbreite) je Seite. */
const INSET_PERCENT = 0.5;

async function measureView(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = (x, y) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3)];
  const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length));
  const isGarment = (x, y) => {
    const p = px(x, y);
    return Math.sqrt((p[0] - bg[0]) ** 2 + (p[1] - bg[1]) ** 2 + (p[2] - bg[2]) ** 2) > THRESHOLD;
  };

  // Saum in der BILDMITTE finden (nicht global): bei vielen Sweatern/
  // Jacken ist die Saumkante gebogen – die äußeren Ecken hängen tiefer
  // als die Mitte. Ein global unterster Punkt läge dann in einer Ecke,
  // und das Messband würde die Mitte verfehlen.
  const centerColumn = Math.floor(width / 2);
  let bottom = -1;
  for (let y = height - 1; y >= 0; y--) {
    if (isGarment(centerColumn, y)) {
      bottom = y;
      break;
    }
  }
  if (bottom < 0) return null;

  // Zeilenband knapp oberhalb der Unterkante: je Zeile NICHT die volle
  // min..max-Spannweite (die würde bei Langarm-Produkten die neben dem
  // Körper hängenden Ärmelbündchen mitzählen), sondern den
  // ZUSAMMENHÄNGENDEN Kleidungsstück-Lauf um die Bildmitte – kleine
  // Lücken (Nähte, JPEG-Kanten) bis 6px werden überbrückt, der
  // Hintergrund-Spalt zwischen Bündchen und Körper aber nicht.
  const GAP_TOLERANCE = 6;
  const spans = [];
  const centerX = centerColumn;
  for (let y = Math.max(0, bottom - 16); y <= bottom - 6; y++) {
    if (!isGarment(centerX, y)) continue;
    let minX = centerX;
    let gap = 0;
    for (let x = centerX - 1; x >= 0; x--) {
      if (isGarment(x, y)) {
        minX = x;
        gap = 0;
      } else if (++gap > GAP_TOLERANCE) {
        break;
      }
    }
    let maxX = centerX;
    gap = 0;
    for (let x = centerX + 1; x < width; x++) {
      if (isGarment(x, y)) {
        maxX = x;
        gap = 0;
      } else if (++gap > GAP_TOLERANCE) {
        break;
      }
    }
    spans.push([minX, maxX]);
  }
  if (spans.length === 0) return null;
  spans.sort((a, b) => a[1] - a[0] - (b[1] - b[0]));
  const [minX, maxX] = spans[Math.floor(spans.length / 2)];

  return {
    x0: Number(((minX / width) * 100 + INSET_PERCENT).toFixed(1)),
    x1: Number(((maxX / width) * 100 - INSET_PERCENT).toFixed(1)),
  };
}

const result = {};
for (const [productId, folder] of Object.entries(FOLDERS)) {
  const entry = {};
  for (const view of ['front', 'back']) {
    const filePath = path.join(PRODUCTS_DIR, folder, `${view}.png`);
    try {
      const measured = await measureView(filePath);
      if (!measured) {
        entry[view] = { error: 'no garment detected' };
        continue;
      }
      const widthPercent = measured.x1 - measured.x0;
      // Plausibilitäts-Wächter: Torso-Breite zwischen 30% und 80% des
      // Bilds – alles andere deutet auf eine Fehlmessung hin und wird
      // NICHT übernommen.
      entry[view] = widthPercent >= 30 && widthPercent <= 80 ? measured : { error: `implausible width ${widthPercent}%` };
    } catch (err) {
      entry[view] = { error: String(err.message ?? err) };
    }
  }
  result[productId] = entry;
}

console.log(JSON.stringify(result, null, 2));
