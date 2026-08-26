/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit):
 * Schloss man den Warenkorb-Drawer WÄHREND ein Rechnungskauf-Absendevorgang
 * lief (X/Escape/Overlay-Klick), kehrte `handleSubmit()` wegen des
 * `abgebrochenRef.current`-Unmount-Wächters vorzeitig zurück, BEVOR
 * `resetSubmitGuard()` erreicht wurde – die Absendekennung blieb dauerhaft in
 * `localStorage` stehen. Ein späterer, inhaltlich NEUER Bestellversuch in
 * derselben Sitzung wurde dadurch fälschlich als Wiederholung erkannt: der
 * Server lieferte die ALTE Bestellung zurück, ohne den neuen Warenkorb-Inhalt
 * je zu speichern.
 *
 * Behoben durch `verwirfGespeicherteKennung()` (reine `localStorage`-Op, an
 * keine Hook-Instanz gebunden) – aufgerufen VOR der `abgebrochenRef`-Prüfung.
 *
 * Ein zweiter, beim Schreiben dieses Tests selbst gefundener Bug (nicht Teil
 * der ursprünglichen Diagnose): die Bedingung `result.orderNumber` allein
 * unterscheidet NICHT zwischen dem Rechnungskauf-Erfolg und dem Karte/PayPal-
 * `checkoutUrl`-Zweig – `orders.ts` liefert `orderNumber` bei BEIDEN
 * zusammen mit `checkoutUrl` zurück. Ohne `!result.checkoutUrl` in der
 * Bedingung hätte der Fix selbst den Schutz vor einer doppelten Bestellung
 * bei unterbrochenem Zahlungs-Redirect (dokumentiert wenige Zeilen weiter
 * unten im selben `handleSubmit`) wieder zunichtegemacht.
 *
 * Gleiche Teststrategie wie statusEmailLogging.test.ts: reine Quelltext-
 * Prüfung statt Rendering der React-Komponente – kein Testing-Library-Setup
 * in diesem Projekt für Client-Komponenten, aber die Reihenfolge/Bedingung
 * lässt sich zuverlässig am Quelltext nachweisen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const HOOK = path.join(process.cwd(), 'src', 'lib', 'hooks', 'useSubmitGuard.ts');
const CART_DRAWER = path.join(process.cwd(), 'src', 'components', 'layout', 'CartDrawer.tsx');

const hookQuelltext = readFileSync(HOOK, 'utf8');
const drawerQuelltext = readFileSync(CART_DRAWER, 'utf8');

test('useSubmitGuard.ts exportiert verwirfGespeicherteKennung als reine localStorage-Operation', () => {
  assert.match(
    hookQuelltext,
    /export function verwirfGespeicherteKennung\(schluessel: string\): void \{\s*verwirf\(schluessel\);\s*\}/,
    'muss ausschließlich verwirf() (localStorage.removeItem) aufrufen, keinen React-State ändern – ' +
      'sonst wäre der Aufruf nach einem Unmount der Komponente nicht mehr sicher'
  );
});

test('CartDrawer.tsx: verwirfGespeicherteKennung steht VOR der abgebrochenRef-Prüfung', () => {
  const kennungIndex = drawerQuelltext.indexOf("verwirfGespeicherteKennung('er-absendung-bestellung')");
  const abgebrochenIndex = drawerQuelltext.indexOf('if (abgebrochenRef.current) return;');
  assert.ok(kennungIndex > 0, 'der Aufruf muss existieren');
  assert.ok(abgebrochenIndex > 0, 'der Unmount-Wächter muss existieren');
  assert.ok(
    kennungIndex < abgebrochenIndex,
    'verwirfGespeicherteKennung() muss VOR dem abgebrochenRef-Unmount-Wächter aufgerufen werden – ' +
      'sonst bleibt die Kennung nach einem währenddessen geschlossenen Drawer dauerhaft stehen ' +
      '(Fund vom 2026-08-26)'
  );
});

test('CartDrawer.tsx: die Kennung wird NUR beim Rechnungskauf-Erfolg verworfen, nicht beim Karte/PayPal-Redirect', () => {
  const zeile = drawerQuelltext
    .split('\n')
    .find((z) => z.includes("verwirfGespeicherteKennung('er-absendung-bestellung')"));
  assert.ok(zeile, 'die Aufrufzeile muss existieren');

  const bedingungIndex = drawerQuelltext.lastIndexOf(
    'if (',
    drawerQuelltext.indexOf("verwirfGespeicherteKennung('er-absendung-bestellung')")
  );
  const bedingung = drawerQuelltext.slice(bedingungIndex, drawerQuelltext.indexOf('\n', bedingungIndex));
  assert.match(
    bedingung,
    /!result\.checkoutUrl/,
    'orders.ts liefert orderNumber bei ERFOLG in BEIDEN Zweigen (Rechnungskauf und checkoutUrl) – ' +
      'ohne !result.checkoutUrl würde dieser Block die Absendekennung auch beim Karte/PayPal-Redirect ' +
      'verwerfen und damit den weiter unten dokumentierten Schutz vor einer doppelten Bestellung bei ' +
      'unterbrochenem Redirect aushebeln'
  );
});

test('CartDrawer.tsx: der checkoutUrl-Zweig selbst ruft weder resetSubmitGuard() noch verwirfGespeicherteKennung() auf', () => {
  const checkoutIndex = drawerQuelltext.indexOf('if (result.success && result.checkoutUrl)');
  const naechsteBedingungIndex = drawerQuelltext.indexOf(
    'if (result.success && result.orderNumber)',
    checkoutIndex
  );
  assert.ok(checkoutIndex > 0 && naechsteBedingungIndex > checkoutIndex, 'beide Blöcke müssen existieren');
  const checkoutBlock = drawerQuelltext.slice(checkoutIndex, naechsteBedingungIndex);
  // Zeilenweise prüfen und Kommentarzeilen ausschließen: der bestehende
  // Kommentar erwähnt "resetSubmitGuard() davor" bewusst als Erklärung,
  // WARUM es hier nicht steht – ein reiner Text-Treffer auf der ganzen
  // Blockspanne würde also am eigenen Kommentar scheitern.
  const codeZeilen = checkoutBlock
    .split('\n')
    .filter((z) => !z.trim().startsWith('//'))
    .join('\n');
  assert.doesNotMatch(
    codeZeilen,
    /resetSubmitGuard\(\)|verwirfGespeicherteKennung\(/,
    'der checkoutUrl-Redirect-Zweig darf die Kennung nicht verwerfen – ein unterbrochener Redirect mit ' +
      'anschließendem erneuten Versuch muss dieselbe clientRequestId treffen, sonst entsteht eine zweite Bestellung'
  );
});
