/**
 * Tests des DHL-OAuth2-Token-Flows (dhl.ts).
 *
 * Mockt `global.fetch`, weil dhl.ts (anders als stripe.ts/paypal.ts, die
 * bislang nur gegen echte Test-/Sandbox-APIs per E2E-Skript geprüft werden)
 * noch kein Sandbox-Zugangsdaten-Paar hat, gegen das ein solches Skript
 * laufen könnte. Geprüft wird hier ausschließlich die TOKEN-CACHING-Logik
 * (Aufruf-Anzahl, Wiederverwendung, Fehlerweg) – nicht der vollständige
 * DHL-API-Vertrag, der bleibt Sache eines künftigen e2eDhl.mts, sobald
 * echte Sandbox-Zugangsdaten vorliegen.
 *
 * ── Reihenfolge ist absichtlich ─────────────────────────────────────────
 * Der Token-Cache in dhl.ts ist Modul-Zustand (wie bei paypal.ts) und lebt
 * über alle Tests dieser Datei hinweg. Der Fehlerpfad-Test steht deshalb
 * bewusst ZUERST, bevor irgendein Test einen gültigen Token zwischenspeichert
 * – sonst würde ein späterer Test den Fehlerpfad nie erreichen, weil der
 * Cache-Treffer den Netzwerkaufruf gar nicht erst auslöst.
 */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { dhlAnbieter } from '../dhl';
import { VersandTeilerfolgFehler } from '../../types';

const ZUGANG = {
  DHL_API_KEY: 'test-key',
  DHL_API_SECRET: 'test-secret',
  DHL_USERNAME: 'test-user',
  DHL_PASSWORD: 'test-pass',
  DHL_BILLING_NUMBER: '12345678901234',
  DHL_ENV: 'sandbox',
};

const AUFTRAG = {
  bestellId: 'bestellung-1',
  bestellnummer: 'ER-2026-TEST01',
  empfaenger: { name: 'Max Mustermann', strasse: 'Teststr. 1', plz: '12345', ort: 'Teststadt', land: 'Deutschland' },
  gewichtKg: 0.5,
};

let vorherigeEnv: Record<string, string | undefined> = {};
let aufrufe: { url: string; init: RequestInit }[] = [];
let originalFetch: typeof fetch;

