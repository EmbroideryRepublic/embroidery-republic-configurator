/**
 * Freistellen (lib/upload/freistellen.ts) an künstlichen Bildern mit bekannter Lösung: Pixel für Pixel prüfbar, ohne Browser.
 *
 * Geprüft wird das, was die frühere Fassung falsch machte: Hintergrund kroch ins Motiv, weiche Kanten waren willkürlich, helle Säume blieben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { freistelle, HintergrundNichtEinfarbig } from '../freistellen';

type Farbe = [number, number, number];

/** Kleiner, reproduzierbarer Zufallsgenerator (kein Math.random: Tests müssen immer dasselbe tun). */
function zufall(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Rendert ein Bild: Hintergrund `bg`, darüber Motiv, das für jeden Punkt (x, y) eine Farbe oder null (kein Motiv) liefert.
 * 4×4 Unterabtastung ergibt weiche Kanten wie bei einem echten Logo – Kantenpixel sind Mischungen aus Motiv und Hintergrund.
 */
function rendere(w: number, h: number, bg: Farbe | ((x: number, y: number) => Farbe), motiv: (x: number, y: number) => Farbe | null, rauschen = 0, seed = 1) {
  const rnd = zufall(seed);
  const daten = new Uint8ClampedArray(w * h * 4);
  const S = 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const grund = typeof bg === 'function' ? bg(x, y) : bg;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const m = motiv(x + (sx + 0.5) / S, y + (sy + 0.5) / S);
          const c = m ?? grund;
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const o = (y * w + x) * 4;
      const n = rauschen ? (rnd() - 0.5) * 2 * rauschen : 0;
      daten[o] = r / (S * S) + n;
      daten[o + 1] = g / (S * S) + n;
      daten[o + 2] = b / (S * S) + n;
      daten[o + 3] = 255;
    }
  }
  return daten;
}

const WEISS: Farbe = [255, 255, 255];
const SCHWARZ: Farbe = [0, 0, 0];
const ROT: Farbe = [200, 30, 30];

const kreis = (cx: number, cy: number, r: number, farbe: Farbe) => (x: number, y: number) => ((x - cx) ** 2 + (y - cy) ** 2 <= r * r ? farbe : null);

function alphaAn(rgba: Uint8ClampedArray, w: number, x: number, y: number) {
  return rgba[(y * w + x) * 4 + 3]!;
}

test('schwarzer Kreis auf Weiß: Hintergrund weg, Motiv voll, KEIN heller Saum an der Kante', () => {
  const w = 200;
  const h = 200;
  const bild = rendere(w, h, WEISS, kreis(100, 100, 60, SCHWARZ));
  const { rgba, entfernterAnteil } = freistelle(bild, w, h);

  assert.equal(alphaAn(rgba, w, 2, 2), 0, 'Ecke ist transparent');
  assert.equal(alphaAn(rgba, w, 100, 100), 255, 'Mitte ist voll deckend');
  // Flächenanteil: Kreis π·60² ≈ 11.310 von 40.000 → entfernt ≈ 71,7 %.
  assert.ok(Math.abs(entfernterAnteil - (1 - (Math.PI * 3600) / 40000)) < 0.01, `entfernter Anteil ${entfernterAnteil}`);

  // Jedes sichtbare Pixel muss (fast) schwarz sein: kein weißer/grauer Saum aus der Mischfarbe.
  let hell = 0;
  let sichtbar = 0;
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3]! > 0) {
      sichtbar++;
      if (Math.max(rgba[i * 4]!, rgba[i * 4 + 1]!, rgba[i * 4 + 2]!) > 40) hell++;
    }
  }
  assert.ok(sichtbar > 11000, `zu wenig sichtbar: ${sichtbar}`);
  assert.equal(hell, 0, `${hell} Pixel mit hellem Saum`);
});

