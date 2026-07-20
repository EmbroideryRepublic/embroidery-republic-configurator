/**
 * QA-Wächter: findet Produktordner, deren front.png byte-identisch mit dem
 * eines ANDEREN Produkts ist (gleiche Marke = andere Farbe desselben
 * Produkts ist erlaubt und wird nicht gemeldet).
 *
 * Hintergrund: teamshirts.de-Landingpages verlinken teils generische
 * Spreadshirt-productTypes – so lieferte die Seite "Gildan Heavy Blend
 * Hoodie" (PT 1047) exakt die Fotos unseres justhoods-college-hoodie.
 * Ohne diesen Check würden dieselben Fotos unter zwei Marken landen.
 *
 * Aufruf: node scripts/checkDuplicateImages.mjs
 * Exit-Code 1 bei Funden (CI-tauglich).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'products');

/**
 * Produktstamm eines Ordnernamens: Farb-Suffixe abtrennen, indem geprüft
 * wird, ob ein kürzeres Präfix selbst als Ordner existiert (Anker-Ordner
 * tragen kein Suffix). Beispiel: "gildan-heavy-t-royal" → "gildan-heavy-t".
 */
function productStem(folder, allFolders) {
  const parts = folder.split('-');
  for (let cut = 1; cut < parts.length; cut++) {
    const prefix = parts.slice(0, parts.length - cut).join('-');
    if (allFolders.has(prefix)) return prefix;
  }
  return folder;
}

const folders = (await fs.readdir(PRODUCTS_DIR, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
const folderSet = new Set(folders);

const byHash = new Map();
for (const folder of folders) {
  const file = path.join(PRODUCTS_DIR, folder, 'front.png');
  let buf;
  try {
    buf = await fs.readFile(file);
  } catch {
    continue; // Ordner ohne front.png (Legacy) überspringen
  }
  const hash = createHash('sha256').update(buf).digest('hex');
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push(folder);
}

let findings = 0;
for (const [hash, group] of byHash) {
  const stems = new Set(group.map((f) => productStem(f, folderSet)));
  if (stems.size > 1) {
    findings++;
    console.log(`DUPLIKAT (${hash.slice(0, 12)}…): ${group.join(', ')}`);
  }
}

if (findings === 0) {
  console.log(`OK: keine produktübergreifenden front.png-Duplikate (${folders.length} Ordner geprüft).`);
} else {
  console.log(`${findings} produktübergreifende Duplikat-Gruppe(n) gefunden.`);
  process.exit(1);
}
