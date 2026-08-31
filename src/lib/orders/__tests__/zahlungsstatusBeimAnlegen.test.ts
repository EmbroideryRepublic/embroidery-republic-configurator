/**
 * Regressionstest für den Fund vom 2026-08-31 (echter PayPal-Live-Test,
 * Migration 0032): `create_order_atomic` (zuletzt vor diesem Fix in
 * Migration 0025 definiert) führte `payment_status` NIE in seiner
 * INSERT-Spaltenliste – jede Bestellung erhielt deshalb den Tabellen-Default
 * 'not_required' (Migration 0004), unabhängig von der tatsächlichen
 * Zahlungsart. Für Rechnungskauf blieb das unsichtbar (der Default ist dort
 * richtig); für Karte/PayPal war eine Bestellung, deren Zahlung nie
 * abgeschlossen wurde, dadurch ununterscheidbar von einer, die gar keine
 * Zahlung braucht – die Cron-Nachhol-Funktionen (orderCompletion.ts) wählen
 * genau darüber aus, ob eine Bestellung ohne Weiteres in Rechnung gestellt/
 * bestätigt werden darf.
 *
 * Gleiche Teststrategie wie bestaetigungRetry.test.ts/rechnungRetry.test.ts:
 * reine Quelltext-Prüfung der aktuellen Migration statt eines Mocks – dieses
 * Projekt spielt Migrationen nicht automatisiert in eine Test-Datenbank ein.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FIX_MIGRATION = path.join(process.cwd(), 'supabase', 'migrations', '0032_bestellung_zahlungsstatus_fix.sql');
const ORDERS_ACTION = path.join(process.cwd(), 'src', 'lib', 'actions', 'orders.ts');

function insertRumpf(datei: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf('insert into public.orders (');
  assert.ok(start > 0, `"insert into public.orders (" nicht gefunden in ${datei}`);
  const ende = inhalt.indexOf('returning id, created_at', start);
  assert.ok(ende > start, `Ende des INSERT nicht gefunden in ${datei}`);
  return inhalt.slice(start, ende);
}

test('create_order_atomic führt payment_status in der INSERT-Spaltenliste UND in den values()', () => {
  const rumpf = insertRumpf(FIX_MIGRATION);
  assert.match(rumpf, /\bpayment_status\b/, 'payment_status fehlt in der Spaltenliste – exakt der behobene Bug');
  assert.match(
    rumpf,
    /coalesce\(p_order->>'payment_status', 'not_required'\)/,
    'der Wert muss aus p_order übernommen werden, mit dem bisherigen Default nur als Rückfall für ältere Aufrufer'
  );
});

test('orders.ts berechnet payment_status weiterhin aus der Zahlungsart und übergibt es im selben Objekt wie payment_method', () => {
  const inhalt = readFileSync(ORDERS_ACTION, 'utf8');
  assert.match(
    inhalt,
    /payment_status: params\.paymentMethod \? anfangsZahlungsstatus\(params\.paymentMethod\) : 'not_required'/,
    'orders.ts muss payment_status weiterhin korrekt berechnen – dieser Fix betrifft nur, dass die Datenbank ihn auch tatsächlich übernimmt'
  );
});
