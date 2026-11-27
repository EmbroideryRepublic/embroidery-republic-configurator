/**
 * Preisaktion „Black Week“ (config/aktion.ts, 10 % auf alle Positionen bis einschließlich 15.12.2026, Code BLACK10).
 *
 * Gesichert wird:
 *   1. Zeitraum: Beginn 27.11.2026 00:00 (Berlin) einschließlich, Ende 16.12.2026 00:00 ausschließlich – an den Grenzen und knapp davor/danach.
 *   2. Rechenkern: ohne Aktion Cent für Cent das bisherige Ergebnis; mit Aktion genau der Satz auf den Gesamtpreis, Stückpreis daraus abgeleitet.
 *   3. Die Zusage „eine größere Bestellung kostet nie weniger“ bleibt mit Aktion bestehen (alle Modelle, Mengen bis 1.500).
 *   4. Preisposten: Summe aller Posten = Gesamtpreis (mit eigener Aktionszeile), Preisdetails-Zeilen = Stückpreis.
 *   5. Server, Warenkorb und Bestellung rechnen mit derselben Aktion; ohne Übergabe wird NICHT rabattiert (Tests/SEO-Beispiele datumsfest).
 *   6. Wächter im Quelltext: Die echten Aufrufstellen übergeben `aktuelleAktion()`; Versandermittlung der Rechnung bleibt richtig.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PRODUCTS, getProduct } from '@/config/products';
import { getPricingRules } from '@/config/pricingRules';
import { BLACK_WEEK_2026, aktuelleAktion, istAktionAktiv, verbleibendeTage } from '@/config/aktion';
import { calculatePrice } from '../calculatePrice';
import { calculatePipeline } from '../pipeline';
import { priceCart, priceCartItem } from '../serverPricing';
import { sumLines } from '../priceLine';
import { findeMengenTipp } from '../mengenTipp';
import { berechnePreiseNeu } from '@/lib/cart/preiseAktualisieren';
import { baueRechnungsauftrag } from '@/lib/orders/rechnungsauftrag';
import type { CartItem, ConfigElement } from '@/types';
import { berechneAenderung } from '@/lib/orders/orderEdit';
import { gespeicherterStand, HOODIE } from '@/lib/orders/__tests__/auftragFixtures';

const ANSICHTEN = ['front', 'back'] as const;
const AKTION = { prozent: 10 };

function logo(view: (typeof ANSICHTEN)[number], breite = 12, hoehe = 12): ConfigElement {
  return {
    id: `el-${view}`, type: 'logo', view, xCm: 5, yCm: 10, widthCm: breite, heightCm: hoehe, rotationDeg: 0, isOutOfBounds: false,
    extraPrice: 0, estimatedStitches: 0, name: view, locked: false, hidden: false, fileUrl: '', fileName: 'l.png',
    originalWidthPx: 1000, originalHeightPx: 1000, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 1,
  } as ConfigElement;
}

function position(menge: number, id = 'p1'): CartItem {
  return {
    id,
    printMethod: 'dtf',
    productId: 'gildan-heavy-t',
    colorId: getProduct('gildan-heavy-t')!.colors[0]!.id,
    sizeQuantities: { M: menge },
    quantity: menge,
    elements: [logo('front')],
    unitPrice: 999,
    totalPrice: 999,
    addedAt: 0,
  };
}

const T = (iso: string) => new Date(iso);

// ── 1. Zeitraum ───────────────────────────────────────────────────────────────────────────────────────────────────
test('Black Week: 10 %, Code BLACK10, Beginn 27.11.2026 00:00 Berlin einschließlich, Ende 16.12.2026 00:00 Berlin ausschließlich', () => {
  assert.equal(BLACK_WEEK_2026.prozent, 10);
  assert.equal(BLACK_WEEK_2026.code, 'BLACK10');
  assert.equal(BLACK_WEEK_2026.letzterTag, '15.12.2026');
  assert.equal(aktuelleAktion(T('2026-11-26T22:59:59Z')), null, 'eine Sekunde vor Beginn');
  assert.equal(aktuelleAktion(T('2026-11-26T23:00:00Z'))?.id, 'black-week-2026', 'Beginn (27.11. 00:00 Berlin = 26.11. 23:00 UTC)');
  assert.equal(aktuelleAktion(T('2026-12-01T12:00:00+01:00'))?.id, 'black-week-2026');
  assert.equal(aktuelleAktion(T('2026-12-15T23:59:59+01:00'))?.id, 'black-week-2026', 'letzte Sekunde des 15.12.');
  assert.equal(aktuelleAktion(T('2026-12-16T00:00:00+01:00')), null, 'ab 16.12. 00:00 Berlin vorbei');
  assert.equal(aktuelleAktion(T('2027-01-10T12:00:00Z')), null);
  assert.equal(aktuelleAktion(new Date('ungültig')), null, 'ein ungültiges Datum rabattiert nie');
  assert.equal(istAktionAktiv(BLACK_WEEK_2026, T('2026-12-15T22:59:59Z')), true);
  assert.equal(istAktionAktiv(BLACK_WEEK_2026, T('2026-12-15T23:00:00Z')), false);
});

test('verbleibendeTage zählt aufgerundet bis zum Ende und nie unter 0', () => {
  assert.equal(verbleibendeTage(BLACK_WEEK_2026, T('2026-12-15T12:00:00+01:00')), 1, 'am letzten Tag: 1');
  assert.equal(verbleibendeTage(BLACK_WEEK_2026, T('2026-12-14T00:00:00+01:00')), 2);
  assert.equal(verbleibendeTage(BLACK_WEEK_2026, T('2026-12-16T00:00:00+01:00')), 0);
  assert.equal(verbleibendeTage(BLACK_WEEK_2026, T('2027-02-01T00:00:00+01:00')), 0);
});

// ── 2. Rechenkern ─────────────────────────────────────────────────────────────────────────────────────────────────
test('ohne Aktion: Ergebnis unverändert, Aktionsfelder 0; mit Aktion 0 % oder null ebenso', async () => {
  const regeln = await getPricingRules('dtf');
  const p = getProduct('gildan-heavy-t')!;
  const basis = { basePrice: p.basePrice, quantity: 12, elements: [logo('front')], pricingRules: regeln };
  const ohne = calculatePrice(basis);
  assert.equal(ohne.breakdown.aktionProzent, 0);
  assert.equal(ohne.breakdown.aktionTotal, 0);
  assert.equal(ohne.breakdown.aktionPerUnit, 0);
  for (const aus of [null, { prozent: 0 }, undefined]) {
    const r = calculatePrice({ ...basis, aktion: aus });
    assert.equal(r.totalPrice, ohne.totalPrice);
    assert.equal(r.unitPrice, ohne.unitPrice);
  }
});

test('mit Aktion: genau 10 % auf den Gesamtpreis (auf Cent), Stückpreis = Gesamtpreis ÷ Menge, Betrag in breakdown.aktion*', async () => {
  const regeln = await getPricingRules('dtf');
  for (const p of PRODUKTE_STICHPROBE()) {
    for (const menge of [1, 2, 3, 7, 12, 19, 20, 49, 50, 99, 100, 640]) {
      const basis = { basePrice: p.basePrice, quantity: menge, elements: [logo('front'), logo('back')], pricingRules: regeln };
      const ohne = calculatePrice(basis);
      const mit = calculatePrice({ ...basis, aktion: AKTION });
      const wo = `${p.id} × ${menge}`;
      const erwartet = Math.round(ohne.totalPrice * 0.9 * 100) / 100;
      assert.ok(Math.abs(mit.totalPrice - erwartet) < 0.0051, `${wo}: ${mit.totalPrice} ≠ 90 % von ${ohne.totalPrice}`);
      assert.ok(mit.totalPrice < ohne.totalPrice, `${wo}: nicht günstiger`);
      assert.ok(Math.abs(mit.unitPrice - mit.totalPrice / menge) < 0.0051, `${wo}: Stückpreis ≠ Gesamtpreis ÷ Menge`);
      assert.equal(mit.breakdown.aktionProzent, 10, wo);
      assert.ok(Math.abs(mit.breakdown.aktionTotal - (mit.totalPrice - ohne.totalPrice)) < 0.0051, `${wo}: aktionTotal`);
      assert.ok(mit.breakdown.aktionTotal < 0 && mit.breakdown.aktionPerUnit <= 0, wo);
      // Der Mengenpreis-Deckel bleibt vor der Aktion stehen (reiner Staffel-/Deckelwert).
      assert.equal(mit.breakdown.mengenDeckelTotal, ohne.breakdown.mengenDeckelTotal, wo);
      assert.equal(mit.hasErrors, false, wo);
    }
  }
});

/** Eine breite Stichprobe: günstigstes, teuerstes und ein Mittelfeld aller Modelle. */
function PRODUKTE_STICHPROBE() {
  const sortiert = [...PRODUKTE_ALLE()].sort((a, b) => a.basePrice - b.basePrice);
  return [sortiert[0]!, sortiert[Math.floor(sortiert.length / 2)]!, sortiert[sortiert.length - 1]!, getProduct('gildan-heavy-t')!];
}
function PRODUKTE_ALLE() {
  return PRODUCTS;
}

