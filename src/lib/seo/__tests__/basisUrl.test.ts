/**
 * Prüfungen der Basisadresse.
 *
 * Der wichtigste Fall ist der Produktionsbau ohne gesetzte Variable: Er MUSS
 * abbrechen, damit niemals eine Sitemap mit localhost-Adressen ausgeliefert
 * wird.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { basisUrl, kanonischeBasisUrl } from '../basisUrl';

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

// ── kanonischeBasisUrl: die Adresse, die Suchmaschinen sehen ─────────────
// Hintergrund: ergermany.de leitet per 308 auf www.ergermany.de um, die
// Produktions-Variable steht aber auf der Adresse ohne www (siehe basisUrl.ts).

test('kanonisch: ergermany.de ohne www wird auf den ausliefernden Host www.ergermany.de gehoben', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: 'https://ergermany.de' }, () => {
    assert.equal(kanonischeBasisUrl(), 'https://www.ergermany.de');
    // Die Betriebsadresse (Zahlung, Login, E-Mails) bleibt UNVERÄNDERT.
    assert.equal(basisUrl(), 'https://ergermany.de');
  });
});

test('kanonisch: eine Variable, die schon auf www steht, bleibt unverändert (Umstellung im Dashboard bleibt wirkungsfrei)', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: 'https://www.ergermany.de/' }, () => {
    assert.equal(kanonischeBasisUrl(), 'https://www.ergermany.de');
  });
});

test('kanonisch: fremde Hosts und der lokale Entwicklungsserver bleiben unangetastet', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: 'https://example.test' }, () => {
    assert.equal(kanonischeBasisUrl(), 'https://example.test');
  });
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: undefined, NODE_ENV: 'development' }, () => {
    assert.equal(kanonischeBasisUrl(), 'http://localhost:3007');
  });
});

test('kanonisch: ohne gesetzte Variable bricht auch sie in Produktion hart ab (kein stiller localhost)', () => {
  mitUmgebung({ NEXT_PUBLIC_SITE_URL: undefined, NODE_ENV: 'production' }, () => {
    assert.throws(() => kanonischeBasisUrl(), /NEXT_PUBLIC_SITE_URL/);
  });
});
