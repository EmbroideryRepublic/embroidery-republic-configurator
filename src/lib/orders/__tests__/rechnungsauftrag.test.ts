/**
 * Tests von baueRechnungsauftrag (rechnungsauftrag.ts) – der Aufbau, der bis
 * 2026-11-26 mitten in erzeugeRechnung() stand und jetzt auch die Ersatzrechnung
 * trägt. Die Tests halten fest, dass die Regeln dabei UNVERÄNDERT geblieben
 * sind: Kleinunternehmer-Steuerweg, Positionspreis als Einzelpreis mit
 * menge=1, Versandrest als echter Rest, harte Ablehnung eines unplausiblen
 * Rests, Zahlungsziel nach Zahlungsart.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { IST_KLEINUNTERNEHMER, PAYMENT_TERM_DAYS } from '@/config/company';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { baueRechnungsauftrag, VERSANDREST_OBERGRENZE_CENT } from '../rechnungsauftrag';

function bestellung(ueberschreibungen: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    orderNumber: 'ER-2026-ABC123',
    orderType: 'order',
    createdAt: '2026-11-20T10:00:00.000Z',
    contact: { name: 'Max Mustermann', company: 'Mustermann GmbH', email: 'max@example.invalid' },
    shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
    paymentMethod: 'invoice',
    subtotal: 47.99,
    shippingCost: 6.9,
    totalPrice: 54.89,
    taxRate: 19,
    taxAmount: 8.76,
    netTotal: 46.13,
    customerVatId: 'DE123456789',
    items: [
      {
        productId: 'bandc-inspire-hoodie',
        colorId: 'black',
        productName: 'Inspire Hooded Sweat',
        colorName: 'Black Pure',
        printMethod: 'dtf',
        sizeQuantities: { L: 1 },
        quantity: 1,
        unitPrice: 47.99,
        totalPrice: 47.99,
        elements: [],
      },
    ],
    ...ueberschreibungen,
  };
}

const OPTIONEN = { rechnungsdatum: '2026-11-26', naechsteRechnungsnummer: async () => 'RE-2026-000042' };

test('Positionen als Gesamtpreis mit menge 1, Stückzahl in der Bezeichnung, Versand als echter Rest', async () => {
  const a = baueRechnungsauftrag(bestellung(), OPTIONEN);
  assert.equal(a.bestellId, 'order-1');
  assert.equal(a.bestellnummer, 'ER-2026-ABC123');
  assert.equal(a.rechnungsdatum, '2026-11-26');
  assert.deepEqual(a.positionen, [
    {
      bezeichnung: 'Inspire Hooded Sweat · Black Pure (1×)',
      menge: 1,
      einzelpreisBruttoCent: 4799,
      steuersatzProzent: IST_KLEINUNTERNEHMER ? 0 : 19,
    },
  ]);
  assert.equal(a.versandkostenBruttoCent, 690);
  assert.equal(a.gesamtBruttoCent, 5489);
  assert.equal(a.positionen.reduce((s, p) => s + p.einzelpreisBruttoCent, 0) + a.versandkostenBruttoCent, a.gesamtBruttoCent);
  assert.equal(a.waehrung, 'EUR');
  assert.equal(await a.naechsteRechnungsnummer(), 'RE-2026-000042');
});

test('Käufer aus Kontakt und Lieferadresse, USt-IdNr. übernommen', () => {
  const a = baueRechnungsauftrag(bestellung(), OPTIONEN);
  assert.deepEqual(a.kaeufer, {
    name: 'Max Mustermann',
    firma: 'Mustermann GmbH',
    strasse: 'Musterstraße 1',
    plz: '12345',
    ort: 'Musterstadt',
    land: 'Deutschland',
    ustIdNr: 'DE123456789',
  });
});

test('Steuerweg: Kleinunternehmer-Schalter bestimmt den Satz, unabhängig vom gespeicherten Satz', () => {
  const erwartet = (taxRate: number | undefined) => (IST_KLEINUNTERNEHMER ? 0 : (taxRate ?? 19));
  assert.equal(baueRechnungsauftrag(bestellung({ taxRate: 19 }), OPTIONEN).positionen[0]!.steuersatzProzent, erwartet(19));
  assert.equal(baueRechnungsauftrag(bestellung({ taxRate: 0 }), OPTIONEN).positionen[0]!.steuersatzProzent, erwartet(0));
  assert.equal(baueRechnungsauftrag(bestellung({ taxRate: undefined }), OPTIONEN).positionen[0]!.steuersatzProzent, erwartet(undefined));
});

test('Zahlungsziel: Rechnungskauf bzw. unbekannte Zahlungsart = Frist, Karte/PayPal = bereits bezahlt', () => {
  assert.equal(baueRechnungsauftrag(bestellung({ paymentMethod: 'invoice' }), OPTIONEN).zahlungszielTage, PAYMENT_TERM_DAYS);
  assert.equal(baueRechnungsauftrag(bestellung({ paymentMethod: undefined }), OPTIONEN).zahlungszielTage, PAYMENT_TERM_DAYS);
  assert.equal(baueRechnungsauftrag(bestellung({ paymentMethod: 'card' }), OPTIONEN).zahlungszielTage, 0);
  assert.equal(baueRechnungsauftrag(bestellung({ paymentMethod: 'paypal' }), OPTIONEN).zahlungszielTage, 0);
});

test('ohne Lieferadresse entsteht kein Auftrag', () => {
  assert.throws(() => baueRechnungsauftrag(bestellung({ shipping: undefined }), OPTIONEN), /ohne Lieferadresse/);
});

test('ein unplausibler Versandrest bricht hart ab, statt geklemmt zu werden', () => {
  // Endsumme 30 € über den Positionen: weit über der Obergrenze.
  assert.throws(
    () => baueRechnungsauftrag(bestellung({ totalPrice: 47.99 + 30 }), OPTIONEN),
    /Versandrest 3000ct ist unplausibel/
  );
  // Negativer Rest (Positionen teurer als die Endsumme).
  assert.throws(() => baueRechnungsauftrag(bestellung({ totalPrice: 40 }), OPTIONEN), /unplausibel/);
  // Genau die Obergrenze und ein Cent Rundungstoleranz bleiben zulässig.
  assert.doesNotThrow(() => baueRechnungsauftrag(bestellung({ totalPrice: 47.99 + VERSANDREST_OBERGRENZE_CENT / 100, shippingCost: 20 }), OPTIONEN));
  assert.doesNotThrow(() => baueRechnungsauftrag(bestellung({ totalPrice: 47.98 }), OPTIONEN));
});

test('ein stark abweichender abgeleiteter Versandanteil wird gemeldet, aber nicht abgelehnt', () => {
  const meldungen: string[] = [];
  const a = baueRechnungsauftrag(bestellung({ shippingCost: 0 }), { ...OPTIONEN, warnung: (t) => meldungen.push(t) });
  assert.equal(a.versandkostenBruttoCent, 690);
  assert.equal(meldungen.length, 1);
  assert.match(meldungen[0]!, /weicht deutlich/);
});

test('eine Ersatzrechnung trägt die ersetzte Rechnung; eine erste Rechnung nicht', () => {
  const ersetzt = { rechnungsnummer: 'RE-2026-000007', rechnungsdatum: '2026-11-20' };
  assert.deepEqual(baueRechnungsauftrag(bestellung(), { ...OPTIONEN, ersetzt }).ersetzt, ersetzt);
  assert.equal('ersetzt' in baueRechnungsauftrag(bestellung(), OPTIONEN), false);
});

test('erzeugeRechnung nutzt denselben Aufbau – es gibt keine zweite Kopie der Regeln', () => {
  const completion = readFileSync(path.join(process.cwd(), 'src', 'lib', 'orders', 'orderCompletion.ts'), 'utf8');
  assert.match(completion, /baueRechnungsauftrag\(order, \{/);
  assert.doesNotMatch(completion, /IST_KLEINUNTERNEHMER/, 'der Steuerweg darf nur an EINER Stelle stehen');
  assert.doesNotMatch(completion, /VERSANDREST_OBERGRENZE_CENT/);
  assert.doesNotMatch(completion, /einzelpreisBruttoCent/);
});
