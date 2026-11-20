/**
 * Zwischenablage großer Logo-Dateien: Verweise, Teile, Zusammensetzen, Prüfung – ohne Speicher (Ein-/Ausgabe wird eingespeist).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';

import { MAX_TEILE, TEIL_MAX_BYTES, DIREKT_MAX_ZEICHEN } from '@/config/upload';
import { UPLOAD_GRENZEN } from '../pruefeUpload';
import { baueRef, istGueltigerTag, istTagFrisch, liesRef, teilPfad, tagVon } from '../zwischenablageRef';
import { loeseZwischenablageAuf, pruefeZwischenablageVerweise, speichereTeil } from '../zwischenablage';
import { teilVonDataUrl, uebertrageGrosseLogos, zerlegeDataUrl } from '../zwischenablageClient';
import type { CartItem, ConfigElement } from '@/types';

const TICKET = '3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5a6b';
const HEUTE = tagVon();

/** Ein gültiges PNG mit den angegebenen Abmessungen und ungefähr `fuellung` Bytes Inhalt (Signatur + IHDR + IDAT + IEND). */
function png(breite: number, hoehe: number, fuellung = 0): Buffer {
  const crc = Buffer.alloc(4);
  const block = (typ: string, daten: Buffer) => {
    const laenge = Buffer.alloc(4);
    laenge.writeUInt32BE(daten.length);
    return Buffer.concat([laenge, Buffer.from(typ, 'ascii'), daten, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = fuellung > 0 ? Buffer.concat([deflateSync(Buffer.from([0, 0, 0, 0])), Buffer.alloc(fuellung, 7)]) : deflateSync(Buffer.from([0, 0, 0, 0, 0]));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), block('IHDR', ihdr), block('IDAT', idat), block('IEND', Buffer.alloc(0))]);
}

function inTeile(daten: Buffer): Buffer[] {
  const teile: Buffer[] = [];
  for (let i = 0; i < daten.length; i += TEIL_MAX_BYTES) teile.push(daten.subarray(i, i + TEIL_MAX_BYTES));
  return teile;
}

function einAus(teile: Buffer[]) {
  const pfade = new Map(teile.map((t, nr) => [teilPfad({ tag: HEUTE, ticket: TICKET }, nr), t]));
  return {
    lade: async (pfad: string) => {
      const t = pfade.get(pfad);
      if (!t) throw new Error('nicht gefunden');
      return t;
    },
  };
}

// ── Verweis ──────────────────────────────────────────────────────────

test('ein Verweis wird streng gelesen und wieder gebaut', () => {
  const ref = baueRef({ tag: HEUTE, ticket: TICKET, teile: 2, bytes: TEIL_MAX_BYTES + 5 });
  assert.deepEqual(liesRef(ref), { tag: HEUTE, ticket: TICKET, teile: 2, bytes: TEIL_MAX_BYTES + 5 });
});

test('Verweise mit falscher Form, falschen Zahlen oder unpassender Größe werden abgelehnt', () => {
  const gut = { tag: HEUTE, ticket: TICKET, teile: 2, bytes: TEIL_MAX_BYTES + 5 };
  assert.equal(liesRef('staged:'), null);
  assert.equal(liesRef(`staged:${HEUTE}:${TICKET}:2`), null, 'zu wenige Felder');
  assert.equal(liesRef(baueRef({ ...gut, ticket: '../../fremd' })), null, 'kein UUID-Ticket');
  assert.equal(liesRef(baueRef({ ...gut, tag: '20260231' })), null, 'kein echtes Datum');
  assert.equal(liesRef(baueRef({ ...gut, teile: 0 })), null);
  assert.equal(liesRef(baueRef({ ...gut, teile: MAX_TEILE + 1, bytes: (MAX_TEILE + 1) * TEIL_MAX_BYTES })), null, 'zu viele Teile');
  assert.equal(liesRef(baueRef({ ...gut, bytes: 10 })), null, 'Größe passt nicht zu zwei Teilen');
  assert.equal(liesRef(baueRef({ ...gut, bytes: 3 * TEIL_MAX_BYTES })), null, 'Größe passt nicht zu zwei Teilen');
  assert.equal(liesRef(12345 as unknown), null);
  assert.equal(liesRef(`${baueRef(gut)}:extra`), null);
});

test('Tage: nur echte Daten, und nur heute oder gestern sind frisch', () => {
  assert.equal(istGueltigerTag('20260229'), false, '2026 ist kein Schaltjahr');
  assert.equal(istGueltigerTag('abcd1234'), false);
  assert.equal(istGueltigerTag('20261120'), true);
  const jetzt = new Date('2026-11-20T10:00:00Z');
  assert.equal(istTagFrisch('20261120', jetzt), true);
  assert.equal(istTagFrisch('20261119', jetzt), true);
  assert.equal(istTagFrisch('20261118', jetzt), false);
  assert.equal(istTagFrisch('20261121', jetzt), false);
});

// ── Teil speichern: Eingangsprüfung ───────────────────────────────────

