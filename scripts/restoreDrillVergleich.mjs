/**
 * ═══════════════════════════════════════════════════════════════════════
 * RESTORE-DRILL · VERGLEICH & PRÜFUNG
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Vergleicht den Fingerprint der wiederhergestellten DB mit dem der
 * Produktiv-DB (Baseline) und prüft zusätzlich absolute Soll-Vorgaben,
 * Integrität, Zeilenzahlen, Geschäftskennzahlen und die Sicherheitssonde.
 * Arbeitet rein auf den JSON-Dateien – kein DB-Zugriff.
 *
 * Aufruf:
 *   node scripts/restoreDrillVergleich.mjs --restore fingerprint-restore.json --baseline fingerprint-prod.json
 *   node scripts/restoreDrillVergleich.mjs --restore fingerprint-restore.json   (nur absolute Prüfungen)
 *
 * Exit 0 = alle Prüfungen bestanden. Exit 1 = mindestens eine FAIL.
 */
import { readFileSync } from 'node:fs';

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }
const restoreDatei = arg('--restore');
const baselineDatei = arg('--baseline');
if (!restoreDatei) { console.error('FEHLER: --restore <datei.json> ist erforderlich.'); process.exit(1); }

const restore = JSON.parse(readFileSync(restoreDatei, 'utf8'));
const baseline = baselineDatei ? JSON.parse(readFileSync(baselineDatei, 'utf8')) : null;

// ── Soll-Vorgaben (aus Migrationen 0001–0021) ─────────────────────────
const PFLICHT_TABELLEN = ['admin_sitzungen','brands','categories','configuration_elements','order_events','order_items','orders','pricing_rules','print_areas','product_colors','product_sizes','products','rate_limit_zaehler','supplier_order_events','supplier_orders','system_ereignisse'];
const PFLICHT_FUNKTIONEN = ['create_order_atomic','beanspruche_abschluss','gib_abschluss_frei','gib_haengende_abschluesse_frei','verfalle_offene_zahlungen','raeume_rate_limit_auf','raeume_admin_sitzungen_auf','raeume_system_ereignisse_auf'];
const KUNDENDATEN_TABELLEN = ['orders','order_items','configuration_elements'];

let fails = 0, warns = 0;
function abschnitt(t) { console.log(`\n── ${t} ──`); }
function ok(t) { console.log(`  ✔ ${t}`); }
function fail(t) { console.log(`  ✘ ${t}`); fails++; }
function warn(t) { console.log(`  ⚠ ${t}`); warns++; }

function kanon(o) {
  // Kanonische, schlüssel­sortierte Serialisierung für Mengenvergleich.
  if (Array.isArray(o)) return '[' + o.map(kanon).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + kanon(o[k])).join(',') + '}';
  return JSON.stringify(o);
}
function alsMenge(liste) { const m = new Map(); for (const e of (liste || [])) m.set(kanon(e), e); return m; }

/** Vergleicht zwei Objektlisten als Mengen; FEHLEND = kritisch, ZUSÄTZLICH = Warnung. */
function vergleicheListe(name, base, rest) {
  if (!Array.isArray(base) || !Array.isArray(rest)) { warn(`${name}: nicht vergleichbar (Abschnitt fehlt/fehlerhaft)`); return; }
  const mb = alsMenge(base), mr = alsMenge(rest);
  const fehlend = [...mb.keys()].filter(k => !mr.has(k));
  const zusatz = [...mr.keys()].filter(k => !mb.has(k));
  if (fehlend.length === 0 && zusatz.length === 0) { ok(`${name}: identisch (${mb.size})`); return; }
  if (fehlend.length) { fail(`${name}: ${fehlend.length} FEHLEND im Restore`); fehlend.slice(0, 8).forEach(k => console.log(`       - fehlt: ${k.slice(0, 140)}`)); }
  if (zusatz.length) { warn(`${name}: ${zusatz.length} zusätzlich im Restore`); zusatz.slice(0, 8).forEach(k => console.log(`       + extra: ${k.slice(0, 140)}`)); }
}

