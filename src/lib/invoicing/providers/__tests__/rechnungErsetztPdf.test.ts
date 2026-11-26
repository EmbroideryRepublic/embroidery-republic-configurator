/**
 * Prüft am tatsächlich gerenderten PDF-Text (wie internRechnungPdf.test.ts), dass
 * eine Ersatzrechnung gut sichtbar nennt, welche Rechnung sie ersetzt – und dass
 * eine erste Rechnung davon nichts enthält. Der Wortlaut macht bewusst keine
 * Aussage dazu, wie die frühere Rechnung buchhalterisch oder rechtlich zu
 * behandeln ist (kein „storniert“, „ungültig“, „Gutschrift“).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFParse } from 'pdf-parse';
import { renderRechnungPdf } from '../internRechnungPdf';
import type { Rechnungsauftrag } from '../../types';

const BASIS: Rechnungsauftrag = {
  bestellId: 'test-order-1',
  bestellnummer: 'ER-2026-TEST01',
  rechnungsdatum: '2026-11-26',
  kaeufer: { name: 'Max Mustermann', strasse: 'Teststraße 1', plz: '12345', ort: 'Teststadt', land: 'Deutschland' },
  positionen: [{ bezeichnung: 'Heavy T · Weiß (1×)', menge: 1, einzelpreisBruttoCent: 2299, steuersatzProzent: 0 }],
  versandkostenBruttoCent: 690,
  gesamtBruttoCent: 2989,
  waehrung: 'EUR',
  zahlungszielTage: 14,
  naechsteRechnungsnummer: async () => 'RE-2026-000099',
};

async function textVon(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdf });
  return (await parser.getText()).text.replace(/\s+/g, ' ');
}

test('Ersatzrechnung nennt Nummer und Datum der ersetzten Rechnung', async () => {
  const pdf = await renderRechnungPdf(
    { ...BASIS, ersetzt: { rechnungsnummer: 'RE-2026-000007', rechnungsdatum: '2026-11-20' } },
    'RE-2026-000099'
  );
  const text = await textVon(pdf);
  assert.match(text, /RE-2026-000099/);
  assert.match(text, /Diese Rechnung ersetzt die Rechnung Nr\. RE-2026-000007 vom 20\.11\.2026\./);
  for (const verboten of [/storniert/i, /ungültig/i, /Gutschrift/i, /Korrektur/i]) {
    assert.doesNotMatch(text, verboten, `rechtliche Aussage im Beleg: ${verboten}`);
  }
});

test('ist das Datum der ersetzten Rechnung unbekannt, steht nur ihre Nummer da', async () => {
  const pdf = await renderRechnungPdf(
    { ...BASIS, ersetzt: { rechnungsnummer: 'RE-2026-000007', rechnungsdatum: null } },
    'RE-2026-000099'
  );
  const text = await textVon(pdf);
  assert.match(text, /Diese Rechnung ersetzt die Rechnung Nr\. RE-2026-000007\./);
  assert.doesNotMatch(text, /ersetzt die Rechnung Nr\. RE-2026-000007 vom/);
});

test('eine erste Rechnung enthält keinen Ersetzungs-Hinweis', async () => {
  const text = await textVon(await renderRechnungPdf(BASIS, 'RE-2026-000099'));
  assert.doesNotMatch(text, /ersetzt/);
});

test('bei einer bereits bezahlten Bestellung bleibt es bei „Bereits bezahlt“ – auch auf der Ersatzrechnung', async () => {
  const text = await textVon(
    await renderRechnungPdf(
      { ...BASIS, zahlungszielTage: 0, ersetzt: { rechnungsnummer: 'RE-2026-000007', rechnungsdatum: '2026-11-20' } },
      'RE-2026-000099'
    )
  );
  assert.match(text, /Bereits bezahlt/);
  assert.match(text, /ersetzt die Rechnung Nr\. RE-2026-000007/);
  assert.doesNotMatch(text, /IBAN/);
});
