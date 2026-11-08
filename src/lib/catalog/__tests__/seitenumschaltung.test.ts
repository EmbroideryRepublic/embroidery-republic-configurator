/**
 * Seitenumschaltung der Produktübersicht (/produkt).
 *
 * Wer ganz unten auf die Seitenzahl "2" klickt, soll oben bei den ersten
 * Produkten der neuen Seite ankommen – nicht unten in der Fußzeile stehen
 * bleiben. Die Seitenzahlen waren Links mit `scroll={false}` (Next behält dann
 * die Scrollposition); entfernt am 2026-11-08. Im Browser geprüft: von ganz
 * unten (Scrollposition 4862) nach dem Klick auf "2" auf 0.
 *
 * Die Filter weiter oben behalten ihre Position bewusst (router.replace mit
 * `scroll: false`, components/shop/filterNavigation.ts): Wer einen Filter
 * umstellt, bleibt vor der Liste – das ist ein anderes Verhalten und soll so
 * bleiben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function quelltext(...teile: string[]): string {
  return readFileSync(path.join(process.cwd(), ...teile), 'utf8');
}

test('Die Seitenzahlen unter der Produktliste springen nach oben (kein scroll={false})', () => {
  const seite = quelltext('src', 'app', 'produkt', 'page.tsx');
  const start = seite.indexOf('aria-label="Seiten"');
  assert.ok(start > 0, 'die Seitenumschaltung ist da');
  const ende = seite.indexOf('</nav>', start);
  const umschaltung = seite.slice(start, ende);
  assert.match(umschaltung, /<Link/, 'die Seitenzahlen sind normale Links');
  assert.match(umschaltung, /seite: nr/, 'jeder Link führt auf eine bestimmte Seite');
  // Der Kommentar im Quelltext erwähnt den Ausdruck, deshalb erst Kommentare entfernen.
  const ohneKommentare = umschaltung.replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(ohneKommentare, /scroll=\{\s*false\s*\}/, 'sonst bliebe die Seite beim Umschalten unten stehen');
});

test('Die Filter behalten ihre Position (anderes Verhalten, bleibt wie es ist)', () => {
  const filter = quelltext('src', 'components', 'shop', 'filterNavigation.ts');
  assert.match(filter, /router\.replace\([^)]*\{\s*scroll:\s*false\s*\}\)/);
});