function tokenAntwort(accessToken = 'tok-abc', expiresIn = 1800): Response {
  return new Response(JSON.stringify({ access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ordersAntwort(shipmentNo = '00340434161094012345'): Response {
  return new Response(
    JSON.stringify({ items: [{ shipmentNo, label: { b64: Buffer.from('PDF-INHALT').toString('base64') } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

before(() => {
  originalFetch = global.fetch;
  for (const [k, v] of Object.entries(ZUGANG)) {
    vorherigeEnv[k] = process.env[k];
    process.env[k] = v;
  }
});

after(() => {
  global.fetch = originalFetch;
  for (const [k, v] of Object.entries(vorherigeEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

beforeEach(() => {
  aufrufe = [];
});

test('ein technischer Fehler beim Token-Abruf wird als klarer Fehler gemeldet (kein Cache-Treffer, erster Aufruf dieser Datei)', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/auth/ropc/v1/token')) {
      return new Response('invalid_grant', { status: 400 });
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(() => dhlAnbieter.erstelleSendung(AUFTRAG), /DHL-OAuth-Token nicht erhalten \(400\)/);
});

test('erster ERFOLGREICHER Aufruf holt ein Token und ruft danach /orders mit Bearer-Header auf', async () => {
  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = url.toString();
    aufrufe.push({ url: href, init: init ?? {} });
    if (href.includes('/auth/ropc/v1/token')) return tokenAntwort('tok-erster-aufruf');
    if (href.includes('/orders')) return ordersAntwort();
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  const ergebnis = await dhlAnbieter.erstelleSendung(AUFTRAG);

  assert.equal(ergebnis.sendungsnummer, '00340434161094012345');
  assert.equal(aufrufe.length, 2, 'genau ein Token-Aufruf + ein Orders-Aufruf (der vorherige Fehlversuch cachte nichts)');
  assert.ok(aufrufe[0]!.url.includes('/auth/ropc/v1/token'));
  assert.ok(aufrufe[0]!.url.includes('api-sandbox.dhl.com'), 'DHL_ENV=sandbox muss den Sandbox-Auth-Endpunkt treffen');

  const tokenBody = String(aufrufe[0]!.init.body);
  assert.match(tokenBody, /grant_type=password/);
  assert.match(tokenBody, /client_id=test-key/);
  assert.match(tokenBody, /client_secret=test-secret/);
  assert.match(tokenBody, /username=test-user/);
  assert.match(tokenBody, /password=test-pass/);

  const ordersHeaders = aufrufe[1]!.init.headers as Record<string, string>;
  assert.equal(ordersHeaders.Authorization, 'Bearer tok-erster-aufruf');
  assert.equal(ordersHeaders['dhl-api-key'], undefined, 'unter OAuth2 entfällt der Legacy dhl-api-key-Header');
});

test('ein gültiges Token wird für den nächsten Versand wiederverwendet – kein zweiter Token-Aufruf', async () => {
  let tokenAufrufe = 0;
  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = url.toString();
    aufrufe.push({ url: href, init: init ?? {} });
    if (href.includes('/auth/ropc/v1/token')) {
      tokenAufrufe++;
      return tokenAntwort('tok-wiederverwendet', 1800);
    }
    if (href.includes('/orders')) return ordersAntwort('00340434161094099999');
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  // Der Token aus dem vorherigen Test ist noch gültig (30 Minuten, gerade
  // erst geholt) – dieser Aufruf hier darf deshalb schon selbst KEINEN
  // Token-Aufruf auslösen.
  await dhlAnbieter.erstelleSendung({ ...AUFTRAG, bestellnummer: 'ER-2026-TEST02' });
  assert.equal(tokenAufrufe, 0, 'ein Versand innerhalb der Token-Gültigkeit darf keinen neuen Token holen');

  const orderAufrufe = aufrufe.filter((a) => a.url.includes('/orders'));
  assert.equal(orderAufrufe.length, 1);
  const ordersHeaders = orderAufrufe[0]!.init.headers as Record<string, string>;
  assert.equal(ordersHeaders.Authorization, 'Bearer tok-erster-aufruf', 'wiederverwendet den im vorherigen Test geholten Token');
});

test('VersandTeilerfolgFehler bei angelegter Sendung ohne eingebettetes Label', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/auth/ropc/v1/token')) return tokenAntwort('tok-teilerfolg');
    if (href.includes('/orders')) {
      return new Response(JSON.stringify({ items: [{ shipmentNo: '00340434161094055555' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(
    () => dhlAnbieter.erstelleSendung({ ...AUFTRAG, bestellnummer: 'ER-2026-TEST03' }),
    (fehler: Error) => {
      assert.ok(fehler instanceof VersandTeilerfolgFehler);
      assert.equal((fehler as VersandTeilerfolgFehler).sendungsnummer, '00340434161094055555');
      return true;
    }
  );
});

test('fehlende Sendungsnummer in der Orders-Antwort wird als Fehler gemeldet', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/auth/ropc/v1/token')) return tokenAntwort('tok-abgelehnt');
    if (href.includes('/orders')) {
      return new Response(
        JSON.stringify({ items: [{ validationMessages: [{ property: 'shipper.postalCode', validationMessage: 'invalid' }] }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(
    () => dhlAnbieter.erstelleSendung({ ...AUFTRAG, bestellnummer: 'ER-2026-TEST04' }),
    /ohne Sendungsnummer.*shipper\.postalCode: invalid/
  );
});
