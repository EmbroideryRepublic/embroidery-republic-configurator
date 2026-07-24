/**
 * Entfernt Testbestellungen aus früheren Entwicklungsläufen.
 *
 * ── Sicherheitsvorkehrungen ───────────────────────────────────────────
 * Gelöscht wird über eine EXPLIZITE Namensliste, nicht über ein Suchmuster.
 * Ein Muster wie „%Test%" träfe irgendwann auch eine echte Bestellung von
 * jemandem, der „Testorf" heißt – und niemandem fiele es auf.
 *
 * Zusätzlich:
 *   • Namen, die ausdrücklich GESCHÜTZT sind, brechen den Lauf ab.
 *   • Weicht die gefundene Anzahl von der erwarteten ab, wird abgebrochen.
 *   • Vollständige Sicherung als JSON, bevor irgendetwas gelöscht wird.
 *   • Alles in EINER Transaktion – ein Fehler rollt alles zurück.
 *
 * Aufruf: node scripts/entferneTestbestellungen.mjs <sicherungsdatei> [--wirklich]
 *         Ohne --wirklich ist es ein Probelauf.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';

/** Exakte Kundennamen der zu entfernenden Testdatensätze. */
const TESTNAMEN = [
  'E2E Test',
  'Error Test',
  'Stage D',
  'Email Test',
  'Stufe A-Test',
  'FOTL Pilot-Test',
  'Supplier-Engine Test',
  'Auto Test',
  'Test Bestellung',
  'Audit Test',
  'TG-E2E Testlauf',
  'TG-E2E Einzelgroesse',
  'TG-E2E Audit',
  'TG-E2E Warenkorbnachweis',
  'Storno Testfall1',
  'Ereignis Testfall2',
  'Lieferantenstart Testfall3',
];

/** Diese Namen dürfen NIEMALS getroffen werden – Abbruch, falls doch. */
const GESCHUETZT = ['Ihsan Uzun', 'Embroidery Republic'];

const ERWARTET = 19; // 3× „E2E Test" + 16 weitere

const sicherungsDatei = process.argv[2];
const wirklich = process.argv.includes('--wirklich');
if (!sicherungsDatei) {
  console.error('Aufruf: node scripts/entferneTestbestellungen.mjs <sicherungsdatei> [--wirklich]');
  process.exit(1);
}

const env = {};
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = zeile.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (t) env[t[1]] = t[2].trim().replace(/^["']|["']$/g, '');
}
const client = new pg.Client({
  connectionString: env.DIRECT_URL || env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows: kandidaten } = await client.query(
  `select id, customer_name, email, order_type, status, total_price, quantity, created_at
     from orders where customer_name = any($1) order by created_at`,
  [TESTNAMEN]
);

console.log(`Gefunden: ${kandidaten.length} Datensätze (erwartet ${ERWARTET})\n`);
for (const k of kandidaten) {
  console.log(`  ${k.created_at.toISOString().slice(0, 16)} | ${k.customer_name.padEnd(26)} | ${k.email}`);
}

// ── Sicherheitsprüfungen ───────────────────────────────────────────────
const geschuetzteTreffer = kandidaten.filter((k) => GESCHUETZT.includes(k.customer_name));
if (geschuetzteTreffer.length > 0) {
  console.error(`\n✘ ABBRUCH: geschützter Name in der Auswahl (${geschuetzteTreffer.map((k) => k.customer_name).join(', ')}).`);
  await client.end();
  process.exit(1);
}
if (kandidaten.length !== ERWARTET) {
  console.error(`\n✘ ABBRUCH: ${kandidaten.length} statt ${ERWARTET} Datensätze. Der Bestand hat sich geändert – bitte erneut prüfen.`);
  await client.end();
  process.exit(1);
}

// ── Sicherung VOR dem Löschen ──────────────────────────────────────────
const ids = kandidaten.map((k) => k.id);
const { rows: positionen } = await client.query(`select * from order_items where order_id = any($1)`, [ids]);
const { rows: elemente } = await client.query(
  `select ce.* from configuration_elements ce join order_items oi on oi.id = ce.order_item_id where oi.order_id = any($1)`,
  [ids]
);
const { rows: ereignisse } = await client.query(`select * from order_events where order_id = any($1)`, [ids]);

writeFileSync(
  sicherungsDatei,
  JSON.stringify({ erstellt: new Date().toISOString(), orders: kandidaten, positionen, elemente, ereignisse }, null, 2)
);
console.log(
  `\nSicherung: ${sicherungsDatei}\n` +
    `  ${kandidaten.length} Bestellungen, ${positionen.length} Positionen, ${elemente.length} Motive, ${ereignisse.length} Ereignisse`
);

if (!wirklich) {
  console.log('\nPROBELAUF – nichts gelöscht. Mit --wirklich ausführen.');
  await client.end();
  process.exit(0);
}

// ── Löschen ────────────────────────────────────────────────────────────
try {
  await client.query('begin');
  const vorher = (await client.query('select count(*)::int n from orders')).rows[0].n;
  // order_items, configuration_elements und order_events hängen mit
  // ON DELETE CASCADE daran und verschwinden mit.
  const { rowCount } = await client.query('delete from orders where id = any($1)', [ids]);
  const nachher = (await client.query('select count(*)::int n from orders')).rows[0].n;

  if (rowCount !== ERWARTET || vorher - nachher !== ERWARTET) {
    throw new Error(`Unerwartetes Ergebnis: ${rowCount} gelöscht, Bestand ${vorher} → ${nachher}.`);
  }
  await client.query('commit');
  console.log(`\n✔ ${rowCount} Testbestellungen entfernt. Bestand: ${vorher} → ${nachher}.`);
} catch (fehler) {
  await client.query('rollback').catch(() => {});
  console.error('\n✘ FEHLGESCHLAGEN, zurückgerollt:', fehler.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
