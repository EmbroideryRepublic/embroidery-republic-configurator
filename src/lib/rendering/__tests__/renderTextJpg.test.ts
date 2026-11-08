/**
 * Text als JPG (Admin-Download) – mit dem ECHTEN Renderer, echten Schriften
 * und dem echten Produktfoto; nur das JPG wird zur Prüfung wieder dekodiert.
 *
 * Gesichert wird, was dem Betreiber zugesagt ist: zwei Zeilen im Editor sind
 * zwei Zeilen in der Datei; die Datei hat Druckgröße bei 300 dpi (und trägt
 * das im Kopf); der Text ist eng zugeschnitten und nirgends abgeschnitten;
 * helle Schrift verschwindet nicht auf weißem Grund.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decode } from 'jpeg-js';
import { getProduct } from '@/config/products/index';
import { ladeAnsichtGrundlage } from '../ansichtGrundlage';
import { renderTextAlsJpg, waehleHintergrund, TEXT_JPG_DPI, type TextJpgDatei, type TextJpgEingabe } from '../renderTextJpg';
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
  return {
    productId: PRODUKT_ID,
    colorId: FARBE_ID,
    view: 'back',
    printMethod: 'dtf',
    sizeQuantities: { M: 2 },
    element,
    ...mehr,
  };
}

async function datei(element: RenderableTextElement, mehr: Partial<TextJpgEingabe> = {}): Promise<TextJpgDatei> {
  const ergebnis = await renderTextAlsJpg(eingabe(element, mehr));
  assert.ok(ergebnis.ok, ergebnis.ok ? '' : ergebnis.grund);
  return ergebnis;
}

interface Bild {
  breite: number;
  hoehe: number;
  daten: Uint8Array;
}

function dekodiere(d: TextJpgDatei): Bild {
  const bild = decode(d.jpg, { useTArray: true });
  assert.equal(bild.width, d.breitePx);
  assert.equal(bild.height, d.hoehePx);
  return { breite: bild.width, hoehe: bild.height, daten: bild.data };
}

function pixel(b: Bild, x: number, y: number): [number, number, number] {
  const i = (y * b.breite + x) * 4;
  return [b.daten[i]!, b.daten[i + 1]!, b.daten[i + 2]!];
}

function weichtAb(a: [number, number, number], b: [number, number, number], schwelle: number): boolean {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) > schwelle;
}

/** Zeilenbereiche (von–bis), in denen etwas vom Hintergrund Abweichendes liegt. */
function tintenBaender(b: Bild, grund: [number, number, number]): [number, number][] {
  const baender: [number, number][] = [];
  let anfang = -1;
  for (let y = 0; y < b.hoehe; y++) {
    let tinte = false;
    for (let x = 0; x < b.breite && !tinte; x += 2) tinte = weichtAb(pixel(b, x, y), grund, 60);
    if (tinte && anfang < 0) anfang = y;
    if (!tinte && anfang >= 0) {
      baender.push([anfang, y - 1]);
      anfang = -1;
    }
  }
  if (anfang >= 0) baender.push([anfang, b.hoehe - 1]);
  return baender;
}

/** Ganz außen (2 Pixel) darf nur Hintergrund liegen – sonst wurde etwas abgeschnitten. */
function randIstFrei(b: Bild, grund: [number, number, number]): void {
  for (let x = 0; x < b.breite; x++) {
    for (const y of [0, 1, b.hoehe - 2, b.hoehe - 1]) assert.ok(!weichtAb(pixel(b, x, y), grund, 14), `oberer/unterer Rand bei x=${x}, y=${y}`);
  }
  for (let y = 0; y < b.hoehe; y++) {
    for (const x of [0, 1, b.breite - 2, b.breite - 1]) assert.ok(!weichtAb(pixel(b, x, y), grund, 14), `linker/rechter Rand bei x=${x}, y=${y}`);
  }
}

const WEISS: [number, number, number] = [255, 255, 255];

// ── Der Anlass: zwei Zeilen ──────────────────────────────────────────────

test('Zwei Zeilen im Text sind zwei getrennte Zeilen in der Datei', async () => {
  const d = await datei(text());
  assert.equal(d.zeilen, 2);
  const baender = tintenBaender(dekodiere(d), WEISS);
  assert.equal(baender.length, 2, `erwartet zwei Textzeilen, gefunden: ${JSON.stringify(baender)}`);
});

test('Derselbe Text in einer Zeile ist breiter und etwa halb so hoch', async () => {
  const zwei = await datei(text());
  const eine = await datei(text({ content: 'Team Schüplitz' }));
  assert.equal(eine.zeilen, 1);
  assert.equal(tintenBaender(dekodiere(eine), WEISS).length, 1);
  assert.ok(eine.breitePx > zwei.breitePx * 1.4, 'eine Zeile ist deutlich breiter als der Zeilenblock');
  const verhaeltnis = zwei.hoehePx / eine.hoehePx;
  assert.ok(verhaeltnis > 1.6 && verhaeltnis < 2.4, `Höhenverhältnis ${verhaeltnis.toFixed(2)}`);
});

