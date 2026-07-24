/**
 * Prüft die Migrationsdateien strukturell – ohne sie auszuführen.
 *
 * Findet drei Fehler, die im Team schnell passieren und teuer sind:
 * doppelte Nummern (zwei Personen legen gleichzeitig 0020 an), Lücken
 * (eine Datei wurde nicht eingecheckt) und falsche Benennung.
 *
 * Angewendet wird hier NICHTS. Dass eine Migration erst gilt, wenn sie
 * angewendet und verifiziert ist, bleibt ein bewusster Schritt.
 */
import { readdirSync } from 'node:fs';

const VERZEICHNIS = 'supabase/migrations';
const MUSTER = /^(\d{4})_[a-z0-9_]+\.sql$/;

const dateien = readdirSync(VERZEICHNIS).filter((d) => d.endsWith('.sql')).sort();
const fehler = [];
const nummern = new Map();

for (const datei of dateien) {
  const treffer = MUSTER.exec(datei);
  if (!treffer) {
    fehler.push(`${datei}: erwartet wird NNNN_kleinbuchstaben_mit_unterstrich.sql`);
    continue;
  }
  const nummer = Number(treffer[1]);
  if (nummern.has(nummer)) {
    fehler.push(`Nummer ${treffer[1]} doppelt vergeben: ${nummern.get(nummer)} und ${datei}`);
  }
  nummern.set(nummer, datei);
}

const sortiert = [...nummern.keys()].sort((a, b) => a - b);
for (let i = 1; i < sortiert.length; i++) {
  const luecke = sortiert[i] - sortiert[i - 1];
  if (luecke > 1) {
    fehler.push(
      `Lücke zwischen ${String(sortiert[i - 1]).padStart(4, '0')} und ${String(sortiert[i]).padStart(4, '0')}` +
        ' – fehlt eine Datei im Repository?'
    );
  }
}

console.log(`${dateien.length} Migrationen geprüft (0001 bis ${String(sortiert.at(-1)).padStart(4, '0')}).`);
if (fehler.length > 0) {
  console.error('\nBefunde:');
  for (const f of fehler) console.error(`  ✘ ${f}`);
  process.exit(1);
}
console.log('Nummernfolge lückenlos, Benennung einheitlich.');
