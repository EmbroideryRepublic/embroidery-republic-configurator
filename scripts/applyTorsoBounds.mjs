/**
 * Wendet die von measureTorsoBounds.mjs gemessenen Torso-Grenzen auf die
 * MEASURED-Einträge in src/config/printAreas.ts an (nur front/back,
 * nur x0/x1 – y-Werte und Ärmelansichten bleiben unverändert).
 *
 * Sicherheit:
 *  - legt vorher eine Backup-Kopie an (Pfad wird ausgegeben),
 *  - ersetzt NUR, wenn der Produktblock und die Zeilen eindeutig
 *    gefunden werden – sonst wird das Produkt übersprungen und gemeldet.
 *
 * Aufruf: node scripts/measureTorsoBounds.mjs > torso.json
 *         node scripts/applyTorsoBounds.mjs torso.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(__dirname, '..', 'src', 'config', 'printAreas.ts');
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Nutzung: node scripts/applyTorsoBounds.mjs <torso.json>');
  process.exit(1);
}

const measurements = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let source = fs.readFileSync(TARGET, 'utf8');

const backupPath = path.join(process.env.TEMP ?? '/tmp', `printAreas.backup.${Date.now()}.ts`);
fs.writeFileSync(backupPath, source);
console.log('Backup:', backupPath);

let applied = 0;
const skipped = [];

for (const [productId, views] of Object.entries(measurements)) {
  // Produktblock lokalisieren: von "'id': {" bis zur nächsten schließenden
  // "  }," auf Einrückungstiefe 2.
  const blockStart = source.indexOf(`'${productId}': {`);
  if (blockStart < 0) {
    skipped.push(`${productId}: Block nicht gefunden`);
    continue;
  }
  const blockEnd = source.indexOf('\n  },', blockStart);
  if (blockEnd < 0) {
    skipped.push(`${productId}: Blockende nicht gefunden`);
    continue;
  }
  let block = source.slice(blockStart, blockEnd);

  for (const view of ['front', 'back']) {
    const m = views[view];
    if (!m || m.error) {
      skipped.push(`${productId}/${view}: ${m?.error ?? 'keine Messung'}`);
      continue;
    }
    const lineRe = new RegExp(`(${view}: \\{ x0: )[\\d.]+(, y0: [\\d.]+, x1: )[\\d.]+(,)`);
    if (!lineRe.test(block)) {
      skipped.push(`${productId}/${view}: Zeile nicht gefunden`);
      continue;
    }
    block = block.replace(lineRe, `$1${m.x0}$2${m.x1}$3`);
    applied++;
  }

  source = source.slice(0, blockStart) + block + source.slice(blockEnd);
}

fs.writeFileSync(TARGET, source);
console.log(`Aktualisiert: ${applied} Ansichten.`);
if (skipped.length > 0) {
  console.log('Übersprungen:');
  for (const s of skipped) console.log('  -', s);
}
