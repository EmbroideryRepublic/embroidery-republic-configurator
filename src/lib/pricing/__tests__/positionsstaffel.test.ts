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
import { calculatePrice, DTF_POSITION_TIERS } from '../calculatePrice';
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

test('drei bedruckte Ansichten kosten 9 € + 5 € + 4 € = 18 € Aufschlag (1–2 Stück: dritte Position günstiger als zweite)', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [logo('front'), logo('back'), logo('sleeve_left')],
    pricingRules: rules,
  });
  assert.ok(Math.abs(r.unitPrice - (BASIS_PREIS + 18)) < 0.01, `Stückpreis ${r.unitPrice}, erwartet ${BASIS_PREIS + 18}`);
  assert.equal(r.breakdown.firstPositionPrice, 9);
  assert.equal(r.breakdown.additionalPositionPrice, 5, 'zweite Position');
  assert.equal(r.breakdown.furtherPositionPrice, 4, 'dritte und jede weitere Position');
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

// ── Feste DTF-Positionsstaffel (Betreiber-Vorgabe 2026-08-09) ─────────
//
// Ersetzt die vorherige prozentuale Veredelungsrabattierung für DTF: feste
// Preise je Position und Mengenbereich, keine weitere Rabattierung mehr.

test('DTF-Positionsstaffel: alle 8 Stufen exakt wie vom Betreiber vorgegeben (2026-08-09)', () => {
  assert.deepEqual(
    DTF_POSITION_TIERS.map((t) => [t.minQuantity, t.erste, t.zweite, t.abDritte]),
    [
      [1, 9, 5, 4],
      [3, 8, 4.5, 3.5],
      [10, 7.5, 4, 3],
      [50, 6, 3, 2.5],
      [100, 5.5, 2.5, 2],
      [250, 5, 2.5, 2],
      [500, 4.5, 2, 1.5],
      [1000, 4, 2, 1.5],
    ]
  );
});

test('DTF-Positionsstaffel ist eine reine Stufenfunktion: 10, 25 und 49 Stück kosten je Position exakt dasselbe, ab 50 Stück springt der gesamte Auftrag in die nächste Stufe', async () => {
  const rules = await getPricingRules('dtf');
  const erstePreis = (menge: number) =>
    calculatePrice({ basePrice: 0, quantity: menge, elements: [logo('front')], pricingRules: rules }).breakdown
      .firstPositionPrice;

  assert.equal(erstePreis(10), 7.5);
  assert.equal(erstePreis(25), 7.5);
  assert.equal(erstePreis(49), 7.5);
  assert.equal(erstePreis(50), 6);
});

test('Stufengrenzen: bei der niedrigeren Stückzahl wird nie WENIGER pro Position verlangt als eine Stufe höher', async () => {
  const rules = await getPricingRules('dtf');
  const erstePreis = (menge: number) =>
    calculatePrice({ basePrice: 0, quantity: menge, elements: [logo('front')], pricingRules: rules }).breakdown
      .firstPositionPrice;

  const staffelgrenzen: [number, number][] = [[2, 3], [9, 10], [49, 50], [99, 100], [249, 250], [499, 500], [999, 1000]];
  for (const [davor, abGrenze] of staffelgrenzen) {
    assert.ok(
      erstePreis(davor) >= erstePreis(abGrenze),
      `${davor} Stück darf nicht günstiger sein als ${abGrenze} Stück`
    );
  }
});
