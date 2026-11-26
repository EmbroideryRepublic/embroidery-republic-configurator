/**
 * Auf keinem Produktbild darf ein Mensch zu sehen sein (Vorgabe des Inhabers, 2026-11-26).
 *
 * Hintergrund: Bei 6 Produkten (Gildan Light Cotton, Softstyle Polo, V-Neck, Damenpolo, Hammer Hoodie, EarthPositive
 * Super Heavy Hoodie) standen 45 Vorderseiten-Fotos mit Person im Shop; der Hautton-Audit hatte sie nicht gefunden.
 * `scripts/personenPruefung.py` prüft jedes Bild mit einem lokalen Objektdetektor und schreibt das Ergebnis samt
 * SHA-1 nach `scripts/import/personenpruefung.json`.
 *
 * Dieser Test verlangt für JEDES Bild im Asset-Manifest einen aktuellen Eintrag (gleicher SHA-1) ohne Person. Ein neu
 * importiertes oder verändertes Bild ohne Eintrag lässt den Test fehlschlagen – dann das Skript laufen lassen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ASSET_MANIFEST } from '../assetManifest.generated';

const SCHWELLE = 0.995;
const ASPEKT_MIN = 1.5;
const ASPEKT_MAX = 2.6;
const ERGEBNIS = path.join(process.cwd(), 'scripts', 'import', 'personenpruefung.json');
const BILDER = path.join(process.cwd(), 'public', 'products');

type Eintrag = [string, number, number]; // [sha1(12), Wahrscheinlichkeit, Seitenverhältnis]

function manifestBilder(): string[] {
  const alle = new Set<string>();
  for (const farben of Object.values(ASSET_MANIFEST)) {
    for (const f of Object.values(farben)) {
      for (const pfad of Object.values(f.views)) {
        if (pfad.startsWith('/products/') && !pfad.includes('/_platzhalter/')) alle.add(pfad.slice('/products/'.length));
      }
    }
  }
  return [...alle].sort();
}

test('Kein Produktbild im Manifest zeigt einen Menschen', () => {
  assert.ok(existsSync(ERGEBNIS), 'scripts/import/personenpruefung.json fehlt – "python scripts/personenPruefung.py" ausführen');
  const dateien = (JSON.parse(readFileSync(ERGEBNIS, 'utf-8')) as { dateien: Record<string, Eintrag> }).dateien;
  const ungeprueft: string[] = [];
  const personen: string[] = [];
  for (const rel of manifestBilder()) {
    const datei = path.join(BILDER, rel);
    if (!existsSync(datei)) continue; // fehlende Dateien meldet der Asset-Vollständigkeitsbericht
    const e = dateien[rel];
    const sha = createHash('sha1').update(readFileSync(datei)).digest('hex').slice(0, 12);
    if (!e || e[0] !== sha) {
      ungeprueft.push(rel);
      continue;
    }
    if (e[1] >= SCHWELLE && e[2] >= ASPEKT_MIN && e[2] <= ASPEKT_MAX) personen.push(`${rel} (${e[1]}, ${e[2]})`);
  }
  assert.equal(
    ungeprueft.length,
    0,
    `${ungeprueft.length} Bild(er) ohne aktuelle Personenprüfung – "python scripts/personenPruefung.py" ausführen:\n${ungeprueft.slice(0, 15).join('\n')}`
  );
  assert.equal(personen.length, 0, `Menschen auf Produktfotos gefunden – durch freigestellte Fotos ersetzen:\n${personen.join('\n')}`);
});
