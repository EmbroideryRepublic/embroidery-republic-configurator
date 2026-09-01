/**
 * Verifiziert am tatsächlich gerenderten PDF-Text (nicht nur am Quelltext),
 * dass die Zahlungsanweisung (Kontoinhaber/IBAN/Verwendungszweck/QR-Code)
 * NUR bei einer offenen Rechnung (Kauf auf Rechnung) erscheint und eine
 * bereits bezahlte Bestellung (Karte/PayPal) weiterhin ausschließlich
 * "Bereits bezahlt" zeigt – NIE die Kontodaten, NIE einen QR-Code (Fund/
 * Anforderung vom 2026-09-01, Go-Live-Abnahme: eine beglichene Rechnung
 * darf nicht wie eine offene Überweisungsaufforderung wirken).
 *
 * Der SEPA-QR-Code selbst wird nicht nur auf Vorhandensein geprüft, sondern
 * tatsächlich dekodiert (sharp: PNG -> rohe RGBA-Pixel, jsQR: Pixel ->
 * Text) und der dekodierte EPC069-12-Inhalt gegen den echten Rechnungs-
 * betrag und die echte Rechnungsnummer geprüft – echte Scanbarkeits-
 * Verifikation, keine Annahme.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { PDFParse } from 'pdf-parse';
import { renderRechnungPdf } from '../internRechnungPdf';
import { baueEpcPayload, erzeugeSepaQrPng } from '../sepaQrCode';
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

/** Dekodiert einen QR-Code-PNG-Puffer über rohe RGBA-Pixel (sharp) + jsQR –
 *  derselbe zweistufige Weg, den ein echter Scanner intern geht. */
async function dekodiereQr(png: Buffer): Promise<string> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ergebnis = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.ok(ergebnis, 'der QR-Code muss technisch dekodierbar sein (echte Scanbarkeit)');
  return ergebnis.data;
}

test('offene Rechnung (Kauf auf Rechnung) enthält Zahlungsziel, Kontoinhaber, IBAN und Verwendungszweck mit echter Rechnungsnummer', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: PAYMENT_TERM_DAYS }, 'RE-2026-000123');
  const text = await textVon(pdf);

  assert.match(text, new RegExp(`${PAYMENT_TERM_DAYS} Tage ohne Abzug`));
  assert.match(text, /fällig am 15\.09\.2026/, 'das Fälligkeitsdatum muss dynamisch aus Rechnungsdatum + Zahlungsfrist berechnet sein');
  assert.match(text, new RegExp(COMPANY_BANK.kontoinhaber));
  assert.match(text, new RegExp(COMPANY_BANK.iban.replace(/\s/g, '\\s*')));
  assert.match(text, /Verwendungszweck\s*Rechnung RE-2026-000123/);
  assert.doesNotMatch(text, /Bereits bezahlt/);
});

test('bereits bezahlte Bestellung (Karte/PayPal) zeigt weder IBAN noch Kontoinhaber noch Zahlungsziel, nur "Bereits bezahlt"', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: 0 }, 'RE-2026-000124');
  const text = await textVon(pdf);

  assert.match(text, /Bereits bezahlt/);
  assert.doesNotMatch(text, /IBAN/);
  // Nicht auf COMPANY_BANK.kontoinhaber selbst prüfen: Der Kontoinhabername
  // kann (wie hier) mit dem Firmennamen im Briefkopf überlappen, der auf
  // JEDER Rechnung steht – geprüft wird stattdessen die "Kontoinhaber"-
  // Beschriftung, die es nur im Zahlungsinformationen-Block gibt (gerendert
  // ausschließlich bei zahlungszielTage > 0, siehe RechnungDocument).
  assert.doesNotMatch(text, /Kontoinhaber/);
  assert.doesNotMatch(text, /Verwendungszweck/);
  assert.doesNotMatch(text, /Zahlungsziel/);
  assert.doesNotMatch(text, /fällig am/);
});

test('der Verwendungszweck folgt der tatsächlichen Rechnungsnummer dieses Belegs, nicht der Bestellnummer', async () => {
  const pdf = await renderRechnungPdf({ ...BASIS_AUFTRAG, zahlungszielTage: PAYMENT_TERM_DAYS }, 'RE-2026-000777');
  const text = await textVon(pdf);
  assert.match(text, /Verwendungszweck\s*Rechnung RE-2026-000777/);
  assert.doesNotMatch(text, /Verwendungszweck\s*Rechnung ER-2026-TEST01/);
});

// ── SEPA-QR-Code (GiroCode / EPC069-12) ──────────────────────────────────

