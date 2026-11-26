/**
 * Tests der Ersatzrechnung (orderInvoiceReplacement.ts) – ausschließlich mit
 * Attrappen: keine Datenbank, kein Speicher, kein PDF-Rendering, keine Mail.
 *
 * Schwerpunkt ist die Zusage „nie zwei neue Rechnungen für dieselbe Änderung“:
 * Die Nummer wird einmal reserviert, jede Wiederholung bekommt dieselbe zurück,
 * der Tausch passiert genau einmal, und nach einem Fehlschlag steht der Anspruch
 * wieder frei. Die atomare Seite (Datenbankfunktionen) ist in der Migration
 * 0039 festgelegt und wird hier am Quelltext abgesichert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { OrderRecord } from '@/lib/actions/orderTypes';
import type { Rechnungsauftrag, Rechnungserstellung } from '@/lib/invoicing/types';
import type { EmailVersandErgebnis } from '@/lib/email/orderEmails';
import { PAYMENT_TERM_DAYS } from '@/config/company';
import {
  erzeugeErsatzrechnungNach,
  ersatzRechnungPfad,
  ersetzeRechnung,
  type ErsatzRechnungsAbhaengigkeiten,
  type ReservierungsAntwort,
} from '../orderInvoiceReplacement';

const ORDER_ID = '11111111-2222-3333-4444-555555555555';

function bestellung(ueberschreibungen: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: ORDER_ID,
    orderNumber: 'ER-2026-ABC123',
    orderType: 'order',
    createdAt: '2026-11-20T10:00:00.000Z',
    contact: { name: 'Max Mustermann', email: 'max@example.invalid' },
    shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
    paymentMethod: 'invoice',
    subtotal: 47.99,
    shippingCost: 6.9,
    totalPrice: 54.89,
    taxRate: 0,
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

const RESERVIERT: Extract<ReservierungsAntwort, { status: 'reserviert' }> = {
  status: 'reserviert',
  neueNummer: 'RE-2026-000099',
  neuesDatum: '2026-11-26',
  alteNummer: 'RE-2026-000007',
  altesDatum: '2026-11-20',
  alterPfad: `orders/${ORDER_ID}/rechnung.pdf`,
};

interface Attrappe {
  deps: ErsatzRechnungsAbhaengigkeiten;
  ablauf: string[];
  auftraege: Rechnungsauftrag[];
  pdfs: Array<{ pfad: string; groesse: number }>;
  tausche: Array<{ orderId: string; alteNummer: string; neueId: string; neueNummer: string; pfad: string }>;
  freigaben: string[];
  ereignisse: Array<{ eventType: string; reason: string; detail: Record<string, unknown> }>;
  mails: Array<{ empfaenger: string; neueNummer: string; alteNummer: string; neuesDatum: string; altesDatum: string | null; pdf: Buffer }>;
  mailProtokoll: PromiseSettledResult<EmailVersandErgebnis>[];
}

function attrappe(
  optionen: {
    order?: OrderRecord | null;
    faehig?: boolean;
    reservierung?: () => Promise<ReservierungsAntwort> | ReservierungsAntwort;
    erstelle?: (auftrag: Rechnungsauftrag) => Promise<Rechnungserstellung>;
    ablegen?: () => Promise<void>;
    tausche?: () => Promise<'ersetzt' | 'bereits-ersetzt'>;
    ausstehend?: { alteNummer: string; kundenmailVorgesehen: boolean } | null;
    mail?: () => Promise<EmailVersandErgebnis>;
  } = {}
): Attrappe {
  const a: Attrappe = {
    deps: undefined as never,
    ablauf: [],
    auftraege: [],
    pdfs: [],
    tausche: [],
    freigaben: [],
    ereignisse: [],
    mails: [],
    mailProtokoll: [],
  };
  a.deps = {
    anbieterErsatzFaehig: () => optionen.faehig ?? true,
    async ladeBestellung() {
      a.ablauf.push('laden');
      return optionen.order === undefined ? bestellung() : optionen.order;
    },
    async reserviere() {
      a.ablauf.push('reservieren');
      return optionen.reservierung ? optionen.reservierung() : RESERVIERT;
    },
    async erstelle(auftrag) {
      a.ablauf.push('rendern');
      a.auftraege.push(auftrag);
      if (optionen.erstelle) return optionen.erstelle(auftrag);
      return { rechnungsId: 'rechnung-id-neu', rechnungsnummer: await auftrag.naechsteRechnungsnummer(), pdf: Buffer.from('%PDF-neu') };
    },
    async legePdfAb(pfad, pdf) {
      a.ablauf.push('ablegen');
      a.pdfs.push({ pfad, groesse: pdf.length });
      if (optionen.ablegen) await optionen.ablegen();
    },
    async tausche(orderId, alteNummer, neueId, neueNummer, pfad) {
      a.ablauf.push('tauschen');
      a.tausche.push({ orderId, alteNummer, neueId, neueNummer, pfad });
      return optionen.tausche ? optionen.tausche() : 'ersetzt';
    },
    async gibFrei(_orderId, alteNummer) {
      a.ablauf.push('freigeben');
      a.freigaben.push(alteNummer);
    },
    async protokolliere(eintrag) {
      a.ablauf.push('protokoll');
      a.ereignisse.push(eintrag);
    },
    jetzt: () => new Date('2026-11-26T09:30:00.000Z'),
    async findeAusstehend() {
      return optionen.ausstehend === undefined ? { alteNummer: 'RE-2026-000007', kundenmailVorgesehen: true } : optionen.ausstehend;
    },
    async sendeRechnungsmail(params) {
      a.ablauf.push('mail');
      a.mails.push(params);
      return optionen.mail ? optionen.mail() : { success: true, messageId: 'm1' };
    },
    async protokolliereMail(_orderId, ergebnis) {
      a.ablauf.push('mailprotokoll');
      a.mailProtokoll.push(ergebnis);
    },
  };
  return a;
}

// ═══════════════════════════════════════════════════════════════════════
// Der Regelfall
// ═══════════════════════════════════════════════════════════════════════

test('Regelfall: reservieren → rendern → ablegen → tauschen, mit der reservierten Nummer', async () => {
  const a = attrappe();
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);

  assert.equal(r.ok, true);
  if (!r.ok || r.status !== 'ersetzt') return;
  assert.deepEqual(a.ablauf, ['laden', 'reservieren', 'rendern', 'ablegen', 'tauschen']);
  assert.equal(r.neueNummer, 'RE-2026-000099');
  assert.equal(r.alteNummer, 'RE-2026-000007');
  assert.equal(r.altesDatum, '2026-11-20');
  assert.equal(r.bestellnummer, 'ER-2026-ABC123');
  assert.equal(r.empfaenger, 'max@example.invalid');
  assert.ok(r.pdf.length > 0);
});

test('Der Auftrag an den Anbieter trägt die geänderten Beträge, die reservierte Nummer und die ersetzte Rechnung', async () => {
  const a = attrappe();
  await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);

  const auftrag = a.auftraege[0]!;
  assert.equal(auftrag.rechnungsdatum, '2026-11-26', 'das bei der Reservierung festgelegte Datum');
  assert.equal(await auftrag.naechsteRechnungsnummer(), 'RE-2026-000099', 'die Nummer wird NICHT neu gezogen');
  assert.deepEqual(auftrag.ersetzt, { rechnungsnummer: 'RE-2026-000007', rechnungsdatum: '2026-11-20' });
  // Beträge kommen aus dem gespeicherten, geänderten Stand der Bestellung.
  assert.equal(auftrag.gesamtBruttoCent, 5489);
  assert.equal(auftrag.positionen.length, 1);
  assert.equal(auftrag.positionen[0]!.einzelpreisBruttoCent, 4799);
  assert.equal(auftrag.versandkostenBruttoCent, 690);
  assert.equal(auftrag.zahlungszielTage, PAYMENT_TERM_DAYS);
  assert.equal(auftrag.kaeufer.name, 'Max Mustermann');
});

test('Bezahlte Bestellung: dieselbe Ersatzrechnung, Zahlungsziel 0 = „bereits bezahlt“', async () => {
  const a = attrappe({ order: bestellung({ paymentMethod: 'card' }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, true);
  assert.equal(a.auftraege[0]!.zahlungszielTage, 0);
  assert.ok(a.auftraege[0]!.ersetzt);
});

test('Die alte Rechnung wird nie überschrieben: eigener Pfad je Rechnung, getauscht wird auf genau diesen Pfad', async () => {
  const a = attrappe();
  await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);

  const pfad = `orders/${ORDER_ID}/rechnung-RE-2026-000099.pdf`;
  assert.equal(ersatzRechnungPfad(ORDER_ID, 'RE-2026-000099'), pfad);
  assert.deepEqual(a.pdfs.map((p) => p.pfad), [pfad]);
  assert.notEqual(pfad, RESERVIERT.alterPfad);
  assert.deepEqual(a.tausche, [
    { orderId: ORDER_ID, alteNummer: 'RE-2026-000007', neueId: 'rechnung-id-neu', neueNummer: 'RE-2026-000099', pfad },
  ]);
});

test('Kollidiert der neue Pfad mit dem der alten Rechnung, wird NICHT überschrieben', async () => {
  const a = attrappe({ reservierung: () => ({ ...RESERVIERT, alterPfad: `orders/${ORDER_ID}/rechnung-RE-2026-000099.pdf` }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  assert.equal(a.pdfs.length, 0, 'nichts hochgeladen');
  assert.equal(a.tausche.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════
// „Nie zwei neue Rechnungen für dieselbe Änderung“
// ═══════════════════════════════════════════════════════════════════════

/** Eine Attrappe der Datenbankfunktion: pro abgelöster Rechnung genau EINE Nummer, Anspruch mit Sperre, Tausch einmalig. */
function datenbankAttrappe() {
  const zustand = { naechsteLaufnummer: 100, reserviert: null as string | null, anspruch: false, getauscht: false, gezogeneNummern: [] as string[] };
  return {
    zustand,
    reservierung: (): ReservierungsAntwort => {
      if (zustand.getauscht) return { status: 'bereits-ersetzt' };
      if (zustand.anspruch) return { status: 'laeuft' };
      if (!zustand.reserviert) {
        zustand.reserviert = `RE-2026-${String(zustand.naechsteLaufnummer++).padStart(6, '0')}`;
        zustand.gezogeneNummern.push(zustand.reserviert);
      }
      zustand.anspruch = true;
      return { ...RESERVIERT, neueNummer: zustand.reserviert };
    },
    freigabe: () => {
      zustand.anspruch = false;
    },
    tausch: (): 'ersetzt' | 'bereits-ersetzt' => {
      if (zustand.getauscht) return 'bereits-ersetzt';
      zustand.getauscht = true;
      zustand.anspruch = false;
      return 'ersetzt';
    },
  };
}

