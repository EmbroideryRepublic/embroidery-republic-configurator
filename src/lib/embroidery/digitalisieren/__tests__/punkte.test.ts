/**
 * Kleine Punkte (i-Punkt, Umlautpunkte, Satzzeichen) dürfen in der Stickdatei nie fehlen.
 *
 * Regression: Teile unter 0,8 mm² wurden als „Bildrauschen“ verworfen, dadurch fehlten bei kleiner Schrift die Punkte
 * auf dem i und die Umlautpunkte. Geprüft wird an einem synthetischen Raster (10 px = 1 mm), dessen Punkt-Lage bekannt
 * ist, und an der zurückgelesenen DST-Datei.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digitalisiereText } from '../digitalisiere';
import { leseDst } from '../dst';
import type { Raster } from '../maske';

const PX = 10;

/** Stamm 2 × 6 mm mit Punkt (Durchmesser `punktMm`) 1 mm darüber – wie ein kleines i. */
function iMitPunkt(punktMm: number): Raster {
  const breite = 8 * PX;
  const hoehe = 12 * PX;
  const rgba = new Uint8Array(breite * hoehe * 4);
  const setze = (x: number, y: number) => {
    const i = (y * breite + x) * 4;
    rgba[i] = 138;
    rgba[i + 1] = 141;
    rgba[i + 2] = 143;
    rgba[i + 3] = 255;
  };
  // Stamm: x 3…5 mm, y 5…11 mm
  for (let y = 5 * PX; y < 11 * PX; y++) for (let x = 3 * PX; x < 5 * PX; x++) setze(x, y);
  // Punkt: Kreis um (4 mm, 2 mm)
  const r = (punktMm / 2) * PX;
  for (let y = 0; y < 4 * PX; y++) {
    for (let x = 0; x < breite; x++) {
      if (Math.hypot(x + 0.5 - 4 * PX, y + 0.5 - 2 * PX) <= r) setze(x, y);
    }
  }
  return { breite, hoehe, rgba };
}

/** Stiche (nicht Sprünge) im oberen Bereich (y < 3,5 mm in Rasterkoordinaten) – dort liegt nur der Punkt. */
function stichImPunktBereich(punktMm: number): number {
  const ergebnis = digitalisiereText(iMitPunkt(punktMm), '#8a8d8f', 'PUNKT');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return 0;
  const gelesen = leseDst(ergebnis.dst);
  // Motiv ist zentriert; DST: y nach OBEN. Motivhöhe = von Punkt-Oberkante bis Stamm-Unterkante.
  const hoeheMm = ergebnis.plan.hoeheMm;
  const obereKante = (hoeheMm / 2) * 10; // in 0,1 mm
  const punktBereichUnten = obereKante - (punktMm + 0.6) * 10;
  return gelesen.eintraege.filter((e) => e.art === 'stich' && e.y >= punktBereichUnten).length;
}

test('ein i-Punkt von 1,0 mm ist in der Stickdatei enthalten', () => {
  assert.ok(stichImPunktBereich(1.0) >= 3, 'Der i-Punkt fehlt in der Datei');
});

test('ein Punkt von 0,8 mm (kleiner als die frühere Mindestfläche) fehlt nicht', () => {
  assert.ok(stichImPunktBereich(0.8) >= 3, 'Der kleine Punkt fehlt in der Datei');
});

test('selbst ein Punkt von 0,5 mm wird als Stern gestickt, nicht weggelassen', () => {
  assert.ok(stichImPunktBereich(0.5) >= 3, 'Der winzige Punkt fehlt in der Datei');
});

test('ohne Punkt entstehen im Punktbereich keine Stiche (die Prüfung misst wirklich den Punkt)', () => {
  // Gegenprobe: nur der Stamm, Höhe kürzer – im selben Bereich darf nichts gestickt werden.
  const breite = 8 * PX;
  const hoehe = 12 * PX;
  const rgba = new Uint8Array(breite * hoehe * 4);
  for (let y = 5 * PX; y < 11 * PX; y++) {
    for (let x = 3 * PX; x < 5 * PX; x++) {
      const i = (y * breite + x) * 4;
      rgba[i + 3] = 255;
    }
  }
  const ergebnis = digitalisiereText({ breite, hoehe, rgba }, '#8a8d8f', 'STAMM');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.ok(ergebnis.plan.hoeheMm < 6.5, `Nur der Stamm (6 mm) erwartet, Motivhöhe ${ergebnis.plan.hoeheMm} mm`);
});
