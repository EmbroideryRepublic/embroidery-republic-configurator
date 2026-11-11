/**
 * Rauchtest ALLER E-Mail-Vorlagen: jede Vorlage wird mit realistischen Testdaten
 * gerendert (mit derselben Bibliothek wie der echte Versand) und auf verräterische
 * Muster geprüft – Platzhalter, "undefined", "NaN", "[object Object]", leere Links,
 * falsche Anrede. Ersetzt das frühere Wegwerfskript scripts/pruef/emailVorlagenAudit.mts,
 * das nicht mehr lief (Vorlage PaymentSucceededEmail gibt es nicht mehr, drei neue
 * kamen hinzu) und nirgends in der Testsuite hing.
 *
 * Eine neue Vorlage MUSS hier ergänzt werden: der letzte Test bricht, wenn im Ordner
 * templates/ eine Vorlagendatei existiert, die dieser Test nicht rendert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { OrderConfirmationEmail } from '../templates/OrderConfirmationEmail';
import { InternalOrderNotificationEmail } from '../templates/InternalOrderNotificationEmail';
import { InternalOrderCancelledEmail } from '../templates/InternalOrderCancelledEmail';
import { OrderCancellationEmail } from '../templates/OrderCancellationEmail';
import { OrderShippedEmail } from '../templates/OrderShippedEmail';
import { OrderInProductionEmail } from '../templates/OrderInProductionEmail';
import { OrderCompletedEmail } from '../templates/OrderCompletedEmail';
import { OrderProofRequestEmail } from '../templates/OrderProofRequestEmail';
import { ProofFeedbackEmail } from '../templates/ProofFeedbackEmail';
import { PaymentFailedEmail } from '../templates/PaymentFailedEmail';
import { InvoiceEmail } from '../templates/InvoiceEmail';
import { KontoBestaetigenEmail } from '../templates/KontoBestaetigenEmail';
import { KontoWillkommenEmail } from '../templates/KontoWillkommenEmail';
import { PasswortVergessenEmail } from '../templates/PasswortVergessenEmail';
import { PasswortGeaendertEmail } from '../templates/PasswortGeaendertEmail';
import { NewsletterOptInEmail } from '../templates/NewsletterOptInEmail';
import { ContactMessageEmail } from '../templates/ContactMessageEmail';
import { ContactAutoReplyEmail } from '../templates/ContactAutoReplyEmail';

const order: OrderRecord = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  orderNumber: 'ER-2026-A1B2C3',
  orderType: 'order',
  createdAt: '2026-11-11T10:00:00.000Z',
  contact: { name: 'Max Mustermann', company: 'Mustermann GmbH', email: 'max@example.invalid', phone: '0170 1234567' },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'invoice',
  message: 'Bitte schnell liefern, danke!',
  subtotal: 100,
  shippingCost: 0,
  totalPrice: 119,
  taxAmount: 19,
  taxRate: 19,
  netTotal: 100,
  items: [
    {
      productId: 'fotl-heavy-t',
      colorId: 'navy',
      productName: 'Heavy T',
      colorName: 'Navy',
      printMethod: 'dtf',
      sizeQuantities: { M: 2, L: 3 },
      quantity: 5,
      unitPrice: 20,
      totalPrice: 100,
      elements: [{ type: 'logo', view: 'front', xCm: 5, yCm: 5, widthCm: 8, heightCm: 8, rotationDeg: 0, fileName: 'logo.png' }],
    },
  ],
};

const URL_BESTELLUNG = 'https://www.ergermany.de/bestellung/abc123token';

/** Dateiname der Vorlage (ohne .tsx) → so viele Fälle (Name, Element) werden gerendert. */
const FAELLE: Record<string, Array<[string, ReactElement]>> = {
  OrderConfirmationEmail: [
    ['Bestellung mit Link', OrderConfirmationEmail({ order, bestellansichtUrl: URL_BESTELLUNG })],
    ['Bestellung ohne Link', OrderConfirmationEmail({ order })],
    ['Anfrage', OrderConfirmationEmail({ order: { ...order, orderType: 'inquiry' } })],
  ],
  InternalOrderNotificationEmail: [
    ['mit Produktionsblatt', InternalOrderNotificationEmail({ order, productionSheetSignedUrl: 'https://example.invalid/signed/pdf' })],
    ['ohne Produktionsblatt', InternalOrderNotificationEmail({ order, productionSheetSignedUrl: null })],
  ],
  InternalOrderCancelledEmail: [
    ['storniert', InternalOrderCancelledEmail({ orderNumber: order.orderNumber, kundeName: 'Max Mustermann', kundeEmail: 'max@example.invalid', storniertAm: '11.11.2026, 14:32 Uhr', erstattungFaellig: true })],
    ['ohne Kundendaten', InternalOrderCancelledEmail({ orderNumber: order.orderNumber, kundeName: null, kundeEmail: null, storniertAm: '11.11.2026, 14:32 Uhr', erstattungFaellig: false })],
  ],
  OrderCancellationEmail: [['storniert, Erstattung', OrderCancellationEmail({ orderNumber: order.orderNumber, storniertAm: '11.11.2026, 14:32 Uhr', erstattungFaellig: true })]],
  OrderShippedEmail: [
    ['mit Sendungsnummer', OrderShippedEmail({ orderNumber: order.orderNumber, trackingNummer: '1234567890', carrier: 'DHL', bestellansichtUrl: URL_BESTELLUNG })],
    ['ohne Sendungsnummer', OrderShippedEmail({ orderNumber: order.orderNumber, trackingNummer: null, carrier: null, bestellansichtUrl: null })],
  ],
  OrderInProductionEmail: [['in Produktion', OrderInProductionEmail({ orderNumber: order.orderNumber, items: order.items, bestellansichtUrl: URL_BESTELLUNG })]],
  OrderCompletedEmail: [['abgeschlossen', OrderCompletedEmail({ orderNumber: order.orderNumber })]],
  OrderProofRequestEmail: [['Freigabe-Anfrage', OrderProofRequestEmail({ orderNumber: order.orderNumber, bestellansichtUrl: URL_BESTELLUNG })]],
  ProofFeedbackEmail: [
    ['freigegeben', ProofFeedbackEmail({ orderNumber: order.orderNumber, adminUrl: 'https://www.ergermany.de/admin/bestellung/abc', art: 'freigegeben' })],
    ['Änderung gewünscht', ProofFeedbackEmail({ orderNumber: order.orderNumber, adminUrl: 'https://www.ergermany.de/admin/bestellung/abc', art: 'aenderung_gewuenscht', kommentar: 'Bitte das Logo etwas größer.' })],
  ],
  PaymentFailedEmail: [
    ['mit Link', PaymentFailedEmail({ orderNumber: order.orderNumber, bestellansichtUrl: URL_BESTELLUNG })],
    ['ohne Link', PaymentFailedEmail({ orderNumber: order.orderNumber })],
  ],
  InvoiceEmail: [
    ['mit USt-IdNr.', InvoiceEmail({ order, orderNumber: order.orderNumber, invoiceNumber: 'RE-2026-000123', invoiceDate: '11.11.2026', vatId: 'DE123456789' } as Parameters<typeof InvoiceEmail>[0])],
    ['ohne USt-IdNr.', InvoiceEmail({ order, orderNumber: order.orderNumber, invoiceNumber: 'RE-2026-000123', invoiceDate: '11.11.2026', vatId: null } as Parameters<typeof InvoiceEmail>[0])],
  ],
  KontoBestaetigenEmail: [['Bestätigung', KontoBestaetigenEmail({ bestaetigungsUrl: 'https://www.ergermany.de/auth/callback?typ=registrierung&token=xyz' })]],
  KontoWillkommenEmail: [['Willkommen', KontoWillkommenEmail({})]],
  PasswortVergessenEmail: [['Zurücksetzen', PasswortVergessenEmail({ zuruecksetzenUrl: 'https://www.ergermany.de/auth/callback?typ=zuruecksetzen&token=xyz' })]],
  PasswortGeaendertEmail: [['geändert', PasswortGeaendertEmail({})]],
  NewsletterOptInEmail: [['Bestätigung', NewsletterOptInEmail({})]],
  ContactMessageEmail: [
    ['mit Betreff', ContactMessageEmail({ name: 'Erika Musterfrau', email: 'erika@example.invalid', subject: 'Frage zu Lieferzeiten', message: 'Hallo,\nwie lange dauert die Lieferung?\nGrüße' })],
    ['ohne Betreff', ContactMessageEmail({ name: 'Erika Musterfrau', email: 'erika@example.invalid', message: 'Test' })],
  ],
  ContactAutoReplyEmail: [['Eingangsbestätigung', ContactAutoReplyEmail({ name: 'Erika Musterfrau', message: 'Hallo,\nwie lange dauert die Lieferung?' })]],
};

