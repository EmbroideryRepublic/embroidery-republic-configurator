/**
 * Grundpreis eines Textils und die Preisleiter darüber (Festlegung des Betreibers 2026-11-12):
 *
 *   - Keine Mehrwertsteuer-Rechnung im Preis, sondern pauschal „das Geld draufpacken“: Aufschlag 9 € statt 8 €,
 *     jeder Grundpreis liegt damit genau 1 € über dem früheren.
 *   - Nichts darf günstiger werden als vorher (auch nicht bei Mengenstaffel und ,99-Rundung), nichts soll viel teurer
 *     werden (höchstens +2 € je Stück, im Schnitt rund +1 €).
 *   - Alle Preise enden auf ,99 €.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '@/lib/pricing/calculatePrice';
import { computeBasePrice, FLAT_MARKUP_EUR } from '../marginTiers';

/** Der Grundpreis VOR der Umstellung: Aufschlag 8 €. */
const vorher = (ek: number) => Math.floor(Math.round((ek + 8) * 10000) / 10000) + 1.99;

test('Grundpreis: Einkauf + 9 €, aufgerundet auf den nächsthöheren vollen Euro + 0,99 €', () => {
  assert.equal(FLAT_MARKUP_EUR, 9);
  assert.equal(computeBasePrice(4.2, 'basic'), 14.99); // vorher 13,99 €
  assert.equal(computeBasePrice(20, 'premium'), 30.99); // vorher 29,99 €
  assert.equal(computeBasePrice(2.37, 'basic'), 12.99); // vorher 11,99 €
  // Ein exakt glatter Betrag springt auf den nächsten vollen Euro + 0,99 (nicht darunter).
  assert.equal(computeBasePrice(3, 'basic'), 13.99);
});

test('Grundpreis: jeder Katalogpreis liegt genau 1 € über dem früheren und endet auf ,99 €', () => {
  for (const p of PRODUCTS) {
    assert.equal(Math.round((p.basePrice - vorher(p.purchasePrice)) * 100), 100, `${p.id}: nicht genau +1 €`);
    assert.equal(Math.round(p.basePrice * 100) % 100, 99, `${p.id}: Preis endet nicht auf ,99 €`);
    assert.ok(p.basePrice - p.purchasePrice >= FLAT_MARKUP_EUR, `${p.id}: Aufschlag unter ${FLAT_MARKUP_EUR} €`);
  }
});

function logo(view: 'front' | 'back'): ConfigElement {
  return {
    id: view, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 800, originalHeightPx: 800, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85,
  } as ConfigElement;
}

const MENGEN = [1, 2, 3, 4, 5, 9, 10, 19, 20, 24, 25, 49, 50, 99, 100, 249, 250, 499, 500, 999, 1000];

test('Preisleiter: bei keiner Menge günstiger als vorher, höchstens 2 € teurer, immer ,99', async () => {
  const rules = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    for (const menge of MENGEN) {
      for (const elemente of [[logo('front')], [logo('front'), logo('back')]]) {
        const alt = calculatePrice({ basePrice: vorher(p.purchasePrice), quantity: menge, elements: elemente, pricingRules: rules, ladenpreisRundung: false });
        const neu = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: elemente, pricingRules: rules });
        const beschreibung = `${p.id} × ${menge} (${elemente.length} Ansicht/en): ${alt.unitPrice} → ${neu.unitPrice}`;
        assert.ok(neu.unitPrice >= alt.unitPrice - 0.005, `günstiger als vorher: ${beschreibung}`);
        assert.ok(neu.unitPrice - alt.unitPrice <= 2.005, `mehr als 2 € teurer: ${beschreibung}`);
        assert.equal(Math.round(neu.unitPrice * 100) % 100, 99, `nicht ,99: ${beschreibung}`);
      }
    }
  }
});

test('Preisleiter: der Stückpreis steigt mit der Menge nie', async () => {
  const rules = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    let davor = Number.POSITIVE_INFINITY;
    for (const menge of MENGEN) {
      const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [logo('front')], pricingRules: rules });
      assert.ok(r.unitPrice <= davor + 0.005, `${p.id}: bei ${menge} Stück ${r.unitPrice} > ${davor}`);
      davor = r.unitPrice;
    }
  }
});
