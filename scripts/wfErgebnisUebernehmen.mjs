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
 * `--ergaenzend`: Für Läufe, die nur EINE Ansicht nachliefern (Rückseite,
 * Ärmel). Solche Ergebnisse haben kein `front` – und ingestDirect LÖSCHT einen
 * Zielordner, in dem es keine Vorderansicht findet. Die vorhandene Front-URL
 * wird deshalb aus dem letzten Importjob derselben Farbe ergänzt; Farben ohne
 * bekannte Front-URL werden ausgelassen, statt ihren Ordner zu gefährden.
 *
 *   node scripts/wfErgebnisUebernehmen.mjs <workflow.output> <tag> [--ergaenzend]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [, , quelle, tag] = process.argv;
if (!quelle || !tag) throw new Error('Aufruf: node scripts/wfErgebnisUebernehmen.mjs <output-datei> <tag>');
const ergaenzend = process.argv.includes('--ergaenzend');

/** productId → colorId → zuletzt verwendete Front-URL. */
const fronts = new Map();
if (ergaenzend) {
  const dir = join('scripts', 'import');
  const dateien = readdirSync(dir)
    .filter((f) => f.startsWith('directJobs') && f.endsWith('.json'))
    .map((f) => ({ f, zeit: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => a.zeit - b.zeit);
  for (const { f } of dateien) {
    let jobs;
    try {
      jobs = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch {
      continue;
    }
    for (const j of Array.isArray(jobs) ? jobs : []) {
      if (!j.productId) continue;
      let proFarbe = fronts.get(j.productId);
      if (!proFarbe) fronts.set(j.productId, (proFarbe = new Map()));
      for (const c of j.colors ?? []) if (c?.id && c?.front) proFarbe.set(c.id, c.front);
    }
  }
}

// Die Ausgabedatei ist {summary, agentCount, logs, result: [...]}; interessant
// ist nur `result`. Ältere Läufe legten das Array direkt ab – beides lesen.
const geladen = JSON.parse(readFileSync(quelle, 'utf8'));
const ergebnisse = Array.isArray(geladen) ? geladen : geladen.result;
if (!Array.isArray(ergebnisse)) throw new Error('Kein Ergebnis-Array in der Ausgabedatei');

const jobs = [];
const offen = [];
let farben = 0;

let ohneFront = 0;

for (const e of ergebnisse) {
  if (!e?.productId) continue;
  const roh = ergaenzend
    ? (e.colors ?? []).map((c) => {
        if (!c?.id || c.front) return c;
        const front = fronts.get(e.productId)?.get(c.id);
        if (!front) {
          ohneFront++;
          return null;
        }
        return { ...c, front };
      })
    : (e.colors ?? []);
  const colors = roh.filter((c) => c?.id && c?.front);
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
if (ohneFront) console.log(`${ohneFront} Farben ausgelassen: keine bekannte Front-URL (Altbestand)`);
console.log(`${offen.length} nicht beschaffbar → ${zielOffen}`);
for (const o of offen) console.log(`  ${o.productId}/${o.colorId}: ${o.grund.slice(0, 90)}`);
