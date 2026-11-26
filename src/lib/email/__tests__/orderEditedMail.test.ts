/**
 * Inhalt der Mail „Dein Auftrag wurde geändert“ (OrderEditedEmail.tsx).
 *
 * Geprüft wird der gerenderte Klartext – derselbe Weg, den auch die Vorschau im
 * Adminbereich nimmt. Nichts wird versendet. Schwerpunkt: Die Mail sagt zu
 * Rechnung und Zahlung NUR, was der Code tatsächlich tut, und trifft keine
 * rechtlichen Aussagen („ungültig“, „storniert“, „Gutschrift“).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@react-email/render';
import { OrderEditedEmail } from '../templates/OrderEditedEmail';
import { InvoiceEmail } from '../templates/InvoiceEmail';
import type { KundenmailDaten } from '@/lib/orders/orderEdit';

const BASIS: KundenmailDaten = {
  orderNumber: 'ER-2026-ABC123',
  aenderungen: ['1 × Inspire Hooded Sweat · Black Pure entfernt (L: 2 → 1; jetzt 1 statt 2 Stück)'],
  altGesamtCent: 8598,
  neuGesamtCent: 5489,
  differenzCent: 3109,
  versandAltCent: 0,
  versandNeuCent: 690,
  zahlung: 'rechnung',
  rechnung: { art: 'entsteht' },
  bestellansichtUrl: 'https://www.ergermany.de/bestellung/token123',
};

async function text(daten: Partial<KundenmailDaten> = {}): Promise<string> {
  return render(OrderEditedEmail({ daten: { ...BASIS, ...daten } }), { plainText: true });
}

/** Zeilenumbrüche des Klartexts glätten, damit Sätze auch über Umbrüche gefunden werden. */
function flach(s: string): string {
  return s.replace(/\s+/g, ' ');
}

test('nennt Bestellnummer, jede Änderung, alte und neue Summe und die Differenz', async () => {
  const t = flach(await text());
  assert.match(t, /ER-2026-ABC123/);
  assert.match(t, /1 × Inspire Hooded Sweat · Black Pure entfernt \(L: 2 → 1; jetzt 1 statt 2 Stück\)/);
  assert.match(t, /Bisherige Gesamtsumme: 85,98 €/);
  assert.match(t, /Neue Gesamtsumme: 54,89 €/);
  assert.match(t, /Differenz: 31,09 €/);
});

test('mehrere Änderungen erscheinen einzeln', async () => {
  const t = await text({ aenderungen: ['Heavy T · Navy (1 × M) komplett entfernt', '1 × Hoodie · Schwarz entfernt (L: 3 → 2; jetzt 2 statt 3 Stück)'] });
  assert.match(t, /Heavy T · Navy \(1 × M\) komplett entfernt/);
  assert.match(t, /Hoodie · Schwarz entfernt/);
});

test('Versandkosten, die durch die Änderung neu anfallen, werden erklärt – sonst nicht', async () => {
  const mit = flach(await text({ versandAltCent: 0, versandNeuCent: 690 }));
  assert.match(mit, /Versandkosten/);
  assert.match(mit, /6,90 €/);
  assert.match(mit, /75,00 €/, 'die Freigrenze kommt aus der Versandkonfiguration');
  const ohne = flach(await text({ versandAltCent: 0, versandNeuCent: 0 }));
  assert.doesNotMatch(ohne, /Versandkosten/);
  const schonVorher = flach(await text({ versandAltCent: 690, versandNeuCent: 690 }));
  assert.doesNotMatch(schonVorher, /Versandkosten fallen/);
});

test('ohne bestehende Rechnung: sie entsteht mit den geänderten Angaben', async () => {
  const t = flach(await text({ rechnung: { art: 'entsteht' } }));
  assert.match(t, /Deine Rechnung erstellen wir mit den geänderten Angaben/);
  assert.doesNotMatch(t, /separat zu/);
  assert.doesNotMatch(t, /RE-/);
});