test('einzelne Position: 100 € Position gibt genau 90 €; Hochrechnung auf Einrichtung bei 1 Stück eingeschlossen', async () => {
  const regeln = await getPricingRules('dtf');
  const p = getProduct('gildan-heavy-t')!;
  const eins = calculatePrice({ basePrice: p.basePrice, quantity: 1, elements: [logo('front')], pricingRules: regeln });
  const mitEins = calculatePrice({ basePrice: p.basePrice, quantity: 1, elements: [logo('front')], pricingRules: regeln, aktion: AKTION });
  assert.ok(eins.breakdown.setupTotal > 0, 'bei 1 Stück fällt Einrichtung an');
  // Die Einrichtung steckt im rabattierten Positionspreis: 10 % vom GANZEN Betrag, nicht nur von der Ware.
  assert.ok(Math.abs(mitEins.totalPrice - eins.totalPrice * 0.9) < 0.0051);
});

// ── 3. Monotonie ──────────────────────────────────────────────────────────────────────────────────────────────────
test('mit Aktion: Gesamtpreis sinkt mit der Menge nie, Stückpreis steigt nie (alle Modelle, Mengen 1–1.500)', async () => {
  const regeln = await getPricingRules('dtf');
  let faelle = 0;
  for (const p of PRODUCTS) {
    for (const n of [1, 2]) {
      const elemente = ANSICHTEN.slice(0, n).map((v) => logo(v));
      let gesamtVorher = 0;
      let stueckVorher = Number.POSITIVE_INFINITY;
      for (let menge = 1; menge <= 1500; menge++) {
        const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: elemente, pricingRules: regeln, aktion: AKTION });
        const wo = `${p.id} × ${menge} (${n} Position/en)`;
        assert.ok(r.totalPrice >= gesamtVorher - 0.0001, `${wo}: Gesamtpreis sinkt (${gesamtVorher} → ${r.totalPrice})`);
        assert.ok(r.unitPrice <= stueckVorher + 0.0051, `${wo}: Stückpreis steigt (${stueckVorher} → ${r.unitPrice})`);
        gesamtVorher = r.totalPrice;
        stueckVorher = r.unitPrice;
        faelle++;
      }
    }
  }
  assert.ok(faelle >= PRODUCTS.length * 2 * 1500);
});

