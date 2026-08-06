/**
 * WÄCHTER gegen Platzhalter-Silhouetten in der Shop-Oberfläche.
 *
 * Hintergrund: Die Katalogpaletten führen ALLE Herstellerfarben, echte Fotos gibt
 * es aber nur für die wichtigsten. Wer für ein Produkt „ein Bild" braucht (Kachel,
 * Produktseite, Vergleich, SEO, Konfigurator-Start), darf deshalb NICHT stumpf
 * `colors[0]` nehmen – diese Farbe hat häufig kein Foto. Genau das führte dazu,
 * dass 37 Produkte im Shop eine Silhouette zeigten, obwohl echte Fotos vorlagen.
 *
 * Diese Tests halten die Regel fest: solange ein Produkt IRGENDEINE Farbe mit
 * echten Fotos hat, muss sein Repräsentativbild ein echtes Foto sein.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { ASSET_MANIFEST } from '@/lib/assets/assetManifest.generated';
import { produktBild, repraesentativeFarbe, PLATZHALTER_BILD } from '@/lib/assets';

test('kein Produkt mit echten Fotos zeigt ein Platzhalterbild', () => {
  const mitPlatzhalter = PRODUCTS.filter((p) => {
    const hatEchte = Object.values(ASSET_MANIFEST[p.id] ?? {}).some((e) => e.status === 'real');
    return hatEchte && produktBild(p.id, p.colors) === PLATZHALTER_BILD;
  }).map((p) => p.id);

  assert.deepEqual(
    mitPlatzhalter,
    [],
    `Diese Produkte haben echte Fotos, zeigen aber den Platzhalter: ${mitPlatzhalter.join(', ')}`
  );
});

test('repraesentativeFarbe waehlt eine Farbe mit echten Fotos', () => {
  for (const p of PRODUCTS) {
    const echteFarben = Object.entries(ASSET_MANIFEST[p.id] ?? {})
      .filter(([, e]) => e.status === 'real')
      .map(([cid]) => cid);
    if (!echteFarben.length) continue;

    const gewaehlt = repraesentativeFarbe(p.id, p.colors);
    assert.ok(gewaehlt, `${p.id}: keine Farbe gewaehlt`);
    assert.ok(
      echteFarben.includes(gewaehlt.id),
      `${p.id}: gewaehlt wurde "${gewaehlt.id}" ohne echtes Foto (echte Farben: ${echteFarben.join(', ')})`
    );
  }
});

test('repraesentativeFarbe faellt auf die erste Farbe zurueck, wenn keine Fotos existieren', () => {
  const farben = [{ id: 'a' }, { id: 'b' }];
  assert.equal(repraesentativeFarbe('gibt-es-nicht', farben)?.id, 'a');
  assert.equal(repraesentativeFarbe('gibt-es-nicht', []), undefined);
});
