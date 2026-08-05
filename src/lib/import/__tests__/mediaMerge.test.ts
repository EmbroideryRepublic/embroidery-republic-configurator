/**
 * WÄCHTER der zentralen Mehrquellen-Merge-Logik (ADR 0006).
 *
 * Diese reine Funktion entscheidet, welches Herstellerbild je (Farbe, Ansicht,
 * Rolle) gewinnt und verhindert das Raten von Rück-/Seitenansichten. Ein Fehler
 * hier verfälscht den gesamten späteren Bildbestand – daher fixiert der Test das
 * Verhalten (Priorität, Konfidenz-Wächter, Dublette).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBildReferenzen, farbVollstaendigkeit } from '../mediaMerge';
import type { BildReferenz } from '../imageSource';

function ref(p: Partial<BildReferenz>): BildReferenz {
  return {
    colorId: 'navy',
    view: 'front',
    viewKonfidenz: 'gelabelt',
    rolle: 'ansicht-flach',
    quellUrl: 'https://x/y.jpg',
    quelle: 'hersteller',
    prioritaet: 0,
    herkunft: 'original',
    ...p,
  };
}

test('Hersteller (kleinere Priorität) schlägt Fallback je (Farbe, Ansicht, Rolle)', () => {
  const merged = mergeBildReferenzen([
    ref({ quelle: 'needen.de', prioritaet: 1, quellUrl: 'needen/navy-front.jpg' }),
    ref({ quelle: 'gildan.eu', prioritaet: 0, quellUrl: 'gildan/navy-front.jpg' }),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.quelle, 'gildan.eu');
});

test('Geratene NICHT-Vorderansicht wird verworfen, geratene Vorderansicht bleibt', () => {
  const merged = mergeBildReferenzen([
    ref({ view: 'back', viewKonfidenz: 'inferiert' }), // verworfen
    ref({ view: 'front', viewKonfidenz: 'inferiert' }), // bleibt (repräsentativ)
    ref({ view: 'back', viewKonfidenz: 'gelabelt', quellUrl: 'echt/back.jpg' }), // bleibt
  ]);
  const views = merged.map((r) => r.view).sort();
  assert.deepEqual(views, ['back', 'front']);
  assert.equal(merged.find((r) => r.view === 'back')!.quellUrl, 'echt/back.jpg');
});

test('verschiedene Farben/Ansichten/Rollen bleiben alle erhalten', () => {
  const merged = mergeBildReferenzen([
    ref({ colorId: 'navy', view: 'front' }),
    ref({ colorId: 'navy', view: 'back', viewKonfidenz: 'gelabelt' }),
    ref({ colorId: 'red', view: 'front' }),
    ref({ colorId: 'navy', view: 'front', rolle: 'lifestyle' }),
  ]);
  assert.equal(merged.length, 4);
});

test('inferierbareViews überschreibbar (z. B. Produktgruppe ohne Vorderseite)', () => {
  const merged = mergeBildReferenzen(
    [ref({ view: 'flach', viewKonfidenz: 'inferiert' })],
    ['flach'],
  );
  assert.equal(merged.length, 1);
});

test('Original schlägt Generiert – echtes Foto wird nie durch Visualisierung ersetzt', () => {
  const merged = mergeBildReferenzen([
    ref({ view: 'back', herkunft: 'generiert', prioritaet: 0, quellUrl: 'gen/back.png' }),
    ref({ view: 'back', herkunft: 'original', prioritaet: 9, quellUrl: 'echt/back.jpg' }),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.herkunft, 'original');
  assert.equal(merged[0]!.quellUrl, 'echt/back.jpg');
});

test('Generiert bleibt nur, wo KEIN Original existiert (letzter Fallback)', () => {
  const merged = mergeBildReferenzen([ref({ view: 'back', herkunft: 'generiert', quellUrl: 'gen/back.png' })]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.herkunft, 'generiert');
});

test('farbVollstaendigkeit fasst je Farbe zusammen (front/back + weitere Medien)', () => {
  const v = farbVollstaendigkeit([
    ref({ colorId: 'navy', view: 'front' }),
    ref({ colorId: 'navy', view: 'back' }),
    ref({ colorId: 'navy', view: 'front', rolle: 'lifestyle' }),
    ref({ colorId: 'red', view: 'front' }),
  ]);
  const navy = v.find((f) => f.colorId === 'navy')!;
  assert.ok(navy.hatFront && navy.hatBack);
  assert.equal(navy.weitereMedien, 1);
  const red = v.find((f) => f.colorId === 'red')!;
  assert.ok(red.hatFront && !red.hatBack);
});
