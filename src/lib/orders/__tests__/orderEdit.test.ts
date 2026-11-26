/**
 * Tests der reinen Fachlogik für nachträgliche Auftragsänderungen (orderEdit.ts).
 *
 * Kein Datenbankzugriff, keine E-Mail: Die „gespeicherte Bestellung“ wird so
 * aufgebaut, wie sie auch beim echten Bestelleingang entsteht – durch
 * `priceCart` über den echten Katalog. Dadurch prüft jeder Test mit den
 * REALEN Preisregeln (Staffeln, Rundung auf ,99 €, Versandfreigrenze 75 €).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { priceCart } from '@/lib/pricing/serverPricing';
import { gespeicherterStand, HOODIE, LOGO_VORNE, TSHIRT } from './auftragFixtures';
import {
  baueEreignisDetail,
  baueEreignisGrund,
  baueKundenmailDaten,
  baueRpcNutzlast,
  berechneAenderung,
  berechneOffeneErstattungCent,
  liesAenderungen,
  pruefeAenderbarkeit,
  type Aenderung,
  type AenderungsBestellung,
  type AenderungsPlan,
  type AenderungsStand,
} from '../orderEdit';

function plan(ergebnis: Awaited<ReturnType<typeof berechneAenderung>>): AenderungsPlan {
  assert.equal(ergebnis.ok, true, ergebnis.ok ? '' : `abgelehnt: ${ergebnis.grund} – ${ergebnis.meldung}`);
  if (!ergebnis.ok) throw new Error('unerreichbar');
  return ergebnis.plan;
}

function cent(euro: number): number {
  return Math.round(euro * 100);
}

// ═══════════════════════════════════════════════════════════════════════
// Zulässigkeit des Zustands
// ═══════════════════════════════════════════════════════════════════════

test('neue, unbezahlte Rechnungskauf-Bestellung ist änderbar', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const r = pruefeAenderbarkeit(stand);
  assert.equal(r.erlaubt, true);
  assert.deepEqual(r.sperren, []);
  assert.deepEqual(r.bestaetigungen, []);
});

test('Sperrgründe: Status, Zahlung, Anfrage, laufender Lieferantenauftrag', async () => {
  const basis = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const mit = (b: Partial<AenderungsBestellung>, lieferant: string[] = []) =>
    pruefeAenderbarkeit({ ...basis, bestellung: { ...basis.bestellung, ...b }, lieferantenStatus: lieferant });

  assert.equal(mit({ status: 'in_production' }).sperren[0]?.code, 'in-produktion');
  assert.equal(mit({ status: 'shipped' }).sperren[0]?.code, 'versendet');
  assert.equal(mit({ status: 'completed' }).sperren[0]?.code, 'abgeschlossen');
  assert.equal(mit({ status: 'cancelled' }).sperren[0]?.code, 'storniert');
  assert.equal(mit({ status: 'was-neues' }).sperren[0]?.code, 'status-unbekannt');
  assert.equal(mit({ paymentStatus: 'pending' }).sperren[0]?.code, 'zahlung-offen');
  assert.equal(mit({ paymentStatus: 'failed' }).sperren[0]?.code, 'zahlung-fehlgeschlagen');
  assert.equal(mit({ paymentStatus: 'refunded' }).sperren[0]?.code, 'zahlungsstatus-unbekannt');
  assert.equal(mit({ orderType: 'inquiry' }).sperren[0]?.code, 'keine-bestellung');
  assert.equal(mit({}, ['processing']).sperren[0]?.code, 'lieferant-laeuft');

  for (const status of ['in_production', 'shipped', 'completed', 'cancelled']) {
    assert.equal(mit({ status }).erlaubt, false, `Status ${status} darf nicht änderbar sein`);
  }
});

test('bezahlte Bestellung ist änderbar (die Erstattung kommt erst mit dem Preis dazu)', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }], {
    paymentStatus: 'paid',
    paymentMethod: 'card',
  });
  assert.equal(pruefeAenderbarkeit(stand).erlaubt, true);
});

test('vorhandene Rechnung und bestellte Ware verlangen ausdrückliche Bestätigungen', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }],
    { invoiceNumber: 'RE-2026-000007' },
    ['ordered']
  );
  const r = pruefeAenderbarkeit(stand);
  assert.equal(r.erlaubt, true, 'bestellte Ware und Rechnung sperren nicht, sie müssen bestätigt werden');
  assert.deepEqual(r.bestaetigungen.sort(), ['rechnung-korrektur', 'ware-bereits-bestellt']);
  assert.match(r.hinweise.join(' '), /RE-2026-000007/);
  assert.match(r.hinweise.join(' '), /NICHT automatisch korrigiert/);

  // Auch ein nur befüllter Warenkorb beim Lieferanten zählt.
  const warenkorb = pruefeAenderbarkeit({ ...stand, lieferantenStatus: ['cart_prepared'] });
  assert.ok(warenkorb.bestaetigungen.includes('ware-bereits-bestellt'));
  // Entwurf/eingereiht: Es wurde noch nichts bestellt.
  for (const status of ['draft', 'queued', 'cancelled']) {
    assert.ok(!pruefeAenderbarkeit({ ...stand, lieferantenStatus: [status] }).bestaetigungen.includes('ware-bereits-bestellt'));
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Eingabe aus dem Browser
// ═══════════════════════════════════════════════════════════════════════

test('liesAenderungen nimmt gültige Änderungen an', () => {
  const r = liesAenderungen([
    { art: 'entfernen', positionId: 'a' },
    { art: 'verringern', positionId: 'b', neueMengen: { L: 1, M: 0 } },
  ]);
  assert.deepEqual(r, {
    ok: true,
    aenderungen: [
      { art: 'entfernen', positionId: 'a' },
      { art: 'verringern', positionId: 'b', neueMengen: { L: 1, M: 0 } },
    ],
  });
});

test('liesAenderungen weist Unbrauchbares ab, statt es zu übernehmen', () => {
  const abgelehnt = (x: unknown) => assert.equal(liesAenderungen(x).ok, false, JSON.stringify(x));
  abgelehnt(undefined);
  abgelehnt([]);
  abgelehnt('x');
  abgelehnt([null]);
  abgelehnt([{ art: 'hinzufuegen', positionId: 'a' }]);
  abgelehnt([{ art: 'entfernen' }]);
  abgelehnt([{ art: 'entfernen', positionId: 5 }]);
  abgelehnt([{ art: 'entfernen', positionId: 'x'.repeat(65) }]);
  abgelehnt([{ art: 'verringern', positionId: 'a' }]);
  abgelehnt([{ art: 'verringern', positionId: 'a', neueMengen: [1] }]);
  abgelehnt([{ art: 'verringern', positionId: 'a', neueMengen: { L: -1 } }]);
  abgelehnt([{ art: 'verringern', positionId: 'a', neueMengen: { L: 1.5 } }]);
  abgelehnt([{ art: 'verringern', positionId: 'a', neueMengen: { L: '1' } }]);
  abgelehnt([{ art: 'verringern', positionId: 'a', neueMengen: { [`${'G'.repeat(21)}`]: 1 } }]);
  abgelehnt(Array.from({ length: 51 }, (_, i) => ({ art: 'entfernen', positionId: `p${i}` })));
});

// ═══════════════════════════════════════════════════════════════════════
// Die Rechenfälle
// ═══════════════════════════════════════════════════════════════════════

test('2 Hoodies → 1: neuer Preis aus der Preisberechnung, Versand kommt unter der Freigrenze dazu', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));

  // Erwartung unabhängig mit derselben Preisberechnung nachgerechnet.
  const einzeln = await priceCart(
    [
      {
        id: 'x',
        printMethod: 'dtf',
        productId: HOODIE,
        colorId: stand.positionen[0]!.colorId,
        sizeQuantities: { L: 1 },
        quantity: 1,
        elements: [{ ...LOGO_VORNE, id: 'e', rotationDeg: 0, isOutOfBounds: false, extraPrice: 0, estimatedStitches: 0, name: '', locked: false, hidden: false, fileUrl: '', fileName: '', originalWidthPx: 0, originalHeightPx: 0, originalFileUrl: '', backgroundRemoved: false, contentFillRatio: 0.85 } as never],
        unitPrice: 0,
        totalPrice: 0,
        addedAt: 0,
      },
    ],
    'Deutschland'
  );

  assert.equal(p.alt.gesamtCent, cent(stand.bestellung.totalPrice));
  assert.equal(p.alt.versandCent, 0, 'zwei Hoodies liegen über der Freigrenze von 75 €');
  assert.equal(p.neu.gesamtCent, cent(einzeln.totalPrice));
  assert.equal(p.neu.versandCent, 690, 'ein Hoodie liegt unter 75 € – Versand 6,90 € kommt dazu');
  assert.equal(p.neu.warenwertCent, cent(einzeln.subtotal));
  assert.equal(p.differenzCent, p.alt.gesamtCent - p.neu.gesamtCent);
  assert.ok(p.differenzCent > 0);

  assert.equal(p.positionen.length, 1);
  assert.equal(p.positionen[0]!.aktion, 'verringert');
  assert.deepEqual(p.positionen[0]!.neu?.sizeQuantities, { L: 1 });
  assert.equal(p.positionen[0]!.neu?.menge, 1);

  assert.equal(p.schreibungen.length, 1);
  const s = p.schreibungen[0]!;
  assert.equal(s.aktion, 'aendern');
  if (s.aktion === 'aendern') {
    assert.deepEqual(s.sizeQuantities, { L: 1 });
    assert.equal(s.quantity, 1);
    assert.equal(s.totalPrice, einzeln.items[0]!.totalPrice);
    assert.equal(s.unitPrice, einzeln.items[0]!.unitPrice);
    assert.equal(s.netTotalPrice, s.totalPrice, 'Kleinunternehmer (Steuersatz 0): netto = brutto');
  }
  assert.equal(p.bestellungNeu.quantity, 1);
  assert.equal(p.bestellungNeu.totalPrice, einzeln.totalPrice);

  assert.equal(p.aenderungszeilen.length, 1);
  assert.match(p.aenderungszeilen[0]!, /^1 × .+ · .+ entfernt \(L: 2 → 1; jetzt 1 statt 2 Stück\)$/);
});

test('eine von zwei Positionen entfernen', async () => {
  const stand = await gespeicherterStand([
    { id: 'hoodie', productId: HOODIE, sizeQuantities: { L: 2 } },
    { id: 'shirt', productId: TSHIRT, sizeQuantities: { M: 1 } },
  ]);
  const p = plan(await berechneAenderung(stand, [{ art: 'entfernen', positionId: 'shirt' }]));

  assert.deepEqual(
    p.positionen.map((x) => [x.id, x.aktion]),
    [
      ['hoodie', 'unveraendert'],
      ['shirt', 'entfernt'],
    ]
  );
  assert.deepEqual(p.schreibungen, [{ id: 'shirt', aktion: 'entfernen' }]);
  assert.equal(p.neu.menge, 2);
  // Der Hoodie-Anteil bleibt, wie er war: Er wird nicht neu geschrieben.
  assert.equal(p.neu.warenwertCent, cent(stand.positionen[0]!.totalPrice));
  assert.equal(p.neu.versandCent, 0, 'der Hoodie allein liegt weiter über der Freigrenze');
  assert.match(p.aenderungszeilen[0]!, /komplett entfernt/);
  assert.deepEqual(p.positionen[1]!.verwaisteDateien, LOGO_VORNE.logoPfade);
  assert.deepEqual(p.verbleibendePositionen, [
    { productId: HOODIE, colorId: stand.positionen[0]!.colorId, sizeQuantities: { L: 2 } },
  ]);
});

test('Entfernen und Verringern in einer Änderung', async () => {
  const stand = await gespeicherterStand([
    { id: 'hoodie', productId: HOODIE, sizeQuantities: { L: 3 } },
    { id: 'shirt', productId: TSHIRT, sizeQuantities: { M: 1 } },
  ]);
  const p = plan(
    await berechneAenderung(stand, [
      { art: 'entfernen', positionId: 'shirt' },
      { art: 'verringern', positionId: 'hoodie', neueMengen: { L: 2 } },
    ])
  );
  assert.equal(p.aenderungszeilen.length, 2);
  assert.equal(p.schreibungen.length, 2);
  assert.equal(p.neu.menge, 2);
});

test('mehrere Größen: nur geänderte Größen stehen in der Beschreibung, fehlende bleiben unverändert', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: TSHIRT, sizeQuantities: { M: 4, L: 3, XL: 3 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));
  assert.deepEqual(p.positionen[0]!.neu?.sizeQuantities, { M: 4, L: 1, XL: 3 });
  assert.match(p.aenderungszeilen[0]!, /2 × .* entfernt \(L: 3 → 1; jetzt 8 statt 10 Stück\)/);
});

test('eine Größe auf 0 setzen lässt sie entfallen', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: TSHIRT, sizeQuantities: { M: 4, L: 3 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 0 } }]));
  const s = p.schreibungen[0]!;
  assert.equal(s.aktion, 'aendern');
  if (s.aktion === 'aendern') assert.deepEqual(s.sizeQuantities, { M: 4 }, 'keine Null-Größe in der Datenbank');
});

test('Versandkostenfreigrenze: bleibt der Warenwert darüber, bleibt der Versand frei', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: TSHIRT, sizeQuantities: { M: 10 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { M: 5 } }]));
  assert.equal(p.alt.versandCent, 0);
  assert.equal(p.neu.versandCent, 0, '5 T-Shirts kosten noch immer mehr als 75 €');
  assert.equal(p.neu.gesamtCent, p.neu.warenwertCent);
});

// ═══════════════════════════════════════════════════════════════════════
// Steuer
// ═══════════════════════════════════════════════════════════════════════

test('Steuer: der Satz vom Kaufzeitpunkt bleibt, Betrag und Netto werden aus der neuen Summe abgeleitet', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 3 } }],
    { taxRate: 19 }
  );
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 2 } }]));
  const brutto = p.bestellungNeu.totalPrice;
  const erwartetSteuer = Math.round((brutto - brutto / 1.19) * 100) / 100;
  assert.equal(p.bestellungNeu.taxAmount, erwartetSteuer);
  assert.equal(p.bestellungNeu.netTotal, Math.round((brutto - erwartetSteuer) * 100) / 100);
  const s = p.schreibungen[0]!;
  if (s.aktion === 'aendern') {
    assert.equal(s.netTotalPrice, Math.round((s.totalPrice / 1.19) * 100) / 100);
  }
});

test('Steuer: Bestellungen ohne gespeicherte Steuerfelder (vor Migration 0014) bleiben ohne', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 3 } }],
    { taxRate: null }
  );
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 2 } }]));
  assert.equal(p.bestellungNeu.taxAmount, null);
  assert.equal(p.bestellungNeu.netTotal, null);
  const s = p.schreibungen[0]!;
  if (s.aktion === 'aendern') assert.equal(s.netTotalPrice, null);
});

// ═══════════════════════════════════════════════════════════════════════
// Bezahlt / Rechnung
// ═══════════════════════════════════════════════════════════════════════

test('bezahlte Bestellung: Differenz muss erstattet werden – festgehalten, nicht automatisch erstattet', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }],
    { paymentStatus: 'paid', paymentMethod: 'card' }
  );
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));
  assert.equal(p.erstattungNoetigCent, p.differenzCent);
  assert.ok(p.erstattungNoetigCent > 0);
  assert.ok(p.bestaetigungen.includes('erstattung-manuell'));
  assert.equal(p.hinweise.length, 0, 'der Erstattungshinweis hängt an erstattungNoetigCent, nicht an einem Text');
});

test('Rechnungskauf: nichts zu erstatten, keine Erstattungs-Bestätigung', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));
  assert.equal(p.erstattungNoetigCent, 0);
  assert.ok(!p.bestaetigungen.includes('erstattung-manuell'));
});

test('vorhandene Rechnung: Korrektur nötig, Bestätigung verlangt', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }],
    { invoiceNumber: 'RE-2026-000042' }
  );
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));
  assert.equal(p.rechnungKorrekturNoetig, true);
  assert.ok(p.bestaetigungen.includes('rechnung-korrektur'));
});

// ═══════════════════════════════════════════════════════════════════════
// Ablehnungen
// ═══════════════════════════════════════════════════════════════════════

async function abgelehnt(stand: AenderungsStand, aenderungen: Aenderung[]) {
  const r = await berechneAenderung(stand, aenderungen);
  assert.equal(r.ok, false, 'hätte abgelehnt werden müssen');
  if (r.ok) throw new Error('unerreichbar');
  return r;
}

test('unzulässiger Zustand wird vor jeder Rechnung abgelehnt', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }], {
    status: 'in_production',
  });
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]);
  assert.equal(r.grund, 'in-produktion');
});

test('keine Änderung / unbekannte Position / doppelte Position', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }, { id: 'p2', productId: TSHIRT, sizeQuantities: { M: 1 } }]);
  assert.equal((await abgelehnt(stand, [])).grund, 'keine-aenderung');
  assert.equal((await abgelehnt(stand, [{ art: 'entfernen', positionId: 'gibt-es-nicht' }])).grund, 'position-unbekannt');
  assert.equal(
    (await abgelehnt(stand, [{ art: 'entfernen', positionId: 'p2' }, { art: 'verringern', positionId: 'p2', neueMengen: { M: 0 } }])).grund,
    'ungueltige-aenderung'
  );
  assert.equal(
    (await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 2 } }])).grund,
    'keine-aenderung',
    'gleiche Menge ist keine Verringerung'
  );
});

test('Erhöhen und Größen hinzufügen sind nicht möglich', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const mehr = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 3 } }]);
  assert.equal(mehr.grund, 'ungueltige-aenderung');
  assert.match(mehr.meldung, /nur verringern/);
  const neueGroesse = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1, XL: 1 } }]);
  assert.equal(neueGroesse.grund, 'ungueltige-aenderung');
  assert.match(neueGroesse.meldung, /hinzufügen/);
});

test('alle Größen auf 0 ist „Position entfernen“, nicht Verringern', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }, { id: 'p2', productId: TSHIRT, sizeQuantities: { M: 1 } }]);
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 0 } }]);
  assert.equal(r.grund, 'menge-null');
});

test('mindestens eine Position muss bleiben', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }, { id: 'p2', productId: TSHIRT, sizeQuantities: { M: 1 } }]);
  const r = await abgelehnt(stand, [
    { art: 'entfernen', positionId: 'p1' },
    { art: 'entfernen', positionId: 'p2' },
  ]);
  assert.equal(r.grund, 'letzte-position');
  assert.match(r.meldung, /Stornierung/);
  const einzige = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  assert.equal((await abgelehnt(einzige, [{ art: 'entfernen', positionId: 'p1' }])).grund, 'letzte-position');
});

test('Stickerei wird nicht neu berechnet (Stichzahl ist nicht gespeichert)', async () => {
  const stand = await gespeicherterStand(
    [
      { id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } },
      { id: 'p2', productId: TSHIRT, sizeQuantities: { M: 1 } },
    ]
  );
  stand.positionen[1] = { ...stand.positionen[1]!, printMethod: 'embroidery' };
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]);
  assert.equal(r.grund, 'stickerei-nicht-berechenbar');
});

test('Gegenprobe: weicht der gespeicherte Preis von der heutigen Berechnung ab, wird NICHT geändert', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  // Ein Katalogpreis hat sich seit der Bestellung geändert: gespeichert war 1 € mehr.
  stand.positionen[0] = { ...stand.positionen[0]!, totalPrice: stand.positionen[0]!.totalPrice + 1 };
  stand.bestellung = { ...stand.bestellung, totalPrice: stand.bestellung.totalPrice + 1 };
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]);
  assert.equal(r.grund, 'preis-abweichung');
  assert.ok((r.details ?? []).length >= 2, 'Position und Gesamtsumme werden einzeln benannt');
  assert.match((r.details ?? []).join('\n'), /gespeichert/);
});

test('Gegenprobe: eine abweichende Endsumme allein (z. B. anderer Versandanteil) genügt zur Ablehnung', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  stand.bestellung = { ...stand.bestellung, totalPrice: stand.bestellung.totalPrice + 6.9 };
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]);
  assert.equal(r.grund, 'preis-abweichung');
  assert.match((r.details ?? []).join('\n'), /Gesamtsumme/);
});

test('unbekanntes Produkt und fehlender Versandtarif werden abgelehnt', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }, { id: 'p2', productId: TSHIRT, sizeQuantities: { M: 1 } }]);
  const unbekannt: AenderungsStand = {
    ...stand,
    positionen: [stand.positionen[0]!, { ...stand.positionen[1]!, productId: 'gibt-es-nicht' }],
  };
  assert.equal((await abgelehnt(unbekannt, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }])).grund, 'produkt-unbekannt');

  const ausland: AenderungsStand = { ...stand, bestellung: { ...stand.bestellung, shippingCountry: 'Schweiz' } };
  assert.equal((await abgelehnt(ausland, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }])).grund, 'versandland');

  const ohneLand: AenderungsStand = { ...stand, bestellung: { ...stand.bestellung, shippingCountry: null } };
  assert.equal((await abgelehnt(ohneLand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }])).grund, 'versandland');
});

test('der Preis darf durch eine Verringerung nicht steigen (Staffelsprung bei 20 Stück)', async () => {
  // Echter Fall im Katalog: 20 Fruit-of-the-Loom-T-Shirts sind durch die Staffel BILLIGER als 19.
  const stand = await gespeicherterStand([{ id: 'p1', productId: 'fotl-heavy-t', sizeQuantities: { M: 20 } }]);
  const r = await abgelehnt(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { M: 19 } }]);
  assert.equal(r.grund, 'preis-steigt');
  assert.match(r.meldung, /ERHÖHEN/);
  assert.match(r.meldung, /Zustimmung/);
  // Mit einer größeren Verringerung wird es wieder billiger – dann ist die Änderung zulässig.
  const ok = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { M: 10 } }]));
  assert.ok(ok.differenzCent > 0);
});

test('Plan-Invarianten: Differenz nie negativ, Summen geschlossen', async () => {
  const stand = await gespeicherterStand([
    { id: 'a', productId: HOODIE, sizeQuantities: { L: 4 } },
    { id: 'b', productId: TSHIRT, sizeQuantities: { M: 6 } },
  ]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'a', neueMengen: { L: 1 } }]));
  assert.ok(p.differenzCent >= 0);
  assert.equal(p.neu.gesamtCent, p.neu.warenwertCent + p.neu.versandCent);
  assert.equal(p.alt.gesamtCent, p.alt.warenwertCent + p.alt.versandCent);
  const summePositionen = p.positionen.reduce((s, x) => s + (x.neu?.gesamtCent ?? 0), 0);
  assert.equal(summePositionen, p.neu.warenwertCent, 'die Positionspreise ergeben den neuen Warenwert');
});

// ═══════════════════════════════════════════════════════════════════════
// Datenbankübergabe, Protokoll, Mail
// ═══════════════════════════════════════════════════════════════════════

test('RPC-Nutzlast: Zustand, neue Werte und Änderungen in Spaltennamen, Beträge in Euro', async () => {
  const stand = await gespeicherterStand([
    { id: 'a', productId: HOODIE, sizeQuantities: { L: 2 } },
    { id: 'b', productId: TSHIRT, sizeQuantities: { M: 1 } },
  ]);
  const p = plan(
    await berechneAenderung(stand, [
      { art: 'entfernen', positionId: 'b' },
      { art: 'verringern', positionId: 'a', neueMengen: { L: 1 } },
    ])
  );
  const nutzlast = baueRpcNutzlast(p, { reason: 'Grund', detail: { x: 1 } }) as {
    stand: { status: string; payment_status: string; total_price: number; positionen: { id: string; total_price: number; size_quantities: unknown }[] };
    bestellung: { quantity: number; total_price: number };
    aenderungen: Array<Record<string, unknown>>;
    ereignis: { reason: string };
  };

  assert.equal(nutzlast.stand.status, 'new');
  assert.equal(nutzlast.stand.payment_status, 'not_required');
  assert.equal(nutzlast.stand.total_price, stand.bestellung.totalPrice);
  assert.deepEqual(
    nutzlast.stand.positionen.map((x) => x.id),
    ['a', 'b'],
    'der Zustand umfasst ALLE Positionen, damit eine zwischenzeitlich hinzugekommene auffällt'
  );
  assert.equal(nutzlast.bestellung.total_price, p.bestellungNeu.totalPrice);
  assert.equal(nutzlast.bestellung.quantity, 1);
  const entfernt = nutzlast.aenderungen.find((x) => x.id === 'b');
  const geaendert = nutzlast.aenderungen.find((x) => x.id === 'a');
  assert.deepEqual(entfernt, { id: 'b', aktion: 'entfernen' });
  assert.equal(geaendert?.aktion, 'aendern');
  assert.deepEqual(geaendert?.size_quantities, { L: 1 });
  assert.equal(nutzlast.ereignis.reason, 'Grund');
  // Beträge sind auf Cent gerundete Euro-Zahlen (keine Gleitkomma-Reste).
  for (const wert of [nutzlast.bestellung.total_price, geaendert?.total_price as number]) {
    assert.equal(Number(wert.toFixed(2)), wert);
  }
});

test('Ereignis: Grund und Detail enthalten Alt/Neu, Differenz, Rechnungs- und Erstattungsstand', async () => {
  const stand = await gespeicherterStand(
    [{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }],
    { paymentStatus: 'paid', paymentMethod: 'card', invoiceNumber: 'RE-2026-000001' }
  );
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));
  const detail = baueEreignisDetail(p, {
    begruendung: 'Kunde hat per Mail angerufen',
    zahlungsstatus: 'paid',
    rechnungsnummer: 'RE-2026-000001',
    kundenmail: 'geplant',
  });
  assert.equal(detail.quelle, 'admin');
  assert.equal(detail.differenzCent, p.differenzCent);
  assert.equal(detail.erstattungNoetigCent, p.differenzCent);
  assert.equal(detail.rechnungKorrekturNoetig, true);
  assert.equal(detail.rechnungsnummer, 'RE-2026-000001');
  assert.deepEqual((detail.alt as { gesamtCent: number }).gesamtCent, p.alt.gesamtCent);
  assert.equal((detail.positionen as unknown[]).length, 1, 'unveränderte Positionen stehen nicht im Protokoll');

  const grund = baueEreignisGrund(p, 'Kundenwunsch');
  assert.match(grund, /Auftrag durch den Betreiber geändert/);
  assert.match(grund, /Kundenwunsch/);
  assert.match(grund, /Summe .* → /);
});

test('Kundenmail-Daten: Rechnungshinweis richtet sich nach dem, was der Code tatsächlich tut', async () => {
  const stand = await gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }]);
  const p = plan(await berechneAenderung(stand, [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }]));

  const ohneRechnung = baueKundenmailDaten(p, { orderNumber: 'ER-1', paymentStatus: 'not_required', invoiceNumber: null });
  assert.deepEqual(ohneRechnung.rechnung, { art: 'entsteht' });
  assert.equal(ohneRechnung.zahlung, 'rechnung');

  const mitRechnung = baueKundenmailDaten(p, { orderNumber: 'ER-1', paymentStatus: 'paid', invoiceNumber: 'RE-2026-000009' }, 'https://x.invalid/b');
  assert.deepEqual(mitRechnung.rechnung, { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000009' });
  assert.equal(mitRechnung.zahlung, 'bezahlt');
  assert.equal(mitRechnung.bestellansichtUrl, 'https://x.invalid/b');
  assert.equal(mitRechnung.altGesamtCent, p.alt.gesamtCent);
  assert.equal(mitRechnung.neuGesamtCent, p.neu.gesamtCent);
  assert.deepEqual(mitRechnung.aenderungen, p.aenderungszeilen);
});

// ═══════════════════════════════════════════════════════════════════════
// Offene Erstattung aus der Historie
// ═══════════════════════════════════════════════════════════════════════

test('offene Erstattung: Summe der Änderungs-Ereignisse minus vermerkte Erstattungen', () => {
  const e = (eventType: string, detail: Record<string, unknown> | null) => ({ eventType, detail });
  assert.equal(berechneOffeneErstattungCent([]), 0);
  assert.equal(berechneOffeneErstattungCent([e('order_items_edited', { erstattungNoetigCent: 3109 })]), 3109);
  assert.equal(
    berechneOffeneErstattungCent([
      e('order_items_edited', { erstattungNoetigCent: 3109 }),
      e('order_items_edited', { erstattungNoetigCent: 500 }),
    ]),
    3609
  );
  assert.equal(
    berechneOffeneErstattungCent([
      e('order_items_edited', { erstattungNoetigCent: 3109 }),
      e('manual_refund_noted', { betragCent: 3109 }),
    ]),
    0
  );
  assert.equal(
    berechneOffeneErstattungCent([
      e('order_items_edited', { erstattungNoetigCent: 3109 }),
      e('manual_refund_noted', { betragCent: 1000 }),
    ]),
    2109
  );
  // Rechnungskauf-Änderungen tragen 0 – nichts offen. Unbrauchbare Werte zählen nicht.
  assert.equal(berechneOffeneErstattungCent([e('order_items_edited', { erstattungNoetigCent: 0 }), e('order_items_edited', null)]), 0);
  assert.equal(berechneOffeneErstattungCent([e('order_items_edited', { erstattungNoetigCent: 'viel' })]), 0);
  assert.equal(berechneOffeneErstattungCent([e('manual_refund_noted', { betragCent: 99999 })]), 0, 'nie negativ');
  assert.equal(berechneOffeneErstattungCent([e('status_changed', { erstattungNoetigCent: 5000 })]), 0, 'fremde Ereignisse zählen nicht');
});
