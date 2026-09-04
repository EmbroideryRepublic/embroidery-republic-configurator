/**
 * Adversariale Tests der serverseitigen Stichzahl (Fund der Review zur
 * Preisumstellung 2026-09-03): Die vom Browser übermittelte Stichzahl darf
 * den Stickaufpreis NICHT nach unten drücken. Der Server bestimmt die
 * preisrelevante Zahl selbst aus den Motivdaten (serverStichzahl.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Resvg } from '@resvg/resvg-js';

import {
  STICH_TOLERANZ,
  messeTintenanteilServer,
  mitVertrauenswuerdigerStichzahl,
  schaetzeLogoSticheAusPng,
  schaetzeTextSticheServer,
  vertrauenswuerdigeStichzahl,
} from '../serverStichzahl';
import { BASE_OVERHEAD_STITCHES, TEXT_MIN_STITCHES, schaetzeLogoSticheOhneBild } from '../stichschaetzung';
import { priceCart } from '@/lib/pricing/serverPricing';
import { PRODUCTS } from '@/config/products';
import type { CartItem, ConfigElement, LogoElement, TextElement } from '@/types';

/** Echte PNG-Datei (Kreis + Balken, ~43 % Füllung) – wie ein Kunden-Upload. */
function testLogoPng(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">' +
    '<circle cx="100" cy="100" r="80" fill="#123456"/><rect x="200" y="60" width="180" height="80" fill="#123456"/></svg>';
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  return `data:image/png;base64,${png.toString('base64')}`;
}
const LOGO_PNG = testLogoPng();

function logo(overrides: Partial<LogoElement> = {}): LogoElement {
  return {
    id: 'el-logo',
    type: 'logo',
    view: 'front',
    xCm: 1,
    yCm: 1,
    widthCm: 8,
    heightCm: 4,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 6400,
    name: 'Logo',
    locked: false,
    hidden: false,
    fileUrl: LOGO_PNG,
    fileName: 'logo.png',
    originalWidthPx: 400,
    originalHeightPx: 200,
    originalFileUrl: LOGO_PNG,
    backgroundRemoved: false,
    contentFillRatio: 0.85,
    ...overrides,
  };
}

function text(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: 'el-text',
    type: 'text',
    view: 'front',
    xCm: 1,
    yCm: 1,
    widthCm: 10,
    heightCm: 2,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 4000,
    name: 'Text',
    locked: false,
    hidden: false,
    content: 'Embroidery Republic',
    fontFamily: 'Arial',
    fontSizePx: 40,
    color: '#000000',
    bold: true,
    italic: false,
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1,
    hasShadow: false,
    hasOutline: false,
    outlineColor: '#000000',
    inkCoverageRatio: 0.35,
    isTemplatePlaceholder: false,
    ...overrides,
  };
}

const produkt = PRODUCTS.find((p) => (p.views ?? []).includes('front')) ?? PRODUCTS[0]!;

function position(elements: ConfigElement[], printMethod: CartItem['printMethod'] = 'embroidery'): CartItem {
  return {
    id: 'pos-1',
    productId: produkt.id,
    colorId: produkt.colors[0]!.id,
    printMethod,
    sizeQuantities: { [produkt.sizes[0]!]: 1 },
    quantity: 1,
    elements,
    unitPrice: 0,
    totalPrice: 0,
    addedAt: 0,
  } as CartItem;
}

// ── Serverschätzung aus dem PNG ──────────────────────────────────────────

test('Server schätzt die Stichzahl eines Logos aus dem PNG selbst – deterministisch und plausibel', () => {
  const a = schaetzeLogoSticheAusPng(LOGO_PNG, 8, 4);
  const b = schaetzeLogoSticheAusPng(LOGO_PNG, 8, 4);
  assert.equal(a, b, 'dieselbe Datei muss immer dieselbe Zahl ergeben');
  // 32 cm² bei ~43 % Füllung: Füllanteil allein ≈ 5.800 Stiche, plus Kanten und Grundstiche.
  assert.ok(a > 5000 && a < 9000, `Schätzung ${a} liegt außerhalb des plausiblen Bereichs für dieses Motiv`);
  // Skaliert mit der Motivfläche (doppelte Kantenlänge → vierfache Fläche).
  const gross = schaetzeLogoSticheAusPng(LOGO_PNG, 16, 8);
  assert.ok(gross > a * 3.5 && gross < a * 4.2, `größeres Motiv: ${gross} vs. ${a}`);
});

