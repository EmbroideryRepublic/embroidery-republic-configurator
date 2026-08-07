/**
 * `npm audit` mit einer DATIERTEN, BEGRÜNDETEN Ausnahmeliste statt eines
 * blinden `|| true`.
 *
 * ── Warum dieses Skript existiert ─────────────────────────────────────
 * `docs/next-upgrade-entscheidung.md` analysiert ausführlich, warum das
 * Next.js-Upgrade (einziger Weg, die verbleibenden Advisories zu schließen)
 * für Version 1.0 bewusst zurückgestellt ist: Es bricht nachweislich den
 * Konfigurator-Canvas (react-konva erfordert React 19, das App Router unter
 * Next 15+ dagegen inkompatibel macht). Der dortige Abschnitt 4 verlangt
 * ausdrücklich: „CI: npm audit --audit-level=high schlägt weiterhin fehl –
 * als datierte, begründete Ausnahme führen, nicht stillschweigend
 * ignorieren." Bis heute lief in der CI aber die rohe, ungefilterte
 * Prüfung (`pruefung.yml`) – sie wäre also bei jedem Push rot gewesen.
 *
 * ── Wie die Ausnahme funktioniert ──────────────────────────────────────
 * Jede gemeldete Schwachstelle wird gegen die Liste unten geprüft (Paketname
 * + betroffene Versionsspanne). Nur EXAKT diese, bereits analysierten
 * Fälle werden durchgelassen. Eine neue Schwachstelle in einem anderen
 * Paket – oder eine, deren Versionsspanne sich ändert (=vermutlich ein
 * ANDERES, neues Advisory) – lässt die Prüfung weiterhin fehlschlagen. Das
 * ist der Unterschied zu einem pauschalen `|| true`: Diese Liste muss
 * aktiv gepflegt werden, sie schweigt nicht automatisch zu Neuem.
 *
 * ── Monatliche Pflicht ─────────────────────────────────────────────────
 * `next-upgrade-entscheidung.md` verlangt eine monatliche Prüfung der
 * Advisory-Lage. Diese Datei ist der richtige Ort, das Ergebnis
 * festzuhalten (Datum unten aktualisieren) – und der richtige Ort, um bei
 * einem Advisory mit Datenabfluss/Codeausführung SOFORT neu zu bewerten
 * (dann: Zeile entfernen, CI schlägt an, Upgrade vorziehen).
 */
import { execSync } from 'node:child_process';

/**
 * Stand 2026-08-07 (siehe docs/next-upgrade-entscheidung.md für die
 * vollständige Analyse, welche Advisories tatsächlich anwendbar sind – die
 * meisten sind es NICHT, mangels Middleware/Pages-Router/rewrites/Edge/CSP-
 * Nonces/custom Server in diesem Projekt. Das verbleibende Restrisiko ist
 * überwiegend Verfügbarkeit (DoS), kein Datenabfluss, keine Codeausführung).
 *
 * Jeder Eintrag: welches Paket, welche Versionsspanne (exakt wie von
 * `npm audit --json` gemeldet – ändert sie sich, ist es vermutlich ein NEUES
 * Advisory und soll NICHT stillschweigend durchgehen).
 */
const AKZEPTIERTE_AUSNAHMEN = [
  { name: 'next', range: '9.3.4-canary.0 - 16.3.0-preview.10' },
  { name: 'postcss', range: '<=8.5.22' },
  { name: '@next/eslint-plugin-next', range: '14.0.5-canary.0 - 15.0.0-rc.1' },
  { name: 'eslint-config-next', range: '14.0.5-canary.0 - 15.0.0-rc.1' },
  { name: 'glob', range: '10.2.0 - 10.4.5' },
];

function istAkzeptiert(name, range) {
  return AKZEPTIERTE_AUSNAHMEN.some((a) => a.name === name && a.range === range);
}

let bericht;
try {
  // Exit-Code von `npm audit` ist bei Funden ungleich 0 – execSync würfe
  // dann, obwohl das JSON auf stdout korrekt vorliegt. Deshalb wird der
  // Fehlerfall abgefangen und stdout trotzdem ausgewertet.
  bericht = execSync('npm audit --audit-level=high --json', { encoding: 'utf8' });
} catch (fehler) {
  bericht = fehler.stdout?.toString() ?? '{}';
}

let daten;
try {
  daten = JSON.parse(bericht);
} catch {
  console.error('`npm audit --json` lieferte kein auswertbares JSON:');
  console.error(bericht);
  process.exit(1);
}

const gefunden = Object.values(daten.vulnerabilities ?? {}).filter((v) => v.severity === 'high' || v.severity === 'critical');

const neu = gefunden.filter((v) => !istAkzeptiert(v.name, v.range));
const bekannt = gefunden.filter((v) => istAkzeptiert(v.name, v.range));

console.log(`${gefunden.length} Schwachstelle(n) ≥ high gemeldet.`);
if (bekannt.length > 0) {
  console.log(`${bekannt.length} davon sind bereits analysiert und akzeptiert (docs/next-upgrade-entscheidung.md):`);
  for (const v of bekannt) console.log(`  · ${v.name} (${v.range}, ${v.severity})`);
}

if (neu.length > 0) {
  console.error(`\n${neu.length} NEUE, NICHT akzeptierte Schwachstelle(n) – CI schlägt an:`);
  for (const v of neu) console.error(`  ✘ ${v.name} (${v.range}, ${v.severity})`);
  console.error(
    '\nEntweder beheben (`npm audit fix`, ggf. gezielt), oder – nach Analyse wie in ' +
      'docs/next-upgrade-entscheidung.md – bewusst in scripts/pruefeNpmAudit.mjs aufnehmen.'
  );
  process.exit(1);
}

console.log('\nKeine neuen Schwachstellen ≥ high. Alle Funde sind bekannt, analysiert und begründet zurückgestellt.');
