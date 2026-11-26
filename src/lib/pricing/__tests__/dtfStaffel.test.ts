/**
 * DTF-Mengenstaffel (Festlegung 2026-11-18): Auf jeder Stufe (3, 5, 10, 20, 50, 100 Stück) wird der Stückpreis für JEDES Modell
 * sichtbar niedriger, der Gewinn je Bestellung steigt trotzdem mit der Menge (Rechnung siehe docs/kalkulationsmodell.md).
 *
 * Die Stickerei-Kalkulation (Positionsstaffel + 1,20 €/1.000 Stiche) darf sich dadurch NIE ändern – dafür stehen unten
 * eingefrorene Vergleichspreise, gemessen vor der Änderung.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import {
  calculatePrice,
  DTF_GRUNDPREIS_STAFFEL,
  getDtfGrundpreisStufe,
  QUANTITY_TIERS,
} from '../calculatePrice';
import { findeNaechsteStufe } from '../mengenTipp';

function element(view: string, stitches: number, breite = 8, hoehe = 8): ConfigElement {
  return {
    id: view, type: 'logo', view, xCm: 5, yCm: 10, widthCm: breite, heightCm: hoehe, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: stitches, name: view, locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 1000, originalHeightPx: 1000, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 1,
  } as ConfigElement;
}

// Gesamtpreise der Stickerei VOR der Staffel-Änderung (Grundpreis | Stück | Anzahl Positionen).
const STICKEREI_VORHER: Record<string, number> = {
  '19.99|1|1pos': 38.99, '19.99|1|2pos': 49.99, '19.99|3|1pos': 113.97, '19.99|3|2pos': 143.97,
  '19.99|5|1pos': 174.95, '19.99|5|2pos': 224.95, '19.99|10|1pos': 329.9, '19.99|10|2pos': 409.9,
  '19.99|20|1pos': 659.8, '19.99|20|2pos': 799.8, '19.99|25|1pos': 799.75, '19.99|25|2pos': 999.75,
  '19.99|50|1pos': 1499.5, '19.99|50|2pos': 1849.5, '19.99|100|1pos': 2799, '19.99|100|2pos': 3399,
  '29.99|1|1pos': 48.99, '29.99|1|2pos': 59.99, '29.99|3|1pos': 143.97, '29.99|3|2pos': 173.97,
  '29.99|5|1pos': 224.95, '29.99|5|2pos': 274.95, '29.99|10|1pos': 429.9, '29.99|10|2pos': 509.9,
  '29.99|20|1pos': 839.8, '29.99|20|2pos': 999.8, '29.99|25|1pos': 1049.75, '29.99|25|2pos': 1249.75,
  '29.99|50|1pos': 1999.5, '29.99|50|2pos': 2299.5, '29.99|100|1pos': 3599, '29.99|100|2pos': 4199,
};

test('Stickerei: Preise unverändert (die DTF-Staffel darf sie nicht berühren)', async () => {
  const regeln = await getPricingRules('embroidery');
  for (const [schluessel, soll] of Object.entries(STICKEREI_VORHER)) {
    const [basis, menge, pos] = schluessel.split('|') as [string, string, string];
    const elemente = pos === '1pos' ? [element('front', 8000)] : [element('front', 8000), element('back', 5000)];
    const r = calculatePrice({ basePrice: Number(basis), quantity: Number(menge), elements: elemente, pricingRules: regeln });
    assert.equal(r.totalPrice, soll, `Stickerei ${schluessel}: ${r.totalPrice} statt ${soll}`);
  }
});

test('Staffeltabelle: aufsteigende Stufen, Rabatt wird nie kleiner, ab 100 Stück mindestens so groß wie die alte Staffel', () => {
  let minMenge = 0;
  let prozent = 0;
  let euro = 0;
  for (const s of DTF_GRUNDPREIS_STAFFEL) {
    assert.ok(s.minQuantity > minMenge, `Stufe ${s.minQuantity} nicht aufsteigend`);
    assert.ok(s.prozent >= prozent, `Prozent sinkt bei ${s.minQuantity}`);
    assert.ok(s.mindestensEuro >= euro, `Mindest-Euro sinkt bei ${s.minQuantity}`);
    minMenge = s.minQuantity;
    prozent = s.prozent;
    euro = s.mindestensEuro;
  }
  assert.equal(getDtfGrundpreisStufe(1).mindestensEuro, 0);
  assert.equal(getDtfGrundpreisStufe(4).mindestensEuro, 0);
  assert.equal(getDtfGrundpreisStufe(5).mindestensEuro, 1);
  // ab 100 Stück gilt mindestens der bisherige Prozentsatz (große Mengen werden nicht teurer als vorher)
  for (const alt of QUANTITY_TIERS.filter((t) => t.minQuantity >= 100)) {
    assert.ok(getDtfGrundpreisStufe(alt.minQuantity).prozent >= alt.baseDiscountPercent, `ab ${alt.minQuantity} Stück zu wenig Rabatt`);
  }
});

test('DTF: der reguläre Stückpreis sinkt für JEDES Modell auf jeder Stufe um mindestens 1 € und steigt nie mit der Menge', async () => {
  const regeln = await getPricingRules('dtf');
  const stufen = [3, 5, 10, 20, 50, 100];
  for (const p of PRODUCTS) {
    let vorher = Number.POSITIVE_INFINITY;
    for (let menge = 1; menge <= 150; menge++) {
      // Reguläre Staffel ohne Mengenpreis-Deckel: Der Deckel glättet den Übergang kurz VOR einer Stufe (der Stückpreis sinkt dort schon
      // in mehreren Schritten); der Preis der Stufe selbst und der davor gültige reguläre Preis unterscheiden sich weiterhin um mindestens 1 €.
      const stueck = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [element('front', 0, 20, 25)], pricingRules: regeln, mengenDeckel: false }).unitPrice;
      assert.ok(stueck <= vorher + 0.005, `${p.id}: Stückpreis steigt bei ${menge} Stück (${stueck} > ${vorher})`);
      if (stufen.includes(menge)) {
        assert.ok(vorher - stueck >= 0.99, `${p.id}: bei ${menge} Stück sinkt der Stückpreis nicht um 1 € (${vorher} → ${stueck})`);
      }
      vorher = stueck;
    }
  }
});

test('DTF: mit Mengenpreis-Deckel steigt der Stückpreis nie und der Gesamtpreis sinkt nie (Mengen 1–150, alle Modelle)', async () => {
  const regeln = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    let stueckVorher = Number.POSITIVE_INFINITY;
    let gesamtVorher = 0;
    for (let menge = 1; menge <= 150; menge++) {
      const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [element('front', 0, 20, 25)], pricingRules: regeln });
      assert.ok(r.unitPrice <= stueckVorher + 0.005, `${p.id}: Stückpreis steigt bei ${menge} Stück (${r.unitPrice} > ${stueckVorher})`);
      assert.ok(r.totalPrice >= gesamtVorher - 0.005, `${p.id}: Gesamtpreis sinkt bei ${menge} Stück (${r.totalPrice} < ${gesamtVorher})`);
      stueckVorher = r.unitPrice;
      gesamtVorher = r.totalPrice;
    }
  }
});

test('DTF: ausgewiesener Mengenrabatt passt zum Preis (Grundpreis abzüglich Rabatt, eine Nachkommastelle)', async () => {
  const regeln = await getPricingRules('dtf');
  const p = PRODUCTS[0]!;
  for (const menge of [1, 5, 10, 20, 50, 100]) {
    const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: [element('front', 0, 20, 25)], pricingRules: regeln });
    const prozent = r.breakdown.baseDiscountPercent;
    assert.ok(Number.isFinite(prozent) && prozent >= 0 && prozent <= 100, `ungültiger Rabatt ${prozent}`);
    assert.equal(prozent, Math.round(prozent * 10) / 10, 'mehr als eine Nachkommastelle');
    const erwartet = Math.round(p.basePrice * (1 - prozent / 100) * 100) / 100;
    assert.ok(Math.abs(r.breakdown.basePrice - erwartet) <= 0.05, `${menge} Stück: Grundpreis ${r.breakdown.basePrice} ≠ ${erwartet}`);
  }
});

test('Nächste Stufe: nennt die Menge, ab der der Stückpreis sinkt, und den neuen Stückpreis', async () => {
  const regeln = await getPricingRules('dtf');
  const p = PRODUCTS[0]!;
  const eingabe = (menge: number) => ({ basePrice: p.basePrice, quantity: menge, elements: [element('front', 0, 20, 25)], pricingRules: regeln });
  const stueck = (menge: number) => calculatePrice(eingabe(menge)).unitPrice;

  const erwartet: Array<[number, number]> = [[1, 2], [2, 3], [3, 5], [4, 5], [5, 10], [9, 10], [10, 20], [19, 20], [20, 50], [49, 50], [50, 100], [99, 100]];
  for (const [von, bis] of erwartet) {
    const n = findeNaechsteStufe(eingabe(von));
    assert.ok(n, `bei ${von} Stück fehlt die nächste Stufe`);
    assert.equal(n.menge, bis, `bei ${von} Stück: nächste Stufe ${n.menge} statt ${bis}`);
    assert.equal(n.mehrStueck, bis - von);
    assert.equal(n.stueckpreis, stueck(bis), `bei ${von} Stück: genannter Preis weicht vom echten ab`);
    assert.ok(n.stueckpreis < stueck(von), `bei ${von} Stück: nächste Stufe ist nicht günstiger`);
  }
  assert.equal(findeNaechsteStufe({ ...eingabe(3), quantity: 0 }), null);
  assert.equal(findeNaechsteStufe({ ...eingabe(3), pricingRules: [] }), null);
});
