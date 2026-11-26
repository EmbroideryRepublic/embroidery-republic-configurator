/**
 * WÄCHTER DER MENGENSTAFFEL (Festlegung 2026-11-26: „Staffelpreise sollen Sinn ergeben“, weniger Mengenrabatt).
 *
 * Ausgangsfund: Beim Fruit of the Loom Heavy-T kosteten 19 Stück zusammen 360,81 €, aber 20 Stück nur 359,80 € – weniger Stück waren teurer als mehr
 * Stück. Jede Staffelstufe gilt für die GESAMTE Bestellung; auf der ,99-Leiter ist ein Sprung mindestens 1 € je Stück, und ein Sprung von u auf u − 1 €
 * bei der Menge g hält die Gesamtsumme nur dann steigend, wenn u ≥ g ist – bei Stückpreisen von 20–40 € also nur bis etwa 20–40 Stück. Deshalb deckelt
 * calculatePrice() den Gesamtpreis kurz VOR jeder Staffelgrenze auf den Preis der Grenzmenge (Mengenpreis-Deckel).
 *
 * Diese Tests prüfen gegen den ECHTEN Katalog (alle Modelle) und die echten Preisregeln, nicht gegen Mock-Daten:
 *   1. Gesamtpreis sinkt nie, Stückpreis steigt nie: Mengen 1–1500, 1–3 Positionen, mit und ohne Großformat.
 *   2. Der Deckel wirkt nur kurz vor einer Grenze, nennt eine echte Grenzmenge und hält den Gesamtpreis flach.
 *   3. Die Grenzmengen selbst behalten ihren regulären Stufenpreis auf ,99 (Preislisten und Preisbeispiele bleiben wahr).
 *   4. Weniger Mengenrabatt: ab 3 Stück genau 1,00 € über dem Stand vom 2026-11-25, 1 und 2 Stück unverändert.
 *   5. Server (priceCart) und Pipeline-Posten zeigen dasselbe wie der Rechenkern; der Deckel steht als eigener Posten da.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { CartItem, ConfigElement } from '@/types';
import { PRODUCTS } from '@/config/products';
import { getPricingRules, KLEINAUFTRAG_REGEL_ID } from '@/config/pricingRules';
import { aufNaechsten99 } from '../ladenpreis';
import {
  calculatePrice,
  getDtfGrundpreisStufe,
  staffelgrenzen,
  STICKEREI_POSITION_TIERS,
} from '../calculatePrice';
import { priceCart, priceCartItem } from '../serverPricing';

const ANSICHTEN = ['front', 'back', 'sleeve_left'] as const;

function logo(view: (typeof ANSICHTEN)[number], breite = 20, hoehe = 25): ConfigElement {
  return {
    id: `el-${view}`, type: 'logo', view, xCm: 5, yCm: 10, widthCm: breite, heightCm: hoehe, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: view, locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 1000, originalHeightPx: 1250, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 1,
  } as ConfigElement;
}

const MAX_MENGE = 1500;

test('Staffelgrenzen der DTF-Regeln: alle Stufen beider Tabellen plus das Ende der Einrichtung (3 Stück), aufsteigend', async () => {
  const regeln = await getPricingRules('dtf');
  assert.deepEqual(staffelgrenzen(regeln), [3, 5, 10, 20, 50, 100, 250, 500, 1000]);
  // Ohne die Einrichtungsregel bleibt die 3 über die Positionsstaffel erhalten; mit einer Regel mit Mengenfenster kommen deren Grenzen dazu.
  const mitFenster = [...regeln, { id: 'x', ruleType: 'discount_percent' as const, price: 5, label: 'Aktion', isActive: true, minQuantity: 30, maxQuantity: 39 }];
  assert.deepEqual(staffelgrenzen(mitFenster), [3, 5, 10, 20, 30, 40, 50, 100, 250, 500, 1000]);
});

test('Gesamtpreis sinkt nie, Stückpreis steigt nie: alle Modelle, Mengen 1–1500, 1–3 Positionen, mit und ohne Großformat', async () => {
  const regeln = await getPricingRules('dtf');
  let faelle = 0;
  let mitDeckel = 0;
  for (const p of PRODUCTS) {
    for (const n of [1, 2, 3]) {
      for (const gross of [false, true]) {
        const elemente = ANSICHTEN.slice(0, n).map((v) => logo(v));
        const echteMasse = gross ? elemente.map(() => ({ breiteCm: 40, hoeheCm: 45 })) : undefined;
        let gesamtVorher = 0;
        let stueckVorher = Number.POSITIVE_INFINITY;
        for (let menge = 1; menge <= MAX_MENGE; menge++) {
          const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: elemente, pricingRules: regeln, echteMasse });
          const wo = `${p.id} × ${menge} (${n} Position/en${gross ? ', Großformat' : ''})`;
          assert.ok(r.totalPrice >= gesamtVorher - 0.005, `${wo}: Gesamtpreis sinkt (${gesamtVorher} → ${r.totalPrice})`);
          assert.ok(r.unitPrice <= stueckVorher + 0.005, `${wo}: Stückpreis steigt (${stueckVorher} → ${r.unitPrice})`);
          assert.ok(Math.abs(r.unitPrice * menge - r.totalPrice) <= 0.005 * menge + 0.005, `${wo}: Stückpreis × Menge ≠ Gesamtpreis`);
          assert.equal(r.hasErrors, false, wo);
          if (r.breakdown.mengenDeckelAufMenge !== null) mitDeckel++;
          gesamtVorher = r.totalPrice;
          stueckVorher = r.unitPrice;
          faelle++;
        }
      }
    }
  }
  assert.ok(faelle >= PRODUCTS.length * 6 * MAX_MENGE, `zu wenige Fälle geprüft: ${faelle}`);
  assert.ok(mitDeckel > 0, 'der Mengenpreis-Deckel muss vorkommen');
});

test('Der Deckel wirkt nur kurz vor einer Staffelgrenze, hält den Gesamtpreis flach und endet an der Grenzmenge', async () => {
  const regeln = await getPricingRules('dtf');
  const grenzen = new Set(staffelgrenzen(regeln));
  let zonen = 0;
  for (const p of PRODUCTS) {
    for (const n of [1, 2, 3]) {
      const elemente = ANSICHTEN.slice(0, n).map((v) => logo(v));
      const eingabe = (menge: number) => ({ basePrice: p.basePrice, quantity: menge, elements: elemente, pricingRules: regeln });
      // Bis 1.100 Stück: deckt alle Zonen bis zur Grenze 1000 ab (die längste ist rund 150 Stück lang); darüber gibt es keine Grenze mehr.
      for (let menge = 1; menge <= 1100; menge++) {
        const r = calculatePrice(eingabe(menge));
        const b = r.breakdown;
        if (b.mengenDeckelAufMenge === null) {
          assert.equal(b.mengenDeckelTotal, 0, `${p.id} × ${menge}`);
          assert.equal(b.mengenDeckelPerUnit, 0, `${p.id} × ${menge}`);
          continue;
        }
        zonen++;
        const g = b.mengenDeckelAufMenge;
        const wo = `${p.id} × ${menge} (${n} Position/en) → ${g}`;
        assert.ok(grenzen.has(g) && g > menge, `${wo}: keine Staffelgrenze über der Menge`);
        assert.ok(g - menge <= 0.2 * g, `${wo}: Zone länger als 20 % der Grenzmenge`);
        assert.ok(b.mengenDeckelTotal < 0 && b.mengenDeckelPerUnit <= 0, `${wo}: der Deckel ist immer eine Ersparnis`);
        const regulaer = calculatePrice({ ...eingabe(menge), mengenDeckel: false });
        assert.equal(Math.round((r.totalPrice - regulaer.totalPrice) * 100) / 100, b.mengenDeckelTotal, `${wo}: Deckelbetrag`);
        // Der Gesamtpreis ist der der Grenzmenge – und auf dem Weg dorthin bleibt er gleich.
        const grenze = calculatePrice({ ...eingabe(g), mengenDeckel: false });
        assert.equal(r.totalPrice, grenze.totalPrice, `${wo}: Gesamtpreis ≠ Preis der Grenzmenge`);
        assert.ok(r.totalPrice < regulaer.totalPrice - 0.004, `${wo}: ohne Ersparnis kein Deckel`);
      }
    }
  }
  assert.ok(zonen > 1000, `zu wenige Zonen geprüft: ${zonen}`);
});

test('Die Grenzmengen selbst behalten ihren regulären Stufenpreis auf ,99 (für alle Modelle und 1–3 Positionen)', async () => {
  const regeln = await getPricingRules('dtf');
  for (const p of PRODUCTS) {
    for (const n of [1, 2, 3]) {
      const elemente = ANSICHTEN.slice(0, n).map((v) => logo(v));
      for (const g of staffelgrenzen(regeln)) {
        const r = calculatePrice({ basePrice: p.basePrice, quantity: g, elements: elemente, pricingRules: regeln });
        const wo = `${p.id} × ${g} (${n} Position/en)`;
        assert.equal(r.breakdown.mengenDeckelAufMenge, null, `${wo}: auf der Grenzmenge darf kein Deckel wirken`);
        assert.equal(Math.round(r.unitPrice * 100) % 100, 99, `${wo}: ${r.unitPrice} endet nicht auf ,99`);
      }
    }
  }
});

test('Weniger Mengenrabatt: ab 3 Stück genau 1,00 € über dem Stand vom 2026-11-25 (alle Modelle, 1–3 Positionen), 1 und 2 Stück unverändert', async () => {
  const regeln = (await getPricingRules('dtf')).filter((r) => r.id !== KLEINAUFTRAG_REGEL_ID);
  const mengen = [1, 2, 3, 4, 5, 9, 10, 19, 20, 24, 25, 49, 50, 99, 100, 249, 250, 499, 500, 999, 1000];
  // Der alte Stand, unabhängig nachgerechnet: Grundpreis − Grundpreis-Rabatt (DTF_GRUNDPREIS_STAFFEL, unverändert) + Positionspreise der alten Tabelle.
  const alt = (basePrice: number, menge: number, ansichten: number): number => {
    const stufe = getDtfGrundpreisStufe(menge);
    const rabatt = Math.min(basePrice, Math.max((basePrice * stufe.prozent) / 100, stufe.mindestensEuro));
    let t = STICKEREI_POSITION_TIERS[0]!;
    for (const s of STICKEREI_POSITION_TIERS) if (menge >= s.minQuantity) t = s;
    const positionen = ansichten === 1 ? t.erste : ansichten === 2 ? t.erste + t.zweite : t.erste + t.zweite + t.abDritte;
    return aufNaechsten99(basePrice - rabatt + positionen);
  };
  for (const p of PRODUCTS) {
    for (const n of [1, 2, 3]) {
      for (const menge of mengen) {
        const neu = calculatePrice({
          basePrice: p.basePrice, quantity: menge, elements: ANSICHTEN.slice(0, n).map((v) => logo(v)), pricingRules: regeln, mengenDeckel: false,
        }).unitPrice;
        const erwartet = alt(p.basePrice, menge, n) + (menge >= 3 ? 1 : 0);
        assert.ok(Math.abs(neu - erwartet) < 0.005, `${p.id} × ${menge} (${n} Position/en): ${neu} statt ${erwartet.toFixed(2)}`);
      }
    }
  }
});

function warenkorbPosition(productId: string, menge: number, ansichten: number): CartItem {
  return {
    id: 'i1', printMethod: 'dtf', productId, colorId: 'grey', sizeQuantities: { M: menge }, quantity: menge,
    elements: ANSICHTEN.slice(0, ansichten).map((v) => logo(v, 12, 12)), unitPrice: 0, totalPrice: 0, addedAt: 0,
  } as CartItem;
}

test('Server und Posten: im Bereich vor einer Grenze gleicht priceCart dem Rechenkern, der Deckel steht als eigener Posten, die Posten ergeben den Preis', async () => {
  const regeln = await getPricingRules('dtf');
  let mitDeckelPosten = 0;
  for (const productId of ['gildan-heavy-t', 'justhoods-college-hoodie', 'fotl-heavy-t']) {
    const basePrice = PRODUCTS.find((p) => p.id === productId)!.basePrice;
    for (const ansichten of [1, 2]) {
      for (const menge of [19, 47, 48, 49, 50, 97, 98, 99, 100, 247, 249, 499, 998, 999]) {
        const position = warenkorbPosition(productId, menge, ansichten);
        const kern = calculatePrice({ basePrice, quantity: menge, elements: position.elements, pricingRules: regeln });
        const server = await priceCartItem(position);
        assert.equal(server.totalPrice, kern.totalPrice, `${productId} × ${menge}: Server ≠ Rechenkern`);
        assert.equal(server.unitPrice, kern.unitPrice, `${productId} × ${menge}: Stückpreis Server ≠ Rechenkern`);

        const korb = await priceCart([position]);
        const summe = Math.round(korb.lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
        assert.equal(summe, Math.round(korb.totalPrice * 100) / 100, `${productId} × ${menge}: Summe der Posten ≠ Gesamtpreis`);
        const deckel = korb.lines.find((l) => l.id.endsWith(':mengenpreis'));
        if (kern.breakdown.mengenDeckelAufMenge !== null) {
          assert.ok(deckel, `${productId} × ${menge}: Deckel ohne eigenen Posten`);
          assert.equal(deckel!.label, `Mengenpreis wie bei ${kern.breakdown.mengenDeckelAufMenge} Stück`);
          assert.equal(deckel!.category, 'rabatt');
          assert.equal(deckel!.total, kern.breakdown.mengenDeckelTotal);
          assert.ok(deckel!.total < 0);
          mitDeckelPosten++;
        } else {
          assert.equal(deckel, undefined, `${productId} × ${menge}: Posten ohne Deckel`);
        }
      }
    }
  }
  assert.ok(mitDeckelPosten >= 10, `zu wenige Deckel-Fälle: ${mitDeckelPosten}`);
});

test('Stickerei: kein Mengenpreis-Deckel, Preise unverändert (der eingefrorene Vergleich steht in dtfStaffel.test.ts)', async () => {
  const stick = await getPricingRules('embroidery');
  const el = { ...logo('front', 8, 8), estimatedStitches: 8000 } as ConfigElement;
  for (const menge of [19, 49, 99, 249, 499, 999]) {
    const r = calculatePrice({ basePrice: 19.99, quantity: menge, elements: [el], pricingRules: stick });
    assert.equal(r.breakdown.mengenDeckelAufMenge, null, `${menge} Stück: Stickerei darf keinen Deckel bekommen`);
    assert.equal(r.breakdown.mengenDeckelTotal, 0);
    const aus = calculatePrice({ basePrice: 19.99, quantity: menge, elements: [el], pricingRules: stick, mengenDeckel: false });
    assert.equal(r.totalPrice, aus.totalPrice);
  }
});
