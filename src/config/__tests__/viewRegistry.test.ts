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
import { ansichtenVon, sichtbareAnsichten } from '@/lib/products/ansichten';
import { getPrintAreas } from '@/config/printAreas';
import { bildFuerAnsicht, assetVerfuegbarkeit } from '@/lib/assets';
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

test('jede geführte Ansicht ist registriert; jede ZEIGBARE hat einen Druckbereich', async () => {
  // Registry-Zugehörigkeit gilt für alle geführten Ansichten (fachliche
  // Deklaration). Eine Druckfläche kann dagegen nur entstehen, wo ein Bild
  // existiert – Ärmel sind nicht überall fotografiert. Maßgeblich ist deshalb
  // sichtbareAnsichten(): genau was der Kunde zu sehen bekommt, muss auch eine
  // Fläche haben. (Vorher erzwang der Test eine Fläche für JEDE deklarierte
  // Ansicht; erfüllbar war das nur durch das Vorderbild-Alias im Manifest.)
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    const flaechen = new Set((await getPrintAreas(p.id, 'dtf')).map((a) => a.view));
    for (const v of ansichtenVon(p)) {
      if (!istGueltigeView(v)) fehler.push(`${p.id}/${v}: nicht in Registry`);
    }
    for (const c of p.colors) {
      for (const v of sichtbareAnsichten(p, c.id)) {
        if (!flaechen.has(v)) fehler.push(`${p.id}/${c.id}/${v}: keine Druckfläche`);
      }
    }
  }
  assert.deepEqual(fehler.slice(0, 20), [], 'Ansichten ohne Registry-Eintrag/Druckfläche');
});

/**
 * Früher wurde hier verlangt, dass JEDE geführte Ansicht ein Bild liefert. Diese
 * Regel war der Grund für das Front-Alias im Manifest: fehlte ein Ärmel- oder
 * Rückbild, wurde einfach das Vorderbild eingesetzt – im Konfigurator sichtbar
 * falsch. Maßgeblich ist jetzt `sichtbareAnsichten()`: gezeigt wird nur, wofür es
 * auch ein Bild gibt. Genau das sichert dieser Test ab.
 */
test('jede zeigbare Ansicht liefert auch wirklich ein Bild', () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      for (const v of sichtbareAnsichten(p, c.id)) {
        if (!bildFuerAnsicht(p.id, c.id, v)) fehler.push(`${p.id}/${c.id}/${v}`);
      }
    }
  }
  assert.deepEqual(fehler.slice(0, 20), [], 'zeigbare Ansicht ohne Bild');
});

test('jede Farbe mit Fotos zeigt mindestens Vorder- und Rückansicht', () => {
  const fehler: string[] = [];
  for (const p of PRODUCTS) {
    for (const c of p.colors) {
      if (assetVerfuegbarkeit(p.id, c.id) !== 'vorhanden') continue;
      const sichtbar = sichtbareAnsichten(p, c.id);
      for (const pflicht of ['front', 'back'] as const) {
        if (ansichtenVon(p).includes(pflicht) && !sichtbar.includes(pflicht)) {
          fehler.push(`${p.id}/${c.id}: ${pflicht} fehlt`);
        }
      }
    }
  }
  assert.deepEqual(fehler.slice(0, 20), [], 'Pflichtansicht fehlt');
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
