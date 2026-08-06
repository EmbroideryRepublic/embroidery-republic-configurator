/**
 * Misst den On-Model-Kennwert für eine feste Liste von Bildern, deren Antwort
 * bekannt ist – Freisteller wie On-Model. Damit lässt sich der Schwellenwert
 * belegen statt raten, und eine Änderung an der Erkennung ist sofort prüfbar.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/onModelKalibrierung.mts
 *
 * Exit 1, wenn eine der bekannten Antworten falsch herauskommt.
 */
import sharp from 'sharp';

const FALL: { name: string; onModel: boolean; url: string }[] = [
  // Freisteller mit hautfarbenem STOFF – die schwierigsten Fälle
  { name: 'gelbe Seitenansicht (Neutral R61001)', onModel: false, url: 'https://www.sportyfied.com/thumbs/regular/r61001_yel_side_700x700.png' },
  { name: 'Heliconia (Gildan 2000)', onModel: false, url: 'https://cdn.shopify.com/s/files/1/0077/4048/9809/products/Gildan_2000_Heliconia_Front_High.jpg' },
  { name: 'Tangerine (Gildan 2000)', onModel: false, url: 'https://cdn.shopify.com/s/files/1/0077/4048/9809/products/Gildan_2000_Tangerine_Front_High.jpg' },
  { name: 'Natural (Gildan 2000)', onModel: false, url: 'https://cdn.shopify.com/s/files/1/0077/4048/9809/products/Gildan_2000_Natural_Front_High.jpg' },
  { name: 'Weiss (Gildan 2000)', onModel: false, url: 'https://cdn.shopify.com/s/files/1/0077/4048/9809/products/Gildan_2000_White_Front_High.jpg' },
  // On-Model – dunkel, hell und weiss
  { name: 'Metro Blue Ruecken am Modell', onModel: true, url: 'https://cdn.blankstyle.com/files/p_images/1246/gildan_39-metro-blue-back.jpg' },
  { name: 'Weisser Hoodie am Modell', onModel: true, url: 'https://images.shirtspace.com/fullsize/TXH2gODshI8I64GN%2FH61jg%3D%3D/357445/17470-gildan-sf500-softstyle-hooded-sweatshirt-front-white.jpg' },
  { name: 'Carolina Blue Hoodie am Modell', onModel: true, url: 'https://images.shirtspace.com/fullsize/HTDOw0juKmuZvkkWSaM8Gw%3D%3D/534117/17470-gildan-sf500-adult-softstyle-fleece-pullover-hooded-sweatshirt-front-carolina-blue.jpg' },
  { name: 'Light Pink Hoodie am Modell', onModel: true, url: 'https://images.shirtspace.com/fullsize/osSP4ecLrWeB1cobEXdLhg%3D%3D/357451/17470-gildan-sf500-softstyle-hooded-sweatshirt-front-light-pink.jpg' },
  { name: 'Paragon Hoodie am Modell', onModel: true, url: 'https://images.shirtspace.com/fullsize/kcmLk1IPJraePLJWS7gNFQ%3D%3D/357487/17470-gildan-sf500-adult-softstyle-fleece-pullover-hooded-sweatshirt-front-paragon.jpg' },
];

const istHaut = (r: number, g: number, b: number) =>
  r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b;

/** Muss zur Berechnung in scripts/jobsOnModelFilter.mts passen. */
async function kennwert(url: string, familie: number, abstand: number) {
  const antwort = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const roh = Buffer.from(await antwort.arrayBuffer());
  const { data, info } = await sharp(roh).resize(96, 96, { fit: 'fill' }).flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
  const k = info.channels;
  const n = info.width * info.height;
  const eimer = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < n; i++) {
    const p = i * k;
    const r = data[p]!, g = data[p + 1]!, b = data[p + 2]!;
    if (r > 240 && g > 240 && b > 240) continue;
    const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
    const e = eimer.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    eimer.set(key, e);
  }
  const alle = [...eimer.values()].map((e) => ({ n: e.n, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n })).sort((a, b) => b.n - a.n);
  const haupt = alle[0];
  if (!haupt) return 0;
  const stoff = alle.filter((e) => Math.hypot(e.r - haupt.r, e.g - haupt.g, e.b - haupt.b) <= familie).slice(0, 8);
  let fremd = 0;
  for (let i = 0; i < n; i++) {
    const p = i * k;
    const r = data[p]!, g = data[p + 1]!, b = data[p + 2]!;
    if (!istHaut(r, g, b)) continue;
    if (stoff.every((s) => Math.hypot(r - s.r, g - s.g, b - s.b) > abstand)) fremd++;
  }
  return fremd / n;
}

const FAMILIE = Number(process.argv[process.argv.indexOf('--familie') + 1]) || 70;
const ABSTAND = Number(process.argv[process.argv.indexOf('--abstand') + 1]) || 70;
const SCHWELLE = Number(process.argv[process.argv.indexOf('--schwelle') + 1]) || 0.05;

console.log(`Familie ${FAMILIE} · Abstand ${ABSTAND} · Schwelle ${(SCHWELLE * 100).toFixed(0)} %\n`);
let fehler = 0;
let maxFreisteller = 0;
let minOnModel = 1;
for (const f of FALL) {
  const w = await kennwert(f.url, FAMILIE, ABSTAND);
  const erkannt = w > SCHWELLE;
  const ok = erkannt === f.onModel;
  if (!ok) fehler++;
  if (f.onModel) minOnModel = Math.min(minOnModel, w);
  else maxFreisteller = Math.max(maxFreisteller, w);
  console.log(`  ${ok ? '✔' : '✖'} ${(w * 100).toFixed(1).padStart(5)} %  ${f.onModel ? 'On-Model  ' : 'Freisteller'}  ${f.name}`);
}
console.log(`\nHöchster Freisteller ${(maxFreisteller * 100).toFixed(1)} % · niedrigstes On-Model ${(minOnModel * 100).toFixed(1)} %`);
console.log(minOnModel > maxFreisteller ? `Trennung sauber, Lücke ${((minOnModel - maxFreisteller) * 100).toFixed(1)} Punkte` : 'KEINE saubere Trennung');
if (fehler) {
  console.log(`\n${fehler} Fehlurteile`);
  process.exit(1);
}
