/**
 * Sucht versehentlich eingecheckte Zugangsdaten im Quelltext.
 *
 * Die Muster sind bewusst eng: Ein Prüflauf, der bei jedem zweiten Push
 * grundlos anschlägt, wird nach einer Woche ignoriert und schützt dann gar
 * nicht mehr. Gesucht wird nach dem, was tatsächlich ein Schlüssel ist –
 * nicht nach Wörtern wie "secret" in einem Kommentar.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MUSTER = [
  { name: 'Stripe-Schlüssel', regex: /\b(sk|rk)_(test|live)_[A-Za-z0-9]{20,}/ },
  { name: 'Supabase Service-Role (JWT)', regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./ },
  { name: 'Resend-Schlüssel', regex: /\bre_[A-Za-z0-9]{20,}/ },
  { name: 'Private-Key-Block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Datenbank-URL mit Passwort', regex: /postgres(ql)?:\/\/[^:\s]+:[^@\s]{8,}@/ },
];

const UEBERSPRINGEN = new Set(['node_modules', '.next', '.git', '.testablage', 'coverage']);
const ENDUNGEN = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|sql)$/;

function dateien(verzeichnis, gesammelt = []) {
  for (const eintrag of readdirSync(verzeichnis)) {
    if (UEBERSPRINGEN.has(eintrag)) continue;
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) dateien(pfad, gesammelt);
    else if (ENDUNGEN.test(eintrag)) gesammelt.push(pfad);
  }
  return gesammelt;
}

const alle = dateien('.');
const funde = [];

for (const datei of alle) {
  const zeilen = readFileSync(datei, 'utf8').split('\n');
  zeilen.forEach((zeile, i) => {
    for (const { name, regex } of MUSTER) {
      if (regex.test(zeile)) funde.push(`${datei}:${i + 1} – ${name}`);
    }
  });
}

console.log(`${alle.length} Dateien auf Zugangsdaten geprüft.`);
if (funde.length > 0) {
  console.error('\nMÖGLICHE ZUGANGSDATEN GEFUNDEN:');
  for (const f of funde) console.error(`  ✘ ${f}`);
  console.error('\nFalls es sich um einen Fehlalarm handelt, das Muster in scripts/pruefeSecrets.mjs schärfen.');
  console.error('Falls nicht: Der Schlüssel gilt als kompromittiert und muss erneuert werden.');
  process.exit(1);
}
console.log('Keine Zugangsdaten im Quelltext.');
