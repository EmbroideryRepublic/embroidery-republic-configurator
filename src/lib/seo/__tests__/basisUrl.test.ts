/**
 * Prüfungen der Basisadresse.
 *
 * Der wichtigste Fall ist der Produktionsbau ohne gesetzte Variable: Er MUSS
 * abbrechen, damit niemals eine Sitemap mit localhost-Adressen ausgeliefert
 * wird.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { basisUrl } from '../basisUrl';

/** Setzt Umgebungsvariablen für einen Testfall und stellt sie danach her. */
function mitUmgebung(werte: Record<string, string | undefined>, fn: () => void) {
  const vorher: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(werte)) {
    vorher[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(vorher)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('gesetzte Adresse wird verwendet, ohne Schrägstrich am Ende', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: 'https://example.test/' }, () => {
    assert.equal(basisUrl(), 'https://example.test');
  });
});

test('in Produktion bricht eine fehlende Adresse hart ab', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: undefined, NODE_ENV: 'production' }, () => {
    assert.throws(() => basisUrl(), /NEXT_PUBLIC_SITE_URL/);
  });
});

test('eine leere Adresse zählt in Produktion als fehlend', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: '   ', NODE_ENV: 'production' }, () => {
    assert.throws(() => basisUrl(), /NEXT_PUBLIC_SITE_URL/);
  });
});

test('außerhalb der Produktion bleibt der lokale Rückfall', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: undefined, NODE_ENV: 'development' }, () => {
    assert.equal(basisUrl(), 'http://localhost:3007');
  });
});
