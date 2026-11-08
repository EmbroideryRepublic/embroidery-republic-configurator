/**
 * Anzeige von Texten im Adminbereich: Zeilenumbrüche bleiben sichtbar, und
 * jeder Text hat seinen JPG-Download. Gerendert werden die ECHTEN
 * Komponenten (serverseitig zu HTML), geprüft wird das Ergebnis.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextdateienPanel } from '../TextdateienPanel';
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

test('Texte-Bereich: jeder Text mit Zeilenumbruch, Zeilenzahl und Download- sowie Ansehen-Link', () => {
  const html = renderToStaticMarkup(
    createElement(TextdateienPanel, { orderId: BESTELLUNG, items: [position([logo, element({ id: 'e-text-1' }), element({ id: 'e-text-2', content: 'Zweiter Text' })])] })
  );
  assert.match(html, /Texte als Bilddatei \(PNG und JPG\)/);
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1\\?format=png"[^>]*>PNG für DTF herunterladen`));
  assert.match(html, /transparenten Hintergrund/, 'die Erklärung nennt, wofür welche Datei da ist');
  assert.match(html, /Position 1: College Hoodie · Grau/);
  assert.match(html, /RÜCKSEITE|Rückseite/i);
  assert.match(html, /class="[^"]*whitespace-pre-line[^"]*"[^>]*>„Team \nSchüplitz“/, 'der Zeilenumbruch steht im Text und die Anzeige erhält ihn');
  assert.match(html, /2 Zeilen/);
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1"`));
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-1\\?ansicht=1"[^>]*target="_blank"`));
  assert.match(html, new RegExp(`href="/api/admin/bestellungen/${BESTELLUNG}/texte/e-text-2"`));
  assert.match(html, />Text 1</);
  assert.match(html, />Text 2</);
  assert.doesNotMatch(html, /e-logo/, 'ein Logo hat hier keinen Eintrag');
});

test('Texte-Bereich erscheint nur, wenn die Bestellung einen Text enthält', () => {
  assert.equal(renderToStaticMarkup(createElement(TextdateienPanel, { orderId: BESTELLUNG, items: [position([logo])] })), '');
  assert.equal(renderToStaticMarkup(createElement(TextdateienPanel, { orderId: BESTELLUNG, items: [] })), '');
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
