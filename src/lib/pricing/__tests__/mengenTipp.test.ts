/**
 * Mengen-Tipp: Staffelgrenzen, an denen eine etwas größere Menge insgesamt WENIGER kostet.
 *
 * Geprüft gegen die echten Preisregeln und die echte Rechenfunktion (calculatePrice), nicht gegen Mock-Regeln.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPricingRules } from '@/config/pricingRules';
import { PRODUCTS } from '@/config/products';
import { calculatePrice } from '../calculatePrice';
import { findeMengenTipp, MIN_ERSPARNIS_EUR, suchfenster } from '../mengenTipp';
import type { ConfigElement } from '@/types';

function logo(view: ConfigElement['view']): ConfigElement {
  return {
    id: `el-${view}`, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotation: 0, fileUrl: '', name: 'Logo',
    isOutOfBounds: false, locked: false, hidden: false, contentFillRatio: 0.85,
  } as unknown as ConfigElement;
}

const BASIS = 13.99;
const gesamt = (basePrice: number, quantity: number, elements: ConfigElement[], pricingRules: Awaited<ReturnType<typeof getPricingRules>>) =>
  calculatePrice({ basePrice, quantity, elements, pricingRules }).totalPrice;

test('49 Stück: Tipp auf 50 Stück mit der echten Ersparnis', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front')];
  const tipp = findeMengenTipp({ basePrice: BASIS, quantity: 49, elements, pricingRules: rules });
  assert.ok(tipp, 'bei 49 Stück muss es einen Tipp geben');
  assert.equal(tipp.menge, 50);
  assert.equal(tipp.mehrStueck, 1);
  const erwartet = Math.round((gesamt(BASIS, 49, elements, rules) - gesamt(BASIS, 50, elements, rules)) * 100) / 100;
  assert.equal(tipp.ersparnis, erwartet);
  assert.ok(tipp.ersparnis >= 50, `Ersparnis ${tipp.ersparnis} € ist deutlich – sonst wäre die Staffelgrenze kein Fall für einen Tipp`);
});

test('der Tipp nennt nie eine Menge, die nicht wirklich günstiger ist (für alle Staffelgrenzen und Ansichtenzahlen)', async () => {
  const rules = await getPricingRules('dtf');
  for (const n of [1, 2, 3]) {
    const elements = (['front', 'back', 'sleeve_left'] as const).slice(0, n).map(logo);
    for (const grenze of [3, 5, 10, 20, 25, 50, 100, 250, 500, 1000]) {
      for (const menge of [grenze - 1, grenze - 2, grenze - 5]) {
        if (menge < 1) continue;
        const tipp = findeMengenTipp({ basePrice: BASIS, quantity: menge, elements, pricingRules: rules });
        if (!tipp) continue;
        assert.ok(tipp.menge > menge && tipp.menge - menge <= suchfenster(menge), `${menge} Stück: Tipp ${tipp.menge} liegt außerhalb des Suchfensters`);
        assert.ok(tipp.ersparnis >= MIN_ERSPARNIS_EUR);
        const wirklich = gesamt(BASIS, menge, elements, rules) - gesamt(BASIS, tipp.menge, elements, rules);
        assert.ok(Math.abs(wirklich - tipp.ersparnis) < 0.011, `${menge}→${tipp.menge}: genannte Ersparnis ${tipp.ersparnis}, echte ${wirklich.toFixed(2)}`);
        // Es ist die KLEINSTE günstigere Menge: dazwischen sinkt der Preis noch nicht um den Mindestbetrag.
        for (let m = menge + 1; m < tipp.menge; m++) {
          assert.ok(gesamt(BASIS, menge, elements, rules) - gesamt(BASIS, m, elements, rules) < MIN_ERSPARNIS_EUR, `${menge}: schon ${m} wäre günstiger`);
        }
      }
    }
  }
});

test('mitten in einer Stufe gibt es keinen Tipp (kein Dauer-Hinweis)', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front')];
  for (const menge of [11, 15, 30, 60, 150]) {
    assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: menge, elements, pricingRules: rules }), null, `${menge} Stück`);
  }
});

test('ohne Menge, ohne Regeln oder bei ungültiger Menge: kein Tipp und kein Fehler', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front')];
  assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: 0, elements, pricingRules: rules }), null);
  assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: Number.NaN, elements, pricingRules: rules }), null);
  assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: 49, elements, pricingRules: [] }), null);
});

test('Suchfenster: höchstens ein Viertel mehr, mindestens 10 Stück', () => {
  assert.equal(suchfenster(5), 10);
  assert.equal(suchfenster(49), 13);
  assert.equal(suchfenster(999), 250);
});

test('für jedes Produkt: an der Staffelgrenze 49→50 gibt es einen Tipp, und er stimmt mit der Rechenfunktion überein', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front'), logo('back')];
  for (const p of PRODUCTS) {
    const tipp = findeMengenTipp({ basePrice: p.basePrice, quantity: 49, elements, pricingRules: rules });
    assert.ok(tipp, `${p.id}: kein Tipp bei 49 Stück`);
    assert.equal(tipp.menge, 50, p.id);
  }
});
