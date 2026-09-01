/**
 * Verifiziert am tatsächlich gerenderten PDF-Text (nicht nur am Quelltext),
 * dass die Zahlungsanweisung (Kontoinhaber/IBAN/Verwendungszweck) NUR bei
 * einer offenen Rechnung (Kauf auf Rechnung) erscheint und eine bereits
 * bezahlte Bestellung (Karte/PayPal) weiterhin ausschließlich "Bereits
 * bezahlt." zeigt – NIE die Kontodaten (Fund/Anforderung vom 2026-09-01,
 * Go-Live-Abnahme: eine beglichene Rechnung darf nicht wie eine offene
 * Überweisungsaufforderung wirken).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFParse } from 'pdf-parse';
import { renderRechnungPdf } from '../internRechnungPdf';
import { COMPANY_BANK, PAYMENT_TERM_DAYS } from '@/config/company';
import type { Rechnungsauftrag } from '../../types';

const BASIS_AUFTRAG: Omit<Rechnungsauftrag, 'zahlungszielTage'> = {
  bestellId: 'test-order-1',
  bestellnummer: 'ER-2026-TEST01',
  rechnungsdatum: '2026-09-01',
  kaeufer: { name: 'Max Mustermann', strasse: 'Teststraße 1', plz: '12345', ort: 'Teststadt', land: 'Deutschland' },
  positionen: [{ bezeichnung: 'Heavy T · Weiß (1×)', menge: 1, einzelpreisBruttoCent: 2299, steuersatzProzent: 0 }],
  versandkostenBruttoCent: 690,
  gesamtBruttoCent: 2989,
  waehrung: 'EUR',
  naechsteRechnungsnummer: async () => 'RE-2026-999999',
};

async function textVon(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdf });
  return (await parser.getText()).text;
}

test('offene Rechnung (Kauf auf Rechnung) zeigt Kontoinhaber, IBAN und Verwendungszweck mit echter Rechnungsnummer', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: PAYMENT_TERM_DAYS }, 'RE-2026-000123');
  const text = await textVon(pdf);

  assert.match(text, new RegExp(`Zahlbar innerhalb von ${PAYMENT_TERM_DAYS} Tagen`));
  assert.match(text, new RegExp(`Kontoinhaber:\\s*${COMPANY_BANK.kontoinhaber}`));
  assert.match(text, new RegExp(`IBAN:\\s*${COMPANY_BANK.iban.replace(/\s/g, '\\s*')}`));
  assert.match(text, /Verwendungszweck:\s*Rechnung RE-2026-000123/);
  assert.doesNotMatch(text, /Bereits bezahlt/);
});

test('bereits bezahlte Bestellung (Karte/PayPal) zeigt weder IBAN noch Kontoinhaber, nur "Bereits bezahlt."', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: 0 }, 'RE-2026-000124');
  const text = await textVon(pdf);

  assert.match(text, /Bereits bezahlt\./);
  assert.doesNotMatch(text, /IBAN/);
  assert.doesNotMatch(text, new RegExp(COMPANY_BANK.kontoinhaber));
  assert.doesNotMatch(text, /Verwendungszweck/);
  assert.doesNotMatch(text, /Zahlbar innerhalb/);
});

test('der Verwendungszweck folgt der tatsächlichen Rechnungsnummer dieses Belegs, nicht der Bestellnummer', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: PAYMENT_TERM_DAYS }, 'RE-2026-000777');
  const text = await textVon(pdf);
  assert.match(text, /Verwendungszweck:\s*Rechnung RE-2026-000777/);
  assert.doesNotMatch(text, /Verwendungszweck:\s*Rechnung ER-2026-TEST01/);
});
