/**
 * Hochskalieren (lib/upload/hochskalieren.ts): Ergebnis messbar besser als einfaches Vergrößern, Transparenz bleibt sauber,
 * Grenzen für Faktor und Kantenlänge werden eingehalten.
 *
 * Die Qualitätsprobe vergleicht gegen eine bekannte Grundwahrheit: ein hochaufgelöstes synthetisches Logo wird um den Faktor 4
 * verkleinert (wie ein zu kleiner Upload) und wieder vergrößert – je Verfahren: Nearest (grobe Treppen), bilinear (weich) und
 * das Verfahren des Konfigurators. PSNR gegen die Grundwahrheit; höher ist besser.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { hochskaliereRgba, waehleHochskalierung, bestimmeAngebot, MAX_KANTE_PX, MAX_PIXEL, type Rgba } from '../hochskalieren';
import { ZIEL_DPI } from '@/lib/canvas/logoQualitaet';

// Synthetisches Logo in Hochauflösung (Grundwahrheit): Kreis, Ring, Balken, Diagonale, Text-ähnliche Striche; mit Kantenglättung per Supersampling.
function logo(n: number): Rgba {
  const daten = new Uint8ClampedArray(n * n * 4);
  const ss = 3;
  const farbe = (x: number, y: number): [number, number, number, number] => {
    const u = x / n, v = y / n;
    const dx = u - 0.5, dy = v - 0.45;
    const r = Math.hypot(dx, dy);
    if (r < 0.28 && r > 0.2) return [20, 40, 120, 255]; // blauer Ring
    if (r < 0.14) return [200, 30, 30, 255]; // roter Kern
    if (v > 0.8 && v < 0.88 && u > 0.15 && u < 0.85) return [10, 10, 10, 255]; // schwarzer Balken
    if (v > 0.9 && v < 0.93 && u > 0.2 && u < 0.8 && Math.floor(u * 40) % 2 === 0) return [10, 10, 10, 255]; // Strichtext
    if (Math.abs(u - v) < 0.012 && u > 0.05 && u < 0.3) return [0, 120, 60, 255]; // Diagonale
    return [255, 255, 255, 255];
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const c = farbe(x + (sx + 0.5) / ss, y + (sy + 0.5) / ss);
      r += c[0]; g += c[1]; b += c[2];
    }
    const i = (y * n + x) * 4;
    daten[i] = r / (ss * ss); daten[i + 1] = g / (ss * ss); daten[i + 2] = b / (ss * ss); daten[i + 3] = 255;
  }
  return { daten, breite: n, hoehe: n };
}
function runter(q: Rgba, k: number): Rgba {
  const w = q.breite / k, h = q.hoehe / k;
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 4; c++) {
    let s = 0;
    for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) s += q.daten[((y * k + sy) * q.breite + x * k + sx) * 4 + c]!;
    d[(y * w + x) * 4 + c] = s / (k * k);
  }
  return { daten: d, breite: w, hoehe: h };
}
function nearest(q: Rgba, k: number): Rgba {
  const W = q.breite * k, H = q.hoehe * k, d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 4; c++) d[(y * W + x) * 4 + c] = q.daten[((Math.floor(y / k)) * q.breite + Math.floor(x / k)) * 4 + c]!;
  return { daten: d, breite: W, hoehe: H };
}
function bilinear(q: Rgba, k: number): Rgba {
  const W = q.breite * k, H = q.hoehe * k, d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = Math.min(q.breite - 1, Math.max(0, (x + 0.5) / k - 0.5)), sy = Math.min(q.hoehe - 1, Math.max(0, (y + 0.5) / k - 0.5));
    const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(q.breite - 1, x0 + 1), y1 = Math.min(q.hoehe - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
    for (let c = 0; c < 4; c++) {
      const a = q.daten[(y0 * q.breite + x0) * 4 + c]!, b = q.daten[(y0 * q.breite + x1) * 4 + c]!, cc = q.daten[(y1 * q.breite + x0) * 4 + c]!, dd = q.daten[(y1 * q.breite + x1) * 4 + c]!;
      d[(y * W + x) * 4 + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + dd * fx) * fy;
    }
  }
  return { daten: d, breite: W, hoehe: H };
}
function psnr(a: Rgba, b: Rgba): number {
  let s = 0;
  for (let i = 0; i < a.daten.length; i++) if (i % 4 !== 3) { const d = a.daten[i]! - b.daten[i]!; s += d * d; }
  const mse = s / (a.daten.length * 0.75);
  return 10 * Math.log10(255 * 255 / mse);
}
/** Mittlere Kantenstärke (Gradient) – höher = klarere Kanten. */
function kantenstaerke(a: Rgba): number {
  let s = 0, n = 0;
  for (let y = 1; y < a.hoehe - 1; y++) for (let x = 1; x < a.breite - 1; x++) {
    const i = (y * a.breite + x) * 4;
    const gx = a.daten[i + 4]! - a.daten[i - 4]!, gy = a.daten[i + a.breite * 4]! - a.daten[i - a.breite * 4]!;
    s += Math.hypot(gx, gy); n++;
  }
  return s / n;
}


