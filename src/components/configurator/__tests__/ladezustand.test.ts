/**
 * Ladezustand des Konfigurators (Layout-Verschiebung der Fußzeile, Messung 2026-11-25).
 *
 * Vor dem Laden (Hydration) zeigt der Konfigurator nur Kopfzeile + Platzhalter, danach die ganze, viel höhere Oberfläche.
 * War der Platzhalter nur 500 px hoch, stand die Fußzeile im ersten Bild noch im sichtbaren Bereich und sprang danach
 * unter den Rand: Lighthouse mobil CLS 0,254 (Leistung 60–66), Desktop 0,11–0,15. Die Mindesthöhe in Bildschirmhöhe
 * hält die Fußzeile vor und nach dem Laden außerhalb des Sichtbereichs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Zeilenenden vereinheitlichen: Die Quelldatei hat unter Windows CRLF, die Suche unten arbeitet mit \n.
const quelle = readFileSync('src/components/configurator/ConfiguratorPrototype.tsx', 'utf8').replace(/\r\n/g, '\n');

/** Der Block `if (!isHydrated) { … }` – der Platzhalter vor dem Laden. */
function platzhalter(): string {
  const start = quelle.indexOf('if (!isHydrated) {');
  assert.ok(start > 0, 'Platzhalter-Block nicht gefunden');
  const ende = quelle.indexOf('\n  }\n', start);
  assert.ok(ende > start, 'Ende des Platzhalter-Blocks nicht gefunden');
  return quelle.slice(start, ende);
}

test('Konfigurator-Platzhalter vor dem Laden füllt die Bildschirmhöhe (Fußzeile springt nicht in den Sichtbereich)', () => {
  const block = platzhalter();
  assert.match(block, /min-h-screen/, 'Platzhalter muss mindestens bildschirmhoch sein');
  assert.ok(!/min-h-\[\d+px\]/.test(block), 'keine feste Pixel-Mindesthöhe: auf Handys lag die Fußzeile dann im sichtbaren Bereich');
});

test('Der Platzhalter behält Kopfzeile und Ladetext (nichts anderes ändert sich im Ladezustand)', () => {
  const block = platzhalter();
  assert.match(block, /<SiteHeader onCartClick=\{handleOpenCart\} \/>/);
  assert.match(block, /t\('canvas_loading'\)/);
});