test('speichereTeil weist ungültige Eingaben ab, bevor etwas gespeichert wird', async () => {
  const daten = Buffer.from('abc');
  const abgewiesen = async (e: Parameters<typeof speichereTeil>[0]) => {
    const r = await speichereTeil(e);
    assert.equal(r.ok, false);
  };
  await abgewiesen({ tag: '20200101', ticket: TICKET, nr: 0, daten });
  await abgewiesen({ tag: HEUTE, ticket: 'nicht-uuid', nr: 0, daten });
  await abgewiesen({ tag: HEUTE, ticket: TICKET, nr: -1, daten });
  await abgewiesen({ tag: HEUTE, ticket: TICKET, nr: MAX_TEILE, daten });
  await abgewiesen({ tag: HEUTE, ticket: TICKET, nr: 1.5, daten });
  await abgewiesen({ tag: HEUTE, ticket: TICKET, nr: 0, daten: Buffer.alloc(0) });
  const zuGross = await speichereTeil({ tag: HEUTE, ticket: TICKET, nr: 0, daten: Buffer.alloc(TEIL_MAX_BYTES + 1) });
  assert.deepEqual(zuGross.ok ? null : zuGross.status, 413);
});

// ── Zusammensetzen ───────────────────────────────────────────────────

test('eine große PNG-Datei wird aus ihren Teilen zusammengesetzt und vollständig geprüft', async () => {
  const datei = png(4000, 3000, 7 * 1024 * 1024); // rund 7 MB: drei Teile
  const teile = inTeile(datei);
  assert.equal(teile.length, 3);
  const ref = baueRef({ tag: HEUTE, ticket: TICKET, teile: teile.length, bytes: datei.length });
  const r = await loeseZwischenablageAuf(ref, einAus(teile));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.bytes.length, datei.length);
    assert.equal(r.breitePx, 4000);
    assert.equal(r.mime, 'image/png');
  }
});

test('ein 25-MB-Bild kommt durch (die Grenze liegt bei 45 MB)', async () => {
  const datei = png(5000, 5000, 25 * 1024 * 1024);
  const teile = inTeile(datei);
  const ref = baueRef({ tag: HEUTE, ticket: TICKET, teile: teile.length, bytes: datei.length });
  const r = await loeseZwischenablageAuf(ref, einAus(teile));
  assert.equal(r.ok, true, r.ok ? '' : r.protokoll);
});

test('ein Teil fehlt, ein Teil hat die falsche Größe, die Summe stimmt nicht: abgelehnt', async () => {
  const datei = png(100, 100, 7 * 1024 * 1024);
  const teile = inTeile(datei);
  const ref = baueRef({ tag: HEUTE, ticket: TICKET, teile: teile.length, bytes: datei.length });

  const fehlt = await loeseZwischenablageAuf(ref, einAus(teile.slice(0, 2)));
  assert.equal(fehlt.ok ? 'ok' : fehlt.grund, 'zwischenablage_unvollstaendig');

  const kurz = [teile[0]!.subarray(0, 1000), teile[1]!, teile[2]!];
  const falsch = await loeseZwischenablageAuf(ref, einAus(kurz));
  assert.equal(falsch.ok ? 'ok' : falsch.grund, 'zwischenablage_unvollstaendig');

  const andereGroesse = baueRef({ tag: HEUTE, ticket: TICKET, teile: teile.length, bytes: datei.length - 1 });
  const summe = await loeseZwischenablageAuf(andereGroesse, einAus(teile));
  assert.equal(summe.ok ? 'ok' : summe.grund, 'zwischenablage_unvollstaendig');
});

test('zusammengesetzte Daten, die kein PNG sind oder zu große Abmessungen haben, werden von pruefeBytes abgelehnt', async () => {
  const kein = Buffer.alloc(TEIL_MAX_BYTES + 10, 65);
  const refKein = baueRef({ tag: HEUTE, ticket: TICKET, teile: 2, bytes: kein.length });
  const r1 = await loeseZwischenablageAuf(refKein, einAus(inTeile(kein)));
  assert.equal(r1.ok ? 'ok' : r1.grund, 'unbekanntes_format');

  const riesig = png(UPLOAD_GRENZEN.maxBreitePx + 1, 100, 4 * 1024 * 1024);
  const refRiesig = baueRef({ tag: HEUTE, ticket: TICKET, teile: inTeile(riesig).length, bytes: riesig.length });
  const r2 = await loeseZwischenablageAuf(refRiesig, einAus(inTeile(riesig)));
  assert.equal(r2.ok ? 'ok' : r2.grund, 'zu_grosse_abmessungen');
});

test('ein ungültiger Verweis wird beim Auflösen abgelehnt, nicht ausgeführt', async () => {
  const r = await loeseZwischenablageAuf('staged:../../etc/passwd', einAus([]));
  assert.equal(r.ok ? 'ok' : r.grund, 'zwischenablage_unvollstaendig');
});

// ── Verweise einer Bestellung ────────────────────────────────────────