// ── Größe, Auflösung, Kopfdaten ──────────────────────────────────────────

test('Die Datei trägt 300 dpi im JFIF-Kopf und ihre Druckgröße passt dazu', async () => {
  const d = await datei(text());
  assert.equal(d.dpi, TEXT_JPG_DPI);
  assert.equal(d.jpg[0], 0xff);
  assert.equal(d.jpg[1], 0xd8, 'JPEG-Anfangsmarke');
  assert.equal(d.jpg.toString('latin1', 6, 10), 'JFIF');
  assert.equal(d.jpg[13], 1, 'Einheit: Punkte je Zoll');
  assert.equal(d.jpg.readUInt16BE(14), 300);
  assert.equal(d.jpg.readUInt16BE(16), 300);
  assert.ok(Math.abs(d.breiteCm - (d.breitePx / 300) * 2.54) < 1e-9);
});

test('Maßstab wie in der Produktionsvorschau: die Schrifthöhe entspricht fontSizePx in Druckgröße', async () => {
  // "HHH" in Arial (Arimo): Versalhöhe 0,716 em, keine Unterlängen → die Tintenhöhe
  // ist 0,716 × Schriftgröße. Erwartet wird sie aus demselben Maßstab (Pixel je cm)
  // wie in renderPrintView – nicht aus einer eigenen Rechnung des Downloads.
  const element = text({ content: 'HHH', fontFamily: 'Arial', bold: false, italic: false, fontSizePx: 48 });
  const d = await datei(element);
  const grundlage = await ladeAnsichtGrundlage(eingabe(element));
  assert.ok(grundlage);
  const pxProLogisch = TEXT_JPG_DPI / 2.54 / grundlage.pxPerCmLogisch;
  const erwarteteHoehe = 0.716 * 48 * pxProLogisch;

  const baender = tintenBaender(dekodiere(d), WEISS);
  assert.equal(baender.length, 1);
  const tintenHoehe = baender[0]![1] - baender[0]![0] + 1;
  assert.ok(
    Math.abs(tintenHoehe - erwarteteHoehe) / erwarteteHoehe < 0.04,
    `Tintenhöhe ${tintenHoehe}px, erwartet ${erwarteteHoehe.toFixed(0)}px`
  );
});

test('Zugeschnitten mit schmalem Rand: Rand ≈ 0,25 cm, nichts abgeschnitten', async () => {
  const d = await datei(text());
  const b = dekodiere(d);
  randIstFrei(b, WEISS);
  const baender = tintenBaender(b, WEISS);
  const randOben = baender[0]![0];
  const randUnten = b.hoehe - 1 - baender[baender.length - 1]![1];
  // 0,25 cm bei 300 dpi ≈ 30 Pixel; die Suchrasterung rundet höchstens einige Pixel zu.
  const sollPx = (0.25 / 2.54) * 300;
  for (const rand of [randOben, randUnten]) {
    assert.ok(rand >= sollPx * 0.85 && rand <= sollPx * 1.5, `Rand ${rand}px, erwartet etwa ${sollPx.toFixed(0)}px`);
  }
});

test('Die Textfarbe stimmt (grau #5c5c5c) und der Hintergrund ist weiß', async () => {
  const d = await datei(text());
  const b = dekodiere(d);
  assert.equal(d.hintergrund, 'weiss');
  assert.ok(!weichtAb(pixel(b, 3, 3), WEISS, 6), 'Ecke ist weiß');
  let treffer = 0;
  for (let y = 0; y < b.hoehe; y += 3) {
    for (let x = 0; x < b.breite; x += 3) if (!weichtAb(pixel(b, x, y), [92, 92, 92], 7)) treffer++;
  }
  assert.ok(treffer > 5000, `Schriftfarbe kommt vor (${treffer} Stichproben)`);
});

// ── Hintergrund bei heller Schrift ───────────────────────────────────────

test('Weiße Schrift ohne Kontur bekommt dunklen Grund und bleibt sichtbar', async () => {
  const d = await datei(text({ color: '#ffffff' }));
  assert.equal(d.hintergrund, 'dunkel');
  const b = dekodiere(d);
  assert.ok(!weichtAb(pixel(b, 3, 3), [51, 51, 51], 6));
  assert.equal(tintenBaender(b, [51, 51, 51]).length, 2);
  randIstFrei(b, [51, 51, 51]);
});

test('Weiße Schrift mit schwarzer Kontur steht auf Weiß', async () => {
  const d = await datei(text({ color: '#ffffff', hasOutline: true, outlineColor: '#000000' }));
  assert.equal(d.hintergrund, 'weiss');
  randIstFrei(dekodiere(d), WEISS);
});