test('Wiederholung nach einem Fehlschlag: dieselbe Nummer, nur EIN Tausch, keine zweite Nummer gezogen', async () => {
  const db = datenbankAttrappe();
  let versuch = 0;
  const a = attrappe({
    reservierung: db.reservierung,
    ablegen: async () => {
      versuch++;
      if (versuch === 1) throw new Error('Speicher nicht erreichbar');
    },
    tausche: async () => db.tausch(),
  });
  a.deps.gibFrei = async (...args) => {
    db.freigabe();
    a.freigaben.push(args[1]);
  };

  const erster = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(erster.ok, false);
  assert.equal(a.freigaben.length, 1, 'der Anspruch wird nach dem Fehlschlag freigegeben');
  assert.equal(a.tausche.length, 0);

  const zweiter = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(zweiter.ok, true);
  assert.equal(zweiter.ok && zweiter.status === 'ersetzt' ? zweiter.neueNummer : '', 'RE-2026-000100');

  assert.deepEqual(db.zustand.gezogeneNummern, ['RE-2026-000100'], 'in beiden Versuchen dieselbe, nur EINMAL gezogene Nummer');
  assert.deepEqual(
    a.auftraege.map((x) => x.rechnungsdatum),
    ['2026-11-26', '2026-11-26']
  );
  assert.equal(a.tausche.length, 1);

  // Ein dritter Klick (Doppelklick, zweiter Tab): nichts mehr zu tun – keine zweite Rechnung.
  const dritter = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.deepEqual(dritter, { ok: true, status: 'bereits-ersetzt' });
  assert.equal(db.zustand.gezogeneNummern.length, 1);
  assert.equal(a.auftraege.length, 2, 'nicht noch einmal gerendert');
});