/** PNGs mit GÜLTIGEM Header, aber unbrauchbarem Inhalt – resvg rendert sie
 *  stumm als leeres Bild statt einen Fehler zu werfen (geprüft). */
function kaputtePngs(): [string, string][] {
  const gut = Buffer.from(LOGO_PNG.split(',')[1]!, 'base64');
  const url = (b: Buffer) => `data:image/png;base64,${b.toString('base64')}`;
  const riesigerHeader = Buffer.from(gut.subarray(0, 33));
  riesigerHeader.writeUInt32BE(8000, 16);
  riesigerHeader.writeUInt32BE(8000, 20);
  const leerAberGueltig = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"></svg>').render().asPng();
  const nurWeiss = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#ffffff"/></svg>').render().asPng();
  return [
    ['nach IHDR abgeschnitten', url(gut.subarray(0, 33))],
    ['halb abgeschnitten', url(gut.subarray(0, Math.floor(gut.length / 2)))],
    ['Bilddaten mit Müll überschrieben', url(Buffer.concat([gut.subarray(0, 60), Buffer.alloc(gut.length - 60, 0x5a)]))],
    ['Header 8000×8000 ohne Bilddaten', url(riesigerHeader)],
    ['gültiges, vollständig transparentes PNG', url(leerAberGueltig)],
    ['gültiges, rein weißes PNG', url(nurWeiss)],
  ];
}

test('Server-Schätzung fällt bei unlesbaren Bilddaten auf die bildlose Schätzung zurück – nie auf 0 oder den Clientwert', () => {
  for (const kaputt of ['', 'data:image/png;base64,', 'data:image/png;base64,QUJD', 'data:text/plain;base64,QUJD', 'https://example.com/x.png']) {
    assert.equal(schaetzeLogoSticheAusPng(kaputt, 8, 4), schaetzeLogoSticheOhneBild(32), `Eingabe ${JSON.stringify(kaputt)}`);
  }
  assert.ok(schaetzeLogoSticheOhneBild(32) > BASE_OVERHEAD_STITCHES);
});

test('PNG mit gültigem Header, aber leerem/kaputtem Inhalt: nie nur Grundstiche, sondern bildlose Schätzung (50 % Füllung)', () => {
  for (const [name, url] of kaputtePngs()) {
    assert.equal(schaetzeLogoSticheAusPng(url, 8, 4), schaetzeLogoSticheOhneBild(32), name);
    assert.ok(schaetzeLogoSticheAusPng(url, 8, 4) > BASE_OVERHEAD_STITCHES, `${name}: mehr als die 500 Grundstiche`);
  }
});

