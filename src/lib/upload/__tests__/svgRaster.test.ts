/**
 * Auflösung gerasterter SVG-Uploads: kleine SVGs werden auf eine druckfähige Kantenlänge gebracht, große bleiben, zu große werden auf die
 * Obergrenze des Servers begrenzt. Anlass (2026-11-24): Ein SVG in Eigengröße ergab oft nur 100–300 Pixel, bei angezeigter „Vektordatei“.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { istSvgDataUrl, SVG_MAX_KANTE_PX, SVG_ZIEL_KANTE_PX, svgRasterSkala } from '../svgRaster';

const laengere = (b: number, h: number) => Math.max(b, h) * svgRasterSkala(b, h);

test('kleine SVGs werden auf die Zielkante vergrößert, das Seitenverhältnis bleibt', () => {
  assert.equal(Math.round(laengere(100, 100)), SVG_ZIEL_KANTE_PX);
  assert.equal(Math.round(laengere(300, 150)), SVG_ZIEL_KANTE_PX);
  assert.equal(Math.round(laengere(150, 300)), SVG_ZIEL_KANTE_PX);
  const s = svgRasterSkala(300, 150);
  assert.equal(Math.round(300 * s) / Math.round(150 * s), 2);
});

test('SVGs, die schon groß genug sind, behalten ihre Größe', () => {
  assert.equal(svgRasterSkala(3000, 2000), 1);
  assert.equal(svgRasterSkala(5000, 1000), 1);
  assert.equal(svgRasterSkala(8000, 8000), 1);
});

test('zu große SVGs werden auf die Obergrenze des Servers (8000 Pixel je Kante) begrenzt, nie darüber', () => {
  assert.equal(Math.round(laengere(20000, 10000)), SVG_MAX_KANTE_PX);
  assert.ok(svgRasterSkala(20000, 10000) < 1);
  for (const [b, h] of [[1, 1], [10, 4000], [4000, 10], [7999, 10], [8001, 8001], [30000, 100]] as const) {
    assert.ok(laengere(b, h) <= SVG_MAX_KANTE_PX + 1e-6, `${b}×${h}`);
  }
});

test('ungültige Maße ergeben Faktor 1 statt NaN oder Unendlich', () => {
  for (const [b, h] of [[0, 0], [-5, -5], [NaN, NaN], [Infinity, 10]] as const) {
    assert.equal(svgRasterSkala(b, h), 1, `${b}×${h}`);
  }
});

test('SVG-Data-URLs werden erkannt, PNG und JPEG nicht', () => {
  assert.equal(istSvgDataUrl('data:image/svg+xml;base64,PHN2Zz4='), true);
  assert.equal(istSvgDataUrl('data:image/svg+xml;charset=utf-8,%3Csvg'), true);
  assert.equal(istSvgDataUrl('data:image/png;base64,AAAA'), false);
  assert.equal(istSvgDataUrl('data:image/jpeg;base64,AAAA'), false);
});