test('Qualitätsprobe: das Verfahren liegt messbar näher an der Grundwahrheit als Nearest und bilinear', async () => {
  const wahr = logo(480);
  const klein = runter(wahr, 4);
  const m = await hochskaliereRgba(klein, 4);
  assert.equal(m.breite, 480);
  assert.equal(m.hoehe, 480);
  const pm = psnr(m, wahr);
  const pn = psnr(nearest(klein, 4), wahr);
  const pb = psnr(bilinear(klein, 4), wahr);
  assert.ok(pm > pn + 1, `PSNR ${pm.toFixed(2)} nicht deutlich über Nearest ${pn.toFixed(2)}`);
  assert.ok(pm > pb + 1, `PSNR ${pm.toFixed(2)} nicht deutlich über bilinear ${pb.toFixed(2)}`);
  // Das Ergebnis sieht anders aus als das Ausgangsbild (nicht bloß dasselbe Bild in größer).
  assert.ok(psnr(m, nearest(klein, 4)) < 40, 'Ergebnis unterscheidet sich kaum von einfachem Vergrößern');
});

test('Kanten bleiben klar: nicht weicher als bilinear, nicht gröber als die Treppenstufen von Nearest übertrieben', async () => {
  const klein = runter(logo(480), 4);
  const m = await hochskaliereRgba(klein, 4);
  assert.ok(kantenstaerke(m) > kantenstaerke(bilinear(klein, 4)), 'Kanten weicher als bilinear');
});

test('Farben bleiben erhalten: mittlere Helligkeit ändert sich um höchstens 2 %', async () => {
  const klein = runter(logo(480), 4);
  const m = await hochskaliereRgba(klein, 4);
  const mittel = (a: Rgba) => {
    let s = 0;
    for (let i = 0; i < a.daten.length; i += 4) s += a.daten[i]! + a.daten[i + 1]! + a.daten[i + 2]!;
    return s / (a.breite * a.hoehe * 3);
  };
  assert.ok(Math.abs(mittel(m) - mittel(klein)) / mittel(klein) < 0.02, `${mittel(klein)} → ${mittel(m)}`);
});

test('einfarbige Fläche bleibt exakt einfarbig (kein Rauschen, kein Überschwingen)', async () => {
  const d = new Uint8ClampedArray(20 * 20 * 4);
  for (let i = 0; i < 400; i++) d.set([37, 99, 200, 255], i * 4);
  const m = await hochskaliereRgba({ daten: d, breite: 20, hoehe: 20 }, 3);
  assert.equal(m.breite, 60);
  for (let i = 0; i < 60 * 60; i++) assert.deepEqual([...m.daten.slice(i * 4, i * 4 + 4)], [37, 99, 200, 255]);
});

test('Transparenz: durchsichtige Fläche bleibt durchsichtig, Ränder haben keine dunklen Säume', async () => {
  // Rote Scheibe auf transparentem Grund.
  const n = 40;
  const d = new Uint8ClampedArray(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const innen = Math.hypot(x - 19.5, y - 19.5) < 12;
    d.set(innen ? [255, 0, 0, 255] : [0, 0, 0, 0], (y * n + x) * 4);
  }
  const m = await hochskaliereRgba({ daten: d, breite: n, hoehe: n }, 4);
  // Ecke: völlig durchsichtig.
  assert.equal(m.daten[3], 0);
  let teilweise = 0;
  for (let i = 0; i < m.breite * m.hoehe; i++) {
    const a = m.daten[i * 4 + 3]!;
    if (a > 128) {
      // Sichtbare Pixel sind Rot – auch am Rand (kein Abdunkeln durch die transparente Nachbarschaft).
      assert.ok(m.daten[i * 4]! > 235 && m.daten[i * 4 + 1]! < 25 && m.daten[i * 4 + 2]! < 25, `Pixel ${i}: ${[...m.daten.slice(i * 4, i * 4 + 4)]}`);
    }
    if (a > 0 && a < 255) teilweise++;
  }
  assert.ok(teilweise > 0, 'keine weiche Kante – die Scheibe wäre ausgefranst');
});