const VERDAECHTIG: Array<[string, RegExp]> = [
  ['Platzhalter {{…}}', /\{\{.*?\}\}/],
  ['"undefined" im Text', /undefined/],
  ['"NaN"', /\bNaN\b/],
  ['"[object Object]"', /\[object Object\]/],
  ['leerer Link', /href=""/],
  ['Du-Anrede statt Sie', /\b(Du|Dein|Deine|Deinem|Deinen|Dir)\b/],
  ['Adresse mit "undefined"', /undefinedhttps?|https?:\/\/undefined/],
];

for (const [vorlage, faelle] of Object.entries(FAELLE)) {
  for (const [name, element] of faelle) {
    test(`E-Mail ${vorlage} (${name}): rendert ohne Auffälligkeiten`, async () => {
      const html = await render(element);
      assert.ok(html.length > 200, `${vorlage}: Ausgabe verdächtig kurz (${html.length} Zeichen)`);
      for (const [label, muster] of VERDAECHTIG) {
        assert.ok(!muster.test(html), `${vorlage} (${name}): ${label} gefunden`);
      }
    });
  }
}

test('jede Vorlagendatei in templates/ wird von diesem Test gerendert', () => {
  const dateien = readdirSync(join(process.cwd(), 'src/lib/email/templates'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
    // EmailLayout ist der gemeinsame Rahmen, keine eigene Mail.
    .filter((n) => n !== 'EmailLayout');
  const fehlen = dateien.filter((n) => !(n in FAELLE));
  assert.deepEqual(fehlen, [], `Vorlagen ohne Rauchtest: ${fehlen.join(', ')} – bitte in FAELLE ergänzen`);
});
