/**
 * Ad-hoc Render-Audit ALLER E-Mail-Vorlagen mit realistischen Testdaten.
 * Reine Lese-/Prüf-Aufgabe (Inhalts-Audit E-Mail-Vorlagen) - schreibt nichts
 * an Produktivcode. Rendert jede Vorlage per renderToStaticMarkup und prüft
 * automatisiert auf verräterische Muster: {{...}}, undefined, NaN,
 * [object Object], leere href, falsche Anrede (Du statt Sie).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import type { OrderRecord } from '../../src/lib/actions/orderTypes';

import { OrderConfirmationEmail } from '../../src/lib/email/templates/OrderConfirmationEmail';
import { InternalOrderNotificationEmail } from '../../src/lib/email/templates/InternalOrderNotificationEmail';
import { OrderCancellationEmail } from '../../src/lib/email/templates/OrderCancellationEmail';
import { OrderShippedEmail } from '../../src/lib/email/templates/OrderShippedEmail';
import { OrderInProductionEmail } from '../../src/lib/email/templates/OrderInProductionEmail';
import { OrderCompletedEmail } from '../../src/lib/email/templates/OrderCompletedEmail';
import { PaymentSucceededEmail } from '../../src/lib/email/templates/PaymentSucceededEmail';
import { PaymentFailedEmail } from '../../src/lib/email/templates/PaymentFailedEmail';
import { InvoiceEmail } from '../../src/lib/email/templates/InvoiceEmail';
import { KontoBestaetigenEmail } from '../../src/lib/email/templates/KontoBestaetigenEmail';
import { KontoWillkommenEmail } from '../../src/lib/email/templates/KontoWillkommenEmail';
import { PasswortVergessenEmail } from '../../src/lib/email/templates/PasswortVergessenEmail';
import { PasswortGeaendertEmail } from '../../src/lib/email/templates/PasswortGeaendertEmail';
import { NewsletterOptInEmail } from '../../src/lib/email/templates/NewsletterOptInEmail';
import { ContactMessageEmail } from '../../src/lib/email/templates/ContactMessageEmail';
import { ContactAutoReplyEmail } from '../../src/lib/email/templates/ContactAutoReplyEmail';

async function main() {
  const order: OrderRecord = {
    id: 'a1b2c3d4-0000-0000-0000-000000000000',
    orderNumber: 'ER-2026-A1B2C3',
    orderType: 'order',
    createdAt: new Date().toISOString(),
    contact: { name: 'Max Mustermann', company: 'Mustermann GmbH', email: 'max@example.com', phone: '0170 1234567' },
    shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
    paymentMethod: 'invoice',
    message: 'Bitte schnell liefern, danke!',
    subtotal: 100.0,
    shippingCost: 0,
    totalPrice: 119.0,
    taxAmount: 19.0,
    taxRate: 19,
    netTotal: 100.0,
    items: [
      {
        productId: 'polo-shirt',
        colorId: 'navy',
        productName: 'Polo-Shirt',
        colorName: 'Navy',
        printMethod: 'embroidery' as any,
        sizeQuantities: { M: 2, L: 3 },
        quantity: 5,
        unitPrice: 20,
        totalPrice: 100,
        elements: [
          { type: 'logo', view: 'front' as any, xCm: 5, yCm: 5, widthCm: 8, heightCm: 8, rotationDeg: 0, fileName: 'logo.png' },
        ],
      },
    ],
  };

  const cases: Array<[string, string]> = [];
  const push = (name: string, el: any) => {
    const html = renderToStaticMarkup(el);
    cases.push([name, html]);
  };

  push('OrderConfirmationEmail (order, mit Link)', OrderConfirmationEmail({ order, bestellansichtUrl: 'https://ergermany.de/bestellung/abc123token' }));
  push('OrderConfirmationEmail (order, ohne Link)', OrderConfirmationEmail({ order, bestellansichtUrl: undefined }));
  push('OrderConfirmationEmail (inquiry)', OrderConfirmationEmail({ order: { ...order, orderType: 'inquiry' }, bestellansichtUrl: undefined }));
  push('InternalOrderNotificationEmail (mit PDF-Link)', InternalOrderNotificationEmail({ order, productionSheetSignedUrl: 'https://supabase.example/signed/pdf' }));
  push('InternalOrderNotificationEmail (ohne PDF-Link)', InternalOrderNotificationEmail({ order, productionSheetSignedUrl: null }));
  push('OrderCancellationEmail', OrderCancellationEmail({ orderNumber: 'ER-2026-A1B2C3', storniertAm: '07.08.2026, 14:32 Uhr' }));
  push('OrderShippedEmail (mit Tracking+Link)', OrderShippedEmail({ orderNumber: 'ER-2026-A1B2C3', trackingNummer: '1234567890', bestellansichtUrl: 'https://ergermany.de/bestellung/abc123token' }));
  push('OrderShippedEmail (ohne Tracking, ohne Link)', OrderShippedEmail({ orderNumber: 'ER-2026-A1B2C3', trackingNummer: null, bestellansichtUrl: null }));
  push('OrderInProductionEmail', OrderInProductionEmail({ orderNumber: 'ER-2026-A1B2C3' }));
  push('OrderCompletedEmail', OrderCompletedEmail({ orderNumber: 'ER-2026-A1B2C3' }));
  push('PaymentSucceededEmail', PaymentSucceededEmail({ orderNumber: 'ER-2026-A1B2C3', betrag: 119.0 }));
  push('PaymentFailedEmail (mit Link)', PaymentFailedEmail({ orderNumber: 'ER-2026-A1B2C3', bestellansichtUrl: 'https://ergermany.de/bestellung/abc123token' }));
  push('PaymentFailedEmail (ohne Link - Fallback)', PaymentFailedEmail({ orderNumber: 'ER-2026-A1B2C3', bestellansichtUrl: undefined }));
  push('InvoiceEmail (mit vatId)', InvoiceEmail({ order, invoiceNumber: 'RE-2026-000123', invoiceDate: '07.08.2026', vatId: 'DE123456789' }));
  push('InvoiceEmail (ohne vatId)', InvoiceEmail({ order, invoiceNumber: 'RE-2026-000123', invoiceDate: '07.08.2026', vatId: null }));
  push('KontoBestaetigenEmail', KontoBestaetigenEmail({ bestaetigungsUrl: 'https://ergermany.de/auth/callback?typ=registrierung&token=xyz' }));
  push('KontoWillkommenEmail', KontoWillkommenEmail({}));
  push('PasswortVergessenEmail', PasswortVergessenEmail({ zuruecksetzenUrl: 'https://ergermany.de/auth/callback?typ=zuruecksetzen&token=xyz' }));
  push('PasswortGeaendertEmail', PasswortGeaendertEmail({}));
  push('NewsletterOptInEmail', NewsletterOptInEmail({}));
  push('ContactMessageEmail (mit Betreff)', ContactMessageEmail({ name: 'Erika Musterfrau', email: 'erika@example.com', subject: 'Frage zu Lieferzeiten', message: 'Hallo,\nwie lange dauert die Lieferung?\nGrüße' }));
  push('ContactMessageEmail (ohne Betreff)', ContactMessageEmail({ name: 'Erika Musterfrau', email: 'erika@example.com', message: 'Test' }));
  push('ContactAutoReplyEmail', ContactAutoReplyEmail({ name: 'Erika Musterfrau', message: 'Hallo,\nwie lange dauert die Lieferung?' }));

  const suspiciousPatterns: [string, RegExp][] = [
    ['{{...}} Platzhalter', /\{\{.*?\}\}/],
    ['undefined im Text', /undefined/],
    ['NaN', /NaN/],
    ['[object Object]', /\[object Object\]/],
    ['leeres href', /href=""/],
    ['"Du/Dein/Dir" (falsche Anrede)', /\b(Du|Dein|Deine|Deinem|Deinen|Dir)\b/],
    ['undefined URL Fragment', /undefinedhttps?|https?:\/\/undefined/],
  ];

  console.log('='.repeat(100));
  for (const [name, html] of cases) {
    const hits: string[] = [];
    for (const [label, re] of suspiciousPatterns) {
      if (re.test(html)) hits.push(label);
    }
    console.log(`\n### ${name}`);
    console.log(hits.length > 0 ? `  !!! VERDACHT: ${hits.join(', ')}` : '  ok (keine automatisierten Auffälligkeiten)');
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    if (hrefs.length) console.log('  Links: ' + hrefs.join(' | '));
  }
  console.log('\n' + '='.repeat(100));

  const dumpNames = ['OrderConfirmationEmail (order, mit Link)', 'OrderShippedEmail (mit Tracking+Link)', 'InvoiceEmail (mit vatId)', 'InternalOrderNotificationEmail (mit PDF-Link)'];
  for (const dn of dumpNames) {
    const found = cases.find(([n]) => n === dn);
    if (found) {
      console.log(`\n----- VOLLTEXT: ${dn} -----`);
      console.log(found[1]);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
