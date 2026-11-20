/**
 * Großformat-Zuschlag im autoritativen Serverpreis: Der Server leitet die ECHTEN flachen Maße selbst aus Katalog und Geometrie ab
 * (config/echteMasse.ts) – der Client kann sie nicht beeinflussen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { priceCart, priceCartItem } from '../serverPricing';
import { echteMasseJeElement } from '@/config/echteMasse';
import { getPrintAreasSync, flaecheFuerGroesse } from '@/config/printAreas';
import type { CartItem, ConfigElement } from '@/types';

const PRODUKT = 'justhoods-college-hoodie';

function element(id: string, x: number, w: number, h: number, view: ConfigElement['view'] = 'front'): ConfigElement {
  return {
    id, type: 'logo', view, xCm: x, yCm: 2, widthCm: w, heightCm: h, rotationDeg: 0, isOutOfBounds: false, extraPrice: 0,
    estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: 'x', fileName: 'logo.png', originalWidthPx: 4000,
    originalHeightPx: 4000, originalFileUrl: 'x', backgroundRemoved: false, contentFillRatio: 1,
  } as ConfigElement;
}

function position(elements: ConfigElement[], menge = 10, method: CartItem['printMethod'] = 'dtf'): CartItem {
  return {
    id: 'i1', printMethod: method, productId: PRODUKT, colorId: 'grey', sizeQuantities: { M: menge }, quantity: menge, elements,
    unitPrice: 0, totalPrice: 0, addedAt: 0,
  } as CartItem;
}

test('echteMasseJeElement: DTF vorne bekommt abgewickelte Maße, Ärmel und Stickerei nicht', () => {
  const flaeche = flaecheFuerGroesse(getPrintAreasSync(PRODUKT, 'dtf').find((a) => a.view === 'front')!, 'M');
  const e = element('a', (flaeche.boxWidthCm - 28) / 2, 28, 20);
  const echt = echteMasseJeElement(position([e]))[0]!;
  assert.ok(echt.breiteCm > 28, `${echt.breiteCm}`);
  assert.equal(echt.hoeheCm, 20);
  assert.deepEqual(echteMasseJeElement(position([e], 10, 'embroidery')), [undefined], 'Stickerei hat keine Abwicklung');
  assert.deepEqual(echteMasseJeElement(position([element('s', 0, 10, 10, 'sleeve_left')])), [undefined], 'Ärmel: gezeichnet = echt');
});

test('doppelte Element-IDs können den Zuschlag nicht senken: die Zuordnung läuft nach Position, nicht nach ID', async () => {
  const flaeche = flaecheFuerGroesse(getPrintAreasSync(PRODUKT, 'dtf').find((a) => a.view === 'front')!, 'M');
  const gross = element('gleich', (flaeche.boxWidthCm - 30) / 2, 30, 28);
  const klein = element('gleich', 0, 5, 5, 'back'); // dieselbe ID, kleines Motiv
  const ehrlich = await priceCartItem(position([gross, { ...klein, id: 'anders' }]));
  const getarnt = await priceCartItem(position([gross, klein]));
  assert.equal(getarnt.unitPrice, ehrlich.unitPrice, 'gleiche ID darf den Preis nicht verändern');
  const echt = echteMasseJeElement(position([gross, klein]));
  assert.ok(echt[0] && echt[0].breiteCm > 30, 'das große Motiv behält sein eigenes echtes Maß');
  // Am Rand der Brust ist dieselbe gezeichnete Breite in echt deutlich breiter – hier zählt nur: eigenes Maß, nicht das des großen Motivs.
  assert.ok(echt[1] && echt[1].breiteCm >= 5 && echt[1].breiteCm < echt[0]!.breiteCm, 'das kleine Motiv behält sein eigenes Maß');
});

test('der Serverpreis enthält den Großformat-Zuschlag als eigenen Posten und die Posten ergeben den Preis', async () => {
  const flaeche = flaecheFuerGroesse(getPrintAreasSync(PRODUKT, 'dtf').find((a) => a.view === 'front')!, 'M');
  const klein = position([element('k', (flaeche.boxWidthCm - 15) / 2, 15, 12)]);
  const gross = position([element('g', (flaeche.boxWidthCm - 30) / 2, 30, 28)]);

  const preisKlein = await priceCartItem(klein);
  const preisGross = await priceCartItem(gross);
  assert.ok(preisGross.unitPrice > preisKlein.unitPrice, `${preisGross.unitPrice} > ${preisKlein.unitPrice}`);

  const warenkorb = await priceCart([gross]);
  const zuschlag = warenkorb.lines.find((l) => l.id.endsWith(':grossformat'));
  assert.ok(zuschlag, 'eigener Posten „Großformat-Zuschlag“');
  assert.equal(zuschlag!.label, 'Großformat-Zuschlag');
  assert.ok(zuschlag!.total > 0);
  const summe = Math.round(warenkorb.lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  assert.equal(summe, Math.round(warenkorb.totalPrice * 100) / 100, 'Summe aller Posten = Gesamtpreis');

  const ohne = await priceCart([klein]);
  assert.equal(ohne.lines.find((l) => l.id.endsWith(':grossformat')), undefined, 'kleines Motiv: kein Zuschlag');
});

test('Stickerei zahlt keinen Großformat-Zuschlag', async () => {
  const gross = position([element('g', 0, 30, 28)], 10, 'embroidery');
  const warenkorb = await priceCart([gross]);
  assert.equal(warenkorb.lines.find((l) => l.id.endsWith(':grossformat')), undefined);
});
