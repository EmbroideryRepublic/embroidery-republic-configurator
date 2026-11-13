/**
 * Grundpreis eines Textils und die Preisleiter darüber.
 *
 * Preisstand bis 2026-11-12 (Betreiber-Festlegung): Einkauf + 9 €, aufgerundet auf ,99 – und Druckpositionen 9/5/4 € …
 * 2026-11-12: Anhebung um 7–10 % (live, Ø +8,4 %). 2026-11-13: zurückgenommen, stattdessen nur 3–5 % mehr
 * (Betreiber: „nur 3–5 % mehr statt 7–10, mit natürlichen psychologischen Preisen“):
 *   - Der Textil-Grundpreis ist der Vorgängerpreis (Einkauf + 9 €, auf ,99), angehoben in ein Fenster von 3–5 % auf einen
 *     ,99-Betrag (anhebenInsFenster, config/pricing/marginTiers.ts).
 *   - Die Positionsstaffel (DTF_POSITION_TIERS) steht wieder auf dem alten Stand 9/5/4 …
 *   - Alle Verkaufspreise enden weiter auf ,99 €; nichts wird günstiger als vorher; mehr Stück sind nie teurer.
 *
 * Auf der ,99-Leiter liegen Preise 1 € auseinander – beim Textil-Grundpreis um 13 € sind das rund 7,7 %, bei einem Stückpreis
 * um 25 € rund 4 %, bei 40 € nur 2,5 %. Deshalb lässt sich 3–5 % nicht für JEDEN einzelnen Preis treffen. Geprüft wird, dass der
 * Schnitt der VERKAUFSPREISE im Zielfenster liegt, der große Teil der Preise nahe daran und kein Preis weit daneben.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice, QUANTITY_TIERS } from '@/lib/pricing/calculatePrice';
import { aufNaechsten99 } from '@/lib/pricing/ladenpreis';
import {
  anhebenInsFenster,
  computeBasePrice,
  FLAT_MARKUP_EUR,
  PREISANHEBUNG_MAX_PROZENT,
  PREISANHEBUNG_MIN_PROZENT,
} from '../marginTiers';

/** Der Grundpreis VOR der Anhebung: Einkauf + 9 €, aufgerundet auf den nächsthöheren vollen Euro + 0,99 €. */
const vorher = (ek: number) => Math.floor(Math.round((ek + FLAT_MARKUP_EUR) * 10000) / 10000) + 1.99;

/** Positionsstaffel des Vergleichsstands (2026-08-09, heute wieder gültig): [ab Menge, erste, zweite, ab dritte]. */
const POSITIONEN_VORHER: [number, number, number, number][] = [
  [1, 9, 5, 4], [3, 8, 4.5, 3.5], [10, 7.5, 4, 3], [50, 6, 3, 2.5], [100, 5.5, 2.5, 2], [250, 5, 2.5, 2], [500, 4.5, 2, 1.5], [1000, 4, 2, 1.5],
];

/** Der Stückpreis VOR der Anhebung, nachgerechnet (Grundpreis mit Mengenrabatt + Positionen, auf den nächsten ,99-Betrag). */
function stueckpreisVorher(ek: number, menge: number, ansichten: number): number {
  let rabatt = 0;
  for (const t of QUANTITY_TIERS) if (menge >= t.minQuantity) rabatt = t.baseDiscountPercent;
  let stufe = POSITIONEN_VORHER[0]!;
  for (const s of POSITIONEN_VORHER) if (menge >= s[0]) stufe = s;
  const positionen = ansichten === 1 ? stufe[1] : ansichten === 2 ? stufe[1] + stufe[2] : stufe[1] + stufe[2] + stufe[3];
  return aufNaechsten99(vorher(ek) * (1 - rabatt / 100) + positionen);
}

test('Anhebung: Fenster 3–5 %', () => {
  assert.equal(PREISANHEBUNG_MIN_PROZENT, 3);
  assert.equal(PREISANHEBUNG_MAX_PROZENT, 5);
});

test('anhebenInsFenster: liegt ein ,99-Betrag im Fenster, gewinnt der nächste zur Fenstermitte', () => {
  assert.equal(anhebenInsFenster(19.99), 20.99); // Fenster 20,59–20,99 → 20,99 (+5,0 %)
  assert.equal(anhebenInsFenster(25.99), 26.99); // Fenster 26,77–27,29 → 26,99 (+3,8 %)
  assert.equal(anhebenInsFenster(29.99), 30.99); // Fenster 30,89–31,49 → 30,99 (+3,3 %)
  assert.equal(anhebenInsFenster(39.99), 41.99); // Fenster 41,19–41,99 → 41,99 (+5,0 %)
  assert.equal(anhebenInsFenster(48.99), 50.99); // Fenster 50,46–51,44 → 50,99 (+4,1 %)
});

test('anhebenInsFenster: ohne ,99-Betrag im Fenster gewinnt der mit dem kleinsten Abstand zum Fenster', () => {
  assert.equal(anhebenInsFenster(12.99), 13.99); // Fenster 13,38–13,64: 13,99 (Abstand 0,35) – der nächste ,99-Betrag über dem Preis
  assert.equal(anhebenInsFenster(33.99), 34.99); // Fenster 35,01–35,69: 34,99 (Abstand 0,02) vor 35,99 (0,30)
});