test('mit bestehender Rechnung: Nummer genannt, angepasste Rechnung folgt separat – ohne rechtliche Aussage zur alten', async () => {
  const t = flach(await text({ rechnung: { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000123' } }));
  assert.match(t, /Die bisherige Rechnung RE-2026-000123 berücksichtigt diese Änderung noch nicht/);
  assert.match(t, /Eine angepasste Rechnung senden wir dir separat zu/);
  for (const verboten of [/ungültig/i, /storniert/i, /Gutschrift/i, /Korrekturrechnung/i, /Stornorechnung/i, /aufgehoben/i]) {
    assert.doesNotMatch(t, verboten, `rechtliche Aussage in der Mail: ${verboten}`);
  }
});

test('Rechnungskauf mit bestehender Rechnung: Hinweis, erst nach der angepassten Rechnung zu überweisen', async () => {
  const mit = flach(await text({ zahlung: 'rechnung', rechnung: { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000123' } }));
  assert.match(mit, /Bitte überweise erst, wenn du sie bekommen hast/);
  const bezahlt = flach(await text({ zahlung: 'bezahlt', rechnung: { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000123' } }));
  assert.doesNotMatch(bezahlt, /überweise/);
});

test('bezahlte Bestellung: Erstattung der Differenz auf dem Zahlungsweg – nur, wenn es eine Differenz gibt', async () => {
  const t = flach(await text({ zahlung: 'bezahlt' }));
  assert.match(t, /Den zu viel gezahlten Betrag von 31,09 € erstatten wir dir/);
  const keine = flach(await text({ zahlung: 'bezahlt', differenzCent: 0, neuGesamtCent: 8598 }));
  assert.doesNotMatch(keine, /erstatten/);
  const rechnungskauf = flach(await text({ zahlung: 'rechnung' }));
  assert.doesNotMatch(rechnungskauf, /erstatten/, 'beim Rechnungskauf wurde nichts gezahlt');
});

test('Link zur Bestellung nur, wenn einer vorhanden ist', async () => {
  assert.match(await text(), /https:\/\/www\.ergermany\.de\/bestellung\/token123/);
  assert.doesNotMatch(await text({ bestellansichtUrl: null }), /bestellung\/token/);
});

test('Kontakt für Rückfragen und Du-Anrede ohne Sie-Form', async () => {
  const t = await text();
  assert.match(t, /Telefon:/);
  assert.match(t, /E-Mail: info@ergermany\.de/);
  assert.doesNotMatch(t, /\b(Ihr|Ihre|Ihnen|Ihrem|Ihren)\b|\bSie\b/);
});

// ═══════════════════════════════════════════════════════════════════════
// Ersatzrechnung im Anhang (Migration 0039)
// ═══════════════════════════════════════════════════════════════════════

const ERSETZT = { art: 'ersetzt', neueRechnungsnummer: 'RE-2026-000099', alteRechnungsnummer: 'RE-2026-000007', alteRechnungsdatum: '2026-11-20' } as const;

test('Ersatzrechnung: Die Mail nennt NEUE und ERSETZTE Rechnung und sagt, dass das PDF im Anhang liegt', async () => {
  const t = flach(await text({ rechnung: ERSETZT }));
  assert.match(t, /Die neue Rechnung RE-2026-000099 findest du als PDF im Anhang dieser E-Mail/);
  assert.match(t, /Diese Rechnung ersetzt die bisherige Rechnung RE-2026-000007 vom 20\.11\.2026/);
  assert.doesNotMatch(t, /separat zu/, 'die Rechnung kommt jetzt mit, nicht später');
  assert.doesNotMatch(t, /erstellen wir mit den geänderten Angaben/);
});

test('Ersatzrechnung: Rechnungskauf bekommt den Zahlungshinweis, bezahlte Bestellung nicht – und bleibt bei der Erstattung der Differenz', async () => {
  const rechnungskauf = flach(await text({ rechnung: ERSETZT, zahlung: 'rechnung' }));
  assert.match(rechnungskauf, /Bitte überweise den Betrag der neuen Rechnung/);
  assert.doesNotMatch(rechnungskauf, /erstatten/);

  const bezahlt = flach(await text({ rechnung: ERSETZT, zahlung: 'bezahlt' }));
  assert.doesNotMatch(bezahlt, /überweise/);
  assert.match(bezahlt, /Den zu viel gezahlten Betrag von 31,09 € erstatten wir dir/);
});

test('Ersatzrechnung: In der Vorschau (Nummer noch nicht vergeben) steht das ehrlich so da', async () => {
  const t = flach(await text({ rechnung: { ...ERSETZT, neueRechnungsnummer: null } }));
  assert.match(t, /Die neue Rechnung \(ihre Nummer wird beim Speichern vergeben\) findest du als PDF im Anhang/);
  assert.doesNotMatch(t, /RE-2026-000099/);
});

test('Ersatzrechnung: Ohne Datum der alten Rechnung nur ihre Nummer – und keine rechtliche Aussage über sie', async () => {
  const t = flach(await text({ rechnung: { ...ERSETZT, alteRechnungsdatum: null } }));
  assert.match(t, /Diese Rechnung ersetzt die bisherige Rechnung RE-2026-000007\./);
  for (const verboten of [/ungültig/i, /storniert/i, /Gutschrift/i, /Korrekturrechnung/i, /Stornorechnung/i, /aufgehoben/i, /nicht mehr zu bezahlen/i]) {
    assert.doesNotMatch(t, verboten, `rechtliche Aussage in der Mail: ${verboten}`);
  }
  assert.doesNotMatch(t, /\b(Ihr|Ihre|Ihnen|Ihrem|Ihren)\b|\bSie\b/, 'Du-Anrede, keine Sie-Form');
});

test('Rechnungs-Nachtragsmail (InvoiceEmail): nennt die ersetzte Rechnung nur, wenn es eine gibt', async () => {
  const mit = flach(
    await render(
      InvoiceEmail({
        orderNumber: 'ER-2026-ABC123',
        invoiceNumber: 'RE-2026-000099',
        invoiceDate: '26.11.2026',
        replaces: { invoiceNumber: 'RE-2026-000007', invoiceDate: '20.11.2026' },
      }),
      { plainText: true }
    )
  );
  assert.match(mit, /findest du anbei die Rechnung RE-2026-000099 vom 26\.11\.2026 als PDF\. Diese Rechnung ersetzt die Rechnung RE-2026-000007 vom 20\.11\.2026\./);

  const ohneDatum = flach(
    await render(
      InvoiceEmail({
        orderNumber: 'ER-2026-ABC123',
        invoiceNumber: 'RE-2026-000099',
        invoiceDate: '26.11.2026',
        replaces: { invoiceNumber: 'RE-2026-000007', invoiceDate: null },
      }),
      { plainText: true }
    )
  );
  assert.match(ohneDatum, /Diese Rechnung ersetzt die Rechnung RE-2026-000007\./);

  const ohne = flach(
    await render(InvoiceEmail({ orderNumber: 'ER-2026-ABC123', invoiceNumber: 'RE-2026-000099', invoiceDate: '26.11.2026' }), { plainText: true })
  );
  assert.doesNotMatch(ohne, /ersetzt/);
});

test('Anhang nur mit gültigem PDF: Text und Anhang hängen am selben Gate (Quelltext von sendOrderEditedEmail)', () => {
  const quelle = readFileSync(path.join(process.cwd(), 'src', 'lib', 'email', 'orderEmails.tsx'), 'utf8');
  const rumpf = quelle.slice(quelle.indexOf('export async function sendOrderEditedEmail'), quelle.indexOf('export async function sendInvoiceReplacementEmail'));
  assert.match(rumpf, /params\.rechnung\.pdf && params\.rechnung\.pdf\.length > 0/, 'leeres PDF zählt nicht als Anhang');
  assert.match(rumpf, /params\.daten\.rechnung\.art === 'ersetzt' && !anhang/, 'ohne Anhang fällt der Text auf „folgt separat“ zurück');
  assert.match(rumpf, /attachments: \[\{ filename: `Rechnung-\$\{anhang\.rechnungsnummer\}\.pdf`, content: anhang\.pdf \}\]/);
  assert.match(quelle, /kontext: \{ anlass: 'invoice_replaced', orderId: params\.orderId \}/);
});