test('Zwei gleichzeitige Läufe: der zweite sieht den Anspruch und erzeugt nichts', async () => {
  const db = datenbankAttrappe();
  const a = attrappe({ reservierung: db.reservierung, tausche: async () => db.tausch() });
  const b = attrappe({ reservierung: db.reservierung, tausche: async () => db.tausch() });

  // Der erste Lauf hält den Anspruch (reserviert, aber noch nicht getauscht).
  db.reservierung();
  const zweiter = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', b.deps);
  assert.equal(zweiter.ok, false);
  if (!zweiter.ok) assert.equal(zweiter.grund, 'laeuft');
  assert.equal(b.auftraege.length, 0, 'kein zweites Rendern');
  assert.equal(b.tausche.length, 0);
  void a;
});

test('„bereits ersetzt“ aus der Datenbank: nichts wird gerendert, abgelegt oder getauscht', async () => {
  const a = attrappe({ reservierung: () => ({ status: 'bereits-ersetzt' }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.deepEqual(r, { ok: true, status: 'bereits-ersetzt' });
  assert.deepEqual(a.ablauf, ['laden', 'reservieren']);
});

test('Tauscht ein anderer Lauf zuerst (Datenbank meldet „bereits ersetzt“), ist das ebenfalls kein Fehler', async () => {
  const a = attrappe({ tausche: async () => 'bereits-ersetzt' });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.deepEqual(r, { ok: true, status: 'bereits-ersetzt' });
});

// ═══════════════════════════════════════════════════════════════════════
// Fehlerfälle: Anspruch frei, Grund in der Historie, nichts Halbes getauscht
// ═══════════════════════════════════════════════════════════════════════

test('Rendering scheitert: Anspruch frei, Ereignis „Ersatzrechnung fehlgeschlagen“ mit Grund, kein Tausch', async () => {
  const a = attrappe({
    erstelle: async () => {
      throw new Error('PDF kaputt');
    },
  });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.grund, 'fehler');
    assert.match(r.meldung, /PDF kaputt/);
  }
  assert.deepEqual(a.freigaben, ['RE-2026-000007']);
  assert.equal(a.tausche.length, 0);
  assert.equal(a.pdfs.length, 0);
  assert.equal(a.ereignisse.length, 1);
  assert.equal(a.ereignisse[0]!.eventType, 'invoice_replacement_failed');
  assert.match(a.ereignisse[0]!.reason, /RE-2026-000007/);
  assert.match(a.ereignisse[0]!.reason, /PDF kaputt/);
  assert.equal(a.ereignisse[0]!.detail.reservierteNummer, 'RE-2026-000099', 'die reservierte Nummer bleibt nachvollziehbar');
});

test('Der Anbieter liefert eine andere Nummer als reserviert: Abbruch vor dem Ablegen', async () => {
  const a = attrappe({ erstelle: async () => ({ rechnungsId: 'x', rechnungsnummer: 'TEST-2026-ABCDEF', pdf: Buffer.from('%PDF') }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  assert.equal(a.pdfs.length, 0);
  assert.equal(a.tausche.length, 0);
  assert.match(a.ereignisse[0]!.reason, /statt der reservierten RE-2026-000099/);
});

test('Leeres PDF: Abbruch, nichts abgelegt oder getauscht', async () => {
  const a = attrappe({ erstelle: async (auftrag) => ({ rechnungsId: 'x', rechnungsnummer: await auftrag.naechsteRechnungsnummer(), pdf: Buffer.alloc(0) }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  assert.equal(a.pdfs.length, 0);
  assert.equal(a.tausche.length, 0);
});

test('Ablegen oder Tauschen scheitert: Anspruch frei, Fehler in der Historie, der Betreiber bekommt eine Meldung', async () => {
  for (const optionen of [
    { ablegen: async () => { throw new Error('Speicher voll'); } },
    { tausche: async (): Promise<'ersetzt' | 'bereits-ersetzt'> => { throw new Error('ersetze_rechnung: Verbindung verloren'); } },
  ]) {
    const a = attrappe(optionen);
    const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
    assert.equal(r.ok, false);
    assert.deepEqual(a.freigaben, ['RE-2026-000007']);
    assert.equal(a.ereignisse[0]!.eventType, 'invoice_replacement_failed');
  }
});

test('Fehler VOR der Reservierung (Bestellung/Anbieter): nichts reserviert, daher auch nichts freizugeben', async () => {
  const keinAnbieter = attrappe({ faehig: false });
  const r1 = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', keinAnbieter.deps);
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.equal(r1.grund, 'anbieter');
  assert.deepEqual(keinAnbieter.ablauf, []);

  const keineBestellung = attrappe({ order: null });
  const r2 = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', keineBestellung.deps);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.grund, 'nicht-gefunden');
  assert.deepEqual(keineBestellung.ablauf, ['laden']);
});

test('Die Datenbank lehnt ab (storniert, unklarer Zustand): verständliche Meldung, kein Rendern', async () => {
  const a = attrappe({ reservierung: () => ({ status: 'abgelehnt', code: 'unklarer-zustand' }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.grund, 'nicht-ersetzbar');
    assert.match(r.meldung, /Klärungsfall/);
  }
  assert.equal(a.auftraege.length, 0);

  const b = attrappe({ reservierung: () => ({ status: 'abgelehnt', code: 'nicht-ersetzbar' }) });
  const r2 = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', b.deps);
  assert.equal(r2.ok, false);
});

test('Eine Bestellung ohne Lieferadresse lässt sich nicht abrechnen: Anspruch frei, Fehler in der Historie', async () => {
  const a = attrappe({ order: bestellung({ shipping: undefined }) });
  const r = await ersetzeRechnung(ORDER_ID, 'RE-2026-000007', a.deps);
  assert.equal(r.ok, false);
  assert.deepEqual(a.freigaben, ['RE-2026-000007']);
  assert.equal(a.pdfs.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════
// Die Schaltfläche „Neue Rechnung erzeugen“
// ═══════════════════════════════════════════════════════════════════════

test('Nachholen: erzeugt die ausstehende Ersatzrechnung und schickt sie mit PDF-Anhang nach, wenn gewünscht', async () => {
  const a = attrappe();
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'gesendet');
  assert.match(r.meldung, /Neue Rechnung RE-2026-000099 ersetzt Rechnung RE-2026-000007/);
  assert.equal(a.mails.length, 1);
  assert.equal(a.mails[0]!.empfaenger, 'max@example.invalid');
  assert.equal(a.mails[0]!.neueNummer, 'RE-2026-000099');
  assert.equal(a.mails[0]!.alteNummer, 'RE-2026-000007');
  assert.ok(a.mails[0]!.pdf.length > 0);
  assert.deepEqual(a.ablauf.slice(-2), ['mail', 'mailprotokoll']);
});

test('Nachholen mit abgewählter Mail: Rechnung entsteht, es geht nichts raus', async () => {
  const a = attrappe();
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, false, a.deps);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.kundenmail, 'abgewaehlt');
    assert.match(r.meldung, /Download/);
  }
  assert.equal(a.mails.length, 0);
});

test('Nachholen ohne E-Mail-Adresse: Rechnung entsteht, Hinweis statt Mail', async () => {
  const a = attrappe({ order: bestellung({ contact: { name: 'Max', email: '' } }) });
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.kundenmail, 'keine-adresse');
  assert.equal(a.mails.length, 0);
});

test('Nachholen: scheitert die Mail, bleibt die Rechnung erzeugt – mit deutlichem Hinweis', async () => {
  const a = attrappe({ mail: async () => ({ success: false, error: 'abgelehnt' }) });
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.kundenmail, 'fehlgeschlagen');
    assert.match(r.meldung, /NICHT rausgegangen/);
  }
  assert.equal(a.tausche.length, 1);
  assert.equal(a.mailProtokoll.length, 1);

  const wirft = attrappe({
    mail: async () => {
      throw new Error('Netz weg');
    },
  });
  const r2 = await erzeugeErsatzrechnungNach(ORDER_ID, true, wirft.deps);
  assert.equal(r2.ok, true);
  assert.equal(wirft.mailProtokoll[0]!.status, 'rejected');
});

test('Nachholen: Steht nichts aus, wird nichts erzeugt', async () => {
  const a = attrappe({ ausstehend: null });
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, false);
  assert.deepEqual(a.ablauf, [], 'nicht einmal geladen');
});

test('Nachholen: War sie schon erzeugt (Doppelklick), keine zweite Rechnung und keine zweite Mail', async () => {
  const a = attrappe({ reservierung: () => ({ status: 'bereits-ersetzt' }) });
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.kundenmail, 'nicht-noetig');
  assert.equal(a.mails.length, 0);
  assert.equal(a.auftraege.length, 0);
});

test('Nachholen: Der Fehler eines erneuten Versuchs wird dem Betreiber gemeldet', async () => {
  const a = attrappe({
    erstelle: async () => {
      throw new Error('PDF kaputt');
    },
  });
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, false);
  assert.match(r.meldung, /PDF kaputt/);
  assert.equal(a.mails.length, 0);
});

test('Nachholen: findeAusstehend wirft → saubere Meldung', async () => {
  const a = attrappe();
  a.deps.findeAusstehend = async () => {
    throw new Error('db');
  };
  const r = await erzeugeErsatzrechnungNach(ORDER_ID, true, a.deps);
  assert.equal(r.ok, false);
});

// ═══════════════════════════════════════════════════════════════════════
// Wächter am Quelltext
// ═══════════════════════════════════════════════════════════════════════

const MODUL = readFileSync(path.join(process.cwd(), 'src', 'lib', 'orders', 'orderInvoiceReplacement.ts'), 'utf8');
const MIGRATION = readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '0039_rechnung_ersetzen.sql'), 'utf8');

