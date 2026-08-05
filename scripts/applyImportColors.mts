/**
 * Trimmt importierte Produkte auf ihre tatsächlich bebilderten Farben (ADR 0006).
 *
 * Der Bildimport übernimmt bewusst nur die wichtigsten 6–7 Farben je Produkt
 * (Anweisung: keine 40er-Farbfächer). Dieses Skript reduziert die Farbliste der
 * betroffenen Produkte in importiert.generated.ts auf genau die Farben aus der
 * Job-Datei (in Job-Reihenfolge) – so zeigt der Katalog nur voll bebilderte
 * Farben statt vieler Platzhalter-Swatches. REPRODUZIERBAR: erneut ausführbar,
 * arbeitet ausschließlich an den in der Job-Datei genannten Produkten und lässt
 * bereits getrimmte Produkte unverändert.
 *
 * Aufruf:  npx tsx scripts/applyImportColors.mts scripts/import/teamshirtsJobs.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

type Farbe = { id: string; name?: string };
type Job = { productId: string; colors: Farbe[] };

const jobsPfad = process.argv[2] ?? 'scripts/import/teamshirtsJobs.json';
const zielDatei = 'src/config/products/importiert.generated.ts';
const jobs: Job[] = JSON.parse(readFileSync(jobsPfad, 'utf-8'));
let inhalt = readFileSync(zielDatei, 'utf-8');
const PUB = path.join(process.cwd(), 'public', 'products');

const summary: string[] = [];
for (const job of jobs) {
  // Nur auf Farben trimmen, die TATSÄCHLICH ein Bild bekamen (front.webp da) –
  // vom Ingest verworfene (nicht verfügbare) Farben werden nicht zu Platzhaltern.
  const keep = job.colors.map((c) => c.id).filter((id) => existsSync(path.join(PUB, `${job.productId}-${id}`, 'front.webp')));
  if (!keep.length) { summary.push(`${job.productId}: keine bebilderte Farbe – übersprungen`); continue; }
  // Produktblock ab `id: "<pid>"` bis zum colors-Array; die generierte Struktur
  // ist streng regelmäßig: colors: platzhalterFarbSet([ <zeilen> ], [ <views> ]),
  const idIdx = inhalt.indexOf(`id: "${job.productId}"`);
  if (idIdx === -1) { summary.push(`${job.productId}: NICHT gefunden – übersprungen`); continue; }
  const setIdx = inhalt.indexOf('platzhalterFarbSet([', idIdx);
  const realIdx = inhalt.indexOf('realPhotoColorSet(', idIdx);
  if (setIdx === -1 || (realIdx !== -1 && realIdx < setIdx)) {
    summary.push(`${job.productId}: bereits umgestellt/kein platzhalterFarbSet – übersprungen`);
    continue;
  }
  const arrStart = setIdx + 'platzhalterFarbSet(['.length;
  const arrEnde = inhalt.indexOf('], [', arrStart); // Ende des Farb-Arrays vor dem views-Arg
  if (arrEnde === -1) { summary.push(`${job.productId}: Farb-Array-Ende nicht gefunden – übersprungen`); continue; }
  const block = inhalt.slice(arrStart, arrEnde);
  const zeilen = block.split('\n').map((z) => z.trim()).filter((z) => z.startsWith('{ id:'));
  const byId = new Map<string, string>();
  for (const z of zeilen) {
    const m = z.match(/id:\s*"([^"]+)"/);
    if (m) byId.set(m[1], z.replace(/,\s*$/, ''));
  }
  const fehlt = keep.filter((id) => !byId.has(id));
  if (fehlt.length) { summary.push(`${job.productId}: Farb-IDs fehlen im Katalog: ${fehlt.join(', ')} – übersprungen`); continue; }
  const neuBlock = '\n' + keep.map((id) => `      ${byId.get(id)},`).join('\n') + '\n    ';
  inhalt = inhalt.slice(0, arrStart) + neuBlock + inhalt.slice(arrEnde);
  summary.push(`${job.productId}: ${byId.size} → ${keep.length} Farben (${keep.join(', ')})`);
}

writeFileSync(zielDatei, inhalt);
console.log(summary.join('\n'));

// ── Facetten-Bereinigung ────────────────────────────────────────────────
// Das Trimmen entfernt Farben → in facettenGeneriert.generated.ts (einem Generat)
// können Farbnamen verwaisen. Der Wächter „keine toten Einträge" (facetten.test)
// surft das an; wir entfernen die nun ungenutzten FARBGRUPPEN_GENERIERT-Einträge
// (nur Farbnamen, die KEIN Produkt mehr trägt). Reproduzierbar, verliert keine
// genutzte Zuordnung.
const genDatei = 'src/config/products/facettenGeneriert.generated.ts';
const { PRODUCTS } = await import('../src/config/products/index.ts');
const genutzteFarben = new Set(PRODUCTS.flatMap((p) => p.colors.map((c) => c.name)));
let gen = readFileSync(genDatei, 'utf-8');
const block = gen.match(/export const FARBGRUPPEN_GENERIERT[^{]*\{([\s\S]*?)\n\};/);
if (block) {
  const zeilen = block[1].split('\n');
  let entfernt = 0;
  const behalten = zeilen.filter((z) => {
    const m = z.match(/^\s*"((?:[^"\\]|\\.)*)":/);
    if (!m) return true;
    const name = m[1].replace(/\\"/g, '"');
    if (genutzteFarben.has(name)) return true;
    entfernt++;
    return false;
  });
  if (entfernt > 0) {
    gen = gen.replace(block[1], behalten.join('\n'));
    writeFileSync(genDatei, gen);
    console.log(`\nFacetten-Bereinigung: ${entfernt} tote FARBGRUPPEN_GENERIERT-Einträge entfernt.`);
  }
}
