/**
 * Wächter für die Lieferanten-Farbnamen (farbnamenLieferant.ts).
 *
 * Der Einkauf liest den Farbnamen aus der Bestellung und sucht damit die Farbe beim Lieferanten. Die Tabelle darf deshalb nie
 * auf Farben zeigen, die es nicht gibt, und nie zwei Farben eines Produkts gleich benennen (sonst wäre die Bestellung wieder
 * mehrdeutig). Nur Namen ändern sich – Farb-IDs bleiben, sonst bräche die Zuordnung zu Bildern und Lieferanten.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../index';
import { FARBNAMEN_LIEFERANT } from '../farbnamenLieferant';

test('jede Zeile der Namenstabelle gehört zu einem vorhandenen Produkt und einer vorhandenen Farbe', () => {
  for (const [produktId, namen] of Object.entries(FARBNAMEN_LIEFERANT)) {
    const p = PRODUCTS.find((x) => x.id === produktId);
    assert.ok(p, `Produkt ${produktId} existiert nicht`);
    for (const farbId of Object.keys(namen)) {
      assert.ok(
        p.colors.some((c) => c.id === farbId),
        `${produktId}: Farbe ${farbId} existiert nicht`
      );
    }
  }
});

test('die Namen werden im Katalog angewendet, die Farb-IDs bleiben unverändert', () => {
  for (const [produktId, namen] of Object.entries(FARBNAMEN_LIEFERANT)) {
    const p = PRODUCTS.find((x) => x.id === produktId)!;
    for (const [farbId, name] of Object.entries(namen)) {
      assert.equal(p.colors.find((c) => c.id === farbId)!.name, name, `${produktId}/${farbId}`);
    }
  }
});

test('kein Produkt hat nach dem Umbenennen zwei gleich benannte Farben', () => {
  for (const produktId of Object.keys(FARBNAMEN_LIEFERANT)) {
    const p = PRODUCTS.find((x) => x.id === produktId)!;
    const namen = p.colors.map((c) => c.name.trim().toLowerCase());
    const doppelt = namen.filter((n, i) => namen.indexOf(n) !== i);
    assert.deepEqual([...new Set(doppelt)], [], `${produktId}: doppelte Farbnamen`);
  }
});

test('Zoodie JH050: Anthrazit heißt wie beim Lieferanten Charcoal (Heather)', () => {
  const zoodie = PRODUCTS.find((p) => p.id === 'justhoods-zoodie')!;
  const farbe = zoodie.colors.find((c) => c.id === 'anthracite')!;
  assert.equal(farbe.name, 'Charcoal (Heather)');
  assert.deepEqual(
    zoodie.colors.map((c) => c.id),
    ['black', 'navy', 'royal', 'grey', 'burgundy', 'anthracite', 'green']
  );
});

test('Namen sind nie leer und tragen keine Leerzeichen am Rand', () => {
  for (const namen of Object.values(FARBNAMEN_LIEFERANT)) {
    for (const name of Object.values(namen)) assert.equal(name, name.trim()), assert.ok(name.length > 0);
  }
});
