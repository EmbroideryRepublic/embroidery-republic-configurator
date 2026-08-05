/**
 * WÄCHTER für das zentrale PRODUCT_TYPES-Register (ADR 0002 §1).
 *
 * `ProductType` ist seit M3.3 eine OFFENE ID (analog PrintView) – die
 * Compiler-Vollständigkeit über `Record<ProductType, …>` entfällt. Diese Tests
 * übernehmen ihre Rolle und sichern zusätzlich Invarianten, die der Typ nie
 * ausdrückte. Grundsatz: lieber ein Test zu viel als eine stille Regression,
 * denn eine unregistrierte Art fiele lautlos aus Navigation, Kacheln,
 * Cross-Selling und Größenlogik.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_ORDER,
  ALLE_PRODUCT_TYPES,
  produktTypLabel,
  produktTypLabelPlural,
} from '@/config/products/productTypes';
import { istGueltigeView } from '@/config/decorationPositions';

const EINTRAEGE = Object.entries(PRODUCT_TYPES);

test('das Register ist nicht leer', () => {
  assert.ok(EINTRAEGE.length > 0, 'PRODUCT_TYPES darf nicht leer sein');
});

test('ALLE_PRODUCT_TYPES entspricht exakt den Registerschlüsseln', () => {
  assert.deepEqual([...ALLE_PRODUCT_TYPES].sort(), Object.keys(PRODUCT_TYPES).sort());
});

test('jede Produktart trägt vollständige, nichtleere Registerfelder', () => {
  for (const [id, def] of EINTRAEGE) {
    assert.ok(def.labelSingular.trim(), `${id}: labelSingular fehlt`);
    assert.ok(def.labelPlural.trim(), `${id}: labelPlural fehlt`);
    assert.ok(Number.isFinite(def.order), `${id}: order ist keine Zahl`);
    assert.ok(def.naviAchse.trim(), `${id}: naviAchse fehlt`);
    assert.ok(def.groessenLeiter.trim(), `${id}: groessenLeiter fehlt`);
    assert.ok(def.kachelText.trim(), `${id}: kachelText fehlt`);
    assert.ok(Array.isArray(def.komplement), `${id}: komplement ist kein Array`);
    assert.ok(Array.isArray(def.kachelFarbe), `${id}: kachelFarbe ist kein Array`);
  }
});

test('order-Werte sind eindeutig', () => {
  const orders = EINTRAEGE.map(([, def]) => def.order);
  assert.equal(new Set(orders).size, orders.length, `doppelte order-Werte: ${orders.join(', ')}`);
});

test('primaryView jeder Art ist eine registrierte View', () => {
  for (const [id, def] of EINTRAEGE) {
    assert.ok(istGueltigeView(def.primaryView), `${id}: primaryView "${def.primaryView}" fehlt in der View-Registry`);
  }
});

test('PRODUCT_TYPE_ORDER ist nach order sortiert und deckt alle Arten ab', () => {
  assert.equal(PRODUCT_TYPE_ORDER.length, EINTRAEGE.length);
  const erwartet = [...EINTRAEGE].sort(([, a], [, b]) => a.order - b.order).map(([id]) => id);
  assert.deepEqual([...PRODUCT_TYPE_ORDER], erwartet);
});

test('komplement verweist nur auf registrierte Produktarten', () => {
  const bekannt = new Set<string>(ALLE_PRODUCT_TYPES);
  const fehler: string[] = [];
  for (const [id, def] of EINTRAEGE) {
    for (const k of def.komplement) {
      if (!bekannt.has(k)) fehler.push(`${id} → "${k}"`);
    }
  }
  assert.deepEqual(fehler, [], 'komplement zeigt auf nicht registrierte Arten');
});

test('höchstens eine Art trägt die Bühne (hero) – und dann mit Bild', () => {
  const heroes = EINTRAEGE.filter(([, def]) => def.hero);
  assert.ok(heroes.length <= 1, `mehr als eine hero-Art: ${heroes.map(([id]) => id).join(', ')}`);
  for (const [id, def] of heroes) {
    assert.ok(def.heroBild?.trim(), `${id}: hero ohne heroBild`);
  }
});

// ── Ersatz der Compiler-Vollständigkeit: jede real genutzte Art ist registriert ──

test('jedes Katalogprodukt trägt eine registrierte Produktart', () => {
  const bekannt = new Set<string>(ALLE_PRODUCT_TYPES);
  const fehlend = PRODUCTS.filter((p) => !bekannt.has(p.productType)).map((p) => `${p.id} → "${p.productType}"`);
  assert.deepEqual(fehlend, [], 'Produkte mit nicht registrierter Produktart (fielen still aus Navigation/Kacheln/Cross-Selling)');
});

// ── Label-Resolver (einzige Auflösungsstelle, ersetzt PRODUCT_TYPE_LABELS) ──

test('produktTypLabel liefert den Einzahl-Namen registrierter Arten', () => {
  for (const [id, def] of EINTRAEGE) {
    assert.equal(produktTypLabel(id), def.labelSingular);
  }
});

test('produktTypLabel fällt für unbekannte Arten defensiv auf die ID zurück', () => {
  assert.equal(produktTypLabel('gibt-es-nicht'), 'gibt-es-nicht');
});

test('produktTypLabelPlural liefert die Mehrzahl und korrigiert das naive Plural', () => {
  for (const [id, def] of EINTRAEGE) {
    assert.equal(produktTypLabelPlural(id), def.labelPlural);
  }
  // Belegt die Korrektur gegenüber dem früheren naiven '{Label}s':
  assert.equal(produktTypLabelPlural('jacket'), 'Jacken', 'nicht „Jackes"');
  assert.equal(produktTypLabelPlural('vest'), 'Westen', 'nicht „Westes"');
  assert.equal(produktTypLabelPlural('sweater'), 'Sweater', 'nicht „Sweaters"');
});

test('produktTypLabelPlural fällt für unbekannte Arten auf die ID zurück', () => {
  assert.equal(produktTypLabelPlural('gibt-es-nicht'), 'gibt-es-nicht');
});
