/**
 * Regressionstest für die echte Löschung stornierter Bestellungen
 * (Migration 0034, orderService.ts::loescheStornierteBestellung).
 *
 * Grund für den Guard: Manche Bestellungen bekommen eine fortlaufende
 * Rechnungsnummer (RE-2026-...), sobald sie bezahlt wurden oder auf
 * Rechnung liefen – siehe erzeugeRechnung() in orderCompletion.ts. Ein
 * echtes Entfernen aus der Datenbank würde diese Nummer aus der
 * Rechnungshistorie verschwinden lassen, obwohl sie real vergeben wurde –
 * genau der Grund, warum diese Anwendung Testbestellungen die ganze Zeit
 * schon per Konvention storniert statt löscht (siehe embroidery-republic-
 * golive-audit-Notizen). Die Bedingung sitzt deshalb NICHT nur in der
 * Anwendungslogik, sondern erzwungen im selben DELETE-Statement der
 * Datenbank (Migration 0034) – kein TOCTOU-Fenster zwischen einer
 * vorherigen Prüfung und der eigentlichen Löschung.
 *
 * Gleiche Teststrategie wie die übrigen Guard-Tests in diesem Verzeichnis
 * (z.B. paymentClaimBedingung.test.ts): Quelltext-Prüfung statt Mocking des
 * Supabase-Clients – die tatsächliche Laufzeitwirkung wird stattdessen live
 * gegen die echte Datenbank verifiziert (siehe Go-Live-Audit-Historie), so
 * wie es bei den DB-Funktionen dieser Anwendung durchgängig gehandhabt wird.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATION = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  '0034_loesche_stornierte_bestellung.sql'
);
const ORDER_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');

test('die Migration erzwingt BEIDE Bedingungen (storniert UND keine Rechnungsnummer) im selben DELETE-Statement', () => {
  const sql = readFileSync(MIGRATION, 'utf8');
  const funktionsStart = sql.indexOf('create or replace function public.loesche_stornierte_bestellung');
  assert.ok(funktionsStart > 0, 'die Funktion muss existieren');
  const funktionsEnde = sql.indexOf('$$;', funktionsStart);
  const rumpf = sql.slice(funktionsStart, funktionsEnde);

  assert.match(rumpf, /delete from public\.orders/, 'muss ein echtes DELETE sein, kein soft-delete-Update');
  assert.match(
    rumpf,
    /status\s*=\s*'cancelled'/,
    'darf nur stornierte Bestellungen löschen – niemals eine aktive oder abgeschlossene'
  );
  assert.match(
    rumpf,
    /invoice_number is null/,
    'darf niemals eine Bestellung mit bereits vergebener Rechnungsnummer löschen – ' +
      'das würde die fortlaufende Nummerierung/den Prüfpfad zerstören'
  );

  // Beide Bedingungen müssen im selben where-Ausdruck stehen (ein
  // vorgelagertes SELECT + separates DELETE hätte ein TOCTOU-Fenster).
  const whereIndex = rumpf.indexOf('where');
  assert.ok(whereIndex > 0);
  const whereBlock = rumpf.slice(whereIndex);
  assert.match(whereBlock, /status\s*=\s*'cancelled'/);
  assert.match(whereBlock, /invoice_number is null/);
});

test('die Funktion ist per revoke vor direktem Zugriff durch anon/authenticated geschützt', () => {
  const sql = readFileSync(MIGRATION, 'utf8');
  assert.match(
    sql,
    /revoke all on function public\.loesche_stornierte_bestellung\(uuid\) from public, anon, authenticated;/,
    'nur der Service-Role-Client (istAdmin()-gated Server Action) darf die Funktion aufrufen'
  );
});

test('loescheStornierteBestellung ruft ausschließlich die geschützte RPC-Funktion auf, kein direktes .delete() auf orders', () => {
  const quelltext = readFileSync(ORDER_SERVICE, 'utf8');
  const start = quelltext.indexOf('export async function loescheStornierteBestellung(');
  assert.ok(start > 0, 'loescheStornierteBestellung muss existieren');
  const ende = quelltext.indexOf('\nexport ', start + 1);
  const rumpf = quelltext.slice(start, ende > 0 ? ende : undefined);

  assert.match(
    rumpf,
    /db\.rpc\('loesche_stornierte_bestellung',\s*\{\s*p_order_id:\s*orderId\s*\}\)/,
    'muss über die RPC-Funktion laufen, damit die Guard-Bedingung garantiert im selben ' +
      'DELETE-Statement geprüft wird – ein direktes .from(\'orders\').delete() hier würde den Schutz umgehen'
  );
  assert.doesNotMatch(
    rumpf,
    /\.from\('orders'\)\s*\.delete\(/,
    'ein direktes .delete() auf orders würde die atomare Guard-Bedingung der Migration umgehen'
  );
});
