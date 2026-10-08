/**
 * Prüft die Datenbankseite des Besucherzählers (Migration 0037) gegen die
 * ECHTE Datenbank – als dritter Schritt nach „geschrieben" und „angewendet":
 * „verifiziert".
 *
 *   npm run besuch:pruefen
 *
 * ── Garantie: Es bleibt nichts zurück ────────────────────────────────────
 * Alles läuft in EINER Transaktion, die in jedem Fall zurückgerollt wird
 * (`finally`). Auch bei einem Absturz verfällt eine offene Transaktion mit der
 * Verbindung. Deshalb darf das Skript auch laufen, wenn die Migration schon
 * angewendet ist und echte Besucherzahlen vorliegen: Es führt die Migrationsdatei
 * (idempotent: `if not exists` / `or replace`) erneut aus, leert die vier Tabellen
 * INNERHALB der Transaktion für saubere Summen und prüft dann
 *
 *   • Zählen: Besucher = neue Tageskennung, Aufrufe je Tag/Seite/Quelle
 *   • Zurechnung weiterer Aufrufe zur Quelle des ersten Aufrufs
 *   • Tageswechsel: Kennungen früherer Tage verschwinden, die Zahlen bleiben
 *   • Auswertung (`lade_besuchsstatistik`): Reihenfolge, Typen, leere Listen
 *   • Aufräumen (`raeume_besuch_kennungen_auf`): früher weg, heute bleibt
 *   • Zugriffsschutz: weder anon noch authenticated, Row Level Security, keine Policy
 *   • keine Spalte für IP-Adresse oder Browserkennung
 *
 * Während des kurzen Laufs (ein paar Sekunden) warten gleichzeitige Besucher-
 * Meldungen auf die Sperren dieser Transaktion – sie sind ohnehin unwichtig für
 * die Seite (sendBeacon, Antwort wird nie gelesen).
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const DATEI = 'supabase/migrations/0037_besuchszaehler.sql';
const TABELLEN = ['besuch_summe', 'besuch_seiten', 'besuch_quellen', 'besuch_kennungen'];
const FUNKTIONEN = [
  'public.erfasse_besuch(date,text,text,text)',
  'public.lade_besuchsstatistik(date)',
  'public.raeume_besuch_kennungen_auf()',
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

const sql = readFileSync(DATEI, 'utf8');
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

await client.connect();
let vorher;
try {
  vorher = (await eins(`select to_regclass('public.besuch_summe') as t`)).t;
  console.log(`Vorher: Tabelle besuch_summe ${vorher ? 'existiert bereits (Migration angewendet)' : 'existiert noch nicht'}.`);

  await client.query('begin');
  await client.query(sql);
  console.log('Migration läuft fehlerfrei (innerhalb der Transaktion).');
  // Saubere Ausgangslage für exakte Summen – wird mit allem anderen zurückgerollt.
  for (const t of TABELLEN) await client.query(`delete from public.${t}`);

  console.log('\na) erster Seitenaufruf eines Besuchers');
  await client.query(`select public.erfasse_besuch('2026-01-10', '/', 'kennA', 'ohne-kennzeichnung')`);
  let s = await eins(`select * from public.besuch_summe where tag = '2026-01-10'`);
  pruefe('Summe: 1 Besucher, 1 Aufruf', s.besucher === 1 && s.aufrufe === 1, JSON.stringify(s));
  pruefe('Seite "/" hat 1 Aufruf', (await eins(`select aufrufe from public.besuch_seiten where tag='2026-01-10' and pfad='/'`)).aufrufe === 1);
  let q = await eins(`select * from public.besuch_quellen where tag='2026-01-10' and quelle='ohne-kennzeichnung'`);
  pruefe('Quelle "ohne-kennzeichnung": 1 Besucher, 1 Aufruf', q.besucher === 1 && q.aufrufe === 1);
  pruefe('genau 1 Tageskennung gespeichert', (await eins(`select count(*)::int c from public.besuch_kennungen`)).c === 1);

  console.log('\nb) derselbe Besucher ruft eine weitere Seite auf (mit anderer Quelle im Aufruf)');
  await client.query(`select public.erfasse_besuch('2026-01-10', '/faq', 'kennA', 'instagram')`);
  s = await eins(`select * from public.besuch_summe where tag = '2026-01-10'`);
  pruefe('Summe: weiterhin 1 Besucher, jetzt 2 Aufrufe', s.besucher === 1 && s.aufrufe === 2, JSON.stringify(s));
  pruefe('Seite "/faq" hat 1 Aufruf', (await eins(`select aufrufe from public.besuch_seiten where tag='2026-01-10' and pfad='/faq'`)).aufrufe === 1);
  q = await eins(`select * from public.besuch_quellen where tag='2026-01-10' and quelle='ohne-kennzeichnung'`);
  pruefe('Aufruf wird der Quelle des ERSTEN Aufrufs zugerechnet (2 Aufrufe, 1 Besucher)', q.besucher === 1 && q.aufrufe === 2, JSON.stringify(q));
  pruefe('"instagram" taucht NICHT auf (kein neuer Besucher)', (await alle(`select 1 from public.besuch_quellen where tag='2026-01-10' and quelle='instagram'`)).length === 0);

  console.log('\nc) zweiter Besucher kommt über instagram');
  await client.query(`select public.erfasse_besuch('2026-01-10', '/', 'kennB', 'instagram')`);
  s = await eins(`select * from public.besuch_summe where tag = '2026-01-10'`);
  pruefe('Summe: 2 Besucher, 3 Aufrufe', s.besucher === 2 && s.aufrufe === 3, JSON.stringify(s));
  q = await eins(`select * from public.besuch_quellen where tag='2026-01-10' and quelle='instagram'`);
  pruefe('Quelle "instagram": 1 Besucher, 1 Aufruf', q.besucher === 1 && q.aufrufe === 1);
  pruefe('Seite "/" hat jetzt 2 Aufrufe', (await eins(`select aufrufe from public.besuch_seiten where tag='2026-01-10' and pfad='/'`)).aufrufe === 2);

  console.log('\nd) neuer Tag: derselbe Besucher zählt erneut, alte Kennungen verschwinden');
  await client.query(`select public.erfasse_besuch('2026-01-11', '/', 'kennA', 'ohne-kennzeichnung')`);
  s = await eins(`select * from public.besuch_summe where tag = '2026-01-11'`);
  pruefe('neuer Tag: 1 Besucher, 1 Aufruf', s.besucher === 1 && s.aufrufe === 1, JSON.stringify(s));
  pruefe('Kennungen des Vortags wurden beim ersten Besucher des neuen Tages gelöscht', (await eins(`select count(*)::int c from public.besuch_kennungen where tag = '2026-01-10'`)).c === 0);
  s = await eins(`select * from public.besuch_summe where tag = '2026-01-10'`);
  pruefe('die Zahlen des Vortags bleiben erhalten (2 Besucher, 3 Aufrufe)', s.besucher === 2 && s.aufrufe === 3);

  console.log('\ne) lade_besuchsstatistik');
  const stat = (await eins(`select public.lade_besuchsstatistik('2026-01-01') as j`)).j;
  pruefe('2 Tage, aufsteigend sortiert', Array.isArray(stat.tage) && stat.tage.length === 2 && stat.tage[0].tag === '2026-01-10' && stat.tage[1].tag === '2026-01-11', JSON.stringify(stat.tage));
  pruefe('Tageswerte sind Zahlen', typeof stat.tage[0].besucher === 'number' && typeof stat.tage[0].aufrufe === 'number');
  pruefe('meistbesuchte Seite ist "/" mit 3 Aufrufen (2 + 1 am Folgetag)', stat.seiten[0].pfad === '/' && stat.seiten[0].aufrufe === 3, JSON.stringify(stat.seiten));
  pruefe('Quellen nach Besuchern absteigend', stat.quellen[0].besucher >= stat.quellen[stat.quellen.length - 1].besucher, JSON.stringify(stat.quellen));
  const ohne = stat.quellen.find((x) => x.quelle === 'ohne-kennzeichnung');
  pruefe('Quelle "ohne-kennzeichnung" summiert über beide Tage: 2 Besucher', ohne && ohne.besucher === 2, JSON.stringify(ohne));
  const leer = (await eins(`select public.lade_besuchsstatistik('2999-01-01') as j`)).j;
  pruefe('ohne Daten: leere Listen statt null', leer.tage.length === 0 && leer.seiten.length === 0 && leer.quellen.length === 0, JSON.stringify(leer));

  console.log('\nf) raeume_besuch_kennungen_auf');
  const heute = (await eins(`select (now() at time zone 'Europe/Berlin')::date::text as t`)).t;
  await client.query(`insert into public.besuch_kennungen (tag, kennung, quelle) values ('2000-01-01','alt','sonstige'), ($1,'heutig','sonstige')`, [heute]);
  const entfernt = (await eins(`select public.raeume_besuch_kennungen_auf() as n`)).n;
  pruefe('entfernt frühere Tage (mindestens die alte Testzeile)', entfernt >= 1, `entfernt=${entfernt}`);
  pruefe('die Kennung von HEUTE bleibt', (await eins(`select count(*)::int c from public.besuch_kennungen where kennung='heutig'`)).c === 1);
  pruefe('die alte Kennung ist weg', (await eins(`select count(*)::int c from public.besuch_kennungen where kennung='alt'`)).c === 0);

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
  const rls = await alle(
    `select relname, relrowsecurity from pg_class where relname = any($1) and relnamespace = 'public'::regnamespace order by relname`,
    [TABELLEN]
  );
  pruefe('alle vier Tabellen: Row Level Security aktiv', rls.length === 4 && rls.every((r) => r.relrowsecurity === true), JSON.stringify(rls));
  pruefe('keine Policy auf den Zähltabellen', (await alle(`select tablename from pg_policies where tablename like 'besuch_%'`)).length === 0);

  console.log('\nh) Spalten');
  const spalten = await alle(`select table_name, column_name from information_schema.columns where table_schema='public' and table_name like 'besuch_%' order by table_name, ordinal_position`);
  pruefe('keine Spalte nimmt IP-Adresse oder Browserkennung auf', !spalten.some((x) => /(^|_)ip($|_)|user_?agent|addr/i.test(x.column_name)), spalten.map((x) => `${x.table_name}.${x.column_name}`).join(', '));
} catch (fehler) {
  fehlgeschlagen.push(`Abbruch: ${fehler.message}`);
  console.log('\n✘ ABBRUCH:', fehler.message);
} finally {
  await client.query('rollback').catch(() => {});
  const danach = (await eins(`select to_regclass('public.besuch_summe') as t`).catch(() => ({ t: '?' }))).t;
  const unveraendert = String(danach ?? null) === String(vorher ?? null);
  console.log(`\nZurückgerollt. Zustand nachher ${unveraendert ? 'identisch mit vorher' : 'ABWEICHEND – bitte prüfen!'} (besuch_summe: ${danach ?? 'nicht vorhanden'}).`);
  if (!unveraendert) fehlgeschlagen.push('Zustand nach Rollback weicht ab');
  await client.end().catch(() => {});
}

console.log(`\n${bestanden} Prüfungen bestanden, ${fehlgeschlagen.length} fehlgeschlagen.`);
if (fehlgeschlagen.length > 0) {
  console.log('Fehlgeschlagen:', fehlgeschlagen);
  process.exitCode = 1;
}
