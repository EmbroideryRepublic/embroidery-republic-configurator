/**
 * ARCHITEKTURTEST für die beiden Nachhol-Mechanismen aus dem Sync-Audit vom
 * 2026-08-18 (Lücke 1: Phase-2-Abschluss ohne Wiederanlauf, Lücke 2:
 * accounting_ready_at-Schreibfehler wurde verschluckt).
 *
 * Gleiche Teststrategie wie phasentrennung.test.ts/rechnungRetry.test.ts:
 * reine Quelltext-Prüfung statt Mocking des Supabase-Clients – etabliertes
 * Muster für diese DB-nahen Dateien in diesem Projekt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PAYMENT_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'paymentService.ts');
const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');
const CRON_ROUTE = path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
const CLAIM_MIGRATION = path.join(process.cwd(), 'supabase', 'migrations', '0020_zahlung_abschluss.sql');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

// ── Lücke 1: Redelivery muss Phase 2 ebenfalls anstoßen ─────────────────

test('bestaetigeZahlung ruft stelleAbschlussSicher auch im bereitsVerarbeitet-Zweig auf', () => {
  const inhalt = readFileSync(PAYMENT_SERVICE, 'utf8');
  const zweigStart = inhalt.indexOf("(geaendert?.length ?? 0) === 0");
  assert.ok(zweigStart > 0, 'Redelivery-Zweig (Idempotenzbedingung) nicht gefunden');
  const zweigEnde = inhalt.indexOf('\n  }', zweigStart);
  const zweig = inhalt.slice(zweigStart, zweigEnde);
  assert.match(
    zweig,
    /stelleAbschlussSicher\(/,
    'ohne diesen Aufruf bleibt eine Bestellung, deren Erstverarbeitung zwischen payment_status=\'paid\' ' +
      'und Phase-2-Abschluss abstürzte, bei jeder Redelivery dauerhaft ohne Rechnung/accounting_ready_at'
  );
});

test('holeOffeneAbschluesseNach wählt exakt die Bedingung von beanspruche_abschluss', () => {
  const rumpf = funktionsRumpf(PAYMENT_SERVICE, 'holeOffeneAbschluesseNach');

  assert.match(rumpf, /\.eq\('payment_status', 'paid'\)/);
  assert.match(rumpf, /\.is\('pdf_url', null\)/);
  assert.match(rumpf, /\.is\('abschluss_gestartet_am', null\)/);
  assert.match(rumpf, /stelleAbschlussSicher\(/);

  const migration = readFileSync(CLAIM_MIGRATION, 'utf8');
  assert.match(
    migration,
    /and payment_status = 'paid'\s*\n\s*and pdf_url is null\s*\n\s*and abschluss_gestartet_am is null/,
    'die Referenzbedingung in Migration 0020 hat sich geändert – die Auswahl oben muss synchron bleiben'
  );
});

test('Die Cron-Route bindet holeOffeneAbschluesseNach nicht-fatal ein', () => {
  const inhalt = readFileSync(CRON_ROUTE, 'utf8');
  assert.match(inhalt, /import \{ holeOffeneAbschluesseNach \} from '@\/lib\/orders\/paymentService'/);

  const aufruf = inhalt.indexOf('holeOffeneAbschluesseNach(');
  assert.ok(aufruf > 0, 'die Route muss holeOffeneAbschluesseNach aufrufen');

  const tryStart = inhalt.lastIndexOf('try {', aufruf);
  const catchEnde = inhalt.indexOf('}', inhalt.indexOf('catch', aufruf));
  assert.ok(tryStart > 0 && tryStart < aufruf, 'der Aufruf muss in einem try-Block stehen');
  assert.ok(catchEnde > aufruf, 'der Aufruf muss von einem catch-Block gefolgt sein');
});

// ── Lücke 2: accounting_ready_at-Schreibfehler darf nicht verschluckt werden ──

test('accounting_ready_at/invoice_pdf_url werden fehlergeprüft über persistiereKritischMitWiederholung gesetzt', () => {
  const inhalt = readFileSync(COMPLETION, 'utf8');

  // Der frühere Bug: beide Felder liefen ungeprüft in einem Promise.all mit
  // dem PDF-Upload – ein reiner Query-Fehler wirft bei Supabase-js NICHT,
  // wurde also nie bemerkt. Diese Kombination darf nicht wiederkehren.
  assert.doesNotMatch(
    inhalt,
    /Promise\.all\(\[\s*uploadProductionFile\(pfad, rechnung\.pdf/,
    'Upload und accounting_ready_at-Update dürfen nicht mehr ungeprüft parallel im selben Promise.all laufen'
  );

  const stelle = inhalt.indexOf('accounting_ready_at: new Date().toISOString()');
  assert.ok(stelle > 0, 'accounting_ready_at-Zuweisung nicht gefunden');
  const umgebung = inhalt.slice(Math.max(0, stelle - 400), stelle + 100);
  assert.match(
    umgebung,
    /persistiereKritischMitWiederholung\(/,
    'accounting_ready_at muss über denselben Wiederholungs-Helfer wie invoice_id gesetzt werden'
  );
});

test('endgültiger Fehlschlag der accounting_ready_at-Persistierung setzt rechnung_unklarer_zustand', () => {
  const inhalt = readFileSync(COMPLETION, 'utf8');
  const stelle = inhalt.indexOf('accountingGespeichert');
  assert.ok(stelle > 0, 'accountingGespeichert nicht gefunden');
  const block = inhalt.slice(stelle, stelle + 1200);
  assert.match(block, /if \(!accountingGespeichert\)/);
  assert.match(
    block,
    /rechnung_unklarer_zustand:\s*true/,
    'ohne diesen Rettungsanker bliebe die Bestellung nach einem endgültigen Fehlschlag für immer ' +
      'unsichtbar für jede automatische Buchhaltungs-Synchronisierung, ohne jede Sperre gegen einen ' +
      'widersprüchlichen späteren Automatik-Zugriff'
  );
});
