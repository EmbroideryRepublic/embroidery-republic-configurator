/**
 * Mengen-Tipp: Kurz vor einer Staffelgrenze deckelt der Mengenpreis-Deckel (calculatePrice) den Gesamtpreis auf den der Grenzmenge – der Tipp
 * nennt dann die Grenzmenge: „Mit 50 statt 48 Stück zahlst du genauso viel – und erhältst 2 Stück mehr.“
 *
 * Bis 2026-11-25 war es umgekehrt: Die Grenzmenge kostete WENIGER als die kleinere Menge (49 Stück 1.028,51 €, 50 Stück 949,50 €), und der Tipp
 * nannte die Ersparnis. Das ist für die Kundschaft widersinnig und mit dem Deckel nicht mehr möglich (siehe staffelMonoton.test.ts).
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
type Regeln = Awaited<ReturnType<typeof getPricingRules>>;
const gesamt = (basePrice: number, quantity: number, elements: ConfigElement[], pricingRules: Regeln) =>
  calculatePrice({ basePrice, quantity, elements, pricingRules }).totalPrice;
const gesamtRegulaer = (basePrice: number, quantity: number, elements: ConfigElement[], pricingRules: Regeln) =>
  calculatePrice({ basePrice, quantity, elements, pricingRules, mengenDeckel: false }).totalPrice;

test('49 Stück: Tipp auf 50 Stück zum selben Gesamtpreis, die Ersparnis ist der Deckel gegenüber der regulären Staffelrechnung', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front')];
  const tipp = findeMengenTipp({ basePrice: BASIS, quantity: 49, elements, pricingRules: rules });
  assert.ok(tipp, 'bei 49 Stück muss es einen Tipp geben');
  assert.equal(tipp.menge, 50);
  assert.equal(tipp.mehrStueck, 1);
  assert.equal(tipp.gesamtpreis, gesamt(BASIS, 49, elements, rules));
  assert.equal(tipp.gesamtpreis, gesamt(BASIS, 50, elements, rules), '49 und 50 Stück kosten insgesamt dasselbe');
  const erwartet = Math.round((gesamtRegulaer(BASIS, 49, elements, rules) - gesamt(BASIS, 49, elements, rules)) * 100) / 100;
  assert.equal(tipp.ersparnis, erwartet);
  assert.ok(tipp.ersparnis >= 50, `Ersparnis ${tipp.ersparnis} € ist deutlich – sonst wäre die Staffelgrenze kein Fall für einen Tipp`);
});

test('der Tipp nennt nie eine Menge mit anderem Preis (für alle Staffelgrenzen und Ansichtenzahlen)', async () => {
  const rules = await getPricingRules('dtf');
  let geprueft = 0;
  for (const n of [1, 2, 3]) {
    const elements = (['front', 'back', 'sleeve_left'] as const).slice(0, n).map(logo);
    for (const grenze of [3, 5, 10, 20, 25, 50, 100, 250, 500, 1000]) {
      for (const menge of [grenze - 1, grenze - 2, grenze - 5, grenze - 12]) {
        if (menge < 1) continue;
        const tipp = findeMengenTipp({ basePrice: BASIS, quantity: menge, elements, pricingRules: rules });
        if (!tipp) continue;
        geprueft++;
        assert.ok(tipp.menge > menge && tipp.menge - menge <= suchfenster(menge), `${menge} Stück: Tipp ${tipp.menge} liegt außerhalb des Suchfensters`);
        assert.ok(tipp.ersparnis >= MIN_ERSPARNIS_EUR);
        assert.equal(tipp.mehrStueck, tipp.menge - menge);
        // Derselbe Gesamtpreis – für die ganze Zone bis zur Grenzmenge.
        for (let m = menge; m <= tipp.menge; m++) {
          assert.equal(gesamt(BASIS, m, elements, rules), tipp.gesamtpreis, `${menge}→${tipp.menge}: bei ${m} Stück ein anderer Gesamtpreis`);
        }
        // Die Grenzmenge selbst ist die reguläre Staffel (kein Deckel mehr) und danach steigt der Preis wieder.
        assert.equal(calculatePrice({ basePrice: BASIS, quantity: tipp.menge, elements, pricingRules: rules }).breakdown.mengenDeckelAufMenge, null);
        assert.ok(gesamt(BASIS, tipp.menge + 1, elements, rules) > tipp.gesamtpreis, `${tipp.menge + 1} Stück müssen mehr kosten`);
      }
    }
  }
  assert.ok(geprueft > 10, `zu wenige Tipps geprüft: ${geprueft}`);
});

test('mitten in einer Stufe gibt es keinen Tipp (kein Dauer-Hinweis)', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front')];
  for (const menge of [11, 15, 30, 60, 150]) {
    assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: menge, elements, pricingRules: rules }), null, `${menge} Stück`);
  }
  // Auf der Grenzmenge selbst und darüber ebenfalls nicht.
  for (const menge of [50, 51, 100, 250]) {
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

test('Stickerei: kein Mengenpreis-Deckel, also auch kein Tipp', async () => {
  const stick = await getPricingRules('embroidery');
  const el = { ...logo('front'), estimatedStitches: 6000 } as ConfigElement;
  for (const menge of [19, 49, 99]) {
    assert.equal(findeMengenTipp({ basePrice: BASIS, quantity: menge, elements: [el], pricingRules: stick }), null, `${menge} Stück`);
  }
});

test('Suchfenster: höchstens ein Viertel mehr, mindestens 10 Stück', () => {
  assert.equal(suchfenster(5), 10);
  assert.equal(suchfenster(49), 13);
  assert.equal(suchfenster(999), 250);
});

test('für jedes Produkt: bei 49 Stück gibt es genau dann einen Tipp auf 50, wenn die reguläre Staffel dort sonst widersinnig wäre', async () => {
  const rules = await getPricingRules('dtf');
  const elements = [logo('front'), logo('back')];
  let mitTipp = 0;
  for (const p of PRODUCTS) {
    const tipp = findeMengenTipp({ basePrice: p.basePrice, quantity: 49, elements, pricingRules: rules });
    const luecke = gesamtRegulaer(p.basePrice, 49, elements, rules) - gesamtRegulaer(p.basePrice, 50, elements, rules);
    if (luecke >= MIN_ERSPARNIS_EUR) {
      assert.ok(tipp, `${p.id}: reguläre Staffel kostet 49 Stück ${luecke.toFixed(2)} € mehr als 50 – es muss einen Tipp geben`);
      assert.equal(tipp.menge, 50, p.id);
      assert.equal(tipp.gesamtpreis, gesamt(p.basePrice, 50, elements, rules), p.id);
      mitTipp++;
    } else if (luecke < 0.004) {
      assert.equal(tipp, null, `${p.id}: ohne Widerspruch kein Tipp`);
    }
  }
  assert.ok(mitTipp > PRODUCTS.length * 0.8, `nur ${mitTipp} von ${PRODUCTS.length} Modellen mit Tipp bei 49 Stück`);
});
