/**
 * Tests des signierten Bestell-Tokens.
 *
 * Der Token ersetzt mangels Kundenkonto die Anmeldung – er muss deshalb
 * jeden Manipulationsversuch abweisen: fremde Bestell-ID, verlängerte
 * Gültigkeit, gefälschte Signatur, fremdes Secret.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeBestellToken, pruefeBestellToken } from '../orderAccessToken';

const SECRET = 'x'.repeat(40);
const ORDER = 'd5edb523-00bd-4372-8a7b-f7d30fede1c1';
const JETZT = new Date('2026-07-20T10:00:00.000Z');

/** Setzt das Secret nur für die Dauer eines Tests. */
function mitSecret<T>(wert: string | undefined, fn: () => T): T {
  const vorher = process.env.ORDER_TOKEN_SECRET;
  if (wert === undefined) delete process.env.ORDER_TOKEN_SECRET;
  else process.env.ORDER_TOKEN_SECRET = wert;
  try {
    return fn();
  } finally {
    if (vorher === undefined) delete process.env.ORDER_TOKEN_SECRET;
    else process.env.ORDER_TOKEN_SECRET = vorher;
  }
}

test('gültiger Token liefert die Bestell-ID zurück', () => {
  mitSecret(SECRET, () => {
    const token = erzeugeBestellToken(ORDER, JETZT)!;
    assert.ok(token, 'Token wird erzeugt');
    const r = pruefeBestellToken(token, JETZT);
    assert.equal(r.gueltig, true);
    if (r.gueltig) assert.equal(r.orderId, ORDER);
  });
});

test('abgelaufener Token wird abgewiesen', () => {
  mitSecret(SECRET, () => {
    const token = erzeugeBestellToken(ORDER, JETZT, 60_000)!;
    const r = pruefeBestellToken(token, new Date(JETZT.getTime() + 60_001));
    assert.equal(r.gueltig, false);
    if (!r.gueltig) assert.equal(r.grund, 'abgelaufen');
  });
});

test('manipulierte Signatur wird abgewiesen', () => {
  mitSecret(SECRET, () => {
    const token = erzeugeBestellToken(ORDER, JETZT)!;
    const [nutzlast] = token.split('.');
    const r = pruefeBestellToken(`${nutzlast}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`, JETZT);
    assert.equal(r.gueltig, false);
    if (!r.gueltig) assert.equal(r.grund, 'signatur');
  });
});

test('ausgetauschte Bestell-ID wird abgewiesen', () => {
  mitSecret(SECRET, () => {
    const token = erzeugeBestellToken(ORDER, JETZT)!;
    const [, signatur] = token.split('.');
    // Fremde ID mit der ALTEN Signatur kombinieren
    const fremd = Buffer.from(`fremde-order-id.${JETZT.getTime() + 1000}`, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const r = pruefeBestellToken(`${fremd}.${signatur}`, JETZT);
    assert.equal(r.gueltig, false);
    if (!r.gueltig) assert.equal(r.grund, 'signatur');
  });
});

test('verlängerte Gültigkeit im Token wird abgewiesen', () => {
  mitSecret(SECRET, () => {
    const token = erzeugeBestellToken(ORDER, JETZT, 60_000)!;
    const [, signatur] = token.split('.');
    const verlaengert = Buffer.from(`${ORDER}.${JETZT.getTime() + 999_999_999}`, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const r = pruefeBestellToken(`${verlaengert}.${signatur}`, JETZT);
    assert.equal(r.gueltig, false, 'die Ablaufzeit ist mitsigniert');
    if (!r.gueltig) assert.equal(r.grund, 'signatur');
  });
});

test('Token eines anderen Secrets wird abgewiesen', () => {
  const fremderToken = mitSecret('y'.repeat(40), () => erzeugeBestellToken(ORDER, JETZT)!);
  mitSecret(SECRET, () => {
    const r = pruefeBestellToken(fremderToken, JETZT);
    assert.equal(r.gueltig, false);
    if (!r.gueltig) assert.equal(r.grund, 'signatur');
  });
});

test('Unsinn als Token wird sauber abgewiesen, nicht geworfen', () => {
  mitSecret(SECRET, () => {
    for (const muell of ['', 'abc', 'a.b.c', '....', 'ä.ö']) {
      const r = pruefeBestellToken(muell, JETZT);
      assert.equal(r.gueltig, false, `"${muell}" muss abgewiesen werden`);
    }
  });
});

test('ohne konfiguriertes Secret wird KEIN Token erzeugt und keiner akzeptiert', () => {
  mitSecret(undefined, () => {
    assert.equal(erzeugeBestellToken(ORDER, JETZT), null, 'lieber kein Link als ein kaputter');
    const r = pruefeBestellToken('irgendwas.irgendwas', JETZT);
    assert.equal(r.gueltig, false);
    if (!r.gueltig) assert.equal(r.grund, 'kein-secret');
  });
});

test('zu kurzes Secret gilt als nicht konfiguriert', () => {
  mitSecret('zu-kurz', () => {
    assert.equal(erzeugeBestellToken(ORDER, JETZT), null);
  });
});
