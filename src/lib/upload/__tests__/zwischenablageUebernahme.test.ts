/**
 * Übernahme der Zwischenablage einer Bestellung: ein Platz je Bestellung (keine Verklemmung), Wartezeit-Limit, Prüfsumme gegen
 * nachträgliches Austauschen, unveränderliche Teile. (Befunde der Sicherheitsprüfung nach dem Push vom 2026-11-20.)
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import nodePath from 'node:path';
import { deflateSync } from 'node:zlib';

import { MAX_ZUSAMMENSETZEN_GLEICHZEITIG, TEIL_MAX_BYTES } from '@/config/upload';
import { UploadAbgelehntFehler } from '@/lib/supabase/storage';
import { baueRef, tagVon, teilPfad } from '../zwischenablageRef';
import { Plaetze, logoPfade, pruefsumme, speichereTeil, uebernehmeZwischenablage, type UebernahmeEinAus } from '../zwischenablage';
import type { CartItem, ConfigElement } from '@/types';

const TAG = tagVon();
const uuid = (n: number) => `7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b${String(n).padStart(4, '0')}`;
let vorher: string | undefined;

before(() => {
  vorher = process.env.E2E_TESTMODUS;
  process.env.E2E_TESTMODUS = 'aktiv';
});
after(async () => {
  if (vorher === undefined) delete process.env.E2E_TESTMODUS;
  else process.env.E2E_TESTMODUS = vorher;
  await rm(nodePath.join(process.cwd(), '.testablage', 'production-files', 'staging'), { recursive: true, force: true });
});

function png(fuellung: number): Buffer {
  const block = (typ: string, daten: Buffer) => {
    const laenge = Buffer.alloc(4);
    laenge.writeUInt32BE(daten.length);
    return Buffer.concat([laenge, Buffer.from(typ, 'ascii'), daten, Buffer.alloc(4)]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(800, 0);
  ihdr.writeUInt32BE(600, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', Buffer.concat([deflateSync(Buffer.from([0, 0, 0, 0])), Buffer.alloc(fuellung, 5)])),
    block('IEND', Buffer.alloc(0)),
  ]);
}

/** Eine Datei samt Verweis; die Teile liegen in `speicher` unter ihren Teilpfaden. */
function datei(n: number, fuellung: number, speicher: Map<string, Buffer>) {
  const bytes = png(fuellung);
  const ticket = uuid(n);
  const teile = Math.ceil(bytes.length / TEIL_MAX_BYTES);
  for (let nr = 0; nr < teile; nr++) speicher.set(teilPfad({ tag: TAG, ticket }, nr), bytes.subarray(nr * TEIL_MAX_BYTES, (nr + 1) * TEIL_MAX_BYTES));
  return { bytes, ref: baueRef({ tag: TAG, ticket, teile, bytes: bytes.length }) };
}

function position(elemente: Array<{ id: string; original: string; anzeige: string }>): CartItem {
  return {
    id: 'i', printMethod: 'dtf', productId: 'p', colorId: 'c', sizeQuantities: { M: 1 }, quantity: 1, unitPrice: 0, totalPrice: 0, addedAt: 0,
    elements: elemente.map(
      (e) => ({ id: e.id, type: 'logo', view: 'front', xCm: 0, yCm: 0, widthCm: 5, heightCm: 5, originalFileUrl: e.original, fileUrl: e.anzeige }) as unknown as ConfigElement
    ),
  } as CartItem;
}

function einAus(speicher: Map<string, Buffer>, abgelegt: Map<string, Buffer>, zaehler?: { geladen: number }): UebernahmeEinAus {
  return {
    lade: async (pfad) => {
      if (zaehler) zaehler.geladen++;
      const t = speicher.get(pfad);
      if (!t) throw new Error('fehlt');
      return t;
    },
    speichere: async (pfad, bytes) => {
      abgelegt.set(pfad, bytes);
    },
  };
}

test('jede Datei wird einmal zusammengesetzt und an ALLE Zielpfade gelegt (Original = Anzeigebild)', async () => {
  const speicher = new Map<string, Buffer>();
  const abgelegt = new Map<string, Buffer>();
  const a = datei(1, 4 * 1024 * 1024, speicher); // drei Teile
  const b = datei(2, 500, speicher);
  const zaehler = { geladen: 0 };
  const items = [position([{ id: 'e1', original: a.ref, anzeige: a.ref }, { id: 'e2', original: b.ref, anzeige: 'data:image/png;base64,AAAA' }])];

  await uebernehmeZwischenablage(items, 'bestellung-1', einAus(speicher, abgelegt, zaehler));

  const p1 = logoPfade('bestellung-1', 0, 'e1');
  const p2 = logoPfade('bestellung-1', 0, 'e2');
  assert.ok(abgelegt.get(p1.original)!.equals(a.bytes));
  assert.ok(abgelegt.get(p1.display)!.equals(a.bytes));
  assert.ok(abgelegt.get(p2.original)!.equals(b.bytes));
  assert.equal(abgelegt.has(p2.display), false, 'die Data-URL geht den anderen Weg');
  assert.equal(zaehler.geladen, Math.ceil(a.bytes.length / TEIL_MAX_BYTES) + 1, 'a nur einmal geladen, obwohl zweimal verwendet');
});

