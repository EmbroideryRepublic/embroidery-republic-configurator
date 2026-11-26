/**
 * Bild-Einträge der Sitemap: jede Produktseite meldet echte, vorhandene Fotos – keinen Platzhalter, keine Dubletten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '@/config/products';
import { PLATZHALTER_BILD } from '@/lib/assets';
import { MAX_BILDER_JE_SEITE, sitemapBilder } from '../sitemapBilder';
import sitemap from '@/app/sitemap';

const BASIS = 'https://www.ergermany.de';

test('jedes Produkt mit echtem Foto meldet Bilder: absolut, eindeutig, vorhanden, kein Platzhalter', () => {
  let mitBildern = 0;
  for (const p of PRODUCTS) {
    const bilder = sitemapBilder(p, BASIS);
    assert.ok(bilder.length <= MAX_BILDER_JE_SEITE, `${p.id}: zu viele Bilder (${bilder.length})`);
    assert.equal(new Set(bilder).size, bilder.length, `${p.id}: doppelte Bild-URL`);
    for (const url of bilder) {
      assert.ok(url.startsWith(`${BASIS}/products/`), `${p.id}: ${url} nicht unter ${BASIS}/products/`);
      assert.ok(!url.includes(PLATZHALTER_BILD), `${p.id}: Platzhalter in der Sitemap`);
      const datei = path.join(process.cwd(), 'public', url.slice(BASIS.length));
      assert.ok(existsSync(datei), `${p.id}: Datei fehlt – ${datei}`);
    }
    if (bilder.length > 0) mitBildern++;
  }
  assert.ok(mitBildern >= 150, `nur ${mitBildern} Produkte mit Bildern in der Sitemap`);
});

test('die Sitemap trägt die Bilder an den Produkt-URLs, nicht an anderen Seiten', () => {
  const eintraege = sitemap();
  const produktEintraege = eintraege.filter((e) => e.url.includes('/produkt/'));
  assert.ok(produktEintraege.length >= 150);
  assert.ok(produktEintraege.filter((e) => (e.images?.length ?? 0) > 0).length >= 150);
  for (const e of eintraege) if (!e.url.includes('/produkt/')) assert.equal(e.images, undefined, `${e.url}: Bilder an einer Nicht-Produktseite`);
});