test('Leere oder unlesbare Stickerei-Logos werden als `unlesbar` gemeldet – die Bestellung wird abgewiesen, nicht bepreist', () => {
  for (const [name, url] of kaputtePngs()) {
    for (const clientWert of [500, 0, 26764]) {
      const { unlesbar, items } = mitVertrauenswuerdigerStichzahl([position([logo({ fileUrl: url, estimatedStitches: clientWert })])]);
      assert.equal(unlesbar.length, 1, `${name} (Client ${clientWert}) muss als unlesbar gemeldet werden`);
      assert.deepEqual(unlesbar[0], { itemId: 'pos-1', elementId: 'el-logo' });
      // Selbst wenn ein Aufrufer die Meldung ignorierte: der Wert läge nie unter der bildlosen Schätzung.
      assert.ok(items[0]!.elements[0]!.estimatedStitches >= schaetzeLogoSticheOhneBild(32), `${name}: Rückfallwert`);
    }
  }
  // Nicht-PNG-Daten (kein data:-URL, falsche Signatur) sind ebenfalls unlesbar –
  // sie scheitern zusätzlich bereits beim Speichern (uploadProductionFile).
  for (const url of ['', 'data:image/png;base64,QUJD', 'https://example.com/x.png']) {
    assert.equal(mitVertrauenswuerdigerStichzahl([position([logo({ fileUrl: url })])]).unlesbar.length, 1, JSON.stringify(url));
  }
  // Ein echtes Motiv ist lesbar.
  assert.equal(mitVertrauenswuerdigerStichzahl([position([logo()])]).unlesbar.length, 0);
  // Texte und DTF-Positionen sind von dieser Prüfung nicht betroffen.
  assert.equal(mitVertrauenswuerdigerStichzahl([position([text()])]).unlesbar.length, 0);
  assert.equal(mitVertrauenswuerdigerStichzahl([position([logo({ fileUrl: 'data:image/png;base64,QUJD' })], 'dtf')]).unlesbar.length, 0);
});

test('Server misst den Tintenanteil eines Textes selbst (gebündelte Ersatzschriften) und schätzt daraus die Stiche', () => {
  const ratio = messeTintenanteilServer(text());
  assert.ok(ratio >= 0.1 && ratio <= 0.9, `Tintenanteil ${ratio}`);
  assert.ok(ratio > 0.15, 'ein fetter Schriftzug bedeckt deutlich mehr als die Untergrenze');
  const stiche = schaetzeTextSticheServer(text());
  assert.ok(stiche > TEXT_MIN_STITCHES);
  assert.equal(schaetzeTextSticheServer(text()), stiche, 'deterministisch');
  // Ein Schriftzug ohne Inhalt liefert den neutralen Rückfallwert.
  assert.equal(messeTintenanteilServer(text({ content: '   ' })), 0.35);
});

// ── Vertrauensregel ──────────────────────────────────────────────────────

test('Vertrauensregel: Clientwert nur innerhalb der Toleranz, sonst Serverwert', () => {
  const server = 10000;
  const tol = STICH_TOLERANZ.logo;
  assert.deepEqual(vertrauenswuerdigeStichzahl(10000, server, tol), { wert: 10000, ersetzt: false });
  assert.deepEqual(vertrauenswuerdigeStichzahl(server * (1 - tol), server, tol), { wert: server * (1 - tol), ersetzt: false });
  assert.deepEqual(vertrauenswuerdigeStichzahl(server * (1 - tol) - 1, server, tol), { wert: server, ersetzt: true });
  assert.deepEqual(vertrauenswuerdigeStichzahl(25000, server, tol), { wert: 25000, ersetzt: false }, 'ein höherer Clientwert bringt keinen Vorteil und bleibt');
  for (const unsinn of [0, 500, 150, 1, 1e-9, -1, -50000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, undefined, null, 'abc', '9999', {}, []]) {
    assert.deepEqual(vertrauenswuerdigeStichzahl(unsinn, server, tol), { wert: server, ersetzt: true }, `Clientwert ${String(unsinn)}`);
  }
});

test('Manipulierte Stichzahlen werden bei Stickerei durch den Serverwert ersetzt – der Aufpreis lässt sich nicht abschalten', () => {
  const server = schaetzeLogoSticheAusPng(LOGO_PNG, 8, 4);
  const manipuliert = [0, 500, 150, 1, 1e-9, -1, -50000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, undefined, null, 'abc', Math.floor(server * 0.5)];
  for (const wert of manipuliert) {
    const { items, korrekturen } = mitVertrauenswuerdigerStichzahl([position([logo({ estimatedStitches: wert as number })])]);
    const element = items[0]!.elements[0]!;
    assert.equal(element.estimatedStitches, server, `Clientwert ${String(wert)} muss durch den Serverwert ersetzt werden`);
    assert.equal(korrekturen.length, 1);
    assert.equal(korrekturen[0]!.serverWert, server);
  }
});