// ── 4. Preisposten ───────────────────────────────────────────────────────────────────────────────────────────────
test('Preisposten: Summe aller Posten = Gesamtpreis, mit eigener Aktionszeile (Code im Text); ohne Aktion keine solche Zeile', async () => {
  const regeln = await getPricingRules('dtf');
  const p = getProduct('gildan-heavy-t')!;
  for (const menge of [1, 2, 7, 19, 49, 120]) {
    const eingabe = {
      itemId: 'x', productName: p.name, basePrice: p.basePrice, quantity: menge, elements: [logo('front'), logo('back')], pricingRules: regeln,
    };
    const ohne = calculatePipeline({ positions: [eingabe] });
    const mit = calculatePipeline({ positions: [{ ...eingabe, aktion: BLACK_WEEK_2026 }] });
    assert.equal(ohne.lines.filter((l) => l.id.endsWith(':aktion')).length, 0);
    const zeile = mit.lines.find((l) => l.id === 'x:aktion');
    assert.ok(zeile, `${menge}: Aktionszeile fehlt`);
    assert.equal(zeile!.category, 'rabatt');
    assert.ok(zeile!.total < 0);
    assert.match(zeile!.label, /Black Week/);
    assert.match(zeile!.label, /BLACK10/);
    const posten = mit.positions[0]!;
    assert.ok(Math.abs(sumLines(posten.lines) - posten.stageTotal) < 0.0051);
    const kern = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: eingabe.elements, pricingRules: regeln, aktion: AKTION });
    assert.ok(Math.abs(mit.subtotal - kern.totalPrice) < 0.0051, `${menge}: Warenwert ${mit.subtotal} ≠ Rechenkern ${kern.totalPrice}`);
    assert.ok(mit.subtotal < ohne.subtotal);
  }
});

