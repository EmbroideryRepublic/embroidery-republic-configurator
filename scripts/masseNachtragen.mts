/**
 * Trägt die Größentabellen nach, die der Erstimport (scripts/importiereProdukte.mts) nicht mitgebracht hat.
 *
 * Hintergrund: 19 importierte Produkte hatten keine eigene Maßtabelle, zwei nur eine einzelne Zeile. Sie liehen sich die Tabelle des
 * Klassenvertreters (ein Damenshirt die eines Herrenshirts) bzw. rechneten die Fläche für fehlende Größen aus den Nachbarn. Die
 * Lieferantenseite (textil-grosshandel.eu) führt die Tabelle im Dialog „Größentabelle“: A = Breite über die Brust (ca. 1 cm unter dem
 * Armansatz), B = Länge vom höchsten Schulterpunkt bis zum Saum, Richtwerte ±2 cm. Abgerufen am 2026-11-20, Quelle je Produkt in
 * `scripts/import/masse-nachtrag.json`.
 *
 * Schreibt `sizeGuide` in `src/config/products/importiert.generated.ts` (einfügen bzw. ersetzen). Idempotent: ein zweiter Lauf ändert nichts.
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/masseNachtragen.mts
 *
 * Nicht nachgetragen (keine Tabelle bei einer Quelle): russell-ladies-pure-organic-heavy-tee (Z118F, bei keinem Lieferanten gelistet) und
 * id-identity-microfleece-jacke (0803, Seite ohne Maßtabelle). Beide behalten die Tabelle des Klassenvertreters.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DATEI = 'src/config/products/importiert.generated.ts';
const REIHENFOLGE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];

interface Eintrag {
  zeilen: { size: string; breiteCm: number; hoeheCm: number }[];
}
const daten = JSON.parse(readFileSync('scripts/import/masse-nachtrag.json', 'utf8')) as Record<string, Eintrag>;

let text = readFileSync(DATEI, 'utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
text = text.replace(/\r\n/g, '\n');
let geaendert = 0;

for (const [id, eintrag] of Object.entries(daten)) {
  const start = text.indexOf(`    id: ${JSON.stringify(id)},`);
  if (start < 0) throw new Error(`Produkt ${id} nicht in ${DATEI} gefunden`);
  const ende = text.indexOf('\n  },\n', start);
  const block = text.slice(start, ende);

  const zeilen = [...eintrag.zeilen].sort((a, b) => REIHENFOLGE.indexOf(a.size) - REIHENFOLGE.indexOf(b.size));
  const messungen = zeilen.map((z) => `        { size: ${JSON.stringify(z.size)}, breiteCm: ${z.breiteCm}, hoeheCm: ${z.hoeheCm} },`).join('\n');
  const neu = `    sizeGuide: {\n      measurements: [\n${messungen}\n      ],\n      fitRating: 50,\n    },`;

  let neuerBlock: string;
  if (/\n    sizeGuide: \{[\s\S]*?\n    \},/.test(block)) {
    neuerBlock = block.replace(/\n    sizeGuide: \{[\s\S]*?\n    \},/, `\n${neu}`);
  } else {
    const viewsZeile = /\n    views: \[[^\]]*\],/.exec(block);
    if (!viewsZeile) throw new Error(`Produkt ${id}: keine views-Zeile als Einfügemarke`);
    const stelle = viewsZeile.index + viewsZeile[0].length;
    neuerBlock = `${block.slice(0, stelle)}\n${neu}${block.slice(stelle)}`;
  }
  if (neuerBlock !== block) {
    text = text.slice(0, start) + neuerBlock + text.slice(ende);
    geaendert++;
  }
}

writeFileSync(DATEI, text.replace(/\n/g, eol), 'utf8');
console.log(`${geaendert} von ${Object.keys(daten).length} Produkten geändert.`);
