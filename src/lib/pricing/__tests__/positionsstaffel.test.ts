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

// ── Stickerei = Positionsstaffel + Stichaufpreis (Betreiber-Entscheidung 2026-09-03) ──
//
// Vorher ERSETZTE der Stichpreis (1,40 €/1.000) die Positionsstaffel: ein
// typisches 8×4-cm-Brustlogo (~6.400 Stiche) kostete bestickt praktisch
// dasselbe wie bedruckt (25,95 € statt 25,99 €), kleine Logos bestickt sogar
// weniger. Jetzt zahlt Stickerei dieselbe Positionsstaffel wie DTF PLUS
// 1,20 € je 1.000 geschätzte Stiche – Stickerei ist damit bei gleichem Motiv
// immer teurer als DTF, um exakt den Stichaufpreis.

test('Stickerei nutzt BEIDE Preisquellen: Positionsstaffel wie DTF und zusätzlich den Stichaufpreis', async () => {
  const rules = await getPricingRules('embroidery');
  const r = calculatePrice({
    basePrice: BASIS_PREIS,
    quantity: 1,
    elements: [{ ...logo('front'), estimatedStitches: 8000 } as ConfigElement],
    pricingRules: rules,
  });
  assert.equal(r.breakdown.isPositionBased, true, 'die Positionsstaffel muss auch für Stickerei aktiv sein');
  assert.equal(r.breakdown.isStitchBased, true, 'der Stichaufpreis muss weiterhin aktiv sein');
  assert.equal(r.breakdown.firstPositionPrice, 9);
  assert.equal(r.breakdown.pricePer1000Stitches, 1.2);
});

test('Stickerei kostet bei gleichem Motiv genau den Stichaufpreis (1,20 €/1.000 Stiche, Rabatt laut Staffel bzw. Deckel) mehr als DTF', async () => {
  const dtf = await getPricingRules('dtf');
  const stick = await getPricingRules('embroidery');
  // Erwarteter Rabatt FEST vorgegeben (nicht aus dem Prüfling abgeleitet):
  // Staffel 0/20/35 %, ab 20 Stück greift der Deckel 36,6 % statt 46–93 %.
  const faelle: [number, number, number][] = [
    [2700, 1, 0], [6400, 1, 0], [26700, 1, 0], [6400, 3, 0],
    [6400, 5, 20], [6400, 10, 35], [6400, 20, 36.6], [6400, 50, 36.6], [6400, 100, 36.6], [26700, 1000, 36.6],
  ];
  for (const [stiche, menge, rabatt] of faelle) {
    const el = { ...logo('front'), estimatedStitches: stiche } as ConfigElement;
    const d = calculatePrice({ basePrice: BASIS_PREIS, quantity: menge, elements: [el], pricingRules: dtf });
    const s = calculatePrice({ basePrice: BASIS_PREIS, quantity: menge, elements: [el], pricingRules: stick });
    assert.equal(s.breakdown.veredelungDiscountPercent, rabatt, `${menge} Stück: Rabatt auf den Stichaufpreis`);
    const erwartet = (stiche / 1000) * 1.2 * (1 - rabatt / 100);
    assert.ok(s.unitPrice > d.unitPrice, `${stiche} Stiche / ${menge} Stück: Stickerei muss teurer sein als DTF`);
    assert.ok(
      Math.abs(s.unitPrice - d.unitPrice - erwartet) < 0.011,
      `${stiche} Stiche / ${menge} Stück: Aufpreis ${(s.unitPrice - d.unitPrice).toFixed(2)} €, erwartet ${erwartet.toFixed(2)} €`
    );
  }
});