test('Preisdetails: Zeilen (Ware, Veredelung, Einrichtung, Rundung, Mengenpreis, Aktion) ergeben den Stückpreis', async () => {
  const regeln = await getPricingRules('dtf');
  for (const p of PRODUKTE_STICHPROBE()) {
    for (const menge of [1, 2, 4, 9, 19, 47, 120]) {
      const elemente = [logo('front'), logo('back')];
      const r = calculatePrice({ basePrice: p.basePrice, quantity: menge, elements: elemente, pricingRules: regeln, aktion: AKTION });
      const b = r.breakdown;
      const flaeche = Object.values(b.areaPriceByView).reduce((a, x) => a + x, 0);
      const summe = b.basePrice + b.positionFeeTotal + flaeche + b.grossformatPerUnit + b.setupPerUnit + b.rundungPerUnit + b.mengenDeckelPerUnit + b.aktionPerUnit;
      assert.ok(Math.abs(summe - r.unitPrice) < 0.0101, `${p.id} × ${menge}: Zeilen ${summe.toFixed(3)} ≠ Stückpreis ${r.unitPrice}`);
    }
  }
});

// ── 5. Server, Warenkorb, Bestellung ───────────────────────────────────────────────────────────────────────────
test('Server: ohne Übergabe wird nie rabattiert; mit Übergabe gilt dieselbe Zahl wie im Rechenkern (Position und Warenkorb)', async () => {
  const item = position(10);
  const regeln = await getPricingRules('dtf');
  const p = getProduct(item.productId)!;
  const kern = (aktion: { prozent: number } | null) =>
    calculatePrice({ basePrice: p.basePrice, quantity: 10, elements: item.elements, pricingRules: regeln, aktion });

  const ohne = await priceCartItem(item);
  assert.equal(ohne.totalPrice, kern(null).totalPrice, 'ohne Übergabe: kein Rabatt');
  const mit = await priceCartItem(item, BLACK_WEEK_2026);
  assert.equal(mit.totalPrice, kern(AKTION).totalPrice);
  assert.ok(mit.totalPrice < ohne.totalPrice);

  const korbOhne = await priceCart([item], 'Deutschland');
  const korbMit = await priceCart([item], 'Deutschland', BLACK_WEEK_2026);
  assert.equal(korbOhne.subtotal, ohne.totalPrice);
  assert.equal(korbMit.subtotal, mit.totalPrice);
  // Versand wird NICHT rabattiert; er hängt nur am (rabattierten) Warenwert über der Freigrenze.
  assert.ok(korbMit.shippingCost >= 0);
  assert.ok(Math.abs(korbMit.totalPrice - (korbMit.subtotal + korbMit.shippingCost)) < 0.0051);
  assert.ok(korbMit.lines.some((l) => l.id.endsWith(':aktion')));
  assert.ok(!korbOhne.lines.some((l) => l.id.endsWith(':aktion')));
});

test('Versandkosten sind vom Rabatt unabhängig: gleicher Tarif, nur die Freigrenze wird am rabattierten Warenwert geprüft', async () => {
  const klein = position(1, 'k');
  const ohne = await priceCart([klein], 'Deutschland');
  const mit = await priceCart([klein], 'Deutschland', BLACK_WEEK_2026);
  if (ohne.shippingCost > 0 && mit.shippingCost > 0) assert.equal(ohne.shippingCost, mit.shippingCost, 'derselbe Versandtarif');
  assert.ok(mit.subtotal < ohne.subtotal);
});

test('Rechnung: Der Aktionsrabatt steckt in den Positionsgesamtpreisen, der Versand ergibt sich weiter als Endsumme minus Positionen', async () => {
  const items = [position(3, 'a'), position(8, 'b')];
  const pr = await priceCart(items, 'Deutschland', BLACK_WEEK_2026);
  const order = {
    id: 'o1', orderNumber: 'ER-TEST', orderType: 'order' as const, createdAt: '2026-12-01T10:00:00Z',
    contact: { name: 'Test', email: 't@example.com' },
    shipping: { street: 'Weg 1', zip: '50667', city: 'Köln', country: 'Deutschland' },
    paymentMethod: 'invoice' as const,
    subtotal: pr.totalPrice, shippingCost: pr.shippingCost, totalPrice: pr.totalPrice, taxRate: 0,
    items: pr.items.map((i, k) => ({
      productId: i.productId, colorId: items[k]!.colorId, productName: 'Gildan', colorName: 'Schwarz', printMethod: 'dtf' as const,
      sizeQuantities: items[k]!.sizeQuantities, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice, elements: [],
    })),
  };
  const auftrag = baueRechnungsauftrag(order as never, { rechnungsdatum: '2026-12-01', naechsteRechnungsnummer: async () => 'RE-TEST-1' });
  const positionenCent = auftrag.positionen.reduce((s, p) => s + p.einzelpreisBruttoCent, 0);
  assert.equal(positionenCent, Math.round(pr.subtotal * 100), 'Positionssumme der Rechnung = rabattierter Warenwert');
  assert.equal(auftrag.versandkostenBruttoCent, Math.round(pr.shippingCost * 100), 'Versand = Endsumme minus Positionen');
});

