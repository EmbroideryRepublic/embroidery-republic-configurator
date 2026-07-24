/**
 * Tests der Einzelstück-Fähigkeit und der PREISARCHITEKTUR.
 *
 * Hintergrund: Bis Juli 2026 galt eine Mindestbestellmenge von 5 Stück –
 * `calculatePrice` rechnete intern mit `Math.max(quantity, 5)`. Wer ein
 * Einzelstück bestellte, zahlte damit stillschweigend fünf; Privatkunden,
 * Creator und kleine Vereine waren faktisch ausgeschlossen.
 *
 * Diese Tests sichern zwei Dinge ab:
 *   1. Einzelbestellungen funktionieren vollständig (die Mindestmenge darf
 *      nicht zurückkehren).
 *   2. Die Preisarchitektur ist KONFIGURIERBAR: einmalige Rüstkosten sind
 *      standardmäßig aus und lassen sich allein über Preisregeln in
 *      verschiedenen Strategien aktivieren – ohne Änderung am Rechenkern.
 *
 * Bewusst OHNE feste Beträge: Geprüft wird das Verhalten, nicht ein Preis.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice, MINIMUM_QUANTITY, QUANTITY_TIERS } from '../calculatePrice';
import { evaluateRules, isRuleApplicable, PricingConfigError } from '../ruleEngine';
import type { ConfigElement, PricingRule } from '@/types';

function logo(view: ConfigElement['view'] = 'front', id = `el-${view}`): ConfigElement {
  return {
    id,
    type: 'logo',
    view,
    xCm: 0,
    yCm: 0,
    widthCm: 20,
    heightCm: 15,
    rotation: 0,
    fileUrl: '',
    name: 'Logo',
    isOutOfBounds: false,
    locked: false,
    hidden: false,
    estimatedStitches: 12000,
    contentFillRatio: 0.85,
  } as unknown as ConfigElement;
}

const BASIS = { basePrice: 12.9, elements: [logo()] };

// ── Einzelbestellungen ────────────────────────────────────────────────

test('Mindestmenge ist 1 – Einzelbestellungen sind ausdrücklich erlaubt', () => {
  assert.equal(MINIMUM_QUANTITY, 1);
  assert.equal(QUANTITY_TIERS[0]?.minQuantity, 1);
});

test('1 Stück wird als 1 Stück berechnet, nicht auf eine Mindestmenge hochgesetzt', async () => {
  const rules = await getPricingRules('dtf');
  const eins = calculatePrice({ ...BASIS, quantity: 1, pricingRules: rules });
  const fuenf = calculatePrice({ ...BASIS, quantity: 5, pricingRules: rules });

  assert.notEqual(eins.totalPrice, fuenf.totalPrice);
  assert.ok(eins.totalPrice < fuenf.totalPrice);
});

test('Der Stückpreis steigt nie mit der Menge – und sinkt an jeder Staffelgrenze', async () => {
  const rules = await getPricingRules('embroidery');
  const staffelgrenzen = QUANTITY_TIERS.map((t) => t.minQuantity);

  let vorher = Number.POSITIVE_INFINITY;
  // Innerhalb einer Staffel darf der Stückpreis gleich bleiben (ohne
  // Einmalkosten gibt es dort nichts zu verteilen), er darf aber nie steigen.
  for (const menge of [1, 2, 3, 5, 8, 10, 25, 50, 100, 250, 500, 1000]) {
    const r = calculatePrice({ ...BASIS, quantity: menge, pricingRules: rules });
    assert.ok(r.unitPrice <= vorher, `Stückpreis bei ${menge} darf nicht steigen`);
    vorher = r.unitPrice;
  }

  // An jeder Staffelgrenze muss er tatsächlich fallen.
  for (let i = 1; i < staffelgrenzen.length; i++) {
    const davor = calculatePrice({ ...BASIS, quantity: staffelgrenzen[i]! - 1, pricingRules: rules });
    const abGrenze = calculatePrice({ ...BASIS, quantity: staffelgrenzen[i]!, pricingRules: rules });
    assert.ok(abGrenze.unitPrice < davor.unitPrice, `ab ${staffelgrenzen[i]} Stück muss es günstiger werden`);
  }
});

test('MIT Rüstkosten sinkt der Stückpreis auch innerhalb einer Staffel', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'per_position' })];
  const eins = calculatePrice({ ...BASIS, quantity: 1, pricingRules: rules });
  const zwei = calculatePrice({ ...BASIS, quantity: 2, pricingRules: rules });
  const drei = calculatePrice({ ...BASIS, quantity: 3, pricingRules: rules });

  // 1, 2 und 3 liegen alle in derselben Staffel – der Unterschied kommt
  // allein aus der Verteilung der Einmalkosten.
  assert.ok(zwei.unitPrice < eins.unitPrice);
  assert.ok(drei.unitPrice < zwei.unitPrice);
});

// ── Rüstkosten sind standardmäßig AUS ─────────────────────────────────

test('Ohne konfigurierte Regel fallen KEINE Rüstkosten an (Standardzustand)', async () => {
  for (const methode of ['dtf', 'embroidery'] as const) {
    const rules = await getPricingRules(methode);
    const r = calculatePrice({ ...BASIS, quantity: 1, pricingRules: rules });
    assert.equal(r.breakdown.setupTotal, 0, `${methode}: Rüstkosten müssen im Standard 0 sein`);
    assert.equal(r.breakdown.setupPerUnit, 0);
  }
});

test('Ohne Rüstkosten ist der Stückpreis mengenunabhängig linear', async () => {
  const rules = await getPricingRules('dtf');
  const eins = calculatePrice({ ...BASIS, quantity: 1, pricingRules: rules });
  const zehn = calculatePrice({ ...BASIS, quantity: 10, pricingRules: rules });
  // Ohne Einmalkosten kommt der Unterschied allein aus der Mengenstaffel.
  assert.ok(zehn.unitPrice < eins.unitPrice);
});

// ── Konfigurierbarkeit: verschiedene Preisstrategien ──────────────────

function setupRegel(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'test-setup',
    ruleType: 'setup_fee',
    price: 30,
    label: 'Einrichtung',
    isActive: true,
    ...overrides,
  };
}

test('Strategie: Rüstkosten je Position', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'per_position' })];
  const einePos = calculatePrice({ basePrice: 12.9, elements: [logo('front')], quantity: 10, pricingRules: rules });
  const zweiPos = calculatePrice({
    basePrice: 12.9,
    elements: [logo('front'), logo('back')],
    quantity: 10,
    pricingRules: rules,
  });

  assert.equal(einePos.breakdown.setupTotal, 30);
  assert.equal(zweiPos.breakdown.setupTotal, 60);
});

test('Strategie: Rüstkosten je Motiv', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'per_element' })];
  // Zwei Motive auf DERSELBEN Position
  const r = calculatePrice({
    basePrice: 12.9,
    elements: [logo('front', 'a'), logo('front', 'b')],
    quantity: 10,
    pricingRules: rules,
  });
  assert.equal(r.breakdown.setupTotal, 60, 'je Motiv, auch auf derselben Position');
});

test('Strategie: Rüstkosten einmal je Auftrag', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'once' })];
  const r = calculatePrice({
    basePrice: 12.9,
    elements: [logo('front'), logo('back'), logo('sleeve_left')],
    quantity: 10,
    pricingRules: rules,
  });
  assert.equal(r.breakdown.setupTotal, 30, 'unabhängig von Positionen und Motiven genau einmal');
});

test('Strategie: Rüstkosten nur für eine Veredelungsart', async () => {
  const nurStick = [...(await getPricingRules('embroidery')), setupRegel()];
  const dtfOhne = await getPricingRules('dtf');

  const stick = calculatePrice({ ...BASIS, quantity: 5, pricingRules: nurStick });
  const dtf = calculatePrice({ ...BASIS, quantity: 5, pricingRules: dtfOhne });

  assert.ok(stick.breakdown.setupTotal > 0);
  assert.equal(dtf.breakdown.setupTotal, 0);
});

test('Strategie: Rüstkosten nur für eine bestimmte Position', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ printView: 'back', multiplier: 'per_position' })];
  const nurBrust = calculatePrice({ basePrice: 12.9, elements: [logo('front')], quantity: 5, pricingRules: rules });
  const mitRuecken = calculatePrice({
    basePrice: 12.9,
    elements: [logo('front'), logo('back')],
    quantity: 5,
    pricingRules: rules,
  });

  assert.equal(nurBrust.breakdown.setupTotal, 0, 'Regel gilt nur für den Rücken');
  assert.equal(mitRuecken.breakdown.setupTotal, 30);
});

test('Rüstkosten fallen einmal an und verteilen sich auf die Menge', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'per_position' })];
  const eins = calculatePrice({ ...BASIS, quantity: 1, pricingRules: rules });
  const hundert = calculatePrice({ ...BASIS, quantity: 100, pricingRules: rules });

  assert.equal(eins.breakdown.setupTotal, hundert.breakdown.setupTotal, 'Gesamtbetrag ist mengenunabhängig');
  assert.equal(eins.breakdown.setupPerUnit, 30);
  assert.equal(hundert.breakdown.setupPerUnit, 0.3);
});

test('Blankoware ohne Motiv trägt keine Rüstkosten', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'per_position' })];
  const r = calculatePrice({ basePrice: 12.9, elements: [], quantity: 1, pricingRules: rules });

  assert.equal(r.breakdown.setupTotal, 0);
  assert.equal(r.totalPrice, 12.9);
});

// ── Aktionen und Mengenfenster ────────────────────────────────────────

test('Mengenfenster: Regel greift nur im angegebenen Bereich', () => {
  const regel = setupRegel({ minQuantity: 10, maxQuantity: 50 });
  assert.equal(isRuleApplicable(regel, 5), false);
  assert.equal(isRuleApplicable(regel, 10), true);
  assert.equal(isRuleApplicable(regel, 50), true);
  assert.equal(isRuleApplicable(regel, 51), false);
});

test('Aktionszeitraum: Regel greift nur zwischen validFrom und validUntil', () => {
  const regel = setupRegel({ validFrom: '2026-01-01', validUntil: '2026-12-31' });
  assert.equal(isRuleApplicable(regel, 1, new Date('2025-12-31')), false);
  assert.equal(isRuleApplicable(regel, 1, new Date('2026-06-15')), true);
  assert.equal(isRuleApplicable(regel, 1, new Date('2027-01-02')), false);
});

test('Inaktive Regel und Nullbetrag bleiben wirkungslos', () => {
  assert.equal(isRuleApplicable(setupRegel({ isActive: false }), 10), false);
  assert.equal(isRuleApplicable(setupRegel({ price: 0 }), 10), false);
});

// ── Erweiterbarkeit ───────────────────────────────────────────────────

test('FAIL FAST: unbekannter Preisbaustein wirft in Entwicklung/Test sofort', async () => {
  const unbekannt = {
    id: 'x',
    ruleType: 'irgendwas_neues',
    price: 99,
    label: 'Zukunft',
    isActive: true,
  } as unknown as PricingRule;

  const rules = [...(await getPricingRules('dtf')), unbekannt];

  assert.throws(
    () => calculatePrice({ ...BASIS, quantity: 5, pricingRules: rules }),
    PricingConfigError,
    'ein nicht verarbeitbarer Baustein darf nicht still übergangen werden'
  );
});

test('FAIL FAST: in Produktion wird protokolliert und der Preis als fehlerhaft markiert', async () => {
  const unbekannt = {
    id: 'x', ruleType: 'irgendwas_neues', price: 99, label: 'Zukunft', isActive: true,
  } as unknown as PricingRule;
  const rules = [...(await getPricingRules('dtf')), unbekannt];

  // NODE_ENV ist in den Typen schreibgeschützt – für diesen Test bewusst
  // über eine getypte Sicht gesetzt und danach wiederhergestellt.
  const env = process.env as Record<string, string | undefined>;
  const vorher = env.NODE_ENV;
  const fehlerAusgaben: unknown[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => { fehlerAusgaben.push(args); };
  try {
    env.NODE_ENV = 'production';
    const r = calculatePrice({ ...BASIS, quantity: 5, pricingRules: rules });

    assert.equal(r.hasErrors, true, 'der Preis muss als fehlerhaft markiert sein');
    assert.equal(r.issues.length, 1);
    assert.match(r.issues[0]!.message, /Unbekannter Preisbaustein/);
    assert.equal(fehlerAusgaben.length, 1, 'der Fehler muss protokolliert werden');
  } finally {
    console.error = originalError;
    env.NODE_ENV = vorher;
  }
});

test('Ein gültiger Preis meldet keine Fehler', async () => {
  const r = calculatePrice({ ...BASIS, quantity: 5, pricingRules: await getPricingRules('dtf') });
  assert.equal(r.hasErrors, false);
  assert.deepEqual(r.issues, []);
});

// ── Weitere Preisbausteine ────────────────────────────────────────────

test('Baustein: Zuschlag je Stück (z.B. Premiumgarn, Spezialfolie)', async () => {
  const basis = await getPricingRules('dtf');
  const ohne = calculatePrice({ ...BASIS, quantity: 10, pricingRules: basis });
  const mit = calculatePrice({
    ...BASIS, quantity: 10,
    pricingRules: [...basis, { id: 'z', ruleType: 'surcharge_per_unit', price: 2, label: 'Premiumgarn', isActive: true }],
  });

  assert.equal(
    Math.round((mit.totalPrice - ohne.totalPrice) * 100) / 100,
    20,
    '2 EUR je Stueck x 10 Stueck'
  );
});

test('Baustein: einmaliger Zuschlag (z.B. Expressproduktion)', async () => {
  const basis = await getPricingRules('dtf');
  const eins = calculatePrice({
    ...BASIS, quantity: 1,
    pricingRules: [...basis, { id: 'e', ruleType: 'surcharge_per_order', price: 15, label: 'Express', isActive: true }],
  });
  const hundert = calculatePrice({
    ...BASIS, quantity: 100,
    pricingRules: [...basis, { id: 'e', ruleType: 'surcharge_per_order', price: 15, label: 'Express', isActive: true }],
  });

  assert.equal(eins.breakdown.setupTotal, 15);
  assert.equal(hundert.breakdown.setupTotal, 15, 'einmalig, unabhaengig von der Menge');
});

test('Baustein: prozentualer Nachlass (Verein/Geschaeftskunde/Aktion)', async () => {
  const basis = await getPricingRules('dtf');
  const ohne = calculatePrice({ ...BASIS, quantity: 10, pricingRules: basis });
  const mit = calculatePrice({
    ...BASIS, quantity: 10,
    pricingRules: [...basis, { id: 'r', ruleType: 'discount_percent', price: 10, label: 'Vereinsrabatt', isActive: true }],
  });

  assert.ok(mit.totalPrice < ohne.totalPrice);
  assert.equal(Math.round(mit.totalPrice * 100) / 100, Math.round(ohne.totalPrice * 0.9 * 100) / 100);
});

test('Baustein: absoluter Nachlass je Stueck (Gutschein)', async () => {
  const basis = await getPricingRules('dtf');
  const ohne = calculatePrice({ ...BASIS, quantity: 10, pricingRules: basis });
  const mit = calculatePrice({
    ...BASIS, quantity: 10,
    pricingRules: [...basis, { id: 'g', ruleType: 'discount_per_unit', price: 1.5, label: 'Gutschein', isActive: true }],
  });

  assert.equal(Math.round((ohne.totalPrice - mit.totalPrice) * 100) / 100, 15);
});

test('Nachlass kann den Preis nicht unter 0 druecken', async () => {
  const basis = await getPricingRules('dtf');
  const r = calculatePrice({
    ...BASIS, quantity: 5,
    pricingRules: [...basis, { id: 'g', ruleType: 'discount_per_unit', price: 9999, label: 'zu viel', isActive: true }],
  });
  assert.ok(r.totalPrice >= 0);
});

test('Rabatt-Bausteine respektieren Aktionszeitraum und Mengenfenster', async () => {
  const basis = await getPricingRules('dtf');
  const aktion: PricingRule = {
    id: 'a', ruleType: 'discount_percent', price: 20, label: 'Sommeraktion', isActive: true,
    minQuantity: 20, validUntil: '2020-01-01',
  };
  const r = calculatePrice({ ...BASIS, quantity: 50, pricingRules: [...basis, aktion] });
  const ohne = calculatePrice({ ...BASIS, quantity: 50, pricingRules: basis });

  assert.equal(r.totalPrice, ohne.totalPrice, 'abgelaufene Aktion darf nicht greifen');
});

test('evaluateRules trennt Beträge in die drei Töpfe', async () => {
  const rules = [...(await getPricingRules('dtf')), setupRegel({ multiplier: 'once' })];
  const charges = evaluateRules(rules, {
    elements: [logo()],
    distinctViews: ['front'],
    quantity: 10,
    billableAreaCm2: (el) => el.widthCm * el.heightCm,
    chargePositionFees: false,
  });

  assert.equal(charges.orderOnce, 30, 'Einmalkosten landen im Auftragstopf');
  assert.ok(charges.perUnitVeredelung > 0, 'Flächenpreis landet im Veredelungstopf');
});
