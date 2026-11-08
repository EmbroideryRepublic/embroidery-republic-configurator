/**
 * Aufbau der Text-Szene für Produktionsvorschau und Text-Download.
 *
 * Anlass (Bestellung ER-2026-F5EE03): Ein Text mit Zeilenumbruch ("Team " ⏎
 * "Schüplitz") stand in Vorschau und Produktionsblatt auf EINER Zeile, weil
 * ein einzelnes SVG-<text> den Umbruch wie ein Leerzeichen behandelt. Dazu
 * ging "kursiv" bei Impact verloren (Ersatzschrift Anton hat keinen Kursiv-
 * Schnitt). Gesichert wird beides – und dass einzeiliger Text unverändert bleibt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTextOnlySvg, renderTextElement, zerlegeInZeilen } from '../svgScene';
import { hatEchtenSchnitt } from '../fonts';
import type { RenderableTextElement } from '../types';

function text(ueberschreibe: Partial<RenderableTextElement> = {}): RenderableTextElement {
  return {
    type: 'text',
    view: 'back',
    xCm: 0,
    yCm: 0,
    widthCm: 10,
    heightCm: 5,
    rotationDeg: 0,
    content: 'Hallo',
    fontFamily: 'Arial',
    fontSizePx: 40,
    color: '#000000',
    bold: false,
    italic: false,
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    hasShadow: false,
    hasOutline: false,
    outlineColor: '#ffffff',
    ...ueberschreibe,
  };
}

/** Box 300 × 100 bei (100, 200) → Mitte (250, 250). */
const BOX = { x: 100, y: 200, width: 300, height: 100 };

function textElemente(svg: string): string[] {
  return svg.match(/<text [^>]*>[^<]*<\/text>/g) ?? [];
}

// ── Einzeiliger Text bleibt, wie er war ──────────────────────────────────

test('Einzeiliger Text wird Zeichen für Zeichen wie bisher gezeichnet', () => {
  // Dieser Wortlaut ist das Format von VOR der Mehrzeilen-Korrektur. Ändert er
  // sich, ändern sich die Bilder bestehender Bestellungen.
  assert.equal(
    renderTextElement(BOX, text(), 2),
    '<g transform="translate(250,250) rotate(0)"><text x="0" y="0" text-anchor="middle" dominant-baseline="central" ' +
      'font-family="Arimo" font-size="80" font-weight="400" font-style="normal" letter-spacing="0" fill="#000000">Hallo</text></g>'
  );
});

test('Einzeiliger Text mit Kursiv-Schnitt der Ersatzschrift bleibt ebenfalls unverändert (kein Scheren)', () => {
  const svg = renderTextElement(BOX, text({ italic: true, bold: true }), 2);
  assert.ok(svg.includes('font-weight="700" font-style="italic"'));
  assert.ok(!svg.includes('skewX'), 'Arimo besitzt einen echten Kursiv-Schnitt');
});

// ── Zeilenumbrüche ───────────────────────────────────────────────────────

test('Zwei Zeilen werden als zwei Textzeilen gezeichnet, von der oberen Boxkante aus, im Abstand lineHeight × Schriftgröße', () => {
  const svg = renderTextElement(BOX, text({ content: 'Team \nSchüplitz', fontSizePx: 40 }), 2);
  const zeilen = textElemente(svg);
  assert.equal(zeilen.length, 2);
  // Schrift 80 px, Zeilenabstand 1,2 × 80 = 96. Box 100 px hoch → obere Kante bei −50 (Boxmitte = 0);
  // erste Zeilenmitte ½ Zeile darunter (−50 + 48 = −2), zweite eine Zeile weiter (94).
  assert.match(zeilen[0]!, /y="-2"/);
  assert.match(zeilen[1]!, /y="94"/);
  assert.match(zeilen[0]!, />Team <\/text>$/, 'das Leerzeichen am Zeilenende bleibt erhalten (der Editor zentriert samt Leerzeichen)');
  assert.match(zeilen[1]!, />Schüplitz<\/text>$/);
  assert.ok(zeilen.every((z) => z.includes('xml:space="preserve"')));
  assert.ok(!svg.includes('Team Schüplitz'), 'die beiden Zeilen dürfen nicht wieder zu einer zusammenlaufen');
});

