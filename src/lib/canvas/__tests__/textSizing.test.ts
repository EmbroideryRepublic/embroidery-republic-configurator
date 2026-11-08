/**
 * Maße eines Textes in Zentimetern (lib/canvas/textSizing.ts).
 *
 * Anlass: Die Box eines Textes wurde mit einem Näherungsmaßstab (Prozente der
 * ganzen Leinwand) in Zentimeter umgerechnet, der Konfigurator zeichnet die
 * Fläche aber im Maßstab des Produktfotos. Je nach Foto-Format wich das um bis
 * zu −20 % / +18 % ab – "20,9 × 11,4 cm" passte nicht zu dem, was die Lineale
 * zeigten. Mit dem tatsächlichen Maßstab als Parameter stimmt es.
 *
 * Im Test gibt es keinen Browser: measureTextPx liefert dort die serverseitige
 * Ersatzmessung (0,6 × Schriftgröße je Zeichen, 1,3 × Schriftgröße Höhe) – genau
 * deshalb ist die Umrechnung selbst exakt prüfbar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTextBoxCm, gleicheTextBoxAn } from '../textSizing';
import { getScaleFactors } from '../cmConversion';
import { getContainRect, computeAreaPx } from '../containRect';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products/index';
import type { PrintArea } from '@/types';

const FLAECHE = {
  id: 'x',
  productId: 'p',
  view: 'back',
  xPercent: 31.4,
  yPercent: 26.7,
  widthPercent: 37.3,
  heightPercent: 54.3,
  maxWidthCm: 30,
  maxHeightCm: 50,
  seamMarginCm: 1,
  boxWidthCm: 30,
  boxHeightCm: 50.6,
} as PrintArea;

test('Mit dem tatsächlichen Maßstab wird exakt durch ihn geteilt', () => {
  // "Hallo" bei 50 px: Ersatzmessung 5 × 50 × 0,6 = 150 px breit, 50 × 1,3 = 65 px hoch.
  const box = computeTextBoxCm('Hallo', 'Arial', 50, false, false, FLAECHE, 10);
  assert.equal(box.widthCm, 15);
  assert.equal(box.heightCm, 6.5);
});

test('Der tatsächliche Maßstab ist der der gezeichneten Fläche – nicht der Leinwand', () => {
  // Foto 620 × 720: Es wird auf die Leinwandbreite skaliert (700 px), die Fläche misst
  // dann 54,3 % der Fotohöhe. Der Leinwand-Näherungswert nimmt stattdessen 54,3 % der
  // LEINWAND-Höhe (840 px) – das sind 3,3 % mehr Pixel je cm, die Box wird zu klein gemeldet.
  const foto = getContainRect(620, 720, CANVAS_WIDTH, CANVAS_HEIGHT, FLAECHE.heightPercent / 100);
  const gezeichnet = getScaleFactors(computeAreaPx(foto, FLAECHE), FLAECHE).pxPerCmX;
  const naeherung = ((FLAECHE.heightPercent / 100) * CANVAS_HEIGHT) / FLAECHE.boxHeightCm;
  assert.ok(naeherung > gezeichnet, 'Näherung ist größer als der gezeichnete Maßstab');

  const richtig = computeTextBoxCm('Team Schüplitz', 'Impact', 48, true, true, FLAECHE, gezeichnet);
  const alt = computeTextBoxCm('Team Schüplitz', 'Impact', 48, true, true, FLAECHE);
  assert.ok(richtig.widthCm > alt.widthCm, 'mit dem echten Maßstab ist derselbe Text breiter in cm');
  assert.ok(Math.abs(richtig.widthCm / alt.widthCm - naeherung / gezeichnet) < 1e-9, 'Verhältnis = Maßstabsverhältnis');
});

test('Ohne Angabe gilt unverändert die bisherige Näherung (nichts anderes bricht)', () => {
  const ohne = computeTextBoxCm('Hallo', 'Arial', 50, false, false, FLAECHE);
  const naeherung = ((FLAECHE.heightPercent / 100) * CANVAS_HEIGHT) / FLAECHE.boxHeightCm;
  assert.ok(Math.abs(ohne.widthCm - 150 / naeherung) < 1e-9);
  // Unbrauchbare Maßstäbe fallen auf dieselbe Näherung zurück statt Unsinn zu liefern.
  for (const kaputt of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(computeTextBoxCm('Hallo', 'Arial', 50, false, false, FLAECHE, kaputt), ohne);
  }
});

// ── Angleichen der gespeicherten Box (gleicheTextBoxAn) ───────────────────
// Im Test gilt die Ersatzmessung: 0,6 × Schriftgröße je Zeichen breit, 1,3 × Schriftgröße hoch.


function text(ueberschreibe: Partial<Parameters<typeof gleicheTextBoxAn>[0]> = {}) {
  return { content: 'Hallo', fontFamily: 'Arial', fontSizePx: 50, bold: false, italic: false, widthCm: 15, heightCm: 6.5, ...ueberschreibe };
}

test('Stimmt die gespeicherte Box schon, ist nichts zu tun', () => {
  // "Hallo" bei 50 px: 150 × 65 px → bei 10 px/cm genau 15 × 6,5 cm.
  assert.equal(gleicheTextBoxAn(text(), FLAECHE, 10), null);
});

test('Bei anderem Maßstab ändern sich nur die Maße, nicht die Schrift', () => {
  const neu = gleicheTextBoxAn(text(), FLAECHE, 8)!;
  assert.equal(neu.fontSizePx, 50);
  assert.equal(neu.widthCm, 18.75);
  assert.equal(neu.heightCm, 8.125);
});

test('Die Größenregel bleibt: Passte der Text bisher in die Maximalgröße und tut es mit den echten Maßen nicht mehr, wird die Schrift wie gewohnt verkleinert', () => {
  // 100 Zeichen bei 10 px = 600 px. Bisher gemeldet bei 20 px/cm: 30 cm (genau die Maximalbreite).
  // Mit dem echten Maßstab 18 px/cm sind es 33,3 cm – zu breit, die Bestellung würde am Ende scheitern.
  const gespeichert = text({ content: 'x'.repeat(100), fontSizePx: 10, widthCm: 30, heightCm: 0.65 });
  const neu = gleicheTextBoxAn(gespeichert, FLAECHE, 18)!;
  assert.ok(neu.fontSizePx < 10, `Schrift ${neu.fontSizePx}`);
  assert.ok(Math.abs(neu.fontSizePx - 10 * (30 / (600 / 18)) * 0.98) < 1e-9, '2 % Puffer wie im Editor');
  assert.ok(neu.widthCm <= FLAECHE.maxWidthCm, `neue Breite ${neu.widthCm}`);
  // Ein zweiter Durchgang mit dem Ergebnis findet nichts mehr zu tun (keine Endlosschleife):
  assert.equal(gleicheTextBoxAn(text({ content: 'x'.repeat(100), fontSizePx: neu.fontSizePx, widthCm: neu.widthCm, heightCm: neu.heightCm }), FLAECHE, 18), null);
});

test('Was bewusst über die Maximalgröße hinaus gezogen wurde, wird nicht zurückgenommen – wie bisher entscheidet die Bestellprüfung', () => {
  const gezogen = text({ content: 'x'.repeat(100), fontSizePx: 10, widthCm: 40, heightCm: 0.65 }); // schon größer als die 30 cm
  const neu = gleicheTextBoxAn(gezogen, FLAECHE, 18)!;
  assert.equal(neu.fontSizePx, 10, 'Schrift bleibt');
  assert.ok(neu.widthCm > FLAECHE.maxWidthCm, 'bleibt über der Maximalgröße');
});

test('Wird die Box mit den echten Maßen kleiner, bleibt die Schrift; es wird nichts vergrößert', () => {
  const neu = gleicheTextBoxAn(text({ content: 'x'.repeat(100), fontSizePx: 10, widthCm: 30, heightCm: 0.65 }), FLAECHE, 25)!;
  assert.equal(neu.fontSizePx, 10);
  assert.equal(neu.widthCm, 24);
});