test('Ehrliche Clientwerte innerhalb der Messtoleranz bleiben unverändert (Anzeige = Rechnung)', () => {
  const server = schaetzeLogoSticheAusPng(LOGO_PNG, 8, 4);
  for (const faktor of [1 - STICH_TOLERANZ.logo + 0.001, 0.98, 1, 1.02, 1.5]) {
    const client = Math.round(server * faktor);
    const { items, korrekturen } = mitVertrauenswuerdigerStichzahl([position([logo({ estimatedStitches: client })])]);
    assert.equal(items[0]!.elements[0]!.estimatedStitches, client, `Faktor ${faktor}`);
    assert.equal(korrekturen.length, 0);
  }
});

test('Text: manipulierter Tintenanteil/Stichwert wird durch die Serverschätzung ersetzt', () => {
  const server = schaetzeTextSticheServer(text());
  const { items, korrekturen } = mitVertrauenswuerdigerStichzahl([position([text({ inkCoverageRatio: 0.1, estimatedStitches: 150 })])]);
  assert.equal(items[0]!.elements[0]!.estimatedStitches, server);
  assert.equal(korrekturen.length, 1);
  assert.ok(server > 150);
});

test('DTF-Positionen bleiben unangetastet (dort wird nicht nach Stichen abgerechnet)', () => {
  const item = position([logo({ estimatedStitches: 0 })], 'dtf');
  const { items, korrekturen } = mitVertrauenswuerdigerStichzahl([item]);
  assert.equal(items[0]!.elements[0]!.estimatedStitches, 0);
  assert.equal(korrekturen.length, 0);
});

test('Die Eingabe wird nicht verändert (Kopie), die Elementreihenfolge bleibt', () => {
  const eingabe = position([logo({ id: 'a', estimatedStitches: 0 }), text({ id: 'b', estimatedStitches: 0 })]);
  const { items } = mitVertrauenswuerdigerStichzahl([eingabe]);
  assert.equal(eingabe.elements[0]!.estimatedStitches, 0, 'Original bleibt unverändert');
  assert.deepEqual(items[0]!.elements.map((e) => e.id), ['a', 'b']);
  assert.ok(items[0]!.elements.every((e) => e.estimatedStitches > 0));
});

// ── Ende-zu-Ende: kein Preisvorteil durch Manipulation ───────────────────

test('Ende-zu-Ende: ein manipulierter Warenkorb kostet nach der Absicherung exakt so viel wie ein ehrlicher', async () => {
  const server = schaetzeLogoSticheAusPng(LOGO_PNG, 8, 4);
  const ehrlich = mitVertrauenswuerdigerStichzahl([position([logo({ estimatedStitches: server })])]).items;
  const ehrlichPreis = await priceCart(ehrlich, 'Deutschland');

  for (const wert of [0, 500, 1, -50000, Number.NaN, Math.floor(server * 0.5)]) {
    const manipuliert = mitVertrauenswuerdigerStichzahl([position([logo({ estimatedStitches: wert })])]).items;
    const preis = await priceCart(manipuliert, 'Deutschland');
    assert.equal(preis.totalPrice, ehrlichPreis.totalPrice, `Clientwert ${String(wert)} darf den Preis nicht senken`);
  }

  // Ohne Absicherung wäre der Preis mit 0 Stichen auf DTF-Niveau gefallen –
  // genau der Angriff, den diese Schicht schließt.
  const ungesichert = await priceCart([position([logo({ estimatedStitches: 0 })])], 'Deutschland');
  const dtf = await priceCart([position([logo({ estimatedStitches: 0 })], 'dtf')], 'Deutschland');
  assert.equal(ungesichert.totalPrice, dtf.totalPrice, 'Kontrolle: der Rechenkern allein vertraut dem Clientwert');
  assert.ok(ehrlichPreis.totalPrice > dtf.totalPrice, 'abgesichert kostet Stickerei mehr als DTF');
});