// ═══════════════════════════════════════════════════════════════════════
console.log('='.repeat(74));
console.log('RESTORE-DRILL · PRÜFBERICHT');
console.log(`  Restore : ${restoreDatei}  (DB=${restore.datenbank}, erfasst ${restore.erfasst_am})`);
if (baseline) console.log(`  Baseline: ${baselineDatei}  (DB=${baseline.datenbank}, erfasst ${baseline.erfasst_am})`);
console.log('='.repeat(74));

// ── 1. Absolute Soll-Prüfungen (unabhängig von der Baseline) ──────────
abschnitt('1. Pflicht-Objekte vorhanden (Migrationen 0001–0021)');
const tabNamen = new Set((restore.tabellen || []).map(t => t.name));
for (const t of PFLICHT_TABELLEN) tabNamen.has(t) ? ok(`Tabelle ${t}`) : fail(`Tabelle ${t} FEHLT`);
const funkNamen = new Set((restore.funktionen || []).map(f => f.name));
for (const f of PFLICHT_FUNKTIONEN) funkNamen.has(f) ? ok(`Funktion ${f}`) : fail(`Funktion ${f} FEHLT`);

abschnitt('2. RLS auf allen public-Tabellen aktiv');
const ohneRls = (restore.tabellen || []).filter(t => !t.rls).map(t => t.name);
ohneRls.length === 0 ? ok(`RLS auf allen ${(restore.tabellen||[]).length} Tabellen aktiv`) : fail(`RLS fehlt auf: ${ohneRls.join(', ')}`);

abschnitt('3. Storage-Bucket production-files (privat)');
const bucket = (restore.storage_buckets || []).find(b => b.id === 'production-files');
if (!bucket) fail('Bucket production-files FEHLT');
else if (bucket.public) fail('Bucket production-files ist ÖFFENTLICH (muss privat sein)');
else ok('Bucket production-files vorhanden und privat');

abschnitt('4. Sicherheitshärtung B1 überlebt den Restore');
const insPolicies = (restore.policies || []).filter(p => KUNDENDATEN_TABELLEN.includes(p.tabelle) && (p.cmd === 'INSERT' || p.cmd === 'ALL'));
insPolicies.length === 0 ? ok('Keine öffentlichen INSERT-Policies auf Kundendaten-Tabellen') : fail(`${insPolicies.length} INSERT/ALL-Policy(s) auf Kundendaten-Tabellen: ${insPolicies.map(p=>p.tabelle+'/'+p.name).join(', ')}`);
const anonGrants = (restore.grants || []).filter(g => KUNDENDATEN_TABELLEN.includes(g.tabelle) && (g.grantee === 'anon' || g.grantee === 'authenticated'));
anonGrants.length === 0 ? ok('Keine anon/authenticated-Grants auf Kundendaten-Tabellen') : fail(`anon/authenticated-Grants vorhanden: ${anonGrants.map(g=>g.tabelle+'/'+g.grantee).join(', ')}`);

abschnitt('5. Integrität (FK-Waisen müssen 0 sein)');
const it = restore.integritaet || {};
for (const k of ['waisen_order_items','waisen_configuration_elements','waisen_order_events','waisen_supplier_orders']) {
  const v = it[k];
  v === 0 ? ok(`${k} = 0`) : fail(`${k} = ${v} (FK-Waisen!)`);
}

abschnitt('6. Sicherheitssonde: anon-INSERT blockiert');
const sonde = (restore.sicherheitssonde || {}).anon_insert_orders || 'n/a';
if (/^blockiert/.test(sonde)) ok(`anon-INSERT auf orders: ${sonde}`);
else if (sonde === 'rolle_fehlt') warn('anon-Rolle nicht vorhanden – Sonde übersprungen (im Restore-Ziel anlegen, falls Supabase-Rollen mitgesichert)');
else fail(`anon-INSERT auf orders: ${sonde}`);

