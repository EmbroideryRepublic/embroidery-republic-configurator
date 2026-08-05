/**
 * WÄCHTER der Content-Hash-Versionierung (ADR 0006).
 * Die Version steuert die Re-Import-Änderungserkennung – ein Fehler hier
 * ersetzte entweder unnötig alles oder verpasste geänderte Herstellerbilder.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { hashHex, kurzHash, assetGeaendert } from '../contentHash';

test('hashHex: bekannter sha256 von "abc"', () => {
  assert.equal(hashHex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('kurzHash: 12 Hex-Zeichen, deterministisch', () => {
  assert.equal(kurzHash('abc').length, 12);
  assert.equal(kurzHash('abc'), kurzHash('abc'));
  assert.notEqual(kurzHash('abc'), kurzHash('abd'));
});

test('assetGeaendert: unbekannte Version → true; gleiche Bytes → false; andere → true', () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const v = kurzHash(bytes);
  assert.equal(assetGeaendert(bytes, undefined), true);
  assert.equal(assetGeaendert(bytes, v), false);
  assert.equal(assetGeaendert(new Uint8Array([1, 2, 4]), v), true);
});
