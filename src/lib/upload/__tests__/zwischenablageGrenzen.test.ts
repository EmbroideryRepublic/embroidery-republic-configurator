/**
 * Zwischenablage: Schutz vor Blockade und Speicherspitzen – begrenzte Warteschlange, Zeitlimit je Teil, Budget je Bestellung.
 * (Befunde der Sicherheitsprüfung nach dem Push vom 2026-11-20.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_TEILE, MAX_ZUSAMMENSETZEN_GLEICHZEITIG, MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG, TEIL_MAX_BYTES } from '@/config/upload';
import { baueRef, tagVon } from '../zwischenablageRef';
import { Plaetze, loeseZwischenablageAuf, pruefeZwischenablageVerweise } from '../zwischenablage';
import type { CartItem, ConfigElement } from '@/types';

const TAG = tagVon();
const ticket = (n: number) => `3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f${String(n).padStart(4, '0')}`;
const warte = (ms: number) => new Promise((weiter) => setTimeout(weiter, ms));

test('Plaetze: höchstens so viele Aufgaben gleichzeitig, die übrigen kommen der Reihe nach dran', async () => {
  const plaetze = new Plaetze(2);
  let aktiv = 0;
  let spitze = 0;
  const reihenfolge: number[] = [];
  const aufgabe = (n: number) =>
    plaetze.fuehreAus(async () => {
      aktiv++;
      spitze = Math.max(spitze, aktiv);
      reihenfolge.push(n);
      await warte(20);
      aktiv--;
      return n;
    });
  const ergebnisse = await Promise.all([1, 2, 3, 4, 5].map(aufgabe));
  assert.deepEqual(ergebnisse, [1, 2, 3, 4, 5]);
  assert.equal(spitze, 2, 'nie mehr als zwei gleichzeitig');
  assert.deepEqual(reihenfolge, [1, 2, 3, 4, 5], 'Reihenfolge der Anmeldung bleibt erhalten');
});

test('Plaetze: ein Fehler gibt den Platz wieder frei', async () => {
  const plaetze = new Plaetze(1);
  await assert.rejects(plaetze.fuehreAus(async () => Promise.reject(new Error('kaputt'))), /kaputt/);
  assert.equal(await plaetze.fuehreAus(async () => 'weiter'), 'weiter');
});

test('die Konfiguration lässt gleichzeitiges Zusammensetzen zu, aber begrenzt', () => {
  assert.ok(MAX_ZUSAMMENSETZEN_GLEICHZEITIG >= 1 && MAX_ZUSAMMENSETZEN_GLEICHZEITIG <= 4);
});

test('eine hängende Verbindung wird nach dem Zeitlimit abgebrochen, statt ewig zu warten', async () => {
  const ref = baueRef({ tag: TAG, ticket: ticket(1), teile: 1, bytes: 100 });
  const haengt = { lade: () => new Promise<Buffer>(() => undefined) };
  const t0 = Date.now();
  const r = await loeseZwischenablageAuf(ref, haengt, { timeoutMs: 60 });
  assert.equal(r.ok ? 'ok' : r.grund, 'zwischenablage_unvollstaendig');
  assert.ok(Date.now() - t0 < 1500, 'kam rechtzeitig zurück');
  assert.match(r.ok ? '' : r.protokoll, /Zeitüberschreitung/);
});

test('hängende Aufgaben blockieren andere Bestellungen nicht dauerhaft: nach dem Zeitlimit kommen die nächsten dran', async () => {
  const haengt = { lade: () => new Promise<Buffer>(() => undefined) };
  const viele = Array.from({ length: MAX_ZUSAMMENSETZEN_GLEICHZEITIG + 1 }, (_, i) =>
    loeseZwischenablageAuf(baueRef({ tag: TAG, ticket: ticket(10 + i), teile: 1, bytes: 100 }), haengt, { timeoutMs: 80 })
  );
  const t0 = Date.now();
  const alle = await Promise.all(viele);
  assert.ok(alle.every((r) => !r.ok));
  assert.ok(Date.now() - t0 < 2000, 'auch die wartende Aufgabe wurde bedient');
});

// ── Budget je Bestellung ─────────────────────────────────────────────

function position(refs: string[]): CartItem {
  return {
    id: 'i', printMethod: 'dtf', productId: 'p', colorId: 'c', sizeQuantities: { M: 1 }, quantity: 1, unitPrice: 0, totalPrice: 0, addedAt: 0,
    elements: refs.map((ref, i) => ({ id: `e${i}`, type: 'logo', view: 'front', xCm: 0, yCm: 0, widthCm: 5, heightCm: 5, fileUrl: ref, originalFileUrl: ref }) as unknown as ConfigElement),
  } as CartItem;
}

test('das Budget je Bestellung liegt bei höchstens 100 MB: zwei 45-MB-Dateien gehen, drei nicht', () => {
  assert.equal(MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG, 100 * 1024 * 1024);
  const gross = (n: number) => baueRef({ tag: TAG, ticket: ticket(100 + n), teile: MAX_TEILE, bytes: 45 * 1024 * 1024 });
  assert.equal(pruefeZwischenablageVerweise([position([gross(1), gross(2)])]), null, '90 MB');
  assert.ok(pruefeZwischenablageVerweise([position([gross(1), gross(2), gross(3)])]), '135 MB');
});

test('dieselbe Datei als Original und Anzeigebild zählt im Budget nur einmal', () => {
  const eine = baueRef({ tag: TAG, ticket: ticket(200), teile: MAX_TEILE, bytes: 45 * 1024 * 1024 });
  assert.equal(pruefeZwischenablageVerweise([position([eine])]), null);
  assert.ok(TEIL_MAX_BYTES * MAX_TEILE >= 45 * 1024 * 1024);
});
