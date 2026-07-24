/**
 * Prüfungen des Kauffortschritts.
 *
 * Wichtig sind die Reihenfolge des „nächsten Schritts" und die stabile
 * Darstellung der Größenauswahl.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrintView } from '@/types';
import { belegteAnsichten, groessenText, naechsterSchritt } from '../kauffortschritt';

test('groessenText fasst gewählte Größen in Konfektionsreihenfolge zusammen', () => {
  assert.equal(groessenText({ L: 2 }), 'L × 2');
  // Eingabereihenfolge XL, S → Ausgabe S, XL (Konfektionsreihenfolge).
  assert.equal(groessenText({ XL: 1, S: 3 }), 'S × 3 · XL × 1');
});

test('groessenText ignoriert Nullmengen und leere Auswahl', () => {
  assert.equal(groessenText({ M: 0 }), '');
  assert.equal(groessenText({}), '');
  assert.equal(groessenText({ M: 0, L: 2 }), 'L × 2');
});

test('belegteAnsichten listet Motiv-Ansichten in fachlicher Reihenfolge, ohne Dubletten', () => {
  const els = [
    { view: 'back' as PrintView },
    { view: 'front' as PrintView },
    { view: 'front' as PrintView },
  ];
  assert.deepEqual(belegteAnsichten(els), ['front', 'back']);
  assert.deepEqual(belegteAnsichten([]), []);
});

test('nächster Schritt folgt der fachlichen Reihenfolge', () => {
  const basis = { hatGroesse: false, hatMotiv: false, motivImRahmen: true, preisGueltig: true };
  assert.equal(naechsterSchritt(basis), 'groesse');
  assert.equal(naechsterSchritt({ ...basis, hatGroesse: true }), 'motiv');
  assert.equal(
    naechsterSchritt({ hatGroesse: true, hatMotiv: true, motivImRahmen: false, preisGueltig: true }),
    'position'
  );
  assert.equal(
    naechsterSchritt({ hatGroesse: true, hatMotiv: true, motivImRahmen: true, preisGueltig: true }),
    'bestellen'
  );
});

test('bei ungültigem Preis steht kein „bestellen" an', () => {
  assert.equal(
    naechsterSchritt({ hatGroesse: true, hatMotiv: true, motivImRahmen: true, preisGueltig: false }),
    null
  );
});
