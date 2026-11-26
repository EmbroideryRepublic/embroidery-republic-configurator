/**
 * Preisdetails im Konfigurator (Betreiberfreigabe 2026-11-25): Die angezeigten Zeilen müssen genau den angezeigten Stückpreis ergeben.
 *
 * Vorher fehlten dort die Rundung auf den nächsten ,99-Betrag (z. B. 25 Polos: 10,99 + 7,50 = 18,49, angezeigt 18,99) und bei 1–2 Stück die
 * Einrichtung. Das ist eine reine Anzeige-Ergänzung (`breakdown.rundungPerUnit`, Zeilen „Einrichtung (einmalig)“ und „Rundung auf ,99 €“);
 * Preisberechnung und Preislogik sind unverändert, die übrigen Preis-Tests laufen weiter unverändert.
 *
 * Seit 2026-11-26 gehört dazu die Zeile „Mengenpreis wie bei N Stück“ (`breakdown.mengenDeckelPerUnit`, negativ): Kurz vor einer Staffelgrenze
 * deckelt der Mengenpreis-Deckel den Gesamtpreis (calculatePrice); die Zeile weist die Ersparnis je Stück aus, damit die Summe stimmt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { calculatePrice } from '../calculatePrice';

function element(view: 'front' | 'back', i: number): ConfigElement {
  return {
    id: `e${i}`, type: 'logo', view, xCm: 0, yCm: 0, widthCm: 10, heightCm: 10, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: 'Logo', locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 800, originalHeightPx: 800, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85,
  } as ConfigElement;
}

const MENGEN = [1, 2, 3, 4, 5, 9, 10, 19, 20, 25, 47, 48, 49, 50, 97, 99, 100, 250, 480, 499, 500, 950, 1000];

test('Preisdetails: Summe der angezeigten Zeilen = angezeigter Stückpreis (DTF, alle Produkte, 1–2 Positionen, 17 Mengen, auch mit Großformat)', async () => {
  const rules = await getPricingRules('dtf');
  let positiv = 0;
  let negativ = 0;
  let mitEinrichtung = 0;
  let mitGrossformat = 0;
  let mitMengenpreis = 0;
  let geprueft = 0;
  for (const p of PRODUCTS) {
    for (const menge of MENGEN) {
      for (const ansichten of [['front'], ['front', 'back']] as const) {
        for (const gross of [false, true]) {
          const elemente = ansichten.map((v, i) => element(v, i));
          const r = calculatePrice({
            basePrice: p.basePrice,
            quantity: menge,
            elements: elemente,
            pricingRules: rules,
            echteMasse: gross ? elemente.map(() => ({ breiteCm: 40, hoeheCm: 45 })) : undefined,
          });
          const b = r.breakdown;
          const flaeche = Object.values(b.areaPriceByView).reduce((a, x) => a + x, 0);
          const summe =
            b.basePrice + b.positionFeeTotal + flaeche + b.grossformatPerUnit + b.setupPerUnit + b.rundungPerUnit + b.mengenDeckelPerUnit;
          assert.ok(
            Math.abs(summe - r.unitPrice) < 0.0051,
            `${p.id} × ${menge} (${ansichten.join('+')}${gross ? ', Großformat' : ''}): Zeilen ${summe.toFixed(2)} ≠ Stückpreis ${r.unitPrice.toFixed(2)}`
          );
          assert.ok(Math.abs(b.rundungPerUnit) <= 0.5 + 0.011, `${p.id} × ${menge}: Rundung ${b.rundungPerUnit} größer als ± 0,50 €`);
          if (b.rundungPerUnit > 0.005) positiv++;
          if (b.rundungPerUnit < -0.005) negativ++;
          if (b.setupPerUnit > 0) mitEinrichtung++;
          if (b.grossformatPerUnit > 0) mitGrossformat++;
          if (b.mengenDeckelPerUnit < -0.005) {
            mitMengenpreis++;
            // Der Deckel ist immer eine Ersparnis (negativ) und gehört zu einer Staffelgrenze über der gewählten Menge.
            assert.ok(b.mengenDeckelTotal < 0 && b.mengenDeckelAufMenge !== null && b.mengenDeckelAufMenge > menge, `${p.id} × ${menge}: Deckel ohne Grenzmenge`);
          } else {
            assert.ok(b.mengenDeckelPerUnit === 0 || Math.abs(b.mengenDeckelPerUnit) < 0.006, `${p.id} × ${menge}: Deckel ${b.mengenDeckelPerUnit} ohne Zeile`);
          }
          geprueft++;
        }
      }
    }
  }
  assert.ok(geprueft > 10000, `zu wenige Fälle geprüft: ${geprueft}`);
  assert.ok(positiv > 0 && negativ > 0, `positive (${positiv}) und negative (${negativ}) Rundungsbeträge müssen vorkommen`);
  assert.ok(mitEinrichtung > 0 && mitGrossformat > 0, 'Einrichtung und Großformat müssen vorkommen');
  assert.ok(mitMengenpreis > 0, 'Fälle mit Mengenpreis-Deckel (Menge knapp unter einer Staffelgrenze) müssen vorkommen');
});

test('Preisdetails: der Beispielfall (25 Polos, Brust): 10,99 + 8,50 + Rundung 0,50 = 19,99 (bis 2026-11-25: 10,99 + 7,50 + 0,50 = 18,99)', async () => {
  const rules = await getPricingRules('dtf');
  const polo = PRODUCTS.find((p) => p.id === 'bundc-unisex-polo-id-001')!;
  const r = calculatePrice({ basePrice: polo.basePrice, quantity: 25, elements: [element('front', 0)], pricingRules: rules });
  assert.equal(r.unitPrice, 19.99);
  assert.equal(r.breakdown.basePrice, 10.99);
  assert.equal(r.breakdown.areaPriceByView.front, 8.5);
  assert.equal(r.breakdown.rundungPerUnit, 0.5);
  assert.equal(r.breakdown.mengenDeckelPerUnit, 0, '25 Stück liegen nicht kurz vor einer Staffelgrenze');
  const eins = calculatePrice({ basePrice: polo.basePrice, quantity: 1, elements: [element('front', 0)], pricingRules: rules });
  assert.equal(eins.unitPrice, 32.99);
  assert.equal(eins.breakdown.setupPerUnit, 10);
  assert.equal(eins.breakdown.rundungPerUnit, 0);
});

test('Preisdetails: die Zeilen „Einrichtung (einmalig)“ und „Rundung auf ,99 €“ stehen im Konfigurator, mit Vorzeichen für die Rundung', () => {
  const q = readFileSync('src/components/configurator/SummaryPanel.tsx', 'utf8');
  assert.match(q, /Einrichtung \(einmalig\)/);
  assert.match(q, /data-testid="einrichtung-zeile"/);
  assert.match(q, /Rundung auf ,99 €/);
  assert.match(q, /data-testid="rundung-zeile"/);
  assert.match(q, /breakdown\.rundungPerUnit > 0 \? '\+' : '−'/, 'positive UND negative Rundungsbeträge mit Vorzeichen');
  assert.match(q, /Math\.abs\(breakdown\.rundungPerUnit\) >= 0\.005/, 'die Zeile erscheint nur, wenn die Rundung nicht 0 ist');
  assert.match(q, /Der Stückpreis wird auf den nächsten ,99-€-Betrag gerundet \(höchstens ± 0,50 €\)\./);
});

test('Preisdetails: die Zeile „Mengenpreis wie bei N Stück“ (Mengenpreis-Deckel) steht im Konfigurator, nur bei echter Ersparnis, und der Tipp nennt den Gesamtpreis', () => {
  const q = readFileSync('src/components/configurator/SummaryPanel.tsx', 'utf8');
  assert.match(q, /data-testid="mengenpreis-zeile"/);
  assert.match(q, /Mengenpreis wie bei \{breakdown\.mengenDeckelAufMenge\} Stück/);
  assert.match(q, /breakdown\.mengenDeckelPerUnit < -0\.005/, 'die Zeile erscheint nur, wenn der Deckel wirkt');
  assert.match(q, /Mit \{mengenTipp\.menge\} statt \{quantity\} Stück zahlst du genauso viel/);
  assert.match(q, /Preis wie bei \$\{breakdown\.mengenDeckelAufMenge\} Stück/, 'in der Zone steht statt „Stückpreis × Menge“, wessen Preis gilt');
});
