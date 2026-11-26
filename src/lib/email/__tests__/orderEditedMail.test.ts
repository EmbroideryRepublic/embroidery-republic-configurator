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
import { render } from '@react-email/render';
import { OrderEditedEmail } from '../templates/OrderEditedEmail';
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
