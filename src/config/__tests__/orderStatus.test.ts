/**
 * Absicherung der Bestell-Zustandsmaschine.
 *
 * Zwei Fehler wären hier teuer: Eine stornierte Bestellung ginge wieder in
 * Produktion (Ware wird umsonst beschafft), oder eine Bestellung
 * übersprünge die Produktion und gälte als versendet, ohne dass jemand sie
 * angefasst hat.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ERLAUBTE_UEBERGAENGE,
  STATUS_KUNDENTEXT,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
  fortschrittIndex,
  istEndzustand,
  istUebergangErlaubt,
} from '../orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

const ALLE: OrderStatus[] = ['new', 'in_production', 'shipped', 'completed', 'cancelled'];

test('der reguläre Ablauf ist vollständig begehbar', () => {
  assert.ok(istUebergangErlaubt('new', 'in_production'));
  assert.ok(istUebergangErlaubt('in_production', 'shipped'));
  assert.ok(istUebergangErlaubt('shipped', 'completed'));
});

test('Schritte dürfen NICHT übersprungen werden', () => {
  assert.equal(istUebergangErlaubt('new', 'shipped'), false);
  assert.equal(istUebergangErlaubt('new', 'completed'), false);
  assert.equal(istUebergangErlaubt('in_production', 'completed'), false);
});

test('aus einer stornierten Bestellung führt kein Weg zurück', () => {
  for (const ziel of ALLE) {
    assert.equal(istUebergangErlaubt('cancelled', ziel), false, `cancelled → ${ziel} muss gesperrt sein`);
  }
});

test('eine abgeschlossene Bestellung ist ebenfalls endgültig', () => {
  for (const ziel of ALLE) {
    assert.equal(istUebergangErlaubt('completed', ziel), false, `completed → ${ziel} muss gesperrt sein`);
  }
});

test('storniert werden kann aus jedem laufenden Zustand', () => {
  assert.ok(istUebergangErlaubt('new', 'cancelled'));
  assert.ok(istUebergangErlaubt('in_production', 'cancelled'));
  assert.ok(istUebergangErlaubt('shipped', 'cancelled'));
});

test('kein Zustand führt auf sich selbst', () => {
  for (const s of ALLE) {
    assert.equal(istUebergangErlaubt(s, s), false, `${s} → ${s} wäre eine Schleife`);
  }
});

test('Endzustände sind genau completed und cancelled', () => {
  assert.deepEqual(ALLE.filter(istEndzustand).sort(), ['cancelled', 'completed']);
});

test('jeder Zustand hat Label und Kundentext', () => {
  for (const s of ALLE) {
    assert.ok(STATUS_LABELS[s]?.trim(), `${s}: kein Label`);
    assert.ok(STATUS_KUNDENTEXT[s]?.trim(), `${s}: kein Kundentext`);
  }
});

test('die Anzeigereihenfolge deckt den Ablauf ohne cancelled ab', () => {
  assert.deepEqual([...STATUS_REIHENFOLGE], ['new', 'in_production', 'shipped', 'completed']);
  assert.equal(fortschrittIndex('cancelled'), -1, 'cancelled liegt außerhalb der Kette');
});

test('der Fortschritt wächst entlang des Ablaufs', () => {
  assert.ok(fortschrittIndex('new') < fortschrittIndex('in_production'));
  assert.ok(fortschrittIndex('in_production') < fortschrittIndex('shipped'));
  assert.ok(fortschrittIndex('shipped') < fortschrittIndex('completed'));
});

test('jeder Zielzustand ist auch als Schlüssel definiert', () => {
  // Schützt davor, dass ein neuer Status in den Übergängen auftaucht, aber
  // keine eigenen Regeln, Labels oder Texte bekommt.
  for (const ziele of Object.values(ERLAUBTE_UEBERGAENGE)) {
    for (const z of ziele) {
      assert.ok(ERLAUBTE_UEBERGAENGE[z] !== undefined, `${z} fehlt als Schlüssel`);
      assert.ok(STATUS_LABELS[z], `${z} fehlt in STATUS_LABELS`);
    }
  }
});
