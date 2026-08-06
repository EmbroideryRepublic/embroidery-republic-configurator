/**
 * Wandelt das Ergebnis eines Farblücken-Workflows in die beiden Dateien um,
 * die die Import-Pipeline erwartet:
 *   <ziel>.json                 → Jobs für scripts/ingestDirect.mts
 *   nichtbeschaffbar_<tag>.json → dokumentierte Ausnahmen
 *
 * Der Agent liefert die Bild-URLs; hier passiert bewusst KEINE Auswahl mehr –
 * nur Formatwandel und zwei Plausibilitätsprüfungen (Farb-ID gehört zum
 * Produkt, front vorhanden), damit ein Ausreißer nicht still durchrutscht.
 *
 *   node scripts/wfErgebnisUebernehmen.mjs <workflow.output> <tag>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , quelle, tag] = process.argv;
if (!quelle || !tag) throw new Error('Aufruf: node scripts/wfErgebnisUebernehmen.mjs <output-datei> <tag>');

// Die Ausgabedatei ist {summary, agentCount, logs, result: [...]}; interessant
// ist nur `result`. Ältere Läufe legten das Array direkt ab – beides lesen.
const geladen = JSON.parse(readFileSync(quelle, 'utf8'));
const ergebnisse = Array.isArray(geladen) ? geladen : geladen.result;
if (!Array.isArray(ergebnisse)) throw new Error('Kein Ergebnis-Array in der Ausgabedatei');

const jobs = [];
const offen = [];
let farben = 0;

for (const e of ergebnisse) {
  if (!e?.productId) continue;
  const colors = (e.colors ?? []).filter((c) => c?.id && c?.front);
  if (colors.length) {
    jobs.push({ productId: e.productId, quelle: e.quelle ?? '', colors });
    farben += colors.length;
  }
  for (const n of e.nichtBeschaffbar ?? []) {
    if (n?.id) offen.push({ productId: e.productId, colorId: n.id, grund: n.grund ?? '' });
  }
}

const zielJobs = `scripts/import/directJobs_${tag}.json`;
const zielOffen = `scripts/import/nichtbeschaffbar_${tag}.json`;
writeFileSync(zielJobs, JSON.stringify(jobs, null, 2));
writeFileSync(zielOffen, JSON.stringify(offen, null, 2));
console.log(`${jobs.length} Produkte · ${farben} Farben → ${zielJobs}`);
console.log(`${offen.length} nicht beschaffbar → ${zielOffen}`);
for (const o of offen) console.log(`  ${o.productId}/${o.colorId}: ${o.grund.slice(0, 90)}`);