test('keine Überschwinger: rote Fläche mit weißer Form bekommt keinen dunkleren Rand (Wertebereich des Ausgangsbilds bleibt)', async () => {
  // Rot (200, 30, 30) mit weißem Quadrat in der Mitte – Unscharfmaskierung und Bikubik würden sonst unter Rot bzw. über Weiß schwingen.
  const n = 24;
  const d = new Uint8ClampedArray(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const weiss = x >= 8 && x < 16 && y >= 8 && y < 16;
    d.set(weiss ? [255, 255, 255, 255] : [200, 30, 30, 255], (y * n + x) * 4);
  }
  for (const k of [4, 8, 12.7]) {
    const m = await hochskaliereRgba({ daten: d, breite: n, hoehe: n }, k);
    for (let i = 0; i < m.breite * m.hoehe; i++) {
      const [r, g, b] = [m.daten[i * 4]!, m.daten[i * 4 + 1]!, m.daten[i * 4 + 2]!];
      assert.ok(r >= 200 && g >= 30 && b >= 30, `×${k}, Pixel ${i}: ${r},${g},${b} dunkler als das Rot im Ausgangsbild`);
    }
  }
});

test('ungültige Eingaben werden abgelehnt', async () => {
  await assert.rejects(() => hochskaliereRgba({ daten: new Uint8ClampedArray(16), breite: 2, hoehe: 2 }, 0));
  await assert.rejects(() => hochskaliereRgba({ daten: new Uint8ClampedArray(16), breite: 2, hoehe: 2 }, 0.5));
  await assert.rejects(() => hochskaliereRgba({ daten: new Uint8ClampedArray(16), breite: 2, hoehe: 2 }, Number.NaN));
  await assert.rejects(() => hochskaliereRgba({ daten: new Uint8ClampedArray(15), breite: 2, hoehe: 2 }, 2));
});

test('gebrochene Faktoren: Ausgabegröße wird aufgerundet, einfarbige Fläche bleibt einfarbig', async () => {
  const d = new Uint8ClampedArray(7 * 5 * 4);
  for (let i = 0; i < 35; i++) d.set([37, 99, 200, 255], i * 4);
  const m = await hochskaliereRgba({ daten: d, breite: 7, hoehe: 5 }, 2.5);
  assert.equal(m.breite, 18); // 17,5 → 18
  assert.equal(m.hoehe, 13); // 12,5 → 13
  for (let i = 0; i < m.breite * m.hoehe; i++) assert.deepEqual([...m.daten.slice(i * 4, i * 4 + 4)], [37, 99, 200, 255]);
});

test('Qualitätsprobe bei großen Faktoren (×8, ×12): weiterhin besser als Nearest und bilinear', async () => {
  const wahr = logo(480);
  for (const k of [8, 12]) {
    const klein = runter(wahr, k);
    const m = await hochskaliereRgba(klein, k);
    assert.equal(m.breite, 480);
    const pm = psnr(m, wahr);
    assert.ok(pm > psnr(nearest(klein, k), wahr) + 0.5, `×${k}: PSNR ${pm.toFixed(2)} nicht über Nearest`);
    assert.ok(pm > psnr(bilinear(klein, k), wahr) + 0.5, `×${k}: PSNR ${pm.toFixed(2)} nicht über bilinear`);
    assert.ok(kantenstaerke(m) > kantenstaerke(bilinear(klein, k)), `×${k}: Kanten weicher als bilinear`);
  }
});