function position(fileUrl: string, originalFileUrl = fileUrl, typ: 'logo' | 'text' = 'logo'): CartItem {
  return {
    id: 'i1', printMethod: 'dtf', productId: 'p', colorId: 'c', sizeQuantities: { M: 1 }, quantity: 1, unitPrice: 0, totalPrice: 0, addedAt: 0,
    elements: [{ id: 'e1', type: typ, view: 'front', xCm: 0, yCm: 0, widthCm: 5, heightCm: 5, fileUrl, originalFileUrl } as unknown as ConfigElement],
  } as CartItem;
}

test('pruefeZwischenablageVerweise: gültige Verweise und Data-URLs sind in Ordnung, kaputte werden gemeldet', () => {
  const ok = baueRef({ tag: HEUTE, ticket: TICKET, teile: 2, bytes: TEIL_MAX_BYTES + 5 });
  assert.equal(pruefeZwischenablageVerweise([position(ok)]), null);
  assert.equal(pruefeZwischenablageVerweise([position('data:image/png;base64,AAAA')]), null);
  assert.ok(pruefeZwischenablageVerweise([position('staged:kaputt')]));
});

test('pruefeZwischenablageVerweise: zu viele verschiedene Dateien oder zu viele Bytes werden begrenzt', () => {
  const viele = Array.from({ length: 30 }, (_, i) =>
    position(baueRef({ tag: HEUTE, ticket: `3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5a${String(i).padStart(2, '0')}`, teile: 1, bytes: 1000 }))
  );
  assert.ok(pruefeZwischenablageVerweise(viele), 'mehr als 24 Dateien');
  const schwer = Array.from({ length: 6 }, (_, i) =>
    position(baueRef({ tag: HEUTE, ticket: `3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5b${String(i).padStart(2, '0')}`, teile: MAX_TEILE, bytes: MAX_TEILE * TEIL_MAX_BYTES }))
  );
  assert.ok(pruefeZwischenablageVerweise(schwer), 'über 200 MB insgesamt');
});

// ── Browserseite ─────────────────────────────────────────────────────

test('eine Data-URL wird in die richtigen Teile zerlegt, und die Teile ergeben die Datei zurück', () => {
  const datei = Buffer.alloc(TEIL_MAX_BYTES * 2 + 1234, 0);
  for (let i = 0; i < datei.length; i++) datei[i] = (i * 31) % 251;
  const dataUrl = `data:image/png;base64,${datei.toString('base64')}`;
  const z = zerlegeDataUrl(dataUrl)!;
  assert.equal(z.bytes, datei.length);
  const teile = [0, 1, 2].map((nr) => Buffer.from(teilVonDataUrl(dataUrl, z.base64Start, nr)));
  assert.equal(teile[0]!.length, TEIL_MAX_BYTES);
  assert.equal(teile[1]!.length, TEIL_MAX_BYTES);
  assert.equal(teile[2]!.length, 1234);
  assert.ok(Buffer.concat(teile).equals(datei));
  assert.equal(zerlegeDataUrl('kein data url'), null);
});

test('uebertrageGrosseLogos ersetzt nur große Data-URLs, lädt gleiche nur einmal hoch und verändert den Warenkorb nicht', async () => {
  const klein = 'data:image/png;base64,' + 'A'.repeat(1000);
  const gross = 'data:image/png;base64,' + 'A'.repeat(DIREKT_MAX_ZEICHEN + 10);
  const andere = 'data:image/png;base64,' + 'B'.repeat(DIREKT_MAX_ZEICHEN + 10);
  const aufrufe: string[] = [];
  const hochladen = async (url: string) => {
    aufrufe.push(url);
    return `staged:verweis-${aufrufe.length}`;
  };

  const items = [position(gross, andere), position(klein), position(gross, gross)];
  const vorher = JSON.stringify(items);
  const ergebnis = await uebertrageGrosseLogos(items, hochladen);

  assert.equal(JSON.stringify(items), vorher, 'Warenkorb bleibt unverändert');
  assert.equal(aufrufe.length, 2, 'zwei verschiedene große Dateien');
  const el = (i: number) => ergebnis[i]!.elements[0] as unknown as { fileUrl: string; originalFileUrl: string };
  assert.ok(el(0).fileUrl.startsWith('staged:') && el(0).originalFileUrl.startsWith('staged:'));
  assert.equal(el(1).fileUrl, klein, 'kleine Datei bleibt direkt');
  assert.equal(el(2).fileUrl, el(2).originalFileUrl, 'Original und Anzeigebild sind derselbe Verweis');
  assert.equal(el(2).fileUrl, el(0).fileUrl, 'dieselbe Datei in zwei Positionen: ein Upload');
});

test('Texte und Stickerei-Positionen ohne große Logos bleiben unangetastet', async () => {
  const text = position('', '', 'text');
  const ergebnis = await uebertrageGrosseLogos([text], async () => {
    throw new Error('darf nicht aufgerufen werden');
  });
  assert.equal(JSON.stringify(ergebnis), JSON.stringify([text]));
});
