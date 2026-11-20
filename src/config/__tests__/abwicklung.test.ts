import assert from 'node:assert/strict';
import { test } from 'node:test';
import { echteMasse, flacheBreiteCm, flacheFlaechenBreiteCm, rundeMassCm } from '../abwicklung';

// Hoodie Größe M: flache Brustbreite 56 cm → Radius 56/π. Die Brustmitte liegt bei einer mittigen Fläche genau in der Mitte.
const R = 56 / Math.PI;
const abw = { radiusCm: R, mitteCm: 16 };

test('ohne Krümmungsangabe bleibt die gezeichnete Breite unverändert (Ärmel, Stickerei)', () => {
  assert.equal(flacheBreiteCm(3, 20, undefined), 20);
  assert.equal(flacheBreiteCm(3, 20, null), 20);
  assert.equal(flacheBreiteCm(3, 20, { radiusCm: 0, mitteCm: 10 }), 20);
});

test('mittiges Motiv: 2·r·asin(p / 2r) – Werte der Berechnung im Gespräch (Hoodie M, 56 cm)', () => {
  const mittig = (p: number) => flacheBreiteCm(16 - p / 2, p, abw);
  // kleine Motive sind fast unverändert, große deutlich breiter
  assert.ok(Math.abs(mittig(20) - 21.2) < 0.1, `20 → ${mittig(20)}`);
  assert.ok(Math.abs(mittig(30) - 35.5) < 0.2, `30 → ${mittig(30)}`);
  assert.ok(Math.abs(mittig(35) - 49.2) < 0.4, `35 → ${mittig(35)}`);
});

test('die volle sichtbare Brust (2r) ist die ganze flache Brustbreite', () => {
  const voll = flacheBreiteCm(16 - R, 2 * R, abw);
  assert.ok(Math.abs(voll - 56) < 1e-9);
});

test('die Abwicklung ist nie kleiner als das gezeichnete Maß und wächst mit der Breite', () => {
  let vorher = 0;
  for (let p = 2; p <= 2 * R; p += 2) {
    const flach = flacheBreiteCm(16 - p / 2, p, abw);
    assert.ok(flach >= p - 1e-9, `p=${p}`);
    assert.ok(flach > vorher, `monoton bei p=${p}`);
    vorher = flach;
  }
});

test('Bogenlängen sind additiv: zwei Hälften ergeben das Ganze', () => {
  const ganz = flacheBreiteCm(4, 24, abw);
  const links = flacheBreiteCm(4, 12, abw);
  const rechts = flacheBreiteCm(16, 12, abw);
  assert.ok(Math.abs(ganz - (links + rechts)) < 1e-9);
});

test('ein Motiv am Rand ist in echt breiter als dasselbe Motiv in der Mitte (gleiche gezeichnete Breite)', () => {
  const mitte = flacheBreiteCm(16 - 5, 10, abw);
  const rand = flacheBreiteCm(16 + R - 10, 10, abw);
  assert.ok(rand > mitte);
});

test('über die Kontur hinaus wird begrenzt statt NaN zu liefern', () => {
  const ausserhalb = flacheBreiteCm(-20, 100, abw);
  assert.ok(Number.isFinite(ausserhalb));
  assert.ok(Math.abs(ausserhalb - Math.PI * R) < 1e-9, 'höchstens die ganze flache Brustbreite');
});

test('echteMasse: Breite abgewickelt, Höhe wie gezeichnet, nie kleiner als gezeichnet', () => {
  const m = echteMasse({ xCm: 1, widthCm: 30, heightCm: 20 }, { abwicklung: abw });
  assert.ok(m.breiteCm > 30);
  assert.equal(m.hoeheCm, 20);
  const ohne = echteMasse({ xCm: 1, widthCm: 30, heightCm: 20 }, { abwicklung: undefined });
  assert.deepEqual(ohne, { breiteCm: 30, hoeheCm: 20 });
  assert.deepEqual(echteMasse({ xCm: 1, widthCm: 30, heightCm: 20 }, null), { breiteCm: 30, hoeheCm: 20 });
});

test('flacheFlaechenBreiteCm ist die flache Breite der ganzen Fläche', () => {
  const box = 2 * R * Math.sin((56 - 4) / (2 * R));
  const flach = flacheFlaechenBreiteCm({ boxWidthCm: box, abwicklung: { radiusCm: R, mitteCm: box / 2 } });
  assert.ok(Math.abs(flach - 52) < 1e-9, `${flach}`);
});

test('rundeMassCm rundet auf 0,1 cm', () => {
  assert.equal(rundeMassCm(35.46), 35.5);
  assert.equal(rundeMassCm(35.44), 35.4);
});
