/**
 * Ladenpreis: Der Stückpreis, den die Kundschaft zahlt, endet auf ,99 € (Festlegung des Betreibers 2026-11-12).
 *
 * Gerundet wird kaufmännisch zum NÄCHSTEN ,99-Betrag (auf oder ab, höchstens ±0,50 €; „goldene Mitte“ – immer
 * Aufrunden lag im Schnitt rund 0,35 € über dem Rechenwert), vor den Nachlässen, und „Stückpreis × Menge =
 * Gesamtpreis“ bleibt nachrechenbar. Die Untergrenze des Grundpreises (Einkauf inkl. USt + Aufschlag) rundet dagegen immer
 * nach oben (aufNaechstesNeunundneunzig).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '../calculatePrice';
import { aufNaechsten99, aufNaechstesNeunundneunzig } from '../ladenpreis';

test('aufNaechsten99: kaufmännisch zum nächsten ,99-Betrag, höchstens ±0,50 €', () => {
  assert.equal(aufNaechsten99(19.13), 18.99);
  assert.equal(aufNaechsten99(19.6), 19.99);
  assert.equal(aufNaechsten99(19.99), 19.99);
  assert.equal(aufNaechsten99(20.4), 19.99);
  assert.equal(aufNaechsten99(20.6), 20.99);
  assert.equal(aufNaechsten99(0.4), 0.99);
  assert.equal(aufNaechsten99(0), 0);
  assert.equal(aufNaechsten99(Number.NaN), 0);
  for (let c = 1; c <= 20000; c++) {
    const betrag = c / 100;
    const r = aufNaechsten99(betrag);
    assert.equal(Math.round(r * 100) % 100, 99, `${betrag} → ${r}`);
    assert.ok(Math.abs(r - betrag) <= 0.5 + 0.0001 || betrag < 0.5, `${betrag} → ${r}: mehr als 0,50 € Abweichung`);
  }
});

test('aufNaechstesNeunundneunzig: nächster ,99-Betrag, nie nach unten', () => {
  assert.equal(aufNaechstesNeunundneunzig(19.13), 19.99);
  assert.equal(aufNaechstesNeunundneunzig(19.99), 19.99);
  assert.equal(aufNaechstesNeunundneunzig(20), 20.99);
  assert.equal(aufNaechstesNeunundneunzig(11.5), 11.99);
  assert.equal(aufNaechstesNeunundneunzig(0.4), 0.99);
  // Gleitkommarauschen darf keine volle Stufe kosten.
  assert.equal(aufNaechstesNeunundneunzig(19.990000000001), 19.99);
  // Nichts zu zahlen bleibt nichts zu zahlen.
  assert.equal(aufNaechstesNeunundneunzig(0), 0);
  assert.equal(aufNaechstesNeunundneunzig(Number.NaN), 0);
});

function logo(view: 'front' | 'back' | 'sleeve_left' = 'front', id = 'l1'): ConfigElement {
  return {
    id, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 800, originalHeightPx: 800, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85,
  } as ConfigElement;
}

const MENGEN = [1, 2, 3, 4, 5, 9, 10, 24, 25, 49, 50, 99, 100, 249, 250, 499, 500, 999, 1000];
const BASEN = [11.99, 12.99, 16.99, 29.99, 55.99];

test('Jeder Stückpreis endet auf ,99 – für alle Mengen, Grundpreise und ein bzw. zwei Ansichten', async () => {
  for (const art of ['dtf', 'embroidery'] as const) {
    const rules = await getPricingRules(art);
    for (const basis of BASEN) {
      for (const menge of MENGEN) {
        for (const elemente of [[logo('front')], [logo('front', 'a'), logo('back', 'b')]]) {
          const r = calculatePrice({ basePrice: basis, quantity: menge, elements: elemente, pricingRules: rules });
          assert.equal(Math.round(r.unitPrice * 100) % 100, 99, `${art} ${basis} € × ${menge} (${elemente.length} Ansicht/en): ${r.unitPrice}`);
        }
      }
    }
  }
});

test('Die Rundung weicht höchstens 0,50 € vom Rechenwert ab; Stückpreis × Menge = Gesamtpreis', async () => {
  const rules = await getPricingRules('dtf');
  for (const basis of BASEN) {
    for (const menge of MENGEN) {
      const el = [logo('front')];
      const laden = calculatePrice({ basePrice: basis, quantity: menge, elements: el, pricingRules: rules });
      const roh = calculatePrice({ basePrice: basis, quantity: menge, elements: el, pricingRules: rules, ladenpreisRundung: false });
      const aufschlag = laden.unitPrice - roh.unitPrice;
      assert.ok(Math.abs(aufschlag) <= 0.505, `${basis} × ${menge}: Rundung höchstens ±0,50 € (${roh.unitPrice} → ${laden.unitPrice})`);
      assert.ok(Math.abs(laden.unitPrice * menge - laden.totalPrice) < 0.005 * menge + 0.01, `${basis} × ${menge}: Stück × Menge ≠ Gesamt`);
    }
  }
});

test('Der Stückpreis steigt mit der Menge nie', async () => {
  for (const art of ['dtf', 'embroidery'] as const) {
    const rules = await getPricingRules(art);
    let vorher = Number.POSITIVE_INFINITY;
    for (const menge of MENGEN) {
      const r = calculatePrice({ basePrice: 16.99, quantity: menge, elements: [logo('front')], pricingRules: rules });
      assert.ok(r.unitPrice <= vorher + 0.0001, `${art}: bei ${menge} Stück ${r.unitPrice} > ${vorher}`);
      vorher = r.unitPrice;
    }
  }
});

test('Nachlässe beziehen sich auf den Ladenpreis und wirken in voller Höhe', async () => {
  const basis = await getPricingRules('dtf');
  const ohne = calculatePrice({ basePrice: 16.99, quantity: 10, elements: [logo('front')], pricingRules: basis });
  const mitGutschein = calculatePrice({
    basePrice: 16.99, quantity: 10, elements: [logo('front')],
    pricingRules: [...basis, { id: 'g', ruleType: 'discount_per_unit', price: 1.5, label: 'Gutschein', isActive: true }],
  });
  const mitVerein = calculatePrice({
    basePrice: 16.99, quantity: 10, elements: [logo('front')],
    pricingRules: [...basis, { id: 'v', ruleType: 'discount_percent', price: 10, label: 'Verein', isActive: true }],
  });
  assert.equal(Math.round((ohne.unitPrice - mitGutschein.unitPrice) * 100) / 100, 1.5);
  assert.equal(Math.round(mitVerein.unitPrice * 100) / 100, Math.round(ohne.unitPrice * 0.9 * 100) / 100);
});

test('Ohne Schalter (Standard) wird gerundet, mit ladenpreisRundung:false nicht', async () => {
  const rules = await getPricingRules('dtf');
  const standard = calculatePrice({ basePrice: 16.99, quantity: 10, elements: [logo('front')], pricingRules: rules });
  const roh = calculatePrice({ basePrice: 16.99, quantity: 10, elements: [logo('front')], pricingRules: rules, ladenpreisRundung: false });
  assert.notEqual(standard.unitPrice, roh.unitPrice);
  assert.equal(Math.round(roh.unitPrice * 100) % 100 === 99, false);
});
