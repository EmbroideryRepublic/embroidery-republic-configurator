/**
 * ═══════════════════════════════════════════════════════════════════════
 * RESTORE-DRILL · FINGERPRINT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Erfasst einen vollständigen, deterministischen Abzug des Datenbank-ZUSTANDS
 * (Struktur + Kennzahlen), damit sich Produktiv-DB und wiederhergestellte
 * DB objektgenau vergleichen lassen. NUR Lesezugriff (die Sicherheitssonde
 * läuft in einer zurückgerollten Transaktion).
 *
 * Aufruf:
 *   node scripts/restoreDrillFingerprint.mjs --url "<CONNECTION_STRING>" --out datei.json
 *   node scripts/restoreDrillFingerprint.mjs --out fingerprint-prod.json      (nutzt DIRECT_URL aus .env.local)
 *
 * Erfasst: Postgres-Version, Extensions, Tabellen (+RLS), Spalten, Constraints,
 * Indizes, Funktionen, Trigger, RLS-Policies, Grants (anon/authenticated/
 * service_role), Storage-Buckets, Zeilenzahlen je Tabelle, Integritätskennzahlen
 * (FK-Waisen, Summen) sowie eine anon-Schreibsonde (muss blockiert sein).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';

// ── Argumente ─────────────────────────────────────────────────────────
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const outDatei = arg('--out');
let url = arg('--url');

// Fallback: DIRECT_URL/DATABASE_URL aus .env.local (wie applyMigration.mjs)
if (!url) {
  try {
    for (const z of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const t = z.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (t) {
        const v = t[2].trim().replace(/^["']|["']$/g, '');
        if (t[1] === 'DIRECT_URL' && !url) url = v;
        if (t[1] === 'DATABASE_URL' && !url) url = v;
      }
    }
  } catch { /* keine .env.local – dann muss --url gesetzt sein */ }
}
if (!url) {
  console.error('FEHLER: Keine Verbindung. --url "<conn>" angeben oder DIRECT_URL in .env.local hinterlegen.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

/** Führt eine Abfrage aus; bei Fehler wird der Abschnitt als Fehlertext markiert
 *  statt den ganzen Lauf abzubrechen (z.B. wenn ein Schema fehlt). */
async function q(sql, params = []) {
  const r = await client.query(sql, params);
  return r.rows;
}
async function sicher(name, fn) {
  try { return await fn(); }
  catch (e) { console.error(`  ! Abschnitt „${name}" unvollständig: ${e.message}`); return { fehler: e.message }; }
}

async function main() {
  await client.connect();
  const fp = {};

  fp.erfasst_am = new Date().toISOString();
  fp.datenbank = (await q('select current_database() d'))[0].d;
  fp.postgres = (await q('select version() v'))[0].v.split(' on ')[0];

  fp.extensions = await sicher('extensions', async () =>
    (await q(`select extname name, extversion version from pg_extension order by extname`)));

  fp.tabellen = await sicher('tabellen', async () =>
    (await q(`select c.relname name, c.relrowsecurity rls, c.relforcerowsecurity rls_forced
              from pg_class c join pg_namespace n on n.oid=c.relnamespace
              where n.nspname='public' and c.relkind='r' order by c.relname`)));

  fp.spalten = await sicher('spalten', async () =>
    (await q(`select table_name tabelle, column_name spalte, data_type typ, udt_name udt,
                     is_nullable nullable, coalesce(column_default,'') as "default"
              from information_schema.columns where table_schema='public'
              order by table_name, ordinal_position`)));

  fp.constraints = await sicher('constraints', async () =>
    (await q(`select conrelid::regclass::text tabelle, conname name, pg_get_constraintdef(oid) def
              from pg_constraint where connamespace='public'::regnamespace order by 1,2`)));

  fp.indizes = await sicher('indizes', async () =>
    (await q(`select tablename tabelle, indexname name, indexdef def
              from pg_indexes where schemaname='public' order by tablename, indexname`)));

  fp.funktionen = await sicher('funktionen', async () =>
    (await q(`select proname name, pg_get_function_identity_arguments(oid) args,
                     prosecdef security_definer, provolatile volatility
              from pg_proc where pronamespace='public'::regnamespace order by proname, args`)));

  fp.trigger = await sicher('trigger', async () =>
    (await q(`select event_object_table tabelle, trigger_name name, action_timing timing,
                     event_manipulation event, action_statement statement
              from information_schema.triggers where trigger_schema='public'
              order by event_object_table, trigger_name, event_manipulation`)));

  fp.policies = await sicher('policies', async () =>
    (await q(`select tablename tabelle, policyname name, permissive, roles::text rollen, cmd,
                     coalesce(qual,'') using_expr, coalesce(with_check,'') check_expr
              from pg_policies where schemaname='public'
              order by tablename, policyname`)));

  fp.grants = await sicher('grants', async () =>
    (await q(`select table_name tabelle, grantee, string_agg(privilege_type,',' order by privilege_type) privs
              from information_schema.role_table_grants
              where table_schema='public' and grantee in ('anon','authenticated','service_role')
              group by table_name, grantee order by table_name, grantee`)));

  fp.storage_buckets = await sicher('storage_buckets', async () =>
    (await q(`select id, public, file_size_limit, allowed_mime_types
              from storage.buckets order by id`)));

  // ── Zeilenzahlen je public-Tabelle ──
  fp.zeilen = await sicher('zeilen', async () => {
    const tabellen = Array.isArray(fp.tabellen) ? fp.tabellen : [];
    const zeilen = {};
    for (const t of tabellen) {
      const { rows } = await client.query(`select count(*)::int n from public."${t.name}"`);
      zeilen[t.name] = rows[0].n;
    }
    return zeilen;
  });

  // ── Integrität: FK-Waisen (müssen 0 sein) + Geschäftskennzahlen ──
  fp.integritaet = await sicher('integritaet', async () => {
    const waise = async (sql) => (await q(sql))[0].n;
    return {
      waisen_order_items: await waise(`select count(*)::int n from order_items oi left join orders o on o.id=oi.order_id where o.id is null`),
      waisen_configuration_elements: await waise(`select count(*)::int n from configuration_elements ce left join order_items oi on oi.id=ce.order_item_id where oi.id is null`),
      waisen_order_events: await waise(`select count(*)::int n from order_events oe left join orders o on o.id=oe.order_id where o.id is null`),
      waisen_supplier_orders: await waise(`select count(*)::int n from supplier_orders so left join orders o on o.id=so.order_id where o.id is null`),
      orders_summe_total_price: (await q(`select coalesce(sum(total_price),0)::text s from orders`))[0].s,
      orders_summe_net_total: (await q(`select coalesce(sum(net_total),0)::text s from orders`))[0].s,
      orders_je_status: Object.fromEntries((await q(`select status, count(*)::int n from orders group by status order by status`)).map(r => [r.status, r.n])),
    };
  });

  // ── Sicherheitssonde: anon darf NICHT in orders schreiben (B1) ──
  // In einer zurückgerollten Transaktion. Erwartet: blockiert.
  fp.sicherheitssonde = await sicher('sicherheitssonde', async () => {
    try {
      await client.query('begin');
      await client.query('set local role anon');
      await client.query(`insert into public.orders(customer_name,email,order_type,quantity,total_price) values('__DRILL__','drill@example.invalid','inquiry',1,0)`);
      await client.query('rollback');
      return { anon_insert_orders: 'OFFEN (⚠ anon konnte einfügen!)' };
    } catch (e) {
      await client.query('rollback').catch(() => {});
      if (/role .* does not exist/i.test(e.message)) return { anon_insert_orders: 'rolle_fehlt' };
      return { anon_insert_orders: `blockiert (${e.code})` };
    }
  });

  await client.end();

  const json = JSON.stringify(fp, null, 2);
  if (outDatei) {
    writeFileSync(outDatei, json);
    console.log(`Fingerprint geschrieben: ${outDatei}`);
    console.log(`  DB=${fp.datenbank}  Tabellen=${(fp.tabellen||[]).length}  Funktionen=${(fp.funktionen||[]).length}  Policies=${(fp.policies||[]).length}  Buckets=${(fp.storage_buckets||[]).length}`);
  } else {
    console.log(json);
  }
}

main().catch((e) => { console.error('FEHLGESCHLAGEN:', e.message); process.exit(1); });