test('Kantenpixel bekommen einen Deckungsgrad passend zur Mischung (weiche Kante statt Treppe)', () => {
  const w = 120;
  const h = 120;
  const bild = rendere(w, h, WEISS, kreis(60, 60, 40, ROT));
  const { rgba } = freistelle(bild, w, h);
  let teil = 0;
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3]!;
    if (a > 10 && a < 245) teil++;
  }
  // Eine glatte Kreiskante hat rund 2·π·40 ≈ 250 Randpixel, die meisten davon teildeckend.
  assert.ok(teil > 120, `zu wenige weiche Kantenpixel: ${teil}`);
  // Die Farbe der Kantenpixel ist die Motivfarbe, nicht Rosa.
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3]!;
    if (a > 10 && a < 245) {
      assert.ok(Math.abs(rgba[i * 4]! - 200) <= 12 && Math.abs(rgba[i * 4 + 1]! - 30) <= 12, `Kantenfarbe ${rgba[i * 4]},${rgba[i * 4 + 1]},${rgba[i * 4 + 2]}`);
    }
  }
});

test('JPEG-ähnliches Rauschen: Hintergrund vollständig weg, Motiv vollständig da, keine Einzelpunkte', () => {
  const w = 240;
  const h = 160;
  const motiv = (x: number, y: number) => (x > 50 && x < 190 && y > 40 && y < 120 ? ROT : null);
  const bild = rendere(w, h, WEISS, motiv, 6, 7);
  const { rgba } = freistelle(bild, w, h);

  let hintergrundSichtbar = 0;
  let motivWeg = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const innen = x >= 53 && x <= 187 && y >= 43 && y <= 117;
      const aussen = x < 47 || x > 193 || y < 37 || y > 123;
      const a = alphaAn(rgba, w, x, y);
      if (aussen && a > 0) hintergrundSichtbar++;
      if (innen && a < 255) motivWeg++;
    }
  }
  assert.equal(hintergrundSichtbar, 0, `${hintergrundSichtbar} Hintergrundpixel noch sichtbar`);
  assert.equal(motivWeg, 0, `${motivWeg} Motivpixel fälschlich entfernt`);
});

test('helles Motiv (hellgelb auf Weiß) wird NICHT aufgefressen – der Hintergrund kriecht nicht über weiche Kanten', () => {
  const w = 160;
  const h = 160;
  const HELLGELB: Farbe = [255, 240, 150];
  const bild = rendere(w, h, WEISS, kreis(80, 80, 50, HELLGELB), 3, 3);
  const { rgba } = freistelle(bild, w, h);
  assert.equal(alphaAn(rgba, w, 80, 80), 255, 'Mitte bleibt');
  assert.equal(alphaAn(rgba, w, 60, 80), 255);
  assert.equal(alphaAn(rgba, w, 3, 3), 0);
});

test('Logo mit weicher Verlaufskante (hochgerechnet): Hintergrund kriecht nicht hinein', () => {
  const w = 200;
  const h = 200;
  // Kreis mit 6 Pixel breitem, sanftem Rand wie nach einem Hochrechnen.
  const bild = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - 100, y + 0.5 - 100);
      const t = Math.min(1, Math.max(0, (60 - d) / 6 + 0.5)); // 1 innen, 0 außen, 6 px Übergang
      const o = (y * w + x) * 4;
      bild[o] = 255 * (1 - t) + 20 * t;
      bild[o + 1] = 255 * (1 - t) + 60 * t;
      bild[o + 2] = 255 * (1 - t) + 160 * t;
      bild[o + 3] = 255;
    }
  }
  const { rgba, entfernterAnteil } = freistelle(bild, w, h, { hochskaliertFaktor: 3 });
  assert.equal(alphaAn(rgba, w, 100, 100), 255);
  assert.equal(alphaAn(rgba, w, 100, 55), 255, 'Motivinneres knapp unter dem Rand bleibt voll');
  assert.ok(entfernterAnteil > 0.6 && entfernterAnteil < 0.78, `entfernter Anteil ${entfernterAnteil}`);
});

