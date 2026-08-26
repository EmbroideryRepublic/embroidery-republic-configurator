/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit,
 * security_rls): `rechnungsnummernkreise` (Migration 0028) war die EINZIGE
 * Tabelle im gesamten Migrationsverzeichnis ohne `enable row level security`
 * – ein Versehen, kein bewusster Verzicht, denn dieselbe Datei nutzt exakt
 * das etablierte Muster (RLS aktiv, keine Policies = Default-Deny für
 * anon/authenticated über PostgREST, `createAdminClient()`/service_role
 * umgeht RLS ohnehin) für acht vergleichbare admin-only-Tabellen
 * (system_ereignisse, order_events, supplier_orders, …). Behoben durch
 * Migration 0031.
 *
 * Dieser Test verhindert, dass die GLEICHE Fehlerklasse unbemerkt
 * zurückkehrt: er liest ALLE Migrationsdateien, sammelt jede per
 * `create table` angelegte Tabelle im `public`-Schema und prüft, dass für
 * JEDE davon irgendwo im Migrationsverzeichnis ein passendes
 * `alter table ... enable row level security` existiert – unabhängig davon,
 * in welcher Datei genau. Eine künftige Migration, die eine neue Tabelle
 * anlegt und dabei RLS vergisst, lässt diesen Test fehlschlagen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

function alleMigrationsdateien(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((datei) => datei.endsWith('.sql'))
    .sort();
}

function gesamtquelltext(): string {
  return alleMigrationsdateien()
    .map((datei) => readFileSync(path.join(MIGRATIONS_DIR, datei), 'utf8'))
    .join('\n');
}

test('jede per "create table" angelegte Tabelle hat irgendwo eine passende "enable row level security"-Anweisung', () => {
  const quelltext = gesamtquelltext();

  const angelegteTabellen = new Set<string>();
  const createRegex = /create table(?: if not exists)? (?:public\.)?(\w+)/gi;
  for (const treffer of quelltext.matchAll(createRegex)) {
    if (treffer[1]) angelegteTabellen.add(treffer[1].toLowerCase());
  }
  assert.ok(angelegteTabellen.size >= 15, 'Sanity-Check: die Sammlung muss die bekannten ~19 Tabellen finden');

  const rlsAktivierteTabellen = new Set<string>();
  const rlsRegex = /alter table (?:public\.)?(\w+) enable row level security/gi;
  for (const treffer of quelltext.matchAll(rlsRegex)) {
    if (treffer[1]) rlsAktivierteTabellen.add(treffer[1].toLowerCase());
  }

  const ohneRls = [...angelegteTabellen].filter((tabelle) => !rlsAktivierteTabellen.has(tabelle));
  assert.deepEqual(
    ohneRls,
    [],
    `folgende Tabellen haben keine "enable row level security"-Anweisung in irgendeiner Migration: ` +
      `${ohneRls.join(', ')} – genau die Fehlerklasse, die bei rechnungsnummernkreise (0028→0031) real vorkam`
  );
});

test('rechnungsnummernkreise: RLS wird konkret in Migration 0031 aktiviert (nicht nur zufällig im Gesamttext gefunden)', () => {
  const dateien = alleMigrationsdateien();
  const rlsDatei = dateien.find((d) => d.startsWith('0031_'));
  assert.ok(rlsDatei, 'Migration 0031 muss existieren');
  const inhalt = readFileSync(path.join(MIGRATIONS_DIR, rlsDatei!), 'utf8');
  assert.match(inhalt, /alter table public\.rechnungsnummernkreise enable row level security;/);
});

test('0028_website_rechnungsnummer.sql legt rechnungsnummernkreise an, aber aktiviert dort selbst kein RLS (historischer Beleg für den Fund)', () => {
  const inhalt = readFileSync(path.join(MIGRATIONS_DIR, '0028_website_rechnungsnummer.sql'), 'utf8');
  assert.match(inhalt, /create table if not exists public\.rechnungsnummernkreise/);
  assert.doesNotMatch(
    inhalt,
    /rechnungsnummernkreise enable row level security/,
    'dieser Test dokumentiert bewusst den historischen Zustand – die eigentliche Behebung liegt in 0031, ' +
      'nicht rückwirkend in 0028 (additive Migrationen werden hier nicht nachträglich verändert)'
  );
});
