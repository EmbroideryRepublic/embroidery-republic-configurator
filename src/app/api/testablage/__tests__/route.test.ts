/**
 * Regressionstest für den Fund vom 2026-08-31 (Real-User-Flow-Test):
 * `getProductionFileSignedUrl()` lieferte im Testmodus bisher
 * `file://<lokaler-pfad>` zurück. Das ist kein gültiger `src` für
 * `next/image` ("Invalid src prop … hostname \"\" is not configured") –
 * die komplette Admin-Bestelldetailseite stürzte dadurch im Testmodus auf
 * JEDER Bestellung mit Personalisierung ab (500, globales error.tsx),
 * live reproduziert. Browser blockieren `file://`-Abrufe von einer
 * http(s)-Seite ohnehin, ein reines `<img>` hätte also auch nicht geholfen.
 *
 * Diese Route liefert Testablage-Dateien stattdessen über eine echte
 * HTTP-URL aus – ausschließlich im Testmodus, sonst immer 404.
 *
 * ── Warum dieser Test NICHT in [...path]/__tests__ liegt ─────────────────
 * `[...path]` enthält eckige Klammern – dieselbe Zeichenklasse, die
 * Glob-Muster für Zeichenklassen nutzen. Der rekursive Testlauf dieses
 * Projekts (Skript "test" in package.json, sucht *.test.ts-Dateien unter
 * src) findet Dateien UNTERHALB eines solchen Ordners nicht (0 gefundene
 * Tests, keine Fehlermeldung) – ein Test dort würde nie laufen, obwohl er
 * im Repository sichtbar wäre. Deshalb hier, eine Ebene höher, mit einem
 * relativen Import in den Routen-Ordner.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { GET } from '../[...path]/route';

const TESTABLAGE = path.join(process.cwd(), '.testablage', 'production-files');

function setzeTestmodus(aktiv: boolean): void {
  if (aktiv) process.env.E2E_TESTMODUS = 'aktiv';
  else delete process.env.E2E_TESTMODUS;
}

test('außerhalb des Testmodus liefert die Route immer 404 – unabhängig vom Pfad', async () => {
  setzeTestmodus(false);
  const res = await GET(new Request('http://localhost/api/testablage/x'), {
    params: { path: ['orders', 'irgendeine-id', 'produktionsblatt.pdf'] },
  });
  assert.equal(res.status, 404, 'die Testablage existiert außerhalb des Testmodus nicht – nie ausliefern');
});

test('im Testmodus: ein unsicherer Pfad (Verzeichniswechsel) wird abgewiesen', async () => {
  setzeTestmodus(true);
  try {
    const res = await GET(new Request('http://localhost/api/testablage/x'), {
      params: { path: ['..', '..', 'etwas-ausserhalb'] },
    });
    assert.equal(res.status, 404, 'istSichererSpeicherpfad muss denselben Schutz wie beim echten Storage-Bucket bieten');
  } finally {
    setzeTestmodus(false);
  }
});

test('im Testmodus: eine nicht existierende Datei liefert 404, keine Ausnahme', async () => {
  setzeTestmodus(true);
  try {
    const res = await GET(new Request('http://localhost/api/testablage/x'), {
      params: { path: ['orders', 'nicht-vorhanden', 'datei.png'] },
    });
    assert.equal(res.status, 404);
  } finally {
    setzeTestmodus(false);
  }
});

test('im Testmodus: eine vorhandene Datei wird mit korrektem Content-Type ausgeliefert', async () => {
  const relativerPfad = 'orders/regressionstest/produktionsblatt.pdf';
  const absoluterPfad = path.join(TESTABLAGE, ...relativerPfad.split('/'));
  await mkdir(path.dirname(absoluterPfad), { recursive: true });
  await writeFile(absoluterPfad, Buffer.from('%PDF-1.4 Testinhalt'));

  setzeTestmodus(true);
  try {
    const res = await GET(new Request('http://localhost/api/testablage/x'), {
      params: { path: relativerPfad.split('/') },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    const text = await res.text();
    assert.match(text, /Testinhalt/);
  } finally {
    setzeTestmodus(false);
    await rm(path.join(TESTABLAGE, 'orders', 'regressionstest'), { recursive: true, force: true });
  }
});

test('getProductionFileSignedUrl liefert im Testmodus eine absolute HTTP-URL auf diese Route, kein file://', async () => {
  setzeTestmodus(true);
  try {
    const { getProductionFileSignedUrl } = await import('../../../../lib/supabase/storage');
    const url = await getProductionFileSignedUrl('orders/irgendeine-id/produktionsblatt.pdf');
    assert.ok(url, 'muss eine URL liefern (Aufrufer wie die interne Benachrichtigung sollen denselben Zweig wie produktiv durchlaufen)');
    assert.doesNotMatch(url!, /^file:\/\//, 'ein file://-Verweis ist kein gültiger next/image-src und wird von Browsern ohnehin blockiert');
    assert.match(url!, /^https?:\/\/.*\/api\/testablage\//, 'muss auf die neue Route zeigen, absolut (auch für E-Mail-Links nutzbar)');
  } finally {
    setzeTestmodus(false);
  }
});