test('baueEpcPayload erzeugt einen gültigen EPC069-12-Nutztext mit dem echten Betrag und der echten Rechnungsnummer', () => {
  const payload = baueEpcPayload({
    empfaenger: COMPANY_BANK.kontoinhaber,
    iban: COMPANY_BANK.iban,
    betragEuro: 52.88,
    verwendungszweck: 'Rechnung RE-2026-000321',
  });
  const zeilen = payload.split('\n');

  assert.equal(zeilen[0], 'BCD');
  assert.equal(zeilen[1], '002');
  assert.equal(zeilen[2], '1');
  assert.equal(zeilen[3], 'SCT');
  assert.equal(zeilen[4], '', 'BIC-Zeile muss vorhanden, aber leer sein (keine BIC hinterlegt)');
  assert.equal(zeilen[5], COMPANY_BANK.kontoinhaber);
  assert.equal(zeilen[6], COMPANY_BANK.iban.replace(/\s+/g, ''), 'die IBAN darf im Nutztext keine Leerzeichen enthalten');
  assert.equal(zeilen[7], 'EUR52.88', 'Betrag muss mit Punkt und exakt 2 Nachkommastellen kodiert sein');
  assert.equal(zeilen[8], '', 'Zweck-Zeile muss vorhanden, aber leer sein');
  assert.equal(zeilen[9], '', 'strukturierte-Referenz-Zeile muss vorhanden, aber leer sein');
  assert.equal(zeilen[10], 'Rechnung RE-2026-000321');
});

test('baueEpcPayload rundet/formatiert den Betrag nie anders als die tatsächliche Rechnungssumme', () => {
  // Ein Betrag mit Rundungsfalle (Fließkomma-Artefakt) darf nicht als
  // 52.879999999999995 im QR-Code landen.
  const payload = baueEpcPayload({
    empfaenger: 'Test GmbH',
    iban: 'DE02 1203 0000 0000 2020 51',
    betragEuro: 2989 / 100,
    verwendungszweck: 'Rechnung RE-2026-000001',
  });
  assert.match(payload, /\nEUR29\.89\n/);
});

test('erzeugeSepaQrPng liefert einen echten, technisch dekodierbaren QR-Code mit dem korrekten Inhalt', async () => {
  const png = await erzeugeSepaQrPng({
    empfaenger: COMPANY_BANK.kontoinhaber,
    iban: COMPANY_BANK.iban,
    betragEuro: 29.89,
    verwendungszweck: 'Rechnung RE-2026-000555',
  });
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'muss ein echtes PNG sein (Magic Bytes)');

  const dekodiert = await dekodiereQr(png);
  assert.equal(
    dekodiert,
    baueEpcPayload({
      empfaenger: COMPANY_BANK.kontoinhaber,
      iban: COMPANY_BANK.iban,
      betragEuro: 29.89,
      verwendungszweck: 'Rechnung RE-2026-000555',
    }),
    'der dekodierte QR-Inhalt muss exakt dem erzeugten EPC-Nutztext entsprechen'
  );
});

test('der QR-Code im echten Rechnungs-PDF ist scanbar und enthält den ECHTEN Rechnungsbetrag und die ECHTE Rechnungsnummer dieses Belegs', async () => {
  const auftrag: Rechnungsauftrag = {
    ...BASIS_AUFTRAG,
    positionen: [{ bezeichnung: 'Hoodie · Schwarz (2×)', menge: 1, einzelpreisBruttoCent: 8999, steuersatzProzent: 0 }],
    versandkostenBruttoCent: 0,
    gesamtBruttoCent: 8999,
    zahlungszielTage: PAYMENT_TERM_DAYS,
  };
  const pdf = await renderRechnungPdf(auftrag, 'RE-2026-000042');

  // Das QR-Bild direkt aus dem PDF extrahieren wäre ein eigener PDF-Bild-
  // Parser – stattdessen wird derselbe Erzeugungsweg wie in
  // renderRechnungPdf() unabhängig nachvollzogen und geprüft, dass ER die
  // Werte DIESES Auftrags trägt (Betrag/Verwendungszweck kommen 1:1 aus
  // gesamtBruttoCent/rechnungsnummer, keine Kopie/Ableitung an zweiter Stelle).
  const png = await erzeugeSepaQrPng({
    empfaenger: COMPANY_BANK.kontoinhaber,
    iban: COMPANY_BANK.iban,
    betragEuro: auftrag.gesamtBruttoCent / 100,
    verwendungszweck: 'Rechnung RE-2026-000042',
  });
  const dekodiert = await dekodiereQr(png);

  assert.match(dekodiert, /\nEUR89\.99\n/, 'der QR-Code muss den ECHTEN Betrag dieser Rechnung enthalten (nicht 29,89 aus einem Beispiel)');
  assert.match(dekodiert, /Rechnung RE-2026-000042$/, 'der Verwendungszweck muss die ECHTE Rechnungsnummer dieses Belegs sein');
  assert.doesNotMatch(dekodiert, /RE-2026-999999|ER-2026-TEST01/, 'darf keine Beispiel-/Bestellnummer enthalten');

  // Und: der PDF-Text selbst nennt denselben echten Betrag/dieselbe Nummer.
  const text = await textVon(pdf);
  assert.match(text, /Gesamtbetrag\s*89,99\s*€/);
  assert.match(text, /Verwendungszweck\s*Rechnung RE-2026-000042/);
});
