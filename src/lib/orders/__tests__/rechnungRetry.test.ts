/**
 * ARCHITEKTURTEST für `holeOffeneRechnungenNach` (orderCompletion.ts).
 *
 * Wie bei phasentrennung.test.ts: reine Quelltext-Prüfung statt Mocking des
 * Supabase-Clients – dieselbe Teststrategie wie der Rest von orderCompletion.ts
 * (siehe dort, kein einziger bestehender Test mockt createAdminClient).
 *
 * Prüft die beiden Dinge, die bei diesem Nachhol-Mechanismus am leichtesten
 * unbemerkt auseinanderlaufen: die Auswahlbedingung (muss exakt der von
 * `beanspruche_rechnungserstellung`, Migration 0026, entsprechen – sonst
 * greift der doppelte Anlage-Schutz nicht mehr strukturell) und die
 * Einbindung in die Cron-Route (nie fatal, sonst reißt ein Rechnungs-Retry
 * die komplette Lieferantenverarbeitung mit).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const COMPLETION = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts');
const CRON_ROUTE = path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
const CLAIM_MIGRATION = path.join(process.cwd(), 'supabase', 'migrations', '0026_rechnung_und_versand.sql');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

test('holeOffeneRechnungenNach wählt exakt die Bedingung von beanspruche_rechnungserstellung', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneRechnungenNach');

  // Migration 0026: order_type = 'order' and payment_status in ('paid',
  // 'not_required') and invoice_id is null and rechnung_unklarer_zustand =
  // false and rechnung_erstellung_gestartet_am is null. Weicht die Auswahl
  // hier davon ab, verpasst der Retry entweder echte Kandidaten oder holt
  // Bestellungen nach, die der Claim strukturell ohnehin nie annehmen würde.
  assert.match(rumpf, /\.eq\('order_type', 'order'\)/);
  assert.match(rumpf, /\.in\('payment_status', \['paid', 'not_required'\]\)/);
  assert.match(rumpf, /\.is\('invoice_id', null\)/);
  assert.match(rumpf, /\.eq\('rechnung_unklarer_zustand', false\)/);
  assert.match(rumpf, /\.is\('rechnung_erstellung_gestartet_am', null\)/);

  const migration = readFileSync(CLAIM_MIGRATION, 'utf8');
  assert.match(
    migration,
    /and order_type = 'order'\s*\n\s*and payment_status in \('paid', 'not_required'\)\s*\n\s*and invoice_id is null\s*\n\s*and rechnung_unklarer_zustand = false/,
    'die Referenzbedingung in Migration 0026 hat sich geändert – die Auswahl oben muss synchron bleiben'
  );
});

test('holeOffeneRechnungenNach ruft ausschließlich den Rechnungs-Schritt auf, nicht die gesamte Phase 2', () => {
  const rumpf = funktionsRumpf(COMPLETION, 'holeOffeneRechnungenNach');
  assert.match(rumpf, /\berzeugeRechnung\(order, probleme\)/, 'muss den privaten Rechnungs-Schritt direkt aufrufen');
  assert.doesNotMatch(
    rumpf,
    /\bschliesseBestellungAb\(/,
    'darf nicht die gesamte Phase 2 (Druckvorschauen/Produktionsblatt/Kommunikation) erneut anstoßen'
  );
});

test('Die Cron-Route bindet den Rechnungs-Retry nicht-fatal ein', () => {
  const inhalt = readFileSync(CRON_ROUTE, 'utf8');
  assert.match(inhalt, /import \{ holeOffeneRechnungenNach \} from '@\/lib\/orders\/orderCompletion'/);

  const aufruf = inhalt.indexOf('holeOffeneRechnungenNach(');
  assert.ok(aufruf > 0, 'die Route muss holeOffeneRechnungenNach aufrufen');

  // Muss in einem eigenen try/catch stehen: Ein Fehler beim Rechnungs-Retry
  // darf die Lieferantenverarbeitung (processDueSupplierOrders) nicht
  // mitreißen – dieselbe Anforderung wie an raeumeAuf() weiter unten in
  // derselben Route.
  const tryStart = inhalt.lastIndexOf('try {', aufruf);
  const catchEnde = inhalt.indexOf('}', inhalt.indexOf('catch', aufruf));
  assert.ok(tryStart > 0 && tryStart < aufruf, 'der Aufruf muss in einem try-Block stehen');
  assert.ok(catchEnde > aufruf, 'der Aufruf muss von einem catch-Block gefolgt sein');
});
