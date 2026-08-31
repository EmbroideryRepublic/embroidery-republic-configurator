/**
 * Regressionstest für den Fund vom 2026-08-31 (echter Live-Test mit PayPal-
 * Produktivzugangsdaten, Order 4XC35701PX8515222): `eroeffne()` erzeugte
 * jedes Mal erfolgreich eine PayPal-Order, warf aber unmittelbar danach
 * "ohne Genehmigungs-Link ('approve')" – PayPal hat noch NIE tatsächlich
 * funktioniert. Ursache: Der Aufruf gibt immer
 * `payment_source.paypal.experience_context` mit; in genau diesem
 * Integrationsmuster heißt PayPals Weiterleitungs-Link laut eigener
 * Orders-v2-Dokumentation "payer-action", nicht "approve" (Letzteres gilt
 * nur für die ältere Integration ohne payment_source).
 *
 * Mockt `global.fetch` nach demselben Muster wie
 * lib/shipping/providers/__tests__/dhl.test.ts (dort ausführlich begründet).
 * paypal.ts hatte bislang KEINEN eigenen fetch-gemockten Test (nur
 * paypalKonfiguration.test.ts für die reine Konfigurationsprüfung) – dieser
 * hier schließt genau die Lücke, die den Fund oben monatelang unsichtbar
 * ließ: Die Konfiguration war korrekt, der tatsächliche API-Vertrag nie
 * gegen eine realistische Antwortform geprüft.
 */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { paypalAnbieter } from '../paypal';

const ZUGANG = {
  PAYPAL_CLIENT_ID: 'test-client-id',
  PAYPAL_CLIENT_SECRET: 'test-client-secret',
  PAYPAL_ENV: 'sandbox',
};

const AUFTRAG = {
  bestellId: 'bestellung-1',
  bestellnummer: 'ER-2026-TEST01',
  betragCent: 2989,
  waehrung: 'EUR',
  beschreibung: 'Testbestellung',
  rueckkehrUrl: 'https://example.invalid/rueckkehr',
  abbruchUrl: 'https://example.invalid/abbruch',
  idempotenzSchluessel: 'idem-1',
} as const;

let vorherigeEnv: Record<string, string | undefined> = {};
let originalFetch: typeof fetch;

function tokenAntwort(): Response {
  return new Response(JSON.stringify({ access_token: 'tok-abc', expires_in: 1800 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function orderAntwort(links: { rel: string; href: string }[]): Response {
  return new Response(JSON.stringify({ id: 'PPL-ORDER-1', links }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
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
  // Token-Cache ist Modul-Zustand (siehe dhl.test.ts-Kopfkommentar) – jeder
  // Test bekommt trotzdem eine funktionierende Mock-Antwort für den
  // Token-Endpunkt, unabhängig davon, ob der Cache noch greift.
  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    throw new Error(`Unerwarteter Aufruf in diesem Test: ${href} ${JSON.stringify(init)}`);
  }) as typeof fetch;
});

test('eroeffne() findet die Weiterleitung über "payer-action" (das reale PayPal-Verhalten mit payment_source)', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return orderAntwort([
        { rel: 'self', href: 'https://api-m.sandbox.paypal.com/v2/checkout/orders/PPL-ORDER-1' },
        { rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PPL-ORDER-1' },
      ]);
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  const ergebnis = await paypalAnbieter.eroeffne(AUFTRAG);
  assert.equal(ergebnis.referenz, 'PPL-ORDER-1');
  assert.equal(ergebnis.weiterleitungUrl, 'https://www.sandbox.paypal.com/checkoutnow?token=PPL-ORDER-1');
});

test('eroeffne() fällt auf "approve" zurück, falls PayPal (z.B. ältere API-Version) nur diesen Link liefert', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return orderAntwort([{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PPL-ORDER-1' }]);
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  const ergebnis = await paypalAnbieter.eroeffne(AUFTRAG);
  assert.equal(ergebnis.weiterleitungUrl, 'https://www.sandbox.paypal.com/checkoutnow?token=PPL-ORDER-1');
});

test('"payer-action" hat Vorrang, falls PayPal ausnahmsweise beide Links liefert', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return orderAntwort([
        { rel: 'approve', href: 'https://example.invalid/approve-link' },
        { rel: 'payer-action', href: 'https://example.invalid/payer-action-link' },
      ]);
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  const ergebnis = await paypalAnbieter.eroeffne(AUFTRAG);
  assert.equal(ergebnis.weiterleitungUrl, 'https://example.invalid/payer-action-link');
});

test('eroeffne() wirft weiterhin klar, wenn WEDER "payer-action" noch "approve" vorhanden ist', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return orderAntwort([{ rel: 'self', href: 'https://api-m.sandbox.paypal.com/v2/checkout/orders/PPL-ORDER-1' }]);
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(
    () => paypalAnbieter.eroeffne(AUFTRAG),
    /PPL-ORDER-1 ohne Weiterleitungs-Link \("payer-action"\/"approve"\)/
  );
});

test('eine PayPal-Order ohne jeden "links"-Eintrag wirft ebenfalls klar (kein Absturz auf undefined)', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return new Response(JSON.stringify({ id: 'PPL-ORDER-2' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(() => paypalAnbieter.eroeffne(AUFTRAG), /PPL-ORDER-2 ohne Weiterleitungs-Link/);
});

test('ein von PayPal abgelehnter Order-Aufruf wird als klarer Fehler gemeldet', async () => {
  global.fetch = (async (url: string | URL) => {
    const href = url.toString();
    if (href.includes('/v1/oauth2/token')) return tokenAntwort();
    if (href.includes('/v2/checkout/orders')) {
      return new Response('{"name":"INVALID_REQUEST"}', { status: 400 });
    }
    throw new Error(`Unerwarteter Aufruf: ${href}`);
  }) as typeof fetch;

  await assert.rejects(() => paypalAnbieter.eroeffne(AUFTRAG), /PayPal-Order nicht angelegt \(400\)/);
});
