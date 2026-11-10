/**
 * Ärmelfotos: "sleeve-left" muss die LINKE Seite des Trägers zeigen, "sleeve-right" die rechte.
 *
 * Fund vom 2026-11-10: Im Admin stand "Ärmel links" über einem Foto, das den rechten Ärmel zeigt. Der Bildimport hatte
 * das Seitenfoto des Lieferanten unbesehen als "links" abgelegt; je Lieferant zeigte es mal die eine, mal die andere
 * Seite. Bei rund zwei Dritteln der Farbvarianten widersprach das Foto der Bezeichnung – im Konfigurator genauso wie
 * im Admin und im Produktionsblatt.
 *
 * Dieser Test führt dieselbe Erkennung wie `scripts/aermelSeiten.mjs` aus und schlägt an, sobald irgendwo wieder ein
 * Foto steht, das der Bezeichnung widerspricht – etwa nach einem neuen Bildimport. Abhilfe steht in der Meldung.
 * Produkte mit zu schwachem Signal (fast symmetrische Teile) prüft die Erkennung bewusst nicht; sie werden im
 * Skript-Bericht aufgelistet.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SKRIPT = path.join(process.cwd(), 'scripts', 'aermelSeiten.mjs');

test('Kein Ärmelfoto widerspricht seiner Bezeichnung (links zeigt links, rechts zeigt rechts)', () => {
  assert.ok(existsSync(SKRIPT), 'scripts/aermelSeiten.mjs fehlt');
  const lauf = spawnSync(process.execPath, [SKRIPT, 'pruefen'], { cwd: process.cwd(), encoding: 'utf8', timeout: 240_000 });
  assert.equal(
    lauf.status,
    0,
    `Ärmelfotos mit falscher Seite gefunden. Behebung: "node scripts/aermelSeiten.mjs korrigieren", danach ` +
      `"npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts".\n${lauf.stdout}${lauf.stderr}`
  );
});

test('Das Prüfskript beschreibt die Festlegung und die Grenzen der Erkennung', () => {
  const quelltext = readFileSync(SKRIPT, 'utf8');
  assert.match(quelltext, /`sleeve-left` zeigt IMMER die linke Seite des Trägers/);
  assert.match(quelltext, /Produkte mit schwachem[\s*]+Signal/, 'die Grenze der Erkennung muss im Kopfkommentar stehen');
});
