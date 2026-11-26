/**
 * Helle Ware auf dunklem Hintergrund (Anzeige-Bilder, scripts/dunkleHintergruende.mts):
 *  – jede gelistete Variante existiert, hat dieselben Maße wie das Original und gehört zu einer echten Ansicht,
 *  – die Anzeige wählt die Varianten, alles andere (Strukturierte Daten, Sitemap, Merchant-Feed, Rendering) bleibt bei den Originalen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import { ASSET_MANIFEST } from '../assetManifest.generated';
import { DUNKLER_HINTERGRUND } from '../dunklerHintergrund.generated';
import { DUNKEL_ENDUNG, hatDunkleAnsicht, hatDunklenHintergrund, resolveAnzeigeBilder, resolveColorImages, anzeigeBildFuerAnsicht, bildFuerAnsicht } from '..';
import { PRODUCTS } from '@/config/products';
import { sitemapBilder } from '@/lib/seo/sitemapBilder';
import { feedEintraege } from '@/lib/seo/merchantFeed';

const PUBLIC = path.join(process.cwd(), 'public');

test('jede gelistete dunkle Variante: echte Ansicht, Datei vorhanden, gleiche Maße wie das Original', async () => {
  let anzahl = 0;
  for (const [produktId, farben] of Object.entries(DUNKLER_HINTERGRUND)) {
    for (const [farbeId, ansichten] of Object.entries(farben)) {
      const eintrag = ASSET_MANIFEST[produktId]?.[farbeId];
      assert.ok(eintrag && eintrag.status === 'real', `${produktId}/${farbeId}: keine echte Farbe im Manifest`);
      assert.ok(ansichten.includes('front'), `${produktId}/${farbeId}: Variante ohne Vorderansicht (Container-Hintergrund bräuchte sie)`);
      for (const view of ansichten) {
        const original: string | undefined = eintrag.views[view];
        assert.ok(original, `${produktId}/${farbeId}: Ansicht ${view} fehlt im Manifest`);
        const dunkel = path.join(PUBLIC, original.replace(/\.webp$/i, `${DUNKEL_ENDUNG}.webp`));
        assert.ok(existsSync(dunkel), `${produktId}/${farbeId}/${view}: Datei fehlt – ${dunkel}`);
        const a: Metadata = await sharp(path.join(PUBLIC, original)).metadata();
        const b: Metadata = await sharp(dunkel).metadata();
        assert.deepEqual([b.width, b.height], [a.width, a.height], `${produktId}/${farbeId}/${view}: Maße weichen vom Original ab`);
        anzahl++;
      }
    }
  }
  assert.ok(anzahl >= 1500, `nur ${anzahl} dunkle Ansichten`);
});

test('Anzeige wählt die dunkle Variante, die Originalauflösung bleibt unverändert', () => {
  const [produktId, farben] = Object.entries(DUNKLER_HINTERGRUND)[0]!;
  const [farbeId, ansichten] = Object.entries(farben)[0]!;
  const original = resolveColorImages(produktId, farbeId);
  const anzeige = resolveAnzeigeBilder(produktId, farbeId);
  for (const view of Object.keys(original)) {
    if (ansichten.includes(view)) {
      assert.equal(anzeige[view], original[view]!.replace(/\.webp$/i, `${DUNKEL_ENDUNG}.webp`));
      assert.ok(hatDunkleAnsicht(produktId, farbeId, view));
    } else assert.equal(anzeige[view], original[view]);
    assert.ok(!original[view]!.includes(DUNKEL_ENDUNG), 'das Manifest darf nie auf eine Variante zeigen');
  }
  assert.equal(anzeigeBildFuerAnsicht(produktId, farbeId, 'front'), anzeige['front']);
  assert.equal(bildFuerAnsicht(produktId, farbeId, 'front'), original['front']);
  assert.ok(hatDunklenHintergrund(produktId, farbeId));
  // Eine dunkle Farbe (kein Eintrag) bleibt beim Original
  assert.equal(hatDunklenHintergrund('fotl-heavy-t', 'black'), false);
  assert.equal(resolveAnzeigeBilder('fotl-heavy-t', 'black')['front'], resolveColorImages('fotl-heavy-t', 'black')['front']);
});

test('Sitemap und Merchant-Feed geben nie eine dunkle Variante weiter (Google erwartet weißen Grund)', () => {
  const basis = 'https://www.ergermany.de';
  for (const p of PRODUCTS) {
    for (const url of sitemapBilder(p, basis)) assert.ok(!url.includes(DUNKEL_ENDUNG), `${p.id}: ${url}`);
    for (const e of feedEintraege(p, basis)) for (const url of [e.bild, ...e.weitereBilder]) assert.ok(!url.includes(DUNKEL_ENDUNG), `${p.id}: ${url}`);
  }
});

test('mindestens 500 Farben haben dunkle Varianten, Zweifarb-Produkte keine', () => {
  const farben = Object.values(DUNKLER_HINTERGRUND).reduce((s, f) => s + Object.keys(f).length, 0);
  assert.ok(farben >= 500, `nur ${farben} Farben`);
  for (const id of ['fotl-baseball-t', 'fotl-baseball-longsleeve', 'justhoods-contrast-hoodie']) assert.equal(DUNKLER_HINTERGRUND[id], undefined, `${id} ist zweifarbig`);
});
