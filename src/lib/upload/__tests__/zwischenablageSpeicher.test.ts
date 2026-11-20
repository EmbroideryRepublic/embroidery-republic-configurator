/**
 * Zwischenablage mit der ECHTEN Speicherschicht im Testmodus (lokale Ablage statt Supabase): Teile hochladen, zusammensetzen, löschen,
 * aufräumen. Ergänzt zwischenablage.test.ts, das die Ein-/Ausgabe einspeist.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import nodePath from 'node:path';
import { deflateSync } from 'node:zlib';

import { TEIL_MAX_BYTES } from '@/config/upload';
import { baueRef, tagVon, teilPfad } from '../zwischenablageRef';
import { loeseZwischenablageAuf, loescheAlteZwischenablage, speichereTeil, verwerfeZwischenablage } from '../zwischenablage';
import { listProductionFileInfo } from '@/lib/supabase/storage';

const TICKET = 'a1b2c3d4-0000-4000-8000-00000000abcd';
const ALT_TICKET = 'a1b2c3d4-0000-4000-8000-00000000dead';
const ORDNER = nodePath.join(process.cwd(), '.testablage', 'production-files', 'staging');
let vorher: string | undefined;

before(() => {
  vorher = process.env.E2E_TESTMODUS;
  process.env.E2E_TESTMODUS = 'aktiv';
});
after(async () => {
  if (vorher === undefined) delete process.env.E2E_TESTMODUS;
  else process.env.E2E_TESTMODUS = vorher;
  await rm(ORDNER, { recursive: true, force: true });
});

function png(breite: number, hoehe: number, fuellung: number): Buffer {
  const block = (typ: string, daten: Buffer) => {
    const laenge = Buffer.alloc(4);
    laenge.writeUInt32BE(daten.length);
    return Buffer.concat([laenge, Buffer.from(typ, 'ascii'), daten, Buffer.alloc(4)]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', Buffer.concat([deflateSync(Buffer.from([0, 0, 0, 0])), Buffer.alloc(fuellung, 9)])),
    block('IEND', Buffer.alloc(0)),
  ]);
}

test('Teile hochladen, zusammensetzen, löschen – mit der echten Speicherschicht', async () => {
  const tag = tagVon();
  const datei = png(3000, 2000, 8 * 1024 * 1024);
  const teile = Math.ceil(datei.length / TEIL_MAX_BYTES);
  for (let nr = 0; nr < teile; nr++) {
    const r = await speichereTeil({ tag, ticket: TICKET, nr, daten: datei.subarray(nr * TEIL_MAX_BYTES, (nr + 1) * TEIL_MAX_BYTES) });
    assert.equal(r.ok, true);
  }
  const ordner = `staging/${tag}/${TICKET}`;
  assert.equal((await listProductionFileInfo(ordner)).size, teile, 'alle Teile liegen im Zwischenspeicher');
  assert.ok(teilPfad({ tag, ticket: TICKET }, 0).startsWith(ordner));

  const ref = baueRef({ tag, ticket: TICKET, teile, bytes: datei.length });
  const r = await loeseZwischenablageAuf(ref);
  assert.equal(r.ok, true, r.ok ? '' : r.protokoll);
  if (r.ok) assert.ok(r.bytes.equals(datei), 'zusammengesetzte Datei ist byte-gleich');

  await verwerfeZwischenablage(ref);
  assert.equal((await listProductionFileInfo(ordner)).size, 0, 'nach dem Verwerfen ist nichts mehr da');
});

test('die Wartung räumt alte Tagesordner auf und lässt frische stehen', async () => {
  const heute = tagVon();
  const alt = tagVon(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
  // Einen alten Tag kann speichereTeil absichtlich nicht anlegen (nur heute/gestern) – er entsteht hier über einen früheren Zeitpunkt.
  const frueher = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const abgelegt = await speichereTeil({ tag: alt, ticket: ALT_TICKET, nr: 0, daten: Buffer.from('alt') }, frueher);
  assert.equal(abgelegt.ok, true);
  const frisch = await speichereTeil({ tag: heute, ticket: TICKET, nr: 0, daten: Buffer.from('frisch') });
  assert.equal(frisch.ok, true);

  const geleert = await loescheAlteZwischenablage();
  assert.ok(geleert >= 1);
  assert.equal((await listProductionFileInfo(`staging/${alt}/${ALT_TICKET}`)).size, 0, 'alter Ordner ist leer');
  assert.equal((await listProductionFileInfo(`staging/${heute}/${TICKET}`)).size, 1, 'frischer Ordner bleibt');
});
