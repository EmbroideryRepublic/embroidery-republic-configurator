/**
 * Grundpreis eines Textils: (Netto-Einkaufspreis + Umsatzsteuer darauf + Aufschlag), aufgerundet auf x,99 €.
 *
 * Hintergrund (2026-11-12): Die Einkaufspreise im Katalog sind die Nettopreise der Lieferanten-Shops. Als
 * Kleinunternehmer kann das Unternehmen die Vorsteuer nicht abziehen, die 19 % sind also echte Kosten. Vorher
 * wurden sie nicht mitgerechnet, die Verkaufspreise lagen im Schnitt rund 2 € zu niedrig.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { computeBasePrice, FLAT_MARKUP_EUR } from '../marginTiers';
import { nettoZuBrutto } from '../steuer';

const mitUst = (ek: number) => Math.floor(Math.round((nettoZuBrutto(ek) + FLAT_MARKUP_EUR) * 10000) / 10000) + 1.99;

test('Grundpreis: die Umsatzsteuer auf den Einkauf wird mitgerechnet', () => {
  // 4,20 € netto = 5,00 € brutto → 13,00 € → nächster voller Euro + 0,99
  assert.equal(computeBasePrice(4.2, 'basic'), 14.99);
  // 20,00 € netto = 23,80 € brutto → 31,80 € → 32,99 €; ohne Umsatzsteuer wären es 29,99 € gewesen
  assert.equal(computeBasePrice(20, 'premium'), 32.99);
  assert.ok(computeBasePrice(20, 'premium') > Math.floor(20 + FLAT_MARKUP_EUR) + 1.99, 'mit USt teurer als ohne');
});

test('Grundpreis: ein exakt glatter Eurobetrag springt auf den nächsten vollen Euro + 0,99 (nicht darunter)', () => {
  // 5,00 € netto → 5,95 € brutto → 13,95 € → 14,99 €
  assert.equal(computeBasePrice(5, 'basic'), 14.99);
  // 2,52 € netto = 3,00 € brutto (2,52 × 1,19 = 2,9988 → gerundet 3,00) → 11,00 € → 12,99 €
  assert.equal(computeBasePrice(2.52, 'basic'), 12.99);
});

test('Grundpreis: jeder Katalogpreis folgt der Formel und endet auf ,99 €', () => {
  for (const p of PRODUCTS) {
    assert.equal(p.basePrice, mitUst(p.purchasePrice), `${p.id}: Katalogpreis weicht von der Formel ab`);
    assert.equal(Math.round(p.basePrice * 100) % 100, 99, `${p.id}: Preis endet nicht auf ,99 €`);
    assert.ok(p.basePrice >= nettoZuBrutto(p.purchasePrice) + FLAT_MARKUP_EUR, `${p.id}: Preis liegt unter Einkauf inkl. USt + Aufschlag`);
  }
});

test('Grundpreis: der Aufschlag über dem Einkauf inkl. Umsatzsteuer beträgt mindestens den festen Aufschlag', () => {
  for (const p of PRODUCTS) {
    const echteMarge = p.basePrice - nettoZuBrutto(p.purchasePrice);
    assert.ok(echteMarge >= FLAT_MARKUP_EUR - 0.005, `${p.id}: Marge ${echteMarge.toFixed(2)} € unter ${FLAT_MARKUP_EUR} €`);
  }
});
