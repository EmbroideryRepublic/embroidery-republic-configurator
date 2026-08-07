// Adversariale Verifikation: nutzt den ECHTEN, exportierten calculatePrice()
// aus src/lib/pricing/calculatePrice.ts (keine Neuimplementierung!), um zu
// pruefen, ob getPositionPrice()/getElementTypeBasePrice()/getVariableCost()
// tatsaechlich isRuleApplicable() (minQuantity/maxQuantity/validFrom/validUntil)
// respektieren. Die drei Funktionen sind nicht exportiert, deshalb wird ihr
// Verhalten indirekt ueber die Breakdown-Werte von calculatePrice() beobachtet.

import { calculatePrice } from '../../src/lib/pricing/calculatePrice';
import type { ConfigElement, PricingRule, LogoElement } from '../../src/types';

let failures = 0;
let checks = 0;

function assert(label: string, cond: boolean, detail: string) {
  checks++;
  const status = cond ? 'OK  ' : 'FAIL';
  if (!cond) failures++;
  console.log(`[${status}] ${label} :: ${detail}`);
}

function makeLogo(view: ConfigElement['view'], overrides: Partial<LogoElement> = {}): LogoElement {
  return {
    id: overrides.id ?? `logo-${Math.random().toString(36).slice(2)}`,
    type: 'logo',
    view,
    xCm: 5,
    yCm: 5,
    widthCm: 5,
    heightCm: 5,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 4000,
    name: 'Test-Logo',
    locked: false,
    hidden: false,
    fileUrl: 'https://example.invalid/logo.png',
    fileName: 'logo.png',
    originalWidthPx: 500,
    originalHeightPx: 500,
    originalFileUrl: 'https://example.invalid/logo-orig.png',
    backgroundRemoved: false,
    contentFillRatio: 0.85,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 1: getElementTypeBasePrice() ueber per_logo-Regel mit minQuantity/maxQuantity
// ─────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 1: per_logo mit minQuantity=10 / maxQuantity=50 ===');
{
  const rule: PricingRule = {
    id: 'rule-per-logo-staffel',
    ruleType: 'per_logo',
    price: 5,
    label: 'Logo-Grundgebuehr (Staffel 10-50)',
    isActive: true,
    minQuantity: 10,
    maxQuantity: 50,
  };
  const elements = [makeLogo('front')];

  const unterMin = calculatePrice({ basePrice: 20, quantity: 5, elements, pricingRules: [rule] });
  assert(
    'quantity=5 (< minQuantity=10) -> elementBaseFeeTotal soll 0 sein',
    unterMin.breakdown.elementBaseFeeTotal === 0,
    `elementBaseFeeTotal=${unterMin.breakdown.elementBaseFeeTotal}, hasErrors=${unterMin.hasErrors}`
  );

  const imFenster = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [rule] });
  assert(
    'quantity=10 (== minQuantity) -> Regel greift, elementBaseFeeTotal = 5 (kein Mengenrabatt bei genau 10? Tier bei 10 hat baseDiscountPercent=3)',
    imFenster.breakdown.elementBaseFeeTotal === 5 * (1 - 3 / 100),
    `elementBaseFeeTotal=${imFenster.breakdown.elementBaseFeeTotal}, erwartet=${5 * (1 - 3 / 100)}`
  );

  const ueberMax = calculatePrice({ basePrice: 20, quantity: 60, elements, pricingRules: [rule] });
  assert(
    'quantity=60 (> maxQuantity=50) -> elementBaseFeeTotal soll 0 sein',
    ueberMax.breakdown.elementBaseFeeTotal === 0,
    `elementBaseFeeTotal=${ueberMax.breakdown.elementBaseFeeTotal}, hasErrors=${ueberMax.hasErrors}`
  );

  const genauMax = calculatePrice({ basePrice: 20, quantity: 50, elements, pricingRules: [rule] });
  assert(
    'quantity=50 (== maxQuantity, noch gueltig) -> Regel greift',
    genauMax.breakdown.elementBaseFeeTotal > 0,
    `elementBaseFeeTotal=${genauMax.breakdown.elementBaseFeeTotal}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 2: getPositionPrice() ueber per_position-Regel mit validFrom/validUntil
// ─────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 2: per_position mit validFrom/validUntil (Zeitfenster) ===');
{
  // Zwei unterschiedliche Ansichten -> Positionsaufschlag greift ueberhaupt (distinctViewCount > 1)
  const elements = [makeLogo('front'), makeLogo('back')];

  // WICHTIG: getPositionPrice() matcht ueber `r.printView === view` (siehe
  // calculatePrice.ts). Ohne printView auf der Regel ist das IMMER false
  // (undefined !== 'front'), die Regel griffe also NIE - unabhaengig vom
  // Zeitfenster. Das waere ein falsch-positiver Test. Alle drei Regeln hier
  // bekommen deshalb printView: 'front', wie es auch die echte Konfiguration
  // in src/config/pricingRules.ts fuer jede per_position-Regel tut.
  const zukuenftig: PricingRule = {
    id: 'rule-pos-zukunft',
    ruleType: 'per_position',
    printView: 'front',
    price: 4,
    label: 'Positionsaufschlag (noch nicht gestartet)',
    isActive: true,
    validFrom: '2099-01-01T00:00:00.000Z',
  };
  const rZuk = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [zukuenftig] });
  assert(
    'validFrom in der Zukunft -> positionFeeTotal soll 0 sein',
    rZuk.breakdown.positionFeeTotal === 0,
    `positionFeeTotal=${rZuk.breakdown.positionFeeTotal}`
  );

  const abgelaufen: PricingRule = {
    id: 'rule-pos-abgelaufen',
    ruleType: 'per_position',
    printView: 'front',
    price: 4,
    label: 'Positionsaufschlag (abgelaufen)',
    isActive: true,
    validUntil: '2020-01-01T00:00:00.000Z',
  };
  const rAbg = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [abgelaufen] });
  assert(
    'validUntil in der Vergangenheit -> positionFeeTotal soll 0 sein',
    rAbg.breakdown.positionFeeTotal === 0,
    `positionFeeTotal=${rAbg.breakdown.positionFeeTotal}`
  );

  const gueltig: PricingRule = {
    id: 'rule-pos-gueltig',
    ruleType: 'per_position',
    printView: 'front',
    price: 4,
    label: 'Positionsaufschlag (aktiv laufend)',
    isActive: true,
    validFrom: '2020-01-01T00:00:00.000Z',
    validUntil: '2099-01-01T00:00:00.000Z',
  };
  const rGue = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [gueltig] });
  assert(
    'validFrom/validUntil umschliessen JETZT -> positionFeeTotal soll > 0 sein',
    rGue.breakdown.positionFeeTotal > 0,
    `positionFeeTotal=${rGue.breakdown.positionFeeTotal}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 3: getVariableCost() ueber per_cm2-Regel mit minQuantity/maxQuantity
// ─────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 3: per_cm2 mit minQuantity=20 ===');
{
  const rule: PricingRule = {
    id: 'rule-cm2-staffel',
    ruleType: 'per_cm2',
    price: 0.1,
    label: 'Flaechenpreis (ab 20 Stueck)',
    isActive: true,
    minQuantity: 20,
  };
  const elements = [makeLogo('front', { widthCm: 10, heightCm: 10, contentFillRatio: 0.85 })];
  // Erwartete Flaeche bei Anwendbarkeit: 10*10*0.85 = 85 cm^2 * 0.1 = 8.5 (vor Rabatt)

  const unterMin = calculatePrice({ basePrice: 20, quantity: 5, elements, pricingRules: [rule] });
  const areaSumUnterMin = Object.values(unterMin.breakdown.areaPriceByView).reduce((a, b) => a + b, 0);
  assert(
    'quantity=5 (< minQuantity=20) -> Flaechenkosten (areaPriceByView-Summe) sollen 0 sein',
    areaSumUnterMin === 0,
    `areaPriceByView=${JSON.stringify(unterMin.breakdown.areaPriceByView)}`
  );

  const ueberMin = calculatePrice({ basePrice: 20, quantity: 25, elements, pricingRules: [rule] });
  const areaSumUeberMin = Object.values(ueberMin.breakdown.areaPriceByView).reduce((a, b) => a + b, 0);
  assert(
    'quantity=25 (>= minQuantity=20) -> Flaechenkosten sollen > 0 sein',
    areaSumUeberMin > 0,
    `areaPriceByView=${JSON.stringify(ueberMin.breakdown.areaPriceByView)}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 4: getVariableCost() per_1000_stitches mit validUntil (abgelaufene Aktion)
// ─────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 4: per_1000_stitches mit abgelaufenem validUntil ===');
{
  const rule: PricingRule = {
    id: 'rule-stitch-abgelaufen',
    ruleType: 'per_1000_stitches',
    price: 2,
    label: 'Stichpreis (abgelaufene Aktion)',
    isActive: true,
    validUntil: '2020-01-01T00:00:00.000Z',
  };
  const elements = [makeLogo('front', { estimatedStitches: 8000 })];
  const r = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [rule] });
  const areaSum = Object.values(r.breakdown.areaPriceByView).reduce((a, b) => a + b, 0);
  assert(
    'validUntil abgelaufen -> Stichkosten sollen 0 sein (nicht (8000/1000)*2=16)',
    areaSum === 0,
    `areaPriceByView=${JSON.stringify(r.breakdown.areaPriceByView)}, isStitchBased(meta)=${r.breakdown.isStitchBased}`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 5: isActive=false wird respektiert (Grundfall, keine neue Anforderung,
// aber gute Gegenprobe, dass isRuleApplicable() tatsaechlich verwendet wird)
// ─────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 5: isActive=false ===');
{
  const rule: PricingRule = {
    id: 'rule-inaktiv',
    ruleType: 'per_logo',
    price: 99,
    label: 'Inaktive Regel',
    isActive: false,
  };
  const elements = [makeLogo('front')];
  const r = calculatePrice({ basePrice: 20, quantity: 10, elements, pricingRules: [rule] });
  assert(
    'isActive=false -> elementBaseFeeTotal soll 0 sein',
    r.breakdown.elementBaseFeeTotal === 0,
    `elementBaseFeeTotal=${r.breakdown.elementBaseFeeTotal}`
  );
}

console.log(`\n${checks} Pruefungen, ${failures} Fehlschlaege.`);
if (failures > 0) process.exit(1);