test('Warenkorb-Neuberechnung: übernimmt die Aktion, merkt die Ersparnis vor und zieht sie nach Ablauf zurück', async () => {
  const roh = position(10);
  const ohne = await berechnePreiseNeu([roh]);
  assert.equal(ohne.items[0]!.aktionErsparnis, undefined);

  const mit = await berechnePreiseNeu([roh], BLACK_WEEK_2026);
  const preis = mit.items[0]!;
  assert.ok(preis.aktionErsparnis && preis.aktionErsparnis > 0);
  assert.ok(preis.totalPrice < ohne.items[0]!.totalPrice);
  assert.ok(Math.abs(preis.aktionErsparnis! - (ohne.items[0]!.totalPrice - preis.totalPrice)) < 0.0101);

  // Läuft die Aktion ab, während der Korb offen ist: Preis und Ersparnis stimmen sofort wieder.
  const danach = await berechnePreiseNeu([preis], null);
  assert.equal(danach.geaendert, 1);
  assert.equal(danach.items[0]!.aktionErsparnis, undefined);
  assert.equal(danach.items[0]!.totalPrice, ohne.items[0]!.totalPrice);
  // Ein zweiter Lauf mit gleicher Aktion ändert nichts mehr.
  assert.equal((await berechnePreiseNeu(mit.items, BLACK_WEEK_2026)).geaendert, 0);
});

test('Mengen-Tipp: mit Aktion nennt er rabattierte Preise und die um den Aktionssatz kleinere Ersparnis', async () => {
  const regeln = await getPricingRules('dtf');
  const p = getProduct('gildan-heavy-t')!;
  let gefunden = 0;
  for (let menge = 40; menge <= 49; menge++) {
    const basis = { basePrice: p.basePrice, quantity: menge, elements: [logo('front')], pricingRules: regeln };
    const ohne = findeMengenTipp(basis);
    const mit = findeMengenTipp({ ...basis, aktion: AKTION });
    if (!ohne) continue;
    gefunden++;
    assert.ok(mit, `${menge}: Tipp fehlt mit Aktion`);
    assert.equal(mit!.menge, ohne.menge);
    assert.ok(Math.abs(mit!.ersparnis - ohne.ersparnis * 0.9) < 0.011, `${menge}: Ersparnis ${mit!.ersparnis} vs ${ohne.ersparnis}`);
    assert.ok(Math.abs(mit!.gesamtpreis - ohne.gesamtpreis * 0.9) < 0.0101);
  }
  assert.ok(gefunden > 0, 'der Tipp muss in 40–49 Stück vorkommen');
});