test('waehleHochskalierung: Ziel 300 dpi, Faktor in Zehnteln, gedeckelt auf 16, Kante und Pixelzahl', () => {
  assert.equal(waehleHochskalierung({ breitePx: 300, hoehePx: 300, dpi: ZIEL_DPI }), null, 'Ziel schon erreicht');
  assert.equal(waehleHochskalierung({ breitePx: 300, hoehePx: 300, dpi: 450 }), null, 'mehr als genug');
  assert.equal(waehleHochskalierung({ breitePx: 300, hoehePx: 300, dpi: 0 }), null);
  assert.equal(waehleHochskalierung({ breitePx: 300, hoehePx: 300, dpi: 290 }), null, 'praktisch erreicht – kein Hochrechnen für 3 %');
  const a = waehleHochskalierung({ breitePx: 300, hoehePx: 200, dpi: 100 })!; // 300/100 → 3
  assert.equal(a.faktor, 3);
  assert.equal(a.neueBreitePx, 900);
  assert.equal(a.neueHoehePx, 600);
  assert.equal(a.erreichteDpi, 300);
  // Gebrochen und aufgerundet: 78 dpi → 3,846 → ×3,9 → mindestens 300 dpi.
  const b = waehleHochskalierung({ breitePx: 459, hoehePx: 315, dpi: 78 })!;
  assert.equal(b.faktor, 3.9);
  assert.ok(b.erreichteDpi >= 300, `${b.erreichteDpi}`);
  assert.equal(b.neueBreitePx, Math.ceil(459 * 3.9 - 1e-6));
  // 24 dpi (kleines Logo auf 15 cm): ×12,5 – früher bei ×4 (96 dpi) gedeckelt.
  const c = waehleHochskalierung({ breitePx: 140, hoehePx: 95, dpi: 24 })!;
  assert.equal(c.faktor, 12.5);
  assert.ok(c.erreichteDpi >= 300);
  // Aus 234 dpi wird ×1,3 (nicht ×2).
  assert.equal(waehleHochskalierung({ breitePx: 1377, hoehePx: 945, dpi: 234 })!.faktor, 1.3);
  assert.equal(waehleHochskalierung({ breitePx: 100, hoehePx: 100, dpi: 10 })!.faktor, 16, 'höchstens 16×');
  assert.ok(waehleHochskalierung({ breitePx: 100, hoehePx: 100, dpi: 10 })!.erreichteDpi < ZIEL_DPI, 'der erreichte Wert wird ehrlich genannt');
  // Grenzen: bei 60 dpi bräuchte 1200×800 px ×5 = 6000×4000 → zurück, bis Kante ≤ 5000 px und Pixelzahl ≤ 12 Mio. stimmen.
  const d = waehleHochskalierung({ breitePx: 1200, hoehePx: 800, dpi: 60 })!;
  assert.ok(Math.max(d.neueBreitePx, d.neueHoehePx) <= MAX_KANTE_PX);
  assert.ok(d.neueBreitePx * d.neueHoehePx <= MAX_PIXEL);
  assert.ok(d.faktor < 5 && d.faktor >= 3, `${d.faktor}`); // hier greift die Pixelgrenze (12 Mio.) zuerst: ×3,5
  // Pixelgrenze: 3000 × 2500 px auf ×1,6 wären 4800×4000 = 19,2 Mio. → zurück, bis es unter 12 Mio. liegt.
  const e = waehleHochskalierung({ breitePx: 3000, hoehePx: 2500, dpi: 187 })!;
  assert.ok(e.neueBreitePx * e.neueHoehePx <= MAX_PIXEL, `${e.neueBreitePx}×${e.neueHoehePx}`);
  // Zu groß schon für den kleinsten sinnvollen Faktor → nicht anbieten.
  assert.equal(waehleHochskalierung({ breitePx: 4900, hoehePx: 3000, dpi: 100 }), null);
});

test('bestimmeAngebot: Angebot auch im grünen Bereich (220–273 dpi), nicht darüber', () => {
  // 1400 px auf 15 cm = 237 dpi (Ampel grün) → trotzdem Angebot ×1,3 auf ≥ 300 dpi.
  const a = bestimmeAngebot({ breitePx: 1400, hoehePx: 950, widthCm: 15 })!;
  assert.equal(a.faktor, 1.3);
  assert.ok(a.erreichteDpi >= 300);
  // 1700 px auf 15 cm = 288 dpi → praktisch erreicht.
  assert.equal(bestimmeAngebot({ breitePx: 1700, hoehePx: 1100, widthCm: 15 }), null);
  // 2000 px auf 15 cm = 339 dpi → nichts zu tun.
  assert.equal(bestimmeAngebot({ breitePx: 2000, hoehePx: 1300, widthCm: 15 }), null);
});

test('bestimmeAngebot: schon hochgerechnetes Logo – neues Angebot nur vom Ausgangsbild aus und nur mit größerem Faktor', () => {
  // Ausgangsbild 140×95 px, auf 15 cm hochgerechnet mit ×12,7 → 1778 px = 301 dpi.
  const basis = { breitePx: 1778, hoehePx: 1207, hochskaliertFaktor: 12.7, vorher: { breitePx: 140, hoehePx: 95 } };
  assert.equal(bestimmeAngebot({ ...basis, widthCm: 15 }), null, 'Größe unverändert → nichts Neues');
  assert.equal(bestimmeAngebot({ ...basis, widthCm: 10 }), null, 'kleiner gezogen → mehr dpi, nichts nötig');
  // Auf 20 cm gezogen: 1778 px = 226 dpi; vom Ausgangsbild aus braucht es ×16,9 → gedeckelt auf ×16 (> 12,7) → Angebot.
  const gross = bestimmeAngebot({ ...basis, widthCm: 20 })!;
  assert.equal(gross.faktor, 16);
  assert.equal(gross.neueBreitePx, 140 * 16, 'vom Ausgangsbild aus gerechnet, nicht ×16 auf das schon hochgerechnete');
  assert.ok(gross.erreichteDpi < ZIEL_DPI, 'der verfehlte Zielwert wird ehrlich genannt');
  // Ohne gemerktes Ausgangsbild (Seite neu geladen): kein Angebot für ein hochgerechnetes Logo.
  assert.equal(bestimmeAngebot({ breitePx: 1778, hoehePx: 1207, hochskaliertFaktor: 12.7, widthCm: 20 }), null);
});
