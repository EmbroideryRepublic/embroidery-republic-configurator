/**
 * Schriftdateien fürs serverseitige Rendern.
 *
 * Anlass (2026-11-08, ER-2026-F5EE03): Der Knopf "Vorschau & Produktionsblatt
 * neu erzeugen" läuft als Server-Action der Seite /admin/bestellung/[id]. Next
 * packte dort die Schriftdateien nicht mit (24 statt rund 12.000 Dateien im
 * Paket), und resvg lässt Text ohne passende Schrift stillschweigend weg – die
 * neue Vorschau zeigte die Rückseite ohne Text, ohne jede Fehlermeldung, und
 * wurde der Kundschaft zur Freigabe vorgelegt.
 *
 * Zwei Absicherungen, beide hier geprüft:
 *  1. next.config.js packt die Schriften ausdrücklich für diese Seite ein.
 *  2. Fehlen Schriftdateien trotzdem, bricht das Rendern mit einer klaren
 *     Meldung ab, statt ein Bild ohne Text zu liefern.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { getFontFiles, resvgSchriftOptionen } from '../fonts';

test('Alle gebündelten Schriftdateien liegen im Projekt und die Optionen für resvg sind gültig', () => {
  const dateien = getFontFiles();
  assert.equal(dateien.length, 21, 'Arimo, Tinos, Cousine, Gelasio, DejaVu Sans je vier Schnitte plus Anton');
  for (const datei of dateien) assert.ok(existsSync(datei), `fehlt: ${datei}`);
  const optionen = resvgSchriftOptionen();
  assert.equal(optionen.loadSystemFonts, false, 'Systemschriften bleiben aus – das Ergebnis darf nicht vom Server abhängen');
  assert.deepEqual(optionen.fontFiles, dateien);
});

test('Fehlen alle Schriftdateien, bricht das Rendern mit klarer Meldung ab – kein Bild ohne Text', () => {
  assert.throws(
    () => resvgSchriftOptionen(() => false),
    (fehler: unknown) => {
      assert.ok(fehler instanceof Error);
      assert.match(fehler.message, /Schriftdateien fehlen auf dem Server \(21 von 21/);
      assert.match(fehler.message, /Es wurde kein Bild erzeugt/);
      return true;
    }
  );
});

test('Fehlt nur ein Teil der Schriften, wird das genauso gemeldet (Anzahl und Beispiel)', () => {
  assert.throws(
    () => resvgSchriftOptionen((pfad) => !pfad.endsWith('Anton-Regular.ttf')),
    /Schriftdateien fehlen auf dem Server \(1 von 21, z\. B\. Anton-Regular\.ttf\)/
  );
});

test('Der Grund für die Absicherung stimmt: resvg lässt Text ohne Schriftdatei stillschweigend weg', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><text x="10" y="60" font-size="48" font-family="Anton" fill="#000">Team</text></svg>';
  const ohne = new Resvg(svg, { font: { fontFiles: [], loadSystemFonts: false, defaultFontFamily: 'Arimo' } });
  assert.equal(ohne.getBBox(), undefined, 'ohne Schrift: kein Fehler, aber auch kein Text');
  const mit = new Resvg(svg, { font: resvgSchriftOptionen() });
  assert.ok(mit.getBBox() && mit.getBBox()!.width > 20, 'mit Schrift: der Text ist da');
});

test('next.config.js packt die Schriften ausdrücklich für die Admin-Bestellseite ein, und der Pfad stimmt', () => {
  const konfig = readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
  assert.match(konfig, /outputFileTracingIncludes:\s*\{/);
  assert.match(konfig, /'\/admin\/bestellung\/\\\\\[id\\\\\]':\s*\['\.\/src\/lib\/rendering\/assets\/fonts\/\*\*\/\*'\]/);
  // Das eingebundene Verzeichnis ist wirklich das, aus dem fonts.ts liest.
  assert.ok(existsSync(path.join(process.cwd(), 'src', 'lib', 'rendering', 'assets', 'fonts', 'Anton-Regular.ttf')));
});