test('anhebenInsFenster: immer teurer als vorher, immer ,99, monoton, nie krumm', () => {
  let davor = 0;
  for (let p = 5.99; p <= 120; p += 1) {
    const n = anhebenInsFenster(p);
    assert.ok(n > p, `${p} → ${n}: nicht teurer`);
    assert.equal(Math.round(n * 100) % 100, 99, `${p} → ${n}: nicht ,99`);
    assert.ok(n >= davor, `${p} → ${n}: fällt gegenüber ${davor}`);
    davor = n;
  }
  assert.equal(anhebenInsFenster(0), 0);
  assert.equal(anhebenInsFenster(Number.NaN), 0);
});

test('Grundpreis: Vorgängerpreis (Einkauf + 9 €, auf ,99) angehoben ins Fenster 3–5 %', () => {
  assert.equal(computeBasePrice(2.37, 'basic'), 13.99); // vorher 12,99 € (kleinster Schritt der ,99-Leiter: +1 €)
  assert.equal(computeBasePrice(4.2, 'basic'), 15.99); // vorher 14,99 €
  assert.equal(computeBasePrice(20, 'premium'), 31.99); // vorher 30,99 € (Fenster 31,92–32,54 → 31,99, +3,2 %)
  assert.equal(computeBasePrice(3, 'basic'), 14.99); // vorher 13,99 €
});

test('Grundpreis: jeder Katalogpreis endet auf ,99, ist teurer als vorher und höchstens 9 % darüber', () => {
  let summe = 0;
  for (const p of PRODUCTS) {
    const v = vorher(p.purchasePrice);
    const prozent = (p.basePrice / v - 1) * 100;
    assert.equal(Math.round(p.basePrice * 100) % 100, 99, `${p.id}: Preis endet nicht auf ,99 €`);
    assert.ok(p.basePrice > v, `${p.id}: ${p.basePrice} nicht teurer als vorher (${v})`);
    assert.ok(prozent >= 2 && prozent <= 9, `${p.id}: ${v} → ${p.basePrice} (+${prozent.toFixed(1)} %) weit außerhalb 3–5 %`);
    assert.ok(p.basePrice - p.purchasePrice >= FLAT_MARKUP_EUR, `${p.id}: Aufschlag unter ${FLAT_MARKUP_EUR} €`);
    summe += prozent;
  }
  // Textil-Grundpreise liegen oft um 13–16 €, dort ist der kleinste Schritt der ,99-Leiter (+1 €) schon 6–8 % – der Schnitt über
  // die Grundpreise liegt deshalb über dem der Verkaufspreise (siehe unten, dort zählt das Zielfenster).
  const schnitt = summe / PRODUCTS.length;
  assert.ok(schnitt >= 4 && schnitt <= 6.5, `Grundpreis-Schnitt +${schnitt.toFixed(2)} % unerwartet`);
});

function logo(view: 'front' | 'back' | 'sleeve_left'): ConfigElement {
  return {
    id: view, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 800, originalHeightPx: 800, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85,
  } as ConfigElement;
}

const MENGEN = [1, 2, 3, 4, 5, 9, 10, 19, 20, 24, 25, 49, 50, 99, 100, 249, 250, 499, 500, 999, 1000];
const ANSICHTEN = [logo('front'), logo('back'), logo('sleeve_left')];

test('Preisleiter: nie günstiger als vorher, immer ,99, im Schnitt 3–5 % teurer, kein Preis weit daneben', async () => {
  const rules = await getPricingRules('dtf');
  const prozente: number[] = [];
  for (const p of PRODUCTS) {
    for (const menge of MENGEN) {
      for (const n of [1, 2, 3]) {
        const alt = stueckpreisVorher(p.purchasePrice, menge, n);
        const neu = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: ANSICHTEN.slice(0, n), pricingRules: rules });
        const beschreibung = `${p.id} × ${menge} (${n} Ansicht/en): ${alt} → ${neu.unitPrice}`;
        assert.ok(neu.unitPrice >= alt - 0.005, `günstiger als vorher: ${beschreibung}`);
        assert.equal(Math.round(neu.unitPrice * 100) % 100, 99, `nicht ,99: ${beschreibung}`);
        const prozent = (neu.unitPrice / alt - 1) * 100;
        assert.ok(prozent <= 10, `mehr als 10 % teurer: ${beschreibung}`);
        prozente.push(prozent);
      }
    }
  }
  const schnitt = prozente.reduce((a, b) => a + b, 0) / prozente.length;
  const nah = prozente.filter((x) => x >= 2 && x <= 6).length / prozente.length;
  assert.ok(schnitt >= 3 && schnitt <= 5, `Schnitt +${schnitt.toFixed(2)} % liegt nicht im Zielfenster 3–5 %`);
  assert.ok(nah >= 0.75, `nur ${(nah * 100).toFixed(0)} % der Preise liegen zwischen 2 und 6 % über dem früheren`);
});

test('Preisleiter: der Stückpreis steigt mit der Menge nie', async () => {
  const rules = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    for (const n of [1, 2, 3]) {
      let davor = Number.POSITIVE_INFINITY;
      for (const menge of MENGEN) {
        const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: ANSICHTEN.slice(0, n), pricingRules: rules });
        assert.ok(r.unitPrice <= davor + 0.005, `${p.id} (${n} Ansicht/en): bei ${menge} Stück ${r.unitPrice} > ${davor}`);
        davor = r.unitPrice;
      }
    }
  }
});
