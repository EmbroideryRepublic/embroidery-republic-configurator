/**
 * „Ohne Kundenfreigabe starten“ in der Statussteuerung des Adminbereichs (OrderStatusControl).
 *
 * Gerendert statt nur im Quelltext geprüft: Was der Betreiber sieht, ist hier die Aussage – ohne Freigabe der
 * Druckvorschau erscheint das Häkchen und „In Produktion“ ist gesperrt, mit Freigabe bleibt alles wie bisher.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrderStatusControl } from '../OrderStatusControl';

type Status = 'new' | 'in_production' | 'shipped' | 'completed' | 'cancelled';

function rendere(status: Status, freigabeErteilt?: boolean): string {
  return renderToStaticMarkup(
    createElement(OrderStatusControl, { orderId: 'bestellung-1', status, trackingNummer: null, ...(freigabeErteilt === undefined ? {} : { freigabeErteilt }) })
  );
}

/** Ist der Knopf „Auf „In Produktion“ setzen“ gesperrt? */
function produktionsknopfGesperrt(html: string): boolean {
  const knoepfe = [...html.matchAll(/<button[^>]*>[^<]*<\/button>/g)].map((m) => m[0]);
  const knopf = knoepfe.find((k) => k.includes('In Produktion'));
  assert.ok(knopf, 'Knopf „In Produktion“ fehlt');
  return /\sdisabled(=""|\s|>)/.test(knopf);
}

test('ohne Freigabe der Druckvorschau: Häkchen „Ohne Kundenfreigabe starten“ sichtbar, „In Produktion“ gesperrt', () => {
  const html = rendere('new', false);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /Ohne Kundenfreigabe starten/);
  assert.match(html, /noch nicht freigegeben/);
  assert.equal(produktionsknopfGesperrt(html), true);
  // Das Häkchen ist standardmäßig NICHT gesetzt – wer ohne Freigabe startet, tut es bewusst.
  assert.ok(!/type="checkbox"[^>]*checked/.test(html));
});

test('mit Freigabe der Kundschaft: kein Häkchen, „In Produktion“ frei – wie bisher', () => {
  const html = rendere('new', true);
  assert.ok(!html.includes('type="checkbox"'));
  assert.ok(!html.includes('Ohne Kundenfreigabe starten'));
  assert.equal(produktionsknopfGesperrt(html), false);
});

test('ohne Angabe gilt das bisherige Verhalten (Freigabe erteilt)', () => {
  const html = rendere('new');
  assert.ok(!html.includes('type="checkbox"'));
  assert.equal(produktionsknopfGesperrt(html), false);
});

test('das Häkchen erscheint nur dort, wo „In Produktion“ der nächste Schritt ist', () => {
  for (const status of ['in_production', 'shipped', 'completed', 'cancelled'] as const) {
    const html = rendere(status, false);
    assert.ok(!html.includes('Ohne Kundenfreigabe starten'), `${status}: Häkchen dürfte nicht erscheinen`);
  }
});
