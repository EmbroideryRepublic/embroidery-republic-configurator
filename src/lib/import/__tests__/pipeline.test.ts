/**
 * WÄCHTER der Pipeline-Orchestrierung (ADR 0006): mehrere Quellen zusammenführen,
 * jede Farbe im Manifest vertreten, Priorität/Status korrekt – ohne Netzwerk/FS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { baueProduktManifest } from '../pipeline';
import type { ImageSource, BildReferenz, ImportProduktRef } from '../imageSource';
import type { VerarbeiteteReferenz } from '../manifestV2';

function bref(p: Partial<BildReferenz>): BildReferenz {
  return {
    colorId: 'navy', view: 'front', viewKonfidenz: 'gelabelt', rolle: 'ansicht-flach',
    herkunft: 'original', quelle: 'q', prioritaet: 0, quellUrl: 'https://x/y.jpg', ...p,
  };
}
function quelle(name: string, prio: number, refs: BildReferenz[]): ImageSource {
  return { quelle: name, prioritaet: prio, bilderFuer: async () => refs };
}
// Fake-Verarbeiter: kein Download/FS, nur Speicherort + Version zuweisen.
const verarbeite = async (r: BildReferenz): Promise<VerarbeiteteReferenz> => ({
  ...r, browserPfad: `/products/p-${r.colorId}/${r.view}.webp`, version: `v-${r.view}`,
});

const produkt: ImportProduktRef = {
  id: 'p', brand: 'Gildan',
  colors: [
    { id: 'navy', name: 'Navy', hex: '#001' },
    { id: 'red', name: 'Red', hex: '#f00' },
    { id: 'black', name: 'Black', hex: '#000' },
  ],
};

test('mehrere Quellen zusammengeführt; jede Farbe im Manifest; Status korrekt', async () => {
  const hersteller = quelle('gildan.eu', 0, [
    bref({ colorId: 'navy', view: 'front', quelle: 'gildan.eu', quellUrl: 'g/navy-front' }),
    bref({ colorId: 'navy', view: 'back', quelle: 'gildan.eu', quellUrl: 'g/navy-back' }),
    bref({ colorId: 'red', view: 'front', quelle: 'gildan.eu', quellUrl: 'g/red-front' }),
  ]);
  const fallback = quelle('needen.de', 1, [
    bref({ colorId: 'navy', view: 'front', quelle: 'needen.de', prioritaet: 1, quellUrl: 'n/navy-front' }),
  ]);

  const m = await baueProduktManifest(produkt, [hersteller, fallback], verarbeite);

  // jede Farbe vertreten
  assert.deepEqual(Object.keys(m).sort(), ['black', 'navy', 'red']);
  // navy: real, front+back, front vom Hersteller (Priorität)
  assert.equal(m.navy!.status, 'real');
  assert.deepEqual(Object.keys(m.navy!.views).sort(), ['back', 'front']);
  assert.equal(m.navy!.assets.find((a) => a.view === 'front')!.quelle, 'gildan.eu');
  // red: real, nur front
  assert.equal(m.red!.status, 'real');
  assert.deepEqual(Object.keys(m.red!.views), ['front']);
  // black: keine Quelle → platzhalter
  assert.equal(m.black!.status, 'platzhalter');
  assert.deepEqual(m.black!.views, {});
});

test('geratene Rückansicht wird verworfen (Wächter greift auch in der Pipeline)', async () => {
  const q = quelle('x', 0, [
    bref({ colorId: 'navy', view: 'front' }),
    bref({ colorId: 'navy', view: 'back', viewKonfidenz: 'inferiert' }),
  ]);
  const m = await baueProduktManifest(produkt, [q], verarbeite);
  assert.deepEqual(Object.keys(m.navy!.views), ['front']);
});