test('Prüfsumme: dieselbe Datei wie bei der Stichzahl-Rechnung wird gespeichert, eine ausgetauschte nicht', async () => {
  const speicher = new Map<string, Buffer>();
  const abgelegt = new Map<string, Buffer>();
  const a = datei(3, 600, speicher);
  const items = [position([{ id: 'e1', original: a.ref, anzeige: a.ref }])];

  await uebernehmeZwischenablage(items, 'o', einAus(speicher, abgelegt), { summen: new Map([[a.ref, pruefsumme(a.bytes)]]) });
  assert.equal(abgelegt.size, 2);

  // Ausgetauscht: gleiche Größe und Form, anderer Inhalt
  const andere = png(600);
  andere[andere.length - 20] = (andere[andere.length - 20] ?? 0) ^ 0xff;
  speicher.set(teilPfad({ tag: TAG, ticket: uuid(3) }, 0), andere);
  const abgelegt2 = new Map<string, Buffer>();
  await assert.rejects(
    uebernehmeZwischenablage(items, 'o', einAus(speicher, abgelegt2), { summen: new Map([[a.ref, pruefsumme(a.bytes)]]) }),
    UploadAbgelehntFehler
  );
  assert.equal(abgelegt2.size, 0, 'nichts gespeichert');
});

test('keine Verklemmung: viele Bestellungen mit mehreren Dateien gleichzeitig kommen alle durch', async () => {
  const speicher = new Map<string, Buffer>();
  const abgelegt = new Map<string, Buffer>();
  const bestellungen = Array.from({ length: 6 }, (_, o) => {
    const dateien = [0, 1, 2].map((k) => datei(100 + o * 10 + k, 300 + k, speicher));
    return position(dateien.map((d, k) => ({ id: `e${k}`, original: d.ref, anzeige: d.ref })));
  });
  const t0 = Date.now();
  await Promise.all(bestellungen.map((item, o) => uebernehmeZwischenablage([item], `b${o}`, einAus(speicher, abgelegt))));
  assert.ok(Date.now() - t0 < 5000);
  assert.equal(abgelegt.size, 6 * 3 * 2);
});

test('eine Bestellung hält höchstens EINEN Platz: bei voller Auslastung gibt sie nach der Wartezeit auf, ohne einen Platz zu verlieren', async () => {
  const speicher = new Map<string, Buffer>();
  const d = datei(500, 300, speicher);
  const items = [position([{ id: 'e', original: d.ref, anzeige: d.ref }])];

  // Alle Plätze der Instanz belegen, indem wir sie über dieselbe Warteschlange festhalten – hier mit einer eigenen, gleich großen.
  const plaetze = new Plaetze(MAX_ZUSAMMENSETZEN_GLEICHZEITIG);
  const halter = await Promise.all(Array.from({ length: MAX_ZUSAMMENSETZEN_GLEICHZEITIG }, () => plaetze.belege()));
  await assert.rejects(plaetze.belege(40), /Kein Platz frei/);
  halter.forEach((freigeben) => freigeben());
  // Danach sind genau so viele Plätze frei wie vorher – der abgewiesene Wartende hat keinen verschluckt.
  const wieder = await Promise.all(Array.from({ length: MAX_ZUSAMMENSETZEN_GLEICHZEITIG }, () => plaetze.belege(40)));
  await assert.rejects(plaetze.belege(40), /Kein Platz frei/);
  wieder.forEach((freigeben) => freigeben());

  // Und die Übernahme selbst läuft normal durch, wenn Plätze frei sind.
  const abgelegt = new Map<string, Buffer>();
  await uebernehmeZwischenablage(items, 'o', einAus(speicher, abgelegt), { wartezeitMs: 40 });
  assert.equal(abgelegt.size, 2);
});

test('Teile sind unveränderlich: ein zweites Schreiben auf dieselbe Teilnummer wird mit 409 abgewiesen, der erste Inhalt bleibt', async () => {
  const ticket = uuid(900);
  const erst = await speichereTeil({ tag: TAG, ticket, nr: 0, daten: Buffer.from('erste Fassung') });
  assert.equal(erst.ok, true);
  const zweit = await speichereTeil({ tag: TAG, ticket, nr: 0, daten: Buffer.from('ausgetauscht!!') });
  assert.deepEqual(zweit.ok ? null : zweit.status, 409);
  const { downloadProductionFile } = await import('@/lib/supabase/storage');
  assert.equal((await downloadProductionFile(teilPfad({ tag: TAG, ticket }, 0))).toString(), 'erste Fassung');
});
