/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE-LIMIT GEGEN DIE ECHTE DATENBANK
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Aufruf: npm run test:e2e:ratelimit
 *
 * Warum als eigener Lauf und nicht als Unit-Test: Der entscheidende Punkt
 * ist die ATOMARITÄT bei parallelen Anfragen. Die lässt sich nur gegen eine
 * echte Datenbank prüfen – ein nachgebauter Zähler würde genau die
 * Eigenschaft nicht abbilden, um die es geht.
 *
 * Räumt seine Testschlüssel selbst wieder ab.
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const env: Record<string, string> = {};
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile);
  if (t) env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}

const client = new pg.Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });

/**
 * Eigener Verbindungspool für den Parallelitätstest.
 *
 * Über EINEN Client werden Abfragen serialisiert – der Test würde dann
 * nacheinander zählen und die Atomarität gar nicht prüfen. Erst mit
 * mehreren echten Verbindungen treffen die Anfragen tatsächlich
 * gleichzeitig auf die Datenbank.
 */
// max 10: Der Supabase-Pooler begrenzt eine Sitzung auf 15 Verbindungen.
// Zehn echte gleichzeitige Verbindungen genuegen, um die Atomaritaet zu
// pruefen – die restlichen Anfragen reihen sich dahinter ein.
const pool = new pg.Pool({ connectionString: env.DIRECT_URL || env.DATABASE_URL, max: 10 });

let bestanden = 0;
let fehlgeschlagen = 0;

function pruefe(bedingung: boolean, text: string): void {
  if (bedingung) {
    bestanden++;
    console.log(`  ✔ ${text}`);
  } else {
    fehlgeschlagen++;
    console.log(`  ✘ ${text}`);
  }
}

interface Antwort {
  erlaubt: boolean;
  anzahl: number;
  zuruecksetzen_in: number;
}

async function zaehle(schluessel: string, fenster: number, max: number): Promise<Antwort> {
  const r = await client.query('select * from pruefe_rate_limit($1, $2, $3)', [schluessel, fenster, max]);
  return r.rows[0] as Antwort;
}

async function main(): Promise<void> {
  await client.connect();
  const praefix = `e2e-test-${randomUUID()}`;

  try {
    console.log('='.repeat(72));
    console.log('RATE-LIMIT – Verhalten gegen die echte Datenbank');
    console.log('='.repeat(72));

    // ── 1. Der Normalfall ───────────────────────────────────────────
    console.log('\nZählen bis zur Grenze (Limit 3):');
    const s1 = `${praefix}:normal`;
    for (let i = 1; i <= 3; i++) {
      const a = await zaehle(s1, 3600, 3);
      pruefe(a.erlaubt && a.anzahl === i, `Zugriff ${i} erlaubt, Zählerstand ${a.anzahl}`);
    }
    const vierter = await zaehle(s1, 3600, 3);
    pruefe(!vierter.erlaubt, 'Zugriff 4 abgewiesen');
    pruefe(vierter.anzahl === 4, 'auch der abgewiesene Zugriff wird gezählt');
    pruefe(
      vierter.zuruecksetzen_in > 0 && vierter.zuruecksetzen_in <= 3600,
      `Wartezeit plausibel: ${vierter.zuruecksetzen_in}s`
    );

    // ── 2. Schlüssel sind getrennt ──────────────────────────────────
    console.log('\nTrennung der Schlüssel:');
    const andere = await zaehle(`${praefix}:andere-ip`, 3600, 3);
    pruefe(andere.erlaubt && andere.anzahl === 1, 'ein anderer Schlüssel hat einen eigenen Zähler');

    // ── 3. PARALLELE ANFRAGEN – der eigentliche Test ────────────────
    // Zwanzig gleichzeitige Zugriffe bei einem Limit von 5. Ein Zähler mit
    // „lesen, prüfen, schreiben" würde hier mehr als 5 durchlassen, weil
    // mehrere Anfragen denselben Stand lesen.
    console.log('\n20 gleichzeitige Anfragen bei Limit 5:');
    const s3 = `${praefix}:parallel`;
    const antworten = await Promise.all(
      Array.from({ length: 20 }, async () => {
        const r = await pool.query('select * from pruefe_rate_limit($1, $2, $3)', [s3, 3600, 5]);
        return r.rows[0] as Antwort;
      })
    );

    const erlaubte = antworten.filter((a) => a.erlaubt).length;
    pruefe(erlaubte === 5, `genau 5 durchgelassen (tatsächlich: ${erlaubte})`);

    const staende = antworten.map((a) => a.anzahl).sort((x, y) => x - y);
    pruefe(
      JSON.stringify(staende) === JSON.stringify(Array.from({ length: 20 }, (_, i) => i + 1)),
      'jeder Zugriff bekam einen eigenen Zählerstand 1…20 – keiner ging verloren'
    );
    pruefe(new Set(staende).size === 20, 'kein Zählerstand wurde doppelt vergeben');

    // ── 4. Fenster ──────────────────────────────────────────────────
    console.log('\nZeitfenster:');
    const s4 = `${praefix}:fenster`;
    const kurz = await zaehle(s4, 1, 1);
    pruefe(kurz.erlaubt, 'erster Zugriff im 1-Sekunden-Fenster erlaubt');
    const sofort = await zaehle(s4, 1, 1);
    pruefe(!sofort.erlaubt, 'zweiter Zugriff im selben Fenster abgewiesen');

    await new Promise((r) => setTimeout(r, 1600));
    const spaeter = await zaehle(s4, 1, 1);
    pruefe(spaeter.erlaubt && spaeter.anzahl === 1, 'nach Ablauf des Fensters wieder erlaubt, Zähler zurückgesetzt');

    // ── 5. Aufräumen ────────────────────────────────────────────────
    console.log('\nAufräumen alter Fenster:');
    await client.query(
      `insert into rate_limit_zaehler (schluessel, fenster_start, anzahl)
       values ($1, now() - interval '48 hours', 99)`,
      [`${praefix}:alt`]
    );
    const vorher = await client.query('select count(*)::int n from rate_limit_zaehler where schluessel = $1', [
      `${praefix}:alt`,
    ]);
    pruefe(vorher.rows[0].n === 1, 'alter Eintrag angelegt');

    await client.query('select raeume_rate_limit_auf()');
    const nachher = await client.query('select count(*)::int n from rate_limit_zaehler where schluessel = $1', [
      `${praefix}:alt`,
    ]);
    pruefe(nachher.rows[0].n === 0, 'Eintrag älter als 24 Stunden wurde entfernt');

    const frisch = await client.query('select count(*)::int n from rate_limit_zaehler where schluessel = $1', [s1]);
    pruefe(frisch.rows[0].n === 1, 'aktuelle Einträge bleiben unberührt');
  } finally {
    const weg = await client.query('delete from rate_limit_zaehler where schluessel like $1', [`${praefix}%`]);
    console.log(`\n${weg.rowCount} Testschlüssel entfernt.`);
    await pool.end();
    await client.end();
  }

  console.log('');
  console.log('='.repeat(72));
  if (fehlgeschlagen > 0) {
    console.log(`=== ${bestanden} bestanden, ${fehlgeschlagen} FEHLGESCHLAGEN ===`);
    process.exitCode = 1;
  } else {
    console.log(`=== ${bestanden}/${bestanden} Prüfungen bestanden ===`);
  }
}

void main();
