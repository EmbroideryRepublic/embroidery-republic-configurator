/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit,
 * cron_retry): die drei Status-Mails (in_production/shipped/completed) hatten
 * genau EINEN Versandversuch beim Statusübergang, ohne jeden Retry – weder
 * automatisch (kein Cron/Claim wie bei Rechnung/DHL-Label, siehe
 * rechnungRetry.test.ts/abschlussRetry.test.ts) noch manuell (ein erneuter
 * Klick auf denselben Zielstatus ist bewusst ein No-op, siehe
 * statusEmailLogging.test.ts). Schlug der einzige Versuch fehl, blieb die
 * Kundschaft ohne jede Möglichkeit, das nachzuholen, außer einem direkten
 * Datenbankeingriff.
 *
 * Behoben durch `sendeStatusmailErneut()` – liest den AKTUELLEN Status und
 * verschickt die passende Mail über dieselben drei Helfer
 * (sendeShippedMail/sendeInProductionMail/sendeCompletedMail), die auch
 * `setzeBestellstatus()` selbst nutzt (kein zweiter Versandpfad). Bewusst
 * OHNE Claim: ein Doppelklick verschickt zweimal dieselbe Mail – akzeptiert,
 * weil es eine explizite, admin-ausgelöste Aktion ohne externe/finanzielle
 * Nebenwirkung ist (anders als Zahlung/Rechnung/Versandlabel).
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts: Quelltext-Prüfung.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ORDER_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'orderService.ts');
const STATUS_ACTIONS = path.join(process.cwd(), 'src', 'lib', 'actions', 'orderStatusActions.ts');
const STATUS_CONTROL = path.join(process.cwd(), 'src', 'components', 'admin', 'OrderStatusControl.tsx');

const serviceQuelltext = readFileSync(ORDER_SERVICE, 'utf8');
const actionsQuelltext = readFileSync(STATUS_ACTIONS, 'utf8');
const controlQuelltext = readFileSync(STATUS_CONTROL, 'utf8');

function funktionsRumpf(quelltext: string, name: string): string {
  const start = quelltext.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden`);
  const naechste = quelltext.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? quelltext.slice(start, naechste) : quelltext.slice(start);
}

test('sendeStatusmailErneut versendet über dieselben Helfer wie setzeBestellstatus, kein zweiter Versandpfad', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'sendeStatusmailErneut');
  assert.match(
    rumpf,
    /await sendeShippedMail\(orderId, bestellung\.email, bestellung\.tracking_number, bestellung\.carrier, bestellung\.order_number\);/
  );
  assert.match(rumpf, /await sendeInProductionMail\(orderId, bestellung\.email, bestellung\.order_number\);/);
  assert.match(rumpf, /await sendeCompletedMail\(orderId, bestellung\.email, bestellung\.order_number\);/);
});

test('sendeStatusmailErneut lehnt Bestellungen ohne E-Mail und Status ohne Status-Mail sauber ab', () => {
  const rumpf = funktionsRumpf(serviceQuelltext, 'sendeStatusmailErneut');
  assert.match(rumpf, /if \(!bestellung\.email\) return \{ ok: false, grund: 'keine-email' \};/);
  assert.match(
    rumpf,
    /default:\s*\n\s*return \{ ok: false, grund: 'kein-status-mit-mail' \};/,
    'ein Status ohne Status-Mail (new/cancelled) muss abgelehnt werden statt eine falsche Mail zu verschicken'
  );
});

test('sendeShippedMail/sendeInProductionMail/sendeCompletedMail werden NUR von setzeBestellstatus und sendeStatusmailErneut aufgerufen', () => {
  for (const helfer of ['sendeShippedMail', 'sendeInProductionMail', 'sendeCompletedMail']) {
    const aufrufe = serviceQuelltext.match(new RegExp(`(?<!function )${helfer}\\(`, 'g')) ?? [];
    assert.equal(
      aufrufe.length,
      2,
      `${helfer} muss genau zweimal aufgerufen werden (setzeBestellstatus + sendeStatusmailErneut) – ` +
        'ein dritter Aufrufer wäre ein zweiter, unbeabsichtigter Versandpfad'
    );
  }
});

test('sendeBestellstatusmailErneut (Server Action) prüft istAdmin() und leitet an sendeStatusmailErneut weiter', () => {
  const rumpf = funktionsRumpf(actionsQuelltext, 'sendeBestellstatusmailErneut');
  assert.match(rumpf, /if \(!\(await istAdmin\(\)\)\)/, 'muss denselben Admin-Wächter wie aendereBestellstatus haben');
  assert.match(rumpf, /await sendeStatusmailErneut\(orderId\)/);
  assert.match(rumpf, /revalidatePath\(`\/admin\/bestellung\/\$\{orderId\}`\)/);
});

test('OrderStatusControl.tsx zeigt den Erneut-senden-Button nur für Status mit Status-Mail (in_production/shipped/completed)', () => {
  assert.match(
    controlQuelltext,
    /const STATUS_MIT_MAIL: readonly OrderStatus\[\] = \['in_production', 'shipped', 'completed'\];/
  );
  assert.match(controlQuelltext, /STATUS_MIT_MAIL\.includes\(status\)/, 'der Button muss an diese Liste gebunden sein');
  assert.match(controlQuelltext, /sendeBestellstatusmailErneut/, 'muss die Server Action tatsächlich importieren/aufrufen');
});