test('Rabattdeckel: nextTier wird gedeckelt ausgewiesen, eine Deckel-Regel für eine ungenutzte Ansicht wirkt nicht', async () => {
  const stick = await getPricingRules('embroidery');
  const el = { ...logo('front'), estimatedStitches: 10000 } as ConfigElement;
  const r = calculatePrice({ basePrice: BASIS_PREIS, quantity: 100, elements: [el], pricingRules: stick });
  assert.equal(r.breakdown.nextTier?.veredelungDiscountPercent, 36.6, 'die nächste Staffel darf keinen Rabatt über dem Deckel versprechen');

  // Deckel nur an einer Rücken-Regel, Motiv nur vorn: der Deckel gehört zu
  // einer Regel, die gar nicht in den Preis eingeht, und darf nicht wirken.
  const ohneDeckel = stick.map((x) => (x.ruleType === 'per_1000_stitches' ? { ...x, maxDiscountPercent: undefined } : x));
  const rules = [
    ...ohneDeckel,
    { id: 'deckel-ruecken', ruleType: 'per_1000_stitches' as const, printView: 'back' as const, price: 1.2, maxDiscountPercent: 10, label: 'Test', isActive: true },
  ];
  const nurVorne = calculatePrice({ basePrice: BASIS_PREIS, quantity: 100, elements: [el], pricingRules: rules });
  assert.equal(nurVorne.breakdown.veredelungDiscountPercent, 90, 'ohne wirksame Deckel-Regel gilt der Staffelwert');
});

test('Stichaufpreis: der Mengenrabatt ist gedeckelt, der Erlös fällt nie unter 0,76 €/1.000 Stiche', async () => {
  const rules = await getPricingRules('embroidery');
  const stichRegel = rules.find((r) => r.ruleType === 'per_1000_stitches');
  assert.ok(stichRegel?.maxDiscountPercent !== undefined, 'die Stichregel muss einen Rabattdeckel tragen');
  for (const menge of [1, 5, 10, 20, 50, 100, 250, 500, 1000]) {
    const r = calculatePrice({
      basePrice: BASIS_PREIS,
      quantity: menge,
      elements: [{ ...logo('front'), estimatedStitches: 10000 } as ConfigElement],
      pricingRules: rules,
    });
    const erloesJe1000 = 1.2 * (1 - r.breakdown.veredelungDiscountPercent / 100);
    assert.ok(
      erloesJe1000 >= 0.76 - 0.0001,
      `bei ${menge} Stück: ${r.breakdown.veredelungDiscountPercent} % Rabatt → ${erloesJe1000.toFixed(3)} €/1.000 Stiche liegt unter den Fremdkosten`
    );
    assert.ok(r.breakdown.veredelungDiscountPercent <= stichRegel.maxDiscountPercent);
  }
  // Der Deckel greift erst, wo die Staffel ihn überschreitet (ab 20 Stück, 46 %) –
  // darunter gilt der Staffelwert unverändert (10 Stück: 35 %).
  const zehn = calculatePrice({ basePrice: BASIS_PREIS, quantity: 10, elements: [{ ...logo('front'), estimatedStitches: 10000 } as ConfigElement], pricingRules: rules });
  assert.equal(zehn.breakdown.veredelungDiscountPercent, 35);
  const hundert = calculatePrice({ basePrice: BASIS_PREIS, quantity: 100, elements: [{ ...logo('front'), estimatedStitches: 10000 } as ConfigElement], pricingRules: rules });
  assert.equal(hundert.breakdown.veredelungDiscountPercent, stichRegel.maxDiscountPercent);
});

test('Stickerei auf zwei Ansichten: Positionsstaffel wie DTF, kein zusätzlicher Je-Ansicht-Aufschlag mehr', async () => {
  const dtf = await getPricingRules('dtf');
  const stick = await getPricingRules('embroidery');
  const elemente = [
    { ...logo('front'), estimatedStitches: 6000 } as ConfigElement,
    { ...logo('back'), estimatedStitches: 4000 } as ConfigElement,
  ];
  const d = calculatePrice({ basePrice: BASIS_PREIS, quantity: 1, elements: elemente, pricingRules: dtf });
  const s = calculatePrice({ basePrice: BASIS_PREIS, quantity: 1, elements: elemente, pricingRules: stick });
  assert.equal(s.breakdown.positionFeeTotal, 0, 'die alten Rücken-/Ärmelaufschläge (per_position) dürfen nicht mehr greifen');
  assert.ok(Math.abs(s.unitPrice - d.unitPrice - (10000 / 1000) * 1.2) < 0.011, 'Differenz = nur der Stichaufpreis beider Motive');
});

test('DTF bleibt vom Rabattdeckel unberührt (keine per_1000_stitches-Regel aktiv)', async () => {
  const rules = await getPricingRules('dtf');
  const r = calculatePrice({ basePrice: BASIS_PREIS, quantity: 100, elements: [logo('front')], pricingRules: rules });
  assert.equal(r.breakdown.veredelungDiscountPercent, 90, 'ohne Deckel-Regel gilt der rohe Staffelwert');
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
