/**
 * Regressionstest für den beim Go-Live-Abnahmetest vom 2026-09-01 real
 * reproduzierten Fund: `loadGarmentImageInfo()` ging bislang davon aus,
 * public/-Dateien seien zur Laufzeit IMMER lokal von der Platte lesbar,
 * auch in Vercels Serverless-Deployments. Das stimmte nicht – Next.js'
 * Output File Tracing nimmt einen zur Laufzeit aus einer Zeichenkette
 * zusammengesetzten Pfad nicht automatisch ins Bundle auf. Reale Folge:
 * jede Druckvorschau für ein reales Produktfoto (.webp) scheiterte in
 * Produktion mit "PNG-Geschwister fehlt", obwohl die Datei sowohl im
 * Repository als auch über die öffentliche URL erreichbar war.
 *
 * Fix: lokal lesen, bei Fehlschlag über die eigene öffentliche URL
 * nachladen (leseAusPublicOrderHttp() in garmentImageInfo.ts). Diese Tests
 * mocken global.fetch statt echte Netzwerkaufrufe zu machen – Muster wie in
 * lib/payments/providers/__tests__/paypal.test.ts.
 */
import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadGarmentImageInfo } from '../garmentImageInfo';

const ECHTES_PRODUKTFOTO = '/products/fotl-heavy-t/front.webp';
const ECHTER_PNG_PFAD = path.join(process.cwd(), 'public', 'products', 'fotl-heavy-t', 'front.png');

let echterFetch: typeof fetch;

beforeEach(() => {
  echterFetch = global.fetch;
});

afterEach(() => {
  global.fetch = echterFetch;
  mock.restoreAll();
});

test('lokal vorhandene Datei wird ohne Netzwerkaufruf gelesen (schneller Regelfall)', async () => {
  const fetchMock = mock.fn(() => {
    throw new Error('fetch hätte hier nicht aufgerufen werden dürfen – die lokale Datei existiert.');
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  const info = await loadGarmentImageInfo(ECHTES_PRODUKTFOTO);
  assert.equal(info.kind, 'raster');
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('fehlt die Datei lokal, wird sie über die eigene öffentliche URL nachgeladen', async () => {
  const echterInhalt = await readFile(ECHTER_PNG_PFAD);
  const fetchMock = mock.fn(async () => new Response(echterInhalt, { status: 200 }));
  global.fetch = fetchMock as unknown as typeof fetch;

  // Ein Pfad, der lokal garantiert nicht existiert – erzwingt den HTTP-Rückfall.
  const info = await loadGarmentImageInfo('/products/nicht-existent-fuer-diesen-test/front.webp');

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(info.kind, 'raster');
  assert.ok(info.naturalWidth > 0 && info.naturalHeight > 0);
});

test('scheitert sowohl der lokale Zugriff als auch der HTTP-Rückfall, bleibt die Fehlermeldung auf die fehlende Konvertierung hin', async () => {
  const fetchMock = mock.fn(async () => new Response('nicht gefunden', { status: 404 }));
  global.fetch = fetchMock as unknown as typeof fetch;

  await assert.rejects(
    () => loadGarmentImageInfo('/products/nicht-existent-fuer-diesen-test/front.webp'),
    /PNG-Geschwister.*fehlt.*convertGarmentWebpToPng\.mjs/
  );
});
