/**
 * Lieferantenfarbname für den Adminbereich: Kundschaft sieht Deutsch, der Einkauf den Namen beim Lieferanten.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { lieferantenFarbname } from '../farbnamen';
import { getProduct } from '@/config/products';

test('Zoodie JH050, Anthrazit meliert: Admin sieht den Namen des Lieferanten', () => {
  const farbe = getProduct('justhoods-zoodie')!.colors.find((c) => c.id === 'anthracite')!;
  assert.equal(farbe.name, 'Anthrazit meliert');
  assert.equal(lieferantenFarbname('justhoods-zoodie', 'anthracite', 'Anthrazit meliert'), 'Charcoal (Heather)');
});

test('der bei der Bestellung gespeicherte Name zählt nur, wenn Produkt oder Farbe nicht mehr im Katalog stehen', () => {
  assert.equal(lieferantenFarbname('gibt-es-nicht', 'x', 'Altname'), 'Altname');
  assert.equal(lieferantenFarbname('justhoods-zoodie', 'gibt-es-nicht', 'Altname'), 'Altname');
});

test('jede Farbe jedes Produkts liefert einen nicht leeren Lieferantennamen', () => {
  const leer: string[] = [];
  for (const id of ['justhoods-zoodie', 'sols-women-s-fleecejacket-north', 'gildan-heavy-blend-hooded-sweatshirt']) {
    const p = getProduct(id);
    if (!p) continue;
    for (const c of p.colors) {
      if (!lieferantenFarbname(p.id, c.id, c.name).trim()) leer.push(`${p.id}/${c.id}`);
    }
  }
  assert.deepEqual(leer, []);
});
