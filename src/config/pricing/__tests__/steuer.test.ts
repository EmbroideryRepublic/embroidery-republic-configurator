/**
 * Umsatzsteuer: Verhalten und Zentralisierung.
 *
 * Der wichtigste Test dieser Datei ist der WÄCHTER am Ende. Er durchsucht den
 * Quelltext und schlägt an, sobald irgendwo eine zweite Stelle einen
 * Steuersatz kennt. Genau das war der Zustand vor dem 2026-07-22: `steuer.ts`
 * führte 19, `orderStage.ts` führte 0 – zwei Wahrheiten, die sich
 * widersprachen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  STANDARDLAND,
  SteuersatzUnbekannt,
  bruttoZuNetto,
  nettoZuBrutto,
  steueranteil,
  steuersatzFuer,
  steuersatzVorhanden,
} from '../steuer';

// ── Auflösung ────────────────────────────────────────────────────────────

test('Deutschland führt den Regelsatz von 19 Prozent', () => {
  const satz = steuersatzFuer('DE');
  assert.equal(satz.satz, 19);
  assert.match(satz.bezeichnung, /19/);
  assert.ok(satz.gueltigAb.length === 10, 'ein Gültigkeitsdatum gehört dazu');
});

test('ohne Land gilt das Standardland', () => {
  assert.equal(STANDARDLAND, 'DE');
  assert.deepEqual(steuersatzFuer(), steuersatzFuer('DE'));
});

test('die Schreibweise des Länderkürzels ist gleichgültig', () => {
  assert.equal(steuersatzFuer('de').satz, 19);
});

test('der ermäßigte Satz ist hinterlegt, aber ohne Anwendungsfall', () => {
  assert.equal(steuersatzFuer('DE', 'ermaessigt').satz, 7);
});

test('ein unbekanntes Land wird abgewiesen, nicht geschätzt', () => {
  // Kein Ausweichwert: Eine falsch berechnete Steuer ist ein Steuerdelikt,
  // kein Rundungsfehler.
  assert.throws(
    () => steuersatzFuer('CH'),
    (fehler: Error) => {
      assert.ok(fehler instanceof SteuersatzUnbekannt);
      assert.match(fehler.message, /kein Regelsteuersatz hinterlegt/i);
      assert.match(fehler.message, /steuer\.ts/, 'die Fehlermeldung soll sagen, wo zu ergänzen ist');
      return true;
    }
  );
  assert.equal(steuersatzVorhanden('CH'), false);
  assert.equal(steuersatzVorhanden('DE'), true);
});

// ── Umrechnung ───────────────────────────────────────────────────────────

test('netto und brutto rechnen sich ineinander um', () => {
  for (const netto of [1, 8.4, 20.08, 33.53, 199.99]) {
    assert.ok(Math.abs(bruttoZuNetto(nettoZuBrutto(netto)) - netto) < 0.01);
  }
});

test('Netto plus Steueranteil ergibt wieder brutto', () => {
  for (const brutto of [7.9, 24.9, 119, 1234.56]) {
    assert.ok(Math.abs(bruttoZuNetto(brutto) + steueranteil(brutto) - brutto) < 0.011, `${brutto} geht nicht auf`);
  }
});

test('bekannte Beträge stimmen auf den Cent', () => {
  assert.equal(nettoZuBrutto(100), 119);
  assert.equal(bruttoZuNetto(119), 100);
  assert.equal(steueranteil(24.9), 3.98);
});

// ── Wächter: nur EINE Stelle kennt Steuersätze ───────────────────────────

function alleQuelldateien(verzeichnis: string, gesammelt: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      if (eintrag !== 'node_modules' && eintrag !== '__tests__') alleQuelldateien(pfad, gesammelt);
    } else if (/\.tsx?$/.test(eintrag)) {
      gesammelt.push(pfad);
    }
  }
  return gesammelt;
}

test('keine zweite Stelle im Projekt kennt einen Steuersatz', () => {
  // Sucht nach den Zahlen, mit denen sich Umsatzsteuer rechnen lässt:
  // 1.19 / 0.19 als Faktor, sowie taxPercent/taxRate als eigene Konfiguration.
  const verdaechtig = [
    { muster: /\b1\.19\b/, was: 'Brutto-Faktor 1.19' },
    { muster: /\b0\.19\b/, was: 'Steuerfaktor 0.19' },
    { muster: /taxPercent/, was: 'eigene Steuersatz-Konfiguration' },
    { muster: /\/\s*1\.19|\*\s*1\.19/, was: 'Umrechnung mit 1.19' },
  ];
  const erlaubt = join('src', 'config', 'pricing', 'steuer.ts');

  const treffer: string[] = [];
  for (const datei of alleQuelldateien('src')) {
    if (datei.endsWith(erlaubt) || datei.includes('steuer.ts')) continue;
    const inhalt = readFileSync(datei, 'utf8');
    for (const { muster, was } of verdaechtig) {
      if (muster.test(inhalt)) treffer.push(`${datei}: ${was}`);
    }
  }

  assert.deepEqual(
    treffer,
    [],
    'Steuersätze gehören ausschließlich in config/pricing/steuer.ts. Gefunden in:\n  ' + treffer.join('\n  ')
  );
});

test('die Bestellstufe holt den Satz, statt ihn zu kennen', () => {
  const inhalt = readFileSync(join('src', 'lib', 'pricing', 'stages', 'orderStage.ts'), 'utf8');
  assert.match(inhalt, /steuersatzFuer/, 'orderStage muss die zentrale Auflösung verwenden');
  assert.doesNotMatch(inhalt, /taxPercent/, 'orderStage darf keinen eigenen Satz mehr führen');
});
