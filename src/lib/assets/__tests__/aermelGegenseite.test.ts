/**
 * Ärmelfotos: Wo es nur die Aufnahme EINER Seite gibt, steht die Gegenseite gespiegelt bereit.
 *
 * Viele Lieferanten fotografieren nur einen Ärmel. Ohne Gegenseite blieb "Ärmel rechts" im Konfigurator verborgen
 * (die Ansicht erscheint nur, wenn JEDE wählbare Farbe ein Foto hat). `scripts/spiegleAermel.mjs` legt die fehlende
 * Seite durch horizontales Spiegeln an (.webp + .png) und führt Buch in `scripts/assetSpiegelungen.json`.
 *
 * Dieser Test fällt auf, sobald nach einem Bildimport wieder eine Farbe mit nur einem Ärmelfoto im Shop steht oder
 * eine Spiegelung veraltet ist (Quelle neu importiert/korrigiert). Abhilfe: "node scripts/spiegleAermel.mjs anlegen",
 * dann Manifest und Druckflächen neu erzeugen (siehe scripts/import/ABLAUF.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { ASSET_MANIFEST } from '../assetManifest.generated';
import { rasterPfad } from '../index';

const WURZEL = process.cwd();
const SKRIPT = path.join(WURZEL, 'scripts', 'spiegleAermel.mjs');
const LEDGER = path.join(WURZEL, 'scripts', 'assetSpiegelungen.json');

test('keine Farbe hat nur ein Ärmelfoto, und keine Spiegelung ist veraltet', () => {
  const lauf = spawnSync(process.execPath, [SKRIPT, 'pruefen'], { cwd: WURZEL, encoding: 'utf8', timeout: 120_000 });
  assert.equal(
    lauf.status,
    0,
    `Ärmelfotos ohne Gegenseite oder veraltete Spiegelung. Behebung: "node scripts/spiegleAermel.mjs anlegen", ` +
      `danach "npx tsx scripts/generateAssetManifest.mts" und "npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts".\n${lauf.stdout}${lauf.stderr}`
  );
});

test('jede gespiegelte Datei liegt als .webp und .png vor, hat die Maße ihrer Quelle und steht im Manifest', () => {
  const ledger = JSON.parse(readFileSync(LEDGER, 'utf8')) as Record<string, { quelle: string; sha: string }>;
  const ziele = Object.keys(ledger);
  assert.ok(ziele.length > 0, 'Ledger ist leer – der Test liefe sonst grün, ohne etwas zu prüfen');

  const imManifest = new Set<string>();
  for (const farben of Object.values(ASSET_MANIFEST)) {
    for (const e of Object.values(farben)) for (const pfad of Object.values(e.views)) imManifest.add(pfad);
  }

  for (const ziel of ziele) {
    const quelle = ledger[ziel]!.quelle;
    for (const [z, q] of [
      [ziel, quelle],
      [rasterPfad(ziel), rasterPfad(quelle)],
    ] as const) {
      const zielDatei = path.join(WURZEL, 'public', z);
      const quellDatei = path.join(WURZEL, 'public', q);
      assert.ok(existsSync(zielDatei), `Gespiegelte Datei fehlt: ${z}`);
      assert.ok(existsSync(quellDatei), `Quelle der Spiegelung fehlt: ${q}`);
      const a = imageSize(readFileSync(zielDatei));
      const b = imageSize(readFileSync(quellDatei));
      assert.deepEqual([a.width, a.height], [b.width, b.height], `${z}: Maße weichen von der Quelle ab`);
    }
    assert.ok(imManifest.has(ziel), `${ziel} steht nicht im Asset-Manifest – "npx tsx scripts/generateAssetManifest.mts" ausführen`);
  }
});