test('Drei Zeilen: je eine Zeilenhöhe tiefer, eine leere Zeile lässt ihren Platz frei', () => {
  const drei = textElemente(renderTextElement(BOX, text({ content: 'A\nB\nC', fontSizePx: 40 }), 2));
  assert.deepEqual(
    drei.map((z) => /y="(-?[\d.]+)"/.exec(z)![1]),
    ['-2', '94', '190']
  );

  const mitLeerzeile = textElemente(renderTextElement(BOX, text({ content: 'Eins\n\nDrei', fontSizePx: 40 }), 2));
  assert.equal(mitLeerzeile.length, 2, 'für die leere Zeile wird nichts gezeichnet');
  assert.deepEqual(
    mitLeerzeile.map((z) => /y="(-?[\d.]+)"/.exec(z)![1]),
    ['-2', '190'],
    'die Lücke bleibt: Eins und Drei stehen zwei Zeilen auseinander'
  );
});

test('Zeilenumbruch in jeder Schreibweise (\\n, \\r\\n, \\r) ergibt dieselben Zeilen', () => {
  assert.deepEqual(zerlegeInZeilen('a\nb'), ['a', 'b']);
  assert.deepEqual(zerlegeInZeilen('a\r\nb'), ['a', 'b']);
  assert.deepEqual(zerlegeInZeilen('a\rb'), ['a', 'b']);
  assert.deepEqual(zerlegeInZeilen(''), ['']);
  assert.deepEqual(zerlegeInZeilen('a\n'), ['a', ''], 'ein Umbruch am Ende erzeugt eine leere zweite Zeile – wie im Editor');
});

test('Zeilenabstand: fehlender oder ungültiger lineHeight fällt auf den Editor-Standard 1,2 zurück', () => {
  const standard = renderTextElement(BOX, text({ content: 'A\nB', lineHeight: 1.2 }), 2);
  assert.equal(renderTextElement(BOX, text({ content: 'A\nB', lineHeight: 0 }), 2), standard);
  assert.equal(renderTextElement(BOX, text({ content: 'A\nB', lineHeight: Number.NaN }), 2), standard);
  const weiter = textElemente(renderTextElement(BOX, text({ content: 'A\nB', lineHeight: 2 }), 2));
  assert.match(weiter[0]!, /y="30"/, 'lineHeight 2 × 80 px = 160 → erste Zeilenmitte bei −50 + 80');
  assert.match(weiter[1]!, /y="190"/);
});

test('Ausrichtung gilt je Zeile: links/rechts setzen jede Zeile an den Boxrand', () => {
  const links = textElemente(renderTextElement(BOX, text({ content: 'A\nBB', align: 'left' }), 2));
  assert.ok(links.every((z) => z.includes('x="-150"') && z.includes('text-anchor="start"')));
  const rechts = textElemente(renderTextElement(BOX, text({ content: 'A\nBB', align: 'right' }), 2));
  assert.ok(rechts.every((z) => z.includes('x="150"') && z.includes('text-anchor="end"')));
  const mitte = textElemente(renderTextElement(BOX, text({ content: 'A\nBB', align: 'center' }), 2));
  assert.ok(mitte.every((z) => z.includes('x="0"') && z.includes('text-anchor="middle"')));
});

test('Sonderzeichen werden in jeder Zeile maskiert', () => {
  const svg = renderTextElement(BOX, text({ content: 'A & B\n<C> "D"' }), 2);
  assert.ok(svg.includes('>A &amp; B</text>'));
  assert.ok(svg.includes('>&lt;C&gt; &quot;D&quot;</text>'));
  assert.ok(!svg.includes('<C>'));
});

