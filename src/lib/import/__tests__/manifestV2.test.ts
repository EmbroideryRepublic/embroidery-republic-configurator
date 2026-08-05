/**
 * WÄCHTER des Manifest-v2-Aufbaus (ADR 0006): Rückwärtskompatibilität (`views`),
 * Status-Ableitung (real/generiert/platzhalter) und Trennung flache Ansichten ↔
 * Zusatzmedien.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { baueManifestEintrag, resolveAsset, assetsMitRolle, type VerarbeiteteReferenz } from '../manifestV2';

function vref(p: Partial<VerarbeiteteReferenz>): VerarbeiteteReferenz {
  return {
    colorId: 'navy',
    view: 'front',
    viewKonfidenz: 'gelabelt',
    rolle: 'ansicht-flach',
    herkunft: 'original',
    quelle: 'gildan.eu',
    prioritaet: 0,
    quellUrl: 'https://x/front.jpg',
    browserPfad: '/products/g-navy/front.webp',
    version: 'abc123abc123',
    ...p,
  };
}

test('Original front+back → status real, views enthält beide flachen Ansichten', () => {
  const e = baueManifestEintrag([
    vref({ view: 'front' }),
    vref({ view: 'back', browserPfad: '/products/g-navy/back.webp' }),
  ]);
  assert.equal(e.status, 'real');
  assert.deepEqual(Object.keys(e.views).sort(), ['back', 'front']);
  assert.equal(e.views.front, '/products/g-navy/front.webp');
  assert.equal(e.assets.length, 2);
});

test('Zusatzmedien (lifestyle/detail) landen in assets, NICHT in views', () => {
  const e = baueManifestEintrag([
    vref({ view: 'front' }),
    vref({ view: 'lifestyle-1', rolle: 'lifestyle', browserPfad: '/products/g-navy/lifestyle-1.webp' }),
  ]);
  assert.deepEqual(Object.keys(e.views), ['front']);
  assert.equal(e.assets.length, 2);
});

test('nur generierte Assets → status generiert', () => {
  const e = baueManifestEintrag([vref({ view: 'back', herkunft: 'generiert', quelle: 'generiert:render' })]);
  assert.equal(e.status, 'generiert');
});

test('keine Assets → status platzhalter, leere views', () => {
  const e = baueManifestEintrag([]);
  assert.equal(e.status, 'platzhalter');
  assert.deepEqual(e.views, {});
  assert.equal(e.assets.length, 0);
});

test('resolveAsset: Rolle/Ansicht auflösen, Original vor Generiert', () => {
  const e = baueManifestEintrag([
    vref({ view: 'back', herkunft: 'generiert', quelle: 'generiert:render', browserPfad: '/p/gen-back.webp' }),
    vref({ view: 'back', herkunft: 'original', browserPfad: '/p/echt-back.webp' }),
    vref({ view: 'l1', rolle: 'lifestyle', browserPfad: '/p/l1.webp' }),
  ]);
  assert.equal(resolveAsset(e, { view: 'back' })!.herkunft, 'original');
  assert.equal(resolveAsset(e, { rolle: 'lifestyle' })!.view, 'l1');
  assert.equal(resolveAsset(e, { rolle: 'freisteller' }), undefined);
  assert.equal(resolveAsset(undefined), undefined);
});

test('assetsMitRolle: alle Assets einer Rolle', () => {
  const e = baueManifestEintrag([
    vref({ view: 'front' }),
    vref({ view: 'l1', rolle: 'lifestyle', browserPfad: '/p/l1.webp' }),
    vref({ view: 'l2', rolle: 'lifestyle', browserPfad: '/p/l2.webp' }),
  ]);
  assert.equal(assetsMitRolle(e, 'lifestyle').length, 2);
  assert.equal(assetsMitRolle(e, 'ansicht-flach').length, 1);
});
