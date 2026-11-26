/**
 * Prüft die Datenbankseite der Besucher-Ereignisse (Migration 0040) gegen die ECHTE Datenbank – „geschrieben“, „angewendet“, „verifiziert“.
 *
 *   npm run besuch:ereignisse-pruefen
 *
 * ── Garantie: Es bleibt nichts zurück ────────────────────────────────────
 * Alles läuft in EINER Transaktion, die in jedem Fall zurückgerollt wird (`finally`). Das Skript führt die Migrationsdateien 0037 und 0040
 * (idempotent: `if not exists` / `or replace`) INNERHALB der Transaktion aus, leert die Zähltabellen dort für saubere Summen und prüft:
 *
 *   • Zählen: ein Besucher zählt ein Ereignis einmal pro Tag, ein zweiter Besucher zählt zusätzlich
 *   • Quelle: das Ereignis erbt die Quelle des ersten Seitenaufrufs des Tages; ohne Seitenaufruf gilt der Ersatzwert
 *   • Tageswechsel: Kennungen früherer Tage verschwinden, die Zahlen bleiben
 *   • Auswertung (lade_ereignisstatistik): Summen, Quellen, Tage, leere Listen statt null
 *   • Aufräumen: raeume_besuch_ereignisse_auf UND die erweiterte raeume_besuch_kennungen_auf (Rückgabewert wie vorher)
 *   • Zugriffsschutz: weder anon noch authenticated, Row Level Security ohne Policy
 *   • Spalten: keine IP-Adresse, keine Browserkennung, nichts zu Produkt, Datei, Preis, Person oder Bestellung
 *   • Trennung: keine Fremdschlüssel zu Bestell-, Zahlungs- oder Kundentabellen
 *
 * Der Bestand an Bestellungen wird vorher und nachher verglichen (muss identisch sein).
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

// Relativ zum Skript (nicht zum aktuellen Ordner): läuft auch aus einem anderen Arbeitsordner, in dem nur .env.local liegt.
const DATEIEN = ['../supabase/migrations/0037_besuchszaehler.sql', '../supabase/migrations/0040_besuch_ereignisse.sql'].map((d) => new URL(d, import.meta.url));
const TABELLEN = ['besuch_ereignisse', 'besuch_ereignis_kennungen'];
const ZAEHLTABELLEN = ['besuch_summe', 'besuch_seiten', 'besuch_quellen', 'besuch_kennungen', ...TABELLEN];
const FUNKTIONEN = [
  'public.erfasse_besuchs_ereignis(date,text,text,text)',
  'public.lade_ereignisstatistik(date)',
  'public.raeume_besuch_ereignisse_auf()',
];

function leseEnv() {
  const env = {};
  for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const treffer = zeile.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (treffer) env[treffer[1]] = treffer[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = leseEnv();
const verbindung = env.DIRECT_URL || env.DATABASE_URL;
if (!verbindung) {
  console.error('Weder DIRECT_URL noch DATABASE_URL in .env.local gefunden.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: verbindung, ssl: { rejectUnauthorized: false } });
let bestanden = 0;
const fehlgeschlagen = [];
function pruefe(name, bedingung, detail = '') {
  if (bedingung) {
    bestanden++;
    console.log(`  ✔ ${name}`);
  } else {
    fehlgeschlagen.push(name);
    console.log(`  ✘ ${name} ${detail}`);
  }
}
const eins = async (text, werte) => (await client.query(text, werte)).rows[0];
const alle = async (text, werte) => (await client.query(text, werte)).rows;
const bestellstand = async () => {
  const r = await eins(`select count(*)::int as n, coalesce(sum(total_price),0)::text as s from public.orders`);
  return `${r.n} Bestellungen, Summe ${r.s}`;
};

await client.connect();
let vorher;
let stand0;
try {
  vorher = (await eins(`select to_regclass('public.besuch_ereignisse') as t`)).t;
  stand0 = await bestellstand();
  console.log(`Vorher: Tabelle besuch_ereignisse ${vorher ? 'existiert bereits' : 'existiert noch nicht'}; ${stand0}.`);

  await client.query('begin');
  for (const d of DATEIEN) await client.query(readFileSync(d, 'utf8'));
  console.log('Migrationen laufen fehlerfrei (innerhalb der Transaktion).');
  for (const t of ['besuch_ereignisse', 'besuch_ereignis_kennungen', 'besuch_summe', 'besuch_seiten', 'besuch_quellen', 'besuch_kennungen']) {
    await client.query(`delete from public.${t}`);
  }

  console.log('\na) Besucher A öffnet den Konfigurator (kam über Pinterest, hat vorher eine Seite aufgerufen)');
  await client.query(`select public.erfasse_besuch('2026-01-10', '/', 'kennA', 'pinterest')`);
  await client.query(`select public.erfasse_besuchs_ereignis('2026-01-10', 'konfigurator_geoeffnet', 'kennA', 'ohne-kennzeichnung')`);
  let e = await alle(`select * from public.besuch_ereignisse where tag='2026-01-10'`);
  pruefe('1 Zeile: konfigurator_geoeffnet, Quelle pinterest (vom ersten Seitenaufruf geerbt), 1 Besucher', e.length === 1 && e[0].quelle === 'pinterest' && e[0].besucher === 1, JSON.stringify(e));

  console.log('\nb) Besucher A meldet dasselbe Ereignis nochmal (z. B. Seite neu geladen)');
  await client.query(`select public.erfasse_besuchs_ereignis('2026-01-10', 'konfigurator_geoeffnet', 'kennA', 'ohne-kennzeichnung')`);
  e = await alle(`select * from public.besuch_ereignisse where tag='2026-01-10' and ereignis='konfigurator_geoeffnet'`);
  pruefe('weiterhin 1 Besucher (einmal pro Tag)', e.length === 1 && e[0].besucher === 1, JSON.stringify(e));

  console.log('\nc) Besucher A legt etwas in den Warenkorb, Besucher B (ohne Seitenaufruf) öffnet den Konfigurator');
  await client.query(`select public.erfasse_besuchs_ereignis('2026-01-10', 'in_den_warenkorb', 'kennA', 'ohne-kennzeichnung')`);
  await client.query(`select public.erfasse_besuchs_ereignis('2026-01-10', 'konfigurator_geoeffnet', 'kennB', 'ohne-kennzeichnung')`);
  const summen = (await eins(`select public.lade_ereignisstatistik('2026-01-01') as j`)).j;
  const offen = summen.summen.find((x) => x.ereignis === 'konfigurator_geoeffnet');
  const korb = summen.summen.find((x) => x.ereignis === 'in_den_warenkorb');
  pruefe('Summe konfigurator_geoeffnet = 2 Besucher', offen && offen.besucher === 2, JSON.stringify(summen.summen));
  pruefe('Summe in_den_warenkorb = 1 Besucher', korb && korb.besucher === 1);
  const ohneSeite = summen.quellen.find((x) => x.quelle === 'ohne-kennzeichnung' && x.ereignis === 'konfigurator_geoeffnet');
  pruefe('Besucher B ohne Seitenaufruf: Ersatzquelle „ohne-kennzeichnung“', ohneSeite && ohneSeite.besucher === 1, JSON.stringify(summen.quellen));
  pruefe('Zahlen sind Zahlen (nicht Text)', typeof summen.summen[0].besucher === 'number' && typeof summen.quellen[0].besucher === 'number');
  pruefe('Verlauf je Tag enthält den 10.01.', summen.tage.some((x) => x.tag === '2026-01-10'), JSON.stringify(summen.tage));

  console.log('\nd) neuer Tag: derselbe Besucher zählt erneut, die Kennungen des Vortags verschwinden');
  await client.query(`select public.erfasse_besuchs_ereignis('2026-01-11', 'konfigurator_geoeffnet', 'kennA', 'ohne-kennzeichnung')`);
  pruefe('Kennungen des Vortags gelöscht', (await eins(`select count(*)::int c from public.besuch_ereignis_kennungen where tag='2026-01-10'`)).c === 0);
  pruefe('Zahlen des Vortags bleiben (2 Besucher konfigurator_geoeffnet)', (await eins(`select coalesce(sum(besucher),0)::int c from public.besuch_ereignisse where tag='2026-01-10' and ereignis='konfigurator_geoeffnet'`)).c === 2);

  console.log('\ne) Auswertung ohne Daten');
  const leer = (await eins(`select public.lade_ereignisstatistik('2999-01-01') as j`)).j;
  pruefe('leere Listen statt null', leer.summen.length === 0 && leer.quellen.length === 0 && leer.tage.length === 0, JSON.stringify(leer));

  console.log('\nf) Aufräumen');
  const heute = (await eins(`select (now() at time zone 'Europe/Berlin')::date::text as t`)).t;
  await client.query(`insert into public.besuch_ereignis_kennungen (tag, ereignis, kennung) values ('2000-01-01','konfigurator_geoeffnet','alt'), ($1,'konfigurator_geoeffnet','heutig')`, [heute]);
  const entfernt = (await eins(`select public.raeume_besuch_ereignisse_auf() as n`)).n;
  pruefe('raeume_besuch_ereignisse_auf: entfernt frühere Tage, heute bleibt', entfernt >= 1 && (await eins(`select count(*)::int c from public.besuch_ereignis_kennungen where kennung='heutig'`)).c === 1);
  await client.query(`insert into public.besuch_ereignis_kennungen (tag, ereignis, kennung) values ('2000-01-01','konfigurator_geoeffnet','alt2')`);
  await client.query(`insert into public.besuch_kennungen (tag, kennung, quelle) values ('2000-01-01','altSeite','sonstige'), ($1,'heutigSeite','sonstige')`, [heute]);
  const erwartet = (await eins(`select count(*)::int c from public.besuch_kennungen where tag < $1::date`, [heute])).c;
  const alt = (await eins(`select public.raeume_besuch_kennungen_auf() as n`)).n;
  pruefe(`bestehende Aufräumfunktion: Rückgabewert zählt weiterhin nur die Seiten-Kennungen (${erwartet} frühere)`, erwartet >= 1 && alt === erwartet, `n=${alt}, erwartet=${erwartet}`);
  pruefe('… und räumt die Ereignis-Kennungen früherer Tage mit ab', (await eins(`select count(*)::int c from public.besuch_ereignis_kennungen where kennung='alt2'`)).c === 0);
  pruefe('… die Kennung von heute bleibt', (await eins(`select count(*)::int c from public.besuch_ereignis_kennungen where kennung='heutig'`)).c === 1);

  console.log('\ng) Zugriffsschutz');
  for (const rolle of ['anon', 'authenticated']) {
    for (const f of FUNKTIONEN) {
      const r = await eins(`select has_function_privilege($1, $2, 'execute') as e`, [rolle, f]);
      pruefe(`${rolle} darf ${f.replace('public.', '').split('(')[0]} NICHT ausführen`, r.e === false);
    }
    for (const t of TABELLEN) {
      const r = await eins(`select has_table_privilege($1, $2, 'select') as s`, [rolle, `public.${t}`]);
      pruefe(`${rolle} darf ${t} NICHT lesen`, r.s === false);
    }
  }
  const rls = await alle(`select relname, relrowsecurity from pg_class where relname = any($1) and relnamespace = 'public'::regnamespace order by relname`, [TABELLEN]);
  pruefe('beide Tabellen: Row Level Security aktiv', rls.length === 2 && rls.every((r) => r.relrowsecurity === true), JSON.stringify(rls));
  pruefe('keine Policy auf den Ereignis-Tabellen', (await alle(`select tablename from pg_policies where tablename = any($1)`, [TABELLEN])).length === 0);

  console.log('\nh) Spalten und Trennung');
  const spalten = await alle(`select table_name, column_name from information_schema.columns where table_schema='public' and table_name = any($1) order by table_name, ordinal_position`, [TABELLEN]);
  const liste = spalten.map((x) => `${x.table_name}.${x.column_name}`).join(', ');
  pruefe('nur Tag, Ereignis, Quelle, Besucher bzw. Kennung', spalten.every((x) => ['tag', 'ereignis', 'quelle', 'besucher', 'kennung'].includes(x.column_name)), liste);
  pruefe('keine Spalte für IP, Browserkennung, Produkt, Datei, Preis, Person oder Bestellung', !spalten.some((x) => /(^|_)ip($|_)|user_?agent|addr|produkt|product|datei|file|preis|price|name|mail|order|bestell|kunde|customer/i.test(x.column_name)), liste);
  const fk = await alle(`select conname from pg_constraint where contype='f' and conrelid = any(array['public.besuch_ereignisse'::regclass, 'public.besuch_ereignis_kennungen'::regclass])`);
  pruefe('keine Fremdschlüssel zu anderen Tabellen (keine Bindung an Bestellungen oder Kunden)', fk.length === 0, JSON.stringify(fk));

  console.log('\ni) Bestellungen unberührt');
  pruefe(`Bestellstand innerhalb der Transaktion unverändert (${stand0})`, (await bestellstand()) === stand0);
} catch (fehler) {
  fehlgeschlagen.push(`Abbruch: ${fehler.message}`);
  console.log('\n✘ ABBRUCH:', fehler.message);
} finally {
  await client.query('rollback').catch(() => {});
  const danach = (await eins(`select to_regclass('public.besuch_ereignisse') as t`).catch(() => ({ t: '?' }))).t;
  const unveraendert = String(danach ?? null) === String(vorher ?? null);
  const stand1 = await bestellstand().catch(() => '?');
  console.log(`\nZurückgerollt. Zustand nachher ${unveraendert ? 'identisch mit vorher' : 'ABWEICHEND – bitte prüfen!'} (besuch_ereignisse: ${danach ?? 'nicht vorhanden'}); ${stand1}.`);
  if (!unveraendert) fehlgeschlagen.push('Zustand nach Rollback weicht ab');
  if (stand1 !== stand0) fehlgeschlagen.push('Bestellstand weicht ab');
  await client.end().catch(() => {});
}

console.log(`\n${bestanden} Prüfungen bestanden, ${fehlgeschlagen.length} fehlgeschlagen.`);
if (fehlgeschlagen.length > 0) {
  console.log('Fehlgeschlagen:', fehlgeschlagen);
  process.exitCode = 1;
}