test('Bestellbearbeitung: eine Bestellung aus der Black Week wird mit dem Rabatt zum BESTELLDATUM nachgerechnet – auch nach Aktionsende', async () => {
  const aenderung = [{ art: 'verringern' as const, positionId: 'p1', neueMengen: { L: 2 } }];
  const spez = [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 3 } }];

  // Bestellt mitten in der Aktion, geändert nach Ablauf: Gegenprobe und neue Summe tragen weiter den Rabatt.
  const imAktionszeitraum = await gespeicherterStand(spez, { createdAt: '2026-12-01T10:00:00Z' }, [], BLACK_WEEK_2026);
  const ok = await berechneAenderung(imAktionszeitraum, aenderung);
  assert.equal(ok.ok, true, ok.ok ? '' : `${ok.grund}: ${ok.meldung}`);
  const ohneAktionStand = await gespeicherterStand(spez);
  assert.ok(imAktionszeitraum.bestellung.totalPrice < ohneAktionStand.bestellung.totalPrice, 'Testaufbau: die Aktionsbestellung ist günstiger');
  if (ok.ok) {
    const regulaer = await berechneAenderung(ohneAktionStand, aenderung);
    assert.ok(regulaer.ok);
    if (regulaer.ok) assert.ok(ok.plan.neu.gesamtCent < regulaer.plan.neu.gesamtCent, 'neue Summe der Aktionsbestellung bleibt rabattiert');
  }

  // Ohne Bestelldatum (alte Datensätze) wird NICHT rabattiert: Eine Aktionsbestellung ohne Datum ließe sich nicht belegen und wird abgelehnt.
  const ohneDatum = await gespeicherterStand(spez, {}, [], BLACK_WEEK_2026);
  const abgelehnt = await berechneAenderung(ohneDatum, aenderung);
  assert.equal(abgelehnt.ok, false);

  // Ein Datum außerhalb des Zeitraums behandelt die Bestellung als normale: Gegenprobe gegen die Aktionspreise schlägt fehl (nie still falsch).
  const vorAktion = await gespeicherterStand(spez, { createdAt: '2026-11-20T10:00:00Z' }, [], BLACK_WEEK_2026);
  const falsch = await berechneAenderung(vorAktion, aenderung);
  assert.equal(falsch.ok, false);
  if (!falsch.ok) assert.equal(falsch.grund, 'preis-abweichung');

  // Normale Bestellung mit Datum im Aktionszeitraum UND Aktionspreisen? Nein – eine ohne Aktion gespeicherte Bestellung aus der Aktionszeit passt nicht zusammen.
  const nichtRabattiert = await gespeicherterStand(spez, { createdAt: '2026-12-01T10:00:00Z' });
  const unstimmig = await berechneAenderung(nichtRabattiert, aenderung);
  assert.equal(unstimmig.ok, false);
});

// ── 6. Wächter im Quelltext ──────────────────────────────────────────────────────────────────────────────────────
test('Wächter: Die echten Aufrufstellen übergeben die Aktion – sonst zeigte die Anzeige einen anderen Preis, als der Server berechnet', () => {
  const lies = (p: string) => readFileSync(p, 'utf8');
  assert.match(lies('src/lib/actions/orders.ts'), /priceCart\(items, params\.shipping\?\.country, aktuelleAktion\(\)\)/, 'Bestellung');
  assert.match(lies('src/stores/cartStore.ts'), /berechnePreiseNeu\(vorher, aktuelleAktion\(\)\)/, 'Warenkorb nach dem Laden');
  const konfigurator = lies('src/components/configurator/ConfiguratorPrototype.tsx');
  assert.ok((konfigurator.match(/aktion: aktuelleAktion\(\)/g) ?? []).length >= 4, 'Konfigurator: Preis, anderer Preis, Mengen-Tipp, nächste Stufe');
  const bearbeitung = lies('src/lib/orders/orderEdit.ts');
  assert.match(bearbeitung, /aktuelleAktion\(bestelldatum\)/, 'Bestellbearbeitung rechnet mit der Aktion zum Bestelldatum');
  assert.match(bearbeitung, /land \?\? undefined,\s*aktion\s*\)/, 'ursprüngliche Berechnung (Gegenprobe) mit Aktion');
  assert.match(bearbeitung, /priceCart\(neueItems, land \?\? undefined, aktion\)/, 'neue Berechnung mit Aktion');
  // Statische Preisbeispiele der SEO-Seiten rechnen bewusst OHNE Aktion (kein Datum im gebauten Text).
  assert.doesNotMatch(lies('src/lib/seo/kategorieSeite.ts'), /aktuelleAktion/);
});

test('Konfigurator: Der Black-Week-Hinweis steht auch vor der Mengenwahl (Besucher über Social-Links sehen die Aktion sofort)', () => {
  const panel = readFileSync('src/components/configurator/SummaryPanel.tsx', 'utf8');
  assert.match(panel, /quantity === 0 && aktion && !nurAnfrage/);
  assert.match(panel, /data-testid="aktion-hinweis-leer"/);
});

test('Wächter: kein Eingabefeld und kein Gutscheinmechanismus – der Code wird nur angezeigt', () => {
  // Kommentare bleiben außen vor: Sie erklären gerade, dass es kein Eingabefeld gibt.
  const ohneKommentare = (quelle: string) => quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const box = ohneKommentare(readFileSync('src/components/aktion/WarenkorbAktion.tsx', 'utf8'));
  assert.doesNotMatch(box, /<input|<form|onChange|einlösen/i);
  const kasse = ohneKommentare(readFileSync('src/components/layout/CartDrawer.tsx', 'utf8'));
  assert.doesNotMatch(kasse, /gutschein|voucher|promo/i);
});
