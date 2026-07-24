/**
 * Wächter für den pdf.js-Worker.
 *
 * Der Worker wird NICHT von einem CDN geladen, sondern liegt als Kopie unter
 * `public/pdf.worker.min.mjs`. Grund: Die frühere cdnjs-Adresse wurde aus der
 * Paketversion zusammengebaut und zeigte seit pdfjs-dist 4 auf eine Datei, die
 * es dort nicht mehr gibt (`.js` statt `.mjs`) – nachweislich HTTP 404, der
 * PDF-Upload war defekt.
 *
 * Eine Kopie kann veralten. Diese Prüfung schlägt an, sobald ein Update von
 * pdfjs-dist die Paketdatei ändert, ohne dass die Kopie erneuert wurde:
 *
 *     cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PAKET = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
const KOPIE = 'public/pdf.worker.min.mjs';

const pruefsumme = (pfad: string) =>
  createHash('sha256').update(readFileSync(pfad)).digest('hex');

test('die ausgelieferte Worker-Kopie existiert', () => {
  assert.ok(existsSync(KOPIE), `${KOPIE} fehlt – PDF-Upload würde brechen.`);
});

test('die Kopie ist identisch mit der Datei aus pdfjs-dist', (t) => {
  if (!existsSync(PAKET)) {
    t.skip('pdfjs-dist nicht installiert (node_modules fehlt)');
    return;
  }
  assert.equal(
    pruefsumme(KOPIE),
    pruefsumme(PAKET),
    'Worker-Kopie veraltet. Neu kopieren:\n' +
      '  cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs'
  );
});

test('der Worker wird von der eigenen Domain geladen, nicht von einem CDN', () => {
  const quelle = readFileSync('src/lib/upload/fileToImage.ts', 'utf8');
  const zuweisung = quelle.match(/GlobalWorkerOptions\.workerSrc\s*=\s*([^;]+);/);
  assert.ok(zuweisung, 'workerSrc-Zuweisung nicht gefunden');
  assert.ok(
    !/https?:\/\//.test(zuweisung[1]!),
    `workerSrc darf auf keine fremde Adresse zeigen, gefunden: ${zuweisung[1]!.trim()}`
  );
});
