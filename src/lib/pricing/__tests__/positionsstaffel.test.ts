/**
 * Tests der DTF-Positionsstaffel (first_position/additional_position).
 *
 * Ersetzt die frühere Flächenpreis-Regel (€/cm²): der DTF-Preis richtet sich
 * seit dieser Umstellung ausschließlich danach, wie viele Ansichten
 * bedruckt werden – 9 € für die erste, 5 € für jede weitere (siehe
 * config/pricingRules.ts, DTF_PRICING_RULES) – NICHT mehr nach der Größe
 * oder Zahl der Motive auf einer Ansicht.
 *
 * Bewusst gegen die ECHTEN Katalogregeln (getPricingRules('dtf')) getestet,
 * nicht gegen synthetische Fixtures: Ein Test, der nur eine Mock-Regel prüft,
 * hätte den eigentlichen Umstellungsfehler (Motivfläche wirkt noch/nicht
 * mehr) nicht gefunden.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '../calculatePrice';
import type { ConfigElement } from '@/types';

function logo(view: ConfigElement['view'], breiteCm = 20, hoeheCm = 15, id = `el-${view}-${Math.random()}`): ConfigElement {
  return {
    id,
    type: 'logo',
    view,
    xCm: 0,
    yCm: 0,
    widthCm: breiteCm,
    heightCm: hoeheCm,
    rotation: 0,
    fileUrl: '',
    name: 'Logo',
    isOutOfBounds: false,
    locked: false,
    hidden: false,
    contentFillRatio: 0.85,
  } as unknown as ConfigElement;
}

const BASIS_PREIS = 12.99;

test('eine bedruckte Ansicht kostet nur den Aufschlag für die erste Position (9 €)', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({ basePrice: BASIS_PREIS, quantity: 1, elements: [logo('front')], pricingRules: rules });
  assert.equal(r.breakdown.isPositionBased, true);
  assert.equal(r.breakdown.firstPositionPrice, 9);
  assert.equal(r.breakdown.additionalPositionPrice, 5);
  // Grundpreis + 9 € Positionsaufschlag, keine weiteren Kosten bei 1 Stück.
  assert.ok(Math.abs(r.unitPrice - (BASIS_PREIS + 9)) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS + 9}`);
});

test('zwei bedruckte Ansichten kosten 9 € + 5 € = 14 € Aufschlag', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front'), logo('back')],
    pricingRules: rules,
  });
  assert.ok(Math.abs(r.unitPrice - (BASIS_PREIS + 14)) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS + 14}`);
});

test('drei bedruckte Ansichten kosten 9 € + 5 € + 5 € = 19 € Aufschlag', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front'), logo('back'), logo('sleeve_left')],
    pricingRules: rules,
  });
  assert.ok(Math.abs(r.unitPrice - (BASIS_PREIS + 19)) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS + 19}`);
});

test('mehrere Motive auf DERSELBEN Ansicht zählen nur als eine Position', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front'), logo('front'), logo('front')],
    pricingRules: rules,
  });
  // Drei Motive auf derselben Ansicht kosten nicht mehr als eines.
  assert.ok(Math.abs(r.unitPrice - (BASIS_PREIS + 9)) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS + 9}`);
});

test('die Motivgröße hat keinen Einfluss mehr auf den Preis', async () => {
  const rules = await getPricingRules('dtf');
  const klein = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front', 5, 5)],
    pricingRules: rules,
  });
  const gross = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front', 28, 44)],
    pricingRules: rules,
  });
  assert.equal(klein.unitPrice, gross.unitPrice, 'ein kleines und ein großes Motiv auf derselben Ansicht müssen gleich teuer sein');
});

test('ohne Motive entsteht kein Positionsaufschlag', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({ basePrice: BASIS_PREIS, quantity: 1, elements: [], pricingRules: rules });
  assert.ok(Math.abs(r.unitPrice - BASIS_PREIS) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS} (kein Motiv, kein Aufschlag)`);
  assert.equal(r.breakdown.isPositionBased, true, 'die Regeln sind aktiv, greifen aber nur mit Motiv');
});

test('der Positionsaufschlag wird mit der Stückzahl multipliziert', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 10,
    elements: [logo('front'), logo('back')],
    pricingRules: rules,
  });
  // Bei 10 Stück greift der Mengenrabatt auf die Veredelung (QUANTITY_TIERS)
  // – die Summe muss deshalb UNTER dem naiven 10×14€ liegen, aber deutlich
  // über dem Grundpreis allein.
  assert.ok(r.totalPrice > BASIS_PREIS * 10, 'die Positionsstaffel muss den Gesamtpreis erhöhen');
  assert.ok(r.totalPrice < (BASIS_PREIS + 14) * 10, 'der Mengenrabatt auf die Veredelung muss greifen');
});

test('Stickerei bleibt unverändert stichzahlbasiert, nicht positionsgestaffelt', async () => {
  const rules = await getPricingRules('embroidery');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [{ ...logo('front'), estimatedStitches: 8000 } as ConfigElement],
    pricingRules: rules,
  });
  assert.equal(r.breakdown.isPositionBased, false, 'Stickerei darf nicht auf das Positionsmodell umgestellt sein');
  assert.equal(r.breakdown.isStitchBased, true);
});
