/**
 * Test der Lexware-Stilllegung (Go-Live-Nachtrag 2026-08-18):
 * Ohne konfigurierten Rechnungsanbieter darf orderCompletion.ts weder einen
 * Claim setzen noch einen Lexware-Aufruf versuchen – istRechnungserstellungMoeglich()
 * ist die dafür vorgesehene, nicht werfende Vorabfrage.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waehleRechnungsAnbieter, istRechnungserstellungMoeglich, RechnungsAnbieterFehlt } from '../registry';

function mitUmgebung<T>(werte: Record<string, string | undefined>, fn: () => T): T {
  const vorher: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(werte)) {
    vorher[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(vorher)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('ohne LEXWARE_API_KEY und außerhalb des Testmodus ist keine Rechnungserstellung möglich', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: undefined }, () => {
    assert.equal(istRechnungserstellungMoeglich(), false);
    assert.throws(() => waehleRechnungsAnbieter(), RechnungsAnbieterFehlt);
  });
});

test('mit LEXWARE_API_KEY ist Rechnungserstellung möglich', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: 'key-abc' }, () => {
    assert.equal(istRechnungserstellungMoeglich(), true);
  });
});

test('im Testmodus ist Rechnungserstellung immer möglich, unabhängig von LEXWARE_API_KEY', () => {
  mitUmgebung({ E2E_TESTMODUS: 'aktiv', LEXWARE_API_KEY: undefined }, () => {
    assert.equal(istRechnungserstellungMoeglich(), true);
    assert.doesNotThrow(() => waehleRechnungsAnbieter());
  });
});
