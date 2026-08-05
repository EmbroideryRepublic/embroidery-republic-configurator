/**
 * WÄCHTER für die offene View-ID + zentrale View-Registry.
 *
 * Seit ADR 0001 ist `PrintView` eine offene ID; die Compiler-Vollständigkeits-
 * prüfung entfällt. Diese Tests übernehmen ihre Rolle: Sie verhindern, dass
 * ungültige Ansichten oder inkonsistente Produktkonfigurationen unbemerkt ins
 * System gelangen. Siehe docs/adr/0001-generische-druckansichten.md.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import {
  DECORATION_POSITIONS,
  istGueltigeView,
  viewDef,
} from '@/config/decorationPositions';
import { ansichtenVon } from '@/lib/products/ansichten';
import { getPrintAreas } from '@/config/printAreas';
import { bildFuerAnsicht } from '@/lib/assets';
import { getPricingRules } from '@/config/pricingRules';

// ── Registry-Integrität ────────────────────────────────────────────────

test('Registry: id stimmt mit dem Schlüssel überein', () => {
  for (const [key, def] of Object.entries(DECORATION_POSITIONS)) {
    assert.equal(def.id, key, `Registry-Eintrag "${key}" hat abweichende id "${def.id}"`);
  }
});

test('Registry: order-Werte sind eindeutig', () => {
  const orders = Object.values(DECORATION_POSITIONS).map((d) => d.order);
  assert.equal(new Set(orders).size, orders.length, `doppelte order-Werte: ${orders.join(', ')}`);
});

test('Registry: jede View trägt Label und Übersetzungsschlüssel', () => {
  for (const def of Object.values(DECORATION_POSITIONS)) {
    assert.ok(def.label.trim(), `${def.id}: kein Label`);
    assert.ok(def.translationKey, `${def.id}: kein translationKey`);
  }
});

test('Registry: gespiegeltVon verweist auf eine existierende View', () => {
  for (const def of Object.values(DECORATION_POSITIONS)) {
    if (def.gespiegeltVon) {
      assert.ok(istGueltigeView(def.gespiegeltVon), `${def.id}: gespiegeltVon "${def.gespiegeltVon}" fehlt in der Registry`);
    }
  }
});

test('Registry: gesetzter seamMarginCm ist positiv', () => {
  // seamMarginCm wird aktiv konsumiert (seamMarginCmVon -> printAreas ->
  // ConfiguratorCanvas). Ein 0/negativer Wert verschöbe real den Nahtabstand.
  // (prozessgrenze wird hier bewusst NICHT geprüft: kein Konsument, keine
  // Position setzt es – der Guard gehört an den M4-Generator.)
  for (const def of Object.values(DECORATION_POSITIONS)) {
    if (def.seamMarginCm !== undefined) {
      assert.ok(def.seamMarginCm > 0, `${def.id}: seamMarginCm muss > 0 sein (ist ${def.seamMarginCm})`);
    }
  }
});

// ── Produkt-Ansichten (einzige Quelle: ansichtenVon) ───────────────────

test('jedes Produkt löst zu mindestens einer Ansicht auf', () => {
  const ohne = PRODUCTS.filter((p) => ansichtenVon(p).length === 0).map((p) => p.id);
  assert.deepEqual(ohne, [], 'Produkte ohne auflösbare Ansichten (keine views + keine Druckflächen)');
});

test('jede explizit deklarierte product.views existiert in der Registry', () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    for (const v of p.views ?? []) {
      if (!istGueltigeView(v)) fehler.push(`${p.id} → "${v}"`);
    }
  }
  assert.deepEqual(fehler, [], 'Produkte deklarieren nicht registrierte View-IDs');
});

test('jede geführte Ansicht existiert in der Registry UND hat einen Druckbereich', async () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    const flaechen = new Set((await getPrintAreas(p.id, 'dtf')).map((a) => a.view));
    for (const v of ansichtenVon(p)) {
      if (!istGueltigeView(v)) fehler.push(`${p.id}/${v}: nicht in Registry`);
      else if (!flaechen.has(v)) fehler.push(`${p.id}/${v}: keine Druckfläche`);
    }
  }
  assert.deepEqual(fehler, [], 'geführte Ansichten ohne Registry-Eintrag/Druckfläche');
});

test('jede Produktfarbe liefert ein Bild für jede geführte Ansicht', () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    const views = ansichtenVon(p);
    for (const c of p.colors) {
      for (const v of views) {
        if (!bildFuerAnsicht(p.id, c.id, v)) fehler.push(`${p.id}/${c.id}/${v}`);
      }
    }
  }
  assert.deepEqual(fehler.slice(0, 20), [], 'Farben ohne Bild für eine geführte Ansicht');
});

// ── Preisregeln ────────────────────────────────────────────────────────

test('PricingRule.printView ist, falls gesetzt, eine gültige View', async () => {
  const fehler: string[] = [];
  for (const method of ['dtf', 'embroidery'] as const) {
    for (const rule of await getPricingRules(method)) {
      if (rule.printView && !istGueltigeView(rule.printView)) {
        fehler.push(`${method}/${rule.id} → "${rule.printView}"`);
      }
    }
  }
  assert.deepEqual(fehler, [], 'Preisregeln mit ungültiger printView');
});

// ── Defensive Accessoren ───────────────────────────────────────────────

test('viewDef liefert undefined für unbekannte Views (kein Crash)', () => {
  assert.equal(viewDef('gibt-es-nicht'), undefined);
  assert.equal(istGueltigeView('gibt-es-nicht'), false);
  assert.ok(viewDef('front'));
});