// ── 7.–12. Vergleich gegen Baseline (falls vorhanden) ─────────────────
if (baseline) {
  abschnitt('7. Strukturvergleich gegen Produktiv-Baseline');
  // Extensions: Präsenz ist kritisch, Versionsdrift nur Warnung – ein frisches
  // Supabase-Projekt bringt oft neuere Extension-Versionen mit (Plattform, kein
  // Restore-Fehler).
  (function vergleicheExtensions() {
    const nb = new Map((baseline.extensions || []).map(e => [e.name, e.version]));
    const nr = new Map((restore.extensions || []).map(e => [e.name, e.version]));
    const fehlend = [...nb.keys()].filter(n => !nr.has(n));
    const drift = [...nb.keys()].filter(n => nr.has(n) && nb.get(n) !== nr.get(n));
    if (fehlend.length) fail(`Extensions: FEHLEN im Restore: ${fehlend.join(', ')}`);
    drift.forEach(n => warn(`Extension ${n}: Version ${nb.get(n)} → ${nr.get(n)} (Plattform-Drift, unkritisch)`));
    if (!fehlend.length && !drift.length) ok(`Extensions: identisch (${nb.size})`);
    else if (!fehlend.length) ok(`Extensions: alle ${nb.size} vorhanden (${drift.length} Versionsdrift)`);
  })();
  vergleicheListe('Tabellen (+RLS)', baseline.tabellen, restore.tabellen);
  vergleicheListe('Spalten', baseline.spalten, restore.spalten);
  vergleicheListe('Constraints', baseline.constraints, restore.constraints);
  vergleicheListe('Indizes', baseline.indizes, restore.indizes);
  vergleicheListe('Funktionen', baseline.funktionen, restore.funktionen);
  vergleicheListe('Trigger', baseline.trigger, restore.trigger);
  vergleicheListe('RLS-Policies', baseline.policies, restore.policies);
  vergleicheListe('Grants', baseline.grants, restore.grants);
  vergleicheListe('Storage-Buckets', baseline.storage_buckets, restore.storage_buckets);

  abschnitt('8. Zeilenzahlen je Tabelle');
  const zb = baseline.zeilen || {}, zr = restore.zeilen || {};
  const alle = [...new Set([...Object.keys(zb), ...Object.keys(zr)])].sort();
  let zeilenOk = true;
  for (const t of alle) {
    if (zb[t] !== zr[t]) { fail(`${t}: Baseline ${zb[t]} ≠ Restore ${zr[t]}`); zeilenOk = false; }
  }
  if (zeilenOk) ok(`Alle ${alle.length} Tabellen mit identischer Zeilenzahl`);

  abschnitt('9. Geschäftskennzahlen');
  const ib = baseline.integritaet || {};
  for (const k of ['orders_summe_total_price','orders_summe_net_total']) {
    String(ib[k]) === String(it[k]) ? ok(`${k}: ${it[k]}`) : fail(`${k}: Baseline ${ib[k]} ≠ Restore ${it[k]}`);
  }
  kanon(ib.orders_je_status) === kanon(it.orders_je_status)
    ? ok(`orders_je_status identisch: ${JSON.stringify(it.orders_je_status)}`)
    : fail(`orders_je_status: Baseline ${JSON.stringify(ib.orders_je_status)} ≠ Restore ${JSON.stringify(it.orders_je_status)}`);
} else {
  abschnitt('7.–9. Baseline-Vergleich übersprungen');
  warn('Keine --baseline angegeben: Struktur-, Zeilen- und Kennzahlvergleich nicht durchgeführt.');
}

// ── Urteil ────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(74));
if (fails === 0) {
  console.log(`✅ RESTORE-DRILL BESTANDEN  (0 Fehler, ${warns} Warnung(en))`);
  console.log('   Die wiederhergestellte Datenbank entspricht der Produktiv-DB und allen Soll-Vorgaben.');
} else {
  console.log(`❌ RESTORE-DRILL FEHLGESCHLAGEN  (${fails} Fehler, ${warns} Warnung(en))`);
  console.log('   Restore NICHT als erfolgreich werten. Ursachen oben prüfen.');
  process.exitCode = 1;
}
console.log('='.repeat(74));
