/**
 * Text als PNG mit transparentem Hintergrund – die Datei für die DTF-Bestellung
 * (lib/rendering/renderTextJpg.ts::renderTextAlsPng).
 *
 * Warum PNG neben JPG: Ein JPG hat immer einen Hintergrund; beim DTF-Transfer
 * würde er mitgedruckt. Gesichert wird deshalb vor allem, dass außerhalb der
 * Schrift wirklich NICHTS steht (Alpha 0), die Schrift selbst deckend und in der
 * richtigen Farbe ist und dass die Datei ihre Druckgröße trägt (pHYs, 300 dpi).
 * Zur Prüfung wird das PNG mit sharp (Entwicklungsabhängigkeit) wieder gelesen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { getProduct } from '@/config/products/index';
import { renderTextAlsJpg, renderTextAlsPng, TEXT_JPG_DPI, type TextJpgEingabe, type TextPngDatei } from '../renderTextJpg';
import type { RenderableTextElement } from '../types';

const PRODUKT_ID = 'justhoods-college-hoodie';
const FARBE_ID = getProduct(PRODUKT_ID)!.colors.find((c) => c.name === 'Grau')!.id;

function text(ueberschreibe: Partial<RenderableTextElement> = {}): RenderableTextElement {
  return {
    type: 'text',
    view: 'back',
    xCm: 4.5,
    yCm: 3.1,
    widthCm: 20.9,
    heightCm: 11.4,
    rotationDeg: 0,
    content: 'Team \nSchüplitz',
    fontFamily: 'Impact',
    fontSizePx: 48,
    color: '#5c5c5c',
    bold: true,
    italic: true,
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    hasShadow: false,
    hasOutline: false,
    outlineColor: '#ffffff',
    ...ueberschreibe,
  };
}

function eingabe(element: RenderableTextElement, mehr: Partial<TextJpgEingabe> = {}): TextJpgEingabe {
  return { productId: PRODUKT_ID, colorId: FARBE_ID, view: 'back', printMethod: 'dtf', sizeQuantities: { M: 2 }, element, ...mehr };
}

async function png(element: RenderableTextElement, mehr: Partial<TextJpgEingabe> = {}): Promise<TextPngDatei> {
  const ergebnis = await renderTextAlsPng(eingabe(element, mehr));
  assert.ok(ergebnis.ok, ergebnis.ok ? '' : ergebnis.grund);
  return ergebnis;
}

async function pixel(datei: TextPngDatei) {
  const { data, info } = await sharp(datei.png).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4, 'RGBA');
  return { data, breite: info.width, hoehe: info.height };
}

/** CRC-32 wie in PNG – unabhängig von der Implementierung im Code. */
function crc32(daten: Buffer): number {
  let c = 0xffffffff;
  for (const b of daten) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

test('Das PNG ist gültig, hat die berichtete Größe und einen Alphakanal', async () => {
  const d = await png(text());
  const meta = await sharp(d.png).metadata();
  assert.equal(meta.format, 'png');
  assert.equal(meta.width, d.breitePx);
  assert.equal(meta.height, d.hoehePx);
  assert.equal(meta.hasAlpha, true);
});

test('Außerhalb der Schrift ist alles transparent – kein Hintergrund, der mitgedruckt würde', async () => {
  const d = await png(text());
  const { data, breite, hoehe } = await pixel(d);
  const alpha = (x: number, y: number) => data[(y * breite + x) * 4 + 3]!;
  // Ecken und Mitte des Randstreifens
  for (const [x, y] of [[0, 0], [breite - 1, 0], [0, hoehe - 1], [breite - 1, hoehe - 1], [Math.floor(breite / 2), 1]] as const) {
    assert.equal(alpha(x, y), 0, `Pixel ${x}/${y} muss durchsichtig sein`);
  }
  // …und der Rand rundum (zwei Pixel) komplett leer
  for (let x = 0; x < breite; x++) for (const y of [0, 1, hoehe - 2, hoehe - 1]) assert.equal(alpha(x, y), 0, `oben/unten x=${x}`);
  for (let y = 0; y < hoehe; y++) for (const x of [0, 1, breite - 2, breite - 1]) assert.equal(alpha(x, y), 0, `links/rechts y=${y}`);
});

test('Die Schrift ist deckend und hat die gewählte Farbe (#5c5c5c)', async () => {
  const d = await png(text());
  const { data, breite, hoehe } = await pixel(d);
  let deckendInFarbe = 0;
  let teildurchsichtig = 0;
  for (let i = 0; i < breite * hoehe; i += 7) {
    const a = data[i * 4 + 3]!;
    if (a === 255 && Math.abs(data[i * 4]! - 92) <= 2 && Math.abs(data[i * 4 + 1]! - 92) <= 2 && Math.abs(data[i * 4 + 2]! - 92) <= 2) deckendInFarbe++;
    if (a > 0 && a < 255) teildurchsichtig++;
  }
  assert.ok(deckendInFarbe > 20_000, `deckende Schriftpixel: ${deckendInFarbe}`);
  assert.ok(teildurchsichtig > 500, 'weiche Kanten bleiben erhalten (Antialiasing)');
});

test('Zwei Zeilen im Text sind zwei getrennte Zeilen im PNG', async () => {
  const d = await png(text());
  const { data, breite, hoehe } = await pixel(d);
  let baender = 0;
  let inTinte = false;
  for (let y = 0; y < hoehe; y++) {
    let tinte = false;
    for (let x = 0; x < breite && !tinte; x += 2) tinte = data[(y * breite + x) * 4 + 3]! > 40;
    if (tinte && !inTinte) baender++;
    inTinte = tinte;
  }
  assert.equal(baender, 2);
});

test('Das PNG trägt die Druckgröße: 300 dpi als pHYs-Block direkt hinter dem Kopf, mit gültiger Prüfsumme', async () => {
  const d = await png(text());
  assert.equal(d.dpi, TEXT_JPG_DPI);
  // Signatur + IHDR-Block (4 Länge + 4 Typ + 13 Daten + 4 CRC) = 33 Bytes, dann pHYs.
  assert.equal(d.png.toString('latin1', 12, 16), 'IHDR');
  assert.equal(d.png.readUInt32BE(33), 9);
  assert.equal(d.png.toString('latin1', 37, 41), 'pHYs');
  const proMeter = Math.round(300 / 0.0254);
  assert.equal(d.png.readUInt32BE(41), proMeter);
  assert.equal(d.png.readUInt32BE(45), proMeter);
  assert.equal(d.png[49], 1, 'Einheit: Meter');
  assert.equal(d.png.readUInt32BE(50), crc32(d.png.subarray(37, 50)), 'CRC über Typ + Daten');
  // …und Grafikprogramme lesen daraus 300 dpi:
  assert.equal((await sharp(d.png).metadata()).density, 300);
  assert.ok(Math.abs(d.breiteCm - (d.breitePx / 300) * 2.54) < 1e-9);
});

test('Der pHYs-Block steht genau einmal im PNG', async () => {
  const d = await png(text());
  const anzahl = (d.png.toString('latin1').match(/pHYs/g) ?? []).length;
  assert.equal(anzahl, 1);
});

test('JPG und PNG derselben Eingabe haben dieselbe Größe und Auflösung (dieselbe Datei, nur anderer Grund)', async () => {
  const jpg = await renderTextAlsJpg(eingabe(text()));
  const bild = await png(text());
  assert.ok(jpg.ok);
  assert.equal(bild.breitePx, jpg.breitePx);
  assert.equal(bild.hoehePx, jpg.hoehePx);
  assert.equal(bild.dpi, jpg.dpi);
});

test('Weiße Schrift bleibt im PNG weiß und durchsichtig drumherum – kein dunkler Ersatzgrund wie beim JPG', async () => {
  const d = await png(text({ color: '#ffffff' }));
  const { data, breite, hoehe } = await pixel(d);
  assert.equal(data[3]!, 0, 'Ecke durchsichtig');
  let weiss = 0;
  for (let i = 0; i < breite * hoehe; i += 7) if (data[i * 4 + 3] === 255 && data[i * 4] === 255 && data[i * 4 + 1] === 255 && data[i * 4 + 2] === 255) weiss++;
  assert.ok(weiss > 20_000, `weiße Schriftpixel: ${weiss}`);
});

test('Schatten und Kontur liegen vollständig im Bild (Rand bleibt durchsichtig)', async () => {
  const d = await png(text({ fontSizePx: 20, color: '#cc0000', hasShadow: true, hasOutline: true, outlineColor: '#003366' }));
  const { data, breite, hoehe } = await pixel(d);
  const maxAlphaRand = Math.max(
    ...Array.from({ length: breite }, (_, x) => Math.max(data[x * 4 + 3]!, data[((hoehe - 1) * breite + x) * 4 + 3]!)),
    ...Array.from({ length: hoehe }, (_, y) => Math.max(data[y * breite * 4 + 3]!, data[(y * breite + breite - 1) * 4 + 3]!))
  );
  assert.ok(maxAlphaRand < 8, `Alpha am äußersten Rand: ${maxAlphaRand}`);
});

test('Leerer Text ergibt kein PNG, sondern eine Erklärung', async () => {
  const ergebnis = await renderTextAlsPng(eingabe(text({ content: '  \n ' })));
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.match(ergebnis.grund, /nichts Sichtbares/);
});
