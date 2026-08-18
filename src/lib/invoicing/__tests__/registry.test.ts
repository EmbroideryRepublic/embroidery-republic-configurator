/**
 * Test der Lexware-Stilllegung (Go-Live-Nachtrag 2026-08-18) UND ihrer
 * Erweiterung um den internen Rechnungsanbieter (siehe providers/intern.ts):
 * `intern` braucht keine externe Konfiguration und ist deshalb IMMER
 * einsatzbereit – seitdem darf istRechnungserstellungMoeglich() nur noch in
 * wirklich außergewöhnlichen Fällen `false` liefern, und
 * waehleRechnungsAnbieter() darf die normale Bestellabwicklung nie mehr
 * blockieren.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waehleRechnungsAnbieter, istRechnungserstellungMoeglich } from '../registry';

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

test('ohne LEXWARE_API_KEY und außerhalb des Testmodus ist Rechnungserstellung dennoch möglich (intern)', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: undefined, INVOICING_PROVIDER: undefined }, () => {
    assert.equal(istRechnungserstellungMoeglich(), true);
    assert.equal(waehleRechnungsAnbieter().id, 'intern');
  });
});

test('mit LEXWARE_API_KEY ist Rechnungserstellung möglich, Standardanbieter bleibt trotzdem intern', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: 'key-abc', INVOICING_PROVIDER: undefined }, () => {
    assert.equal(istRechnungserstellungMoeglich(), true);
    assert.equal(waehleRechnungsAnbieter().id, 'intern');
  });
});

test('INVOICING_PROVIDER=lexware mit gültigem Schlüssel wählt Lexware', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: 'key-abc', INVOICING_PROVIDER: 'lexware' }, () => {
    assert.equal(waehleRechnungsAnbieter().id, 'lexware');
  });
});

test('INVOICING_PROVIDER=lexware ohne gültigen Schlüssel fällt zurück auf intern statt zu werfen', () => {
  mitUmgebung({ E2E_TESTMODUS: undefined, LEXWARE_API_KEY: undefined, INVOICING_PROVIDER: 'lexware' }, () => {
    assert.doesNotThrow(() => waehleRechnungsAnbieter());
    assert.equal(waehleRechnungsAnbieter().id, 'intern');
  });
});

test('im Testmodus ist Rechnungserstellung immer möglich, unabhängig von LEXWARE_API_KEY', () => {
  mitUmgebung({ E2E_TESTMODUS: 'aktiv', LEXWARE_API_KEY: undefined, INVOICING_PROVIDER: undefined }, () => {
    assert.equal(istRechnungserstellungMoeglich(), true);
    assert.doesNotThrow(() => waehleRechnungsAnbieter());
    assert.equal(waehleRechnungsAnbieter().id, 'test');
  });
});
