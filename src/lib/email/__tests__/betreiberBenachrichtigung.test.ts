/**
 * Tests der E-Mails rund um den Eingang einer Bestellung bzw. Anfrage.
 *
 * Hintergrund (Entscheidung des Betreibers, 2026-11-08):
 *   • Der Betreiber wird bei JEDEM Eingang sofort und vollständig informiert –
 *     Kundendaten, Kontakt, Produkte, Mengen, Motive samt Position, bei
 *     Stickerei die geschätzte Stichzahl, und der angezeigte Preis.
 *   • Stickerei gibt es nur auf Anfrage (config/bestellweg.ts): Die Mail nennt
 *     den Preis dann ausdrücklich eine unverbindliche Kostenschätzung und macht
 *     klar, dass noch kein Vertrag besteht.
 *
 * Geprüft wird der tatsächlich gerenderte Text (nicht der Quelltext) – mit
 * derselben Bibliothek, die sendEmail.ts zum echten Versand nutzt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@react-email/render';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';
import { InternalOrderCancelledEmail } from '../templates/InternalOrderCancelledEmail';
import { OrderConfirmationEmail } from '../templates/OrderConfirmationEmail';
import { PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import type { OrderRecord } from '@/lib/actions/orderTypes';

const LOGO_PFAD = 'orders/abc/item-0-logo-el1-original.png';

const stickereiAnfrage: OrderRecord = {
  id: 'test-anfrage-1',
  orderNumber: 'ER-2026-ANF001',
  orderType: 'inquiry',
  createdAt: '2026-11-08T10:00:00.000Z',
  contact: { name: 'Erika Beispiel', company: 'Muster Sport e. V.', email: 'erika@example.invalid', phone: '0221 123456' },
  message: 'Wir brauchen die Trikots bis Ende Dezember.',
  totalPrice: 123.45,
  items: [
    {
      productId: 'heavy-t',
      colorId: 'weiss',
      productName: 'Heavy T',
      colorName: 'Weiß',
      printMethod: 'embroidery',
      sizeQuantities: { M: 2, L: 1, XL: 0 },
      quantity: 3,
      unitPrice: 41.15,
      totalPrice: 123.45,
      elements: [
        {
          type: 'logo',
          view: 'front',
          xCm: 2,
          yCm: 3,
          widthCm: 8,
          heightCm: 6,
          rotationDeg: 0,
          fileName: 'vereinslogo.png',
          logoStoragePath: LOGO_PFAD,
          geschaetzteStiche: 12400,
        },
        {
          type: 'text',
          view: 'back',
          xCm: 1,
          yCm: 1,
          widthCm: 20,
          heightCm: 3,
          rotationDeg: 0,
          content: 'Muster Sport',
          fontFamily: 'Arial',
          color: '#112233',
          geschaetzteStiche: 5000,
        },
      ],
    },
  ],
};

const druckBestellung: OrderRecord = {
  id: 'test-order-1',
  orderNumber: 'ER-2026-BES001',
  orderType: 'order',
  // JETZT, nicht ein fester Tag: Die Mail unterscheidet "Stornofrist läuft noch" von
  // "abgelaufen" nach der echten Uhrzeit. Mit einem festen Zeitpunkt wäre der Test nur
  // in den zwei Stunden danach grün gewesen (er schlug am selben Tag nach 12 Uhr UTC fehl).
  createdAt: new Date().toISOString(),
  contact: { name: 'Max Mustermann', email: 'max@example.invalid' },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'invoice',
  subtotal: 22.99,
  shippingCost: 6.9,
  totalPrice: 29.89,
  items: [
    {
      productId: 'heavy-t',
      colorId: 'weiss',
      productName: 'Heavy T',
      colorName: 'Weiß',
      printMethod: 'dtf',
      sizeQuantities: { M: 1 },
      quantity: 1,
      unitPrice: 22.99,
      totalPrice: 22.99,
      elements: [
        { type: 'logo', view: 'front', xCm: 2, yCm: 2, widthCm: 10, heightCm: 10, rotationDeg: 0, fileName: 'druck.png' },
      ],
    },
  ],
};

async function innen(order: OrderRecord, motivLinks?: Record<string, string>): Promise<string> {
  return render(InternalOrderNotificationEmail({ order, productionSheetSignedUrl: 'https://example.invalid/blatt.pdf', motivLinks }), {
    plainText: true,
  });
}

// ── Mail an den Betreiber: Anfrage mit Stickerei ─────────────────────────

test('Betreiber-Mail zur Stickerei-Anfrage enthält Kundendaten, Kontakt und Nachricht', async () => {
  const text = await innen(stickereiAnfrage);
  assert.match(text, /Neue Anfrage \(Stickerei\): ER-2026-ANF001/);
  assert.match(text, /Erika Beispiel/);
  assert.match(text, /Muster Sport e\. V\./);
  assert.match(text, /erika@example\.invalid/);
  assert.match(text, /0221 123456/);
  assert.match(text, /Wir brauchen die Trikots bis Ende Dezember\./);
});

test('Betreiber-Mail nennt Produkt, Farbe, Veredelung, Menge und Größen – ohne Nullmengen', async () => {
  const text = await innen(stickereiAnfrage);
  assert.match(text, /Heavy T/);
  assert.match(text, /Weiß/);
  assert.match(text, /Stickerei/);
  assert.match(text, /3 Stück/);
  assert.match(text, /2× M, 1× L/);
  assert.doesNotMatch(text, /0× XL/);
});

test('Betreiber-Mail nennt jedes Motiv mit Position, Maßen und geschätzter Stichzahl', async () => {
  const text = await innen(stickereiAnfrage);
  assert.match(text, new RegExp(`${PRINT_VIEW_LABELS.front}:.*Logo „vereinslogo\\.png“`));
  assert.match(text, /8,0 × 6,0 cm/);
  assert.match(text, /ca\. 12\.400 Stiche/);
  assert.match(text, new RegExp(`${PRINT_VIEW_LABELS.back}:.*Text „Muster Sport“`));
  assert.match(text, /20,0 × 3,0 cm/);
  // 12.400 + 5.000 je Stück
  assert.match(text, /Geschätzt ca\. 17\.400 Stiche je Stück/);
});

test('Betreiber-Mail nennt den Preis ausdrücklich als unverbindliche Kostenschätzung und macht den Anfragecharakter klar', async () => {
  const text = await innen(stickereiAnfrage);
  assert.match(text, /Geschätzter Gesamtpreis \(unverbindlich\): 123,45 €/);
  assert.match(text, /Anfrage – noch kein Vertrag/);
  assert.match(text, /verbindliches Angebot/);
  assert.match(text, /genaue Stichzahl ergibt sich erst nach der Digitalisierung/);
  // Eine Anfrage hat keine Stornofrist und keine Lieferadresse.
  assert.doesNotMatch(text, /Stornofrist|stornieren/);
  assert.doesNotMatch(text, /Gesamtsumme:/);
});

test('Betreiber-Mail verlinkt die Originaldatei, sofern ein Link vorliegt – sonst bleibt das Motiv trotzdem aufgeführt', async () => {
  const mit = await innen(stickereiAnfrage, { [LOGO_PFAD]: 'https://example.invalid/original.png' });
  assert.match(mit, /Originaldatei laden/);
  assert.match(mit, /https:\/\/example\.invalid\/original\.png/);

  const ohne = await innen(stickereiAnfrage);
  assert.doesNotMatch(ohne, /Originaldatei laden/);
  assert.match(ohne, /vereinslogo\.png/);
});

test('Betreiber-Mail verlinkt das Produktionsblatt', async () => {
  const text = await innen(stickereiAnfrage);
  assert.match(text, /Produktionsblatt \(PDF\) öffnen/);
  assert.match(text, /https:\/\/example\.invalid\/blatt\.pdf/);
});

// ── Mail an den Betreiber: Bestellung (Druck) ────────────────────────────

test('Betreiber-Mail zur Druck-Bestellung enthält Lieferadresse, Zahlungsart, Summen und die laufende Stornofrist', async () => {
  const text = await innen(druckBestellung);
  assert.match(text, /Neue Bestellung: ER-2026-BES001/);
  assert.match(text, /Bestellung – verbindlich/);
  assert.match(text, /Kauf auf Rechnung/);
  assert.match(text, /Musterstraße 1, 12345 Musterstadt/);
  assert.match(text, /Zwischensumme: 22,99 €/);
  assert.match(text, /Versand: 6,90 €/);
  assert.match(text, /Gesamtsumme: 29,89 €/);
  assert.match(text, /selbst\s+stornieren – bitte erst danach beschaffen und produzieren/);
  assert.match(text, /DTF-Transferdruck/);
  assert.doesNotMatch(text, /Stiche/, 'DTF braucht keine Stichzahl');
  assert.doesNotMatch(text, /Kostenschätzung|unverbindlich/);
});

test('Die Stornofrist wird als Uhrzeit genannt, zwei Stunden nach Eingang', async () => {
  // 10:00 UTC → 11:00/12:00 Ortszeit; die Frist liegt 2 Stunden später. Geprüft wird nur,
  // dass überhaupt ein Zeitpunkt mit Uhrzeit genannt wird.
  const text = await innen(druckBestellung);
  assert.match(text, /bis\s+\d{2}\.\d{2}\.\d{2,4},?\s+\d{2}:\d{2}\s+Uhr/);
});

// ── Storno-Mitteilung an den Betreiber ───────────────────────────────────

test('Storno-Mail sagt klar: nichts beschaffen, und nennt den Stand der Zahlung', async () => {
  const unbezahlt = await render(
    InternalOrderCancelledEmail({
      orderNumber: 'ER-2026-BES001',
      kundeName: 'Max Mustermann',
      kundeEmail: 'max@example.invalid',
      storniertAm: '8. November 2026 um 10:30',
      erstattungFaellig: false,
    }),
    { plainText: true }
  );
  assert.match(unbezahlt, /Bestellung storniert: ER-2026-BES001/);
  assert.match(unbezahlt, /Bitte nichts beschaffen und nichts produzieren/);
  assert.match(unbezahlt, /noch nichts bezahlt/);
  assert.match(unbezahlt, /Max Mustermann/);

  const bezahlt = await render(
    InternalOrderCancelledEmail({
      orderNumber: 'ER-2026-BES001',
      kundeName: null,
      kundeEmail: null,
      storniertAm: '8. November 2026 um 10:30',
      erstattungFaellig: true,
    }),
    { plainText: true }
  );
  assert.match(bezahlt, /bereits bezahlt/);
  assert.match(bezahlt, /Rückerstattung ist fällig/);
});

// ── Bestätigung an die Kundschaft ────────────────────────────────────────

test('Bestätigung einer Stickerei-Anfrage: Kostenschätzung, kein Vertrag, so geht es weiter', async () => {
  const text = await render(OrderConfirmationEmail({ order: stickereiAnfrage }), { plainText: true });
  assert.match(text, /Ihre Anfrage ER-2026-ANF001/);
  // Nur der EINGANG wird bestätigt – der Eindruck einer Auftragsannahme darf nirgends entstehen.
  assert.match(text, /ist bei uns eingegangen und wird jetzt von uns geprüft/);
  assert.match(text, /keine Auftragsbestätigung/);
  assert.match(text, /unverbindliche Schätzwerte/);
  assert.match(text, /individuelles, verbindliches Angebot/);
  assert.match(text, /kein Vertrag geschlossen/);
  assert.match(text, /Geschätzter Preis \(unverbindliche Kostenschätzung\): 123,45 €/);
  assert.match(text, /So geht es weiter/);
  assert.match(text, /Motiv digitalisiert ist/);
  assert.match(text, /Vertrag kommt erst zustande, wenn Sie dieses Angebot annehmen und wir den\s+Auftrag bestätigen/);
  // Es ist keine Bestellung: keine Zahlungs-, Storno- oder Lieferangaben.
  assert.doesNotMatch(text, /Bestellbestätigung|Zahlungsart|stornieren|Lieferadresse/);
});

test('Bestätigung einer Druck-Anfrage bleibt unverändert (Richtpreis, kein Stickerei-Ablauf)', async () => {
  const druckAnfrage: OrderRecord = { ...druckBestellung, orderType: 'inquiry', shipping: undefined, paymentMethod: undefined };
  const text = await render(OrderConfirmationEmail({ order: druckAnfrage }), { plainText: true });
  assert.match(text, /Ungefährer Richtpreis/);
  assert.doesNotMatch(text, /So geht es weiter|Kostenschätzung/);
});