test('Motiv am Bildrand angeschnitten: der angeschnittene Teil bleibt', () => {
  const w = 160;
  const h = 100;
  // Balken, der die ganze linke Kante berührt.
  const bild = rendere(w, h, WEISS, (x, y) => (x < 40 && y > 20 && y < 80 ? SCHWARZ : null));
  const { rgba } = freistelle(bild, w, h);
  assert.equal(alphaAn(rgba, w, 0, 50), 255, 'Randpixel des Motivs bleibt sichtbar');
  assert.equal(alphaAn(rgba, w, 20, 50), 255);
  assert.equal(alphaAn(rgba, w, 120, 50), 0);
  assert.equal(alphaAn(rgba, w, 0, 5), 0);
});

test('Hintergrund mit sanftem Verlauf (Vignette, 255 → 232): wird entfernt, Motiv bleibt', () => {
  const w = 240;
  const h = 180;
  const verlauf = (x: number, y: number): Farbe => {
    const v = 255 - 23 * (Math.hypot(x - 120, y - 90) / Math.hypot(120, 90));
    return [v, v, v];
  };
  const bild = rendere(w, h, verlauf, kreis(120, 90, 45, [30, 90, 40]), 2, 11);
  const { rgba } = freistelle(bild, w, h);
  assert.equal(alphaAn(rgba, w, 4, 4), 0);
  assert.equal(alphaAn(rgba, w, w - 5, h - 5), 0);
  assert.equal(alphaAn(rgba, w, 120, 90), 255);
  let rest = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.hypot(x - 120, y - 90) > 52 && alphaAn(rgba, w, x, y) > 0) rest++;
  assert.ok(rest < 40, `${rest} Hintergrundpixel mit Verlauf blieben stehen`);
});

test('farbiger einfarbiger Hintergrund (Blau): wird wie Weiß behandelt', () => {
  const w = 160;
  const h = 160;
  const bild = rendere(w, h, [20, 60, 180], kreis(80, 80, 50, [250, 200, 0]), 2, 5);
  const { rgba } = freistelle(bild, w, h);
  assert.equal(alphaAn(rgba, w, 3, 3), 0);
  assert.equal(alphaAn(rgba, w, 80, 80), 255);
});

test('weißer Text im farbigen Kasten bleibt weiß (eingeschlossene Flächen gehören zum Motiv)', () => {
  const w = 200;
  const h = 120;
  const kasten = (x: number, y: number): Farbe | null => {
    if (x < 20 || x > 180 || y < 20 || y > 100) return null;
    // weißer Balken im Kasten
    if (x > 60 && x < 140 && y > 50 && y < 70) return WEISS;
    return ROT;
  };
  const bild = rendere(w, h, WEISS, kasten);
  const { rgba } = freistelle(bild, w, h);
  assert.equal(alphaAn(rgba, w, 100, 60), 255, 'weißer Balken im Kasten bleibt deckend');
  assert.equal(alphaAn(rgba, w, 100, 60) === 255 && rgba[(60 * w + 100) * 4] === 255, true, 'und bleibt weiß');
  assert.equal(alphaAn(rgba, w, 5, 5), 0);
});

test('dünne Linie bleibt erhalten', () => {
  const w = 160;
  const h = 100;
  const bild = rendere(w, h, WEISS, (x, y) => (y > 49.5 && y < 51 && x > 20 && x < 140 ? SCHWARZ : null));
  const { rgba } = freistelle(bild, w, h);
  let sichtbar = 0;
  for (let x = 30; x < 130; x++) if (alphaAn(rgba, w, x, 49) > 0 || alphaAn(rgba, w, x, 50) > 0) sichtbar++;
  assert.ok(sichtbar >= 95, `dünne Linie lückenhaft: ${sichtbar}/100`);
});