function ohneKommentare(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(\/\/|--).*$/gm, '');
}

test('Wächter: Die Ersatzrechnung fasst weder Buchhaltungs-Cursor noch Zahlung, Erstattung oder Statuswechsel an', () => {
  const code = ohneKommentare(MODUL);
  for (const verboten of [/accounting_ready_at/, /refundService/, /paymentService/, /stelleErstattungSicher/, /\berstatte\s*\(/, /setzeBestellstatus/, /payment_status/]) {
    assert.doesNotMatch(code, verboten, `orderInvoiceReplacement.ts darf „${verboten}“ nicht berühren`);
  }
});

test('Wächter: Positionen, Steuer und Versand kommen aus demselben Aufbau wie die erste Rechnung', () => {
  const code = ohneKommentare(MODUL);
  assert.match(code, /baueRechnungsauftrag\(order, \{/);
  assert.match(code, /ladeBestellung: ladeBestellungFuerAbschluss/);
  for (const verboten of [/IST_KLEINUNTERNEHMER/, /steuersatzProzent/, /einzelpreisBruttoCent/]) {
    assert.doesNotMatch(code, verboten, 'keine zweite Kopie der Steuer-/Positionsregeln');
  }
});

test('Wächter: Nur der interne Anbieter darf eine Ersatzrechnung erzeugen', () => {
  assert.match(ohneKommentare(MODUL), /waehleRechnungsAnbieter\(\)\.id === 'intern'/);
});

test('Wächter: Die Datenbankfunktionen sind atomar und idempotent, nicht öffentlich und lassen den Buchhaltungs-Cursor in Ruhe', () => {
  // Ohne `--`-Kommentare und ohne `comment on …`-Metadaten (dort steht erklärt, was die Funktion NICHT tut).
  const code = ohneKommentare(MIGRATION).replace(/^comment on[\s\S]*?';$/gm, '');
  assert.match(code, /create table if not exists public\.order_invoice_history/);
  assert.match(code, /unique \(order_id, invoice_number\)/, 'pro abgelöster Rechnung höchstens eine Nachfolgerin');
  assert.match(code, /unique \(replaced_by_invoice_number\)/);
  assert.match(code, /alter table public\.order_invoice_history enable row level security/);
  assert.match(code, /public\.naechste_rechnungsnummer\(p_jahr\)/, 'die Nummer wird in derselben Transaktion gezogen');
  assert.match(code, /lpad\(public\.naechste_rechnungsnummer\(p_jahr\)::text, 6, '0'\)/, 'Format wie ziehNaechsteRechnungsnummer: RE-JJJJ-NNNNNN');
  assert.match(code, /'RE-' \|\| p_jahr::text/);
  assert.equal([...code.matchAll(/for update/gi)].length >= 3, true, 'Bestellung und Historienzeile werden gesperrt');
  for (const funktion of ['reserviere_ersatzrechnung(uuid, text, integer, date, integer)', 'gib_ersatzrechnung_frei(uuid, text)', 'ersetze_rechnung(uuid, text, text, text, text)']) {
    assert.ok(code.includes(`revoke all on function public.${funktion} from public, anon, authenticated`), `${funktion} muss gesperrt sein`);
  }
  // `accounting_ready_at` darf in SQL-Code nicht gesetzt werden (nur im Kommentar erklärt).
  assert.doesNotMatch(code, /accounting_ready_at/);
  // Nichts an Zahlung/Erstattung/Löschung.
  for (const verboten of [/refund_/, /payment_status\s*=\s*'/, /delete from/i, /drop /i]) {
    assert.doesNotMatch(code, verboten);
  }
  // Der Tausch und das Ereignis stehen in derselben Funktion.
  const tausch = code.slice(code.indexOf('function public.ersetze_rechnung'));
  assert.match(tausch, /update public\.orders/);
  assert.match(tausch, /update public\.order_invoice_history/);
  assert.match(tausch, /insert into public\.order_events/);
  assert.match(tausch, /'invoice_replaced'/);
});
