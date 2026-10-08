/**
 * Bestätigungscodes für Google Search Console und Bing Webmaster Tools.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { suchmaschinenBestaetigung } from '../bestaetigung';

const GOOGLE_CODE = 'aB3dE5gH7jK9mN1pQ3sT5vW7yZ9bC1eF3hJ5kL7nOp'; // 43 Zeichen, wie von Google ausgegeben
const BING_CODE = '0123456789ABCDEF0123456789ABCDEF'; // 32 Hexzeichen, wie von Bing ausgegeben

test('ohne Variablen wird nichts ausgegeben', () => {
  assert.equal(suchmaschinenBestaetigung({}), undefined);
  assert.equal(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: '', BING_SITE_VERIFICATION: '   ' }), undefined);
});

test('Google-Code erscheint als google-site-verification', () => {
  assert.deepEqual(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: GOOGLE_CODE }), { google: GOOGLE_CODE });
});

test('Bing-Code erscheint als msvalidate.01', () => {
  assert.deepEqual(suchmaschinenBestaetigung({ BING_SITE_VERIFICATION: BING_CODE }), {
    other: { 'msvalidate.01': BING_CODE },
  });
});

test('beide zusammen', () => {
  assert.deepEqual(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: GOOGLE_CODE, BING_SITE_VERIFICATION: BING_CODE }), {
    google: GOOGLE_CODE,
    other: { 'msvalidate.01': BING_CODE },
  });
});

test('umgebende Leerzeichen und Zeilenumbrüche aus der Variableneingabe werden entfernt', () => {
  assert.deepEqual(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: `  ${GOOGLE_CODE}\n` }), { google: GOOGLE_CODE });
});

test('ein versehentlich eingefügter ganzer <meta>-Tag wird NICHT ausgegeben (sonst kaputtes HTML im head)', () => {
  const tag = `<meta name="google-site-verification" content="${GOOGLE_CODE}" />`;
  assert.equal(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: tag }), undefined);
});

test('zu kurze oder mit Sonderzeichen durchsetzte Werte werden verworfen', () => {
  for (const wert of ['kurz', 'enthält leerzeichen und ist trotzdem lang genug', 'a"b>c<d' + 'x'.repeat(20), 'x'.repeat(200)]) {
    assert.equal(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: wert }), undefined, wert.slice(0, 30));
  }
});

test('ein ungültiger Wert verhindert den gültigen anderen nicht', () => {
  assert.deepEqual(suchmaschinenBestaetigung({ GOOGLE_SITE_VERIFICATION: 'ungültig!', BING_SITE_VERIFICATION: BING_CODE }), {
    other: { 'msvalidate.01': BING_CODE },
  });
});