test('einzelne Rauschpunkte im Hintergrund werden entfernt, ein kräftiger kleiner Punkt (i-Punkt) bleibt', () => {
  const w = 200;
  const h = 200;
  const bild = rendere(w, h, WEISS, kreis(100, 100, 40, SCHWARZ));
  // Einzelne etwas dunklere Pixel im Weiß (Kompressionsflimmern).
  for (const [x, y] of [[20, 30], [150, 20], [30, 170], [170, 160]] as const) {
    const o = (y * w + x) * 4;
    bild[o] = bild[o + 1] = bild[o + 2] = 215;
  }
  // Ein kleiner kräftiger Punkt, 6×6 schwarz, deutlich außerhalb des Kreises.
  for (let y = 10; y < 16; y++) for (let x = 100; x < 106; x++) {
    const o = (y * w + x) * 4;
    bild[o] = bild[o + 1] = bild[o + 2] = 0;
  }
  const { rgba } = freistelle(bild, w, h);
  for (const [x, y] of [[20, 30], [150, 20], [30, 170], [170, 160]] as const) assert.equal(alphaAn(rgba, w, x, y), 0, `Rauschpunkt ${x},${y}`);
  assert.equal(alphaAn(rgba, w, 102, 12), 255, 'kräftiger Punkt bleibt');
});

test('Foto-artiger Hintergrund (Rauschen/Muster am Rand) wird abgelehnt statt zerstört', () => {
  const w = 160;
  const h = 120;
  const rnd = zufall(99);
  const bild = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    bild[i * 4] = rnd() * 255;
    bild[i * 4 + 1] = rnd() * 255;
    bild[i * 4 + 2] = rnd() * 255;
    bild[i * 4 + 3] = 255;
  }
  assert.throws(() => freistelle(bild, w, h), (e: unknown) => e instanceof HintergrundNichtEinfarbig && e.grund === 'nicht-einfarbig');
});

test('Motiv füllt das ganze Bild: kein Hintergrund gefunden → abgelehnt', () => {
  const w = 100;
  const h = 100;
  const bild = rendere(w, h, WEISS, () => ROT);
  assert.throws(() => freistelle(bild, w, h), (e: unknown) => e instanceof HintergrundNichtEinfarbig);
});

test('Bild mit vorhandener Transparenz wird unverändert zurückgegeben', () => {
  const w = 100;
  const h = 100;
  const bild = rendere(w, h, WEISS, kreis(50, 50, 30, ROT));
  for (let i = 0; i < w * h; i++) {
    const x = i % w;
    const y = (i - x) / w;
    if (Math.hypot(x - 50, y - 50) > 30) bild[i * 4 + 3] = 0;
  }
  const { rgba, schonFrei, entfernterAnteil } = freistelle(bild, w, h);
  assert.equal(schonFrei, true);
  assert.equal(entfernterAnteil, 0);
  assert.deepEqual(Array.from(rgba), Array.from(bild));
});

test('Eingabe bleibt unverändert, Ergebnis ist ein neues Feld', () => {
  const w = 80;
  const h = 80;
  const bild = rendere(w, h, WEISS, kreis(40, 40, 20, SCHWARZ));
  const kopie = Uint8ClampedArray.from(bild);
  const { rgba } = freistelle(bild, w, h);
  assert.deepEqual(Array.from(bild), Array.from(kopie));
  assert.notEqual(rgba, bild);
});

test('großes Bild (2.000 × 1.500) in annehmbarer Zeit', () => {
  const w = 2000;
  const h = 1500;
  const bild = rendere(w, h, WEISS, kreis(1000, 750, 500, [30, 60, 160]), 2, 5);
  const start = Date.now();
  const { rgba } = freistelle(bild, w, h);
  const dauer = Date.now() - start;
  assert.equal(alphaAn(rgba, w, 5, 5), 0);
  assert.equal(alphaAn(rgba, w, 1000, 750), 255);
  assert.ok(dauer < 8000, `zu langsam: ${dauer} ms`);
});
