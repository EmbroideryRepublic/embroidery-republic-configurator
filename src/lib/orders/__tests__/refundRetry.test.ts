/**
 * ARCHITEKTURTEST für `holeOffeneErstattungenNach` (refundService.ts).
 *
 * Wie rechnungRetry.test.ts: reine Quelltext-Prüfung statt Mocking des
 * Supabase-Clients – dieselbe Teststrategie wie der Rest von
 * refundService.ts/orderCompletion.ts (kein einziger bestehender Test mockt
 * createAdminClient).
 *
 * Prüft dieselben zwei Dinge, aus demselben Grund: die Auswahlbedingung
 * (muss exakt der von `beanspruche_erstattung`, Migration 0029, entsprechen
 * – sonst greift der doppelte-Auslösung-Schutz nicht mehr strukturell) und
 * die nicht-fatale Einbindung in die Cron-Route.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const REFUND_SERVICE = path.join(process.cwd(), 'src', 'lib', 'orders', 'refundService.ts');
const CRON_ROUTE = path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
const CLAIM_MIGRATION = path.join(process.cwd(), 'supabase', 'migrations', '0029_rueckerstattung.sql');

function funktionsRumpf(datei: string, name: string): string {
  const inhalt = readFileSync(datei, 'utf8');
  const start = inhalt.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} nicht gefunden in ${datei}`);
  const naechste = inhalt.indexOf('\nexport async function', start + 1);
  return naechste > 0 ? inhalt.slice(start, naechste) : inhalt.slice(start);
}

test('holeOffeneErstattungenNach wählt exakt die Bedingung von beanspruche_erstattung', () => {
  const rumpf = funktionsRumpf(REFUND_SERVICE, 'holeOffeneErstattungenNach');

  // Migration 0029: status = 'cancelled' and payment_status = 'paid' and
  // refund_status in ('required', 'failed') and
  // refund_erstattung_gestartet_am is null. Weicht die Auswahl hier davon
  // ab, verpasst der Retry entweder echte Kandidaten oder holt Bestellungen
  // nach, die der Claim strukturell ohnehin nie annehmen würde.
  assert.match(rumpf, /\.eq\('status', 'cancelled'\)/);
  assert.match(rumpf, /\.eq\('payment_status', 'paid'\)/);
  assert.match(rumpf, /\.in\('refund_status', \['required', 'failed'\]\)/);
  assert.match(rumpf, /\.is\('refund_erstattung_gestartet_am', null\)/);

  const migration = readFileSync(CLAIM_MIGRATION, 'utf8');
  assert.match(
    migration,
    /and status = 'cancelled'\s*\n\s*and payment_status = 'paid'\s*\n\s*and refund_status in \('required', 'failed'\)/,
    'die Referenzbedingung in Migration 0029 hat sich geändert – die Auswahl oben muss synchron bleiben'
  );
});

test('holeOffeneErstattungenNach ruft für jeden Treffer stelleErstattungSicher auf', () => {
  const rumpf = funktionsRumpf(REFUND_SERVICE, 'holeOffeneErstattungenNach');
  assert.match(rumpf, /\bstelleErstattungSicher\(orderId\)/);
});

test('Die Cron-Route bindet den Erstattungs-Retry nicht-fatal ein', () => {
  const inhalt = readFileSync(CRON_ROUTE, 'utf8');
  assert.match(inhalt, /import \{ holeOffeneErstattungenNach \} from '@\/lib\/orders\/refundService'/);

  const aufruf = inhalt.indexOf('holeOffeneErstattungenNach(');
  assert.ok(aufruf > 0, 'die Route muss holeOffeneErstattungenNach aufrufen');

  // Muss in einem eigenen try/catch stehen: Ein Fehler beim Erstattungs-
  // Retry darf die Lieferantenverarbeitung nicht mitreißen – dieselbe
  // Anforderung wie an raeumeAuf() weiter unten in derselben Route.
  const tryStart = inhalt.lastIndexOf('try {', aufruf);
  const catchEnde = inhalt.indexOf('}', inhalt.indexOf('catch', aufruf));
  assert.ok(tryStart > 0 && tryStart < aufruf, 'der Aufruf muss in einem try-Block stehen');
  assert.ok(catchEnde > aufruf, 'der Aufruf muss von einem catch-Block gefolgt sein');
});

test('Die Cron-Route gibt hängengebliebene Erstattungs-Ansprüche frei', () => {
  const inhalt = readFileSync(CRON_ROUTE, 'utf8');
  assert.match(inhalt, /db\.rpc\('gib_haengende_erstattungen_frei', \{ p_minuten: ERSTATTUNG_CLAIM_VERWAIST_NACH_MINUTEN \}\)/);
});

// ── Die sicherheitskritischste Designentscheidung dieses Blocks ──────────
//
// Ein EINDEUTIGER Fehlschlag beim Anbieter-Aufruf (synchron abgelehnt) darf
// den Anspruch sofort freigeben – der Anbieter hat nachweislich NICHTS
// getan. Scheitert dagegen NUR die Persistierung NACH einem erfolgreichen
// Anbieter-Aufruf, darf der Anspruch NIEMALS in derselben Weise freigegeben
// werden: Das würde einem zweiten, gleichzeitigen Trigger erlauben, den
// Claim erneut zu beanspruchen und (im schlimmsten Fall vor dem
// Cron-Reaper) erneut zu erstatten – sicher ist das NUR, weil derselbe
// stabile Idempotenzschlüssel verwendet wird, was ein `gib_erstattung_frei`
// an dieser Stelle nicht zusätzlich sicherer machen würde, aber das
// bewusste Stehenlassen als 'processing' (statt vorzeitiger Freigabe)
// dokumentiert exakt diese Unterscheidung im Code. Ein künftiger Umbau, der
// versehentlich `gib_erstattung_frei` in den Persistierungs-Fehlerzweig
// verschiebt, wäre der teuerste denkbare Fehler in dieser Datei – dieser
// Test soll ihn aktiv verhindern.
test('gib_erstattung_frei wird NUR bei einem eindeutigen Anbieter-Fehlschlag aufgerufen, NIE nach einem geglückten Aufruf mit gescheiterter Persistierung', () => {
  const rumpf = funktionsRumpf(REFUND_SERVICE, 'stelleErstattungSicher');

  // Der catch-Block um anbieter.erstatte(...) MUSS gib_erstattung_frei rufen.
  const catchStart = rumpf.indexOf('} catch (err) {');
  assert.ok(catchStart > 0, 'catch-Block um den Anbieter-Aufruf nicht gefunden');
  const catchEnde = rumpf.indexOf('\n  }', catchStart);
  const catchBlock = rumpf.slice(catchStart, catchEnde);
  assert.match(catchBlock, /gib_erstattung_frei/, 'ein eindeutiger Fehlschlag muss den Anspruch sofort freigeben');

  // Der Persistierungs-Fehlerzweig (if (!gespeichert)) darf gib_erstattung_frei
  // NICHT enthalten – der Anspruch bleibt bewusst aktiv, siehe Testkommentar.
  const gespeichertStart = rumpf.indexOf('if (!gespeichert)');
  assert.ok(gespeichertStart > catchEnde, 'if (!gespeichert)-Zweig nicht gefunden oder vor dem catch-Block');
  const gespeichertEnde = rumpf.indexOf('\n  }', gespeichertStart);
  const gespeichertBlock = rumpf.slice(gespeichertStart, gespeichertEnde);
  assert.doesNotMatch(
    gespeichertBlock,
    /gib_erstattung_frei/,
    'KRITISCH: der Persistierungs-Fehlerzweig darf den Anspruch nicht freigeben, sonst kann ein Retry vor dem Cron-Reaper doppelt erstatten'
  );
});
