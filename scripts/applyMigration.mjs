/**
 * Wendet EINE Migrationsdatei an – transaktional und nachprüfbar.
 *
 * In dieser Umgebung gibt es kein Supabase-CLI; Migrationen werden über eine
 * direkte Verbindung eingespielt. Dieses Skript macht daraus einen
 * kontrollierten Vorgang statt eines Einzeilers:
 *
 *  1. Zustandsabbild VOR der Migration (Zeilenzahlen + Summen je Tabelle).
 *  2. Die gesamte Datei läuft in EINER Transaktion. Schlägt irgendein
 *     Schritt fehl, wird alles zurückgerollt – es gibt keinen halb
 *     migrierten Stand.
 *  3. Zustandsabbild NACH der Migration und Vergleich. Weicht ein Wert ab,
 *     wird das ausgewiesen: eine Migration, die Bestand verändern soll, muss
 *     das sichtbar tun, nicht nebenbei.
 *
 * Aufruf:  node scripts/applyMigration.mjs supabase/migrations/00XX_....sql
 *          node scripts/applyMigration.mjs <datei> --dry    (nur prüfen)
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const datei = process.argv[2];
const nurPruefen = process.argv.includes('--dry');
if (!datei) {
  console.error('Aufruf: node scripts/applyMigration.mjs <migrationsdatei> [--dry]');
  process.exit(1);
}

/** .env.local lesen. Die Werte sind teils in Anführungszeichen gefasst –
 *  ohne das Entfernen scheitert die Verbindung mit einem irreführenden
 *  Namensauflösungsfehler. */
function leseEnv() {
  const env = {};
  for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const treffer = zeile.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (treffer) env[treffer[1]] = treffer[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

/** Kennzahlen, die eine additive Migration NICHT verändern darf. */
async function zustand(client) {
  const tabellen = ['orders', 'order_items', 'configuration_elements', 'order_events'];
  const werte = {};
  for (const tabelle of tabellen) {
    const da = await client.query(
      `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
      [tabelle]
    );
    if (da.rowCount === 0) continue;
    const { rows } = await client.query(`select count(*)::int anzahl from public.${tabelle}`);
    werte[tabelle] = rows[0].anzahl;
  }
  const summe = await client.query(`select coalesce(sum(total_price),0)::text s from public.orders`);
  werte['orders.summe_total_price'] = summe.rows[0].s;
  return werte;
}

const env = leseEnv();
const verbindung = env.DIRECT_URL || env.DATABASE_URL;
if (!verbindung) {
  console.error('Weder DIRECT_URL noch DATABASE_URL in .env.local gefunden.');
  process.exit(1);
}

const sql = readFileSync(datei, 'utf8');
const client = new pg.Client({ connectionString: verbindung, ssl: { rejectUnauthorized: false } });

await client.connect();
console.log(`\n── ${datei} ──`);

const vorher = await zustand(client);
console.log('Bestand vorher :', JSON.stringify(vorher));

try {
  await client.query('begin');
  await client.query(sql);

  const nachher = await zustand(client);

  if (nurPruefen) {
    await client.query('rollback');
    console.log('Bestand nachher:', JSON.stringify(nachher));
    console.log('PROBELAUF – zurückgerollt, nichts geändert.');
  } else {
    await client.query('commit');
    console.log('Bestand nachher:', JSON.stringify(nachher));

    const abweichungen = Object.keys(vorher).filter((k) => String(vorher[k]) !== String(nachher[k]));
    if (abweichungen.length > 0) {
      console.log(`⚠ BESTAND VERÄNDERT: ${abweichungen.map((k) => `${k}: ${vorher[k]} → ${nachher[k]}`).join(', ')}`);
    } else {
      console.log('✔ Angewendet. Bestand unverändert – kein Datensatz verloren.');
    }
  }
} catch (fehler) {
  await client.query('rollback').catch(() => {});
  console.error('✘ FEHLGESCHLAGEN, vollständig zurückgerollt:', fehler.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