test('Drehung, Kontur und Schatten gelten für jede Zeile', () => {
  const svg = renderTextElement(BOX, text({ content: 'A\nB', rotationDeg: 25, hasOutline: true, outlineColor: '#123456', hasShadow: true }), 2);
  assert.ok(svg.startsWith('<g transform="translate(250,250) rotate(25)">'));
  const zeilen = textElemente(svg);
  assert.equal(zeilen.length, 2);
  for (const z of zeilen) {
    assert.ok(z.includes('stroke="#123456"'));
    assert.ok(z.includes('filter="url(#text-shadow)"'));
  }
});

// ── Kursiv ohne Kursiv-Schnitt ───────────────────────────────────────────

test('Impact (Ersatz Anton, nur ein Schnitt): Kursiv wird durch Scheren nachgebildet', () => {
  const einzeilig = renderTextElement(BOX, text({ fontFamily: 'Impact', italic: true }), 2);
  assert.ok(einzeilig.includes('<g transform="skewX(-14)"><text '));
  assert.ok(einzeilig.includes('font-style="normal"'), 'die Neigung kommt NUR aus der Scherung, nicht doppelt aus der Schrift');

  const mehrzeilig = renderTextElement(BOX, text({ fontFamily: 'Impact', italic: true, content: 'A\nB', fontSizePx: 40 }), 2);
  assert.ok(mehrzeilig.includes('<g transform="translate(0,-2) skewX(-14)">'), 'jede Zeile schert um ihre EIGENE Mitte');
  assert.ok(mehrzeilig.includes('<g transform="translate(0,94) skewX(-14)">'));
});

test('Impact ohne Kursiv wird nicht geschert', () => {
  const svg = renderTextElement(BOX, text({ fontFamily: 'Impact', italic: false }), 2);
  assert.ok(!svg.includes('skewX'));
});

test('hatEchtenSchnitt: Anton hat weder Fett noch Kursiv, die übrigen Ersatzschriften beides', () => {
  assert.equal(hatEchtenSchnitt('Impact', 'italic'), false);
  assert.equal(hatEchtenSchnitt('Impact', 'bold'), false);
  for (const schrift of ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Unbekannte Schrift']) {
    assert.equal(hatEchtenSchnitt(schrift, 'italic'), true, `${schrift} kursiv`);
    assert.equal(hatEchtenSchnitt(schrift, 'bold'), true, `${schrift} fett`);
  }
});

// ── Szene nur mit dem Text (für den Download) ────────────────────────────

test('Textszene: unverdreht, mit Schattenfilter, ohne Ausschnitt die ganze Fläche', () => {
  const svg = buildTextOnlySvg({ widthPx: 500, heightPx: 300, renderScale: 3, element: text({ rotationDeg: 40, hasShadow: true }) });
  assert.ok(svg.includes('width="500" height="300" viewBox="0 0 500 300"'));
  assert.ok(svg.includes('rotate(0)'), 'die Drehung gehört beim Auflegen aufs Textil, nicht in die Datei');
  assert.ok(!svg.includes('rotate(40)'));
  assert.ok(svg.includes('<feDropShadow dx="6" dy="6" stdDeviation="6"'), 'Schatten skaliert mit dem Maßstab');
  assert.ok(!svg.includes('<rect'), 'ohne Hintergrundangabe transparent');
});

test('Textszene: Ausschnitt wird zur viewBox, Hintergrund zu einem deckenden Rechteck', () => {
  const svg = buildTextOnlySvg({
    widthPx: 5000,
    heightPx: 5000,
    renderScale: 2,
    element: text(),
    ausschnitt: { x: 10, y: 20, width: 300, height: 100 },
    hintergrund: '#333333',
  });
  assert.ok(svg.includes('width="300" height="100" viewBox="10 20 300 100"'));
  assert.ok(svg.includes('<rect x="10" y="20" width="300" height="100" fill="#333333"/>'));
});
