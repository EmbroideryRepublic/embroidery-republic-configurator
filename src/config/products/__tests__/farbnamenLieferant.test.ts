/**
 * Wächter für die Farbnamen (farbnamenDeutsch.ts, lieferantenfarben.generated.ts, Anwendung in products/index.ts).
 *
 * Kundinnen und Kunden sehen deutsche Namen; im Adminbereich steht der Name beim Lieferanten (Feld lieferantenName), damit sich eine
 * Bestellung beim Lieferanten schnell zuordnen lässt. Nur Namen ändern sich – Farb-IDs bleiben, sonst bräche die Zuordnung zu Bildern und Lieferanten.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../index';
import { LIEFERANTENFARBEN } from '../lieferantenfarben.generated';
import { FARBNAMEN_DEUTSCH } from '../farbnamenDeutsch';

test('jede Zeile der Lieferantentabelle gehört zu einem vorhandenen Produkt und einer vorhandenen Farbe', () => {
  for (const [produktId, farben] of Object.entries(LIEFERANTENFARBEN)) {
    const p = PRODUCTS.find((x) => x.id === produktId);
    assert.ok(p, `Produkt ${produktId} existiert nicht`);
    for (const farbId of Object.keys(farben)) {
      assert.ok(
        p.colors.some((c) => c.id === farbId),
        `${produktId}: Farbe ${farbId} existiert nicht`
      );
    }
  }
});

test('jede Farbe trägt ihren Lieferantennamen', () => {
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      assert.ok(c.lieferantenName && c.lieferantenName.length > 0, `${p.id}/${c.id}: Lieferantenname fehlt`);
    }
  }
});

test('Namen sind nie leer und tragen keine Leerzeichen am Rand; das Wörterbuch hat keine leeren Einträge', () => {
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      assert.ok(c.name.trim().length > 0, `${p.id}/${c.id}: leerer Name`);
      assert.equal(c.name, c.name.trim(), `${p.id}/${c.id}: Leerzeichen am Rand`);
    }
  }
  for (const [englisch, deutsch] of Object.entries(FARBNAMEN_DEUTSCH)) {
    assert.ok(englisch.trim().length > 0 && deutsch.trim().length > 0, `leerer Eintrag: ${englisch}`);
  }
});

test('kein Produkt hat zwei gleich benannte Farben', () => {
  for (const p of PRODUCTS) {
    const deutsch = p.colors.map((c) => c.name.toLowerCase());
    assert.deepEqual([...new Set(deutsch.filter((n, i) => deutsch.indexOf(n) !== i))], [], `${p.id}: doppelte deutsche Farbnamen`);
  }
});

test('Zoodie JH050: Anthrazit meliert beim Kunden, Charcoal (Heather) beim Lieferanten; die Farb-IDs bleiben', () => {
  const zoodie = PRODUCTS.find((p) => p.id === 'justhoods-zoodie')!;
  const farbe = zoodie.colors.find((c) => c.id === 'anthracite')!;
  assert.equal(farbe.name, 'Anthrazit meliert');
  assert.equal(farbe.lieferantenName, 'Charcoal (Heather)');
  assert.deepEqual(
    zoodie.colors.map((c) => c.id),
    ['black', 'navy', 'royal', 'grey', 'burgundy', 'anthracite', 'green']
  );
});

test('Kunden sehen deutsche Wörter: häufige englische Farbwörter kommen in Anzeigenamen nicht vor (Orange und Pink sind auch deutsch)', () => {
  const englisch = /\b(black|white|red|blue|green|yellow|grey|gray|purple|brown|navy)\b/i;
  const treffer: string[] = [];
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      // Ein Zusatz in Klammern (zwei gleiche deutsche Namen im selben Produkt) trägt den Lieferantennamen und ist erlaubt.
      const ohneKlammer = c.name.replace(/\s*\(.*\)\s*$/, '');
      if (englisch.test(ohneKlammer)) treffer.push(`${p.id}/${c.id}: ${c.name}`);
    }
  }
  assert.deepEqual(treffer.slice(0, 20), [], 'Diese Farben sind nicht ins Deutsche übersetzt (Wörterbuch ergänzen).');
});
