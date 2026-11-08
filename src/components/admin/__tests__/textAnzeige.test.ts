/**
 * Anzeige von Texten im Adminbereich: Zeilenumbrüche bleiben sichtbar, und
 * jeder Text steht in den Kundendateien wie ein Logo, mit PNG-/JPG-Download. Gerendert werden die ECHTEN
 * Komponenten (serverseitig zu HTML), geprüft wird das Ergebnis.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KundendateienPanel } from '../KundendateienPanel';
import { ProductionPreview } from '../ProductionPreview';
import type { AdminOrderElementRow, AdminOrderItemRow } from '@/lib/admin/data';

const BESTELLUNG = 'f5ee034e-2ee2-4994-9496-98cfa6e791d8';

function element(ueberschreibe: Partial<AdminOrderElementRow>): AdminOrderElementRow {
  return {
    id: 'e-1',
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
    logoPreviewUrl: null,
    originalStorageKey: null,
    fileSizeBytes: null,
    fileMimeType: null,
    originalDateiVorhanden: false,
    ...ueberschreibe,
  };
}

function position(elements: AdminOrderElementRow[]): AdminOrderItemRow {
  return {
    productId: 'justhoods-college-hoodie',
    productName: 'College Hoodie',
    colorId: 'grey',
    colorName: 'Grau',
    printMethod: 'dtf',
    sizeQuantities: { M: 2 },
    unitPrice: 37.99,
    quantity: 2,
    elements,
    // Vorschau vorhanden → kein Client-Knopf "Vorschau erzeugen" im Server-Rendering
    previewUrlByView: { back: '/test/vorschau-rueckseite.png', front: '/test/vorschau-vorderseite.png' },
  };
}

const logo = element({ id: 'e-logo', type: 'logo', view: 'front', fileName: 'IMG_7928.jpeg', content: undefined, fontFamily: undefined });

test('Kundendateien: der Text steht wie das Logo in der Liste – mit Vorschaubild, Bezeichnung und „Herunterladen“', () => {
  const html = renderToStaticMarkup(
    createElement(KundendateienPanel, {
      orderId: BESTELLUNG,
      items: [position([logo, element({ id: 'e-text-1' }), element({ id: 'e-text-2', content: 'Zweiter Text' })])],
    })
  );
  // Gleicher Block, gleiche Zählung: Logo vorn, beide Texte hinten.
  assert.match(html, /Position 1: College Hoodie · Grau/);
  assert.match(html, /Vorderseite/i);
  assert.match(html, /R(ü|ue)ckseite/i);
  assert.match(html, /3 Dateien insgesamt/, 'Logos und Texte werden zusammen gezählt');
  assert.match(html, /Logo 1 · IMG_7928\.jpeg/);
  assert.match(html, /Text 1 · „Team Schüplitz“/, 'der Umbruch wird in der Zeile zu einem Leerzeichen');
  assert.match(html, /Text 2 · „Zweiter Text“/);
  assert.match(html, /PNG, transparent · 2 Zeilen · 300 dpi/);
  assert.match(html, /PNG, transparent · 300 dpi/, 'einzeiliger Text ohne Zeilenhinweis');
  // Hauptknopf = PNG (DTF), danach JPG.
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1\\?format=png"[^>]*>Herunterladen<`));
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1"[^>]*>Als JPG<`));
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-2\\?format=png"`));
  // Vorschaubild kommt aus der geschützten Route, nicht über den Bildoptimierer.
  assert.match(html, new RegExp(`src="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1\\?vorschau=1"`));
  assert.doesNotMatch(html, /_next\/image/, 'der Optimierer würde ohne Anmeldung abrufen und scheitern');
  // Das ZIP bleibt erreichbar und die Erklärung nennt, was im ZIP liegt.
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/kundendateien"[^>]*>Alle Kundendateien herunterladen \\(ZIP\\)`));
  assert.match(html, /transparenten Hintergrund[^<]*DTF-Bestellung \(auch im ZIP\)/);
});

test('Kundendateien: Logos sehen aus wie bisher, ein Logo bekommt keinen Text-Download', () => {
  const html = renderToStaticMarkup(createElement(KundendateienPanel, { orderId: BESTELLUNG, items: [position([logo])] }));
  assert.match(html, /1 Datei insgesamt/);
  assert.match(html, /Logo 1 · IMG_7928\.jpeg/);
  assert.doesNotMatch(html, /\/texte\//, 'keine Text-Links ohne Text');
  assert.doesNotMatch(html, /Texte entstehen beim Herunterladen/, 'die Texterklärung erscheint nur, wenn es Texte gibt');
});

test('Kundendateien: eine Bestellung nur mit Text hat trotzdem Dateien zum Herunterladen', () => {
  const html = renderToStaticMarkup(createElement(KundendateienPanel, { orderId: BESTELLUNG, items: [position([element({ id: 'e-text-1' })])] }));
  assert.match(html, /1 Datei insgesamt/);
  assert.doesNotMatch(html, /Keine hochgeladenen/);
  assert.match(html, /Text 1 · „Team Schüplitz“/);
});

test('Kundendateien: ohne Logo und ohne Text steht ein Hinweis statt einer leeren Liste', () => {
  assert.match(renderToStaticMarkup(createElement(KundendateienPanel, { orderId: BESTELLUNG, items: [position([])] })), /Keine hochgeladenen Logo-Dateien und keine Texte/);
  assert.match(renderToStaticMarkup(createElement(KundendateienPanel, { orderId: BESTELLUNG, items: [] })), /Keine hochgeladenen Logo-Dateien und keine Texte/);
});

test('Kundendateien: mehrere Positionen und Ansichten zählen Texte je Ansicht neu ab 1', () => {
  const html = renderToStaticMarkup(
    createElement(KundendateienPanel, {
      orderId: BESTELLUNG,
      items: [
        position([element({ id: 'a1', content: 'A1' }), element({ id: 'a2', content: 'A2' }), element({ id: 'v1', view: 'front', content: 'V1' })]),
        position([element({ id: 'b1', content: 'B1' })]),
      ],
    })
  );
  assert.match(html, /Position 1:/);
  assert.match(html, /Position 2:/);
  assert.equal((html.match(/Text 1 ·/g) ?? []).length, 3, 'je Position und Ansicht beginnt die Zählung bei 1');
  assert.equal((html.match(/Text 2 ·/g) ?? []).length, 1);
});

test('Personalisierung: Text mit Zeilenumbruch bleibt zweizeilig sichtbar, mit Download-Link', () => {
  const html = renderToStaticMarkup(createElement(ProductionPreview, { orderId: BESTELLUNG, items: [position([logo, element({ id: 'e-text-1' })])] }));
  assert.match(html, /whitespace-pre-line[^>]*>„Team \nSchüplitz“/);
  assert.match(html, /2 Zeilen, Impact/);
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1"[^>]*>Als JPG herunterladen`));
  // Logos bekommen keinen Text-Download.
  assert.equal((html.match(/Als JPG herunterladen/g) ?? []).length, 1);
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1\\?format=png"[^>]*>PNG für DTF`));
  assert.equal((html.match(/PNG für DTF/g) ?? []).length, 1, 'auch das Logo bekommt keinen Text-Download');
});

test('Einzeiliger Text zeigt keinen Zeilenhinweis', () => {
  const html = renderToStaticMarkup(createElement(ProductionPreview, { orderId: BESTELLUNG, items: [position([element({ content: 'Muster Sport' })])] }));
  assert.doesNotMatch(html, /\d Zeilen/);
  assert.match(html, /„Muster Sport“/);
});
