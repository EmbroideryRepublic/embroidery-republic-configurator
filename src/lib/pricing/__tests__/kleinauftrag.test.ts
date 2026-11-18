/**
 * Einrichtung für Kleinaufträge (Regel dtf-kleinauftrag, Betreiberfreigabe 2026-11-18).
 *
 * Jede Bestellung muss Gewinn bringen. Bei 1–2 Stück decken Stückpreis und Kundenversand die Fixkosten je Bestellung nicht; deshalb fällt bei
 * DTF einmalig eine Pauschale an, die sich auf die Stückzahl verteilt und ab 3 Stück entfällt. Stickerei ist nicht betroffen
 * (Stickerei-Kalkulation unverändert, derzeit pausiert).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import {
  getPricingRules,
  KLEINAUFTRAG_MAX_STUECK,
  KLEINAUFTRAG_PAUSCHALE_EUR,
  KLEINAUFTRAG_REGEL_ID,
} from '@/config/pricingRules';
import { calculatePrice } from '../calculatePrice';

function logo(): ConfigElement {
  return {
    id: 'front', type: 'logo', view: 'front', xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 800, originalHeightPx: 800, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85,
  } as ConfigElement;
}

test('Pauschale: 10 € bis 2 Stück, ab 3 Stück keine (DTF)', async () => {
  assert.equal(KLEINAUFTRAG_PAUSCHALE_EUR, 10);
  assert.equal(KLEINAUFTRAG_MAX_STUECK, 2);
  const rules = await getPricingRules('dtf');
  const p = PRODUCTS[0]!;
  for (const menge of [1, 2]) {
    const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [logo()], pricingRules: rules });
    assert.equal(r.breakdown.setupTotal, KLEINAUFTRAG_PAUSCHALE_EUR, `${menge} Stück: Pauschale fehlt`);
    assert.equal(r.breakdown.setupPerUnit, KLEINAUFTRAG_PAUSCHALE_EUR / menge);
  }
  for (const menge of [3, 4, 5, 10, 100]) {
    const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [logo()], pricingRules: rules });
    assert.equal(r.breakdown.setupTotal, 0, `${menge} Stück: darf keine Pauschale kosten`);
  }
});

test('Pauschale: im Stückpreis enthalten, Stückpreis fällt von 1 über 2 auf 3 Stück, Gesamtpreis steigt mit der Menge', async () => {
  const rules = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    let stueckVorher = Number.POSITIVE_INFINITY;
    let gesamtVorher = 0;
    for (const menge of [1, 2, 3, 4, 5]) {
      const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [logo()], pricingRules: rules });
      assert.ok(r.unitPrice <= stueckVorher + 0.005, `${p.id}: Stückpreis steigt bei ${menge} Stück (${r.unitPrice} > ${stueckVorher})`);
      assert.ok(r.totalPrice > gesamtVorher, `${p.id}: Gesamtpreis steigt bei ${menge} Stück nicht (${r.totalPrice} <= ${gesamtVorher})`);
      assert.equal(Math.round(r.unitPrice * 100) % 100, 99, `${p.id} × ${menge}: nicht ,99`);
      stueckVorher = r.unitPrice;
      gesamtVorher = r.totalPrice;
    }
  }
});

test('Pauschale: nur DTF – die Stickerei-Regeln bleiben unberührt', async () => {
  const dtf = await getPricingRules('dtf');
  const stick = await getPricingRules('embroidery');
  assert.ok(dtf.some((r) => r.id === KLEINAUFTRAG_REGEL_ID && r.isActive), 'DTF: Regel fehlt oder ist aus');
  assert.ok(!stick.some((r) => r.id === KLEINAUFTRAG_REGEL_ID), 'Stickerei darf die Kleinauftragspauschale nicht tragen');
  const p = PRODUCTS[0]!;
  const r = calculatePrice({ basePrice: p.basePrice, quantity: 1, elements: [logo()], pricingRules: stick });
  assert.equal(r.breakdown.setupTotal, 0);
});
