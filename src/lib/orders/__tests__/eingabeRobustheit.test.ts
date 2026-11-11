/**
 * Kaputte Eingaben dürfen nie einen TypeError auslösen (Fund vom 2026-11-11).
 *
 * Server Actions bekommen beliebiges JSON – ein manipulierter oder defekter Client kann `null`, Zahlen statt Text oder
 * ein Objekt statt eines Arrays schicken. Zehn von 36 geprüften Fällen warfen in validateSubmission einen TypeError;
 * persistAndNotify fing ihn zwar ab (allgemeine Meldung), aber submitOrder, submitInquiry und das Kontaktformular
 * stürzten schon davor ab. Jetzt liefert jeder dieser Fälle eine gewohnte Meldung – mit den bisherigen Texten, es gibt
 * keine neue Kundenmeldung – und gültige Eingaben verhalten sich unverändert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from '../orderValidation';
import { submitOrder, submitInquiry } from '@/lib/actions/orders';
import { submitContactMessage } from '@/lib/actions/contact';

function gueltig(): any {
  return {
    orderType: 'order',
    customerName: 'Max Muster',
    email: 'max@example.com',
    shipping: { street: 'Musterstr. 1', zip: '50667', city: 'Köln', country: 'DE' },
    acceptedTerms: true,
    items: [
      {
        id: 'a', printMethod: 'dtf', productId: 'gildan-heavy-t', colorId: 'black', sizeQuantities: { M: 10 }, quantity: 10,
        elements: [
          { id: 'e', type: 'text', view: 'front', xCm: 1, yCm: 1, widthCm: 10, heightCm: 5, rotationDeg: 0, isOutOfBounds: false, extraPrice: 0, estimatedStitches: 0, name: 'x', locked: false, hidden: false, content: 'Hi', fontFamily: 'Arial', fontSizePx: 40, color: '#000', bold: false, italic: false, align: 'center', letterSpacing: 0, lineHeight: 1.2, hasShadow: false, hasOutline: false, outlineColor: '#000', inkCoverageRatio: 0.5, isPlaceholder: false },
        ],
        unitPrice: 1, totalPrice: 10, addedAt: 0,
      },
    ],
  };
}

test('Ausgangsfall ist gültig und bleibt es (keine Verhaltensänderung für echte Bestellungen)', async () => {
  const r = await validateSubmission(gueltig());
  assert.equal(r.valid, true, r.issues.map((i) => i.code).join(','));
  const anfrage = gueltig();
  anfrage.orderType = 'inquiry';
  delete anfrage.shipping;
  anfrage.items = [];
  assert.equal((await validateSubmission(anfrage)).valid, true, 'eine leere Anfrage bleibt erlaubt');
});

const KAPUTT: Array<[string, (x: any) => any, string]> = [
  ['items=null', (x) => ((x.items = null), x), 'produkt_unbekannt'],
  ['items fehlt', (x) => (delete x.items, x), 'produkt_unbekannt'],
  ['items=Zeichenkette', (x) => ((x.items = 'abc'), x), 'produkt_unbekannt'],
  ['items=[null]', (x) => ((x.items = [null]), x), 'produkt_unbekannt'],
  ['customerName fehlt', (x) => (delete x.customerName, x), 'name_fehlt'],
  ['customerName=Zahl', (x) => ((x.customerName = 5), x), 'name_fehlt'],
  ['email fehlt', (x) => (delete x.email, x), 'email_ungueltig'],
  ['email=Objekt', (x) => ((x.email = { a: 1 }), x), 'email_ungueltig'],
  ['shipping.street=Zahl', (x) => ((x.shipping.street = 12345), x), 'adresse_unvollstaendig'],
  ['shipping.zip=Objekt', (x) => ((x.shipping.zip = {}), x), 'adresse_unvollstaendig'],
  ['shipping=Zeichenkette', (x) => ((x.shipping = 'Köln'), x), 'adresse_unvollstaendig'],
  ['elements=[null]', (x) => ((x.items[0].elements = [null]), x), 'elementmasse_ungueltig'],
  ['elements=Zeichenkette', (x) => ((x.items[0].elements = 'abc'), x), 'elementmasse_ungueltig'],
  ['text.content=Zahl', (x) => ((x.items[0].elements[0].content = 12), x), 'elementmasse_ungueltig'],
  ['Eingang=null', () => null, 'name_fehlt'],
  ['Eingang=Zahl', () => 42, 'name_fehlt'],
];

for (const [name, mach, erwarteterCode] of KAPUTT) {
  test(`validateSubmission wirft bei "${name}" nicht, sondern meldet ${erwarteterCode}`, async () => {
    const r = await validateSubmission(mach(gueltig()));
    assert.equal(r.valid, false);
    assert.ok(r.issues.some((i) => i.code === erwarteterCode), `erwartet ${erwarteterCode}, gefunden: ${r.issues.map((i) => i.code).join(',')}`);
    assert.ok(r.customerMessage && r.customerMessage.length > 0, 'es gibt einen Anzeigetext');
  });
}

const ALLGEMEIN = 'Da ist etwas schiefgelaufen. Bitte versuchen Sie es in ein paar Minuten erneut.';

test('submitOrder und submitInquiry ohne Kontaktblock: allgemeine Meldung statt TypeError', async () => {
  for (const eingang of [null, undefined, 42, {}, { contact: null }, { contact: 'x' }]) {
    const a = await submitOrder(eingang as never);
    assert.deepEqual(a, { success: false, error: ALLGEMEIN }, `submitOrder ${JSON.stringify(eingang)}`);
    const b = await submitInquiry(eingang as never);
    assert.deepEqual(b, { success: false, error: ALLGEMEIN }, `submitInquiry ${JSON.stringify(eingang)}`);
  }
});

test('Kontaktformular: kaputte Felder ergeben die gewohnte Meldung statt eines TypeError', async () => {
  const NAME = 'Bitte geben Sie Ihren Namen an (2–100 Zeichen).';
  for (const eingang of [null, undefined, 42, {}, { name: 5, email: 'a@b.de', message: 'x'.repeat(20) }]) {
    const r = await submitContactMessage(eingang as never);
    assert.deepEqual(r, { success: false, error: NAME }, JSON.stringify(eingang));
  }
  const mail = await submitContactMessage({ name: 'Max Muster', email: { a: 1 } as never, message: 'Eine ganz normale Nachricht.' });
  assert.deepEqual(mail, { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
  const nachricht = await submitContactMessage({ name: 'Max Muster', email: 'max@example.com', message: 12345 as never });
  assert.deepEqual(nachricht, { success: false, error: 'Bitte formulieren Sie Ihre Nachricht (10–5000 Zeichen).' });
});

test('Honeypot mit Nicht-Text-Wert löst keinen Absturz aus und gilt nicht als befüllt', async () => {
  const r = await submitContactMessage({ name: 'Max Muster', email: 'max@example.com', message: 'kurz', website: 5 as never });
  assert.equal(r.success, false);
});
