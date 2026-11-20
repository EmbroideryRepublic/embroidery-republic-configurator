/**
 * Einkaufs-Direktlinks (lib/suppliers/bestelllinks.ts, Daten in bezugsquellen.generated.ts).
 *
 * Schützt vor dem Fall, der den Auftrag ausgelöst hat: „bei manchen Produkten gibt es den Link, bei manchen nicht“. Jedes Produkt des
 * Katalogs muss einen Eintrag haben; jede Adresse muss echt aussehen; wo es keinen Direktlink gibt, muss ein Hinweis stehen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { BEZUGSQUELLEN } from '../bezugsquellen.generated';
import { bestellhilfe, groessenText, lshopSuchUrl, textilGrosshandelSuchUrl } from '../bestelllinks';

test('jedes Katalogprodukt hat eine Bezugsquelle mit Artikelnummer – und es gibt keine verwaisten Einträge', () => {
  const katalog = new Set(PRODUCTS.map((p) => p.id));
  const fehlen = PRODUCTS.filter((p) => !BEZUGSQUELLEN[p.id]).map((p) => p.id);
  assert.deepEqual(fehlen, [], `Produkte ohne Bezugsquelle (in bezugsquellen.generated.ts ergänzen): ${fehlen.join(', ')}`);
  const verwaist = Object.keys(BEZUGSQUELLEN).filter((id) => !katalog.has(id));
  assert.deepEqual(verwaist, [], `Einträge ohne Katalogprodukt: ${verwaist.join(', ')}`);
  for (const [id, q] of Object.entries(BEZUGSQUELLEN)) {
    assert.ok(q.art && q.art.trim() === q.art && q.art.length >= 2, `${id}: Artikelnummer fehlt oder ist unsauber`);
  }
});

test('Adressen: https, richtige Seite, keine Platzhalter', () => {
  for (const [id, q] of Object.entries(BEZUGSQUELLEN)) {
    if (q.tg) {
      assert.match(q.tg, /^https:\/\/www\.textil-grosshandel\.eu\/[a-z0-9.\-]+\/[a-z0-9.\-]+$/i, `${id}: ungewöhnliche TG-Adresse ${q.tg}`);
      assert.ok(q.tg.toLowerCase().endsWith('/' + q.art.toLowerCase()), `${id}: TG-Adresse führt nicht zur Artikelnummer ${q.art}: ${q.tg}`);
    }
    if (q.andere) assert.match(q.andere.url, /^https:\/\/[^\s]+$/, `${id}: ungültige Adresse ${q.andere.url}`);
    for (const url of [q.tg, q.andere?.url]) if (url) assert.ok(!/undefined|null|\{\{/.test(url), `${id}: Platzhalter in ${url}`);
  }
});

test('jedes Produkt hat mindestens einen Link – oder einen Hinweis, warum nicht', () => {
  for (const p of PRODUCTS) {
    const h = bestellhilfe(p.id);
    assert.ok(h.artikelnummer, `${p.id}: ohne Artikelnummer`);
    assert.ok(h.links.length > 0, `${p.id}: gar kein Link`);
    for (const link of h.links) assert.ok(link.url.startsWith('https://'), `${p.id}: ${link.url}`);
    const direkt = h.links.some((l) => l.quelle !== 'textil-grosshandel' || !l.label.includes('Suche'));
    if (!direkt || !BEZUGSQUELLEN[p.id]!.tg) {
      // ohne Direktseite beim Textil-Großhandel: entweder ein anderer Lieferant/L-Shop-Link ODER ein Hinweis
      assert.ok(h.links.some((l) => l.quelle !== 'textil-grosshandel') || h.hinweis, `${p.id}: weder Link noch Hinweis`);
    }
  }
});

test('Produkte, die nirgends mehr gelistet sind, bekommen einen deutlichen Hinweis und die Suche als Notnagel', () => {
  const nirgends = PRODUCTS.filter((p) => {
    const q = BEZUGSQUELLEN[p.id]!;
    return !q.tg && !q.andere && !q.lshop;
  });
  assert.ok(nirgends.length > 0 ? nirgends.every((p) => bestellhilfe(p.id).hinweis?.includes('nicht gelistet')) : true);
  for (const p of nirgends) {
    const h = bestellhilfe(p.id);
    assert.ok(h.links.some((l) => l.url.includes('/search?q=')), `${p.id}: keine Suche als Notnagel`);
  }
});

test('Beispiel Heavy T: Textil-Großhandel direkt, L-Shop über die Artikelnummer', () => {
  const h = bestellhilfe('fotl-heavy-t');
  assert.equal(h.artikelnummer, 'F182');
  assert.equal(h.links.find((l) => l.quelle === 'textil-grosshandel')?.url, 'https://www.textil-grosshandel.eu/heavy-cotton-t/f182');
  assert.equal(h.links.find((l) => l.quelle === 'l-shop')?.url, 'https://shop.l-shop-team.de/index.php?cl=search&searchparam=F182');
  assert.equal(h.hinweis, undefined);
});

test('unbekanntes Produkt: Hinweis statt Absturz', () => {
  const h = bestellhilfe('gibt-es-nicht');
  assert.equal(h.artikelnummer, null);
  assert.deepEqual(h.links, []);
  assert.match(h.hinweis ?? '', /keine Bezugsquelle/);
});

test('Suchadressen: Artikelnummer wird maskiert', () => {
  assert.equal(lshopSuchUrl('F 182&x'), 'https://shop.l-shop-team.de/index.php?cl=search&searchparam=F%20182%26x');
  assert.equal(textilGrosshandelSuchUrl('F182'), 'https://www.textil-grosshandel.eu/search?q=F182');
});

test('Größentext: nur Größen mit Stückzahl', () => {
  assert.equal(groessenText({ S: 0, M: 2, L: 3 }), 'M×2, L×3');
  assert.equal(groessenText({}), '');
});
