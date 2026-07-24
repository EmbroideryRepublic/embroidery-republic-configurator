/**
 * Tests der dreistufigen PREISPIPELINE.
 *
 * Kernaussagen:
 *   1. Jede Stufe kennt nur ihre eigene Ebene und übergibt ein
 *      standardisiertes Ergebnis an die nächste.
 *   2. Die Summe aller PREISPOSTEN entspricht IMMER dem Endbetrag – sonst
 *      wäre die Aufschlüsselung in Warenkorb und Rechnung falsch.
 *   3. Jeder Posten trägt Metadaten (Bezeichnung, Kategorie, Herkunft).
 *   4. Neue Bestandteile lassen sich über Konfiguration zuschalten, ohne eine
 *      Stufe zu verändern.
 *   5. Beanstandungen blockieren das Ergebnis, statt still einen falschen
 *      Preis zu liefern.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getPricingRules } from '@/config/pricingRules';
import { calculatePipeline } from '../pipeline';
import { roundCents, sumLines } from '../priceLine';
import type { ConfigElement, PricingRule } from '@/types';

function logo(view: ConfigElement['view'] = 'front', id = `el-${view}`): ConfigElement {
  return {
    id, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 20, heightCm: 15, rotation: 0,
    fileUrl: '', name: 'Logo', isOutOfBounds: false, locked: false, hidden: false,
    estimatedStitches: 12000, contentFillRatio: 0.85,
  } as unknown as ConfigElement;
}

async function position(overrides: Record<string, unknown> = {}) {
  return {
    itemId: 'p1',
    productName: 'Testshirt',
    basePrice: 12.9,
    quantity: 10,
    elements: [logo()],
    pricingRules: await getPricingRules('dtf'),
    ...overrides,
  };
}

// ── Grundverhalten ────────────────────────────────────────────────────

test('Die Pipeline durchläuft alle drei Stufen', async () => {
  const r = calculatePipeline({ positions: [await position()] });

  assert.equal(r.positions[0]!.stage, 'position');
  assert.equal(r.cart.stage, 'cart');
  assert.equal(r.order.stage, 'order');
});

test('Der Übertrag zwischen den Stufen ist lückenlos', async () => {
  const r = calculatePipeline({ positions: [await position()] });

  assert.equal(r.cart.carriedTotal, r.subtotal, 'Stufe 2 übernimmt den Warenwert aus Stufe 1');
  assert.equal(r.order.carriedTotal, r.cart.runningTotal, 'Stufe 3 übernimmt das Ergebnis aus Stufe 2');
  assert.equal(r.grandTotal, r.order.runningTotal);
});

// ── Die zentrale Garantie ─────────────────────────────────────────────

test('Die Summe aller Posten entspricht dem Endbetrag', async () => {
  const r = calculatePipeline({ positions: [await position()] });
  assert.equal(sumLines(r.lines), r.grandTotal);
});

test('Auch mit Zuschlägen, Rabatten und Einrichtung stimmt die Summe', async () => {
  const regeln: PricingRule[] = [
    ...(await getPricingRules('dtf')),
    { id: 's', ruleType: 'setup_fee', multiplier: 'per_position', price: 30, label: 'Einrichtung', isActive: true },
    { id: 'z', ruleType: 'surcharge_per_unit', price: 2, label: 'Premiumfolie', isActive: true },
    { id: 'r', ruleType: 'discount_percent', price: 10, label: 'Aktion', isActive: true },
  ];
  const r = calculatePipeline({
    positions: [await position({ pricingRules: regeln, elements: [logo('front'), logo('back')] })],
    shippingCountry: 'Deutschland',
  });

  assert.equal(sumLines(r.lines), r.grandTotal, 'Aufschlüsselung und Endbetrag dürfen nie auseinanderlaufen');
});

test('Mehrere Positionen summieren sich korrekt', async () => {
  const r = calculatePipeline({
    positions: [await position({ itemId: 'a' }), await position({ itemId: 'b', quantity: 5 })],
  });

  assert.equal(r.totalQuantity, 15);
  assert.equal(sumLines(r.lines), r.grandTotal);
  // Zwei Geldbeträge dürfen nie ungerundet addiert und dann verglichen
  // werden – Gleitkomma driftet (255.9 vs. 255.89999999999998).
  assert.equal(r.subtotal, roundCents(r.positions[0]!.stageTotal + r.positions[1]!.stageTotal));
});

// ── Metadaten ─────────────────────────────────────────────────────────

test('Jeder Posten trägt Bezeichnung, Kategorie und Herkunft', async () => {
  const r = calculatePipeline({ positions: [await position()], shippingCountry: 'Deutschland' });

  for (const line of r.lines) {
    assert.ok(line.label.length > 0, `Posten ${line.id} braucht eine Bezeichnung`);
    assert.ok(line.category.length > 0, `Posten ${line.id} braucht eine Kategorie`);
    assert.ok(line.origin.stage, `Posten ${line.id} braucht eine Herkunft`);
  }
});

test('Posten lassen sich für die Anzeige nach Kategorie gruppieren', async () => {
  const r = calculatePipeline({ positions: [await position()], shippingCountry: 'Deutschland' });
  const kategorien = r.grouped.map((g) => g.category);

  assert.ok(kategorien.includes('produkt'));
  assert.ok(kategorien.includes('versand'));
  // Reihenfolge ist die Anzeigereihenfolge, nicht die Rechenreihenfolge.
  assert.ok(kategorien.indexOf('produkt') < kategorien.indexOf('versand'));
});

test('Die Herkunft weist die richtige Stufe aus', async () => {
  const r = calculatePipeline({ positions: [await position()], shippingCountry: 'Deutschland' });

  const produkt = r.lines.find((l) => l.category === 'produkt')!;
  const versand = r.lines.find((l) => l.category === 'versand')!;
  assert.equal(produkt.origin.stage, 'position');
  assert.equal(produkt.origin.itemId, 'p1');
  assert.equal(versand.origin.stage, 'order');
});

// ── Warenkorbebene ────────────────────────────────────────────────────

test('Warenkorbstufe: Kundengruppenrabatt', async () => {
  const config = {
    cart: { minimumOrderValue: 0, customerGroupDiscountPercent: { verein: 10 }, vouchers: {} },
  };
  const ohne = calculatePipeline({ positions: [await position()] }, config);
  const mit = calculatePipeline({ positions: [await position()], customerGroup: 'verein' }, config);

  assert.ok(mit.grandTotal < ohne.grandTotal);
  assert.equal(sumLines(mit.lines), mit.grandTotal);
  assert.ok(mit.lines.some((l) => l.category === 'rabatt' && l.origin.stage === 'cart'));
});

test('Warenkorbstufe: Gutschein', async () => {
  const config = {
    cart: {
      minimumOrderValue: 0,
      customerGroupDiscountPercent: {},
      vouchers: { SOMMER: { label: 'Sommeraktion', percent: 15 } },
    },
  };
  const r = calculatePipeline({ positions: [await position()], voucherCode: 'sommer' }, config);

  assert.ok(r.lines.some((l) => l.id.includes('gutschein')));
  assert.equal(sumLines(r.lines), r.grandTotal);
});

test('Warenkorbstufe: unbekannter Gutschein blockiert statt still zu ignorieren', async () => {
  const r = calculatePipeline({ positions: [await position()], voucherCode: 'GIBTSNICHT' });

  assert.equal(r.blocked, true);
  assert.match(r.issues.join(' '), /Gutscheincode/);
});

test('Warenkorbstufe: Mindestwarenwert blockiert', async () => {
  const config = {
    cart: { minimumOrderValue: 10_000, customerGroupDiscountPercent: {}, vouchers: {} },
  };
  const r = calculatePipeline({ positions: [await position()] }, config);

  assert.equal(r.blocked, true);
  assert.match(r.issues.join(' '), /Mindestwarenwert/);
});

// ── Bestellebene ──────────────────────────────────────────────────────

test('Bestellstufe: ohne Lieferland kein Versandposten', async () => {
  const r = calculatePipeline({ positions: [await position()] });
  assert.equal(r.lines.filter((l) => l.category === 'versand').length, 0);
});

test('Bestellstufe: unbekanntes Lieferland blockiert', async () => {
  const r = calculatePipeline({ positions: [await position()], shippingCountry: 'Neuseeland' });

  assert.equal(r.blocked, true);
  assert.match(r.issues.join(' '), /Versandtarif/);
});

test('Bestellstufe: Zahlungsartzuschlag und Express', async () => {
  const config = {
    order: {
      paymentSurcharge: { rechnung: 2.5 },
      expressSurcharge: 20,
      pricesIncludeTax: true,
    },
  };
  const r = calculatePipeline(
    { positions: [await position()], paymentMethod: 'rechnung', express: true },
    config
  );

  assert.ok(r.lines.some((l) => l.category === 'gebuehr'));
  assert.ok(r.lines.some((l) => l.id === 'order:express'));
  assert.equal(sumLines(r.lines), r.grandTotal);
});

test('Bestellstufe: enthaltene Steuer wird ausgewiesen, aber nicht aufgeschlagen', async () => {
  const config = {
    order: { paymentSurcharge: {}, expressSurcharge: 0, pricesIncludeTax: true },
  };
  const ohne = calculatePipeline({ positions: [await position()] });
  const mit = calculatePipeline({ positions: [await position()] }, config);

  assert.equal(mit.grandTotal, ohne.grandTotal, 'Bruttopreise: Steuer erhöht die Summe nicht');
  assert.ok(mit.taxAmount > 0, 'sie wird aber ausgewiesen');
  assert.equal(sumLines(mit.lines), mit.grandTotal);
});

test('Bestellstufe: aufgeschlagene Steuer erhöht die Summe', async () => {
  const config = {
    order: { paymentSurcharge: {}, expressSurcharge: 0, pricesIncludeTax: false },
  };
  const ohne = calculatePipeline({ positions: [await position()] });
  const mit = calculatePipeline({ positions: [await position()] }, config);

  assert.ok(mit.grandTotal > ohne.grandTotal);
  assert.equal(sumLines(mit.lines), mit.grandTotal);
});

// ── Standardzustand ───────────────────────────────────────────────────

test('Im Standard entsteht genau ein Posten: die ausgewiesene Umsatzsteuer', async () => {
  // Seit dem 2026-07-22 ist die Steuer nicht mehr abschaltbar – der Satz
  // kommt aus config/pricing/steuer.ts und gilt immer. Weil die Katalogpreise
  // brutto sind, wird sie nur AUSGEWIESEN und erhöht die Summe nicht.
  const r = calculatePipeline({ positions: [await position()] });

  assert.equal(r.cart.lines.length, 0, 'Warenkorbstufe ist im Standard leer');
  assert.equal(r.order.lines.length, 1, 'nur die Steuerzeile');
  assert.equal(r.order.lines[0]!.category, 'steuer');
  assert.equal(r.order.lines[0]!.total, 0, 'enthaltene Steuer verändert die Summe nicht');
  assert.ok(r.taxAmount > 0, 'ausgewiesen wird sie trotzdem');
  assert.equal(r.blocked, false);
});

test('Eine blockierte Position blockiert die gesamte Pipeline', async () => {
  const vorher = process.env.NODE_ENV;
  const env = process.env as Record<string, string | undefined>;
  const originalError = console.error;
  console.error = () => {};
  try {
    env.NODE_ENV = 'production';
    const kaputt = {
      id: 'x', ruleType: 'gibt_es_nicht', price: 5, label: '?', isActive: true,
    } as unknown as PricingRule;
    const r = calculatePipeline({
      positions: [await position({ pricingRules: [...(await getPricingRules('dtf')), kaputt] })],
    });

    assert.equal(r.blocked, true);
    assert.match(r.issues.join(' '), /Unbekannter Preisbaustein/);
  } finally {
    console.error = originalError;
    env.NODE_ENV = vorher;
  }
});