test('waehleHintergrund: nur helle Füllung ohne gut sichtbare Kontur → dunkel', () => {
  const o = { hasOutline: false, outlineColor: '#ffffff' };
  assert.equal(waehleHintergrund({ ...o, color: '#ffffff' }), 'dunkel');
  assert.equal(waehleHintergrund({ ...o, color: '#fff' }), 'dunkel', 'Kurzschreibweise');
  assert.equal(waehleHintergrund({ ...o, color: '#ffee00' }), 'dunkel', 'Gelb ist auf Weiß kaum zu sehen');
  assert.equal(waehleHintergrund({ ...o, color: '#5c5c5c' }), 'weiss');
  assert.equal(waehleHintergrund({ ...o, color: '#cc0000' }), 'weiss');
  assert.equal(waehleHintergrund({ ...o, color: 'red' }), 'weiss', 'unbekannte Schreibweise: lieber Weiß');
  assert.equal(waehleHintergrund({ color: '#ffffff', hasOutline: true, outlineColor: '#000000' }), 'weiss');
  assert.equal(waehleHintergrund({ color: '#ffffff', hasOutline: true, outlineColor: '#eeeeee' }), 'dunkel', 'helle Kontur hilft nicht');
  assert.equal(waehleHintergrund({ color: '#ffffff', hasOutline: false, outlineColor: '#000000' }), 'dunkel', 'ohne Kontur zählt ihre Farbe nicht');
});

// ── Schatten und Kontur: nichts abgeschnitten ────────────────────────────

test('Schatten und Kontur liegen vollständig im Bild', async () => {
  const d = await datei(text({ fontSizePx: 20, color: '#cc0000', hasShadow: true, hasOutline: true, outlineColor: '#003366' }));
  randIstFrei(dekodiere(d), WEISS);
});

// ── Was nicht in die Datei gehört ────────────────────────────────────────

test('Die Drehung aus dem Editor steckt nicht in der Datei: gleiche Bytes mit und ohne', async () => {
  const gerade = await datei(text({ rotationDeg: 0 }));
  const gedreht = await datei(text({ rotationDeg: 33 }));
  assert.ok(gerade.jpg.equals(gedreht.jpg));
});

test('Links-, mittig und rechtsbündig unterscheiden sich in der Zeilenlage, nicht in der Größe', async () => {
  const mitte = await datei(text({ content: 'Kurz\nEine längere Zeile', align: 'center' }));
  const links = await datei(text({ content: 'Kurz\nEine längere Zeile', align: 'left' }));
  const rechts = await datei(text({ content: 'Kurz\nEine längere Zeile', align: 'right' }));
  for (const d of [links, rechts]) {
    // Je nach Ausrichtung bestimmt ein anderer Buchstabe den Rand (Vorder-/Nachbereich der Glyphen) – das sind Pixel, kein anderes Maß.
    assert.ok(Math.abs(d.breitePx - mitte.breitePx) / mitte.breitePx < 0.02, 'dasselbe Zeilenpaket, nur anders ausgerichtet');
    assert.ok(Math.abs(d.hoehePx - mitte.hoehePx) <= 4);
  }
  assert.ok(!links.jpg.equals(rechts.jpg));
  assert.ok(!links.jpg.equals(mitte.jpg));
});

// ── Grenzfälle ───────────────────────────────────────────────────────────

test('Leerer oder nur aus Leerzeichen bestehender Text ergibt keine Datei, sondern eine Erklärung', async () => {
  for (const inhalt of ['', '   ', ' \n  \n ']) {
    const ergebnis = await renderTextAlsJpg(eingabe(text({ content: inhalt })));
    assert.equal(ergebnis.ok, false, JSON.stringify(inhalt));
    if (!ergebnis.ok) assert.match(ergebnis.grund, /nichts Sichtbares/);
  }
});

test('Riesiger Text: die Auflösung sinkt unter die Grenze statt die Datei ins Uferlose wachsen zu lassen', async () => {
  const d = await datei(text({ content: 'Schüplitz Schüplitz', fontSizePx: 120 }), { grenzen: { maxKantePx: 1500, maxPixel: 2_000_000 } });
  assert.ok(d.dpi < TEXT_JPG_DPI, `dpi ${d.dpi}`);
  assert.ok(d.breitePx <= 1500 && d.hoehePx <= 1500, `${d.breitePx}×${d.hoehePx}`);
  assert.equal(d.jpg.readUInt16BE(14), Math.round(d.dpi), 'die tatsächliche Auflösung steht im Kopf');
  randIstFrei(dekodiere(d), WEISS);
});

test('Unbekanntes Produkt ist ein Datenfehler und wird gemeldet, nicht verschluckt', async () => {
  await assert.rejects(() => renderTextAlsJpg(eingabe(text(), { productId: 'gibt-es-nicht' })), /Unbekannte Produkt-ID/);
});
