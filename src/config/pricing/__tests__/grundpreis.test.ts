/**
 * Grundpreis eines Textils (Festlegung des Betreibers 2026-11-12, „goldene Mitte“):
 *
 *   Verkaufspreis = der HÖHERE von
 *     1. dem bisherigen Preis (Einkauf netto + 8 €, aufgerundet auf den nächsthöheren vollen Euro + 0,99 €) und
 *     2. dem kostendeckenden Preis (Einkauf INKL. Umsatzsteuer + 8 €, aufgerundet auf den nächsten ,99-Betrag).
 *
 * Hintergrund: Die Einkaufspreise im Katalog sind die Nettopreise der Lieferanten-Shops. Als Kleinunternehmer kann das
 * Unternehmen die Vorsteuer nicht abziehen, die 19 % sind also echte Kosten. Die erste Fassung (Einkauf + 19 % + 8 €,
 * aufgerundet auf den nächsthöheren vollen Euro) lag im Schnitt rund 2 € über den früheren Preisen – zu hoch.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { computeBasePrice, FLAT_MARKUP_EUR } from '../marginTiers';
import { nettoZuBrutto } from '../steuer';

const alteRegel = (ek: number) => Math.floor(Math.round((ek + FLAT_MARKUP_EUR) * 10000) / 10000) + 1.99;
const ersteFassung = (ek: number) => Math.floor(Math.round((nettoZuBrutto(ek) + FLAT_MARKUP_EUR) * 10000) / 10000) + 1.99;
const kostendeckend = (ek: number) => Math.ceil(Math.round((nettoZuBrutto(ek) + FLAT_MARKUP_EUR - 0.99) * 10000) / 10000) + 0.99;

test('Grundpreis: Beispiele', () => {
  // 4,20 € netto = 5,00 € brutto: bisher 13,99 €, kostendeckend 13,99 € → 13,99 € (die erste Fassung hatte 14,99 €)
  assert.equal(computeBasePrice(4.2, 'basic'), 13.99);
  // 20,00 € netto = 23,80 € brutto: bisher 29,99 €, kostendeckend 31,99 € → 31,99 € (die erste Fassung hatte 32,99 €)
  assert.equal(computeBasePrice(20, 'premium'), 31.99);
  // 5,00 € netto = 5,95 € brutto: bisher 14,99 €, kostendeckend 13,99 € → 14,99 € (nie billiger als vorher)
  assert.equal(computeBasePrice(5, 'basic'), 14.99);
  // 2,52 € netto = 3,00 € brutto: bisher 10,52 → 11,99 €, kostendeckend 11,00 → 11,99 € → 11,99 €
  assert.equal(computeBasePrice(2.52, 'basic'), 11.99);
});

test('Grundpreis: jeder Katalogpreis folgt der Regel und endet auf ,99 €', () => {
  for (const p of PRODUCTS) {
    assert.equal(p.basePrice, Math.max(alteRegel(p.purchasePrice), kostendeckend(p.purchasePrice)), `${p.id}: Katalogpreis weicht von der Regel ab`);
    assert.equal(Math.round(p.basePrice * 100) % 100, 99, `${p.id}: Preis endet nicht auf ,99 €`);
  }
});

test('Grundpreis: nie billiger als vorher, nie teurer als in der ersten Fassung', () => {
  for (const p of PRODUCTS) {
    assert.ok(p.basePrice >= alteRegel(p.purchasePrice) - 0.005, `${p.id}: billiger als vor der Korrektur`);
    assert.ok(p.basePrice <= ersteFassung(p.purchasePrice) + 0.005, `${p.id}: teurer als die zu hohe erste Fassung`);
  }
});

test('Grundpreis: Einkauf inkl. Umsatzsteuer plus der feste Aufschlag ist immer gedeckt', () => {
  for (const p of PRODUCTS) {
    const echteMarge = p.basePrice - nettoZuBrutto(p.purchasePrice);
    assert.ok(echteMarge >= FLAT_MARKUP_EUR - 0.005, `${p.id}: Marge ${echteMarge.toFixed(2)} € unter ${FLAT_MARKUP_EUR} €`);
  }
});
